// 渐进引擎核心测试 —— 移植自 openGym（AGPL-3.0）progression.test.js，上游 commit e348fc1。
// 覆盖本次移植的部分：readSession / stallCount / policyFor / 步长 / Epley 减载助手 /
// plannedOf / planChanged / sessionsFor / selectDeloadCandidate。
// 各策略主体（linear/greyskull/double/triple/time 与 nextPrescription/applyPrescription）
// 的测试待引擎主体移植后补充。
import { describe, it, expect } from 'vitest'
import {
  readSession, sessionsFor, stallCount, plannedOf, planChanged,
  policyFor, defaultIncrement, weightIncrement, epley1RM, deloadTarget1RM,
  deloadFactorOf, DELOAD_FACTOR, POLICIES_FOR, MAX_BW_SETS,
  normalizeRepRange, snapWeight, addStep, stepWeight, deloadTo, backoffAt,
  selectDeloadCandidate, tripleSetsOf, isValidDeloadFactor, MAX_TRIPLE_SETS,
} from './progression'

// 一个 plainly loaded 动作：非重部位（chest）与重部位（upper legs）
const LIFT_BP = 'chest'
const HEAVY_BP = 'upper legs'
const LIFT = 'lift-1'

// 由 [重量, ...每组次数] 的会话列表构建状态。次数 null 表示"该组未勾选"。
const hist = (id: string, rows: Array<Array<number | null>>, target?: Record<string, unknown>) => ({
  unit: 'kg',
  workouts: rows.map((row, i) => ({
    d: '2026-01-0' + (i + 1),
    entries: [{
      id,
      target: target || { sets: 3, reps: 5, weight: row[0] },
      sets: row.slice(1).map(r => (r === null ? { w: row[0], r: 0, done: false } : { w: row[0], r, done: true })),
    }],
  })),
})

describe('readSession', () => {
  const T = { sets: 3, reps: 5 }
  it('每组都完成次数记为命中', () => {
    const s = readSession({ id: LIFT, target: T, sets: [{ w: 60, r: 5, done: true }, { w: 60, r: 5, done: true }, { w: 60, r: 6, done: true }] })
    expect(s.ok).toBe(true)
    expect(s.weight).toBe(60)
    expect(s.amrap).toBe(6)
    expect(s.low).toBe(5)
  })

  it('勾选但次数不足也记为失误', () => {
    expect(readSession({ id: LIFT, target: T, sets: [{ w: 60, r: 5, done: true }, { w: 60, r: 5, done: true }, { w: 60, r: 3, done: true }] }).ok).toBe(false)
  })

  it('未勾选的组记为失误——它未被完成', () => {
    const s = readSession({ id: LIFT, target: T, sets: [{ w: 60, r: 5, done: true }, { w: 60, r: 5, done: true }, { w: 60, r: 0, done: false }] })
    expect(s.ok).toBe(false)
    expect(s.weight).toBe(60)       // 工作重量仍从计数的组得知
  })

  it('组数少于处方记为失误', () => {
    expect(readSession({ id: LIFT, target: T, sets: [{ w: 60, r: 5, done: true }, { w: 60, r: 5, done: true }] }).ok).toBe(false)
  })

  it('无处方时拒绝称命中', () => {
    expect(readSession({ id: LIFT, target: {}, sets: [{ w: 60, r: 5, done: true }] }).ok).toBe(false)
  })

  it('计时训练按保持读而非按次数', () => {
    const s = readSession({ id: LIFT, target: { sets: 2, sec: 45, mode: 'time' }, sets: [{ sec: 45, w: 0, done: true }, { sec: 50, w: 0, done: true }] })
    expect(s.mode).toBe('time')
    expect(s.ok).toBe(true)
    expect(s.best).toBe(50)
    expect(readSession({ id: LIFT, target: { sets: 2, sec: 45, mode: 'time' }, sets: [{ sec: 45, done: true }, { sec: 30, done: true }] }).ok).toBe(false)
  })

  it('读单侧计时保持的全部翻倍行，而非仅第一对', () => {
    const T = { sets: 2, sec: 30, mode: 'time', side: true }
    const allHeld = readSession({ id: LIFT, target: T, sets: [
      { sec: 30, done: true, side: 'L' }, { sec: 30, done: true, side: 'R' },
      { sec: 30, done: true, side: 'L' }, { sec: 30, done: true, side: 'R' },
    ] })
    expect(allHeld.ok).toBe(true)
    const secondPairShort = readSession({ id: LIFT, target: T, sets: [
      { sec: 30, done: true, side: 'L' }, { sec: 30, done: true, side: 'R' },
      { sec: 15, done: true, side: 'L' }, { sec: 30, done: true, side: 'R' },
    ] })
    expect(secondPairShort.ok).toBe(false)
    expect(readSession({ id: LIFT, target: T, sets: [
      { sec: 30, done: true, side: 'L' }, { sec: 30, done: true, side: 'R' },
    ] }).ok).toBe(false)
  })
})

