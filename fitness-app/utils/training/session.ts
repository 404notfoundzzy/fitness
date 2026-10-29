// 引导式训练台的会话模型（纯逻辑层）
//
// 本模块是训练台页面（pages/record/workout/guided-training.vue）的全部状态与算法：
// 会话构建（预填上次重量/次数 + 渐进建议）、组级增删改、PR 即时判定、完成汇总、
// 保存载荷映射。页面只负责渲染与手势，因此这里的每条规则都能被单测覆盖。
//
// 数据方向（ADR-1）：后端只提供历史窗口（history.ts → ProfileLike）；
// 本模块把历史 + 计划目标喂给 progression.ts 的 nextPrescription 得到处方，
// 再落成可编辑的组行。不引入任何 uni-app / Vue 依赖。

import {
  isWarmupRow,
  isoOf,
  type EntryLike,
  type ProfileLike,
  type SetLike,
} from './model'
import { nextPrescription, weightIncrement, type Prescription } from './progression'
import { attachTargets, parseRepRange, type PlanTargetConfig } from './history'
import { estimate1RM } from './onerm'

// ── 类型 ────────────────────────────────────────────────────────────────────

/** 组类型：与后端 workout_exercise_detail.set_type 取值一致 */
export type SetType = 'normal' | 'warmup' | 'drop' | 'rest-pause' | 'failure'

export const SET_TYPES: Array<{ value: SetType; label: string; short: string }> = [
  { value: 'normal', label: '正式组', short: '正式' },
  { value: 'warmup', label: '热身组', short: '热身' },
  { value: 'drop', label: '递减组', short: '递减' },
  { value: 'rest-pause', label: '暂停休息', short: '停歇' },
  { value: 'failure', label: '力竭组', short: '力竭' },
]

/** PR 类型：与后端 exercise_pr.type 一致 */
export type PrType = '1rm' | 'max_reps' | 'max_volume'

export const PR_LABEL: Record<PrType, string> = {
  '1rm': '1RM',
  max_reps: '最大次数',
  max_volume: '单组容量',
}

/** 单侧组的一侧 */
export interface GuidedSide {
  weight: number
  reps: number
  done: boolean
}

/** 一组（可编辑行） */
export interface GuidedRow {
  key: string
  setNumber: number
  type: SetType
  weight: number
  reps: number
  /** 保留次数：null = 未记录（不写 0，避免"零 RIR"歧义） */
  rir: number | null
  done: boolean
  /** 单侧动作的左右两肢；非单侧为 null */
  sides: { L: GuidedSide; R: GuidedSide } | null
  isPr: boolean
  prTypes: PrType[]
  /** 数值来自历史/建议且用户未改动（页面显示"上次"角标） */
  prefilled: boolean
}

/** 训练台中的一个动作 */
export interface GuidedExercise {
  key: string
  planExerciseId: number | string | null
  exerciseId: number | string | null
  name: string
  targetSets: number
  /** 计划目标次数原文："8" / "8-12" */
  targetReps: string
  repsMin: number
  repsMax: number
  restSeconds: number
  notes: string
  perSide: boolean
  equipment: string
  bodyPart: string
  primaryMuscle: string
  policy: string
  /** 规则参数（步长/减载因子/组数上限等，来自计划 progression_params） */
  params: Record<string, unknown>
  /** 处方展示（标题 + 解释为什么是这个数） */
  prescription: PrescriptionView
  /** 上次该动作的组（用于"上次"角标与预填） */
  last: { weight: number; reps: number; sets: number } | null
  rows: GuidedRow[]
}

export interface PrescriptionView {
  kind: Prescription['kind']
  policy: string
  weight: number | null
  reps: number | null
  sets: number | null
  title: string
  detail: string
}

/** 一次引导式训练的完整状态（可直接序列化为草稿） */
export interface GuidedSession {
  v: 1
  planId: number | string | null
  planName: string
  dayNumber: number | null
  dayName: string
  focus: string
  startedAt: number
  unit: 'kg' | 'lb'
  exercises: GuidedExercise[]
}

/** /api/training-plan/{id}/days 中的一个动作（含 D5 目标列与动作元数据） */
export interface DayExercise {
  id?: number | string | null
  exerciseId?: number | string | null
  exerciseName?: string | null
  name?: string | null
  sets?: number | null
  reps?: string | number | null
  restSeconds?: number | null
  notes?: string | null
  targetSets?: number | null
  targetReps?: string | number | null
  targetRir?: number | null
  progressionRule?: string | null
  progressionParams?: string | Record<string, unknown> | null
  equipment?: string | null
  bodyPart?: string | null
  primaryMuscle?: string | null
  perSide?: boolean | number | null
  [key: string]: unknown
}

export interface BuildSessionInput {
  planId?: number | string | null
  planName?: string
  dayNumber?: number | null
  dayName?: string
  focus?: string
  exercises: DayExercise[]
  /** 历史窗口转成的档案；null/空数组 = 冷启动（无预填、无处方） */
  profile?: ProfileLike | null
  unit?: 'kg' | 'lb'
  startedAt?: number
}

