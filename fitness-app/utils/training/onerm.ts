// 1RM 估算（Estimated One-Rep Max）
//
// 移植自 openGym（AGPL-3.0）frontend/src/lib/onerm.js，上游 commit e348fc1。
// 上游依赖链（exercises.js / history.js / dumbbells.js / workout-model.js）按整合方案
// 的"解耦原则"以本地最小实现替代，算法本体逐函数保持一致，测试用例同步移植作为
// 行为不变性验收基线。
//
// 公式均为亚最大负荷估计器：Epley 为默认（lifters 最熟悉）；低次数时各公式一致，
// 高次数时分歧加大——这正是 REP_CAP 存在的原因。加权集合（weighted）混合七个公式
// 加一个 RIR %1RM 映射，在高次数区间给出更稳定的估计。

/** 超过此次数，单个公式反映的更多是工作容量而非最大力量，拒绝猜测优于打印幻想值 */
export const REP_CAP = 12

/** 加权集合可容忍稍高次数（混合抵消了单公式漂移），但仍有余地上限 */
export const WEIGHTED_REP_CAP = 15

// ── 公式套件 ────────────────────────────────────────────────────────────────

export const FORMULAS: Record<string, (w: number, r: number) => number> = {
  epley:    (w, r) => w * (1 + r / 30),
  brzycki:  (w, r) => w * 36 / (37 - r),
  lombardi: (w, r) => w * Math.pow(r, 0.1),
  oconner:  (w, r) => w * (1 + r / 40),
  mayhew:   (w, r) => (w * 100) / (52.2 + 41.9 * Math.exp(-0.055 * r)),
  wathan:   (w, r) => (w * 100) / (48.8 + 53.8 * Math.exp(-0.075 * r)),
  lander:   (w, r) => (w * 100) / (101.3 - 2.67123 * r),
}
export const DEFAULT_FORMULA = 'epley'

/** 公式中文显示名（上游以公式作者命名，不翻译） */
export const FORMULA_NAMES: Record<string, string> = {
  epley: 'Epley', brzycki: 'Brzycki', lombardi: 'Lombardi', oconner: 'O\'Conner',
  mayhew: 'Mayhew', wathan: 'Wathan', lander: 'Lander',
}

/** 用户在设置里选择的公式；未知值回落默认，旧设备/新设备都不会因此出错 */
export const formulaOf = (S: { oneRmFormula?: string } | null | undefined): string => {
  const f = S?.oneRmFormula
  return f === 'weighted' || Object.hasOwn(FORMULAS, f as string) ? (f as string) : DEFAULT_FORMULA
}

// ── RIR %1RM 映射（Mike Tuchscherer / RTS 量表）────────────────────────────
// 索引 0 = 离力竭 1 次，索引 14 = 离力竭 15 次。
const RIR_PCT = [
  100, 95.5, 92.2, 89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9,
  71.7, 69.5, 67.5, 65.5, 63.6,
]

function rirEstimate(w: number, effectiveReps: number): number {
  const idx = Math.min(Math.max(Math.round(effectiveReps) - 1, 0), RIR_PCT.length - 1)
  return (w * 100) / RIR_PCT[idx]
}

// ── 权重矩阵 ────────────────────────────────────────────────────────────────
// a_i: 绝对可靠度; v_i(r): 随有效次数上升的可变衰减。weight_i(r) = a_i * v_i(r)
const WEIGHTS: Record<string, { a: number; v: (r: number) => number }> = {
  epley:    { a: 0.95, v: r => r <= 6  ? 1 : Math.max(0.4, 1 - (r - 6) * 0.12) },
  brzycki:  { a: 1.10, v: r => r <= 8  ? 1 : Math.max(0.3, 1 - (r - 8) * 0.18) },
  lombardi: { a: 0.85, v: r => r <= 5  ? 1 : Math.max(0.4, 1 - (r - 5) * 0.10) },
  oconner:  { a: 0.90, v: r => r <= 6  ? 1 : Math.max(0.4, 1 - (r - 6) * 0.12) },
  mayhew:   { a: 0.95, v: r => r <= 8  ? 1 : Math.max(0.5, 1 - (r - 8) * 0.10) },
  wathan:   { a: 0.90, v: r => r <= 7  ? 1 : Math.max(0.4, 1 - (r - 7) * 0.12) },
  lander:   { a: 0.85, v: r => r <= 7  ? 1 : Math.max(0.35, 1 - (r - 7) * 0.15) },
  rir:      { a: 1.00, v: r => r <= 10 ? 1 : Math.max(0.4, 1 - (r - 10) * 0.15) },
}

