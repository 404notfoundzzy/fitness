// 渐进建议引擎（Automatic progression）—— 核心部分
//
// 移植自 openGym（AGPL-3.0）frontend/src/lib/progression.js，上游 commit e348fc1。
// 上游依赖本地化：modeOf/isPyramid/entryExcluded/entryRoutineId 内联；
// normalizeRepRange/backoffAt/defaultIncrement 按上游同算法移植。
//
// 本文件包含：策略配置、减载、步长网格、会话判读（readSession）、
// 会话收集（sessionsFor）、停滞计数（stallCount）、三倍进阶组数、
// 计划快照（plannedOf/planChanged）、Epley 减载候选选择。
// 待移植（下一步）：nextPrescription / applyPrescription 各策略主体
// （依赖 history.js 的更多遍历，单独一个提交落地）。

import {
  isWarmupRow, isSideSet,
  type EntryLike, type SetLike, type WorkoutLike, type ProfileLike,
} from './model'

// ── 策略配置 ────────────────────────────────────────────────────────────────

export const POLICIES = ['off', 'linear', 'greyskull', 'double', 'triple', 'time']

/** 哪些策略能合理驱动哪种记录模式 */
export const POLICIES_FOR: Record<string, string[]> = {
  reps: ['off', 'linear', 'greyskull', 'double', 'triple'],
  time: ['off', 'time'],
  cardio: ['off'],
}

/** 策略中文名 */
export const POLICY_NAME: Record<string, string> = {
  off: '不自动渐进',
  linear: '线性渐进',
  greyskull: 'Greyskull LP',
  double: '双倍渐进',
  triple: '三倍渐进',
  time: '增加时间',
}
/** 策略中文说明 */
export const POLICY_DESC: Record<string, string> = {
  off: '目标保持你设定的值。',
  linear: '每组每次都完成全部次数则加重；连续失误触发减载。',
  greyskull: '前两组正常，最后一组力竭。最后一组超目标则加重（次数翻倍加倍）。一次失败重置 10%。',
  double: '同重量下在次数区间内爬升。每组都到区间顶部才加重，次数回底部。',
  triple: '次数先爬到区间顶，再加一组，直到你的最大组数。全部到顶后加重，回到初始组数与次数。',
  time: '每组都坚持满时长则目标增加。',
}

/** Epley 目标映射到动作真实负重网格上的软目标 */
export const DELOAD_FACTOR = 0.9
export const DELOAD_AFTER: Record<string, number> = { linear: 3, greyskull: 1, double: 3, triple: 3, time: 3 }
export const DELOAD_FACTOR_MIN = 0.5
export const DELOAD_FACTOR_MAX = 0.95

export function isValidDeloadFactor(value: unknown): boolean {
  const factor = Number(value)
  return Number.isFinite(factor) && factor >= DELOAD_FACTOR_MIN && factor <= DELOAD_FACTOR_MAX
}
export function deloadFactorOf(cfg: { deloadFactor?: unknown } | null | undefined): number {
  return isValidDeloadFactor(cfg?.deloadFactor) ? Number(cfg?.deloadFactor) : DELOAD_FACTOR
}

// ── Epley 辅助 ──────────────────────────────────────────────────────────────

const round1 = (v: number) => Math.round(v * 10) / 10

/**
 * Epley 1RM。单侧动作使用单侧完成的次数；调用方传入存储的总次数，
 * 此助手显式拆分，避免总量膨胀 1RM。
 */
export function epley1RM(weight: unknown, reps: unknown): number | null {
  const w = Number(weight)
  const r = Number(reps)
  if (!Number.isFinite(w) || !Number.isFinite(r) || w <= 0 || r < 1) return null
  const result = w * (1 + r / 30)
  return Number.isFinite(result) && result > 0 ? round1(result) : null
}
export function deloadTarget1RM(weight: unknown, reps: unknown, factor: number = DELOAD_FACTOR, perSide = false): number | null {
  const base = epley1RM(weight, perSide ? Number(reps) / 2 : reps)
  const f = isValidDeloadFactor(factor) ? Number(factor) : DELOAD_FACTOR
  return base == null ? null : round1(base * f)
}

// ── 负重步长 ────────────────────────────────────────────────────────────────

/** 重部位身体部位（下肢/背）走更大跳幅——线性项目赖以生存的"动作专属增量" */
const HEAVY_BP = ['upper legs', 'lower legs', 'back', 'hips', 'glutes']

/**
 * 默认负重步长。下肢动作跳更大；动作可用 cfg.inc 覆盖。
 * 上游按目录 bp 判定，此处按条目自带 bp/身体部位字段。
 */
export function defaultIncrement(bodyPart: string | null | undefined, unit: string | 'kg' | 'lb' = 'kg'): number {
  const heavy = !!bodyPart && HEAVY_BP.includes(bodyPart)
  if (unit === 'lb') return heavy ? 10 : 5
  return heavy ? 5 : 2.5
}

/** 解析 reps 模式负重控件与渐进的步长。计时动作用 inc 表示秒，其可选重量列不得调用此助手 */
export function weightIncrement(cfg: { inc?: number; bp?: string; bodyPart?: string } | null | undefined, unit: string | 'kg' | 'lb' = 'kg'): number {
  return cfg && (cfg.inc as number) > 0 ? (cfg.inc as number) : defaultIncrement(cfg?.bp ?? cfg?.bodyPart, unit)
}

export const DEFAULT_SEC_INCREMENT = 5
/** 再加一组俯卧撑不再是进步而是度过一晚的方式。超过此数，诚实的建议是加负重或更难变式 */
export const MAX_BW_SETS = 6

/** 模式判定（上游 history.js modeOf；目录 cardio 识别以 min 字段本地等价） */
export function modeOf(cfg: { mode?: string; min?: number } | null | undefined): 'reps' | 'time' | 'cardio' {
  const m = cfg?.mode
  if (m === 'reps' || m === 'time' || m === 'cardio') return m
  if (cfg?.min != null) return 'cardio'
  return 'reps'
}

/** 金字塔组集永不渐进：训练者自选每组重量 */
export function isPyramid(cfg: { pyramid?: unknown[]; mode?: string } | null | undefined): boolean {
  return !!cfg && Array.isArray(cfg.pyramid) && cfg.pyramid.length > 0 && (cfg.mode || 'reps') === 'reps'
}

/**
 * 一个动作在用的策略：自身覆盖，否则例程默认，否则模式默认。
 * reps 保持应用一贯行为（全达标 → 加一步）。
 */
