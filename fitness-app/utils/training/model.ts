// 训练数据模型共享层
//
// 移植自 openGym（AGPL-3.0）的 workout-model.js / format.js / history.js 中的最小必要部分。
// 上游这些模块与同步、Store、i18n 深度耦合，按整合方案"解耦原则"仅抽取算法所需的
// 数据结构与纯函数，保持与上游一致的字段命名（w/r/rir/rpe/done/warmup/sides/phase），
// 以便上游测试用例可移植。

/** 单侧计次的一侧（单臂/单腿动作） */
export interface SideSet {
  w?: number | string | null
  r?: number | string | null
  done?: boolean
}

/** 一组训练记录。有氧组 {min, speed} 与计时组 {sec, w} 天然缺少 w+r 组合 */
export interface SetLike {
  w?: number | string | null
  r?: number | string | null
  rir?: number | string | null
  rpe?: number | string | null
  done?: boolean
  /** 热身组标记 */
  warmup?: boolean
  /** 组阶段（warmup/work 等，上游有多拼写归一化） */
  phase?: string
  /** 单侧计次 */
  sides?: { L?: SideSet | null; R?: SideSet | null } | null
  /** 组类型：normal/warmup/drop/rest-pause/failure */
  type?: string
  drops?: unknown[]
  clusters?: unknown[]
  sec?: number
  min?: number
  speed?: number
}

/** 一个动作在一次训练中的条目 */
export interface EntryLike {
  id?: string
  sets?: SetLike[]
  topW?: number
  assisted?: boolean
  target?: { mode?: string; side?: boolean } | null
  /** 历史条目携带的动作元数据快照（自定义动作被删后凭此读回） */
  muscleSnapshot?: Record<string, unknown> | null
  /** 动作库引用或内联元数据（肌肉映射用） */
  tg?: string
  mg?: string
  sm?: unknown
  bp?: string
  primaries?: unknown
  secondaries?: unknown
  muscleGroups?: unknown
  muscles?: unknown
  targetMuscles?: unknown
  muscleWeights?: Record<string, number> | null
  [key: string]: unknown
}

/** 一次训练 */
export interface WorkoutLike {
  d?: string
  start?: number
  entries?: EntryLike[]
  [key: string]: unknown
}

/** 用户训练档案（上游为一个 JSON 文档，此处为同构的内存结构） */
export interface ProfileLike {
  workouts?: WorkoutLike[]
  oneRmFormula?: string
  /** 周起始日设置：'mon'（默认）或 'sun' */
  ws?: string
  [key: string]: unknown
}

/** 热身行判定——phase 权威，回落旧式 warmup 标记（与上游 isWarmupRow 一致） */
export function isWarmupRow(s: SetLike | null | undefined): boolean {
  if (!s) return false
  const phase = String(s.phase || '').trim().toLowerCase()
  if (phase) return phase === 'warmup' || phase === 'warm-up' || phase === 'warm_up'
  return s.warmup === true
}

/** 单侧组判定 */
export const isSideSet = (s: SetLike): boolean => !!s.sides && (!!s.sides.L || !!s.sides.R)

/** 训练时间戳：优先 start，回落日期解析（上游 workoutAt 语义） */
export const workoutAt = (w: WorkoutLike | null | undefined): number =>
  w?.start != null ? w.start : (w?.d ? Date.parse(w.d) : 0)

// ── 日期助手（上游 format.js 最小集）────────────────────────────────────────

export const MONDAY = 'mon'
export const SUNDAY = 'sun'

/** 日期 → 'YYYY-MM-DD'（本地时区，与上游 isoOf 语义一致） */
export const isoOf = (d: Date | string | number): string => {
  const date = d instanceof Date ? d : new Date(d)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const todayISO = (): string => isoOf(new Date())

/** 档案的周起始日（默认周一） */
export const weekStartOf = (S: ProfileLike | null | undefined): string =>
  S?.ws === 'sun' ? SUNDAY : MONDAY

/** 日期所在周的首日时间戳（周一或周日开始） */
export function startOfWeek(d: string, ws: string = MONDAY): Date {
  const date = new Date(`${d}T00:00:00`)
  const dow = date.getDay() // 0=周日 … 6=周六
  const back = ws === SUNDAY ? (dow === 0 ? 0 : dow) : (dow === 0 ? 6 : dow - 1)
  date.setDate(date.getDate() - back)
  date.setHours(0, 0, 0, 0)
  return date
}

/** 日期所属周的键（周一/周日起算），用于按周聚合 */
export function weekKey(d: string, ws: string = MONDAY): string {
  return isoOf(startOfWeek(d, ws))
}
