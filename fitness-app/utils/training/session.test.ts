// 训练台会话模型（session.ts）单测
//
// 覆盖：会话构建与预填、处方文案、组行增删改、PR 即时判定、保存载荷、
// 完成汇总与下一课建议。端到端用例从"后端历史窗口响应"出发（toProfile），
// 保证页面拿到的预填值确实来自真实数据结构。

import { describe, it, expect } from 'vitest'
import {
  buildSession, lastRowsOf, annotatePrs, sessionTotals, sessionPrs,
  toDetailRows, toRecordPayload, nextSuggestions, withSessionProfile,
  updateRow, updateSide, setRowDone, setSideDone, addRow, duplicateRow,
  removeRow, setPerSide, setRowType, findExercise, findRow,
  formatWhy, formatWeight, parseParams, normalizePolicy, hasWork,
  prBaselineOf, configOf, stepOf, dateTimeOf,
  type GuidedSession, type DayExercise,
} from './session'
import { toProfile } from './history'
import type { ProfileLike } from './model'

// ── 测试夹具 ────────────────────────────────────────────────────────────────

const T0 = new Date('2026-10-29T10:00:00+08:00').getTime()

/** 后端 /days 形状的动作（D5 字段齐全） */
function dayExercise(over: Partial<DayExercise> = {}): DayExercise {
  return {
    id: 11,
    exerciseId: 100,
    exerciseName: '杠铃卧推',
    sets: 3,
    reps: '8',
    restSeconds: 120,
    sortOrder: 1,
    targetSets: 3,
    targetReps: '8',
    progressionRule: 'linear',
    equipment: 'barbell',
    bodyPart: 'chest',
    primaryMuscle: 'chest',
    ...over,
  }
}

/** 历史窗口 → ProfileLike：一次 100kg×8 全部完成的卧推 */
function historyProfile(
  reps: number[] = [8, 8, 8],
  weight = 100,
  planId = 5,
  exerciseId = 100,
): ProfileLike {
  return toProfile({
    workouts: [{
      workoutRecordId: 501,
      workoutDate: '2026-10-20',
      planId,
      exercises: [{
        exerciseId,
        exerciseName: '杠铃卧推',
        sets: reps.map((r, i) => ({
          setNumber: i + 1,
          weightKg: weight,
          actualReps: r,
          isCompleted: 1,
        })),
      }],
    }],
  })
}

const plan = { planId: 5, planName: '推拉腿', dayNumber: 2, dayName: '推日', focus: '胸/肩/三头' }

function build(over: Parameters<typeof buildSession>[0] = {}): GuidedSession {
  return buildSession({
    ...plan,
    exercises: [dayExercise()],
    profile: null,
    startedAt: T0,
    ...over,
  })
}

// ── 会话构建与预填 ──────────────────────────────────────────────────────────

describe('buildSession：冷启动', () => {
  it('无历史 → 建立基线，重量 0，组数取计划目标', () => {
    const s = build()
    const ex = s.exercises[0]
    expect(ex.rows).toHaveLength(3)
    expect(ex.rows.every(r => r.weight === 0)).toBe(true)
    expect(ex.prescription.kind).toBe('first')
    expect(ex.prescription.title).toContain('建立基线')
    expect(ex.prescription.detail).toContain('尚无记录')
    expect(ex.rows[0].prefilled).toBe(false)
    expect(s.v).toBe(1)
    expect(s.unit).toBe('kg')
  })

  it('次数区间 8-12 的首次训练从区间底起步（而不是顶）', () => {
    const s = build({
      exercises: [dayExercise({ reps: '8-12', targetReps: '8-12' })],
    })
    const ex = s.exercises[0]
    expect(ex.repsMin).toBe(8)
    expect(ex.repsMax).toBe(12)
    expect(ex.rows.every(r => r.reps === 8)).toBe(true)
  })

  it('动作缺 exerciseId 时仍可训练（只记名称）', () => {
    const s = build({ exercises: [dayExercise({ exerciseId: null, exerciseName: '自定义动作' })] })
    expect(s.exercises[0].exerciseId).toBeNull()
    expect(s.exercises[0].name).toBe('自定义动作')
    expect(toDetailRows(s)).toHaveLength(0)
  })

  it('休息时间缺省回落 90 秒', () => {
    const s = build({ exercises: [dayExercise({ restSeconds: null })] })
    expect(s.exercises[0].restSeconds).toBe(90)
  })
})