export function policyFor(
  cfg: { prog?: string } | null | undefined,
  routine: { prog?: string } | null | undefined,
  mode?: string,
): string {
  if (isPyramid(cfg)) return 'off'
  const m = mode || modeOf(cfg || {})
  const allowed = POLICIES_FOR[m] || ['off']
  const pick = (cfg && cfg.prog) || (routine && routine.prog) || (m === 'reps' ? 'linear' : 'off')
  return allowed.includes(pick) ? pick : 'off'
}

// ── 负重网格 ────────────────────────────────────────────────────────────────

/**  snapping 到步长的可负重倍数。手动负重控件用同一归一化，小数增量产生与自动渐进相同的数 */
export function snapWeight(v: number, step: number): number {
  if (!(step > 0)) return round1(v)
  return round1(Math.round(v / step) * step)
}

/**
 * 按步进器点击的方式加重：已在增量网格上的重量 snapping 到它，
 * 不在网格上的简单相加。渐进用同一规则：以 10 磅步长记录的 397 磅雪橇
 * 去 407，而非网格的 410。
 */
export function addStep(w: number, step: number, inc: number): number {
  const v = +w || 0
  const onGrid = inc > 0 && Math.abs(v - Math.round(v / inc) * inc) <= 0.1
  const next = v + step
  return Math.max(0, onGrid ? snapWeight(next, inc) : round1(next))
}
export function stepWeight(value: unknown, step: number, direction: number): number {
  const v = Number(value) || 0
  return addStep(v, direction * step, step)
}

/** 按因子回退，落到实际可负重的数。Greyskull 与计时渐进仍用此旧策略 */
export function deloadTo(cur: number, step: number, factor: number = DELOAD_FACTOR): number {
  let next = snapWeight(cur * factor, step)
  if (next >= cur) next = snapWeight(cur - step, step)
  return Math.max(step, next)
}

const positiveGridAround = (ideal: number, step: number, maxWeight: number, strictLower: boolean): number[] => {
  if (!(ideal > 0) || !(step > 0) || !(maxWeight > 0)) return []
  const low = Math.floor(ideal / step) * step
  const high = Math.ceil(ideal / step) * step
  const values = [...new Set([low, high].map(v => snapWeight(v, step)))]
  return values
    .filter(v => v > 0 && v <= maxWeight + 1e-9 && (!strictLower || v < maxWeight - 1e-9))
    .sort((a, b) => a - b)
}

// ── 次数区间与背驰（上游 rep-range.js / backoff.js） ─────────────────────────

function align(value: number, stride: number): number {
  return Math.max(stride, Math.ceil(value / stride) * stride)
}
function positiveInt(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.max(1, Math.round(n)) : fallback
}

/** 归一化次数区间：上界对齐步长，下界不低于上界减 2 */
export function normalizeRepRange(reps: unknown, repsMin: unknown, stride = 1): { reps: number; repsMin: number } {
  const step = Number.isInteger(stride) && stride > 0 ? stride : 1
  const upper = align(positiveInt(reps, 10), step)
  const lower = align(positiveInt(repsMin, Math.max(1, upper - 2)), step)
  return lower >= upper
    ? { reps: lower + step, repsMin: lower }
    : { reps: upper, repsMin: lower }
}

/**
 * 第 k 个背驰组的负重：自顶组按步长递减。在网格上则 snapping，否则直接减。
 */
export function backoffAt(top: number, k: number, step: number): number {
  const t = Number(top) || 0
  const s = Number(step) || 0
  if (!(t > 0) || !(s > 0) || !(k > 0)) return t
  const raw = t - k * s
  const onGrid = Math.abs(t - Math.round(t / s) * s) <= 0.1
  const v = onGrid ? round1(Math.round(raw / s) * s) : round1(raw)
  return Math.max(Math.min(t, s), v)
}

// ── 计划快照 ────────────────────────────────────────────────────────────────

/**
 * 一个例程动作要求什么——其组数与次数（双倍下为区间；保持为秒数）——
 * 如戳在每次训练构建的每个条目上（entry.planned）。处方移动训练的 target；
 * 此保留例程所言，是下次训练区分"被编辑的计划"与"已渐进的计划"的唯一方式。
 * 负重从不自行起步——历史决定它——但一旦组数或次数被编辑，与之同编的
 * 负重就是新计划开启的重量。
 */
export function plannedOf(cfg: { sets?: number; reps?: number; repsMin?: number; sec?: number; setsMax?: number; weight?: number; mode?: string } | null | undefined) {
  const c = cfg || {}
  const mode = modeOf(c)
  const out: Record<string, number> = { sets: Math.max(1, c.sets || 1) }
  if (mode === 'reps' && (c.reps as number) > 0) out.reps = c.reps as number
  if (mode === 'reps' && (c.repsMin as number) > 0) out.repsMin = c.repsMin as number
  if (mode === 'time' && (c.sec as number) > 0) out.sec = c.sec as number
  // 三倍渐进的组数上限是计划的一部分：抬高它改变循环终点
  if (mode === 'reps' && (c.setsMax as number) > 0) out.setsMax = c.setsMax as number
  if (c.weight != null) out.weight = c.weight
  return out
}

const PLAN_KEYS = ['sets', 'reps', 'repsMin', 'sec', 'setsMax']
const samePlan = (a: Record<string, unknown>, b: Record<string, unknown>) =>
  PLAN_KEYS.every(k => ((a[k] ?? null) === (b[k] ?? null)))
/** 例程的组数或次数自戳了 planned 的训练后变过吗？ */
export function planChanged(planned: Record<string, unknown> | null | undefined, cfg: Parameters<typeof plannedOf>[0]): boolean {
  return !!planned && !samePlan(planned, plannedOf(cfg))
}

// ── 会话判读 ────────────────────────────────────────────────────────────────

/** 辅助器械判定（上游由目录 assistedShape 判定，此处用标记） */
const isAssisted = (x: { assisted?: boolean } | null | undefined): boolean =>
  !!(x && (x as { assisted?: boolean }).assisted)

/** 单侧判定（上游 history.js isPerSide） */
const isPerSide = (cfg: { side?: boolean } | null | undefined): boolean => !!cfg?.side

