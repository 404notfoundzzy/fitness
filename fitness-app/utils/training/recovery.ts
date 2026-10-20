// 肌肉疲劳/恢复/力量保持模型（Fatigue, recovery & retained strength）
//
// 移植自 openGym（AGPL-3.0）frontend/src/lib/recovery.js，上游 commit e348fc1。
// 上游依赖本地化：EXIDX→条目内联元数据（muscles.ts 的 metadataOf 处理快照）、
// isAssisted→entry.assisted 标记、dropsOf→set.drops 数组。
//
// 核心思想：疲劳刺激以"有效困难组"计而非吨位——增肌的剂量反应贴近力竭的组
// （约 5-30 次），而吨位会过度加权大重量复合动作。一次完整训练（约 8 个困难组）
// 记 1.0 原始单位；次要肌肉按 musclesOf 权重 0.4 计入。

import {
  workoutAt, isWarmupRow, isSideSet,
  type EntryLike, type WorkoutLike, type SetLike, type ProfileLike,
} from './model'
import { MUSCLES, musclesOf } from './muscles'
import { estimate1RM, REP_CAP } from './onerm'
import { rirOf, HARD_RIR } from './effort'

/** 每 1.0 疲劳单位对应的有效组数（单次训练每肌肉的增长平台约 8 组） */
export const FATIGUE_SETS_PER_UNIT = 8
/** 单次训练每肌肉刺激上限：超过 10-12 组增长反应平台化，垃圾容量不得线性延长红尾 */
export const FATIGUE_MAX_SETS_PER_SESSION = 12
/** 刺激扫描的计算边界而非语义悬崖：30 天后即使 24h 半衰期肌肉也只剩 1e-9 以下 */
export const FATIGUE_SCAN_MS = 30 * 24 * 60 * 60 * 1000
/** 容量锚点与慢性暴露回看得比刺激扫描更远：90 天滚动最佳仍知晓近期力量 */
export const FATIGUE_RIR_WINDOW_MS = 90 * 24 * 60 * 60 * 1000
/** 急性窗口：7 天 */
export const FATIGUE_ACUTE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
/** 慢性窗口：28 天（急性:慢性配对的慢性侧） */
export const FATIGUE_CHRONIC_WINDOW_MS = 28 * 24 * 60 * 60 * 1000
/** 远离力竭的组仍然在输送血液与练习动作：成本不低于一个困难组的此比例 */
export const FATIGUE_RIR_FLOOR_WEIGHT = 0.3
/** 急性:慢性增益钳制：加倍容量最多加倍计分刺激，减半最多减半 */
export const FATIGUE_RATIO_MIN = 0.5
export const FATIGUE_RATIO_MAX = 2
/** 慢性窗口内从未训练过的肌肉的先验周暴露：新手锚点 */
export const FATIGUE_NOVICE_WEEKLY_SETS = 4
/** 训练与档案均无体重时，自重动作假定的体重（kg） */
export const BODYWEIGHT_REF_LOAD = 75

// 每肌肉疲劳刺激的指数半衰期。下肢（绝对负荷更大、损伤更多）比上肢恢复慢：
// 10RM 可重复性数据显示深蹲 36h 仍低 6.6% 而卧推 3.0%，48-72h 均完全恢复。
// 小肌群/核心共用 24h 快车道。
const FATIGUE_HL_24H = 24 * 60 * 60 * 1000
const FATIGUE_HL_30H = 30 * 60 * 60 * 1000
const FATIGUE_HL_48H = 48 * 60 * 60 * 1000
const FATIGUE_HL_BY_MUSCLE: Record<string, number> = {
  trapezius: FATIGUE_HL_30H, deltoids: FATIGUE_HL_24H, chest: FATIGUE_HL_30H,
  'upper-back': FATIGUE_HL_30H, serratus: FATIGUE_HL_24H,
  biceps: FATIGUE_HL_24H, triceps: FATIGUE_HL_24H, forearm: FATIGUE_HL_24H,
  abs: FATIGUE_HL_24H, obliques: FATIGUE_HL_24H, 'lower-back': FATIGUE_HL_48H,
  gluteal: FATIGUE_HL_48H, quadriceps: FATIGUE_HL_48H, hamstring: FATIGUE_HL_48H,
  adductors: FATIGUE_HL_48H, 'hip-flexors': FATIGUE_HL_24H,
  calves: FATIGUE_HL_48H, tibialis: FATIGUE_HL_24H,
}

