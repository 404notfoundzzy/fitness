// 疲劳/恢复模型测试 —— 移植自 openGym（AGPL-3.0）recovery.test.js，上游 commit e348fc1。
// 上游 fixture 取自目录（EXDB），此处用等价的内联动作定义替代，数值期望逐条不变。
import { describe, expect, it } from 'vitest'
import {
  BODYWEIGHT_REF_LOAD,
  FATIGUE_CHRONIC_WINDOW_MS,
  FATIGUE_MAX_SETS_PER_SESSION,
  FATIGUE_NOVICE_WEEKLY_SETS,
  FATIGUE_RATIO_MAX,
  FATIGUE_RATIO_MIN,
  FATIGUE_RIR_FLOOR_WEIGHT,
  FATIGUE_SCAN_MS,
  FATIGUE_SETS_PER_UNIT,
  FATIGUE_STATES,
  STRENGTH_FLOOR,
  STRENGTH_FULL_MS,
  STRENGTH_HALF_LIFE_MS,
  detrainedMuscles,
  anchorsByWorkout,
  estimateSetRir,
  fatiguedMuscles,
  fatigueHalfLifeOf,
  fatigueOf,
  fatigueStateOf,
  halfLifeDecay,
  resolveSetRir,
  rirWeightFor,
  strengthOf,
} from './recovery'
import { MUSCLES, exerciseMuscleSnapshot, musclesOf } from './muscles'
import { estimate1RM } from './onerm'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const NOW = Date.UTC(2026, 0, 1, 12)

// 单肌肉满权重 fixture（上游 SINGLE）：chest=1
const SINGLE = { id: 'single-chest', tg: 'chest', eq: 'barbell' }
// 带次要肌肉 fixture（上游 WEIGHTED）：chest=1, triceps=0.4, deltoids=0.4
const WEIGHTED = { id: 'weighted', tg: 'chest', mg: 'triceps', sm: ['deltoids'], eq: 'barbell' }
// 自重 fixture（上游 bodyweight）
const BODYWEIGHT_EX = { id: 'bw-chest', tg: 'chest', eq: 'body weight' }

const SINGLE_WEIGHTS = musclesOf(SINGLE)
const WEIGHTED_WEIGHTS = musclesOf(WEIGHTED)
const SINGLE_SLUG = Object.keys(SINGLE_WEIGHTS)[0]
const WEIGHTED_PRIMARY_SLUG = Object.keys(WEIGHTED_WEIGHTS).find(slug => WEIGHTED_WEIGHTS[slug] === 1) as string
const SECONDARY_SLUG = Object.keys(WEIGHTED_WEIGHTS).find(slug => WEIGHTED_WEIGHTS[slug] === 0.4) as string

const workoutAt = (id: string, start: number, sets: Array<Record<string, unknown>> = [{ done: true }]) => ({
  d: new Date(start).toISOString(),
  start,
  entries: [{ id, sets: sets.map(set => ({ ...set })) }],
})
// 一次以该条目自身最佳负荷完成的组记恰好 1 个有效组；
// FATIGUE_SETS_PER_UNIT 个这样的组构成 1.0 原始单位。
const doneWorkoutAt = (id: string, start: number, count = 1) =>
  workoutAt(id, start, Array.from({ length: count }, () => ({ done: true, w: 80, r: 8 })))
const zeroFatigue = () => Object.fromEntries(MUSCLES.map(slug => [slug, 0]))
const floorStrength = () => Object.fromEntries(MUSCLES.map(slug => [slug, STRENGTH_FLOOR]))

const stableFloat = (value: number) => Number(value.toFixed(12))

// 均匀负荷训练的期望饱和疲劳（每组都是条目最佳，故 RIR 0 组记满）。
const effGain = (eff: number) => Math.min(
  FATIGUE_RATIO_MAX,
  Math.max(FATIGUE_RATIO_MIN, (eff + FATIGUE_NOVICE_WEEKLY_SETS) / (eff / 4 + FATIGUE_NOVICE_WEEKLY_SETS)),
)
const expectedSets = (sets: number, weight: number, slug: string, age = 0, gainEff: number | null = null) => {
  const eff = Math.min(sets * weight, FATIGUE_MAX_SETS_PER_SESSION)
  const gain = gainEff === null ? effGain(eff) : gainEff
  return 1 - Math.exp(-eff / FATIGUE_SETS_PER_UNIT * gain * halfLifeDecay(age, fatigueHalfLifeOf(slug)))
}

describe('recovery constants', () => {
  it('导出钉死的窗口、半衰期、下限与状态标签', () => {
    expect(FATIGUE_SETS_PER_UNIT).toBe(8)
    expect(FATIGUE_MAX_SETS_PER_SESSION).toBe(12)
    expect(FATIGUE_SCAN_MS).toBe(30 * DAY)
    expect(STRENGTH_FULL_MS).toBe(14 * DAY)
    expect(STRENGTH_HALF_LIFE_MS).toBe(28 * DAY)
    expect(STRENGTH_FLOOR).toBe(0.5)
    expect(FATIGUE_STATES).toEqual({ READY: 'ready', RECOVERING: 'recovering', FATIGUED: 'fatigued' })
    expect(halfLifeDecay(DAY, DAY)).toBe(0.5)
  })

  it('小上肢肌肉比腿和下背恢复更快', () => {
    expect(fatigueHalfLifeOf('biceps')).toBe(24 * HOUR)
    expect(fatigueHalfLifeOf('deltoids')).toBe(24 * HOUR)
    expect(fatigueHalfLifeOf('chest')).toBe(30 * HOUR)
    expect(fatigueHalfLifeOf('upper-back')).toBe(30 * HOUR)
    expect(fatigueHalfLifeOf('quadriceps')).toBe(48 * HOUR)
    expect(fatigueHalfLifeOf('hamstring')).toBe(48 * HOUR)
    expect(fatigueHalfLifeOf('lower-back')).toBe(48 * HOUR)
    expect(fatigueHalfLifeOf('not-a-muscle')).toBe(30 * HOUR)
  })
})