describe('buildSession：历史预填与处方', () => {
  it('上次全部达标 → 线性 +2.5kg，预填建议重量与上次次数', () => {
    const s = build({ profile: historyProfile() })
    const ex = s.exercises[0]
    expect(ex.prescription.kind).toBe('up')
    expect(ex.prescription.weight).toBe(102.5)
    expect(ex.rows.map(r => r.weight)).toEqual([102.5, 102.5, 102.5])
    expect(ex.rows.map(r => r.reps)).toEqual([8, 8, 8])
    expect(ex.rows.every(r => r.prefilled)).toBe(true)
    expect(ex.prescription.detail).toContain('加')
    expect(ex.last).toEqual({ weight: 100, reps: 8, sets: 3 })
  })

  it('上次次数未达标 → kind=hold，重量保持不变', () => {
    const s = build({ profile: historyProfile([6, 6, 6]) })
    expect(s.exercises[0].prescription.kind).toBe('hold')
    expect(s.exercises[0].prescription.weight).toBe(100)
    expect(s.exercises[0].rows.every(r => r.weight === 100)).toBe(true)
  })

  it('下肢动作步长 5kg（器械增量按身体部位）', () => {
    const s = build({
      profile: historyProfile([5, 5, 5], 100, 5, 200),
      exercises: [dayExercise({
        exerciseId: 200, exerciseName: '深蹲', reps: '5', targetReps: '5', bodyPart: 'upper legs',
      })],
    })
    expect(s.exercises[0].prescription.weight).toBe(105)
    expect(stepOf(s.exercises[0])).toBe(5)
  })

  it('计划关闭渐进（off）→ 保持计划值，不自动加量', () => {
    const s = build({
      profile: historyProfile(),
      exercises: [dayExercise({ progressionRule: 'off' })],
    })
    expect(s.exercises[0].prescription.kind).toBe('off')
    expect(s.exercises[0].prescription.weight).toBeNull()
    expect(s.exercises[0].prescription.detail).toContain('不自动渐进')
  })

  it('规则参数 inc 覆盖器械默认步长', () => {
    const s = build({
      profile: historyProfile(),
      exercises: [dayExercise({
        progressionParams: JSON.stringify({ inc: 1.25 }),
      })],
    })
    // 引擎按 0.1 精度对齐网格：100 + 1.25 → 101.3
    expect(s.exercises[0].prescription.weight).toBe(101.3)
  })

  it('处方文案：重量 + 次数区间 + 为什么是这个数', () => {
    const s = build({
      profile: historyProfile([12, 12, 12]),
      exercises: [dayExercise({ reps: '8-12', targetReps: '8-12' })],
    })
    expect(s.exercises[0].prescription.title).toContain('102.5kg')
    expect(s.exercises[0].prescription.title).toContain('8-12')
    expect(s.exercises[0].prescription.detail).not.toContain('{0}')
  })
})

// ── 历史读取 ────────────────────────────────────────────────────────────────

describe('lastRowsOf', () => {
  it('优先取本计划的训练；本计划无记录时回落全部历史', () => {
    const other = historyProfile([8, 8, 8], 100, 9)
    const own = historyProfile([10, 10, 10], 80, 5)
    const S: ProfileLike = { workouts: [...(other.workouts || []), ...(own.workouts || [])] }
    expect(lastRowsOf(S, 100, 5).map(r => r.weight)).toEqual([80, 80, 80])
    expect(lastRowsOf(S, 100, 77).map(r => r.weight)).toEqual([80, 80, 80])
  })

  it('忽略热身组与未完成的组', () => {
    const S = toProfile({
      workouts: [{
        workoutDate: '2026-10-20',
        exercises: [{
          exerciseId: 100,
          sets: [
            { setNumber: 1, setType: 'warmup', weightKg: 60, actualReps: 10, isCompleted: 1 },
            { setNumber: 2, weightKg: 100, actualReps: 8, isCompleted: 1 },
            { setNumber: 3, weightKg: 100, actualReps: 8, isCompleted: 0 },
          ],
        }],
      }],
    })
    expect(lastRowsOf(S, 100)).toHaveLength(1)
  })

  it('空档案 → 空', () => {
    expect(lastRowsOf(null, 100)).toEqual([])
    expect(lastRowsOf({ workouts: [] }, 100)).toEqual([])
    expect(lastRowsOf({ workouts: [] }, null)).toEqual([])
  })
})

