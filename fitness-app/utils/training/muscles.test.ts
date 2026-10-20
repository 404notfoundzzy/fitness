// 肌肉映射测试 —— 移植自 openGym（AGPL-3.0）muscles.test.js，上游 commit e348fc1。
// 依赖动作库目录（EXIDX/EXDB）的用例在阶段 2 动作库入库后补齐；
// 涉及目录优先级的用例暂按"无目录索引"语义适配。
import { describe, it, expect } from 'vitest'
import {
  MUSCLE_NAME, exerciseMuscleSnapshot, hasExplicitMuscleMetadata, levelsOf, loadOf,
  loadOfWorkouts, loadOfWeeklyPlan, matchesMuscleGroups, muscleBalanceWindow, muscleGroupsOf,
  musclesOf, muscleWeightsOf, rankOf, inMuscleOrder,
} from './muscles'

describe('多肌肉动作元数据', () => {
  it('归一化旧式主/次要字段并去重', () => {
    const ex = { tg: 'pectorals', mg: 'triceps', sm: ['triceps', 'chest'] }
    expect(muscleGroupsOf(ex)).toEqual(['chest', 'triceps'])
    expect(musclesOf(ex)).toEqual({ chest: 1, triceps: 0.4 })
  })

  it('存在显式多组元数据时优先使用，并支持旧式单组', () => {
    expect(muscleGroupsOf({ muscleGroups: ['chest', 'pectorals', 'triceps'] })).toEqual(['chest', 'triceps'])
    expect(muscleGroupsOf({ tg: 'chest' })).toEqual(['chest'])
    expect(MUSCLE_NAME.chest).toBe('胸大肌')
  })

  it('可选多组字段为空时回退旧式身体部位映射', () => {
    expect(muscleGroupsOf({ bp: 'back', muscleGroups: [] })).toEqual(['upper-back', 'lower-back'])
    expect(matchesMuscleGroups({ bp: 'back', muscleGroups: [] }, ['lower-back'])).toBe(true)
  })

  it('显式组只含未知名时一致地回退', () => {
    const ex = { bp: 'back', muscleGroups: ['not-a-drawable-name'] }
    expect(muscleGroupsOf(ex)).toEqual(['upper-back', 'lower-back'])
    expect(musclesOf(ex)).toEqual({ 'upper-back': 0.75, 'lower-back': 0.25 })
  })

  it('任一请求肌肉匹配即算匹配', () => {
    const ex = { muscleGroups: ['chest', 'triceps'] }
    expect(matchesMuscleGroups(ex, ['hamstring', 'triceps'])).toBe(true)
    expect(matchesMuscleGroups(ex, ['hamstring', 'gluteal'])).toBe(false)
    expect(matchesMuscleGroups(ex, [])).toBe(true)
  })

  it('每个唯一组计一个有效组，不重复计数', () => {
    expect(loadOf([{ id: 'inline', ex: { tg: 'chest', sm: ['chest', 'triceps'] }, sets: 2 }]))
      .toEqual({ chest: 2, triceps: 0.8 })
  })

  it('目录 id 不可用时使用历史条目携带的多肌肉元数据', () => {
    expect(loadOfWorkouts([{ entries: [{
      id: 'deleted-custom', muscleGroups: ['chest', 'chest', 'triceps'],
      sets: [{ done: true }]
    }] }])).toEqual({ chest: 1, triceps: 1 })
  })
})

describe('显式肌肉权重', () => {
  const complete = { chest: 1, deltoids: 0.4, triceps: 0 }

  it('保留 0 到 1 之间每个有限显式权重', () => {
    expect(muscleWeightsOf({ muscleWeights: complete })).toEqual(complete)
  })

  it('有效刺激只保留正值', () => {
    expect(musclesOf({ muscleWeights: complete })).toEqual({ chest: 1, deltoids: 0.4 })
  })

  it('可识别的全零映射视为权威，不使用身体部位默认', () => {
    const ex = { bp: 'chest', muscleWeights: { chest: 0, triceps: 0 } }
    expect(muscleWeightsOf(ex)).toEqual({ chest: 0, triceps: 0 })
    expect(musclesOf(ex)).toEqual({})
  })

  it('完整权重保留进历史快照', () => {
    expect(exerciseMuscleSnapshot({ n: 'Press', bp: 'chest', muscleWeights: complete }))
      .toMatchObject({ n: 'Press', bp: 'chest', muscleWeights: complete })
  })

  it('保留旧式主/次要回退权重', () => {
    expect(muscleWeightsOf({ tg: 'pectorals', mg: 'triceps' })).toEqual({ chest: 1, triceps: 0.4 })
  })
})