describe('stallCount', () => {
  it('从最近往回数连续失误', () => {
    expect(stallCount([{ ok: true }, { ok: true }])).toBe(0)
    expect(stallCount([{ ok: true }, { ok: false }])).toBe(1)
    expect(stallCount([{ ok: false }, { ok: false }, { ok: false }])).toBe(3)
    expect(stallCount([{ ok: false }, { ok: true }, { ok: false }])).toBe(1)
    expect(stallCount([])).toBe(0)
  })

  const miss = (weight: number, low: number) => ({ ok: false, weight, low })

  it('对本次运行的最佳衡量进步，而非仅前一课', () => {
    // 同重量下低次数 8,9,8,9,8：每隔一课超越紧邻的前一课，故只比前一课
    // 会让这个拉锯永远持续而从不减载。9 永不超越更早的 9，停滞连击成立。
    const oscillating = [miss(40, 8), miss(40, 9), miss(40, 8), miss(40, 9), miss(40, 8)]
    expect(stallCount(oscillating, 'double')).toBe(3)
  })

  it('连击在取得进步的会话处结束而非跳过它', () => {
    // 低次数 9,9,9,10：最近一课是本次运行的个最佳。停滞连击应在那里结束
    // 且不计，否则刚进步就会减载。
    const improvedLast = [miss(40, 9), miss(40, 9), miss(40, 9), miss(40, 10)]
    expect(stallCount(improvedLast, 'double')).toBe(0)
  })
})

describe('policyFor', () => {
  it('reps 工作的默认保持应用一贯行为', () => {
    expect(policyFor({ id: LIFT }, null, 'reps')).toBe('linear')
  })
  it('除非要求，计时与有氧工作不动', () => {
    expect(policyFor({ id: LIFT, mode: 'time' }, null, 'time')).toBe('off')
    expect(policyFor({ id: 'cardio-1' }, null, 'cardio')).toBe('off')
  })
  it('动作覆盖例程，例程覆盖默认', () => {
    expect(policyFor({ id: LIFT }, { prog: 'greyskull' }, 'reps')).toBe('greyskull')
    expect(policyFor({ id: LIFT, prog: 'double' }, { prog: 'greyskull' }, 'reps')).toBe('double')
  })
  it('拒绝对模式无意义的策略', () => {
    expect(policyFor({ id: LIFT, mode: 'time', prog: 'greyskull' }, null, 'time')).toBe('off')
    expect(policyFor({ id: 'cardio-1', prog: 'linear' }, null, 'cardio')).toBe('off')
    expect(POLICIES_FOR.cardio).toEqual(['off'])
  })
})

describe('defaultIncrement', () => {
  it('下肢动作跳更大', () => {
    expect(defaultIncrement(LIFT_BP, 'kg')).toBe(2.5)
    expect(defaultIncrement(HEAVY_BP, 'kg')).toBe(5)
  })
  it('按磅缩放', () => {
    expect(defaultIncrement(LIFT_BP, 'lb')).toBe(5)
    expect(defaultIncrement(HEAVY_BP, 'lb')).toBe(10)
  })
  it('未知动作回退', () => {
    expect(defaultIncrement('nope', 'kg')).toBe(2.5)
  })
})