// ── 组行操作 ────────────────────────────────────────────────────────────────

describe('组行操作', () => {
  const key = (s: GuidedSession) => s.exercises[0].key
  const rowKey = (s: GuidedSession, i = 0) => s.exercises[0].rows[i].key

  it('完成一组 → done=true，容量计入', () => {
    let s = build({ profile: historyProfile() })
    s = setRowDone(s, key(s), rowKey(s), true)
    expect(findRow(s, key(s), rowKey(s))!.done).toBe(true)
    expect(hasWork(s)).toBe(true)
    const totals = sessionTotals(s)
    expect(totals.doneSets).toBe(1)
    expect(totals.volume).toBe(102.5 * 8)
  })

  it('取消完成 → 容量退出统计', () => {
    let s = build()
    s = setRowDone(s, key(s), rowKey(s), true)
    s = setRowDone(s, key(s), rowKey(s), false)
    expect(sessionTotals(s).volume).toBe(0)
    expect(hasWork(s)).toBe(false)
  })

  it('热身组不计入容量', () => {
    let s = build({ profile: historyProfile() })
    s = setRowType(s, key(s), rowKey(s), 'warmup')
    s = setRowDone(s, key(s), rowKey(s), true)
    expect(sessionTotals(s).volume).toBe(0)
    expect(sessionTotals(s).doneSets).toBe(1)
  })

  it('改重量/次数 → 清除"上次"预填标记', () => {
    let s = build({ profile: historyProfile() })
    expect(findRow(s, key(s), rowKey(s))!.prefilled).toBe(true)
    s = updateRow(s, key(s), rowKey(s), { weight: 105 })
    expect(findRow(s, key(s), rowKey(s))!.weight).toBe(105)
    expect(findRow(s, key(s), rowKey(s))!.prefilled).toBe(false)
  })

  it('RIR 记录为 null 或显式数值（不写 0 表示未记录）', () => {
    let s = build()
    expect(findRow(s, key(s), rowKey(s))!.rir).toBeNull()
    s = updateRow(s, key(s), rowKey(s), { rir: 2 })
    expect(findRow(s, key(s), rowKey(s))!.rir).toBe(2)
    s = updateRow(s, key(s), rowKey(s), { rir: null })
    expect(findRow(s, key(s), rowKey(s))!.rir).toBeNull()
  })

  it('新增一组：复制上一组数值，未完成，编号递增', () => {
    let s = build({ profile: historyProfile() })
    s = updateRow(s, key(s), rowKey(s, 2), { reps: 6 })
    s = addRow(s, key(s))
    const rows = s.exercises[0].rows
    expect(rows).toHaveLength(4)
    expect(rows[3].setNumber).toBe(4)
    expect(rows[3].done).toBe(false)
    expect(rows[3].reps).toBe(6)
  })

  it('复制一组：插到原组之后，值相同但未完成', () => {
    let s = build({ profile: historyProfile() })
    s = setRowDone(s, key(s), rowKey(s, 1), true)
    s = duplicateRow(s, key(s), rowKey(s, 1))
    const rows = s.exercises[0].rows
    expect(rows).toHaveLength(4)
    expect(rows[2].weight).toBe(rows[1].weight)
    expect(rows[2].reps).toBe(rows[1].reps)
    expect(rows[2].done).toBe(false)
    expect(rows.map(r => r.setNumber)).toEqual([1, 2, 3, 4])
  })

  it('删除一组：编号重排，其余组保留', () => {
    let s = build()
    s = updateRow(s, key(s), rowKey(s, 0), { reps: 11 })
    s = removeRow(s, key(s), rowKey(s, 1))
    const rows = s.exercises[0].rows
    expect(rows).toHaveLength(2)
    expect(rows.map(r => r.setNumber)).toEqual([1, 2])
    expect(rows.map(r => r.reps)).toEqual([11, 8])
  })

  it('删除后可用旧会话撤销（纯函数保留原不可变）', () => {
    const before = build()
    const after = removeRow(before, key(before), rowKey(before, 0))
    expect(before.exercises[0].rows).toHaveLength(3)
    expect(after.exercises[0].rows).toHaveLength(2)
  })
})

// ── 单侧 ────────────────────────────────────────────────────────────────────

