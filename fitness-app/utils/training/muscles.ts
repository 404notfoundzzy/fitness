// 肌肉映射与训练量（Muscle mapping & volume）
//
// 移植自 openGym（AGPL-3.0）frontend/src/lib/muscles.js，上游 commit e348fc1。
// 上游依赖（workout-model / exercises / format / queue / history）以本地
// model.ts 最小实现替代；ALIAS / BY_BODYPART / SECONDARY 权重等数据逐条一致。
//
// 动作库数据集中肌肉命名自由文本且不一致（shoulders/deltoids/delts 同物，
// quads/quadriceps 同物），19 个主肌肉与 40 个次要拼写经 ALIAS 折叠为人体图
// 可绘制的 18 个肌肉； genuinely 不可绘的（hands/ankles/cardiovascular）映射为
// null 并丢弃而非猜测。

import {
  isWarmupRow, workoutAt, weekKey, isoOf, MONDAY, todayISO,
  type EntryLike, type ProfileLike, type WorkoutLike,
} from './model'

/** 人体图可着色的肌肉，头到脚顺序——也是由此构建的任何列表的顺序 */
export const MUSCLES = [
  'trapezius', 'deltoids', 'chest', 'upper-back', 'serratus',
  'biceps', 'triceps', 'forearm',
  'abs', 'obliques', 'lower-back',
  'gluteal', 'quadriceps', 'hamstring', 'adductors', 'hip-flexors',
  'calves', 'tibialis',
] as const

export type MuscleSlug = typeof MUSCLES[number]

/** 按人体图自身顺序排列所选列表，而非点击顺序 */
export const inMuscleOrder = (list: readonly string[]): string[] => {
  const at = (m: string) => { const i = MUSCLES.indexOf(m as never); return i < 0 ? MUSCLES.length : i }
  return [...(list || [])].sort((a, b) => at(a) - at(b))
}

/** 只画轮廓、永不着色：不承载训练负荷 */
export const INERT = ['head', 'hair', 'neck', 'hands', 'feet', 'knees', 'ankles']

/** 中文显示名（上游为 i18n key，此处直接中文化） */
export const MUSCLE_NAME: Record<string, string> = {
  trapezius: '斜方肌', deltoids: '三角肌', chest: '胸大肌', 'upper-back': '上背部',
  serratus: '前锯肌', biceps: '肱二头肌', triceps: '肱三头肌', forearm: '前臂',
  abs: '腹直肌', obliques: '腹斜肌', 'lower-back': '下背部', gluteal: '臀大肌',
  quadriceps: '股四头肌', hamstring: '腘绳肌', adductors: '内收肌',
  'hip-flexors': '髋屈肌', calves: '小腿肌', tibialis: '胫骨前肌',
  'cardiovascular system': '心血管',
}

/** 上游英文名保留备查 */
export const MUSCLE_NAME_EN: Record<string, string> = {
  trapezius: 'Traps', deltoids: 'Shoulders', chest: 'Chest', 'upper-back': 'Upper back',
  serratus: 'Serratus', biceps: 'Biceps', triceps: 'Triceps', forearm: 'Forearms',
  abs: 'Abs', obliques: 'Obliques', 'lower-back': 'Lower back', gluteal: 'Glutes',
  quadriceps: 'Quads', hamstring: 'Hamstrings', adductors: 'Adductors',
  'hip-flexors': 'Hip flexors', calves: 'Calves', tibialis: 'Shins',
  'cardiovascular system': 'cardiovascular system',
}