/** 一个肌肉的疲劳刺激指数半衰期 */
export function fatigueHalfLifeOf(slug: string): number {
  return FATIGUE_HL_BY_MUSCLE[slug] || FATIGUE_HL_30H
}

/** 训练后保留力量保持满值的期间 */
export const STRENGTH_FULL_MS = 1209600000

/** 满保留期之后，保留力量的指数半衰期 */
export const STRENGTH_HALF_LIFE_MS = 2419200000

/** 未训练或完全停训肌肉的保留力量下限 */
export const STRENGTH_FLOOR = 0.5

/**
 * 消费方疲劳桶的稳定标签：低于 0.25 为就绪，0.25（含）到 0.5 为恢复中，高于 0.5 为疲劳。
 */
export const FATIGUE_STATES = Object.freeze({
  READY: 'ready',
  RECOVERING: 'recovering',
  FATIGUED: 'fatigued',
})

/** 疲劳值的 UI 边界分档（上游 recovery-view.js 的 fatigueStateOf） */
export function fatigueStateOf(value: number): string {
  if (value > 0.5) return FATIGUE_STATES.FATIGUED
  if (value >= 0.25) return FATIGUE_STATES.RECOVERING
  return FATIGUE_STATES.READY
}

/**
 * 以半个半衰期为单位的指数衰减分数。
 * @param ageMs 刺激经过的毫秒数
 * @param halfLifeMs 一个半衰期的毫秒数
 */
export function halfLifeDecay(ageMs: number, halfLifeMs: number): number {
  return 0.5 ** (ageMs / halfLifeMs)
}

const emptyMuscleMap = (value: number): Record<string, number> =>
  Object.fromEntries(MUSCLES.map(slug => [slug, value]))

// 当前动作库元数据保持权威。已完成条目保留嵌套肌肉快照，使被删除的自定义动作
// 仍能贡献于恢复图。
const exerciseFor = (entry: EntryLike | null | undefined): EntryLike => entry || {}

/** 辅助器械动作的标记（上游由 exercises.js 的 isAssisted 按目录判定，此处用条目标记） */
const isAssisted = (entry: EntryLike | null | undefined): boolean =>
  !!(entry && entry.assisted)

/** 递减组的递减段（上游 workout-model.js 的 dropsOf） */
const dropsOf = (s: SetLike | null | undefined): unknown[] =>
  Array.isArray(s?.drops) ? (s.drops as unknown[]) : []

export const LB_TO_KG = 0.45359237

