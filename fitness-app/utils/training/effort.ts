// 努力度统计（Effort as a statistic）
//
// 移植自 openGym（AGPL-3.0）frontend/src/lib/effort.js，上游 commit e348fc1。
// 上游依赖（history / format / workout-model / exercises）以本地 model.ts
// 最小实现替代；RIR 为内部唯一刻度（有真实零点），显示时换算回 RPE。
// RPE 8 == RIR 2。

import {
  isWarmupRow, weekStartOf, weekKey, startOfWeek, workoutAt, isoOf,
  type ProfileLike, type SetLike, type EntryLike, type WorkoutLike,
} from './model'

/** 达到或低于此值的组足够接近力竭，是驱动适应那种。3 而非 2：界线是约定，放宽一次仍能区分工作组与热身范围 */
export const HARD_RIR = 3
/** 低于此数的已评级组均值只是噪声。单个组显示 "RIR 1.0" 像发现实则是一次点击，调用方显示破折号 */
export const MIN_RATED = 5

/** 努力度显示模式（上游 EFFORT 表的最小集） */
export const EFFORT: Record<string, { hd: string }> = {
  rir: { hd: 'RIR' },
  rpe: { hd: 'RPE' },
}
const effortOf = (S: ProfileLike | null | undefined): string => (S?.effort as string) || 'none'

/**
 * 一个组的努力度（RIR），从未评级时为 null。0 是评级而非"空"。
 * 标记为力竭的组按定义为 RIR 0，无评级时如此读取；手工输入的评级更精确，优先。
 */
export const rirOf = (s: SetLike | null | undefined): number | null =>
  !s ? null : s.rir != null ? Number(s.rir) : s.rpe != null ? 10 - Number(s.rpe) : null

/** RIR → 显示中的刻度。rirOf 的逆运算，用于单个数字 */
export const toScale = (kind: string, rir: number | null): number | null =>
  rir == null ? null : Math.round((kind === 'rpe' ? 10 - rir : rir) * 10) / 10

/**
 * 用哪个刻度*标注*聚合值。档案自身设置优先；自身不记录但携带已评级历史
 * （Hevy 导入场景）的档案，显示历史实际写入的刻度，而非一个它从未见过的 RIR。
 */
export function displayScale(S: ProfileLike): string {
  const k = effortOf(S)
  if (EFFORT[k]) return k
  let rir = 0, rpe = 0
  eachDoneSet(S, s => { if (s.rir != null) rir++; else if (s.rpe != null) rpe++ })
  return rpe > rir ? 'rpe' : 'rir'
}
export const scaleName = (kind: string): string => EFFORT[kind]?.hd ?? ''

/** 档案中每个已完成组，最旧优先。fn 收到组及其所属训练与条目 */
function eachDoneSet(S: ProfileLike | null | undefined, fn: (s: SetLike, w: WorkoutLike, e: EntryLike) => void): void {
  ;(S?.workouts || []).forEach(w =>
    (w.entries || []).forEach(e =>
      (e.sets || []).forEach(s => { if (s.done && !isWarmupRow(s)) fn(s, w, e) })))
}

/** 以天为单位的窗口，从此刻回数。0 = 全部，空历史对每个调用方同样如此 */
const inWindow = (w: WorkoutLike, days: number): boolean =>
  !days || workoutAt(w) > Date.now() - days * 86400000

/** 一个组的 RIR 及其来源。默认解析器只取记录的努力度（历史行为不变） */
const normRir = (r: number | { rir: number; estimated?: boolean; source?: string } | null): { rir: number; estimated: boolean } | null => {
  if (r == null) return null
  if (typeof r === 'number') return { rir: r, estimated: false }
  return { rir: r.rir, estimated: r.source ? r.source !== 'logged' : !!r.estimated }
}

export const avgRir = (sets: Array<SetLike | null | undefined> | null | undefined): number | null => {
  const vs = (sets || []).map(rirOf).filter((v): v is number => v != null)
  return vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null
}

/**
 * 一个窗口的头条数字：多难、多少比例够难，以及让其余部分保持诚实的——
 * 多少训练被评级过。努力度可选且默认关闭，部分覆盖是常态；不带分母的
 * 均值会 quietly 代表从未被评级的组发言。
 */
export function effortSummary(
  S: ProfileLike,
  days: number,
  resolve: (s: SetLike, w: WorkoutLike, e: EntryLike) => number | null = rirOf,
) {
  let done = 0, rated = 0, est = 0, sum = 0, hard = 0
  eachDoneSet(S, (s, w, e) => {
    if (!inWindow(w, days)) return
    done++
    const r = normRir(resolve(s, w, e))
    if (r == null || r.rir == null) return
    if (r.estimated) est++
    else rated++
    sum += r.rir
    if (r.rir <= HARD_RIR) hard++
  })
  const covered = rated + est
  return {
    done, rated, est, covered, hard,
    avg: covered >= MIN_RATED ? sum / covered : null,
    hardPct: covered >= MIN_RATED ? hard / covered : null,
  }
}

/** 档案是否有任何已评级组？决定努力度 UI 是否存在 */
export function hasEffort(S: ProfileLike): boolean {
  let any = false
  eachDoneSet(S, s => { if (!any && rirOf(s) != null) any = true })
  return any
}