/** 动作库 tg/sm 字段中出现过的每种拼写。null = 不可绘制 */
const ALIAS: Record<string, string | null> = {
  // 主肌肉
  abs: 'abs', pectorals: 'chest', biceps: 'biceps', glutes: 'gluteal', delts: 'deltoids',
  triceps: 'triceps', 'upper back': 'upper-back', lats: 'upper-back', calves: 'calves',
  quads: 'quadriceps', forearms: 'forearm', hamstrings: 'hamstring', spine: 'lower-back',
  traps: 'trapezius', adductors: 'adductors', 'serratus anterior': 'serratus',
  abductors: 'gluteal', 'levator scapulae': 'trapezius', 'cardiovascular system': 'cardiovascular system',
  // 次要肌肉
  shoulders: 'deltoids', deltoids: 'deltoids', 'rear deltoids': 'deltoids',
  'rotator cuff': 'deltoids', quadriceps: 'quadriceps', core: 'abs', abdominals: 'abs',
  'lower abs': 'abs', chest: 'chest', 'upper chest': 'chest', 'hip flexors': 'hip-flexors',
  obliques: 'obliques', 'lower back': 'lower-back', rhomboids: 'upper-back',
  trapezius: 'trapezius', back: 'upper-back', 'latissimus dorsi': 'upper-back',
  brachialis: 'biceps', soleus: 'calves', shins: 'tibialis', wrists: 'forearm',
  'wrist flexors': 'forearm', 'wrist extensors': 'forearm', 'grip muscles': 'forearm',
  groin: 'adductors', 'inner thighs': 'adductors',
  ankles: null, feet: null, hands: null, 'ankle stabilizers': null,
  sternocleidomastoid: null,
}

/** 自定义动作只有身体部位，回退到它。组内权重和为 1——"upper legs" 摊到三个肌肉而非三倍计数 */
const BY_BODYPART: Record<string, Record<string, number>> = {
  chest: { chest: 1 },
  back: { 'upper-back': 0.75, 'lower-back': 0.25 },
  shoulders: { deltoids: 1 },
  'upper arms': { biceps: 0.5, triceps: 0.5 },
  'lower arms': { forearm: 1 },
  waist: { abs: 0.7, obliques: 0.3 },
  'upper legs': { quadriceps: 0.4, hamstring: 0.35, gluteal: 0.25 },
  'lower legs': { calves: 0.8, tibialis: 0.2 },
  neck: { trapezius: 1 },
  'full body': { chest: 0.2, 'upper-back': 0.2, gluteal: 0.2, quadriceps: 0.2, hamstring: 0.1, abs: 0.1 },
  cardio: {},
}

/** 次要肌肉对主肌肉的计成比例 */
const SECONDARY = 0.4

const arrayOf = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : value == null || value === '' ? [] : [value]

function firstPresent(object: Record<string, unknown> | null | undefined, keys: string[]): unknown {
  if (!object || typeof object !== 'object') return null
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(object, key)) return object[key]
  }
  return null
}

/**
 * 已完成的历史条目在其自定义动作从动作库删除后可能保留嵌套快照。当外层条目自身
 * 没有肌肉元数据时优先该快照，同时保持直接/旧式字段存在时的权威性。
 */
function metadataOf(ex: EntryLike | null | undefined): EntryLike {
  if (!ex || typeof ex !== 'object') return ex as EntryLike
  const DIRECT_KEYS = [
    'muscleGroups', 'muscles', 'targetMuscles', 'muscleWeights',
    'primaries', 'primaryMuscles', 'primary', 'secondaries', 'secondaryMuscles', 'secondary',
  ]
  const hasDirect = DIRECT_KEYS.some(key => Object.prototype.hasOwnProperty.call(ex, key))
    || [ex.tg, ex.mg, ...arrayOf(ex.sm)].some(value => value != null && value !== '')
  return !hasDirect && ex.muscleSnapshot && typeof ex.muscleSnapshot === 'object' && !Array.isArray(ex.muscleSnapshot)
    ? (ex.muscleSnapshot as unknown as EntryLike)
    : ex
}

function explicitPartsOf(ex: EntryLike): { primary: unknown[]; secondary: unknown[] } | null {
  if (!ex || typeof ex !== 'object') return null
  const primary = firstPresent(ex, ['primaries', 'primaryMuscles', 'primary'])
  const secondary = firstPresent(ex, ['secondaries', 'secondaryMuscles', 'secondary'])
  if (primary !== null || secondary !== null) return {
    primary: arrayOf(primary), secondary: arrayOf(secondary),
  }
  return null
}

function explicitGroupsOf(ex: EntryLike): unknown[] | null {
  if (!ex || typeof ex !== 'object') return null
  for (const key of ['muscleGroups', 'muscles', 'targetMuscles']) {
    if (Object.prototype.hasOwnProperty.call(ex, key)) {
      const groups = arrayOf(ex[key])
      return groups.length ? groups : null
    }
  }
  return null
}