// 七个公式估计值之间的变异系数（尺度不变）。
function ensembleCV(w: number, effectiveReps: number): number {
  const vals = Object.keys(FORMULAS).map(f => FORMULAS[f](w, effectiveReps))
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length
  const variance = vals.reduce((a, e) => a + (e - mean) ** 2, 0) / vals.length
  return Math.sqrt(variance) / mean
}

// 所有公式估计值与 RIR %1RM 映射的加权平均。导出不取整，供内部消费者
// （如疲劳模型的强度锚点）使用精确混合值；公开的 estimate1RM() 才做显示取整。
export function weightedEstimate(w: number, effectiveReps: number): number {
  let total = 0
  let wsum = 0
  for (const [name, fn] of Object.entries(FORMULAS)) {
    const wt = WEIGHTS[name].a * WEIGHTS[name].v(effectiveReps)
    total += fn(w, effectiveReps) * wt
    wsum += wt
  }
  const rirWt = WEIGHTS.rir.a * WEIGHTS.rir.v(effectiveReps)
  total += rirEstimate(w, effectiveReps) * rirWt
  wsum += rirWt
  return total / wsum
}

// ── 公开 API ────────────────────────────────────────────────────────────────

const round1 = (v: number) => Math.round(v * 10) / 10

/**
 * 从单次组估计 1RM。无法诚实回答时返回 null：缺失/零/负重、无次数、非有限输入、
 * 或次数超过上限。单次力竭不是估计而是测量，原样返回。
 */
export function estimate1RM(
  w: unknown,
  r: unknown,
  formula: string = DEFAULT_FORMULA,
  rir: unknown = null,
): number | null {
  const weight = Number(w)
  const reps = Number(r)
  if (!isFinite(weight) || !isFinite(reps)) return null
  if (weight <= 0 || reps < 1) return null

  const validRir = rir != null && Number(rir) >= 0

  // r === 1 且无 RIR 或 RIR 0 → 测量，而非估计
  if (reps === 1 && (!validRir || Number(rir) === 0)) {
    return round1(weight)
  }

  if (formula === 'weighted') {
    const effectiveReps = validRir ? reps + Number(rir) : reps
    if (effectiveReps > WEIGHTED_REP_CAP) return null
    const est = weightedEstimate(weight, effectiveReps)
    if (!isFinite(est) || est <= 0) return null
    return round1(est)
  }

  if (reps > REP_CAP) return null
  const fn = FORMULAS[formula] || FORMULAS[DEFAULT_FORMULA]
  const est = reps === 1 ? weight : fn(weight, Math.round(reps))
  if (!isFinite(est) || est <= 0) return null
  return round1(est)
}

// ── 本地数据模型（替代上游 history/workout-model 依赖）─────────────────────
// 数据结构与助手函数统一收敛到 model.ts，此处引用并再导出以保持本模块 API 稳定。

import {
  isWarmupRow, isSideSet, workoutAt,
  type SetLike, type EntryLike, type WorkoutLike, type ProfileLike,
} from './model'

export type { SetLike, EntryLike, WorkoutLike, ProfileLike } from './model'
export { isWarmupRow, workoutAt } from './model'

/** 辅助器械动作无 1RM 可估 */
const isAssisted = (ex: { assisted?: boolean } | null | undefined): boolean =>
  !!(ex && (ex as { assisted?: boolean }).assisted)

/**
 * 一个动作条目中的"可估算组"：仅 reps 模式（同时有 w 与 r）、已完成、非热身。
 * 计时/有氧模式的条目整体排除（其行可能携带 w/r 但语义不同）；单侧组以行内
 * sides 各自的 done 为准，不受行级 done 限制。上游由 history.js 的
 * metricRowsForEntry 承担，此处按同样语义内联。
 */
function metricRowsForEntry(entry: EntryLike): SetLike[] {
  const mode = entry?.target?.mode
  if (mode === 'time' || mode === 'cardio') return []
  return (entry?.sets || []).filter(s =>
    !isWarmupRow(s) &&
    (isSideSet(s) || (s.done === true && s.w != null && s.r != null)))
}

