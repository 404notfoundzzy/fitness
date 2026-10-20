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

/** 模式判定（上游 history.js modeOf） */
export function modeOf(cfg: { mode?: string } | null | undefined): 'reps' | 'time' | 'cardio' {
  const m = cfg?.mode
  if (m === 'reps' || m === 'time' || m === 'cardio') return m
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

/** 条目的例程 id（上游 entryRoutineId） */
const entryRoutineId = (_w: WorkoutLike, e: EntryLike): string | null =>
  (e.rid as string) || (e.routineId as string) || null

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