/** 仅当动作库显式提供了肌肉组（而非身体部位回退）时为真 */
export function hasExplicitMuscleMetadata(entry: EntryLike | null | undefined): boolean {
  const ex = metadataOf(entry)
  if (!ex || typeof ex !== 'object') return false
  const parts = explicitPartsOf(ex)
  if (parts && [...parts.primary, ...parts.secondary].some(canonicalMuscle)) return true
  const groups = explicitGroupsOf(ex)
  if (groups && groups.some(canonicalMuscle)) return true
  return [ex.tg, ex.mg, ...arrayOf(ex.sm)].some(canonicalMuscle)
}

function canonicalMuscle(value: unknown): string | null {
  const name = String(value ?? '').toLowerCase().trim()
  if ((MUSCLES as readonly string[]).includes(name)) return name
  return ALIAS[name] ?? null
}

function canonicalUnique(values: unknown[]): string[] {
  const out: string[] = []
  for (const value of values || []) {
    const slug = canonicalMuscle(value)
    if (slug && !out.includes(slug)) out.push(slug)
  }
  return out
}

/** 规范化去重后的肌肉组，接受新主/次要数组与旧式字段 */
export function muscleGroupsOf(entry: EntryLike | null | undefined): string[] {
  const ex = metadataOf(entry)
  const parts = explicitPartsOf(ex)
  const explicit = explicitGroupsOf(ex)
  const useParts = !!parts && [...parts.primary, ...parts.secondary].some(canonicalMuscle)
  const source = useParts
    ? [...(parts as { primary: unknown[]; secondary: unknown[] }).primary, ...(parts as { primary: unknown[]; secondary: unknown[] }).secondary]
    : explicit || [ex?.tg, ex?.mg, ...arrayOf(ex?.sm)]
  const out = canonicalUnique(source)
  if (!out.length && !useParts) {
    canonicalUnique(Object.keys(BY_BODYPART[(ex as EntryLike)?.bp as string] || {})).forEach(slug => out.push(slug))
  }
  return out
}

export const normalizeMuscleGroups = muscleGroupsOf

/** 任一请求组匹配即为真；空请求是有意的不设限查询 */
export function matchesMuscleGroups(ex: EntryLike, requested: unknown): boolean {
  const wanted = arrayOf(requested).map(canonicalMuscle).filter(Boolean) as string[]
  if (!wanted.length) return true
  const groups = new Set(muscleGroupsOf(ex))
  return wanted.some(group => groups.has(group))
}

/** 完整肌肉权重元数据，含显式的零计成关联 */
export function muscleWeightsOf(ex: EntryLike | null | undefined): Record<string, number> {
  if (!ex) return {}
  const sourceEx = metadataOf(ex)
  if (sourceEx !== ex) return muscleWeightsOf(sourceEx)
  if (ex.muscleWeights && typeof ex.muscleWeights === 'object' && !Array.isArray(ex.muscleWeights)) {
    const snapshot: Record<string, number> = {}
    MUSCLES.forEach(slug => {
      const weight = Number((ex.muscleWeights as Record<string, number>)[slug])
      if (Number.isFinite(weight) && weight >= 0 && weight <= 1) snapshot[slug] = weight
    })
    if (Object.keys(snapshot).length) return snapshot
  }
  const out: Record<string, number> = {}
  const add = (name: unknown, w: number) => {
    const slug = canonicalMuscle(name)
    if (slug) out[slug] = Math.max(out[slug] || 0, w)
  }
  const parts = explicitPartsOf(ex)
  const explicit = explicitGroupsOf(ex)
  const useParts = !!parts && [...parts.primary, ...parts.secondary].some(canonicalMuscle)
  if (useParts && parts) {
    parts.primary.forEach(m => add(m, 1))
    parts.secondary.forEach(m => add(m, SECONDARY))
  } else if (explicit) explicit.forEach(m => add(m, 1))
  else {
    add(ex.tg, 1)
    add(ex.mg, SECONDARY)
    arrayOf(ex.sm).forEach(m => add(m, SECONDARY))
  }
  // 无可识别项（自定义动作或不可绘制的目标）——使用身体部位
  if (!Object.keys(out).length) Object.assign(out, BY_BODYPART[ex.bp as string] || {})
  return out
}