describe('fatigueOf and strengthOf', () => {
  it('返回每个肌肉、就绪/下限默认值与空历史的钩子默认值', () => {
    const fatigue = fatigueOf([], NOW)
    const strength = strengthOf([], NOW)

    expect(Object.keys(fatigue)).toEqual(MUSCLES)
    expect(fatigue).toEqual(zeroFatigue())
    expect(Object.values(fatigue).map(fatigueStateOf)).toEqual(
      MUSCLES.map(() => FATIGUE_STATES.READY),
    )
    expect(Object.keys(strength)).toEqual(MUSCLES)
    expect(strength).toEqual(floorStrength())
    expect(fatiguedMuscles([], NOW)).toEqual([])
    expect(detrainedMuscles([], NOW)).toEqual(MUSCLES)
  })

  it('将一个已完成组应用到该动作的每个肌肉权重上', () => {
    const workouts = [doneWorkoutAt(WEIGHTED.id, NOW)]
    // fixture 的肌肉权重来自内联元数据
    workouts[0].entries[0] = { ...workouts[0].entries[0], ...WEIGHTED } as never
    const fatigue = fatigueOf(workouts, NOW)
    const strength = strengthOf(workouts, NOW)

    for (const slug of MUSCLES) {
      const weight = WEIGHTED_WEIGHTS[slug] || 0
      expect(fatigue[slug]).toBeCloseTo(expectedSets(1, weight, slug), 10)
      expect(strength[slug]).toBe(weight ? 1 : STRENGTH_FLOOR)
    }
    // 一组（无论负荷）永不跨过疲劳阈值
    expect(fatiguedMuscles(workouts, NOW)).toEqual([])

    // 组数而非次数或负荷驱动疲劳：50 次研磨与普通 80x8 完全同分——一组就是一组。
    const highRep = [doneWorkoutAt(SINGLE.id, NOW, 1)]
    highRep[0].entries[0] = { ...highRep[0].entries[0], ...SINGLE } as never
    highRep[0].entries[0].sets[0].w = 50
    highRep[0].entries[0].sets[0].r = 50
    const plain = [doneWorkoutAt(SINGLE.id, NOW)]
    plain[0].entries[0] = { ...plain[0].entries[0], ...SINGLE } as never
    expect(fatigueOf(highRep, NOW)[SINGLE_SLUG]).toBeCloseTo(
      fatigueOf(plain, NOW)[SINGLE_SLUG],
      10,
    )
    expect(fatigueOf(highRep, NOW)[SINGLE_SLUG]).toBeLessThan(0.25)
  })

  it('对被删除动作使用快照，获得相同有界的原发与次要疲劳', () => {
    const resolved = doneWorkoutAt(WEIGHTED.id, NOW)
    resolved.entries[0] = { ...resolved.entries[0], ...WEIGHTED } as never
    const deleted = {
      ...resolved,
      entries: [{
        ...resolved.entries[0],
        id: 'deleted-weighted-exercise',
        tg: undefined,
        mg: undefined,
        sm: undefined,
        muscleSnapshot: exerciseMuscleSnapshot(WEIGHTED),
      }],
    }

    expect(fatigueOf([deleted], NOW)).toEqual(fatigueOf([resolved], NOW))
    expect(fatigueOf([deleted], NOW)[WEIGHTED_PRIMARY_SLUG]).toBeGreaterThan(0)
    expect(fatigueOf([deleted], NOW)[SECONDARY_SLUG]).toBeGreaterThan(0)
  })

  it('对被删除动作使用快照测力量，不改变衰减或下限语义', () => {
    const start = NOW - 15 * DAY
    const resolved = doneWorkoutAt(WEIGHTED.id, start)
    resolved.entries[0] = { ...resolved.entries[0], ...WEIGHTED } as never
    const deleted = {
      ...resolved,
      entries: [{
        ...resolved.entries[0],
        id: 'deleted-weighted-exercise',
        tg: undefined,
        mg: undefined,
        sm: undefined,
        muscleSnapshot: exerciseMuscleSnapshot(WEIGHTED),
      }],
    }
    const untouchedSlug = MUSCLES.find(slug => !WEIGHTED_WEIGHTS[slug]) as string
    const strength = strengthOf([deleted], NOW)

    expect(strength).toEqual(strengthOf([resolved], NOW))
    expect(strength[WEIGHTED_PRIMARY_SLUG]).toBeCloseTo(0.5 ** (1 / 28), 10)
    expect(strength[SECONDARY_SLUG]).toBeCloseTo(0.5 ** (1 / 28), 10)
    expect(strength[untouchedSlug]).toBe(STRENGTH_FLOOR)
  })

  it('随组数提高起始疲劳、永不封顶、无悬崖消退', () => {
    const at0 = (count: number) => {
      const w = doneWorkoutAt(SINGLE.id, NOW, count)
      w.entries[0] = { ...w.entries[0], ...SINGLE } as never
      return fatigueOf([w], NOW)[SINGLE_SLUG]
    }
    expect(at0(1)).toBeCloseTo(expectedSets(1, 1, SINGLE_SLUG), 10)
    expect(at0(5)).toBeCloseTo(expectedSets(5, 1, SINGLE_SLUG), 10)
    expect(at0(12)).toBeCloseTo(expectedSets(12, 1, SINGLE_SLUG), 10)
    expect(at0(12)).toBeGreaterThan(at0(5))
    expect(at0(5)).toBeGreaterThan(at0(1))
    expect(at0(12)).toBeLessThan(1)
    // 一个半衰期后任何量级下梯度仍可见
    const halfLife = fatigueHalfLifeOf(SINGLE_SLUG)
    const laterW = doneWorkoutAt(SINGLE.id, NOW - halfLife, 12)
    laterW.entries[0] = { ...laterW.entries[0], ...SINGLE } as never
    const later = fatigueOf([laterW], NOW)[SINGLE_SLUG]
    expect(later).toBeCloseTo(expectedSets(12, 1, SINGLE_SLUG, halfLife), 10)
    expect(later).toBeLessThan(at0(12))
    // 无悬崖：72h 继续衰减而非归零
    const oldW = doneWorkoutAt(SINGLE.id, NOW - 72 * HOUR)
    oldW.entries[0] = { ...oldW.entries[0], ...SINGLE } as never
    const old = fatigueOf([oldW], NOW)[SINGLE_SLUG]
    expect(old).toBeGreaterThan(0)
    expect(old).toBeLessThan(0.25)
  })

  it('每个加权刺激按自身肌肉半衰期衰减', () => {
    const halfLife = fatigueHalfLifeOf(WEIGHTED_PRIMARY_SLUG)
    for (const age of [halfLife, halfLife / 2]) {
      const w = doneWorkoutAt(WEIGHTED.id, NOW - age)
      w.entries[0] = { ...w.entries[0], ...WEIGHTED } as never
      const fatigue = fatigueOf([w], NOW)
      for (const [slug, weight] of Object.entries(WEIGHTED_WEIGHTS)) {
        expect(fatigue[slug]).toBeCloseTo(expectedSets(1, weight, slug, age), 10)
      }
    }
    // 次要肌肉按自己的时钟消退，而非原发的
    const secondaryHl = fatigueHalfLifeOf(SECONDARY_SLUG)
    const agedW = doneWorkoutAt(WEIGHTED.id, NOW - secondaryHl)
    agedW.entries[0] = { ...agedW.entries[0], ...WEIGHTED } as never
    const aged = fatigueOf([agedW], NOW)
    expect(aged[SECONDARY_SLUG]).toBeCloseTo(
      expectedSets(1, WEIGHTED_WEIGHTS[SECONDARY_SLUG], SECONDARY_SLUG, secondaryHl),
      10,
    )
  })

  it('72 小时前的组淡到就绪阈值以下而非硬切', () => {
    const w = doneWorkoutAt(SINGLE.id, NOW - 72 * HOUR)
    w.entries[0] = { ...w.entries[0], ...SINGLE } as never
    const workouts = [w]
    const value = fatigueOf(workouts, NOW)[SINGLE_SLUG]
    expect(value).toBeGreaterThan(0)
    expect(value).toBeLessThan(0.25)
    expect(fatigueStateOf(value)).toBe(FATIGUE_STATES.READY)
    expect(strengthOf(workouts, NOW)[SINGLE_SLUG]).toBe(1)
  })

  it('done 为 false 的组对两个轴都忽略', () => {
    const w = workoutAt(WEIGHTED.id, NOW, [{ done: false }])
    w.entries[0] = { ...w.entries[0], ...WEIGHTED } as never
    const workouts = [w]
    expect(fatigueOf(workouts, NOW)).toEqual(zeroFatigue())
    expect(strengthOf(workouts, NOW)).toEqual(floorStrength())
    expect(fatiguedMuscles(workouts, NOW)).toEqual([])
    expect(detrainedMuscles(workouts, NOW)).toEqual(MUSCLES)
  })

  it('显式零快照权重不给疲劳或保留力量刺激', () => {
    const workouts = [workoutAt('deleted-zero-mapped', NOW, [{ done: true, w: 80, r: 8 }])]
    workouts[0].entries[0].muscleSnapshot = {
      n: 'Zero mapped', muscleWeights: { chest: 1, biceps: 0 },
    }

    const fatigue = fatigueOf(workouts, NOW)
    const strength = strengthOf(workouts, NOW)
    expect(fatigue.chest).toBeGreaterThan(0)
    expect(fatigue.biceps).toBe(0)
    expect(strength.chest).toBe(1)
    expect(strength.biceps).toBe(STRENGTH_FLOOR)
  })

  it('通过 RIR 锚点折扣斜坡行，而非按满组收费', () => {
    const ramped = workoutAt(SINGLE.id, NOW, [
      { done: true, w: 40, r: 8 },
      { done: true, w: 80, r: 8 },
    ])
    ramped.entries[0] = { ...ramped.entries[0], ...SINGLE } as never
    const plain = doneWorkoutAt(SINGLE.id, NOW, 2)
    plain.entries[0] = { ...plain.entries[0], ...SINGLE } as never
    const rampedValue = fatigueOf([ramped], NOW)[SINGLE_SLUG]
    const plainValue = fatigueOf([plain], NOW)[SINGLE_SLUG]
    // 80kg 顶组锚定约 101kg，故 40kg 行读作 RIR 10 记下限权重：
    // 1 + 0.3 个有效组对 2 个满组。
    expect(rampedValue).toBeCloseTo(expectedSets(1 + FATIGUE_RIR_FLOOR_WEIGHT, 1, SINGLE_SLUG), 10)
    expect(rampedValue).toBeLessThan(plainValue)
    const single = doneWorkoutAt(SINGLE.id, NOW)
    single.entries[0] = { ...single.entries[0], ...SINGLE } as never
    expect(rampedValue).toBeGreaterThan(fatigueOf([single], NOW)[SINGLE_SLUG])
  })
})

