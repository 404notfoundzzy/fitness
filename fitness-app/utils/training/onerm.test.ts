// 1RM 估算测试 —— 移植自 openGym（AGPL-3.0）onerm.test.js，上游 commit e348fc1。
// 作为移植的行为不变性验收基线：算法必须与上游逐用例一致。
import { describe, it, expect } from 'vitest'
import {
  estimate1RM, bestSetOf, e1rmSeries, best1RM, is1RMRecord, REP_CAP, WEIGHTED_REP_CAP,
  FORMULAS, calculate1RMAccuracy, formulaOf,
} from './onerm'

describe('estimate1RM', () => {
  it('单次力竭原样返回', () => {
    expect(estimate1RM(100, 1)).toBe(100)
    expect(estimate1RM(62.5, 1)).toBe(62.5)
  })

  it('与手算 Epley 在常用次数区间一致', () => {
    expect(estimate1RM(100, 5)).toBe(116.7)   // 100 · (1 + 5/30)
    expect(estimate1RM(100, 10)).toBe(133.3)
    expect(estimate1RM(80, 8)).toBe(101.3)
    expect(estimate1RM(60, 3)).toBe(66)
  })

  it('保留一位小数', () => {
    expect(estimate1RM(101.25, 7)).toBe(124.9)
    expect(Number.isInteger((estimate1RM(100, 3) as number) * 10)).toBe(true)
  })

  it('超过上限拒绝猜测而非胡诌', () => {
    expect(estimate1RM(100, REP_CAP)).not.toBeNull()
    expect(estimate1RM(100, REP_CAP + 1)).toBeNull()
    expect(estimate1RM(60, 30)).toBeNull()
  })

  it('拒绝无效、零与负输入', () => {
    expect(estimate1RM(0, 5)).toBeNull()
    expect(estimate1RM(-100, 5)).toBeNull()
    expect(estimate1RM(100, 0)).toBeNull()
    expect(estimate1RM(100, -3)).toBeNull()
    expect(estimate1RM(undefined, 5)).toBeNull()
    expect(estimate1RM(100, undefined)).toBeNull()
    expect(estimate1RM(NaN, 5)).toBeNull()
    expect(estimate1RM(Infinity, 5)).toBeNull()
    expect(estimate1RM('', '')).toBeNull()
  })

  it('接受数字字符串——数字输入框到达的形状', () => {
    expect(estimate1RM('100', '5')).toBe(116.7)
  })

  it('提供其他文档化公式，低次数时互相一致', () => {
    expect(estimate1RM(100, 5, 'brzycki')).toBe(112.5)
    expect(estimate1RM(100, 5, 'lombardi')).toBe(117.5)
    expect(Object.keys(FORMULAS)).toContain('epley')
  })

  it('8 次以内各公式相差几个百分点，上限处分歧最大', () => {
    const spread = (r: number) => Math.max(...Object.keys(FORMULAS).map(f => estimate1RM(100, r, f) as number))
      - Math.min(...Object.keys(FORMULAS).map(f => estimate1RM(100, r, f) as number))
    expect(spread(1)).toBe(0)                       // 一次是测量，不是估计
    for (let r = 2; r <= 8; r++) expect(spread(r)).toBeLessThan(10)
    const upTo: number[] = []
    for (let r = 1; r < REP_CAP; r++) upTo.push(spread(r))
    expect(spread(REP_CAP)).toBeGreaterThan(Math.max(...upTo))   // REP_CAP 存在的理由
  })

  it('未知公式名回落默认', () => {
    expect(estimate1RM(100, 5, 'nope')).toBe(estimate1RM(100, 5))
  })
})

describe('新公式（oconner, mayhew, wathan, lander）', () => {
  it('O\'Conner r=5 与手算一致', () => {
    expect(estimate1RM(100, 5, 'oconner')).toBe(112.5)
  })

  it('Mayhew r=5 与手算一致', () => {
    const expected = (100 * 100) / (52.2 + 41.9 * Math.exp(-0.055 * 5))
    expect(estimate1RM(100, 5, 'mayhew')).toBe(Math.round(expected * 10) / 10)
  })

  it('Wathan r=5 与手算一致', () => {
    const expected = (100 * 100) / (48.8 + 53.8 * Math.exp(-0.075 * 5))
    expect(estimate1RM(100, 5, 'wathan')).toBe(Math.round(expected * 10) / 10)
  })

  it('Lander r=5 与手算一致', () => {
    const expected = (100 * 100) / (101.3 - 2.67123 * 5)
    expect(estimate1RM(100, 5, 'lander')).toBe(Math.round(expected * 10) / 10)
  })

  it('七个公式全部在 FORMULAS 中', () => {
    expect(Object.keys(FORMULAS)).toEqual(
      expect.arrayContaining(['epley', 'brzycki', 'lombardi', 'oconner', 'mayhew', 'wathan', 'lander']),
    )
  })
})