describe('weightIncrement', () => {
  it('用正的覆盖，否则用部位/单位默认', () => {
    expect(weightIncrement({ inc: 1 }, 'kg')).toBe(1)
    expect(weightIncrement({ bp: LIFT_BP }, 'kg')).toBe(2.5)
    expect(weightIncrement({ bp: HEAVY_BP, inc: 0 }, 'kg')).toBe(5)
  })
})

describe('Epley deload helpers', () => {
  it('将处方目标对映射到请求的 Epley 1RM 因子', () => {
    expect(epley1RM(60, 8)).toBe(76)
    expect(deloadTarget1RM(60, 8)).toBe(68.4)
    expect(deloadTarget1RM(60, 8, 0.8)).toBe(60.8)
  })

  it('用配置的因子并保持比例向后兼容', () => {
    expect(DELOAD_FACTOR).toBe(0.9)
    expect(deloadFactorOf({})).toBe(0.9)
    expect(deloadFactorOf({ deloadFactor: 0.8 })).toBe(0.8)
    expect(deloadFactorOf({ deloadFactor: 0.1 })).toBe(0.9)
    expect(isValidDeloadFactor(0.5)).toBe(true)
    expect(isValidDeloadFactor(0.49)).toBe(false)
    expect(isValidDeloadFactor(0.95)).toBe(true)
    expect(isValidDeloadFactor(0.96)).toBe(false)
  })
})

describe('weight grid math', () => {
  it('snapWeight / addStep / stepWeight / deloadTo 与上游一致', () => {
    // 注意 round1(61.25)=61.3（Math.round(612.5)=613），与上游逐位一致
    expect(snapWeight(61.3, 1.25)).toBe(61.3)
    expect(snapWeight(61.3, 0)).toBe(61.3)
    expect(snapWeight(62.4, 2.5)).toBe(62.5)
    expect(addStep(61.25, 1.25, 1.25)).toBe(62.5)   // 在网格上 → snapping
    expect(addStep(62.5, 5, 5)).toBe(67.5)          // 不在网格上 → 简单相加
    expect(stepWeight(60, 2.5, 1)).toBe(62.5)
    expect(stepWeight(62.5, 2.5, -1)).toBe(60)
    // 54 按 2.5 网格：round(21.6)=22 → 55；55<60 故取 55
    expect(deloadTo(60, 2.5)).toBe(55)
    // 5×0.9=4.5 → snapping 到 5，等于当前 → 退一步到 2.5，不低于步长
    expect(deloadTo(5, 2.5)).toBe(2.5)
  })

  it('normalizeRepRange 对齐上界且下界有界', () => {
    expect(normalizeRepRange(10, 8)).toEqual({ reps: 10, repsMin: 8 })
    expect(normalizeRepRange(8, 8)).toEqual({ reps: 9, repsMin: 8 })
    expect(normalizeRepRange(10, undefined)).toEqual({ reps: 10, repsMin: 8 })
  })

  it('backoffAt 从顶组按步长递减并在网格上 snapping', () => {
    expect(backoffAt(100, 0, 10)).toBe(100)
    expect(backoffAt(100, 1, 10)).toBe(90)
    expect(backoffAt(100, 3, 10)).toBe(70)
    expect(backoffAt(100, 1, 0)).toBe(100)
  })
})

describe('plannedOf / planChanged', () => {
  it('保留例程所言的组数/次数/秒数/上限', () => {
    expect(plannedOf({ sets: 3, reps: 5 })).toEqual({ sets: 3, reps: 5 })
    expect(plannedOf({ sets: 2, reps: 8, repsMin: 6 })).toEqual({ sets: 2, reps: 8, repsMin: 6 })
    expect(plannedOf({ sets: 1, sec: 45, mode: 'time' })).toEqual({ sets: 1, sec: 45 })
    expect(plannedOf({ sets: 3, reps: 8, setsMax: 5 })).toEqual({ sets: 3, reps: 8, setsMax: 5 })
    expect(plannedOf({ sets: 3, reps: 5, weight: 60 })).toEqual({ sets: 3, reps: 5, weight: 60 })
  })

  it('组数或次数变化才算计划变更', () => {
    const planned = plannedOf({ sets: 3, reps: 5 })
    expect(planChanged(planned, { sets: 3, reps: 5 })).toBe(false)
    expect(planChanged(planned, { sets: 4, reps: 5 })).toBe(true)
    expect(planChanged(planned, { sets: 3, reps: 6 })).toBe(true)
    expect(planChanged(null, { sets: 3, reps: 5 })).toBe(false)
  })
})