// 判读所用的负荷。辅助器械上越少越难，故计数的组是助力最少的——
// 那里的 0 意味"未记录负重"，而非"历史最佳"。
function loadOfSession(entry: EntryLike, sets: SetLike[]): number {
  const done = sets.filter(s => s.done).map(s => Number(s.w) || 0)
  if (!isAssisted(entry)) return Math.max(0, ...done)
  const loaded = done.filter(w => w > 0)
  return loaded.length ? Math.min(...loaded) : 0
}

/**
 * 将一次已完成的训练条目归约为策略判定所需。
 *
 * 训练自 v1.2.2 才记录处方，故多数历史无 target。对空判定会把每次过去训练
 * 都记成失误——然后向老用户问候"连续 11 次训练失误，减载"。故无自身 target 的
 * 条目对 fallback（该动作当前计划）判定，这正是应用旧负重提示所比的。
 */
export function readSession(entry: EntryLike | null | undefined, fallback?: Record<string, unknown>) {
  const target = ((entry && entry.target) || fallback || {}) as Record<string, unknown>
  const mode = modeOf({ mode: target.mode as string })
  // 热身行是准备而非训练：一次过滤读法胜过守卫下面每个消费者
  const logged = ((entry && entry.sets) || []).filter(s => !isWarmupRow(s))
  // 计时的单侧保持行数翻倍（计划上一组变 L 行与 R 行）——target.sets 仍是
  // 翻倍前的计划数，故此处也须翻倍。
  const rowGoals = mode === 'reps' && entry && Array.isArray(target.rowReps) && (target.rowReps as unknown[]).length
    ? (target.rowReps as unknown[]).map(r => Math.max(0, Number(r) || 0))
    : null
  const plannedRows = rowGoals ? rowGoals.length : (Number(target.sets) || logged.length)
  const planned = mode === 'time' && isPerSide(target as { side?: boolean }) ? plannedRows * 2 : plannedRows
  const enough = logged.length >= planned
  // 只有计划要求的组决定下一步。计划外加的一组是额外功，曾会被读作处方的一部分。
  const sets = entry && entry.target ? logged.slice(0, Math.max(1, planned)) : logged

  if (mode === 'time') {
    const goal = Number(target.sec) || 0
    const held = sets.map(s => (s.done ? (Number(s.sec) || 0) : 0))
    return {
      mode, target, goal, held,
      weight: loadOfSession(entry as EntryLike, sets),
      best: Math.max(0, ...held),
      ok: goal > 0 && enough && held.length > 0 && held.every(h => h >= goal),
    }
  }
  const goal = rowGoals ? Math.max(...rowGoals) : (Number(target.reps) || 0)
  // 背驰组：计划中第一个之后的每组按记录自重递减。背驰组更轻地完成其次数
  // 不是该序列的完成，故读作差一次数的组。仅带背驰步长构建的训练携带它。
  const step = entry && entry.target ? Number((entry.target as Record<string, unknown>).backoffStep) || 0 : 0
  const top = step > 0 && sets.length ? Number(sets[0].w) || 0 : 0
  const heavyEnough = (s: SetLike, k: number) => !(top > 0) || k === 0 || (Number(s.w) || 0) >= backoffAt(top, k, step) - 0.05
  const reps = sets.map((s, k) => (s.done && heavyEnough(s, k) ? (Number(s.r) || 0) : 0))
  return {
    mode, target, goal, reps,
    weight: loadOfSession(entry as EntryLike, sets),
    count: reps.length,                              // 自重功增长的维度
    low: reps.length ? Math.min(...reps) : 0,
    amrap: reps.length ? reps[reps.length - 1] : 0,  // Greyskull 的末组
    ok: goal > 0 && enough && reps.length > 0 && reps.every((r, k) => r >= (rowGoals ? rowGoals[k] ?? goal : goal)),
  }
}

// ── 会话收集 ────────────────────────────────────────────────────────────────

/** 条目的例程 id（上游 entryRoutineId）：条目戳优先，回落训练级 routineId/routineIds[0] */
const entryRoutineId = (w: WorkoutLike, e: EntryLike): string | null =>
  (e.rid as string) || (e.routineId as string)
  || (w.routineId as string)
  || (Array.isArray(w.routineIds) ? (w.routineIds as string[])[0] ?? null : null)
  || null

/** 渐进排除（上游 entryExcluded）：整训练排除或条目自身 noProg */
const entryExcluded = (w: WorkoutLike, entry: EntryLike): boolean =>
  !!(w.excludeFromProgression || entry.noProg || entry.excludeFromProgression)

function sessionsIn(
  S: ProfileLike,
  exId: string,
  fallback: Record<string, unknown> | undefined,
  rid: string | null,
) {
  const out: Array<Record<string, unknown>> = []
  ;(S?.workouts || []).forEach(w => {
    const entry = (w.entries || []).find(e => e && e.id === exId && (!rid || entryRoutineId(w, e) === rid))
    if (!entry) return
    // 对该动作不计数的训练不能成为其下次处方基线。排除按条目；
    // 旧式整训练 excludeFromProgression 标记仍排除每个条目。
    if (entryExcluded(w, entry)) return
    if (!(entry.sets || []).some(s => s.done && !isWarmupRow(s))) return
    const slot = entryRoutineId(w, entry)
    out.push({
      d: w.d,
      ...(slot ? { rid: slot } : {}),
      ...((entry.planned as Record<string, unknown>) ? { planned: entry.planned } : {}),
      ...readSession(entry, fallback),
    })
  })
  return out
}

/**
 * 一个动作的每次过去训练，最旧在前。带例程 id 时，该例程训练过的训练：
 * 同一动作的大重量日与小重量日各自渐进，合并日按属于该例程的条目读。
 */
export function sessionsFor(
  S: ProfileLike,
  exId: string,
  fallback?: Record<string, unknown>,
  rid?: string | null,
): Array<Record<string, unknown>> {
  if (rid) {
    const own = sessionsIn(S, exId, fallback, rid)
    if (own.length) return own
  }
  return sessionsIn(S, exId, fallback, null)
}

// ── 三倍进阶 ────────────────────────────────────────────────────────────────

export const MAX_TRIPLE_SETS = 10
/** 三倍进阶的组数边界：setsMin 循环起点，setsMax 到顶 */
export function tripleSetsOf(cfg: { sets?: number; setsMax?: number } | null | undefined): { setsMin: number; setsMax: number } {
  const setsMin = Math.max(1, Math.round(Number(cfg?.sets)) || 1)
  const setsMax = Math.max(setsMin, Math.min(MAX_TRIPLE_SETS, Math.round(Number(cfg?.setsMax)) || setsMin))
  return { setsMin, setsMax }
}