describe('加权公式', () => {
  it('返回落在各公式最小最大值之间的有限估计', () => {
    const est = estimate1RM(100, 5, 'weighted') as number
    const vals = Object.keys(FORMULAS).map(f => estimate1RM(100, 5, f) as number)
    expect(est).toBeGreaterThan(Math.min(...vals) - 0.1)
    expect(est).toBeLessThan(Math.max(...vals) + 0.1)
  })

  it('单次原样返回', () => {
    expect(estimate1RM(100, 1, 'weighted')).toBe(100)
  })

  it('有效次数超过 WEIGHTED_REP_CAP 返回 null', () => {
    expect(estimate1RM(100, WEIGHTED_REP_CAP, 'weighted')).not.toBeNull()
    expect(estimate1RM(100, WEIGHTED_REP_CAP + 1, 'weighted')).toBeNull()
  })

  it('接受超过 REP_CAP 但在 WEIGHTED_REP_CAP 内的次数', () => {
    expect(estimate1RM(100, 13, 'weighted')).not.toBeNull()
    expect(estimate1RM(100, 13, 'epley')).toBeNull()
  })

  it('保留一位小数', () => {
    const est = estimate1RM(100, 8, 'weighted') as number
    expect(Number.isInteger(est * 10)).toBe(true)
  })
})

describe('RIR 处理', () => {
  it('恰好 1 次且 RIR 0 原样返回', () => {
    expect(estimate1RM(100, 1, 'weighted', 0)).toBe(100)
    expect(estimate1RM(80, 1, 'epley', 0)).toBe(80)
  })

  it('加权 + RIR 按有效次数计算集合', () => {
    const withRir = estimate1RM(100, 5, 'weighted', 2) as number
    const withoutRir = estimate1RM(100, 5, 'weighted') as number
    expect(withRir).toBeGreaterThan(withoutRir)
  })

  it('RIR 映射单独估计（如 RIR 2、5 次）≈ 重量 / 0.892', () => {
    const est = estimate1RM(100, 5, 'weighted', 2) as number
    expect(est).toBeGreaterThan(110)
    expect(est).toBeLessThan(140)
  })

  it('有效次数超过 WEIGHTED_REP_CAP 返回 null', () => {
    expect(estimate1RM(100, 13, 'weighted', 3)).toBeNull()
  })

  it('忽略负值或非数字 RIR', () => {
    expect(estimate1RM(100, 5, 'weighted', -1)).toBe(estimate1RM(100, 5, 'weighted'))
    expect(estimate1RM(100, 5, 'weighted', 'abc')).toBe(estimate1RM(100, 5, 'weighted'))
  })

  it('单个公式忽略 RIR 参数', () => {
    expect(estimate1RM(100, 5, 'epley', 2)).toBe(estimate1RM(100, 5, 'epley'))
  })
})

describe('calculate1RMAccuracy', () => {
  it('单次力竭返回 1', () => {
    expect(calculate1RMAccuracy(1, 0)).toBe(1)
  })

  it('超过 WEIGHTED_REP_CAP 返回 0', () => {
    expect(calculate1RMAccuracy(WEIGHTED_REP_CAP + 1)).toBe(0)
  })

  it('非正或非有限输入返回 0', () => {
    expect(calculate1RMAccuracy(0)).toBe(0)
    expect(calculate1RMAccuracy(-1)).toBe(0)
    expect(calculate1RMAccuracy(NaN)).toBe(0)
  })

  it('次数越高置信越低', () => {
    const a3 = calculate1RMAccuracy(3)
    const a8 = calculate1RMAccuracy(8)
    const a13 = calculate1RMAccuracy(13)
    expect(a3).toBeGreaterThan(a8)
    expect(a8).toBeGreaterThan(a13)
  })

  it('RIR 存在惩罚约 8%', () => {
    const noRir = calculate1RMAccuracy(5)
    const withRir = calculate1RMAccuracy(5, 2)
    expect(withRir).toBeCloseTo(noRir * 0.92, 1)
  })

  it('RIR 0 不惩罚（力竭）', () => {
    expect(calculate1RMAccuracy(5, 0)).toBe(calculate1RMAccuracy(5))
  })

  it('返回值在 0 与 1 之间', () => {
    for (let r = 1; r <= WEIGHTED_REP_CAP; r++) {
      expect(calculate1RMAccuracy(r)).toBeGreaterThanOrEqual(0)
      expect(calculate1RMAccuracy(r)).toBeLessThanOrEqual(1)
    }
  })

  it('离散度因子仅对加权公式生效', () => {
    const weightedAcc = calculate1RMAccuracy(8, null, 'weighted')
    const epleyAcc = calculate1RMAccuracy(8, null, 'epley')
    expect(weightedAcc).toBeLessThanOrEqual(epleyAcc)
  })
})