/** 一个动作训练的肌肉：仅正的有效刺激 */
export function musclesOf(ex: EntryLike | null | undefined): Record<string, number> {
  return Object.fromEntries(Object.entries(muscleWeightsOf(ex)).filter(([, weight]) => weight > 0))
}

/** 将显示与加权肌肉元数据快照进已完成的历史条目 */
export function exerciseMuscleSnapshot(ex: EntryLike): Record<string, unknown> {
  if (!ex || typeof ex !== 'object') return {}
  const out: Record<string, unknown> = {}
  if (ex.n != null) out.n = ex.n
  if (ex.bp != null) out.bp = ex.bp
  const weights = muscleWeightsOf(ex)
  if (Object.keys(weights).length) out.muscleWeights = { ...weights }
  const parts = explicitPartsOf(ex)
  if (parts) {
    const primaries = canonicalUnique(parts.primary)
    const secondaries = canonicalUnique(parts.secondary).filter(slug => !primaries.includes(slug))
    if (primaries.length) out.primaries = primaries
    if (secondaries.length) out.secondaries = secondaries
  }
  if (hasExplicitMuscleMetadata(ex)) out.muscleGroups = [...muscleGroupsOf(ex)]
  return out
}

/** 历史条目或动作库引用的肌肉数据来源（上游 loadOf 的 EXIDX 优先语义） */
function sourceOf(item: { id?: string; ex?: EntryLike; exercise?: EntryLike; [k: string]: unknown }, index?: Record<string, EntryLike>): EntryLike {
  const historical = item.ex || item.exercise
  const byId = item.id && index ? index[item.id] : undefined
  return (historical?.muscleWeights ? historical : (byId || historical || item)) as EntryLike
}

/**
 * 每肌肉的训练负荷，单位为"有效组数"。
 * items 为 [{ id, sets }]——sets 为计数，4×8 卧推的重量是单组的四倍。
 * 刻意不使用公斤数：100 kg 腿举对 12 kg 侧平举说明不了哪块肌肉工作更辛苦。
 */
export function loadOf(items: Array<{ id?: string; ex?: EntryLike; exercise?: EntryLike; sets?: number; [k: string]: unknown }>, index?: Record<string, EntryLike>): Record<string, number> {
  const load: Record<string, number> = {}
  items.forEach(item => {
    const { sets } = item || {}
    if (!sets) return
    const m = musclesOf(sourceOf(item, index))
    for (const slug in m) load[slug] = (load[slug] || 0) + m[slug] * sets
  })
  return load
}

/**
 * 已完成训练的负荷（仅实际勾选的组计数）。pick 可进一步收窄——
 * 人体图随后能回答"*hard* 组去了哪里"，这与"组去了哪里"是不同的问题：
 * 一块肌肉可以总量领先却从未在接近力竭时训练。
 */
export const loadOfWorkouts = (
  workouts: WorkoutLike[] | null | undefined,
  pick?: (s: import('./model').SetLike) => boolean,
  index?: Record<string, EntryLike>,
): Record<string, number> =>
  loadOf((workouts || []).flatMap(w =>
    (w.entries || []).map(e => ({
      id: e.id, ex: (e.exercise || e) as EntryLike,
      sets: (e.sets || []).filter(s => s.done && !isWarmupRow(s) && (!pick || pick(s))).length,
    }))), index)

/**
 * 落在某个既有 Muscle balance 区间内的训练，时间注入以支持确定性测试。
 * 7 天区间是"本周"而非"最近七天"，随档案的首个工作日移动。
 */
export function muscleBalanceWindow(
  workouts: WorkoutLike[],
  win: number,
  now: number = Date.now(),
  today: string = todayISO(),
  ws: string = MONDAY,
): WorkoutLike[] {
  return (workouts || []).filter(workout => win === 0
    ? true
    : win === 7
      ? weekKey(workout.d as string, ws) === weekKey(today, ws)
      : workoutAt(workout) > now - win * 86400000)
}