/** 一次训练中各条目里估计值最高的一组 */
export function bestSetOf(entry: EntryLike | null | undefined, formula: string = DEFAULT_FORMULA) {
  // 辅助器械没有 1RM 可估：Epley 会越弱估得越高还把那是纪录（上游 issue #232）
  if (isAssisted(entry as { assisted?: boolean } | null)) return null
  let best: { est: number; w: number; r: number } | null = null
  metricRowsForEntry(entry as EntryLike).forEach(s => {
    const sets = isSideSet(s)
      ? [s.sides!.L, s.sides!.R].filter(side => side?.done === true)
      : [s]
    sets.forEach(set => {
      const est = estimate1RM(set.w, set.r, formula, (set as SetLike).rir ?? null)
      if (est !== null && (!best || est > best.est)) {
        best = { est, w: Number(set.w), r: Math.round(Number(set.r)) }
      }
    })
  })
  return best
}

function bestSetOfEntries(entries: EntryLike[], formula: string) {
  let best: { est: number; w: number; r: number } | null = null
  for (const entry of entries || []) {
    const candidate = bestSetOf(entry, formula)
    if (candidate && (!best || candidate.est > best.est)) best = candidate
  }
  return best
}

/** 某次训练中指定动作的条目（上游 entriesForExercise 语义） */
const entriesForExercise = (workout: WorkoutLike, exId: string): EntryLike[] =>
  (workout?.entries || []).filter(e => e?.id === exId)

/**
 * 每次产生估计值的训练一个点——喂给趋势图。按时间顺序。
 */
export function e1rmSeries(
  S: ProfileLike,
  exId: string,
  formula: string = formulaOf(S),
): Array<{ t: number; d?: string; y: number; w: number; r: number }> {
  // 注：辅助器械动作由 bestSetOf 内的 entry.assisted 标记过滤
  const pts: Array<{ t: number; d?: string; y: number; w: number; r: number }> = []
  ;(S?.workouts || []).forEach(w => {
    const best = bestSetOfEntries(entriesForExercise(w, exId), formula)
    if (best) pts.push({ t: workoutAt(w), d: w.d, y: best.est, w: best.w, r: best.r })
  })
  return pts
}

/** 全时段最佳估计，连同产生它的组与日期——来源很重要："100×10 估的 142.5" 与 "140×1 来的" 是完全不同的声明 */
export function best1RM(S: ProfileLike, exId: string, formula: string = formulaOf(S)) {
  let best: { est: number; w: number; r: number; d?: string; t: number } | null = null
  e1rmSeries(S, exId, formula).forEach(p => {
    if (!best || p.y > best.est) best = { est: p.y, w: p.w, r: p.r, d: p.d, t: p.t }
  })
  return best
}

/** 本次训练是否刷新了此前所有估计？用于训练完成摘要（历史中尚不含本次 w） */
export function is1RMRecord(S: ProfileLike, exId: string, entry: EntryLike, formula: string = formulaOf(S)) {
  const now = bestSetOf(entry, formula)
  if (!now) return null
  const prev = best1RM(S, exId, formula)
  return !prev || now.est > prev.est ? { ...now, prev: prev ? prev.est : 0 } : null
}

/**
 * 1RM 估计的置信指数（0–1）。计入次数衰减、RIR 主观性、以及（加权集合的）公式间分歧。
 */
export function calculate1RMAccuracy(reps: unknown, rir: unknown = null, formula = 'weighted'): number {
  const r = Number(reps)
  if (!isFinite(r) || r < 1) return 0
  if (r === 1 && rir === 0) return 1
  if (r > WEIGHTED_REP_CAP) return 0

  // 次数衰减：1 次时 1.0 → WEIGHTED_REP_CAP 时 0.5
  const repFactor = r === 1 ? 1 : 1 - 0.5 * (r - 1) / (WEIGHTED_REP_CAP - 1)

  // RIR 引入主观不确定性（约 8% 惩罚）。RIR 0（力竭）是客观端点，无惩罚。
  const rirVal = Number(rir)
  const rirFactor = (rir != null && isFinite(rirVal) && rirVal > 0) ? 0.92 : 1

  // 公式间离散度（仅加权）：CV 越高置信越低
  let spreadFactor = 1
  if (formula === 'weighted' && r >= 2) {
    const cv = ensembleCV(100, r)
    spreadFactor = Math.max(0.5, 1 - cv / 0.15 * 0.5)
  }

  return Math.round(repFactor * rirFactor * spreadFactor * 100) / 100
}