describe('bestSetOf', () => {
  it('取估计值最高的一组，而非最重的一组', () => {
    const entry = { id: 'x', sets: [
      { w: 100, r: 5, done: true },   // 116.7
      { w: 110, r: 3, done: true },   // 121.0
      { w: 120, r: 1, done: true }    // 120.0
    ] }
    expect(bestSetOf(entry)).toEqual({ est: 121, w: 110, r: 3 })
  })

  it('忽略未勾选的组', () => {
    const entry = { id: 'x', sets: [{ w: 100, r: 5, done: true }, { w: 200, r: 5, done: false }] }
    expect(bestSetOf(entry)?.w).toBe(100)
  })

  it('忽略无次数 attached 的 topW', () => {
    const entry = { id: 'x', topW: 200, sets: [{ w: 100, r: 5, done: true }] }
    expect(bestSetOf(entry)?.est).toBe(116.7)
  })

  it('有氧与计时条目返回 null', () => {
    expect(bestSetOf({ id: 'c', sets: [{ min: 20, speed: 9, done: true }] })).toBeNull()
    expect(bestSetOf({ id: 'p', sets: [{ sec: 60, w: 0, done: true }] })).toBeNull()
    expect(bestSetOf({ id: 'p', sets: [{ sec: 60, w: 20, done: true }] })).toBeNull()
  })

  it('承受缺失或空条目', () => {
    expect(bestSetOf(null)).toBeNull()
    expect(bestSetOf({ sets: [] })).toBeNull()
  })
})

const S = {
  workouts: [
    { d: '2026-01-01', start: 1, entries: [{ id: 'bench', sets: [{ w: 80, r: 5, done: true }] }] },
    { d: '2026-01-08', start: 2, entries: [{ id: 'squat', sets: [{ w: 100, r: 5, done: true }] }] },
    { d: '2026-01-15', start: 3, entries: [{ id: 'bench', sets: [{ w: 90, r: 5, done: true }, { w: 90, r: 3, done: false }] }] },
    { d: '2026-01-22', start: 4, entries: [{ id: 'bench', sets: [{ w: 85, r: 5, done: true }] }] },
    { d: '2026-01-29', start: 5, entries: [{ id: 'run', sets: [{ min: 30, speed: 10, done: true }] }] }
  ]
}

describe('e1rmSeries / best1RM', () => {
  it('每次产生估计的训练一个按时间排序的点', () => {
    const pts = e1rmSeries(S, 'bench')
    expect(pts.map(p => p.d)).toEqual(['2026-01-01', '2026-01-15', '2026-01-22'])
    expect(pts.map(p => p.y)).toEqual([93.3, 105, 99.2])
  })

  it('报告全时段最佳及其背后的组', () => {
    expect(best1RM(S, 'bench')).toEqual({ est: 105, w: 90, r: 5, d: '2026-01-15', t: 3 })
  })

  it('对有氧或未知动作无话可说', () => {
    expect(e1rmSeries(S, 'run')).toEqual([])
    expect(best1RM(S, 'run')).toBeNull()
    expect(best1RM(S, 'nope')).toBeNull()
    expect(best1RM({ workouts: [] }, 'bench')).toBeNull()
    expect(best1RM({}, 'bench')).toBeNull()
  })

  it('同日重复出现只取最强的一次', () => {
    const workouts = [{ d: '2026-02-01', start: 1, entries: [
      { id: 'bench', sets: [{ w: 60, r: 5, done: true }] },
      { id: 'bench', sets: [{ w: 100, r: 5, done: true }] },
    ] }]
    expect(e1rmSeries({ workouts }, 'bench')).toEqual([{ t: 1, d: '2026-02-01', y: 116.7, w: 100, r: 5 }])
    expect(best1RM({ workouts }, 'bench')).toMatchObject({ est: 116.7, w: 100, r: 5, d: '2026-02-01' })
  })

  it('估算每侧已完成肢体的估计，计时/有氧行排除在外', () => {
    const sides = { id: 'bench', target: { mode: 'reps', side: true }, sets: [{ w: 100, r: 10, done: false,
      sides: { L: { w: 100, r: 5, done: true }, R: { w: 90, r: 5, done: false } } }] }
    expect(bestSetOf(sides)).toEqual({ est: 116.7, w: 100, r: 5 })
    expect(e1rmSeries({ workouts: [{ start: 1, d: '2026-02-01', entries: [sides] }] }, 'bench'))
      .toEqual([{ t: 1, d: '2026-02-01', y: 116.7, w: 100, r: 5 }])
    expect(e1rmSeries({ workouts: [{ start: 1, d: '2026-02-01', entries: [
      { id: 'hold', target: { mode: 'time' }, sets: [{ sec: 60, w: 200, r: 5, done: true }] },
      { id: 'run', target: { mode: 'cardio' }, sets: [{ min: 20, speed: 9, r: 5, done: true }] },
    ] }] }, 'hold')).toEqual([])
  })
})