// ── 停滞计数 ────────────────────────────────────────────────────────────────

const sameRows = (a: Record<string, unknown>, b: Record<string, unknown>) =>
  JSON.stringify((a?.target as Record<string, unknown>)?.rowReps ?? null) === JSON.stringify((b?.target as Record<string, unknown>)?.rowReps ?? null)

/** 三倍进阶移动的数字：基础组同爬时取最弱基础组，否则取最后加入的组 */
function tripleActive(session: Record<string, unknown>): number {
  const rows = (session?.target as Record<string, unknown>)?.rowReps
  const reps = (session?.reps as number[]) || []
  if (!Array.isArray(rows) || !rows.length) return (session?.low as number) || 0
  if (rows.every(r => r === rows[0])) return Math.min(...rows.map((_, k) => reps[k] || 0))
  return reps[rows.length - 1] || 0
}

/**
 * 从最近往回数，连续几次训练以失误收场。除命中外两件事也结束停滞连击：
 *   - 换重量结束连击：减载应反映赢得它的失败，而非随后更轻的重量；
 *   - 双倍渐进下，一次超越当前重量最佳。
 */
export function stallCount(sessions: Array<Record<string, unknown>>, policy: string): number {
  let n = 0
  for (let i = sessions.length - 1; i >= 0; i--) {
    if (sessions[i].ok) break
    if (i < sessions.length - 1 && sessions[i].weight !== sessions[i + 1].weight) break
    // 计划编辑同样结束：对旧组数×次数的失误对新目标无话可说。
    if (i < sessions.length - 1 && sessions[i].planned && sessions[i + 1].planned
      && !samePlan(sessions[i].planned as Record<string, unknown>, sessions[i + 1].planned as Record<string, unknown>)) break
    // 双倍：唯一刻意要求低于其评判标准的策略（ aimed 自区间底爬升而 ok 需到顶）。
    // 确保此刻超越当前重量最佳计为进步而非停滞。
    if (policy === 'double') {
      const run: number[] = []
      for (let j = i - 1; j >= 0 && sessions[j].weight === sessions[i].weight; j--) run.push(sessions[j].low as number)
      if (run.length && (sessions[i].low as number) > Math.max(...run)) break
    }
    // 三倍同理，对同一重量下要求相同（sameRows）的训练比较其移动数字
    if (policy === 'triple') {
      const run: number[] = []
      for (let j = i - 1; j >= 0 && sessions[j].weight === sessions[i].weight && sameRows(sessions[j], sessions[i]); j--) {
        run.push(tripleActive(sessions[j]))
      }
      if (run.length && tripleActive(sessions[i]) > Math.max(...run)) break
    }
    n++
  }
  return n
}

// ── Epley 减载候选 ──────────────────────────────────────────────────────────

/**
 * 为 Epley 目标挑选有界的负重/次数对。搜索刻意按字典序：
 * 硬约束优先，然后最接近的估计 1RM、更少的次数变更、更大的负重。
 * 这让网格平局可预测，而不把产品决策藏在任意评分权重里。
 */
export function selectDeloadCandidate({
  currentWeight,
  targetWeight,
  targetReps,
  step,
  factor = DELOAD_FACTOR,
  reps,
  repsMin,
  perSide = false,
}: {
  currentWeight: unknown
  targetWeight: unknown
  targetReps: unknown
  step: number
  factor?: number
  reps?: unknown
  repsMin?: unknown
  perSide?: boolean
}) {
  const current = Number(currentWeight)
  const baseWeight = Number(targetWeight)
  const baseReps = Number(targetReps)
  const stride = perSide ? 2 : 1
  const upper = Math.max(stride, Math.ceil(baseReps / stride) * stride)
  const range = repsMin == null ? null : normalizeRepRange(reps, repsMin, stride)
  const top = range ? Math.min(range.reps, Math.max(range.repsMin, upper)) : upper
  const bottom = range ? range.repsMin : top
  const repValues: number[] = []
  for (let r = top; r >= bottom; r -= stride) repValues.push(r)
  const target1RM = deloadTarget1RM(baseWeight, upper, factor, perSide)
  if (!(current > 0) || target1RM == null || !repValues.length || !(step > 0)) return null

  const candidates: Array<Record<string, number | boolean>> = []
  repValues.forEach(candidateReps => {
    const ideal = target1RM / (1 + (perSide ? candidateReps / 2 : candidateReps) / 30)
    const allowCurrent = repsMin != null && candidateReps < upper
    const grid = positiveGridAround(ideal, step, current, !allowCurrent)
    if (allowCurrent && !grid.includes(current)) grid.push(current)
    grid.forEach(candidateWeight => {
      const epley = epley1RM(candidateWeight, perSide ? candidateReps / 2 : candidateReps) as number
      candidates.push({
        weight: candidateWeight,
        reps: candidateReps,
        epley,
        error: Math.abs(epley - target1RM),
        repChange: Math.abs(candidateReps - upper),
        fallback: false,
      })
    })
  })

  // 极小或低于步长的提升可能没有正的低网格点。握住实际尝试的负重比向上
  // 取整到一步更安全；这是显式、确定性的兜底。
  if (!candidates.length) {
    repValues.forEach(candidateReps => {
      const epley = epley1RM(current, perSide ? candidateReps / 2 : candidateReps) as number
      candidates.push({
        weight: current,
        reps: candidateReps,
        epley,
        error: Math.abs(epley - target1RM),
        repChange: Math.abs(candidateReps - upper),
        fallback: true,
      })
    })
  }
  if (!candidates.length) return null
  candidates.sort((a, b) => (a.error as number) - (b.error as number)
    || (a.repChange as number) - (b.repChange as number)
    || (b.weight as number) - (a.weight as number)
    || (b.reps as number) - (a.reps as number))
  return { ...candidates[0], target1RM, factor: deloadFactorOf({ deloadFactor: factor }), upper, bottom }
}

// 重新导出共享模型助手，便于调用方单点引用
export { isSideSet }

// ── 策略主体（上游 progression.js 445-820 行） ──────────────────────────────

/** 单侧判定（上游 isPerSide） */
const isPerSideCfg = (cfg: { side?: boolean } | null | undefined): boolean => !!cfg?.side

/** 单侧动作的次数步进为 2（总量保持偶数，两腿都得次数） */
const repStepOf = (cfg: { side?: boolean } | null | undefined): number => (isPerSideCfg(cfg) ? 2 : 1)