describe('sessionsFor', () => {
  it('按最旧在前返回该动作的每次训练', () => {
    const S = hist(LIFT, [[60, 5, 5, 5], [62.5, 5, 5, 4], [62.5, 5, 5, 5]])
    const sessions = sessionsFor(S, LIFT, { sets: 3, reps: 5 })
    expect(sessions.length).toBe(3)
    expect(sessions.map(s => s.d)).toEqual(['2026-01-01', '2026-01-02', '2026-01-03'])
    expect(sessions.map(s => s.ok)).toEqual([true, false, true])
    expect(sessions[2].weight).toBe(62.5)
  })

  it('跳过排除的条目与没有完成组的训练', () => {
    const S = {
      unit: 'kg',
      workouts: [
        { d: '2026-01-01', entries: [{ id: LIFT, target: { sets: 1, reps: 5 }, sets: [{ w: 60, r: 5, done: true }] }] },
        { d: '2026-01-02', excludeFromProgression: true, entries: [{ id: LIFT, target: { sets: 1, reps: 5 }, sets: [{ w: 60, r: 5, done: true }] }] },
        { d: '2026-01-03', entries: [{ id: LIFT, noProg: true, target: { sets: 1, reps: 5 }, sets: [{ w: 60, r: 5, done: true }] }] },
        { d: '2026-01-04', entries: [{ id: LIFT, target: { sets: 1, reps: 5 }, sets: [{ w: 60, r: 5, done: false }] }] },
      ],
    }
    const sessions = sessionsFor(S, LIFT, { sets: 1, reps: 5 })
    expect(sessions.length).toBe(1)
    expect(sessions[0].d).toBe('2026-01-01')
  })
})

describe('selectDeloadCandidate', () => {
  it('为 Epley 目标挑选最接近网格的负重/次数对', () => {
    const c = selectDeloadCandidate({
      currentWeight: 100, targetWeight: 100, targetReps: 8, step: 2.5,
      reps: 8, repsMin: 6,
    })
    expect(c).not.toBeNull()
    // 目标 1RM = round1(epley(100,8)*0.9) = round1(126.7*0.9) = 114；
    // 90kg×8 的 Epley 恰为 114（误差 0、次数变更 0），赢得字典序
    expect(c?.weight).toBe(90)
    expect(c?.reps).toBe(8)
    expect(c?.target1RM).toBe(114)
    expect(c?.factor).toBe(0.9)
  })

  it('输入不诚实时返回 null', () => {
    expect(selectDeloadCandidate({ currentWeight: 0, targetWeight: 100, targetReps: 8, step: 2.5 })).toBeNull()
    expect(selectDeloadCandidate({ currentWeight: 100, targetWeight: 100, targetReps: 8, step: 0 })).toBeNull()
  })
})

describe('tripleSetsOf', () => {
  it('组数边界受 MAX_TRIPLE_SETS 限制', () => {
    expect(tripleSetsOf({ sets: 3 })).toEqual({ setsMin: 3, setsMax: 3 })
    expect(tripleSetsOf({ sets: 3, setsMax: 5 })).toEqual({ setsMin: 3, setsMax: 5 })
    expect(tripleSetsOf({ sets: 3, setsMax: 99 })).toEqual({ setsMin: 3, setsMax: MAX_TRIPLE_SETS })
    expect(tripleSetsOf({ sets: 0 })).toEqual({ setsMin: 1, setsMax: 1 })
  })
})