function numeric(value: unknown): number | null {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

// 单位标记在组、目标、条目或训练上；档案单位经 opts 传入。锚点跨会话比较负荷
// （混合单位导入会交替 kg/lb 行），故每个负荷先规范化到 kg。
function unitOf(...records: Array<Record<string, unknown> | null | undefined>): unknown {
  for (const record of records) {
    if (!record || typeof record !== 'object') continue
    for (const key of ['unit', 'u', 'weightUnit', 'weight_unit', 'loadUnit']) {
      if (record[key] !== undefined && record[key] !== null && String(record[key]).trim() !== '') return record[key]
    }
  }
  return 'kg'
}

function isPounds(unit: unknown): boolean {
  return /^(?:lb|lbs|pound|pounds)$/i.test(String(unit ?? '').trim())
}

function kgOf(value: unknown, unit: unknown): number {
  const n = numeric(value)
  if (n === null) return 0
  return Math.max(0, n) * (isPounds(unit) ? LB_TO_KG : 1)
}

// 训练上盖的体重是最佳历史值。旧记录没有时，用 Stats 提供的档案规范体重，
// 再退到稳定兜底。
function bodyweightKgFor(workout: WorkoutLike, opts: Record<string, unknown> = {}, stampedLoadUnit?: unknown): number {
  const stamped = numeric(workout?.bw) ?? numeric(workout?.bodyweight)
  if (stamped !== null) {
    return kgOf(stamped, unitOf(
      { unit: workout?.bwUnit as string },
      { unit: workout?.bodyweightUnit as string },
      workout,
      stampedLoadUnit && { unit: stampedLoadUnit as string },
      opts,
    ))
  }
  const canonical = numeric(opts.bodyweightKg)
  if (canonical !== null) return Math.max(0, canonical)
  const display = numeric(opts.bodyweight)
  if (display !== null) return kgOf(display, (opts.bodyweightUnit || opts.unit || opts.profileUnit) as string)
  return BODYWEIGHT_REF_LOAD
}

function bodyweightTarget(entry: EntryLike | null | undefined): boolean | null {
  const target = entry?.target as Record<string, unknown> | null | undefined
  if (target && Object.prototype.hasOwnProperty.call(target, 'bodyweight')) return !!target.bodyweight
  if (entry && Object.prototype.hasOwnProperty.call(entry, 'bodyweight')) return !!entry.bodyweight
  return null
}

function hasUnitStamp(...records: Array<Record<string, unknown> | null | undefined>): boolean {
  return records.some(record => record && typeof record === 'object'
    && ['unit', 'u', 'weightUnit', 'weight_unit', 'loadUnit'].some(key => Object.prototype.hasOwnProperty.call(record, key)
      && record[key] !== undefined && record[key] !== null && String(record[key]).trim() !== ''))
}

function bodyweightConfigured(ex: EntryLike, entry: EntryLike | null | undefined, set: SetLike | null | undefined, workout: WorkoutLike, opts: Record<string, unknown> = {}): boolean {
  const configured = bodyweightTarget(entry)
  if (configured !== null) return configured
  // target.bodyweight 持久化之前，自重动作上的正 w 已是显式输入的负荷。
  const added = kgOf(set?.w, unitOf(set, entry?.target as Record<string, unknown>, entry, workout, opts))
  const hasBodyweightContext = numeric(workout?.bw) !== null
    || numeric(workout?.bodyweight) !== null
    || numeric(opts.bodyweightKg) !== null
    || numeric(opts.bodyweight) !== null
    || hasUnitStamp(set, entry?.target as Record<string, unknown>, entry, workout)
  return ex?.eq === 'body weight' && (added === 0 || hasBodyweightContext)
}

// 一行实际移动的负荷（kg）：其自身 w 从最近的单位标记规范化，加上自重动作的体重。
// row 是组本身、单侧组的一侧、或一个递减段；是否计体重由父组决定。
function loadKgFor(ex: EntryLike, entry: EntryLike | null | undefined, set: SetLike | null | undefined, workout: WorkoutLike, opts: Record<string, unknown> = {}, row: SetLike | null | undefined = set): number {
  const rowUnit = unitOf(row, set, entry?.target as Record<string, unknown>, entry, workout, opts)
  const addedKg = kgOf(row?.w, rowUnit)
  const loadUnit = hasUnitStamp(row, set, entry?.target as Record<string, unknown>, entry) ? rowUnit : undefined
  return bodyweightConfigured(ex, entry, set, workout, opts)
    ? bodyweightKgFor(workout, opts, loadUnit) + addedKg
    : addedKg
}

/**
 * 一个接近力竭读数值多少个困难组。记录的努力度（rir/rpe）永远优先；
 * 否则按该动作 90 天滚动最佳估计 RIR。力竭附近记满，远离不低于下限：
 * 轻松训练仍然在输送血液。
 */
export function rirWeightFor(rir: number | null): number {
  if (rir == null) return 1
  if (rir <= HARD_RIR) return 1
  if (rir >= 6) return FATIGUE_RIR_FLOOR_WEIGHT
  return 1 - (1 - FATIGUE_RIR_FLOOR_WEIGHT) * (rir - HARD_RIR) / (6 - HARD_RIR)
}

/**
 * 从容量锚点估计一组 RIR（Epley 逆，均为 kg 使混合单位历史正确锚定）。
 * 锚点是该动作近期最佳 1RM 估计，故对 110 上限的 80x8 读作约 RIR 3。
 * 无法诚实回答时返回 null：无锚点、无负荷、无次数、或超过次数上限。
 */
export function estimateSetRir(set: { w?: unknown; r?: unknown; unit?: unknown } | null | undefined, anchorKg: number | null, unit?: unknown): { rir: number; source: 'estimated' } | null {
  const w = numeric(set?.w)
  const r = numeric(set?.r)
  if (!(anchorKg as number > 0) || !(w as number > 0) || !((r as number) >= 1) || (r as number) > REP_CAP) return null
  const wKg = kgOf(w, unit ?? set?.unit)
  if (!(wKg > 0)) return null
  const maxReps = 30 * ((anchorKg as number) / wKg - 1)
  const rir = Math.min(10, Math.max(0, maxReps - (r as number)))
  return { rir, source: 'estimated' }
}

// 一次训练每肌肉的刺激，以质量加权有效组计。每个已完成组都计数（热身组也计：
// 机械功就是机械功，但标记为热身且无记录努力度的行按定义远离力竭，即使还没有
// 锚点可估计，也记下限权重）；递减段计为额外组；暂停休息的 clusters 不额外计，
// 因为该行自身已合计每次爆发。有氧/计时行也计组。每组乘以其 RIR 权重。
function sessionEffSets(workout: WorkoutLike, anchors: Map<string, number> | undefined, opts: Record<string, unknown> = {}): Record<string, number> {
  const sums = emptyMuscleMap(0)
  const score = (row: SetLike | null | undefined, set: SetLike | null | undefined, entry: EntryLike, weights: Record<string, number>, requireDone = true) => {
    if (requireDone && row?.done !== true) return
    const resolved = resolveSetRir(row, set, entry, workout, anchors, opts)
    const count = resolved?.source !== 'logged' && isWarmupRow(set)
      ? FATIGUE_RIR_FLOOR_WEIGHT
      : rirWeightFor(resolved?.rir ?? null)
    for (const [slug, weight] of Object.entries(weights)) {
      if (Object.prototype.hasOwnProperty.call(MUSCLES_BY_SLUG, slug)) sums[slug] += count * weight
    }
  }
  for (const entry of workout?.entries || []) {
    const ex = exerciseFor(entry)
    const weights = musclesOf(ex)
    for (const set of entry.sets || []) {
      score(set, set, entry, weights)
      // 递减段自带负荷对同一锚点——折扣的额外功，永不计两次。
      // 递减段无自身 done 标记：作为已完成组的一部分执行，无条件计数。
      if (set?.done === true) for (const drop of dropsOf(set)) score(drop as SetLike, set, entry, weights, false)
    }
  }
  for (const slug of MUSCLES) sums[slug] = Math.min(sums[slug], FATIGUE_MAX_SETS_PER_SESSION)
  return sums
}

// 一次训练中每动作的最佳 Epley 估计（kg，自重含体重）。刻意用 Epley 而非加权混合：
// RIR 估计反转同一公式，故设定锚点的组读作 RIR 0。辅助动作无 1RM，排除。
function sessionBests(workout: WorkoutLike, opts: Record<string, unknown> = {}): Map<string, number> {
  const best = new Map<string, number>()
  const consider = (ex: EntryLike, set: SetLike, entry: EntryLike, exId: string) => {
    if (set?.done !== true) return
    const sides = isSideSet(set) ? [set.sides!.L, set.sides!.R].filter(s => s?.done === true) : [set]
    for (const side of sides) {
      const est = estimate1RM(loadKgFor(ex, entry, set, workout, opts, side), numeric(side?.r))
      if (est !== null && (!best.has(exId) || est > best.get(exId)!)) best.set(exId, est)
    }
  }
  for (const entry of workout?.entries || []) {
    if (isAssisted(entry)) continue
    const ex = exerciseFor(entry)
    for (const set of entry.sets || []) consider(ex, set, entry, entry.id as string)
  }
  return best
}

/**
 * 每次训练的容量锚点：每动作 90 天滚动最佳 1RM 估计（kg），按训练对象为键。
 * 一次按时间顺序的遍历——更晚的训练从不渗入更早的锚点。同时驱动疲劳计分与
 * 努力度估计统计；无任何可估计组的未评级历史得空图（满额）。
 */
export function anchorsByWorkout(workouts: WorkoutLike[] | null | undefined, opts: Record<string, unknown> = {}): Map<WorkoutLike, Map<string, number>> {
  const ordered = (workouts || [])
    .map((workout, index) => ({ workout, index, timestamp: workoutAt(workout) }))
    .filter(item => Number.isFinite(item.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp || a.index - b.index)
  const bests = ordered.map(item => sessionBests(item.workout, opts))
  const out = new Map<WorkoutLike, Map<string, number>>()
  let lo = 0
  ordered.forEach((item, i) => {
    const anchors = new Map<string, number>()
    while (lo < i && ordered[lo].timestamp <= item.timestamp - FATIGUE_RIR_WINDOW_MS) lo += 1
    for (let j = lo; j <= i; j += 1) {
      if (ordered[j].timestamp <= item.timestamp - FATIGUE_RIR_WINDOW_MS) continue
      for (const [exId, est] of bests[j]) {
        if (!anchors.has(exId) || est > anchors.get(exId)!) anchors.set(exId, est)
      }
    }
    out.set(item.workout, anchors)
  })
  return out
}

/**
 * 一组 RIR 及其来源：记录的努力度优先，对该训练锚点的 Epley 逆估计次之，
 * 强度不可知时为 null。与疲劳计分同一优先级，统计与人体图永不对组争执。
 */
export function resolveSetRir(
  row: SetLike | null | undefined,
  set: SetLike | null | undefined,
  entry: EntryLike | null | undefined,
  workout: WorkoutLike,
  anchors: Map<string, number> | undefined,
  opts: Record<string, unknown> = {},
): { rir: number; source: 'logged' | 'estimated' } | null {
  const logged = rirOf(row)
  if (logged != null) return { rir: logged, source: 'logged' }
  const anchor = anchors?.get(entry?.id as string)
  if (!(anchor as number > 0)) return null
  const loadKg = loadKgFor(exerciseFor(entry), entry, set || row, workout, opts, row)
  return estimateSetRir({ w: loadKg, r: row?.r }, anchor, 'kg')
}

// 按训练顺序构建归一化刺激。每次训练以其自身质量加权组对固定整场单位计分，
// 乘以严格更早暴露留下的急性:慢性增益：使近期周率翻倍的训练最多记双倍，
// 减载至少减半，维持 reproduces 相位 1 值。刺激保持非负且每个窗口因果，
// 故休息从不增加疲劳。
function fatigueStimuli(workouts: WorkoutLike[] | null | undefined, current: number, opts: Record<string, unknown> = {}): Record<string, Array<{ slug: string; timestamp: number; stimulus: number }>> {
  const scanCutoff = current - FATIGUE_SCAN_MS
  // 池覆盖被计分训练可读的每个窗口：其锚点从自身时间戳回看 90 天，
  // 最老的被计分训练 30 天前，故池跨 120 天。
  const poolCutoff = current - (FATIGUE_SCAN_MS + FATIGUE_RIR_WINDOW_MS)
  const pool = (workouts || [])
    .map((workout, index) => ({ workout, index, timestamp: workoutAt(workout) }))
    .filter(item => Number.isFinite(item.timestamp) && item.timestamp > poolCutoff)
    .sort((a, b) => a.timestamp - b.timestamp || a.index - b.index)
  const scored = pool.filter(item => item.timestamp > scanCutoff)
  const byWorkout = anchorsByWorkout(pool.map(item => item.workout), opts)
  const effSets = pool.map(item => sessionEffSets(item.workout, byWorkout.get(item.workout), opts))
  const byMuscle: Record<string, Array<{ slug: string; timestamp: number; stimulus: number }>> =
    Object.fromEntries(MUSCLES.map(slug => [slug, []]))

  for (const item of scored) {
    const i = pool.indexOf(item)
    const acute = emptyMuscleMap(0)
    const chronic = emptyMuscleMap(0)
    for (let j = 0; j <= i; j += 1) {
      const age = item.timestamp - pool[j].timestamp
      if (age < 0 || age > FATIGUE_CHRONIC_WINDOW_MS) continue
      for (const slug of MUSCLES) {
        if (age <= FATIGUE_ACUTE_WINDOW_MS) acute[slug] += effSets[j][slug]
        chronic[slug] += effSets[j][slug]
      }
    }
    for (const slug of MUSCLES) {
      const stimulus = effSets[i][slug]
      if (!(stimulus > 0)) continue
      const gain = Math.min(
        FATIGUE_RATIO_MAX,
        Math.max(
          FATIGUE_RATIO_MIN,
          (acute[slug] + FATIGUE_NOVICE_WEEKLY_SETS) / (chronic[slug] / 4 + FATIGUE_NOVICE_WEEKLY_SETS),
        ),
      )
      byMuscle[slug].push({ slug, timestamp: item.timestamp, stimulus: stimulus / FATIGUE_SETS_PER_UNIT * gain })
    }
  }
  return byMuscle
}

const MUSCLES_BY_SLUG: Record<string, boolean> = Object.fromEntries(MUSCLES.map(slug => [slug, true]))

function fatigueValue(events: Array<{ slug: string; timestamp: number; stimulus: number }>, now: number, slug: string): number {
  if (!events.length) return 0
  const halfLife = fatigueHalfLifeOf(slug)
  events.sort((a, b) => a.timestamp - b.timestamp)

  let value = 0
  let lastTimestamp = events[0].timestamp
  for (const event of events) {
    value *= halfLifeDecay(event.timestamp - lastTimestamp, halfLife)
    value += event.stimulus
    lastTimestamp = event.timestamp
  }
  value *= halfLifeDecay(Math.max(0, now - lastTimestamp), halfLife)
  // 归一化累积刺激为饱和疲劳等级：更多组起步更高但永不封顶，值渐近消退——
  // 无窗口边缘悬崖。
  return 1 - Math.exp(-value)
}

/**
 * 从近期窗口内已完成组计算当前每肌肉疲劳。
 *
 * 刺激时间为 workoutAt：workout.start，回落将 workout.d 读作本地正午。
 * 结果始终包含每个可绘制肌肉 slug。
 *
 * @param workouts 带 start/d 与条目组数组的训练历史
 * @param now 当前毫秒时间戳；注入以保持确定性
 * @param options 未标记负荷的档案单位与自重动作的档案体重（kg）
 */
export function fatigueOf(workouts: WorkoutLike[] | null | undefined, now: number, opts: Record<string, unknown> = {}): Record<string, number> {
  const current = Number(now)
  const result = emptyMuscleMap(0)
  if (!Number.isFinite(current)) return result
  const byMuscle = fatigueStimuli(workouts, current, opts)
  for (const slug of MUSCLES) result[slug] = fatigueValue(byMuscle[slug], current, slug)
  return result
}

/**
 * 从全部历史中最近一次已完成刺激计算每肌肉保留力量。
 *
 * 无已完成组的肌肉从 0.5 下限起步。完成后力量 1.0 保持 14 天，之后以 28 天
 * 半衰期趋向下限。更晚完成的组成为新最近刺激并重置 14 天满保留期。
 */
export function strengthOf(workouts: WorkoutLike[] | null | undefined, now: number, _opts: Record<string, unknown> = {}): Record<string, number> {
  const current = Number(now)
  const latest: Record<string, number> = Object.fromEntries(MUSCLES.map(slug => [slug, -Infinity]))
  for (const workout of workouts || []) {
    const timestamp = workoutAt(workout)
    if (!Number.isFinite(timestamp)) continue
    for (const entry of workout.entries || []) {
      if (!(entry.sets || []).some(set => set?.done === true && !isWarmupRow(set))) continue
      for (const slug of Object.keys(musclesOf(exerciseFor(entry)))) {
        if (Object.prototype.hasOwnProperty.call(MUSCLES_BY_SLUG, slug) && timestamp > latest[slug]) {
          latest[slug] = timestamp
        }
      }
    }
  }

  const result = emptyMuscleMap(STRENGTH_FLOOR)
  if (!Number.isFinite(current)) return result
  for (const slug of MUSCLES) {
    const lastTimestamp = latest[slug]
    if (!Number.isFinite(lastTimestamp)) continue
    const age = current - lastTimestamp
    if (age <= STRENGTH_FULL_MS) {
      result[slug] = 1
    } else {
      result[slug] = Math.max(
        STRENGTH_FLOOR,
        halfLifeDecay(age - STRENGTH_FULL_MS, STRENGTH_HALF_LIFE_MS),
      )
    }
  }
  return result
}

/** 当前高于疲劳阈值的肌肉列表，按 MUSCLES 头到脚顺序 */
export function fatiguedMuscles(workouts: WorkoutLike[] | null | undefined, now: number, opts: Record<string, unknown> = {}): string[] {
  return Object.entries(fatigueOf(workouts, now, opts))
    .filter(([, value]) => value > 0.5)
    .map(([slug]) => slug)
}

/** 保留力量低于满保留的肌肉列表；从未训练的肌肉以 0.5 下限包含在内 */
export function detrainedMuscles(workouts: WorkoutLike[] | null | undefined, now: number, opts: Record<string, unknown> = {}): string[] {
  return Object.entries(strengthOf(workouts, now, opts))
    .filter(([, value]) => value < 1)
    .map(([slug]) => slug)
}