describe('单侧动作', () => {
  const perSide = () => dayExercise({
    exerciseId: 300, exerciseName: '哑铃单腿硬拉', reps: '10', targetReps: '10',
    sets: 2, targetSets: 2, equipment: 'dumbbell', perSide: true,
  })

  it('构建时就带左右两肢，完成一组两侧同时落定', () => {
    let s = build({ exercises: [perSide()] })
    const ex = s.exercises[0]
    expect(ex.perSide).toBe(true)
    expect(ex.rows[0].sides).toEqual({
      L: { weight: 0, reps: 10, done: false },
      R: { weight: 0, reps: 10, done: false },
    })
    s = setRowDone(s, ex.key, ex.rows[0].key, true)
    expect(findRow(s, ex.key, ex.rows[0].key)!.sides!.L.done).toBe(true)
    expect(findRow(s, ex.key, ex.rows[0].key)!.sides!.R.done).toBe(true)
  })

  it('只完成一侧时整组未完成；两侧都完成才置 done', () => {
    let s = build({ exercises: [perSide()] })
    const k = s.exercises[0].key
    const rk = s.exercises[0].rows[0].key
    s = setSideDone(s, k, rk, 'L', true)
    expect(findRow(s, k, rk)!.done).toBe(false)
    s = setSideDone(s, k, rk, 'R', true)
    expect(findRow(s, k, rk)!.done).toBe(true)
  })

  it('改单侧重量：行级取两侧较大值，容量按两侧相加', () => {
    let s = build({ exercises: [perSide()] })
    const k = s.exercises[0].key
    const rk = s.exercises[0].rows[0].key
    s = updateSide(s, k, rk, 'L', { weight: 24, reps: 10 })
    s = updateSide(s, k, rk, 'R', { weight: 22, reps: 9 })
    s = setRowDone(s, k, rk, true)
    const row = findRow(s, k, rk)!
    expect(row.weight).toBe(24)
    expect(row.reps).toBe(19)
    expect(sessionTotals(s).volume).toBe(24 * 10 + 22 * 9)
  })

  it('保存载荷：一组拆成左/右两行，同 setNumber、perSide=1、L 在前', () => {
    let s = build({ exercises: [perSide()] })
    const k = s.exercises[0].key
    s = updateSide(s, k, s.exercises[0].rows[0].key, 'L', { weight: 24, reps: 10 })
    s = updateSide(s, k, s.exercises[0].rows[0].key, 'R', { weight: 26, reps: 8 })
    s = setRowDone(s, k, s.exercises[0].rows[0].key, true)
    const rows = toDetailRows(s)
    expect(rows).toHaveLength(2)
    expect(rows.map(r => r.setNumber)).toEqual([1, 1])
    expect(rows.map(r => r.perSide)).toEqual([1, 1])
    expect(rows.map(r => r.weightKg)).toEqual([24, 26])
    expect(rows.map(r => r.actualReps)).toEqual([10, 8])
    expect(rows.map(r => r.sortOrder)).toEqual([1, 2])
  })

  it('页头开关可把普通动作改成单侧记录，且不丢已有数值', () => {
    let s = build()
    const k = s.exercises[0].key
    s = setPerSide(s, k, true)
    const row = s.exercises[0].rows[0]
    expect(row.sides!.L.weight).toBe(row.weight)
    expect(row.sides!.R.reps).toBe(row.reps)
    s = setPerSide(s, k, false)
    expect(s.exercises[0].rows[0].sides).toBeNull()
  })
})

// ── PR 即时判定 ─────────────────────────────────────────────────────────────