describe('fatigue state boundaries', () => {
  // 饱和曲线的逆：目标等级所需的归一化刺激。
  const rawAt = (target: number) => -Math.log(1 - target)

  it('恰好 .25 分类为恢复中，.2499 为就绪', () => {
    const halfLife = fatigueHalfLifeOf(SECONDARY_SLUG)
    const weight = WEIGHTED_WEIGHTS[SECONDARY_SLUG]
    const sets = 8
    const eff = sets * weight
    const gain = effGain(eff)
    const valueAt = (target: number) => {
      const age = halfLife * Math.log2(eff / FATIGUE_SETS_PER_UNIT * gain / rawAt(target))
      const w = doneWorkoutAt(WEIGHTED.id, NOW - age, sets)
      w.entries[0] = { ...w.entries[0], ...WEIGHTED } as never
      const value = fatigueOf([w], NOW)[SECONDARY_SLUG]
      expect(value).toBeCloseTo(target, 10)
      return stableFloat(value)
    }

    expect(fatigueStateOf(valueAt(0.25))).toBe(FATIGUE_STATES.RECOVERING)
    expect(fatigueStateOf(valueAt(0.2499))).toBe(FATIGUE_STATES.READY)
  })

  it('恰好 .5 为恢复中、.5001 为疲劳，钩子只挂疲劳肌肉', () => {
    const halfLife = fatigueHalfLifeOf(SINGLE_SLUG)
    const sets = 8
    const gain = effGain(sets)
    const atHalf = (() => {
      const w = doneWorkoutAt(SINGLE.id, NOW - halfLife * Math.log2(sets / FATIGUE_SETS_PER_UNIT * gain / rawAt(0.4999)), sets)
      w.entries[0] = { ...w.entries[0], ...SINGLE } as never
      return [w]
    })()
    const aboveHalf = (() => {
      const w = doneWorkoutAt(SINGLE.id, NOW - halfLife * Math.log2(sets / FATIGUE_SETS_PER_UNIT * gain / rawAt(0.5001)), sets)
      w.entries[0] = { ...w.entries[0], ...SINGLE } as never
      return [w]
    })()
    const half = fatigueOf(atHalf, NOW)[SINGLE_SLUG]
    const above = fatigueOf(aboveHalf, NOW)[SINGLE_SLUG]

    expect(half).toBeCloseTo(0.4999, 10)
    expect(fatigueStateOf(stableFloat(half))).toBe(FATIGUE_STATES.RECOVERING)
    expect(fatiguedMuscles(atHalf, NOW)).toEqual([])
    expect(above).toBeCloseTo(0.5001, 10)
    expect(fatigueStateOf(stableFloat(above))).toBe(FATIGUE_STATES.FATIGUED)
    expect(fatiguedMuscles(aboveHalf, NOW)).toEqual([SINGLE_SLUG])
  })
})