/**
 * 是否有组可做 RIR 估计（有负重、次数在估计区间、非辅助）？
 * 决定无人评级历史的估计回退 UI 是否存在——Jefit/Hevy 导入带负重无评级。
 * 热身组不计：估计它们会用折扣斜坡行填满卡片。
 */
export function hasEstimableEffort(S: ProfileLike): boolean {
  let any = false
  eachDoneSet(S, (s, w, e) => {
    if (any) return
    const wgt = Number(s?.w)
    const reps = Number(s?.r)
    if (!(wgt > 0) || !(reps >= 1) || reps > 12) return
    if (e?.assisted) return
    any = true
  })
  return any
}

/**
 * 每日历周的平均努力度，附该周组数：成对才是重点。
 * 量升且努力度升是疲劳积累；量升而努力度平是你想要的适应。
 * 单个已评级组的周被丢弃而非画出——一次点击不应成为曲线峰值。
 */
export function effortWeeks(
  S: ProfileLike,
  days: number,
  resolve: (s: SetLike, w: WorkoutLike, e: EntryLike) => number | null = rirOf,
) {
  const ws = weekStartOf(S)
  const wk = new Map<string, { k: string; t: number; sum: number; n: number; est: number; sets: number }>()
  eachDoneSet(S, (s, w, entry) => {
    if (!inWindow(w, days)) return
    const k = weekKey(w.d as string, ws)
    let b = wk.get(k)
    if (!b) wk.set(k, b = { k, t: startOfWeek(w.d as string, ws).getTime(), sum: 0, n: 0, est: 0, sets: 0 })
    b.sets++
    const r = normRir(resolve(s, w, entry))
    if (r != null && r.rir != null) { b.sum += r.rir; b.n++; if (r.estimated) b.est++ }
  })
  return [...wk.values()].filter(e => e.n >= 2).sort((a, b) => a.t - b.t)
    .map(e => ({ t: e.t, rir: e.sum / e.n, n: e.n, est: e.est, sets: e.sets }))
}

/** 已评级组在刻度上的分布，整步分桶、顶部以上全部并入最后一桶 */
export const BUCKETS = 4        // 0,1,2,3 和 "4+" 尾
export function effortHistogram(
  S: ProfileLike,
  days: number,
  resolve: (s: SetLike, w: WorkoutLike, e: EntryLike) => number | null = rirOf,
) {
  const bins = new Array(BUCKETS + 1).fill(0)
  let rated = 0
  eachDoneSet(S, (s, w, e) => {
    if (!inWindow(w, days)) return
    const r = normRir(resolve(s, w, e))
    if (r == null || r.rir == null) return
    rated++
    bins[Math.min(BUCKETS, Math.max(0, Math.floor(r.rir)))]++
  })
  return bins.map((n, i) => ({ rir: i, tail: i === BUCKETS, n, pct: rated ? n / rated : 0 }))
}

/** 算"够难"的组——人体图"困难组"模式背后的过滤器 */
export const isHardSet = (s: SetLike | null | undefined): boolean => {
  const r = rirOf(s)
  return r != null && r <= HARD_RIR
}

// ---------------------------------------------------------------- 色带 --
//
// 一个组的努力度读作颜色，扫一眼整次训练便知跑得多难，无需读每个数字。
// 色带以 RIR（内部刻度）定义一次，无论档案记录 RIR 还是 RPE 都同样适用——
// RPE 8 与 RIR 2 是同一组，得同一色。刻度从"什么都不剩"（紫色，越过红色——
// 远端，而非只是"很难"）到"轻松、热身范围"（绿色）。
//
// 命名桶也是快速选择预设：一次点击记录 band 中点。估计粗的地方刻意粗——
// 没人能可靠区分 5 RIR 与 7，故 4 以上共一桶；接近力竭处刻意细，0、0.5 与 1
// 的差确实改变训练。预设之间手输的值仍按落入的色带着色。
export const EFFORT_BANDS = [
  { rir: 0, max: 0.25, color: '#7C3AED', feel: '力竭，一点都不剩' },
  { rir: 0.5, max: 0.75, color: '#EF4444', feel: '大概还剩半次' },
  { rir: 1, max: 1.5, color: '#F97316', feel: '还能做一次' },
  { rir: 2, max: 2.5, color: '#EAB308', feel: '还能做两次' },
  { rir: 3, max: 3.5, color: '#22C55E', feel: '还能做三次' },
  { rir: 4, max: Infinity, color: '#94A3B8', feel: '轻松，热身范围' },
]
/** 选择器中展示的预设，最难的在前——刻度与颜色的阅读顺序。tail 是折叠的顶桶 */
export const EFFORT_PRESETS = EFFORT_BANDS.map((b, i) => ({
  rir: b.rir, color: b.color, feel: b.feel, tail: i === EFFORT_BANDS.length - 1,
}))

/**
 * 单个努力度值（以 RIR 给出，先用 rirOf 换算）的颜色。精确预设落自己的带；
 * 手输的中间值（RIR 1.5）取所在带，永不着色遗漏。null（未评级）无色——
 * 调用方显示中性控件而非绿色。
 */
export const effortColor = (rir: number | null): string | null => {
  if (rir == null) return null
  for (const b of EFFORT_BANDS) if (rir <= b.max) return b.color
  return EFFORT_BANDS[EFFORT_BANDS.length - 1].color
}

// 重新导出便于调用方单点引用
export { isoOf }