describe('annotatePrs：即时 PR', () => {
  it('无历史 → 不打 PR 标（首次记录交给后端入库）', () => {
    let s = build()
    s = setRowDone(s, s.exercises[0].key, s.exercises[0].rows[0].key, true)
    s = annotatePrs(s, { workouts: [] })
    expect(s.exercises[0].rows[0].prTypes).toEqual([])
    expect(prBaselineOf({ workouts: [] }, 100)).toBeNull()
  })

  it('历史 100×8，本次 105×8 → 1RM 与容量 PR', () => {
    let s = build()
    const k = s.exercises[0].key
    const rk = s.exercises[0].rows[0].key
    s = updateRow(s, k, rk, { weight: 105, reps: 8 })
    s = setRowDone(s, k, rk, true)
    s = annotatePrs(s, historyProfile())
    const row = findRow(s, k, rk)!
    expect(row.isPr).toBe(true)
    expect(row.prTypes).toContain('1rm')
    expect(row.prTypes).toContain('max_volume')
    expect(row.prTypes).not.toContain('max_reps')
    expect(sessionPrs(s)[0].e1rm).toBe(133)
  })

  it('同一训练里后一组更重也即时提示', () => {
    let s = build()
    const k = s.exercises[0].key
    s = updateRow(s, k, s.exercises[0].rows[0].key, { weight: 105, reps: 8 })
    s = setRowDone(s, k, s.exercises[0].rows[0].key, true)
    s = updateRow(s, k, s.exercises[0].rows[1].key, { weight: 110, reps: 8 })
    s = setRowDone(s, k, s.exercises[0].rows[1].key, true)
    s = annotatePrs(s, historyProfile())
    expect(findRow(s, k, s.exercises[0].rows[0].key)!.prTypes).toContain('1rm')
    expect(findRow(s, k, s.exercises[0].rows[1].key)!.prTypes).toContain('1rm')
  })

  it('最大次数 PR：历史 100×8，本次 100×10', () => {
    let s = build()
    const k = s.exercises[0].key
    const rk = s.exercises[0].rows[0].key
    s = updateRow(s, k, rk, { weight: 100, reps: 10 })
    s = setRowDone(s, k, rk, true)
    s = annotatePrs(s, historyProfile())
    expect(findRow(s, k, rk)!.prTypes).toContain('max_reps')
  })

  it('未完成组与热身组不打 PR', () => {
    let s = build()
    const k = s.exercises[0].key
    s = updateRow(s, k, s.exercises[0].rows[0].key, { weight: 120, reps: 8 })
    s = annotatePrs(s, historyProfile())
    expect(findRow(s, k, s.exercises[0].rows[0].key)!.isPr).toBe(false)

    s = setRowType(s, k, s.exercises[0].rows[0].key, 'warmup')
    s = setRowDone(s, k, s.exercises[0].rows[0].key, true)
    s = annotatePrs(s, historyProfile())
    expect(findRow(s, k, s.exercises[0].rows[0].key)!.isPr).toBe(false)
  })

  it('自重（0kg）不产生 PR 标（无负重不可比）', () => {
    let s = build({ exercises: [dayExercise({ equipment: 'body weight', targetReps: '20', reps: '20' })] })
    const k = s.exercises[0].key
    const rk = s.exercises[0].rows[0].key
    s = updateRow(s, k, rk, { weight: 0, reps: 30 })
    s = setRowDone(s, k, rk, true)
    s = annotatePrs(s, historyProfile())
    expect(findRow(s, k, rk)!.prTypes).toEqual([])
  })
})

// ── 保存载荷 ────────────────────────────────────────────────────────────────

describe('toDetailRows / toRecordPayload', () => {
  it('只提交已完成的组，缺组不提交（避免被判失误）', () => {
    let s = build()
    s = setRowDone(s, s.exercises[0].key, s.exercises[0].rows[0].key, true)
    const rows = toDetailRows(s)
    expect(rows).toHaveLength(1)
    expect(rows[0].setNumber).toBe(1)
  })

  it('字段映射：exerciseId/planExerciseId/组类型/RIR/目标次数', () => {
    let s = build({ profile: historyProfile() })
    const k = s.exercises[0].key
    const rk = s.exercises[0].rows[0].key
    s = updateRow(s, k, rk, { rir: 2 })
    s = setRowDone(s, k, rk, true)
    const row = toDetailRows(s)[0]
    expect(row).toMatchObject({
      exerciseId: 100,
      planExerciseId: 11,
      exerciseName: '杠铃卧推',
      setType: 'normal',
      weightKg: 102.5,
      actualReps: 8,
      rir: 2,
      perSide: 0,
      isCompleted: 1,
      targetReps: '8',
    })
  })

  it('训练记录：容量/动作数/时长/计划日', () => {
    let s = build({ profile: historyProfile() })
    const k = s.exercises[0].key
    s = setRowDone(s, k, s.exercises[0].rows[0].key, true)
    s = setRowDone(s, k, s.exercises[0].rows[1].key, true)
    const payload = toRecordPayload(s, {
      now: T0 + 42 * 60000,
      workoutDate: '2026-10-29',
    })
    expect(payload.volume).toBe(102.5 * 8 * 2)
    expect(payload.exerciseCount).toBe(1)
    expect(payload.durationMinutes).toBe(42)
    expect(payload.planId).toBe(5)
    expect(payload.dayNumber).toBe(2)
    expect(payload.trainingType).toBe('胸/肩/三头')
    expect(payload.name).toBe('推拉腿 · 推日')
    expect(payload.workoutDate).toBe('2026-10-29')
    expect(payload.startTime).toBe('2026-10-29 10:00:00')
  })

  it('时长最少 1 分钟（立刻完成也不算 0）', () => {
    const s = build()
    expect(toRecordPayload(s, { now: T0 + 1000 }).durationMinutes).toBe(1)
  })

  it('dateTimeOf 使用本地时区格式', () => {
    expect(dateTimeOf(T0)).toBe('2026-10-29 10:00:00')
  })
})