describe('causal session scoring', () => {
  const loadedWorkout = (start: number, weight: number, count = 8) => {
    const w = workoutAt('1254', start, Array.from({ length: count }, () => ({ done: true, w: weight, r: 8 })))
    w.entries[0] = { ...w.entries[0], ...SINGLE } as never
    return w
  }

  it('每次训练叠加在衰减的更早训练之上，各带自己的急性:慢性增益', () => {
    const halfLife = fatigueHalfLifeOf(SINGLE_SLUG)
    const old = doneWorkoutAt(SINGLE.id, NOW - DAY)
    old.entries[0] = { ...old.entries[0], ...SINGLE } as never
    const today = doneWorkoutAt(SINGLE.id, NOW)
    today.entries[0] = { ...today.entries[0], ...SINGLE } as never
    // 旧训练独自训练（对其单组的增益）；今天看到两个组在急性窗口内，故增益更高：
    // 适应依赖历史。
    const oldGain = effGain(1)
    const todayGain = (2 + FATIGUE_NOVICE_WEEKLY_SETS) / (0.5 + FATIGUE_NOVICE_WEEKLY_SETS)
    const expected = 1 - Math.exp(-(
      1 / FATIGUE_SETS_PER_UNIT * oldGain * halfLifeDecay(DAY, halfLife)
      + 1 / FATIGUE_SETS_PER_UNIT * todayGain
    ))

    expect(fatigueOf([old, today], NOW)[SINGLE_SLUG]).toBeCloseTo(expected, 10)
    expect(fatigueOf([today], NOW)[SINGLE_SLUG]).toBeCloseTo(expectedSets(1, 1, SINGLE_SLUG), 10)
  })

  it('8x100x8 十天复现在训练离开扫描窗口时保持非增', () => {
    const base = Date.UTC(2026, 0, 31, 12)
    const workouts = [-20, -10, 0].map(days => loadedWorkout(base + days * DAY, 100))
    const observed = Array.from(
      { length: 31 * 24 + 1 },
      (_, hour) => fatigueOf(workouts, base + hour * HOUR).chest,
    )

    expect(observed[0]).toBeGreaterThan(0.5)
    expect(observed.at(-1)).toBe(0)
    for (let index = 1; index < observed.length; index += 1) {
      expect(observed[index]).toBeLessThanOrEqual(observed[index - 1] + Number.EPSILON)
    }
  })

  it('忽略早于扫描窗口的导入', () => {
    const today = loadedWorkout(NOW, 100, 5)
    const baseline = fatigueOf([today], NOW).chest
    const heavyImport = loadedWorkout(NOW - 90 * DAY, 140, 10)
    const highVolumeImport = loadedWorkout(NOW - 90 * DAY, 100, 20)

    expect(fatigueOf([heavyImport, today], NOW).chest).toBe(baseline)
    expect(fatigueOf([highVolumeImport, today], NOW).chest).toBe(baseline)
  })

  it('删除最近一次训练时疲劳永不增加', () => {
    const workouts = [
      loadedWorkout(NOW - 40 * DAY, 100, 15),
      loadedWorkout(NOW - 3 * DAY, 100, 8),
      loadedWorkout(NOW - 2 * DAY, 100, 8),
      loadedWorkout(NOW - DAY, 60, 4),
      loadedWorkout(NOW, 120, 10),
    ]
    const before = fatigueOf(workouts, NOW)
    const after = fatigueOf(workouts.slice(0, -1), NOW)
    for (const slug of MUSCLES) expect(after[slug]).toBeLessThanOrEqual(before[slug] + Number.EPSILON)
  })

  it('记录删除旧 PR 训练可提高当前疲劳（历史依赖设计）', () => {
    const pr = loadedWorkout(NOW - 10 * DAY, 100, 1)
    pr.entries[0].sets[0].r = 5
    const today = loadedWorkout(NOW, 80, 1)
    const withHistory = fatigueOf([pr, today], NOW).chest
    const withoutHistory = fatigueOf([today], NOW).chest
    expect(withHistory).toBeGreaterThan(0)
    expect(withoutHistory).toBeGreaterThan(withHistory)
  })

  it('将背驰训练评在重复满负荷之下', () => {
    const backOff = workoutAt(SINGLE.id, NOW, [
      ...Array.from({ length: 4 }, () => ({ done: true, w: 100, r: 8 })),
      ...Array.from({ length: 4 }, () => ({ done: true, w: 50, r: 8 })),
    ])
    backOff.entries[0] = { ...backOff.entries[0], ...SINGLE } as never
    const repeated = doneWorkoutAt(SINGLE.id, NOW, 8)
    repeated.entries[0] = { ...repeated.entries[0], ...SINGLE } as never
    const fullLoad = workoutAt(SINGLE.id, NOW, Array.from({ length: 8 }, () => ({ done: true, w: 100, r: 8 })))
    fullLoad.entries[0] = { ...fullLoad.entries[0], ...SINGLE } as never

    expect(fatigueOf([backOff], NOW)[SINGLE_SLUG]).toBeLessThan(fatigueOf([fullLoad], NOW)[SINGLE_SLUG])
    expect(fatigueOf([repeated], NOW)[SINGLE_SLUG]).toBeCloseTo(fatigueOf([fullLoad], NOW)[SINGLE_SLUG], 10)
  })

  it('将较轻的当前周评在重复既定负荷之下', () => {
    const prior = [-21, -14, -7].map(days => loadedWorkout(NOW + days * DAY, 100))
    const lighter = fatigueOf([...prior, loadedWorkout(NOW, 50)], NOW).chest
    const repeated = fatigueOf([...prior, loadedWorkout(NOW, 100)], NOW).chest

    expect(lighter).toBeLessThan(repeated)
  })

  it('相同结构不同绝对负荷同分', () => {
    const light = loadedWorkout(NOW, 50, 8)
    const heavy = loadedWorkout(NOW, 100, 8)
    expect(fatigueOf([light], NOW).chest).toBeCloseTo(fatigueOf([heavy], NOW).chest, 10)
  })
})