/** 自重判定：显式 bodyweight 标记优先，否则看器械（上游 isBw + isBodyweightEq 的本地等价） */
const isBwCfg = (cfg: { bodyweight?: boolean; eq?: string } | null | undefined): boolean =>
  cfg ? (cfg.bodyweight != null ? !!cfg.bodyweight : cfg.eq === 'body weight') : false

/** 无负重可加的动作按次数爬升（自重、或器械自身非负重——腹轮/瑜伽球；辅助器械是例外） */
const climbsReps = (cfg: { bodyweight?: boolean; eq?: string; assisted?: boolean } | null | undefined): boolean =>
  isBwCfg(cfg) || (cfg?.eq !== undefined && !['barbell', 'dumbbell', 'cable', 'machine', 'smith machine', 'ez bar', 'trap bar', 'kettlebell', 'sled', 'lever machine'].includes(cfg.eq)) || !!cfg?.assisted

/** 向下取整到步长网格的梯级 */
const rungDown = (v: number, step: number): number => {
  if (!(step > 0)) return v
  return Math.floor(v / step) * step
}

/** 单侧组的一侧归一化 */
const sideOf = (side: Record<string, unknown> | null | undefined) => ({
  w: Number(side?.w) || 0,
  r: Number(side?.r) || 0,
  done: !!side?.done,
  ...(side?.rir != null ? { rir: Number(side.rir) } : {}),
  ...(side?.rpe != null ? { rpe: Number(side.rpe) } : {}),
})

/** 从两侧重算行的标量镜像（r/w/done）；非单侧组返回浅拷贝 */
export function syncSideAggregate(row: Record<string, unknown>): Record<string, unknown> {
  const base = { ...row }
  if (!isSideSet(base as unknown as SetLike)) return base
  const L = sideOf((base.sides as Record<string, unknown>).L as Record<string, unknown>)
  const R = sideOf((base.sides as Record<string, unknown>).R as Record<string, unknown>)
  const out: Record<string, unknown> = { ...base, sides: { L, R }, r: L.r + R.r, w: Math.max(L.w, R.w), done: L.done && R.done }
  // 行的努力度尾部显示更难的一侧：RIR 更低或 RPE 更高
  delete out.rir
  delete out.rpe
  const rirs = [L, R].filter(s => s.rir != null).map(s => s.rir as number)
  const rpes = [L, R].filter(s => s.rpe != null).map(s => s.rpe as number)
  if (rirs.length) out.rir = Math.min(...rirs)
  else if (rpes.length) out.rpe = Math.max(...rpes)
  return out
}

/** 把一个直行拆成左右各半（上游 makeSideSet） */
export function makeSideSet(row: Record<string, unknown> = {}): Record<string, unknown> {
  const base = { ...row }
  const half = Math.round((Number(base.r) || 0) / 2)
  const w = Number(base.w) || 0
  const side = () => ({ w, r: half, done: false })
  const next: Record<string, unknown> = { ...base, sides: { L: side(), R: side() } }
  delete next.rir
  delete next.rpe
  return syncSideAggregate(next)
}

/**
 * 重爬热身块：热身行朝你即将举起的重量爬坡，而非上次举起的。
 * 从 0 起步，每级走剩余距离的一半，向下取到步长网格。
 */
export function rerampWarmups(rows: SetLike[], step = 2.5, floor = 0): SetLike[] {
  const firstWork = rows.findIndex(x => !isWarmupRow(x))
  if (firstWork <= 0) return rows
  const target = Number(rows[firstWork].w) || 0
  if (!(target > 0)) return rows
  const out = rows.slice()
  let from = 0
  for (let i = 0; i < firstWork; i++) {
    if (out[i].done) { from = Number(out[i].w) || 0; continue }
    const w = target > from
      ? Math.min(target, Math.max(0, floor, rungDown(from + (target - from) / 2, step)))
      : target
    out[i] = isSideSet(out[i])
      ? syncSideAggregate({ ...out[i], sides: { L: { ...(out[i].sides as { L?: object }).L, w }, R: { ...(out[i].sides as { R?: object }).R, w } } }) as unknown as SetLike
      : { ...out[i], w }
    from = w
  }
  return out
}

/** 处方：策略给出的下一次训练参数。kind：first/up/hold/deload/off */
export interface Prescription {
  policy: string
  kind: 'first' | 'up' | 'hold' | 'deload' | 'off'
  weight?: number
  reps?: number
  sec?: number
  sets?: number
  rowReps?: number[]
  target1RM?: number
  deloadFactor?: number
  /** 解释文案模板 + 参数（{0} 占位），上游为可翻译 key，此处直接中文 */
  why: [string, ...(string | number)[]]
}

/**
 * 一个动作的下一次处方。
 *
 * 返回 { weight, reps, sec, sets, rowReps, why, kind }——kind 为
 * first | up | hold | deload | off，why 是"为什么是这个数"的模板+参数。
 * 策略无意见的字段返回 undefined，调用方保留计划所言。
 */