describe('显式多主肌肉元数据', () => {
  it('每个主肌肉全权重、次要肌肉支撑权重', () => {
    const ex = {
      bp: 'chest', tg: 'abs', mg: 'triceps', sm: ['lower back'],
      primaries: ['chest', 'triceps', 'chest'], secondaries: ['deltoids', 'triceps'],
    }
    expect(muscleGroupsOf(ex)).toEqual(['chest', 'triceps', 'deltoids'])
    expect(musclesOf(ex)).toEqual({ chest: 1, triceps: 1, deltoids: 0.4 })
  })

  it('主肌肉缺失或显式为空时保留身体部位回退', () => {
    const expected = { 'upper-back': 0.75, 'lower-back': 0.25 }
    expect(musclesOf({ bp: 'back' })).toEqual(expected)
    expect(musclesOf({ bp: 'back', primaries: [] })).toEqual(expected)
  })

  it('新数组字段存在但为空时保留旧式元数据', () => {
    expect(exerciseMuscleSnapshot({ bp: 'chest', tg: 'abs', primaries: [] })).toMatchObject({
      muscleGroups: ['abs'],
    })
  })

  it('为旧式自定义动作提供保守的全身回退', () => {
    expect(muscleGroupsOf({ bp: 'full body' })).toEqual(['chest', 'upper-back', 'gluteal', 'quadriceps', 'hamstring', 'abs'])
    expect(musclesOf({ bp: 'full body' })).toEqual({
      chest: 0.2, 'upper-back': 0.2, gluteal: 0.2, quadriceps: 0.2, hamstring: 0.1, abs: 0.1,
    })
  })

  it('完整的主/次要数组保留进历史快照', () => {
    expect(exerciseMuscleSnapshot({
      n: 'Deadlift', bp: 'full body', primaries: ['gluteal', 'lower-back'], secondaries: ['hamstring'],
    })).toMatchObject({
      n: 'Deadlift', bp: 'full body', primaries: ['gluteal', 'lower-back'], secondaries: ['hamstring'],
      muscleGroups: ['gluteal', 'lower-back', 'hamstring'],
    })
  })
})

describe('人体图的热身阶段负荷', () => {
  it('按组数工作的人体图排除热身组', () => {
    const w = {
      id: 'w1', d: '2026-08-01', start: Date.UTC(2026, 7, 1, 10), unit: 'kg',
      entries: [{
        id: 'bench', tg: 'chest',
        sets: [
          { done: true, phase: 'warmup', w: 20, r: 8 },
          { done: true, phase: 'work', w: 60, r: 8 },
        ],
      }],
    }
    const load = loadOfWorkouts([w], null)
    expect(load.chest).toBe(1)
  })
})

describe('计划周肌肉量', () => {
  const state = {
    customEx: [
      { id: 'press', primaries: ['chest'], secondaries: ['triceps'] },
      { id: 'curl', primaries: ['biceps'], secondaries: [] },
    ],
    routines: [
      { id: 'push', ex: [{ id: 'press', sets: 2 }] },
      { id: 'arms', ex: [{ id: 'curl', sets: 3 }] },
    ],
    week: { 0: 'arms', 1: ['push', 'missing'], 3: ['push'] },
    dayPlan: { '2026-08-18': 'arms' },
    workouts: [{ entries: [{ id: 'snapshot-only', muscleSnapshot: { muscleWeights: { quadriceps: 1 } } }] }],
  }

  it('聚合数组与旧式标量赋值，含周内重复的例程', () => {
    expect(loadOfWeeklyPlan(state)).toEqual({ chest: 4, triceps: 1.6, biceps: 3 })
  })

  it('忽略失效例程 id、日期覆盖与已完成训练快照', () => {
    const load = loadOfWeeklyPlan(state)
    expect(load).not.toHaveProperty('quadriceps')
    expect(load.biceps).toBe(3)
  })

  it('浮动周每会话计一次，与其未覆盖的工作日例程并列', () => {
    const queued = { ...state, queue: { ids: ['push', 'push', 'gone'], since: 0, startsOn: '2026-08-17' } }
    expect(loadOfWeeklyPlan(queued)).toEqual({ chest: 2, triceps: 0.8, biceps: 3 })
  })

  it('缺失或空计划返回空投影', () => {
    expect(loadOfWeeklyPlan()).toEqual({})
    expect(loadOfWeeklyPlan({ routines: [], week: { 1: ['missing'] } })).toEqual({})
  })
})