describe('RIR quality weighting', () => {
  it('RIR 到组权重映射：力竭满额，远时下限', () => {
    expect(rirWeightFor(null)).toBe(1)
    expect(rirWeightFor(0)).toBe(1)
    expect(rirWeightFor(3)).toBe(1)
    expect(rirWeightFor(4)).toBeCloseTo(1 - (1 - FATIGUE_RIR_FLOOR_WEIGHT) / 3, 10)
    expect(rirWeightFor(6)).toBe(FATIGUE_RIR_FLOOR_WEIGHT)
    expect(rirWeightFor(10)).toBe(FATIGUE_RIR_FLOOR_WEIGHT)
  })

  it('经锚点 Epley 逆估计 RIR', () => {
    // 对 110 上限的 80x8：30*(110/80-1)-8 = 3.25
    expect(estimateSetRir({ w: 80, r: 8 }, 110)).toMatchObject({ rir: 3.25, source: 'estimated' })
    // 同一组对自身估计读作力竭，钳到 0
    expect(estimateSetRir({ w: 80, r: 8 }, 80 * (1 + 8 / 30))?.rir).toBe(0)
    // 远超容量仍钳位：对 101 的 40x8 热身读作 RIR 10
    expect(estimateSetRir({ w: 40, r: 8 }, 80 * (1 + 8 / 30))?.rir).toBe(10)
    // 混合单位以 kg 锚定：176.37 lb ≈ 80kg 对 80kg 上限读作约力竭
    expect(estimateSetRir({ w: 176.3696, r: 8, unit: 'lb' }, 80 * (1 + 8 / 30))?.rir).toBeCloseTo(0, 4)
    // 不诚实输入保持 null：无锚点、无负荷、无次数、超次数上限
    expect(estimateSetRir({ w: 80, r: 8 }, null)).toBeNull()
    expect(estimateSetRir({ w: 0, r: 8 }, 100)).toBeNull()
    expect(estimateSetRir({ w: 80 }, 100)).toBeNull()
    expect(estimateSetRir({ w: 50, r: 20 }, 100)).toBeNull()
  })

  it('记录 RIR 优先于任何估计', () => {
    // 记录 RIR 5 的研磨即使低锚点会估 0 也计 0.53
    const w = workoutAt(SINGLE.id, NOW, [{ done: true, w: 80, r: 8, rir: 5 }])
    w.entries[0] = { ...w.entries[0], ...SINGLE } as never
    expect(fatigueOf([w], NOW)[SINGLE_SLUG]).toBeCloseTo(
      expectedSets(rirWeightFor(5), 1, SINGLE_SLUG), 10,
    )
  })

  it('将减载周评在锚定它的工作周之下', () => {
    const work = [-21, -14, -7].map(days => {
      const w = workoutAt(SINGLE.id, NOW + days * DAY, Array.from({ length: 8 }, () => ({ done: true, w: 100, r: 8 })))
      w.entries[0] = { ...w.entries[0], ...SINGLE } as never
      return w
    })
    const deload = workoutAt(SINGLE.id, NOW, Array.from({ length: 8 }, () => ({ done: true, w: 50, r: 8 })))
    deload.entries[0] = { ...deload.entries[0], ...SINGLE } as never
    const repeat = workoutAt(SINGLE.id, NOW, Array.from({ length: 8 }, () => ({ done: true, w: 100, r: 8 })))
    repeat.entries[0] = { ...repeat.entries[0], ...SINGLE } as never
    expect(fatigueOf([...work, deload], NOW)[SINGLE_SLUG])
      .toBeLessThan(fatigueOf([...work, repeat], NOW)[SINGLE_SLUG])
  })
})

describe('strengthOf', () => {
  const strengthAt = (age: number) => {
    const w = doneWorkoutAt(SINGLE.id, NOW - age)
    w.entries[0] = { ...w.entries[0], ...SINGLE } as never
    return strengthOf([w], NOW)[SINGLE_SLUG]
  }

  it('满保留保持 14 天，从 15 天按 28 天半衰期衰减', () => {
    expect(strengthAt(STRENGTH_FULL_MS)).toBe(1)
    expect(strengthAt(15 * DAY)).toBeCloseTo(0.5 ** (1 / 28), 10)
  })

  it('42 天半衰点与更晚的 56 天值钳在 .5 下限', () => {
    expect(strengthAt(42 * DAY)).toBe(0.5)
    expect(strengthAt(56 * DAY)).toBe(STRENGTH_FLOOR)
  })

  it('更晚完成训练重置保留力量', () => {
    const older = doneWorkoutAt(SINGLE.id, NOW - 20 * DAY)
    older.entries[0] = { ...older.entries[0], ...SINGLE } as never
    const newer = doneWorkoutAt(SINGLE.id, NOW)
    newer.entries[0] = { ...newer.entries[0], ...SINGLE } as never
    expect(strengthOf([older, newer], NOW)[SINGLE_SLUG]).toBe(1)
  })
})

