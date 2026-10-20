// 努力度测试 —— 移植自 openGym（AGPL-3.0）effort.test.js，上游 commit e348fc1。
// 依赖 recovery.js（resolveSetRir 估计回退）的用例待 recovery 模块移植后补充。
import { describe, it, expect } from 'vitest'
import {
  rirOf, toScale, displayScale, avgRir, effortSummary, hasEffort, hasEstimableEffort, effortWeeks,
  effortHistogram, isHardSet, HARD_RIR, MIN_RATED,
  effortColor, EFFORT_BANDS, EFFORT_PRESETS,
} from './effort'
import { isoOf } from './model'

const daysAgo = (n: number): Date => { const d = new Date(); d.setDate(d.getDate() - n); return d }
// 一天一次训练，带给定组。除特别说明外这里每个组都已完成——统计读的就是它们。
const W = (n: number, sets: Array<Record<string, unknown>>) => {
  const d = daysAgo(n)
  return { id: 'w' + n, d: isoOf(d), start: +d, entries: [{ id: 'bench', sets: sets.map(s => ({ w: 60, r: 8, done: true, ...s })) }] }
}
const S = (...workouts: unknown[]) => ({ workouts })

describe('rirOf', () => {
  it('直读 RIR，RPE 为其镜像——RPE 8 即 RIR 2', () => {
    expect(rirOf({ rir: 2 })).toBe(2)
    expect(rirOf({ rpe: 8 })).toBe(2)
    expect(rirOf({ rpe: 9.5 })).toBe(0.5)
  })

  it('保留已评级的 0，拒绝一切只是看起来像 0 的', () => {
    expect(rirOf({ rir: 0 })).toBe(0)        // 力竭——是评级，不是"空"
    expect(rirOf({ rpe: 10 })).toBe(0)
    expect(rirOf({})).toBe(null)
    expect(rirOf({ rir: null })).toBe(null)
    expect(rirOf(null)).toBe(null)
  })

  it('文件同时写入两种时优先组自身记录的刻度', () => {
    expect(rirOf({ rir: 3, rpe: 9 })).toBe(3)
  })
})

describe('toScale', () => {
  it('换算回屏幕上在用的刻度', () => {
    expect(toScale('rir', 2)).toBe(2)
    expect(toScale('rpe', 2)).toBe(8)
    expect(toScale('rpe', 0)).toBe(10)
    expect(toScale('rir', null)).toBe(null)
  })

  it('往返不产生浮点碎屑', () => {
    expect(toScale('rpe', 10 - 7.5)).toBe(7.5)
  })
})

describe('displayScale', () => {
  it('有档案设置时跟随它', () => {
    expect(displayScale({ effort: 'rpe', workouts: [] })).toBe('rpe')
    expect(displayScale({ effort: 'rir', workouts: [] })).toBe('rir')
  })

  it('未评级档案显示其导入历史实际写入的刻度', () => {
    expect(displayScale({ effort: 'none', ...S(W(3, [{ rpe: 8 }, { rpe: 9 }])) })).toBe('rpe')
    expect(displayScale({ effort: 'none', ...S(W(3, [{ rir: 2 }])) })).toBe('rir')
    expect(displayScale({ effort: 'none', workouts: [] })).toBe('rir')
  })
})

describe('avgRir', () => {
  it('平均已评级组，忽略其余', () => {
    expect(avgRir([{ rir: 1 }, { rir: 3 }])).toBe(2)
    expect(avgRir([{ rir: 1 }, {}, { rpe: 7 }])).toBe(2)   // RPE 7 = RIR 3
  })

  it('无评级时返回 null 而非 0', () => {
    expect(avgRir([{}, { rir: null }])).toBe(null)
    expect(avgRir([])).toBe(null)
    expect(avgRir(null)).toBe(null)
  })
})