export function nextPrescription(
  S: ProfileLike,
  cfg: {
    id?: string
    sets?: number
    reps?: number
    repsMin?: number
    repsMax?: number
    sec?: number
    setsMax?: number
    weight?: number
    inc?: number
    prog?: string
    mode?: string
    side?: boolean
    bodyweight?: boolean
    eq?: string
    assisted?: boolean
    bp?: string
    bodyPart?: string
    [key: string]: unknown
  },
  routine?: { id?: string; prog?: string } | null,
): Prescription {
  const mode = modeOf(cfg)
  const policy = policyFor(cfg, routine, mode)
  const unit = (S?.unit as string) || 'kg'
  const inc = mode === 'time'
    ? ((cfg.inc as number) > 0 ? (cfg.inc as number) : DEFAULT_SEC_INCREMENT)
    : weightIncrement(cfg, unit as 'kg' | 'lb')
  if (policy === 'off') return { policy, kind: 'off', why: ['不自动渐进：目标保持计划值。'] }
  // 辅助器械反向渐进：助力越少越难，停滞则加助力。仅方向不同。
  const assisted = !!cfg.assisted
  // 注：哑铃库存（上游 ownedWeightsFor）未移植，owned 恒为 null，走增量网格。
  const harder = (weight: number, step: number) =>
    assisted ? Math.max(0, addStep(weight, -step, inc)) : addStep(weight, step, inc)
  const easier = (weight: number) =>
    assisted ? addStep(weight, inc, inc) : deloadTo(weight, inc)

  // 例程自身该动作的训练，或例程尚无时的全部历史——见 sessionsFor。
  const sessions = sessionsFor(S, cfg.id as string, cfg as Record<string, unknown>, routine?.id).filter(s => s.mode === mode)
  const last = sessions[sessions.length - 1] as Record<string, unknown> | undefined
  // 三倍进阶从基础组数与区间底部起步，故其首次训练也如此；重量仍是计划的。
  const triple = policy === 'triple' && mode === 'reps'
  const range3 = triple ? normalizeRepRange(cfg.reps || 10, cfg.repsMin, repStepOf(cfg)) : null
  const sets3 = triple ? tripleSetsOf(cfg) : null
  const startRows = (reps: number) => Array(sets3!.setsMin).fill(reps)
  if (!last) {
    if (triple && range3 && sets3) {
      return { policy, kind: 'first', reps: range3.repsMin, sets: sets3.setsMin, rowReps: startRows(range3.repsMin), why: ['尚无记录，本次训练建立基线。'] }
    }
    return { policy, kind: 'first', why: ['尚无记录，本次训练建立基线。'] }
  }

  // 上次训练构建自不同计划时从计划重新起步（#275）：例程的组数或次数被编辑过，
  // 或该训练是从别的例程借来的。其数字是对旧目标判分的，说不了新目标站在哪。
  const borrowed = !!routine?.id && last.rid !== routine.id
  if (last.planned ? planChanged(last.planned as Record<string, unknown>, cfg) : borrowed) {
    const why: [string, ...(string | number)[]] = borrowed
      ? ['首次进入该例程，从其自身目标起步。']
      : ['计划已变更，从你的新目标起步。']
    // 重量保持上次所举，除非计划自身重量不是该训练构建所用的：把 3×5@100 改成
    // 3×10@70 的那次编辑设了 70，而 102.5×10 是从未为这些次数举过的负荷。
    const set = (cfg.weight as number) > 0 && last.planned && ((last.planned as Record<string, unknown>).weight ?? null) !== cfg.weight
      ? { weight: cfg.weight as number }
      : null
    if (mode === 'time') return { policy, kind: 'hold', ...set, sec: (cfg.sec as number) || (last.goal as number) || undefined, why }
    if (!set && (last.weight as number) <= 0 && climbsReps(cfg)) return { policy, kind: 'hold', weight: 0, reps: (cfg.reps as number) || undefined, why }
    const held = set || ((last.weight as number) > 0 ? { weight: last.weight as number } : (cfg.weight as number) > 0 ? { weight: cfg.weight as number } : {})
    if (triple && range3 && sets3) {
      const aim = set ? range3.repsMin : Math.min(range3.reps, Math.max(range3.repsMin, (last.low as number) + repStepOf(cfg)))
      return { policy, kind: 'hold', ...held, reps: aim, sets: sets3.setsMin, rowReps: startRows(aim), why }
    }
    if (policy === 'double') {
      const range = normalizeRepRange((cfg.reps as number) || (last.goal as number) || 10, cfg.repsMin, repStepOf(cfg))
      const aim = set ? range.repsMin : Math.min(range.reps, Math.max(range.repsMin, (last.low as number) + repStepOf(cfg)))
      return { policy, kind: 'hold', ...held, reps: aim, why }
    }
    return { policy, kind: 'hold', ...held, reps: (cfg.reps as number) || undefined, why }
  }

  const stalls = stallCount(sessions, policy)
  const deloadAt = DELOAD_AFTER[policy] || 3

  if (mode === 'time') {
    if (last.ok) {
      const sec = ((last.goal as number) || (cfg.sec as number) || 0) + inc
      return { policy, kind: 'up', sec, why: ['每组都坚持满时长，目标 +{0}s。', inc] }
    }
    if (stalls >= deloadAt) {
      const sec = deloadTo((last.goal as number) || (cfg.sec as number) || 0, 5)
      return { policy, kind: 'deload', sec, why: ['连续 {0} 次未达标。回退到 {1}s 再建。', stalls, sec] }
    }
    return { policy, kind: 'hold', sec: (last.goal as number) || (cfg.sec as number), why: ['上次差一点，目标不变。'] }
  }

  const w = last.weight as number
  // 自重工作无外部负重可加减——"俯卧撑减载到 2.5kg"不是建议。按次数进步。
  // 这在各策略之前运行，因为对所有策略都成立。
  if (w <= 0 && climbsReps(cfg)) {
    const goal = (last.goal as number) || (cfg.reps as number) || 0
    const planSets = Math.max(1, (cfg.sets as number) || 1)
    const reached = last.planned ? Math.max(planSets, ((last.target as Record<string, unknown>)?.sets as number) || 0) : planSets
    const keep = reached > planSets ? { sets: reached } : {}
    if (!last.ok || goal <= 0) return { policy, kind: 'hold', weight: 0, reps: goal || undefined, ...keep, why: ['自重：每组干净前目标不变。'] }
    const top = (cfg.repsMax as number) > 0 ? (cfg.repsMax as number) : 0
    if (top > 0 && goal >= top) {
      const sets = reached + 1
      const bottom = Math.max(1, Math.min((cfg.reps as number) || top, top))
      if (sets <= MAX_BW_SETS) return { policy, kind: 'up', weight: 0, reps: bottom, sets, why: ['每组都做到 {0} 次！加一组，回到 {1} 次。', goal, bottom] }
      return { policy, kind: 'hold', weight: 0, reps: goal, ...keep, why: ['{0} 组各 {1} 次。该加负重或更难变式了。', sets - 1, goal] }
    }
    const next = goal + repStepOf(cfg)
    return { policy, kind: 'up', weight: 0, reps: next, ...keep, why: ['自重：上次全完成，这次冲 {0} 次。', next] }
  }
  // 记录了 0 的负重动作是重量没输入——快速添加的动作从 0kg 起步。像俯卧撑一样
  // 爬次数会把 2×10 卧推变成 2×11、12……无可进步，故索要重量。
  if (w <= 0) {
    return { policy, kind: 'hold', ...((cfg.weight as number) > 0 ? { weight: cfg.weight as number } : {}), why: ['上次未记录重量。输入你举的重量，渐进自此开始。'] }
  }

  // Epley 减载仅用于外部负重的 reps 工作。保留停滞训练的处方目标（逐字段回落到
  // 当前配置），记录重量仍是候选的硬上限。
  const epleyDeload = (): Prescription | null => {
    if (assisted) return null
    if (mode !== 'reps' || (policy !== 'linear' && policy !== 'double')) return null
    const previous = (last.target as Record<string, unknown>) || {}
    const target = {
      ...cfg,
      ...previous,
      weight: (previous.weight ?? cfg.weight) as number,
      reps: (previous.reps ?? cfg.reps) as number,
      repsMin: (previous.repsMin ?? cfg.repsMin) as number,
      sets: (cfg.sets ?? previous.sets) as number,
      bodyweight: (previous.bodyweight ?? cfg.bodyweight) as boolean,
      side: (previous.side ?? cfg.side) as boolean,
      intensifier: (previous.intensifier ?? cfg.intensifier) as { type?: string } | undefined,
    }
    if (isBwCfg(target) || target.intensifier?.type === 'restpause') return null
    const candidate = selectDeloadCandidate({
      currentWeight: w,
      targetWeight: target.weight,
      targetReps: target.reps,
      step: inc,
      factor: deloadFactorOf(cfg),
      reps: target.reps,
      repsMin: policy === 'double' ? target.repsMin : undefined,
      perSide: isPerSideCfg(target),
    })
    if (!candidate) return null
    const held = (candidate.weight as number) >= w
    return {
      policy,
      kind: 'deload',
      weight: candidate.weight as number,
      reps: candidate.reps as number,
      sets: target.sets,
      target1RM: candidate.target1RM as number,
      deloadFactor: candidate.factor as number,
      why: held
        ? ['停滞 {0} 次。保持 {1} {2}，用 {3} 次。', stalls, candidate.weight as number, unit, candidate.reps as number]
        : ['停滞 {0} 次。Epley 减载到 {1} {2} 做 {3} 次。', stalls, candidate.weight as number, unit, candidate.reps as number],
    }
  }

  if (triple && range3 && sets3) {
    const top = range3.reps
    const bottom = range3.repsMin
    const { setsMin, setsMax } = sets3
    const step = repStepOf(cfg)
    const rows = tripleRowsOf(last, setsMin, setsMax, range3)
    const out = (kind: Prescription['kind'], weight: number, next: number[], why: [string, ...(string | number)[]]): Prescription =>
      ({ policy, kind, weight, reps: next[0], sets: next.length, rowReps: next, why })
    if (stalls >= deloadAt) {
      // 回到循环起点，更轻的负荷。Epley 挑它：停滞训练顶目标的估计最大值，
      // 减减载因子，在区间底部、负重网格上且低于所举。辅助器械则加助力。
      let dw: number | null = null
      if (!assisted) {
        const perSide = isPerSideCfg(cfg)
        const target1RM = deloadTarget1RM(w, Math.max(...rows), deloadFactorOf(cfg), perSide)
        const ideal = target1RM == null ? null : target1RM / (1 + (perSide ? bottom / 2 : bottom) / 30)
        const grid = ideal == null ? [] : positiveGridAround(ideal, inc, w, true)
        if (grid.length) dw = grid.reduce((a, b) => (Math.abs(b - ideal!) < Math.abs(a - ideal!) ? b : a))
      }
      if (dw == null) dw = easier(w)
      return out('deload', dw, startRows(bottom), assisted
        ? ['停滞 {0} 次。回到 {1} {2} 助力，从 {3} 组 {4} 次重新开始。', stalls, dw, unit, setsMin, bottom]
        : ['停滞 {0} 次。减载到 {1} {2}，从 {3} 组 {4} 次重新开始。', stalls, dw, unit, setsMin, bottom])
    }
    // 差于目标：组数与次数不变。与双倍不同，不削减，已加的组不撤；比之前更多
    // 的次数仍算进步（stallCount）。
    if (!last.ok) {
      return out('hold', w, rows, stalls === 0
        ? ['差于目标，但比之前次数更多。组数与次数不变。']
        : ['上次次数未达标。组数与次数不变（还差 {0}/{1}次停滞）。', deloadAt - stalls, deloadAt])
    }
    // 命中：从所举读下去，封顶到顶，故超出目标的次数也计。
    const got = rows.map((r, k) => Math.min(top, Math.max(r, (last.reps as number[])?.[k] || 0)))
    const climb = (v: number) => Math.min(top, Math.max(bottom, v + step))
    const n = got.length
    const baseLow = Math.min(...got.slice(0, Math.min(n, setsMin)))
    if (n <= setsMin && baseLow < top) {
      const aim = climb(baseLow)
      return out('hold', w, Array(Math.max(n, setsMin)).fill(aim), ['同重量，每组冲 {0} 次。', aim])
    }
    const active = got[n - 1]
    if (n > setsMin && active < top) {
      const aim = climb(active)
      return out('hold', w, [...got.slice(0, n - 1).map(() => top), aim], ['同重量，最后一组冲 {0} 次。', aim])
    }
    if (n < setsMax) return out('up', w, [...got.map(() => top), bottom], ['每组都到 {0} 次！加一组 {1} 次。', top, bottom])
    return out('up', harder(w, inc), startRows(bottom), assisted
      ? ['全部 {0} 组都到区间顶。少 {1} {2} 助力，回到 {3} 组 {4} 次。', n, inc, unit, setsMin, bottom]
      : ['全部 {0} 组都到区间顶。加 {1} {2}，回到 {3} 组 {4} 次。', n, inc, unit, setsMin, bottom])
  }

  if (policy === 'double') {
    const range = normalizeRepRange((cfg.reps as number) || (last.goal as number) || 10, cfg.repsMin, repStepOf(cfg))
    const top = range.reps
    const bottom = range.repsMin
    // last.ok 只意味"匹配了本次训练记录的目标"——而该目标可能在区间顶之下。
    // 双倍进阶必须每组都实际到区间顶才加量（#278）。
    if (last.ok && (last.low as number) >= top) {
      const up = harder(w, inc)
      return {
        policy, kind: 'up', weight: up, reps: bottom,
        why: assisted
          ? ['每组都到次数区间顶。少 {0} {1} 助力，回到 {2} 次。', inc, unit, bottom]
          : ['每组都到次数区间顶。加 {0} {1}，回到 {2} 次。', inc, unit, bottom],
      }
    }
    if (stalls >= deloadAt) {
      const selected = epleyDeload()
      if (selected) return selected
      const dw = easier(w)
      return {
        policy, kind: 'deload', weight: dw, reps: bottom,
        why: assisted
          ? ['停滞 {0} 次。回到 {1} {2} 助力再建。', stalls, dw, unit]
          : ['停滞 {0} 次。减载到 {1} {2}。', stalls, dw, unit],
      }
    }
    const aim = Math.min(top, Math.max(bottom, (last.low as number) + repStepOf(cfg)))
    return { policy, kind: 'hold', weight: w, reps: aim, why: ['同重量，这次冲 {0} 次。', aim] }
  }

  // linear + greyskull
  if (last.ok) {
    // Greyskull 末组力竭：次数翻倍即赢得双倍跳幅。
    const dbl = policy === 'greyskull' && (last.goal as number) > 0 && (last.amrap as number) >= (last.goal as number) * 2
    const up = harder(w, dbl ? inc * 2 : inc)
    const step = dbl ? inc * 2 : inc
    return {
      policy, kind: 'up', weight: up,
      why: dbl
        ? ['末组做到 {0} 次，是目标两倍！双倍跳幅 {1} {2}。', last.amrap as number, step, unit]
        : assisted
          ? ['上次每个都完成。少 {0} {1} 助力。', step, unit]
          : ['上次每个都完成。加 {0} {1}。', step, unit],
    }
  }
  if (stalls >= deloadAt) {
    const selected = epleyDeload()
    if (selected) return selected
    const dw = easier(w)
    return {
      policy, kind: 'deload', weight: dw,
      why: assisted
        ? ['次数未达标。加 {0} {1} 助力再建。', dw, unit]
        : stalls > 1
          ? ['连续 {0} 次未达标。重置到 {1} {2} 再建。', stalls, dw, unit]
          : ['次数未达标。重置到 {1} {2} 再建。', dw, unit],
    }
  }
  return { policy, kind: 'hold', weight: w, why: ['上次次数未达标。重量不变（还差 {0}/{1} 次停滞）。', deloadAt - stalls, deloadAt] }
}