describe('is1RMRecord', () => {
  it('标记刷新了所有历史估计的训练', () => {
    const rec = is1RMRecord(S, 'bench', { id: 'bench', sets: [{ w: 95, r: 5, done: true }] })
    expect(rec).toEqual({ est: 110.8, w: 95, r: 5, prev: 105 })
  })

  it('未破纪录时保持沉默', () => {
    expect(is1RMRecord(S, 'bench', { id: 'bench', sets: [{ w: 90, r: 5, done: true }] })).toBeNull()
    expect(is1RMRecord(S, 'bench', { id: 'bench', sets: [{ w: 80, r: 5, done: true }] })).toBeNull()
  })

  it('历史首次估计即算纪录', () => {
    const rec = is1RMRecord(S, 'deadlift', { id: 'deadlift', sets: [{ w: 140, r: 3, done: true }] })
    expect(rec?.prev).toBe(0)
    expect(rec?.est).toBe(154)
  })

  it('计时或未完成条目无话可说', () => {
    expect(is1RMRecord(S, 'plank', { id: 'plank', sets: [{ sec: 90, done: true }] })).toBeNull()
    expect(is1RMRecord(S, 'bench', { id: 'bench', sets: [{ w: 200, r: 5, done: false }] })).toBeNull()
  })
})

describe('递减组、暂停休息组与 1RM', () => {
  it('仅从主/激活重量×次数估算，忽略更轻的递减', () => {
    const entry = { id: 'x', sets: [
      { type: 'dropset', w: 100, r: 5, done: true, drops: [{ w: 80, r: 5 }, { w: 60, r: 5 }] },
    ] }
    expect(bestSetOf(entry)).toEqual(bestSetOf({ id: 'x', sets: [{ w: 100, r: 5, done: true }] }))
  })

  it('仅从本行自身 w/r 估算，忽略暂停休息爆发段', () => {
    const entry = { id: 'x', sets: [
      { type: 'restpause', w: 60, r: 8, done: true, clusters: [{ r: 4, restSec: 15 }, { r: 3, restSec: 15 }] },
    ] }
    expect(bestSetOf(entry)).toEqual(bestSetOf({ id: 'x', sets: [{ w: 60, r: 8, done: true }] }))
  })

  it('暂停休息行总次数超 REP_CAP 时拒绝估算，与任何高次数组同规', () => {
    const entry = { id: 'x', sets: [
      { type: 'restpause', w: 60, r: 20, done: true, clusters: [{ r: 10, restSec: 15 }, { r: 5, restSec: 15 }, { r: 3, restSec: 15 }, { r: 1, restSec: 15 }, { r: 1, restSec: 15 }] },
    ] }
    expect(bestSetOf(entry)).toBeNull()
  })
})

describe('热身组与 1RM', () => {
  const ENTRY = { id: 'warm-test', sets: [
    { w: 20, r: 8, done: true, warmup: true },
    { w: 80, r: 5, done: true },
  ] }

  it('勾选的热身组不能设定或抬高估计 1RM', () => {
    const working = { id: 'warm-test', sets: [{ w: 80, r: 5, done: true }] }
    expect(bestSetOf(ENTRY)).toEqual(bestSetOf(working))
    expect(best1RM({ workouts: [{ entries: [ENTRY] }] }, 'warm-test')).toEqual(
      best1RM({ workouts: [{ entries: [working] }] }, 'warm-test'),
    )
  })
})

describe('用户选择的公式（设置项）', () => {
  const S2 = { workouts: [{ d: '2026-10-01', entries: [{ id: 'x', sets: [{ w: 100, r: 8, done: true }] }] }] }
  it('无存储或未知时读默认', () => {
    expect(formulaOf({})).toBe('epley')
    expect(formulaOf({ oneRmFormula: 'toString' })).toBe('epley')
    expect(formulaOf({ oneRmFormula: 'brzycki' })).toBe('brzycki')
    expect(formulaOf({ oneRmFormula: 'weighted' })).toBe('weighted')
  })
  it('存储的公式驱动 best1RM，无需每个调用方传参', () => {
    expect(best1RM(S2, 'x')?.est).toBe(estimate1RM(100, 8, 'epley'))
    expect(best1RM({ ...S2, oneRmFormula: 'brzycki' }, 'x')?.est).toBe(estimate1RM(100, 8, 'brzycki'))
    expect(best1RM({ ...S2, oneRmFormula: 'brzycki' }, 'x')?.est as number).toBeLessThan(best1RM(S2, 'x')?.est as number)
  })
})