describe('accumulation and purity', () => {
  it('匹配独立衰减刺激按时间顺序的饱和和', () => {
    const halfLife = fatigueHalfLifeOf(SINGLE_SLUG)
    const ages = [64 * HOUR, 40 * HOUR]
    const workouts = ages.map(age => {
      const w = doneWorkoutAt(SINGLE.id, NOW - age)
      w.entries[0] = { ...w.entries[0], ...SINGLE } as never
      return w
    })
    const firstGain = effGain(1)
    const secondGain = (2 + FATIGUE_NOVICE_WEEKLY_SETS) / (0.5 + FATIGUE_NOVICE_WEEKLY_SETS)
    const raw = 1 / FATIGUE_SETS_PER_UNIT * firstGain * halfLifeDecay(ages[0], halfLife)
      + 1 / FATIGUE_SETS_PER_UNIT * secondGain * halfLifeDecay(ages[1], halfLife)
    const expected = 1 - Math.exp(-raw)

    expect(fatigueOf(workouts, NOW)[SINGLE_SLUG]).toBeCloseTo(expected, 10)
    expect(fatigueOf([...workouts].reverse(), NOW)[SINGLE_SLUG]).toBeCloseTo(expected, 10)
  })

  it('饱和不封顶，且不改变输入或共享状态地返回相同结果', () => {
    const saturated = doneWorkoutAt(SINGLE.id, NOW, 2)
    saturated.entries[0] = { ...saturated.entries[0], ...SINGLE } as never
    expect(fatigueOf([saturated], NOW)[SINGLE_SLUG]).toBeCloseTo(expectedSets(2, 1, SINGLE_SLUG), 10)
    expect(fatigueOf([saturated], NOW)[SINGLE_SLUG]).toBeLessThan(1)

    const workouts = [64 * HOUR, 40 * HOUR].map(h => {
      const w = doneWorkoutAt(SINGLE.id, NOW - h)
      w.entries[0] = { ...w.entries[0], ...SINGLE } as never
      return w
    })
    const before = JSON.parse(JSON.stringify(workouts))
    const firstFatigue = fatigueOf(workouts, NOW)
    const firstStrength = strengthOf(workouts, NOW)
    const secondFatigue = fatigueOf(workouts, NOW)
    const secondStrength = strengthOf(workouts, NOW)

    expect(secondFatigue).toEqual(firstFatigue)
    expect(secondStrength).toEqual(firstStrength)
    expect(workouts).toEqual(before)
  })
})

describe('warm-up flag in strength and fatigue', () => {
  it('热身组不重置力量但仍增加疲劳量', () => {
    const now = Date.UTC(2026, 7, 1, 12)
    const oldWork = { id: 'w1', d: '2026-07-10', start: now - 20 * 86400000, unit: 'kg',
      entries: [{ id: '1254', tg: 'chest', sets: [{ done: true, w: 80, r: 8 }] }] }
    const warm = { id: 'w2', d: '2026-08-01', start: now - 3600000, unit: 'kg',
      entries: [{ id: '1254', tg: 'chest', sets: [{ done: true, warmup: true, w: 20, r: 8 }] }] }
    const workouts = [oldWork, warm]
    const strength = strengthOf(workouts, now)
    // 力量边缘 20 天前：新热身不得成为最近训练事件
    expect(strength.chest).toBeLessThan(1)
    // 但热身仍贡献疲劳刺激（真实机械功）
    const fatigue = fatigueOf(workouts, now)
    expect(fatigue.chest).toBeGreaterThan(0)
  })

  it('任何锚点存在前，标记的热身记下限权重', () => {
    const warm = workoutAt(SINGLE.id, NOW, [
      { done: true, warmup: true, w: 0, r: 10 },
      { done: true, w: 80, r: 8 },
    ])
    warm.entries[0] = { ...warm.entries[0], ...SINGLE } as never
    expect(fatigueOf([warm], NOW)[SINGLE_SLUG])
      .toBeCloseTo(expectedSets(1 + FATIGUE_RIR_FLOOR_WEIGHT, 1, SINGLE_SLUG), 10)
    // 热身行上记录的努力度仍优先于标记
    const rated = workoutAt(SINGLE.id, NOW, [{ done: true, warmup: true, w: 0, r: 10, rir: 2 }])
    rated.entries[0] = { ...rated.entries[0], ...SINGLE } as never
    expect(fatigueOf([rated], NOW)[SINGLE_SLUG]).toBeCloseTo(expectedSets(1, 1, SINGLE_SLUG), 10)
  })
})

describe('drop-set drops add discounted fatigue sets on top of the main set', () => {
  const dropShare = FATIGUE_RIR_FLOOR_WEIGHT

  it('递减段的递减为自身 RIR 加权组', () => {
    const dropRow = { done: true, type: 'dropset', w: 80, r: 8, drops: [{ w: 60, r: 6 }] }
    const expected = expectedSets(1 + dropShare, 1, SINGLE_SLUG)
    const w = workoutAt(SINGLE.id, NOW, [dropRow])
    w.entries[0] = { ...w.entries[0], ...SINGLE } as never

    expect(fatigueOf([w], NOW)[SINGLE_SLUG]).toBeCloseTo(expected, 8)
    const plain = doneWorkoutAt(SINGLE.id, NOW)
    plain.entries[0] = { ...plain.entries[0], ...SINGLE } as never
    expect(fatigueOf([w], NOW)[SINGLE_SLUG])
      .toBeGreaterThan(fatigueOf([plain], NOW)[SINGLE_SLUG])
  })

  it('无递减的普通组疲劳不变', () => {
    const plain = { done: true, w: 80, r: 8 }
    const w = workoutAt(SINGLE.id, NOW, [plain])
    w.entries[0] = { ...w.entries[0], ...SINGLE } as never
    expect(fatigueOf([w], NOW)[SINGLE_SLUG])
      .toBeCloseTo(expectedSets(1, 1, SINGLE_SLUG), 8)
  })
})