/** 三倍进阶某次训练的每组目标（上游 tripleRowsOf） */
function tripleRowsOf(
  session: Record<string, unknown>,
  setsMin: number,
  setsMax: number,
  range: { reps: number; repsMin: number },
): number[] {
  const own = (session?.target as Record<string, unknown>)?.rowReps
  if (Array.isArray(own) && own.length) return own.map(r => Math.max(0, Number(r) || 0))
  const n = Math.min(setsMax, Math.max(setsMin, ((session?.target as Record<string, unknown>)?.sets as number) || setsMin))
  const reps = Math.min(range.reps, Math.max(range.repsMin, ((session?.target as Record<string, unknown>)?.reps as number) || (session?.goal as number) || range.repsMin))
  return Array(n).fill(reps)
}

/**
 * 把处方应用到新建的组上。只触碰策略实际决定的字段，且只对未记录的组。
 * floor 是动作的杠铃下限，重爬的热身永不低于它。
 */
export function applyPrescription(sets: SetLike[], p: Prescription | null, step = 2.5, floor = 0): SetLike[] {
  // 首次训练无可处方，除了三倍进阶的循环起点。
  if (!p || p.kind === 'off' || (p.kind === 'first' && !p.rowReps)) return sets
  const out: SetLike[] = sets.map(s => {
    // 永不改写已记录的组。处方对工作组说话；未完成的热身只跟随其次数或保持，
    // 因为 insertWarmupRow 在策略发声前从工作组复制了它们。
    if (s.done) return s
    if (isWarmupRow(s)) {
      if (p.reps != null && s.r != null) return { ...s, r: p.reps }
      if (p.sec != null && s.sec != null) return { ...s, sec: p.sec }
      return s
    }
    if (isSideSet(s)) {
      const sides = Object.fromEntries(['L', 'R'].map(side => {
        const row = (s.sides as Record<string, Record<string, unknown>>)[side]
        return [side, row.done ? row : { ...row,
          ...(p.weight != null ? { w: p.weight } : {}),
          ...(p.reps != null ? { r: p.reps / 2 } : {}),
        }]
      }))
      return syncSideAggregate({ ...s, sides }) as unknown as SetLike
    }
    const o = { ...s }
    if (p.weight != null) o.w = p.weight
    if (p.reps != null) o.r = p.reps
    if (p.sec != null) o.sec = p.sec
    return o
  })
  // 决定了组数的策略可以增长列表——自重渐进加一组，杠铃则加一片。只增不减，
  // 且只复制已在的行：进行中的训练不得丢失已记录的组。
  const workRows = out.filter(s => !isWarmupRow(s))
  if ((p.sets as number) > workRows.length) {
    // 全热身条目无工作组可种子增长——增长热身复制既发明工作组又永不终止循环。
    if (!workRows.length) return rerampWarmups(out, step, floor)
    const seed = workRows[workRows.length - 1]
    // 新追加的行未被执行，故永不继承种子已记录的 drops/clusters——那会发明它
    // 从未做过的额外功。type 保留：那是动作的计划，而非该行所记录。
    const { drops, clusters, ...plainSeed } = seed
    while (out.filter(s => !isWarmupRow(s)).length < (p.sets as number)) {
      out.push(isSideSet(seed)
        ? makeSideSet({ w: p.weight ?? seed.w, r: p.reps ?? seed.r }) as unknown as SetLike
        : { ...plainSeed, done: false })
    }
  }
  // 三倍进阶的每组目标，按顺序一一对应开放工作组（含上面增长的）。已记录的行
  // 保持其所记录。
  if (Array.isArray(p.rowReps)) {
    let k = -1
    for (let i = 0; i < out.length; i++) {
      if (isWarmupRow(out[i])) continue
      k++
      const r = p.rowReps[k]
      if (out[i].done || !(r > 0)) continue
      out[i] = isSideSet(out[i])
        ? syncSideAggregate({ ...out[i], sides: Object.fromEntries(['L', 'R'].map(side => [side, (out[i].sides as Record<string, Record<string, unknown>>)[side].done ? (out[i].sides as Record<string, Record<string, unknown>>)[side] : { ...(out[i].sides as Record<string, Record<string, unknown>>)[side], r: r / 2 }])) }) as unknown as SetLike
        : { ...out[i], r }
    }
  }
  // 最后，因为工作组现在携带其最终重量：热身块朝你即将举起的爬坡。
  return rerampWarmups(out, step, floor)
}
