// 历史回读 adapter（History read-back adapter）
//
// 把后端 GET /api/workouts/history-window 的响应映射为渐进引擎/疲劳模型
// 可直接消费的 ProfileLike 结构（见 model.ts）。架构决策见整合方案 ADR-1：
// 引擎在客户端运行，本模块是"后端数据 → 引擎输入"的唯一转换点。
//
// 映射约定：
// - workoutDate（'YYYY-MM-DD' 或完整时间戳）→ workout.d，并派生本地零点 start
// - exerciseId → entry.id（字符串化，与引擎调用方的 exId 比较）
// - planId → 训练级例程 id（rid），供 sessionsFor 的"例程自有训练"过滤
// - set：weightKg→w、actualReps→r、rir→rir、isCompleted→done、
//        setType='warmup'→phase='warmup'（isWarmupRow 以 phase 权威）、type 原样携带
// - perSide=1 的同一 setNumber 两行 → 合并为引擎的 sides {L,R} 单行
//   （后端按"左/右各一行"存储，sort_order 前者为 L、后者为 R）

import {
  isoOf,
  type ProfileLike,
  type WorkoutLike,
  type EntryLike,
  type SetLike,
} from './model'

/** 后端窗口响应：一组 */
export interface WindowSet {
  setNumber?: number | string | null
  setType?: string | null
  weightKg?: number | string | null
  actualReps?: number | string | null
  rir?: number | string | null
  rpe?: number | string | null
  perSide?: number | string | null
  isCompleted?: number | string | null
  supersetGroup?: number | string | null
  [key: string]: unknown
}

/** 后端窗口响应：一次训练中的一个动作 */
export interface WindowExercise {
  exerciseId?: number | string | null
  exerciseName?: string | null
  sets?: WindowSet[]
  [key: string]: unknown
}

/** 后端窗口响应：一次训练 */
export interface WindowWorkout {
  workoutRecordId?: number | string | null
  workoutDate?: string | null
  planId?: number | string | null
  dayNumber?: number | string | null
  trainingType?: string | null
  exercises?: WindowExercise[]
  [key: string]: unknown
}

/** 后端窗口响应整体 */
export interface HistoryWindow {
  from?: string | null
  days?: number | null
  workoutCount?: number | null
  workouts?: WindowWorkout[]
  [key: string]: unknown
}