// 从动作库删除的自定义动作仅以 muscleSnapshot 形式存活于历史中。读回它，
// 是让这些会话继续出现在人体图与统计中的关键。
describe('已删除的自定义动作', () => {
  const snapshotEntry = {
    id: 'gone-custom-1',
    sets: [{ w: 60, r: 8, done: true }],
    muscleSnapshot: { n: 'Deleted custom', bp: 'chest', muscleGroups: ['chest'], muscleWeights: { chest: 1 } },
  }

  it('从快照读回肌肉负荷', () => {
    expect(loadOfWorkouts([{ d: '2026-08-01', entries: [snapshotEntry] }])).toEqual({ chest: 1 })
  })

  it('将快照组报告为显式元数据', () => {
    expect(hasExplicitMuscleMetadata(snapshotEntry)).toBe(true)
    expect(muscleGroupsOf(snapshotEntry)).toEqual(['chest'])
  })

  it('条目自有元数据存在时仍优先', () => {
    const withOwn = { ...snapshotEntry, tg: 'quadriceps' }
    expect(muscleGroupsOf(withOwn)).toEqual(['quadriceps'])
  })
})

// muscles.js 只计数已完成的工作，其热身边界必须与训练运行时一致——
// 包括 phaseForSet 归一化的旧式拼写。
describe('热身边界', () => {
  it('排除训练模型视为热身的每种阶段拼写', () => {
    const entries = (spelling: string) => [{ id: 'bench', tg: 'chest', sets: [{ w: 100, r: 5, done: true, phase: spelling }] }]
    for (const spelling of ['warmup', 'warm-up', 'warm_up', 'Warmup', ' warmup ']) {
      expect(loadOfWorkouts([{ d: '2026-08-01', entries: entries(spelling) }]), spelling).toEqual({})
    }
  })
})

describe('肌肉平衡窗口与排名', () => {
  const now = new Date('2026-08-27T12:00:00').getTime()
  const workouts = [
    { id: 'monday', d: '2026-08-24', start: new Date('2026-08-24T12:00:00').getTime() },
    { id: 'sunday', d: '2026-08-23', start: new Date('2026-08-23T12:00:00').getTime() },
    { id: 'boundary', d: '2026-07-28', start: now - 30 * 86400000 },
    { id: 'inside', d: '2026-07-29', start: now - 29 * 86400000 },
  ]

  it('保持日历周、严格尾随天数与全历史语义', () => {
    expect(muscleBalanceWindow(workouts, 7, now, '2026-08-27').map(w => w.id)).toEqual(['monday'])
    expect(muscleBalanceWindow(workouts, 30, now, '2026-08-27').map(w => w.id)).toEqual(['monday', 'sunday', 'inside'])
    expect(muscleBalanceWindow(workouts, 0, now, '2026-08-27')).toEqual(workouts)
  })

  it('使用相对级别与规范顺序打破负荷平局', () => {
    const load = { chest: 2, deltoids: 2, biceps: 1 }
    expect(rankOf(load).worked).toEqual(['deltoids', 'chest', 'biceps'])
    expect(levelsOf(load)).toMatchObject({ deltoids: 4, chest: 4, biceps: 2, abs: 0 })
  })

  it('保留历史条目自有元数据与已删除自定义动作的快照权重', () => {
    // 注：上游此处还有目录优先级用例（EXIDX['0025'] 覆盖条目字段），
    // 待阶段 2 动作库索引到位后补充。
    const own = { id: 'bench', muscleGroups: ['quadriceps'], sets: [{ done: true }] }
    const deleted = { id: 'deleted', muscleSnapshot: { muscleWeights: { chest: 1 } }, sets: [{ done: true }] }
    expect(loadOfWorkouts([{ entries: [own] }])).toEqual({ quadriceps: 1 })
    expect(loadOfWorkouts([{ entries: [deleted] }])).toEqual({ chest: 1 })
  })
})

describe('MUSCLE_NAME 中文化', () => {
  it('每个可绘制肌肉都有中文显示名', () => {
    const slugs = ['trapezius', 'deltoids', 'chest', 'upper-back', 'serratus', 'biceps',
      'triceps', 'forearm', 'abs', 'obliques', 'lower-back', 'gluteal', 'quadriceps',
      'hamstring', 'adductors', 'hip-flexors', 'calves', 'tibialis']
    for (const slug of slugs) {
      expect(MUSCLE_NAME[slug], slug).toBeTruthy()
      expect(MUSCLE_NAME[slug]).toMatch(/[\u4e00-\u9fa5]/)
    }
  })

  it('inMuscleOrder 按人体图头到脚顺序排列', () => {
    expect(inMuscleOrder(['calves', 'chest', 'abs'])).toEqual(['chest', 'abs', 'calves'])
  })
})