// ── 小工具 ──────────────────────────────────────────────────────────────────

let uid = 0
const nid = (prefix: string): string => `${prefix}${++uid}`

const num = (v: unknown, fallback = 0): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

const str = (v: unknown): string => (v == null ? '' : String(v))

/** 展示用重量：62.5 保持、60.0 → 60、0 → 0 */
export function formatWeight(w: number): string {
  if (!Number.isFinite(w)) return '0'
  return String(Math.round(w * 100) / 100)
}

/** 次数区间文案："8-12" / "8" */
export function rangeText(ex: { repsMin: number; repsMax: number }): string {
  return ex.repsMin && ex.repsMax && ex.repsMin !== ex.repsMax
    ? `${ex.repsMin}-${ex.repsMax}`
    : String(ex.repsMax || ex.repsMin || 0)
}

/** 处方中文说明：{0}/{1} 占位符按参数填充 */
export function formatWhy(why: Prescription['why']): string {
  if (!Array.isArray(why) || !why.length) return ''
  const [tpl, ...args] = why
  return String(tpl).replace(/\{(\d+)\}/g, (m, i) => {
    const v = args[Number(i)]
    return v == null ? m : String(v)
  })
}

/** 规则参数 JSON → 对象（后端并存 JSON 字符串与对象两种形态） */
export function parseParams(raw: unknown): Record<string, unknown> {
  if (raw == null || raw === '') return {}
  if (typeof raw === 'object') return raw as Record<string, unknown>
  try {
    const parsed = JSON.parse(String(raw))
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

/** 计划规则值归一：未知值回落 linear（与旧计划 NULL 的兼容约定一致） */
export function normalizePolicy(raw: unknown): string {
  const v = str(raw).trim().toLowerCase()
  return ['off', 'linear', 'greyskull', 'double', 'triple', 'time'].includes(v) ? v : 'linear'
}

/** 自重判定：器械为空或为 body weight / 自重 */
export function isBodyweight(equipment: unknown): boolean {
  const eq = str(equipment).trim().toLowerCase()
  return !eq || eq === 'body weight' || eq === 'bodyweight' || eq === 'self' || eq === '自重'
}

const isPerSideValue = (v: unknown): boolean => v === true || Number(v) === 1

// ── 历史读取 ────────────────────────────────────────────────────────────────

/** 条目的例程 id（与 progression.ts 的 entryRoutineId 同语义） */
function routineIdOf(w: Record<string, unknown>, e: EntryLike): string | null {
  return str((e.rid as string) || (e.routineId as string) || (w.routineId as string)) || null
}

interface LastRow {
  weight: number
  reps: number
  sides: { L: GuidedSide; R: GuidedSide } | null
}

/** 把引擎 SetLike 还原成训练台可编辑的一行（单侧合并为左右） */
function rowOfSet(s: SetLike): LastRow {
  if (s.sides && (s.sides.L || s.sides.R)) {
    const L = s.sides.L || {}
    const R = s.sides.R || {}
    return {
      weight: Math.max(num(L.w), num(R.w)),
      reps: num(L.r) + num(R.r),
      sides: {
        L: { weight: num(L.w), reps: num(L.r), done: !!L.done },
        R: { weight: num(R.w), reps: num(R.r), done: !!R.done },
      },
    }
  }
  return { weight: num(s.w), reps: num(s.r), sides: null }
}

/**
 * 上次该动作完成的组（最旧→最新；取最近一次有完成组的训练）。
 * 计划 id 存在时优先取"本计划自己的训练"，与引擎 sessionsFor 的过滤一致；
 * 本计划还没有记录时回落全部历史。
 */
export function lastRowsOf(
  S: ProfileLike | null | undefined,
  exerciseId: number | string | null,
  planId?: number | string | null,
): LastRow[] {
  if (!S || exerciseId == null) return []
  const id = String(exerciseId)
  const rid = planId == null || planId === '' ? null : String(planId)
  const workouts = (S.workouts || []) as Array<Record<string, unknown>>
  const scan = (matchRoutine: boolean): LastRow[] => {
    for (let i = workouts.length - 1; i >= 0; i--) {
      const w = workouts[i]
      const entry = ((w.entries as EntryLike[]) || []).find(e => e && String(e.id) === id)
      if (!entry) continue
      if (matchRoutine && rid && routineIdOf(w, entry) !== rid) continue
      const rows = ((entry.sets as SetLike[]) || [])
        .filter(s => s && s.done && !isWarmupRow(s))
        .map(rowOfSet)
      if (rows.length) return rows
    }
    return []
  }
  const own = rid ? scan(true) : []
  return own.length ? own : scan(false)
}

// ── 处方 → 组行 ─────────────────────────────────────────────────────────────

function buildPrescription(
  S: ProfileLike | null | undefined,
  ex: DayExercise,
  cfg: Record<string, unknown>,
  policy: string,
  planId: number | string | null,
): { p: Prescription; view: PrescriptionView } {
  const routine = planId == null ? null : { id: String(planId), prog: policy }
  const p = nextPrescription((S || {}) as ProfileLike, { ...cfg, prog: policy }, routine)
  const weight = p.weight == null ? null : Math.max(0, p.weight)
  const repsTitle = rangeText({
    repsMin: num(cfg.repsMin),
    repsMax: num(cfg.reps),
  })
  const load = weight != null && weight > 0
    ? `${formatWeight(weight)}${(S?.unit as string) || 'kg'}`
    : isBodyweight(ex.equipment) ? '自重' : '建立基线'
  return {
    p,
    view: {
      kind: p.kind,
      policy,
      weight,
      reps: p.reps == null ? null : Math.round(p.reps),
      sets: p.sets == null ? null : Math.round(p.sets),
      title: `建议 ${load} × ${repsTitle}`,
      detail: formatWhy(p.why),
    },
  }
}

/** 动作的计划配置（喂给引擎的 cfg，必须能独立重建——下一课建议也用它） */
export function configOf(ex: GuidedExercise | DayExercise): Record<string, unknown> {
  const params = parseParams(
    (ex as GuidedExercise).params ?? (ex as DayExercise).progressionParams,
  )
  const repsRaw = (ex as GuidedExercise).targetReps ?? (ex as DayExercise).targetReps ?? (ex as DayExercise).reps
  const range = parseRepRange(repsRaw)
  const policy = normalizePolicy((ex as GuidedExercise).policy ?? (ex as DayExercise).progressionRule)
  const targetSets = Math.max(1, num(
    (ex as GuidedExercise).targetSets ?? (ex as DayExercise).targetSets ?? (ex as DayExercise).sets,
    3,
  ))
  const equipment = str((ex as GuidedExercise).equipment ?? (ex as DayExercise).equipment)
  const bodyPart = str((ex as GuidedExercise).bodyPart ?? (ex as DayExercise).bodyPart)
  const perSide = (ex as GuidedExercise).perSide !== undefined
    ? !!(ex as GuidedExercise).perSide
    : isPerSideValue((ex as DayExercise).perSide)
  const id = (ex as GuidedExercise).exerciseId ?? (ex as DayExercise).exerciseId
  const cfg: Record<string, unknown> = {
    id: id == null ? undefined : String(id),
    sets: targetSets,
    reps: range.reps ?? num(params.reps, 8),
    repsMin: range.repsMin ?? range.reps ?? num(params.reps, 8),
    prog: policy,
    mode: str(params.mode) || 'reps',
    side: perSide,
    eq: equipment || undefined,
    bp: bodyPart || undefined,
    assisted: !!params.assisted,
    bodyweight: isBodyweight(equipment),
    setsMax: params.setsMax == null ? undefined : num(params.setsMax),
    inc: params.inc == null ? undefined : num(params.inc),
    weight: params.weight == null ? 0 : num(params.weight),
    deloadFactor: params.deloadFactor,
  }
  return cfg
}

/** 单组行的初始值（单侧：左右相同） */
function makeRow(
  setNumber: number,
  weight: number,
  reps: number,
  perSide: boolean,
  prefilled: boolean,
  type: SetType = 'normal',
  sides?: { L: GuidedSide; R: GuidedSide } | null,
): GuidedRow {
  return {
    key: nid('row'),
    setNumber,
    type,
    weight,
    reps,
    rir: null,
    done: false,
    sides: perSide
      ? sides || {
        L: { weight, reps, done: false },
        R: { weight, reps, done: false },
      }
      : null,
    isPr: false,
    prTypes: [],
    prefilled,
  }
}

/** 一个动作的组行：优先"上次的组"，重量用处方值覆盖；无历史时用目标组数 */
function rowsFor(
  p: Prescription,
  targetSets: number,
  lastRows: LastRow[],
  perSide: boolean,
  fallbackReps: number,
): GuidedRow[] {
  const count = Math.max(1, Math.round(num(p.sets, targetSets)))
  const suggested = p.weight == null ? null : Math.max(0, p.weight)
  const rows: GuidedRow[] = []
  for (let i = 0; i < count; i++) {
    const prev = lastRows[i]
    const weight = suggested != null ? suggested : prev ? prev.weight : 0
    const reps = prev
      ? prev.reps
      : Math.max(1, Math.round(num(p.reps, fallbackReps)))
    const sides = perSide && prev && prev.sides
      ? {
        L: { ...prev.sides.L, weight, done: false },
        R: { ...prev.sides.R, weight, done: false },
      }
      : null
    rows.push(makeRow(
      i + 1, weight, reps, perSide,
      !!prev || suggested != null,
      'normal', sides,
    ))
  }
  return rows
}

// ── 会话构建 ────────────────────────────────────────────────────────────────

/** 计划目标附到历史条目上但不改动入参档案（attachTargets 会原地写 entry.target） */
function profileWithTargets(
  S: ProfileLike | null | undefined,
  configs: Record<string, PlanTargetConfig>,
): ProfileLike | null {
  if (!S) return null
  const judged: ProfileLike = {
    ...S,
    workouts: (S.workouts || []).map(w => ({
      ...w,
      entries: (w.entries || []).map(e => ({ ...e })),
    })),
  }
  attachTargets(judged, configs)
  return judged
}

/** 由计划训练日 + 历史档案构建一次训练会话 */
export function buildSession(input: BuildSessionInput): GuidedSession {
  const profile = input.profile || null
  const planId = input.planId ?? null
  const unit = input.unit === 'lb' ? 'lb' : 'kg'

  // 计划目标附到历史条目上，引擎才能按"当前计划"判读过去训练
  let judged: ProfileLike | null = null
  if (profile) {
    const configs: Record<string, PlanTargetConfig> = {}
    for (const ex of input.exercises || []) {
      const id = ex.exerciseId
      if (id == null) continue
      const range = parseRepRange(ex.targetReps ?? ex.reps)
      const config: PlanTargetConfig = {
        sets: Math.max(1, num(ex.targetSets ?? ex.sets, 3)),
        reps: range.reps ?? null,
        rir: ex.targetRir ?? null,
        prog: normalizePolicy(ex.progressionRule),
        side: isPerSideValue(ex.perSide),
        eq: ex.equipment ?? null,
      }
      if (range.repsMin != null) config.repsMin = range.repsMin
      configs[String(id)] = config
    }
    judged = profileWithTargets(profile, configs)
  }

  const exercises: GuidedExercise[] = []
  for (const ex of input.exercises || []) {
    const cfg = configOf(ex)
    const policy = normalizePolicy(cfg.prog)
    const targetSets = Math.max(1, Math.round(num(cfg.sets, 3)))
    const perSide = !!cfg.side
    const exerciseId = ex.exerciseId ?? null
    const lastRows = lastRowsOf(profile, exerciseId, planId)
    const { p, view } = buildPrescription(judged, ex, cfg, policy, planId)
    const last = lastRows.length
      ? {
        weight: Math.max(...lastRows.map(r => r.weight)),
        reps: Math.max(...lastRows.map(r => r.reps)),
        sets: lastRows.length,
      }
      : null

    exercises.push({
      key: nid('ex'),
      planExerciseId: ex.id ?? null,
      exerciseId,
      name: str(ex.exerciseName || ex.name) || '未命名动作',
      targetSets,
      targetReps: str(ex.targetReps ?? ex.reps),
      repsMin: num(cfg.repsMin, num(cfg.reps, 8)),
      repsMax: num(cfg.reps, num(cfg.repsMin, 8)),
      restSeconds: Math.max(0, num(ex.restSeconds, 90)) || 90,
      notes: str(ex.notes),
      perSide,
      equipment: str(ex.equipment),
      bodyPart: str(ex.bodyPart),
      primaryMuscle: str(ex.primaryMuscle),
      policy,
      params: parseParams(ex.progressionParams),
      prescription: view,
      last,
      rows: rowsFor(
        p, targetSets, lastRows, perSide,
        // 冷启动从区间底起步（8-12 → 8），避免一上手就按区间顶要求自己
        num(cfg.repsMin, num(cfg.reps, 8)),
      ),
    })
  }

  return {
    v: 1,
    planId,
    planName: str(input.planName) || '训练',
    dayNumber: input.dayNumber ?? null,
    dayName: str(input.dayName),
    focus: str(input.focus),
    startedAt: input.startedAt ?? Date.now(),
    unit,
    exercises,
  }
}

// ── 组行操作（全部返回新会话，便于草稿与撤销） ──────────────────────────────

function withExercise(
  session: GuidedSession,
  exKey: string,
  fn: (ex: GuidedExercise) => GuidedExercise,
): GuidedSession {
  return {
    ...session,
    exercises: session.exercises.map(ex => (ex.key === exKey ? fn(ex) : ex)),
  }
}

export function findExercise(session: GuidedSession, exKey: string): GuidedExercise | null {
  return session.exercises.find(ex => ex.key === exKey) || null
}

export function findRow(session: GuidedSession, exKey: string, rowKey: string): GuidedRow | null {
  const ex = findExercise(session, exKey)
  return (ex && ex.rows.find(r => r.key === rowKey)) || null
}

const renumber = (rows: GuidedRow[]): GuidedRow[] =>
  rows.map((r, i) => ({ ...r, setNumber: i + 1 }))

/** 改重量/次数/RIR（用户输入 → 不再是"上次"预填值） */
export function updateRow(
  session: GuidedSession,
  exKey: string,
  rowKey: string,
  patch: Partial<Pick<GuidedRow, 'weight' | 'reps' | 'rir' | 'type'>>,
): GuidedSession {
  return withExercise(session, exKey, ex => ({
    ...ex,
    rows: ex.rows.map(r => {
      if (r.key !== rowKey) return r
      const weight = patch.weight == null ? r.weight : Math.max(0, num(patch.weight, r.weight))
      const reps = patch.reps == null ? r.reps : Math.max(0, Math.round(num(patch.reps, r.reps)))
      const next: GuidedRow = {
        ...r,
        ...(patch.weight == null ? {} : { weight }),
        ...(patch.reps == null ? {} : { reps }),
        ...(patch.rir === undefined ? {} : { rir: patch.rir }),
        ...(patch.type == null ? {} : { type: patch.type }),
      }
      if (patch.weight != null || patch.reps != null) next.prefilled = false
      // 单侧：行级数值同步到未完成的一侧（保持左右一致的用户预期）
      if (next.sides) {
        next.sides = {
          L: { ...next.sides.L, weight, reps },
          R: { ...next.sides.R, weight, reps },
        }
      }
      return next
    }),
  }))
}

/** 改单侧一侧的重量/次数 */
export function updateSide(
  session: GuidedSession,
  exKey: string,
  rowKey: string,
  side: 'L' | 'R',
  patch: Partial<Pick<GuidedSide, 'weight' | 'reps'>>,
): GuidedSession {
  return withExercise(session, exKey, ex => ({
    ...ex,
    rows: ex.rows.map(r => {
      if (r.key !== rowKey || !r.sides) return r
      const cur = r.sides[side]
      const nextSide: GuidedSide = {
        ...cur,
        ...(patch.weight == null ? {} : { weight: Math.max(0, num(patch.weight, cur.weight)) }),
        ...(patch.reps == null ? {} : { reps: Math.max(0, Math.round(num(patch.reps, cur.reps))) }),
      }
      const sides = { ...r.sides, [side]: nextSide }
      return {
        ...r,
        sides,
        weight: Math.max(sides.L.weight, sides.R.weight),
        reps: sides.L.reps + sides.R.reps,
        prefilled: false,
      }
    }),
  }))
}

/** 完成/取消一组。单侧动作两侧同时落定（同一组的两肢一起完成） */
export function setRowDone(
  session: GuidedSession,
  exKey: string,
  rowKey: string,
  done: boolean,
): GuidedSession {
  return withExercise(session, exKey, ex => ({
    ...ex,
    rows: ex.rows.map(r => {
      if (r.key !== rowKey) return r
      if (!r.sides) return { ...r, done }
      return {
        ...r,
        done,
        sides: {
          L: { ...r.sides.L, done },
          R: { ...r.sides.R, done },
        },
      }
    }),
  }))
}

/** 单侧组单独落定一侧；两侧都完成时整组完成 */
export function setSideDone(
  session: GuidedSession,
  exKey: string,
  rowKey: string,
  side: 'L' | 'R',
  done: boolean,
): GuidedSession {
  return withExercise(session, exKey, ex => ({
    ...ex,
    rows: ex.rows.map(r => {
      if (r.key !== rowKey || !r.sides) return r
      const sides = { ...r.sides, [side]: { ...r.sides[side], done } }
      return { ...r, sides, done: sides.L.done && sides.R.done }
    }),
  }))
}

/** 新增一组（复制最后一组的数值，未完成） */
export function addRow(session: GuidedSession, exKey: string): GuidedSession {
  return withExercise(session, exKey, ex => {
    const last = ex.rows[ex.rows.length - 1]
    const weight = last ? last.weight : 0
    const reps = last ? last.reps : ex.repsMin
    const sides = ex.perSide && last && last.sides
      ? {
        L: { ...last.sides.L, done: false },
        R: { ...last.sides.R, done: false },
      }
      : null
    const row = makeRow(ex.rows.length + 1, weight, reps, ex.perSide, !!last, 'normal', sides)
    return { ...ex, rows: renumber([...ex.rows, row]) }
  })
}

/** 复制某一组（插入到它后面）— A4.9 右滑复制 */
export function duplicateRow(session: GuidedSession, exKey: string, rowKey: string): GuidedSession {
  return withExercise(session, exKey, ex => {
    const idx = ex.rows.findIndex(r => r.key === rowKey)
    if (idx < 0) return ex
    const src = ex.rows[idx]
    const copy = makeRow(
      0, src.weight, src.reps, ex.perSide, true, src.type,
      src.sides
        ? {
          L: { ...src.sides.L, done: false },
          R: { ...src.sides.R, done: false },
        }
        : null,
    )
    const rows = [...ex.rows]
    rows.splice(idx + 1, 0, copy)
    return { ...ex, rows: renumber(rows) }
  })
}

/** 删除一组 — A4.8 左滑删除（调用方保留旧会话做 5 秒撤销） */
export function removeRow(session: GuidedSession, exKey: string, rowKey: string): GuidedSession {
  return withExercise(session, exKey, ex => ({
    ...ex,
    rows: renumber(ex.rows.filter(r => r.key !== rowKey)),
  }))
}

/** 切换动作的单侧记录（页头开关） */
export function setPerSide(session: GuidedSession, exKey: string, perSide: boolean): GuidedSession {
  return withExercise(session, exKey, ex => ({
    ...ex,
    perSide,
    rows: ex.rows.map(r => ({
      ...r,
      sides: perSide
        ? r.sides || {
          L: { weight: r.weight, reps: r.reps, done: r.done },
          R: { weight: r.weight, reps: r.reps, done: r.done },
        }
        : null,
    })),
  }))
}

/** 切换组类型（正式/热身/递减/停歇/力竭） */
export function setRowType(
  session: GuidedSession,
  exKey: string,
  rowKey: string,
  type: SetType,
): GuidedSession {
  return updateRow(session, exKey, rowKey, { type })
}

// ── 汇总 ────────────────────────────────────────────────────────────────────

/** 一组对容量的贡献：热身不计；单侧取两侧次数之和 */
export function rowVolume(row: GuidedRow): number {
  if (row.type === 'warmup' || !row.done) return 0
  if (row.sides) {
    return row.sides.L.weight * row.sides.L.reps + row.sides.R.weight * row.sides.R.reps
  }
  return row.weight * row.reps
}

export interface SessionTotals {
  exerciseCount: number
  doneExerciseCount: number
  totalSets: number
  doneSets: number
  /** 总容量 kg（正式组） */
  volume: number
  /** 已完成动作列表（名称 + 组数） */
  done: Array<{ name: string; sets: number; volume: number }>
}

export function sessionTotals(session: GuidedSession): SessionTotals {
  let totalSets = 0
  let doneSets = 0
  let volume = 0
  const done: SessionTotals['done'] = []
  for (const ex of session.exercises) {
    totalSets += ex.rows.length
    const exDone = ex.rows.filter(r => r.done)
    doneSets += exDone.length
    const exVolume = ex.rows.reduce((sum, r) => sum + rowVolume(r), 0)
    volume += exVolume
    if (exDone.length) {
      done.push({ name: ex.name, sets: exDone.length, volume: Math.round(exVolume * 10) / 10 })
    }
  }
  return {
    exerciseCount: session.exercises.length,
    doneExerciseCount: done.length,
    totalSets,
    doneSets,
    volume: Math.round(volume * 10) / 10,
    done,
  }
}

/** 是否已经练过（用于"退出是否存草稿"） */
export const hasWork = (session: GuidedSession | null | undefined): boolean =>
  !!session && session.exercises.some(ex => ex.rows.some(r => r.done))

// ── PR 即时判定 ─────────────────────────────────────────────────────────────

interface Baseline {
  e1rm: number
  reps: number
  volume: number
}

const EMPTY_BASELINE: Baseline = { e1rm: 0, reps: 0, volume: 0 }

/** 历史最佳基线：只有带负重的完成组才计入（与后端 PR 检测口径一致） */
export function prBaselineOf(
  S: ProfileLike | null | undefined,
  exerciseId: number | string | null,
): Baseline | null {
  if (!S || exerciseId == null) return null
  const id = String(exerciseId)
  const base: Baseline = { ...EMPTY_BASELINE }
  let found = false
  for (const w of S.workouts || []) {
    for (const e of w.entries || []) {
      if (!e || String(e.id) !== id) continue
      for (const s of e.sets || []) {
        if (!s || !s.done || isWarmupRow(s)) continue
        for (const m of metricsOfSet(s)) {
          if (m.weight <= 0) continue
          found = true
          if (m.e1rm > base.e1rm) base.e1rm = m.e1rm
          if (m.reps > base.reps) base.reps = m.reps
          if (m.volume > base.volume) base.volume = m.volume
        }
      }
    }
  }
  return found ? base : null
}

interface SetMetrics {
  weight: number
  reps: number
  e1rm: number
  volume: number
}

/** 一个引擎组 → 指标（单侧拆成左右分别计） */
function metricsOfSet(s: SetLike): SetMetrics[] {
  if (s.sides && (s.sides.L || s.sides.R)) {
    const out: SetMetrics[] = []
    for (const side of [s.sides.L, s.sides.R]) {
      if (!side || !side.done) continue
      const weight = num(side.w)
      const reps = Math.round(num(side.r))
      const est = weight > 0 && reps > 0 ? estimate1RM(weight, reps, 'epley') : null
      out.push({
        weight,
        reps,
        e1rm: est == null ? 0 : est,
        volume: weight * reps,
      })
    }
    return out
  }
  const weight = num(s.w)
  const reps = Math.round(num(s.r))
  const est = weight > 0 && reps > 0 ? estimate1RM(weight, reps, 'epley') : null
  return [{ weight, reps, e1rm: est == null ? 0 : est, volume: weight * reps }]
}

function metricsOfRow(row: GuidedRow): SetMetrics {
  if (row.sides) {
    const sides = [row.sides.L, row.sides.R]
      .filter(() => row.done)
      .map(side => {
        const est = side.weight > 0 && side.reps > 0
          ? estimate1RM(side.weight, side.reps, 'epley')
          : null
        return {
          weight: side.weight,
          reps: Math.round(side.reps),
          e1rm: est == null ? 0 : est,
          volume: side.weight * side.reps,
        }
      })
    const best = sides.reduce<SetMetrics>(
      (acc, m) => (m.e1rm > acc.e1rm ? m : acc),
      { weight: 0, reps: 0, e1rm: 0, volume: 0 },
    )
    const volume = sides.reduce((sum, m) => sum + m.volume, 0)
    return { ...best, volume: Math.round(volume * 10) / 10 }
  }
  const est = row.weight > 0 && row.reps > 0
    ? estimate1RM(row.weight, row.reps, 'epley')
    : null
  return {
    weight: row.weight,
    reps: Math.round(row.reps),
    e1rm: est == null ? 0 : est,
    volume: row.weight * row.reps,
  }
}

/**
 * 给每行打 PR 标记（A4.7）。
 *
 * 口径与后端 exercise_pr 一致：1RM 用 Epley 估计、最大次数、单组容量，均需有负重。
 * 逐行按顺序推进基线，故"本次训练里更重的一组"同样能即时提示；历史为空时
 * 一律不打标（首次训练每组都"破纪录"只会制造噪音，首次纪录交给后端入库）。
 */
export function annotatePrs(
  session: GuidedSession,
  S: ProfileLike | null | undefined,
): GuidedSession {
  return {
    ...session,
    exercises: session.exercises.map(ex => {
      const baseline = prBaselineOf(S, ex.exerciseId)
      if (!baseline) {
        return { ...ex, rows: ex.rows.map(r => ({ ...r, isPr: false, prTypes: [] })) }
      }
      const base: Baseline = { ...baseline }
      const rows = ex.rows.map(row => {
        if (!row.done || row.type === 'warmup') {
          return { ...row, isPr: false, prTypes: [] as PrType[] }
        }
        const m = metricsOfRow(row)
        const types: PrType[] = []
        if (m.weight > 0) {
          if (m.e1rm > base.e1rm) {
            types.push('1rm')
            base.e1rm = m.e1rm
          }
          if (m.reps > base.reps) {
            types.push('max_reps')
            base.reps = m.reps
          }
          if (m.volume > base.volume) {
            types.push('max_volume')
            base.volume = m.volume
          }
        }
        return { ...row, isPr: types.length > 0, prTypes: types }
      })
      return { ...ex, rows }
    }),
  }
}

/** 本次训练中产生的 PR（完成页汇总） */
export function sessionPrs(session: GuidedSession): Array<{
  exerciseName: string
  setNumber: number
  types: PrType[]
  weight: number
  reps: number
  e1rm: number
}> {
  const out: Array<{
    exerciseName: string
    setNumber: number
    types: PrType[]
    weight: number
    reps: number
    e1rm: number
  }> = []
  for (const ex of session.exercises) {
    for (const row of ex.rows) {
      if (!row.isPr || !row.prTypes.length) continue
      const m = metricsOfRow(row)
      out.push({
        exerciseName: ex.name,
        setNumber: row.setNumber,
        types: row.prTypes.slice(),
        weight: row.weight,
        reps: row.reps,
        e1rm: Math.round(m.e1rm * 10) / 10,
      })
    }
  }
  return out
}

// ── 保存载荷 ────────────────────────────────────────────────────────────────

/** 后端 workout_exercise_detail 的一行 */
export interface DetailRow {
  exerciseId: number | string | null
  exerciseName: string
  planExerciseId: number | string | null
  setNumber: number
  setType: SetType
  weightKg: number
  actualReps: number
  rir: number | null
  perSide: number
  isCompleted: number
  sortOrder: number
  targetReps: string
}

/**
 * 会话 → POST /api/workouts/{id}/details 的数组。
 *
 * 只提交已完成的组：引擎把"未完成的组"读作失误，而用户中途放弃的组不该被判成
 * 训练失败；缺组由"组数不足"自然表达。单侧动作按后端约定拆成左/右两行
 * （同一 setNumber，先 L 后 R，sortOrder 递增）。
 */
export function toDetailRows(session: GuidedSession): DetailRow[] {
  const out: DetailRow[] = []
  let sort = 0
  for (const ex of session.exercises) {
    for (const row of ex.rows) {
      if (!row.done) continue
      if (row.sides) {
        for (const side of ['L', 'R'] as const) {
          const s = row.sides[side]
          out.push({
            exerciseId: ex.exerciseId,
            exerciseName: ex.name,
            planExerciseId: ex.planExerciseId,
            setNumber: row.setNumber,
            setType: row.type,
            weightKg: s.weight,
            actualReps: Math.round(s.reps),
            rir: row.rir,
            perSide: 1,
            isCompleted: 1,
            sortOrder: ++sort,
            targetReps: ex.targetReps,
          })
        }
        continue
      }
      out.push({
        exerciseId: ex.exerciseId,
        exerciseName: ex.name,
        planExerciseId: ex.planExerciseId,
        setNumber: row.setNumber,
        setType: row.type,
        weightKg: row.weight,
        actualReps: Math.round(row.reps),
        rir: row.rir,
        perSide: 0,
        isCompleted: 1,
        sortOrder: ++sort,
        targetReps: ex.targetReps,
      })
    }
  }
  return out
}

/** 训练记录本体（POST /api/workouts/record） */
export interface WorkoutRecordPayload {
  name: string
  workoutDate: string
  startTime: string
  endTime: string
  durationMinutes: number
  volume: number
  exerciseCount: number
  planId: number | string | null
  dayNumber: number | null
  trainingType: string
  status: string
}

const pad = (n: number): string => String(n).padStart(2, '0')

/** 时间戳 → 'YYYY-MM-DD HH:mm:ss'（本地时区，后端 @JsonFormat 口径） */
export function dateTimeOf(ts: number): string {
  const d = new Date(ts)
  return `${isoOf(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function toRecordPayload(
  session: GuidedSession,
  opts: { now?: number; workoutDate?: string; name?: string } = {},
): WorkoutRecordPayload {
  const now = opts.now ?? Date.now()
  const totals = sessionTotals(session)
  const start = session.startedAt || now
  const minutes = Math.max(1, Math.round((now - start) / 60000))
  return {
    name: opts.name
      || `${session.planName}${session.dayName ? ' · ' + session.dayName : ''}`,
    workoutDate: opts.workoutDate || isoOf(new Date(now)),
    startTime: dateTimeOf(start),
    endTime: dateTimeOf(now),
    durationMinutes: minutes,
    volume: totals.volume,
    exerciseCount: totals.doneExerciseCount,
    planId: session.planId,
    dayNumber: session.dayNumber,
    trainingType: session.focus || session.dayName,
    status: '已完成',
  }
}

// ── 完成后的下一课建议 ──────────────────────────────────────────────────────

/** 会话 → 引擎条目（保存后并入档案，供下一课预览） */
export function sessionEntry(ex: GuidedExercise): EntryLike {
  const sets: SetLike[] = ex.rows
    .filter(r => r.done)
    .map(r => {
      if (r.sides) {
        const side = (s: GuidedSide): Record<string, unknown> => ({
          w: s.weight, r: s.reps, done: s.done,
        })
        return {
          sides: { L: side(r.sides.L), R: side(r.sides.R) },
          w: Math.max(r.sides.L.weight, r.sides.R.weight),
          r: r.sides.L.reps + r.sides.R.reps,
          done: true,
          type: r.type,
          ...(r.rir == null ? {} : { rir: r.rir }),
          ...(r.type === 'warmup' ? { phase: 'warmup' } : {}),
        } as SetLike
      }
      return {
        w: r.weight,
        r: r.reps,
        done: true,
        type: r.type,
        ...(r.rir == null ? {} : { rir: r.rir }),
        ...(r.type === 'warmup' ? { phase: 'warmup' } : {}),
      } as SetLike
    })
  return {
    id: ex.exerciseId == null ? undefined : String(ex.exerciseId),
    name: ex.name,
    target: {
      mode: 'reps',
      side: ex.perSide,
      sets: ex.targetSets,
      reps: ex.repsMax,
      repsMin: ex.repsMin,
    },
    sets,
  }
}

/** 把本次会话并入档案（返回新档案；不修改入参） */
export function withSessionProfile(
  S: ProfileLike | null | undefined,
  session: GuidedSession,
  now: number = Date.now(),
): ProfileLike {
  const d = isoOf(new Date(now))
  const workout: Record<string, unknown> = {
    d,
    start: session.startedAt || now,
    entries: session.exercises
      .filter(ex => ex.rows.some(r => r.done))
      .map(sessionEntry),
  }
  if (session.planId != null) {
    workout.planId = session.planId
    workout.routineId = String(session.planId)
  }
  const base: ProfileLike = { workouts: (S?.workouts || []).map(w => ({ ...w })) }
  base.workouts = [...(base.workouts || []), workout]
  return base
}

/**
 * 下一课建议摘要（A4.10）：把本次会话并入档案后重新跑一遍引擎，
 * 每个动作给一句"下次练什么"。
 */
export function nextSuggestions(
  session: GuidedSession,
  S: ProfileLike | null | undefined,
  limit = 3,
): Array<{ name: string; text: string; kind: Prescription['kind'] }> {
  const merged = withSessionProfile(S, session)
  const out: Array<{ name: string; text: string; kind: Prescription['kind'] }> = []
  for (const ex of session.exercises) {
    if (!ex.rows.some(r => r.done)) continue
    const cfg = configOf(ex)
    const routine = session.planId == null ? null : { id: String(session.planId), prog: ex.policy }
    const p = nextPrescription(merged, { ...cfg, prog: ex.policy }, routine)
    const load = p.weight != null && p.weight > 0
      ? `${formatWeight(p.weight)}${session.unit}`
      : isBodyweight(ex.equipment) ? '自重' : '计划重量'
    const reps = p.reps != null ? `${p.reps} 次` : `${ex.repsMin}-${ex.repsMax} 次`
    out.push({
      name: ex.name,
      text: `${load} × ${reps}`,
      kind: p.kind,
    })
    if (out.length >= limit) break
  }
  return out
}

/** 组行的步长（器械增量，公斤网格） */
export function stepOf(ex: Pick<GuidedExercise, 'equipment' | 'bodyPart'>, unit: 'kg' | 'lb' = 'kg'): number {
  return weightIncrement({ eq: ex.equipment, bp: ex.bodyPart }, unit)
}