/** 一个例程*将会*产生的负荷，来自其计划组数 */
export const loadOfRoutine = (
  routine: { ex?: Array<{ id?: string; sets?: number } & EntryLike> } | null | undefined,
  exercises: Record<string, EntryLike> = {},
): Record<string, number> =>
  loadOf((routine?.ex || []).map(c => ({ id: c.id, ex: exercises[c.id as string] || c, sets: c.sets || 1 })))

/**
 * 当前重复周编程的有效组数；覆盖与历史不是计划。
 * 浮动周或轮换（S.queue）也是计划：其每个会话一次，与工作日例程并列。
 */
export function loadOfWeeklyPlan(S: ProfileLike | null | undefined): Record<string, number> {
  const routines = new Map((S?.routines as Array<{ id: string } & EntryLike> || []).map(routine => [routine.id, routine]))
  const exercises = Object.fromEntries((S?.customEx as EntryLike[] || []).map(exercise => [exercise.id, exercise]))
  const q = (S as { queue?: { ids?: string[] } })?.queue
  const queued = new Set(q ? (q.ids || []) : [])
  const ids = [
    // 工作日例程中已进入浮动队列的，是队列的会话而非第二份计划，不重复计数
    ...Object.values((S?.week || {}) as Record<string, unknown>).flatMap(value => [].concat(value || []) as string[]).filter(id => !queued.has(id)),
    // 浮动队列：每个会话一次（去重）
    ...queued,
  ]
  const load: Record<string, number> = {}
  for (const id of ids) {
    const routine = routines.get(id)
    if (!routine) continue
    for (const [slug, sets] of Object.entries(loadOfRoutine(routine, exercises))) {
      load[slug] = (load[slug] || 0) + sets
    }
  }
  return load
}

/** 进行中训练的负荷——目前已勾选的组 */
export const loadOfActive = (
  active: { entries?: EntryLike[] } | null | undefined,
  index?: Record<string, EntryLike>,
): Record<string, number> =>
  loadOf((active?.entries || []).map(e => ({
    id: e.id, ex: (e.exercise || e) as EntryLike,
    sets: (e.sets || []).filter(s => s.done && !isWarmupRow(s)).length,
  })), index)

/**
 * 每肌肉着色 0–4 级。
 * 无 thresholds 时，级别相对同一窗口内工作量最大的肌肉（原始平衡图行为）。
 * 提供 thresholds 时使用绝对刻度：{ at, level, exclusive? } 规则的有序数组，
 * 最后匹配的规则生效。
 */
export function levelsOf(load: Record<string, number>, thresholds?: Array<{ at: number; level: number; exclusive?: boolean }>): Record<string, number> {
  if (thresholds) {
    const lv: Record<string, number> = {}
    MUSCLES.forEach(m => {
      const value = Number(load[m] || 0)
      let level = 0
      for (const rule of thresholds) {
        const matches = rule.exclusive ? value > rule.at : value >= rule.at
        if (matches) level = Math.max(0, Math.min(4, rule.level))
      }
      lv[m] = level
    })
    return lv
  }

  const max = Math.max(0, ...MUSCLES.map(m => load[m] || 0))
  const lv: Record<string, number> = {}
  MUSCLES.forEach(m => {
    const v = load[m] || 0
    lv[m] = !v ? 0 : max <= 0 ? 0 : Math.max(1, Math.min(4, Math.ceil(v / max * 4)))
  })
  return lv
}

/** 肌肉按工作量降序排列；未训练的排最后，按人体顺序 */
export function rankOf(load: Record<string, number>): { worked: string[]; missed: string[] } {
  const worked = MUSCLES.filter(m => (load[m] || 0) > 0)
    .sort((a, b) => (load[b] || 0) - (load[a] || 0) || MUSCLES.indexOf(a) - MUSCLES.indexOf(b))
  const missed = MUSCLES.filter(m => !(load[m] > 0))
  return { worked: [...worked], missed: [...missed] }
}

// 重新导出日期助手，便于调用方单点引用
export { isoOf, todayISO, weekKey, MONDAY, SUNDAY }