describe('a rest-pause row\'s clusters add no extra fatigue sets', () => {
  it('与同 w/r 的普通组完全一致，无论 clusters 如何拆分', () => {
    const burstRow = { done: true, type: 'restpause', w: 80, r: 8, clusters: [{ r: 4, restSec: 15 }] }
    const plainRow = { done: true, w: 80, r: 8 }
    const burst = workoutAt(SINGLE.id, NOW, [burstRow])
    burst.entries[0] = { ...burst.entries[0], ...SINGLE } as never
    const plain = workoutAt(SINGLE.id, NOW, [plainRow])
    plain.entries[0] = { ...plain.entries[0], ...SINGLE } as never
    expect(fatigueOf([burst], NOW)[SINGLE_SLUG])
      .toBeCloseTo(fatigueOf([plain], NOW)[SINGLE_SLUG], 10)
  })

  it('对真实计划总量也成立——完整递减拆分不超出该行自身 r', () => {
    const burstRow = { done: true, type: 'restpause', w: 80, r: 20, clusters: [{ r: 10, restSec: 15 }, { r: 5, restSec: 15 }, { r: 3, restSec: 15 }, { r: 1, restSec: 15 }, { r: 1, restSec: 15 }] }
    const plainRow = { done: true, w: 80, r: 20 }
    const burst = workoutAt(SINGLE.id, NOW, [burstRow])
    burst.entries[0] = { ...burst.entries[0], ...SINGLE } as never
    const plain = workoutAt(SINGLE.id, NOW, [plainRow])
    plain.entries[0] = { ...plain.entries[0], ...SINGLE } as never
    expect(fatigueOf([burst], NOW)[SINGLE_SLUG])
      .toBeCloseTo(fatigueOf([plain], NOW)[SINGLE_SLUG], 10)
  })
})