// ── 完成后的下一课建议 ──────────────────────────────────────────────────────

describe('下一课建议', () => {
  it('本次 3×8@100 全完成 → 下次建议 102.5kg', () => {
    let s = build()
    const k = s.exercises[0].key
    for (const row of s.exercises[0].rows) {
      s = updateRow(s, k, row.key, { weight: 100, reps: 8 })
      s = setRowDone(s, k, row.key, true)
    }
    const next = nextSuggestions(s, null)
    expect(next).toHaveLength(1)
    expect(next[0].text).toContain('102.5')
    expect(next[0].kind).toBe('up')
  })

  it('并入档案不修改原档案（纯函数）', () => {
    const S = historyProfile()
    const before = JSON.stringify(S)
    let s = build({ profile: S })
    s = setRowDone(s, s.exercises[0].key, s.exercises[0].rows[0].key, true)
    withSessionProfile(S, s, T0)
    expect(JSON.stringify(S)).toBe(before)
  })

  it('未完成的动作不给建议', () => {
    const s = build()
    expect(nextSuggestions(s, null)).toEqual([])
  })
})

// ── 小工具 ──────────────────────────────────────────────────────────────────

describe('格式化与解析', () => {
  it('formatWhy 填充 {0}/{1}，缺参保留占位', () => {
    expect(formatWhy(['停滞 {0} 次，减载到 {1} kg。', 3, 90])).toBe('停滞 3 次，减载到 90 kg。')
    expect(formatWhy(['还差 {0}/{1} 次', 1])).toBe('还差 1/{1} 次')
    expect(formatWhy([])).toBe('')
  })

  it('formatWeight 去掉浮点噪声', () => {
    expect(formatWeight(62.5)).toBe('62.5')
    expect(formatWeight(60)).toBe('60')
    expect(formatWeight(62.50000000001)).toBe('62.5')
  })

  it('parseParams 兼容 JSON 字符串/对象/脏数据', () => {
    expect(parseParams('{"inc":1.25}')).toEqual({ inc: 1.25 })
    expect(parseParams({ inc: 2 })).toEqual({ inc: 2 })
    expect(parseParams('not json')).toEqual({})
    expect(parseParams(null)).toEqual({})
  })

  it('normalizePolicy：未知值回落 linear', () => {
    expect(normalizePolicy('DOUBLE')).toBe('double')
    expect(normalizePolicy(null)).toBe('linear')
    expect(normalizePolicy('nope')).toBe('linear')
  })

  it('configOf 能从会话动作重建配置（草稿恢复后仍可算下一课）', () => {
    const s = build({
      exercises: [dayExercise({ reps: '8-12', targetReps: '8-12', progressionParams: '{"inc":2.5,"setsMax":5}' })],
    })
    const cfg = configOf(s.exercises[0])
    expect(cfg).toMatchObject({
      id: '100', sets: 3, reps: 12, repsMin: 8, prog: 'linear', mode: 'reps', eq: 'barbell',
    })
    expect((cfg as Record<string, unknown>).setsMax).toBe(5)
  })

  it('草稿可 JSON 往返后继续操作（保存/恢复的前提）', () => {
    let s = build({ profile: historyProfile() })
    s = setRowDone(s, s.exercises[0].key, s.exercises[0].rows[0].key, true)
    const restored: GuidedSession = JSON.parse(JSON.stringify(s))
    expect(restored.exercises[0].prescription.title).toBe(s.exercises[0].prescription.title)
    expect(findExercise(restored, restored.exercises[0].key)!.rows[0].done).toBe(true)
    const next = setRowDone(restored, restored.exercises[0].key, restored.exercises[0].rows[1].key, true)
    expect(sessionTotals(next).doneSets).toBe(2)
  })
})