const num = (v: unknown): number | undefined => {
  if (v == null || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

const truthy = (v: unknown): boolean => {
  if (v == null) return false
  if (typeof v === 'boolean') return v
  const n = Number(v)
  return Number.isFinite(n) ? n !== 0 : !!v
}

/** 'YYYY-MM-DD HH:mm:ss' / 'YYYY-MM-DD' / ISO → 'YYYY-MM-DD' */
export function dateOnly(v: unknown): string | null {
  if (v == null) return null
  const s = String(v)
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : (isoOf(s) || null)
}

/** 单行 set → 引擎 SetLike（非单侧） */
function mapSet(s: WindowSet): SetLike {
  const out: SetLike = {}
  const w = num(s.weightKg)
  const r = num(s.actualReps)
  if (w != null) out.w = w
  if (r != null) out.r = r
  const rir = num(s.rir)
  if (rir != null) out.rir = rir
  const rpe = num(s.rpe)
  if (rpe != null) out.rpe = rpe
  out.done = truthy(s.isCompleted)
  const type = s.setType == null ? null : String(s.setType)
  if (type) {
    out.type = type
    // isWarmupRow 以 phase 为权威，回落旧式 warmup 标记
    if (type === 'warmup') out.phase = 'warmup'
  }
  return out
}

/**
 * 单侧合并：同一 setNumber 的两行（后端"左/右各一行"）→ 引擎 sides 单行。
 * 行镜像 r/w/done 与 syncSideAggregate 一致：r 相加、w 取大、done 需两侧都完成。
 */
function mapSideSets(rows: WindowSet[]): SetLike[] {
  const byNumber = new Map<string, WindowSet[]>()
  for (const row of rows) {
    const key = String(row.setNumber ?? '0')
    if (!byNumber.has(key)) byNumber.set(key, [])
    byNumber.get(key)!.push(row)
  }
  const out: SetLike[] = []
  for (const group of byNumber.values()) {
    const L = mapSet(group[0])
    const R = group[1] ? mapSet(group[1]) : { ...L, done: false }
    const side = (s: SetLike) => ({
      w: s.w ?? 0,
      r: s.r ?? 0,
      done: !!s.done,
      ...(s.rir != null ? { rir: s.rir } : {}),
      ...(s.rpe != null ? { rpe: s.rpe } : {}),
    })
    const l = side(L)
    const r = side(R)
    const set: SetLike = {
      sides: { L: l, R: r },
      w: Math.max(Number(l.w) || 0, Number(r.w) || 0),
      r: (Number(l.r) || 0) + (Number(r.r) || 0),
      done: !!l.done && !!r.done,
    }
    if (L.type) set.type = L.type
    if (L.phase) set.phase = L.phase
    out.push(set)
  }
  return out
}

/** 一个动作的 sets → 引擎 SetLike[]（按 perSide 自动合并） */
export function mapSets(sets: WindowSet[] | null | undefined): SetLike[] {
  const rows = (sets || []).filter(s => s != null)
  const perSide = rows.some(s => truthy(s.perSide))
  if (!perSide) return rows.map(mapSet)
  // 单侧行按 setNumber 聚合成 sides；非单侧行（如热身直行）原样映射
  const out: SetLike[] = []
  const buffer = new Map<string, WindowSet[]>()
  for (const row of rows) {
    if (!truthy(row.perSide)) {
      flushSideBuffer(buffer, out)
      out.push(mapSet(row))
      continue
    }
    const key = String(row.setNumber ?? '0')
    if (!buffer.has(key)) buffer.set(key, [])
    buffer.get(key)!.push(row)
  }
  flushSideBuffer(buffer, out)
  return out
}

function flushSideBuffer(buffer: Map<string, WindowSet[]>, out: SetLike[]): void {
  for (const [, group] of buffer) out.push(...mapSideSets(group))
  buffer.clear()
}

/**
 * 窗口响应 → ProfileLike（引擎输入）。
 * workouts 按日期升序（后端已排序）；每条训练的 planId 透传供 rid 派生。
 */
export function toProfile(window: HistoryWindow | null | undefined): ProfileLike {
  const workouts: WorkoutLike[] = (window?.workouts || []).map(w => {
    const d = dateOnly(w.workoutDate)
    const out: WorkoutLike = {
      ...(d ? { d } : {}),
      entries: (w.exercises || []).map(e => {
        const entry: EntryLike = {
          id: e.exerciseId == null ? undefined : String(e.exerciseId),
          sets: mapSets(e.sets),
        }
        if (e.exerciseName != null) entry.name = e.exerciseName
        return entry
      }),
    }
    // start 用本地零点，避免 Date.parse('YYYY-MM-DD') 的 UTC 语义在周聚合时漂移
    if (d) out.start = new Date(`${d}T00:00:00`).getTime()
    if (w.planId != null) {
      out.planId = w.planId
      // 引擎的 entryRoutineId 读 w.routineId：本 App 域中训练计划即例程
      out.routineId = String(w.planId)
    }
    if (w.workoutRecordId != null) out.recordId = w.workoutRecordId
    return out
  })
  const profile: ProfileLike = { workouts }
  if (window?.days != null) profile.historyDays = window.days
  return profile
}

/** 计划目标配置（来自 training_plan_exercise 的 D5 列，前端读取后传入） */
export interface PlanTargetConfig {
  /** 目标组数 */
  sets?: number | null
  /** 目标次数（支持 "8" 或 "8-12"） */
  reps?: string | number | null
  /** 目标 RIR */
  rir?: number | null
  /** 渐进规则 off/linear/greyskull/double/triple/time */
  prog?: string | null
  /** 单侧计次 */
  side?: boolean | null
  /** 器械（自重判定用） */
  eq?: string | null
  /** 模式 reps/time */
  mode?: string | null
  [key: string]: unknown
}

/** 解析 "8-12" / "8" 区间 → { reps, repsMin }；单值则 reps=repsMin */
export function parseRepRange(reps: unknown): { reps?: number; repsMin?: number } {
  if (reps == null) return {}
  const s = String(reps).trim()
  const m = s.match(/^(\d+)\s*[-~]\s*(\d+)$/)
  if (m) {
    const a = Number(m[1])
    const b = Number(m[2])
    return { reps: Math.max(a, b), repsMin: Math.min(a, b) }
  }
  const n = Number(s)
  return Number.isFinite(n) && n > 0 ? { reps: n, repsMin: n } : {}
}

/**
 * 把计划目标附到档案条目上（entry.target）。
 * configs 以 exerciseId（字符串）为键；缺省的动作不带 target，引擎按 fallback 处理。
 * 这是"计划侧目标"进入引擎的唯一入口（后端 D5 列 → target）。
 */
export function attachTargets(
  S: ProfileLike,
  configs: Record<string, PlanTargetConfig | null | undefined>,
): ProfileLike {
  for (const w of S.workouts || []) {
    for (const e of w.entries || []) {
      const cfg = e.id != null ? configs[e.id] : undefined
      if (!cfg) continue
      const range = parseRepRange(cfg.reps)
      const target: Record<string, unknown> = {}
      if (cfg.sets != null) target.sets = Number(cfg.sets)
      if (range.reps != null) target.reps = range.reps
      if (range.repsMin != null) target.repsMin = range.repsMin
      if (cfg.rir != null) target.rir = Number(cfg.rir)
      if (cfg.prog != null) target.prog = cfg.prog
      if (cfg.side != null) target.side = !!cfg.side
      if (cfg.eq != null) target.eq = cfg.eq
      if (cfg.mode != null) target.mode = cfg.mode
      if (Object.keys(target).length) e.target = target as EntryLike['target']
    }
  }
  return S
}

/** 动作元数据快照（肌肉映射用：主肌肉/次要肌肉/身体部位） */
export interface ExerciseMetaSnapshot {
  tg?: unknown
  mg?: unknown
  sm?: unknown
  bp?: unknown
  eq?: unknown
  [key: string]: unknown
}

/**
 * 把动作库元数据附到条目上（entry.tg/mg/sm/bp），供 muscles.ts/effort.ts
 * 计算有效组数负荷。catalog 以 exerciseId（字符串）为键。
 */
export function attachExerciseMeta(
  S: ProfileLike,
  catalog: Record<string, ExerciseMetaSnapshot | null | undefined>,
): ProfileLike {
  for (const w of S.workouts || []) {
    for (const e of w.entries || []) {
      const meta = e.id != null ? catalog[e.id] : undefined
      if (!meta) continue
      if (meta.tg != null) e.tg = meta.tg
      if (meta.mg != null) e.mg = meta.mg
      if (meta.sm != null) e.sm = meta.sm
      if (meta.bp != null) e.bp = meta.bp
      if (meta.eq != null) e.eq = meta.eq
    }
  }
  return S
}

/** uni.request 兼容的最小请求签名（依赖注入便于测试） */
export type RequestFn = (options: {
  url: string
  method: string
  header?: Record<string, string>
  timeout?: number
}) => Promise<{ statusCode: number; data: { code: number; data?: HistoryWindow; message?: string } }>

/**
 * 拉取历史窗口并转为 ProfileLike。request 由调用方注入（uni.request 或测试替身）。
 *
 * @param request  注入的请求函数
 * @param apiBase  API 基址
 * @param days     窗口天数；0 = 全部历史
 * @param header   鉴权头（如 Bearer token）
 */
export async function fetchHistoryProfile(
  request: RequestFn,
  apiBase: string,
  days = 90,
  header?: Record<string, string>,
): Promise<ProfileLike> {
  const res = await request({
    url: `${apiBase}/api/workouts/history-window?days=${encodeURIComponent(days)}`,
    method: 'GET',
    header,
    timeout: 15000,
  })
  if (res.statusCode !== 200 || !res.data || res.data.code !== 200) {
    throw new Error(res.data?.message || '历史窗口拉取失败')
  }
  return toProfile(res.data.data)
}