describe('effortSummary', () => {
  const st = S(
    W(2, [{ rir: 1 }, { rir: 3 }, { rir: 2 }]),
    W(4, [{ rir: 0 }, { rpe: 6 }, {}]),          // RPE 6 = RIR 4，一组未评级
    W(40, [{ rir: 5 }, { rir: 5 }])
  )

  it('已评级组对照每个已完成组计数，而非自比', () => {
    const r = effortSummary(st, 0)
    expect(r.done).toBe(8)
    expect(r.rated).toBe(7)
  })

  it('未评级组排除在均值外，而非读作力竭', () => {
    const r = effortSummary(S(W(2, [{ rir: 4 }, {}, {}, {}, {}, {}])), 0)
    expect(r.rated).toBe(1)
    expect(r.avg).toBe(null)        // 一个评级不是均值
  })

  it('等到真实样本才报数', () => {
    const few = S(W(2, new Array(MIN_RATED - 1).fill({ rir: 2 })))
    expect(effortSummary(few, 0).avg).toBe(null)
    const enough = S(W(2, new Array(MIN_RATED).fill({ rir: 2 })))
    expect(effortSummary(enough, 0).avg).toBe(2)
  })

  it('计数接近力竭的组', () => {
    const r = effortSummary(st, 0)
    expect(r.hard).toBe(4)                       // 1, 3, 2, 0——4 和两个 5 不算
    expect(r.hardPct).toBeCloseTo(4 / 7)
  })

  it('遵守窗口', () => {
    const r = effortSummary(st, 7)
    expect(r.rated).toBe(5)                      // 40 天前的训练出局
    expect(effortSummary(st, 3).rated).toBe(3)
  })

  it('承受完全没有训练的档案', () => {
    expect(effortSummary({ workouts: [] }, 30)).toEqual({ done: 0, rated: 0, est: 0, covered: 0, hard: 0, avg: null, hardPct: null })
  })
})

describe('isHardSet / effortColor', () => {
  it('够难的组是已评级且 RIR 达到阈值的', () => {
    expect(isHardSet({ rir: 2 })).toBe(true)
    expect(isHardSet({ rir: HARD_RIR })).toBe(true)
    expect(isHardSet({ rir: HARD_RIR + 1 })).toBe(false)
    expect(isHardSet({})).toBe(false)
    expect(isHardSet(null)).toBe(false)
  })

  it('色带按 RIR 落入，null 无色', () => {
    expect(effortColor(null)).toBeNull()
    expect(effortColor(0)).toBe(EFFORT_BANDS[0].color)          // 紫：力竭
    expect(effortColor(1)).toBe(EFFORT_BANDS[2].color)          // 橙：还能一次
    expect(effortColor(1.5)).toBe(EFFORT_BANDS[2].color)        // 中间值落所在带
    expect(effortColor(10)).toBe(EFFORT_BANDS[EFFORT_BANDS.length - 1].color)
  })

  it('预设最难在前，尾桶标记在最后一个', () => {
    expect(EFFORT_PRESETS[0].rir).toBe(0)
    expect(EFFORT_PRESETS[EFFORT_PRESETS.length - 1].tail).toBe(true)
    expect(EFFORT_PRESETS.filter(p => p.tail).length).toBe(1)
  })

  it('预设为中文文案', () => {
    expect(EFFORT_PRESETS[0].feel).toMatch(/[\u4e00-\u9fa5]/)
  })
})

describe('hasEffort / hasEstimableEffort', () => {
  it('有已评级组才显示努力度', () => {
    expect(hasEffort(S(W(2, [{ rir: 2 }])))).toBe(true)
    expect(hasEffort(S(W(2, [{}])))).toBe(false)
    expect(hasEffort({ workouts: [] })).toBe(false)
  })

  it('有负重、低次数、非辅助的组可估计', () => {
    expect(hasEstimableEffort(S(W(2, [{}])))).toBe(true)              // 默认 w60 r8
    expect(hasEstimableEffort(S(W(2, [{ w: 0, r: 8 }])))).toBe(false) // 无负重
    expect(hasEstimableEffort(S(W(2, [{ r: 20 }])))).toBe(false)      // 超出 12 次
    expect(hasEstimableEffort({ workouts: [] })).toBe(false)
  })
})

describe('effortHistogram / effortWeeks', () => {
  it('直方图按整步分桶，4 以上并入尾桶', () => {
    const st = S(W(2, [{ rir: 0 }, { rir: 1 }, { rir: 2 }, { rir: 3 }, { rir: 7 }]))
    const bins = effortHistogram(st, 0)
    expect(bins.map(b => b.n)).toEqual([1, 1, 1, 1, 1])
    expect(bins[4].tail).toBe(true)
    expect(bins.reduce((a, b) => a + b.pct, 0)).toBeCloseTo(1)
  })

  it('周聚合只保留至少两个已评级组的周', () => {
    const st = S(W(2, [{ rir: 2 }, { rir: 4 }]), W(9, [{ rir: 1 }]))
    const weeks = effortWeeks(st, 0)
    expect(weeks.length).toBe(1)
    expect(weeks[0].rir).toBe(3)
    expect(weeks[0].n).toBe(2)
    expect(weeks[0].sets).toBe(2)
  })

  it('空档案返回空数组', () => {
    expect(effortHistogram({ workouts: [] }, 0).every(b => b.n === 0)).toBe(true)
    expect(effortWeeks({ workouts: [] }, 0)).toEqual([])
  })
})