describe('loads are relative, units are irrelevant', () => {
  const loadedSlug = 'chest'
  const bodyweightSlug = 'chest'
  const stampedWorkout = ({ id, start, unit, weight, target, bw }: {
    id: string; start: number; unit?: string; weight: number; target?: Record<string, unknown>; bw?: number
  }) => ({
    d: new Date(start).toISOString(), start, unit, bw,
    entries: [{ id, tg: 'chest', eq: id === 'bw-chest' ? 'body weight' : 'barbell', target, sets: [{ done: true, w: weight, r: 8 }] }],
  })

  it('kg 与物理等效的磅标记历史疲劳相同', () => {
    const kg = stampedWorkout({ id: 'loaded-chest', start: NOW, unit: 'kg', weight: 80 })
    const lb = stampedWorkout({ id: 'loaded-chest', start: NOW, unit: 'lb', weight: 176.3696 })

    expect(fatigueOf([lb], NOW, { unit: 'kg' })[loadedSlug])
      .toBeCloseTo(fatigueOf([kg], NOW, { unit: 'kg' })[loadedSlug], 6)
  })

  it('计分前归一化混合标记单位', () => {
    const starts = [NOW - 3 * DAY, NOW - 2 * DAY, NOW - DAY, NOW]
    const kg = starts.map(start => stampedWorkout({ id: 'loaded-chest', start, unit: 'kg', weight: 80 }))
    const mixed = starts.map((start, i) => stampedWorkout({
      id: 'loaded-chest', start, unit: i % 2 ? 'lb' : 'kg', weight: i % 2 ? 176.3696 : 80,
    }))

    expect(fatigueOf([mixed], NOW, { unit: 'kg' })[loadedSlug])
      .toBeCloseTo(fatigueOf([kg], NOW, { unit: 'kg' })[loadedSlug], 6)
  })

  it('将未标记的旧历史视为一个困难组', () => {
    const kg = stampedWorkout({ id: 'loaded-chest', start: NOW, unit: 'kg', weight: 80 })
    const legacyLb = { ...kg, unit: undefined, entries: [{ ...kg.entries[0], sets: [{ done: true, w: 176.3696, r: 8 }] }] }

    expect(fatigueOf([legacyLb], NOW, { unit: 'lb' })[loadedSlug])
      .toBeCloseTo(fatigueOf([kg], NOW, { unit: 'kg' })[loadedSlug], 6)
  })

  it('按相对强度为更重与更轻的自重训练计分', () => {
    const workout = stampedWorkout({
      id: 'loaded-chest', start: NOW, unit: 'kg', weight: 0,
      target: { bodyweight: true }, bw: 80,
    })

    expect(fatigueOf([workout], NOW, { unit: 'kg' })[loadedSlug]).toBeGreaterThan(0)
    expect(strengthOf([workout], NOW, { unit: 'kg' })[loadedSlug]).toBe(1)
  })

  it('各自为最佳时，无负荷与有负荷自重组同分', () => {
    const unloaded = stampedWorkout({ id: BODYWEIGHT_EX.id, start: NOW, unit: 'kg', weight: 0, bw: 80 })
    const loadedSet = { done: true, w: 10, r: 8 }
    const added = { ...unloaded, entries: [{ ...unloaded.entries[0], sets: [loadedSet] }] }

    expect(fatigueOf([added], NOW, { unit: 'kg' })[bodyweightSlug])
      .toBeCloseTo(fatigueOf([unloaded], NOW, { unit: 'kg' })[bodyweightSlug], 10)
  })

  it('对含体重的锚点估计有负荷自重背驰', () => {
    const weight = musclesOf(BODYWEIGHT_EX)[bodyweightSlug]
    const workout = {
      d: new Date(NOW).toISOString(), start: NOW, unit: 'kg', bw: 80,
      entries: [{ id: BODYWEIGHT_EX.id, tg: 'chest', eq: 'body weight', sets: [{ done: true, w: 20, r: 8 }, { done: true, w: 10, r: 8 }] }],
    }
    // 100kg x 8 锚定该次训练；90kg 背驰是 RIR 约 4.2，而非对"20kg 上限"的 RIR 10
    const anchor = estimate1RM(100, 8) as number
    const backOffRir = 30 * (anchor / 90 - 1) - 8
    expect(backOffRir).toBeGreaterThan(4)
    expect(backOffRir).toBeLessThan(5)
    expect(fatigueOf([workout], NOW, { unit: 'kg' })[bodyweightSlug])
      .toBeCloseTo(expectedSets(1 + rirWeightFor(backOffRir), weight, bodyweightSlug), 10)
    expect(rirWeightFor(backOffRir)).toBeGreaterThan(FATIGUE_RIR_FLOOR_WEIGHT)
  })

  it('自重训练锚定到标记体重，再档案，再参考体重', () => {
    const at = (bw?: number) => ({
      d: new Date(NOW).toISOString(), start: NOW, unit: 'kg', bw,
      entries: [{ id: BODYWEIGHT_EX.id, tg: 'chest', eq: 'body weight', sets: [{ done: true, w: 0, r: 10 }] }],
    })
    const stamped = at(90)
    const unstamped = at(undefined)
    expect(anchorsByWorkout([stamped], { bodyweightKg: 70 }).get(stamped)?.get(BODYWEIGHT_EX.id))
      .toBeCloseTo(estimate1RM(90, 10) as number, 6)
    expect(anchorsByWorkout([unstamped], { bodyweightKg: 70 }).get(unstamped)?.get(BODYWEIGHT_EX.id))
      .toBeCloseTo(estimate1RM(70, 10) as number, 6)
    expect(anchorsByWorkout([unstamped]).get(unstamped)?.get(BODYWEIGHT_EX.id))
      .toBeCloseTo(estimate1RM(BODYWEIGHT_REF_LOAD, 10) as number, 6)
    // 磅标记的自重与任何其他负荷一样规范化
    const lb = { ...at(176.3696), unit: 'lb' }
    expect(anchorsByWorkout([lb]).get(lb)?.get(BODYWEIGHT_EX.id)).toBeCloseTo(estimate1RM(80, 10) as number, 1)
  })

  it('显式配置的自定义自重训练可重置力量', () => {
    const id = 'recovery-custom-bodyweight'
    const workout = stampedWorkout({ id, start: NOW, unit: 'kg', weight: 0, bw: 80, target: { bodyweight: true } })
    expect(fatigueOf([workout], NOW, { unit: 'kg' }).chest).toBeGreaterThan(0)
    expect(strengthOf([workout], NOW, { unit: 'kg' }).chest).toBe(1)
  })

  it('将未来日期的训练视为其自身时间戳，绝不放大', () => {
    const future = doneWorkoutAt(SINGLE.id, NOW + 10 * DAY, 5)
    future.entries[0] = { ...future.entries[0], ...SINGLE } as never
    const now = doneWorkoutAt(SINGLE.id, NOW, 5)
    now.entries[0] = { ...now.entries[0], ...SINGLE } as never
    const futureValue = fatigueOf([future], NOW)[SINGLE_SLUG]
    const nowValue = fatigueOf([now], NOW)[SINGLE_SLUG]
    expect(futureValue).toBeCloseTo(nowValue, 10)
    expect(futureValue).toBeLessThan(1)
  })

  it('将默认自定义零负荷吊环俯卧撑计为两个困难组', () => {
    const id = 'recovery-ring-push-up'
    const workout = workoutAt(id, NOW, [
      { done: true, w: 0, r: 20 },
      { done: true, w: 0, r: 20 },
    ])
    workout.entries[0] = { ...workout.entries[0], tg: 'chest' } as never
    // 未记录负荷意味强度未知，故组记满
    expect(fatigueOf([workout], NOW).chest).toBeCloseTo(expectedSets(2, 1, 'chest'), 10)
    expect(strengthOf([workout], NOW).chest).toBe(1)
  })
})

describe('anchorsByWorkout and resolveSetRir', () => {
  const at = (id: string, start: number, sets: Array<Record<string, unknown>>) => ({
    d: new Date(start).toISOString(), start, entries: [{ id, tg: 'chest', sets }],
  })

  it('每训练锚定在 90 天滚动最佳，绝不来自未来', () => {
    const old = at(SINGLE.id, NOW - 100 * DAY, [{ done: true, w: 120, r: 5 }])
    const mid = at(SINGLE.id, NOW - 10 * DAY, [{ done: true, w: 100, r: 5 }])
    const now = at(SINGLE.id, NOW, [{ done: true, w: 90, r: 5 }])
    const anchors = anchorsByWorkout([old, mid, now])
    // 100 天前的 PR 在窗口外；中间训练锚定自身最佳，今天锚定中间训练的最佳
    expect(anchors.get(old)?.get(SINGLE.id)).toBeCloseTo(120 * (1 + 5 / 30), 1)
    expect(anchors.get(mid)?.get(SINGLE.id)).toBeCloseTo(100 * (1 + 5 / 30), 1)
    expect(anchors.get(now)?.get(SINGLE.id)).toBeCloseTo(100 * (1 + 5 / 30), 1)
  })

  it('记录努力度优先、估计次之、不可知为 null', () => {
    const anchors = new Map([['e1', 110]])
    const entry = { id: 'e1' }
    const workout = {}
    expect(resolveSetRir({ done: true, w: 40, r: 8, rir: 7 }, null, entry, workout, anchors, {}))
      .toEqual({ rir: 7, source: 'logged' })
    expect(resolveSetRir({ done: true, w: 80, r: 8 }, null, entry, workout, anchors, {})?.source).toBe('estimated')
    expect(resolveSetRir({ done: true, w: 80, r: 8 }, null, { id: 'unknown' }, workout, anchors, {}))
      .toBeNull()
  })
})
