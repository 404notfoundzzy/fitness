// 渐进引擎策略主体测试 —— 移植自 openGym（AGPL-3.0）progression.test.js，上游 commit e348fc1。
// 覆盖 linear / greyskull / double / triple / time / off / 自重 / 0kg 记录 / 计划编辑重启 /
// applyPrescription / 热身行 / 递减组 / 网格外重量。
// 适配：上游 LIFT/HEAVY/CARDIO/BENCH 为目录 id，此处用内联 id + bp 字段替代
// （步长由 bp 决定，故 HEAVY 类用例显式带 bp:'upper legs'）。
import { describe, it, expect } from 'vitest'
import {
  nextPrescription, applyPrescription, plannedOf, planChanged, readSession,
  deloadTarget1RM, DELOAD_AFTER, DELOAD_FACTOR, MAX_BW_SETS,
  sessionsFor, stallCount, tripleSetsOf,
} from './progression'

const LIFT = 'lift-1'
const HEAVY = 'heavy-1'
const CARDIO = 'cardio-1'
const BENCH = 'bench-1'

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
// 同一历史，但每个条目盖上其构建计划的戳（#275 之后保存的会话）。
const stamped = (st: { workouts: Array<{ entries: Array<Record<string, unknown>> }> }, planned: Record<string, unknown>) => ({
  ...st,
  workouts: st.workouts.map(w => ({ ...w, entries: w.entries.map(e => ({ ...e, planned })) })),
})

describe('linear progression', () => {
  const cfg = { id: LIFT, sets: 3, reps: 5, weight: 60, prog: 'linear' }

  it('无历史时无有用意见', () => {
    const p = nextPrescription({ unit: 'kg', workouts: [] }, cfg)
    expect(p.kind).toBe('first')
    expect(p.weight).toBeUndefined()
  })

  it('干净训练后加增量', () => {
    const p = nextPrescription(hist(LIFT, [[60, 5, 5, 5]]), cfg)
    expect(p.kind).toBe('up')
    expect(p.weight).toBe(62.5)
  })

  it('失误后重复重量而非前进', () => {
    const p = nextPrescription(hist(LIFT, [[60, 5, 5, 3]]), cfg)
    expect(p.kind).toBe('hold')
    expect(p.weight).toBe(60)
  })

  it('最后一组未勾选不前进', () => {
    const p = nextPrescription(hist(LIFT, [[60, 5, 5, null]]), cfg)
    expect(p.kind).toBe('hold')
    expect(p.weight).toBe(60)
  })

  it('连续三次失误后减载到可负重值', () => {
    const p = nextPrescription(hist(LIFT, [[60, 5, 5, 3], [60, 5, 4, 4], [60, 5, 5, 4]]), cfg)
    expect(p.kind).toBe('deload')
    expect(p.weight).toBe(55)             // 60 × 0.9 = 54 → 最近的 2.5 步长
    expect(DELOAD_AFTER.linear).toBe(3)
  })

  it('按处方目标次数减载，而非实际部分次数', () => {
    const target = { sets: 3, reps: 8, weight: 60 }
    const p = nextPrescription(hist(LIFT, [[60, 6, 6, 6], [60, 6, 6, 6], [60, 6, 6, 6]], target), { ...cfg, reps: 8 })
    expect(p.kind).toBe('deload')
    expect(p.target1RM).toBe(deloadTarget1RM(60, 8))
    expect(p.target1RM).not.toBe(deloadTarget1RM(60, 6))
    expect(p.reps).toBe(8)
  })

  it('选择减载负荷时用配置的 Epley 因子', () => {
    const p = nextPrescription(hist(LIFT, [[60, 4, 4, 4], [60, 4, 4, 4], [60, 4, 4, 4]], { sets: 3, reps: 5, weight: 60 }), { ...cfg, deloadFactor: 0.8 })
    expect(p.kind).toBe('deload')
    expect(p.deloadFactor).toBe(0.8)
    expect(p.target1RM).toBe(56)
    expect(p.weight).toBe(47.5)
  })

  it('低于步长的负荷保持而非向上减载', () => {
    const p = nextPrescription(hist(LIFT, [[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]]), { ...cfg, weight: 1, inc: 2.5 })
    expect(p.kind).toBe('deload')
    expect(p.weight).toBe(1)
    expect(p.why[0]).toMatch(/保持/)
  })

  it('中间夹一次好训练清除停滞', () => {
    const p = nextPrescription(hist(LIFT, [[60, 5, 5, 3], [60, 5, 5, 5], [60, 5, 5, 3]]), cfg)
    expect(p.kind).toBe('hold')
  })

  it('减载开启新连击，故新重量下一次失误不立即再次减载', () => {
    const stalled = [[60, 4, 4, 4], [60, 4, 4, 4], [60, 4, 4, 4]]
    const deload = nextPrescription(hist(LIFT, stalled), cfg)
    expect(deload.kind).toBe('deload')

    const next = nextPrescription(hist(LIFT, [...stalled, [deload.weight as number, 4, 4, 4]]), cfg)
    expect(next.kind).toBe('hold')
    expect(next.weight).toBe(deload.weight)
  })

  it('无论多轻，减载永不低于一个增量', () => {
    const p = nextPrescription(hist(LIFT, [[2.5, 1, 1, 1], [2.5, 1, 1, 1], [2.5, 1, 1, 1]]), cfg)
    expect(p.kind).toBe('deload')
    expect(p.weight).toBe(2.5)
  })

  it('减载始终更轻，即使取整不会', () => {
    // 5 × 0.9 = 4.5 → 最近的 2.5 步是 5，完全不是减载，故须退一步
    const p = nextPrescription(hist(LIFT, [[5, 1, 1, 1], [5, 1, 1, 1], [5, 1, 1, 1]]), cfg)
    expect(p.weight).toBeLessThan(5)
  })

  it('下肢动作用更重的步长', () => {
    const p = nextPrescription(hist(HEAVY, [[100, 5, 5, 5]]), { id: HEAVY, bp: 'upper legs', sets: 3, reps: 5, prog: 'linear' })
    expect(p.weight).toBe(105)
  })

  it('尊重每动作增量覆盖', () => {
    const p = nextPrescription(hist(LIFT, [[60, 5, 5, 5]]), { ...cfg, inc: 1 })
    expect(p.weight).toBe(61)
  })

  it('以磅工作', () => {
    const S = { ...hist(LIFT, [[135, 5, 5, 5]]), unit: 'lb' }
    expect(nextPrescription(S, cfg).weight).toBe(140)
  })

  it('网格外重量前进时保留偏移（issue #175）', () => {
    // 雪橇记录为自重 167 磅加铃片：步长 10 时 397 → 407，而非网格的 410
    const lin = { id: LIFT, sets: 3, reps: 5, weight: 397, prog: 'linear', inc: 10 }
    const p = nextPrescription(hist(LIFT, [[397, 5, 5, 5]], { sets: 3, reps: 5, weight: 397 }), lin)
    expect(p.kind).toBe('up')
    expect(p.weight).toBe(407)
    const dbl = { id: LIFT, sets: 3, reps: 12, repsMin: 8, weight: 397, prog: 'double', inc: 10 }
    const d = nextPrescription(hist(LIFT, [[397, 12, 12, 12]], { sets: 3, reps: 12, weight: 397 }), dbl)
    expect(d.kind).toBe('up')
    expect(d.weight).toBe(407)
  })
})

describe('bodyweight exercises', () => {
  const cfg = { id: LIFT, sets: 3, reps: 10, weight: 0, prog: 'linear', bodyweight: true }
  const bw = (rows: Array<Array<number | null>>) => hist(LIFT, rows, { sets: 3, reps: 10 })

  it('从不发明减载重量——俯卧撑无可减', () => {
    const p = nextPrescription(bw([[0, 10, 10, 8], [0, 10, 10, 9], [0, 10, 10, 8]]), cfg)
    expect(p.kind).toBe('hold')
    expect(p.weight).toBe(0)
    expect(p.reps).toBe(10)
  })

  it('干净训练后按次数进步', () => {
    const p = nextPrescription(bw([[0, 10, 10, 10]]), cfg)
    expect(p.kind).toBe('up')
    expect(p.weight).toBe(0)
    expect(p.reps).toBe(11)
  })

  it('有上限时一次一爬', () => {
    const p = nextPrescription(bw([[0, 10, 10, 10]]), { ...cfg, repsMax: 15 })
    expect(p.kind).toBe('up')
    expect(p.reps).toBe(11)
    expect(p.sets).toBeUndefined()
  })

  it('到顶后加一组并回区间底', () => {
    const at15 = hist(LIFT, [[0, 15, 15, 15]], { sets: 3, reps: 15 })
    const p = nextPrescription(at15, { ...cfg, reps: 10, repsMax: 15 })
    expect(p.kind).toBe('up')
    expect(p.sets).toBe(4)
    expect(p.reps).toBe(10)
    expect(p.weight).toBe(0)
  })

  it('到组数上限即止并告知替代方案', () => {
    const at15 = hist(LIFT, [[0, 15, 15, 15]], { sets: 3, reps: 15 })
    const p = nextPrescription(at15, { ...cfg, sets: MAX_BW_SETS, reps: 10, repsMax: 15 })
    expect(p.kind).toBe('hold')
    expect(p.sets).toBeUndefined()
    expect(p.why[0]).toMatch(/更难变式/)
  })

  it('系腰带的组走普通策略——现有负重可加', () => {
    const belted = hist(LIFT, [[10, 10, 10, 10]], { sets: 3, reps: 10 })
    const p = nextPrescription(belted, { ...cfg, bodyweight: true, repsMax: 15 })
    expect(p.kind).toBe('up')
    expect(p.weight).toBeGreaterThan(10)
    expect(p.sets).toBeUndefined()
  })

  it('单侧总量以二进阶，落在 16、18、20（issue #31）', () => {
    const at16 = hist(LIFT, [[0, 16, 16, 16]], { sets: 3, reps: 16 })
    expect(nextPrescription(at16, { ...cfg, reps: 16, side: true }).reps).toBe(18)
    expect(nextPrescription(at16, { ...cfg, reps: 16 }).reps).toBe(17)
  })

  it('无上限时永远爬次数——旧行为', () => {
    const at30 = hist(LIFT, [[0, 30, 30, 30]], { sets: 3, reps: 30 })
    const p = nextPrescription(at30, cfg)
    expect(p.kind).toBe('up')
    expect(p.reps).toBe(31)
    expect(p.sets).toBeUndefined()
  })

  it('对所有策略成立，不止 linear', () => {
    for (const prog of ['linear', 'greyskull', 'double']) {
      const p = nextPrescription(bw([[0, 10, 10, 4], [0, 10, 10, 4], [0, 10, 10, 4]]), { ...cfg, prog })
      expect(p.weight, prog).toBe(0)
      expect(p.kind, prog).toBe('hold')
    }
  })

  it('保留上限加的组：下次干净训练在新组数爬次数（issue #33）', () => {
    const grown = stamped(hist(LIFT, [[0, 10, 10, 10, 10]], { sets: 4, reps: 10 }), plannedOf(cfg))
    const p = nextPrescription(grown, { ...cfg, repsMax: 15 })
    expect(p).toMatchObject({ kind: 'up', reps: 11, sets: 4 })
    const missed = stamped(hist(LIFT, [[0, 10, 10, 10, 8]], { sets: 4, reps: 10 }), plannedOf(cfg))
    expect(nextPrescription(missed, { ...cfg, repsMax: 15 })).toMatchObject({ kind: 'hold', reps: 10, sets: 4 })
  })

  it('旧训练组数更多时从计划组数起步', () => {
    const legacy = hist(LIFT, [[0, 10, 10, 10, 10]], { sets: 4, reps: 10 })
    const clean = nextPrescription(legacy, { ...cfg, repsMax: 15 })
    expect(clean).toMatchObject({ kind: 'up', reps: 11 })
    expect(clean.sets).toBeUndefined()
    const missed = nextPrescription(hist(LIFT, [[0, 10, 10, 10, 8]], { sets: 4, reps: 10 }), { ...cfg, repsMax: 15 })
    expect(missed).toMatchObject({ kind: 'hold', reps: 10 })
    expect(missed.sets).toBeUndefined()
  })

  it('动作实际有负重的那一刻立即加负重', () => {
    const p = nextPrescription(hist(LIFT, [[10, 10, 10, 10]], { sets: 3, reps: 10 }), cfg)
    expect(p.kind).toBe('up')
    expect(p.weight).toBe(12.5)
  })
})

describe('a loaded lift logged at 0 kg', () => {
  const zero = hist(BENCH, [[0, 10, 10, 10]], { sets: 3, reps: 10 })

  it('保持并索要重量，而非爬次数', () => {
    const p = nextPrescription(zero, { id: BENCH, sets: 3, reps: 10, weight: 0, prog: 'linear' })
    expect(p.kind).toBe('hold')
    expect(p.reps).toBeUndefined()
    expect(p.weight).toBeUndefined()
    expect(p.why[0]).toMatch(/未记录重量/)
  })

  it('计划有重量时回退到它', () => {
    expect(nextPrescription(zero, { id: BENCH, sets: 3, reps: 10, weight: 60, prog: 'double' })).toMatchObject({ kind: 'hold', weight: 60 })
  })

  // 只有杠铃、哑铃、训练架或雪橇会到这里。腹轮、瑜伽球、波速球永远按俯卧撑爬次数。
  const noLoad: Record<string, string> = { '0857': 'wheel rollerout', '0271': 'crunch on a stability ball' }
  for (const [id, name] of Object.entries(noLoad)) {
    it(`climbs reps on a ${name}, which has nothing to load`, () => {
      const cfg = { id, sets: 3, reps: 10, weight: 0, eq: 'other' }
      const twice = stamped(hist(id, [[0, 10, 10, 10], [0, 10, 10, 10]], { sets: 3, reps: 10 }), plannedOf(cfg))
      expect(nextPrescription(twice, cfg)).toMatchObject({ kind: 'up', weight: 0, reps: 11 })
    })
  }
})

describe('Greyskull LP', () => {
  const cfg = { id: LIFT, sets: 3, reps: 5, weight: 60, prog: 'greyskull' }

  it('末组达标即前进', () => {
    const p = nextPrescription(hist(LIFT, [[60, 5, 5, 5]]), cfg)
    expect(p.kind).toBe('up')
    expect(p.weight).toBe(62.5)
  })

  it('末组次数翻倍时双倍跳幅', () => {
    const p = nextPrescription(hist(LIFT, [[60, 5, 5, 10]]), cfg)
    expect(p.kind).toBe('up')
    expect(p.weight).toBe(65)
    expect(p.why[0]).toContain('双倍')
  })

  it('首次失败即重置 10%，不同于普通线性', () => {
    const p = nextPrescription(hist(LIFT, [[60, 5, 5, 3]]), cfg)
    expect(p.kind).toBe('deload')
    expect(p.weight).toBe(55)
    expect(DELOAD_AFTER.greyskull).toBe(1)
  })

  it('从已减重量继续重置，而非原重量', () => {
    const p = nextPrescription(hist(LIFT, [[60, 5, 5, 3], [55, 5, 5, 2]]), cfg)
    expect(p.kind).toBe('deload')
    expect(p.weight).toBe(50)            // 55 × 0.9 = 49.5 → 最近的 2.5 步
  })
})

describe('double progression', () => {
  const cfg = { id: LIFT, sets: 3, reps: 12, repsMin: 8, weight: 40, prog: 'double' }

  it('区间顶加量并回底部', () => {
    const p = nextPrescription(hist(LIFT, [[40, 12, 12, 12]], { sets: 3, reps: 12 }), cfg)
    expect(p.kind).toBe('up')
    expect(p.weight).toBe(42.5)
    expect(p.reps).toBe(8)
  })

  it('只匹配自身记录目标（区间顶之下）不加量（issue #278）', () => {
    const target = { sets: 3, reps: 8, weight: 40 }
    const p = nextPrescription(hist(LIFT, [[40, 8, 8, 8]], target), cfg)
    expect(p.kind).not.toBe('up')
    expect(p.weight).toBe(40)
  })

  it('精确按处方完成减载后不再次减载', () => {
    const target = { sets: 3, reps: 12 }
    const stalled = [[40, 9, 9, 9], [40, 9, 9, 9], [40, 9, 9, 9]]
    const deload = nextPrescription(hist(LIFT, stalled, target), cfg)
    expect(deload.kind).toBe('deload')

    const asPrescribed = [deload.weight as number, ...Array(target.sets).fill(deload.reps as number)]
    const effectiveTarget = { ...target, weight: deload.weight, reps: deload.reps }
    const completed = hist(LIFT, stalled, target)
    completed.workouts.push({
      d: '2026-01-04',
      entries: [{
        id: LIFT,
        target: effectiveTarget,
        sets: asPrescribed.slice(1).map(r => ({ w: asPrescribed[0], r, done: true })),
      }],
    })
    const next = nextPrescription(completed, cfg)
    expect(next.kind).not.toBe('deload')
    expect(next.weight as number).toBeGreaterThanOrEqual(deload.weight as number)
  })

  it('区间内保持重量并多要一次', () => {
    const p = nextPrescription(hist(LIFT, [[40, 10, 9, 9]], { sets: 3, reps: 12 }), cfg)
    expect(p.kind).toBe('hold')
    expect(p.weight).toBe(40)
    expect(p.reps).toBe(10)             // 最差组 9 → 冲 10
  })

  it('从不要超区间顶', () => {
    const p = nextPrescription(hist(LIFT, [[40, 12, 12, 11]], { sets: 3, reps: 12 }), cfg)
    expect(p.reps as number).toBeLessThanOrEqual(12)
  })

  it('一连串停滞后减载并回区间底', () => {
    const rows = [[40, 9, 9, 9], [40, 9, 9, 9], [40, 9, 9, 9]]
    const p = nextPrescription(hist(LIFT, rows, { sets: 3, reps: 12 }), cfg)
    expect(p.kind).toBe('deload')
    expect(p.reps).toBe(8)
    expect(p.weight).toBe(40)           // 40 × 8 是最接近的有效 Epley 候选
  })

  it('比减载预算更宽的区间在上升途中不削减', () => {
    expect((cfg.reps as number) - (cfg.repsMin as number)).toBeGreaterThan(DELOAD_AFTER.double - 1)

    const target = { sets: 3, reps: cfg.reps }
    const rows: Array<Array<number | null>> = []
    let p: { weight?: number; reps?: number; kind: string } = { weight: cfg.weight, reps: cfg.repsMin }
    for (let session = 1; session <= 5; session++) {
      rows.push([p.weight as number, ...Array(target.sets).fill(p.reps as number)])
      p = nextPrescription(hist(LIFT, rows, target), cfg) as never
      expect(p.kind).not.toBe('deload')
    }

    expect(p.kind).toBe('up')
    expect(p.weight as number).toBeGreaterThan(cfg.weight as number)
    expect(p.reps).toBe(cfg.repsMin)
  })

  it('处方前归一化持久化的单侧边界', () => {
    const perSide = { ...cfg, reps: 13, repsMin: 7, side: true }
    const p = nextPrescription(hist(LIFT, [[40, 12, 12, 12]], { sets: 3, reps: 13 }), perSide)
    expect(p.kind).toBe('hold')
    expect(p.reps).toBe(14)
  })

  it('选区间内更低次数，从不超过尝试负荷', () => {
    const target = { sets: 3, reps: 12, weight: 40 }
    const p = nextPrescription(hist(LIFT, [[40, 9, 9, 9], [40, 9, 9, 9], [40, 9, 9, 9]], target), cfg)
    expect(p.kind).toBe('deload')
    expect(p.reps as number).toBeGreaterThanOrEqual(8)
    expect(p.reps as number).toBeLessThanOrEqual(12)
    expect(p.weight as number).toBeLessThanOrEqual(40)
    expect(p.target1RM).toBe(deloadTarget1RM(40, 12))
  })

  it('5kg 负荷保留而降次数，当那比砍 50% 更近', () => {
    const small = { id: LIFT, sets: 3, reps: 8, repsMin: 4, weight: 5, inc: 2.5, prog: 'double' }
    const target = { sets: 3, reps: 8, weight: 5 }
    const p = nextPrescription(hist(LIFT, [[5, 6, 6, 6], [5, 6, 6, 6], [5, 6, 6, 6]], target), small)
    expect(p.kind).toBe('deload')
    expect(p.weight).toBe(5)
    expect(p.reps).toBe(4)
    expect(p.target1RM).toBe(deloadTarget1RM(5, 8))
  })

  it('单侧 Epley 用半数次数并返回偶数总量', () => {
    const perSide = { ...cfg, reps: 8, side: true }
    const target = { sets: 3, reps: 8, weight: 60, side: true }
    const p = nextPrescription(hist(LIFT, [[60, 6, 6, 6], [60, 6, 6, 6], [60, 6, 6, 6]], target), perSide)
    expect(p.kind).toBe('deload')
    expect((p.reps as number) % 2).toBe(0)
    expect(p.target1RM).toBe(deloadTarget1RM(60, 8, 0.9, true))
  })
})

describe('triple progression', () => {
  // 三倍进阶（issue #179）：先次数，再组数，最后负重。
  // setup 复现上游 buildSessionEntries 的关键输出：条目带 planned 戳与
  // target.rowReps（每组目标），训练时按目标完成（或按给定 lift 完成）。
  const cfg = { id: LIFT, sets: 3, setsMax: 5, reps: 12, repsMin: 8, weight: 60, inc: 2.5, mode: 'reps', prog: 'triple' }
  const routine = { id: 'r' }
  let day = 0
  // 一次训练：以上次处方的 rowReps 为目标，全部完成，落一条历史
  const train = (st: Record<string, unknown>, lift: (aim: number, k: number) => number = aim => aim, useCfg: Record<string, unknown> = cfg) => {
    const p = nextPrescription(st, useCfg, routine)
    const rows = p.rowReps ?? [p.reps ?? cfg.reps as number]
    const sets = rows.map((r, k) => ({ w: (p.weight ?? cfg.weight) as number, r: lift(r, k), done: true }))
    day++
    const w = {
      d: '2026-01-' + String(day).padStart(2, '0'),
      routineIds: ['r'],
      entries: [{
        id: LIFT, rid: 'r',
        planned: plannedOf(useCfg),
        target: { sets: rows.length, reps: useCfg.reps, rowReps: rows, weight: (p.weight ?? useCfg.weight) as number },
        sets,
      }],
    }
    return { st: { ...st, workouts: [...(st.workouts as unknown[]), w] }, entry: w.entries[0] }
  }
  const fresh = (): Record<string, unknown> => { day = 0; return { unit: 'kg', workouts: [] } }
  const aimsOf = (entry: { sets: Array<{ r: number }> }) => entry.sets.map(s => s.r)

  it('reads its set range off sets and setsMax, never below the base sets', () => {
    expect(tripleSetsOf({ sets: 3, setsMax: 5 })).toEqual({ setsMin: 3, setsMax: 5 })
    expect(tripleSetsOf({ sets: 3 })).toEqual({ setsMin: 3, setsMax: 3 })
    expect(tripleSetsOf({ sets: 4, setsMax: 2 })).toEqual({ setsMin: 4, setsMax: 4 })
  })

  it('stamps setsMax as part of the plan, so raising it starts the plan again', () => {
    expect(plannedOf(cfg)).toMatchObject({ sets: 3, reps: 12, repsMin: 8, setsMax: 5 })
    expect(planChanged(plannedOf(cfg), { ...cfg, setsMax: 6 })).toBe(true)
    expect(planChanged(plannedOf(cfg), cfg)).toBe(false)
  })

  it('opens the first session at the base sets and the bottom of the range', () => {
    const p = nextPrescription(fresh(), cfg, routine)
    expect(p).toMatchObject({ kind: 'first', sets: 3, reps: 8, rowReps: [8, 8, 8] })
  })

  it('climbs the base sets together, adds one set at a time, then raises the weight', () => {
    let st = fresh()
    const line: string[] = []
    for (let i = 0; i < 20; i++) {
      const r = train(st)
      line.push(`${r.entry.sets[0].w}:${aimsOf(r.entry).join(',')}`)
      st = r.st
    }
    // 与上游 progression.triple.test.js 的完整循环逐行一致
    expect(line.slice(0, 5)).toEqual(['60:8,8,8', '60:9,9,9', '60:10,10,10', '60:11,11,11', '60:12,12,12'])
    expect(line.slice(5, 10)).toEqual(['60:12,12,12,8', '60:12,12,12,9', '60:12,12,12,10', '60:12,12,12,11', '60:12,12,12,12'])
    expect(line.slice(10, 15)).toEqual(['60:12,12,12,12,8', '60:12,12,12,12,9', '60:12,12,12,12,10', '60:12,12,12,12,11', '60:12,12,12,12,12'])
    expect(line[15]).toBe('62.5:8,8,8')
    expect(line.slice(16, 20)).toEqual(['62.5:9,9,9', '62.5:10,10,10', '62.5:11,11,11', '62.5:12,12,12'])
  })

  it('counts reps beyond the aim: a set that already reached the top adds the next set', () => {
    let st = fresh()
    st = train(st, () => 12).st                        // 要 8 做了 12
    const p = nextPrescription(st, cfg, routine)
    expect(p).toMatchObject({ kind: 'up', sets: 4, rowReps: [12, 12, 12, 8], weight: 60 })
  })

  it('without a set ceiling above the base sets it is double progression with per-set aims', () => {
    const flat = { ...cfg, setsMax: undefined }
    let st = fresh()
    st = train(st, () => 12, flat).st
    const p = nextPrescription(st, flat, routine)
    expect(p).toMatchObject({ kind: 'up', weight: 62.5, rowReps: [8, 8, 8] })
  })

  it('holds the same sets and reps after a miss, without cutting the added set', () => {
    let st = fresh()
    for (let i = 0; i < 7; i++) st = train(st).st      // 到 12,12,12,9 一态
    const before = train(st)
    expect(aimsOf(before.entry)).toEqual([12, 12, 12, 10])
    st = train(st, (aim, k) => (k === 3 ? aim - 3 : aim)).st   // 12,12,12,7 of 12,12,12,10
    const p = nextPrescription(st, cfg, routine)
    expect(p).toMatchObject({ kind: 'hold', weight: 60, sets: 4, rowReps: [12, 12, 12, 10] })
  })

  it('more reps on the moving set is progress, so it does not count toward a deload', () => {
    let st = fresh()
    for (let i = 0; i < 7; i++) st = train(st).st
    st = train(st, (aim, k) => (k === 3 ? 7 : aim)).st         // 目标 10，做 7
    st = train(st, (aim, k) => (k === 3 ? 8 : aim)).st         // 做 8：更好
    st = train(st, (aim, k) => (k === 3 ? 9 : aim)).st         // 做 9：更好
    const sessions = sessionsFor(st, LIFT, cfg, 'r')
    expect(stallCount(sessions, 'triple')).toBe(0)
    const p = nextPrescription(st, cfg, routine)
    expect(p.kind).toBe('hold')
    expect(p.rowReps).toEqual([12, 12, 12, 10])
  })

  it('three real stalls deload with Epley and start the cycle again at the base sets', () => {
    let st = fresh()
    for (let i = 0; i < 7; i++) st = train(st).st
    for (let i = 0; i < 3; i++) st = train(st, (aim, k) => (k === 3 ? 7 : aim)).st
    const p = nextPrescription(st, cfg, routine)
    expect(p.kind).toBe('deload')
    expect(p.sets).toBe(3)
    expect(p.rowReps).toEqual([8, 8, 8])
    expect(p.weight as number).toBeLessThan(60)
  })
})

describe('timed progression', () => {
  const cfg = { id: LIFT, mode: 'time', sets: 2, sec: 45, prog: 'time' }
  const T = { sets: 2, sec: 45, mode: 'time' }
  const timeHist = (rows: number[][]) => ({
    unit: 'kg',
    workouts: rows.map((row, i) => ({
      d: '2026-02-0' + (i + 1),
      entries: [{ id: LIFT, target: T, sets: row.map(sec => ({ sec, w: 0, done: true })) }],
    })),
  })

  it('每组都满时长则加时', () => {
    const p = nextPrescription(timeHist([[45, 45]]), cfg)
    expect(p.kind).toBe('up')
    expect(p.sec).toBe(50)
    expect(p.weight).toBeUndefined()
  })

  it('有组差一点则重复目标', () => {
    const p = nextPrescription(timeHist([[45, 38]]), cfg)
    expect(p.kind).toBe('hold')
    expect(p.sec).toBe(45)
  })

  it('一连串短训练后回退目标', () => {
    const p = nextPrescription(timeHist([[45, 30], [45, 32], [45, 31]]), cfg)
    expect(p.kind).toBe('deload')
    expect(p.sec).toBe(40)              // 45 × 0.9 = 40.5 → 最近的 5s 步
  })

  it('动作切到计时模式时忽略 reps 历史', () => {
    const S = hist(LIFT, [[60, 5, 5, 5]])
    const p = nextPrescription({ ...S, unit: 'kg' }, cfg)
    expect(p.kind).toBe('first')        // 尚无计时训练，故无意见
  })
})

describe('policy "off"', () => {
  it('完全无意见', () => {
    const p = nextPrescription(hist(LIFT, [[60, 5, 5, 5]]), { id: LIFT, sets: 3, reps: 5, prog: 'off' })
    expect(p.kind).toBe('off')
    expect(p.weight).toBeUndefined()
  })
  it('有氧恒得 off', () => {
    expect(nextPrescription({ unit: 'kg', workouts: [] }, { id: CARDIO, sets: 1, min: 20 }).kind).toBe('off')
  })
})

describe('sessionsFor with routine slots (#216)', () => {
  const entry = (rid: string, w: number, r: number, extra: Record<string, unknown> = {}) => ({
    id: LIFT, rid, target: { sets: 2, reps: r, weight: w }, sets: [{ w, r, done: true }, { w, r, done: true }], ...extra,
  })
  const S = {
    unit: 'kg',
    workouts: [
      { d: '2026-03-01', routineIds: ['heavy'], entries: [entry('heavy', 60, 10)] },
      { d: '2026-03-03', routineIds: ['light'], entries: [entry('light', 40, 15)] },
    ],
  }
  const heavy = { id: 'heavy', prog: 'linear' }
  const light = { id: 'light', prog: 'linear' }

  it('只读例程自身训练，各标其例程', () => {
    expect(sessionsFor(S, LIFT, null, 'heavy').map(s => [s.d, s.rid, s.weight])).toEqual([['2026-03-01', 'heavy', 60]])
    expect(sessionsFor(S, LIFT, null, 'light').map(s => [s.d, s.rid, s.weight])).toEqual([['2026-03-03', 'light', 40]])
    expect(sessionsFor(S, LIFT)).toHaveLength(2)
  })

  it('每个例程从自身最近训练渐进', () => {
    expect(nextPrescription(S, { id: LIFT, sets: 2, reps: 10, weight: 60 }, heavy).weight).toBe(62.5)
    expect(nextPrescription(S, { id: LIFT, sets: 2, reps: 15, weight: 40 }, light).weight).toBe(42.5)
  })

  it('从无训练的例程回退到该动作全部历史', () => {
    expect(sessionsFor(S, LIFT, null, 'new').map(s => s.rid)).toEqual(['heavy', 'light'])
  })

  it('合并日按例程自身条目读，而非第一个', () => {
    const combined = { unit: 'kg', workouts: [{ d: '2026-03-05', routineIds: ['heavy', 'light'], entries: [entry('heavy', 60, 10), entry('light', 40, 15)] }] }
    expect(sessionsFor(combined, LIFT, null, 'light').map(s => s.weight)).toEqual([40])
    expect(nextPrescription(combined, { id: LIFT, sets: 2, reps: 15, weight: 40 }, light).weight).toBe(42.5)
  })

  it('一个例程的停滞不减载另一个', () => {
    const miss = (d: string, rid: string, w: number) => ({ d, routineIds: [rid], entries: [{ id: LIFT, rid, target: { sets: 2, reps: 10, weight: w }, sets: [{ w, r: 6, done: true }, { w, r: 6, done: true }] }] })
    const st = { unit: 'kg', workouts: [miss('2026-03-01', 'heavy', 60), S.workouts[1], miss('2026-03-05', 'heavy', 60), miss('2026-03-07', 'heavy', 60)] }
    expect(nextPrescription(st, { id: LIFT, sets: 2, reps: 10, weight: 60 }, heavy).kind).toBe('deload')
    expect(nextPrescription(st, { id: LIFT, sets: 2, reps: 15, weight: 40 }, light).kind).toBe('up')
  })
})

describe('an edited plan restarts progression (#275)', () => {
  const logged = (id: string, planned: Record<string, unknown>, target: Record<string, unknown>, w: number, reps: number[], extra: Record<string, unknown> = {}) => ({
    d: '2026-04-01', routineIds: ['r'],
    entries: [{ id, planned, target, sets: reps.map(r => ({ w, r, done: true })), ...extra }],
  })
  const R = { id: 'r' }

  it('stamps only what the routine asks for, and tells an edit from a progression', () => {
    expect(plannedOf({ id: LIFT, sets: 2, reps: 10, weight: 60, prog: 'linear', note: 'x' })).toEqual({ sets: 2, reps: 10, weight: 60 })
    expect(planChanged(plannedOf({ id: LIFT, sets: 2, reps: 10, weight: 60 }), { id: LIFT, sets: 2, reps: 10, weight: 80 })).toBe(false)
    expect(planChanged(plannedOf({ id: LIFT, sets: 2, reps: 10, weight: 60 }), { id: LIFT, sets: 2, reps: 12, weight: 60 })).toBe(true)
    expect(planChanged(undefined, { id: LIFT, sets: 2, reps: 12 })).toBe(false)
  })

  it('holds the weight at the new sets × reps when a loaded lift\'s plan was edited', () => {
    const S = { unit: 'kg', workouts: [logged(LIFT, { sets: 2, reps: 15, weight: 40 }, { sets: 2, reps: 15, weight: 40 }, 40, [15, 15])] }
    const p = nextPrescription(S, { id: LIFT, sets: 2, reps: 10, weight: 40, prog: 'linear' }, R)
    expect(p).toMatchObject({ kind: 'hold', weight: 40, reps: 10 })
    expect(p.why[0]).toBe('计划已变更，从你的新目标起步。')
    expect(nextPrescription(S, { id: LIFT, sets: 2, reps: 15, weight: 40, prog: 'linear' }, R)).toMatchObject({ kind: 'up', weight: 42.5 })
  })

  it('opens at the plan\'s new weight when the edit changed it along with the reps', () => {
    const five = logged(LIFT, { sets: 3, reps: 5, weight: 100 }, { sets: 3, reps: 5, weight: 102.5 }, 102.5, [5, 5, 5])
    const S = { unit: 'kg', workouts: [five] }
    expect(nextPrescription(S, { id: LIFT, sets: 3, reps: 10, weight: 70, prog: 'linear' }, R)).toMatchObject({ kind: 'hold', weight: 70, reps: 10 })
    expect(nextPrescription(S, { id: LIFT, sets: 3, reps: 10, weight: 100, prog: 'linear' }, R)).toMatchObject({ kind: 'hold', weight: 102.5, reps: 10 })
    // 仅改重量不重启：组数与次数是计划的，历史继续
    expect(nextPrescription(S, { id: LIFT, sets: 3, reps: 5, weight: 70, prog: 'linear' }, R)).toMatchObject({ kind: 'up', weight: 105 })
  })

  it('starts a new weight at the bottom of a double-progression range', () => {
    const twelve = logged(LIFT, { sets: 3, reps: 12, weight: 40 }, { sets: 3, reps: 12, weight: 40 }, 40, [12, 12, 12])
    const p = nextPrescription({ unit: 'kg', workouts: [twelve] }, { id: LIFT, sets: 3, reps: 12, repsMin: 8, weight: 60, prog: 'double' }, R)
    expect(p).toMatchObject({ kind: 'hold', weight: 60, reps: 8 })
  })

  it('restarts a bodyweight goal from the new reps instead of climbing from the old ones', () => {
    const S = { unit: 'kg', workouts: [logged(LIFT, { sets: 2, reps: 15, weight: 0 }, { sets: 2, reps: 15, weight: 0 }, 0, [15, 15])] }
    const p = nextPrescription(S, { id: LIFT, sets: 2, reps: 10, weight: 0, bodyweight: true }, R)
    expect(p).toMatchObject({ kind: 'hold', weight: 0, reps: 10 })
  })

  it('does not deload toward the old target after three misses and an edit', () => {
    const miss = { d: '2026-04-01', routineIds: ['r'], entries: [{ id: LIFT, planned: { sets: 3, reps: 15, weight: 50 }, target: { sets: 3, reps: 15, weight: 50 }, sets: [12, 12, 12].map(r => ({ w: 50, r, done: true })) }] }
    const S = { unit: 'kg', workouts: [miss, miss, miss] }
    expect(nextPrescription(S, { id: LIFT, sets: 3, reps: 15, weight: 50, prog: 'linear' }, R).kind).toBe('deload')
    const p = nextPrescription(S, { id: LIFT, sets: 2, reps: 10, weight: 50, prog: 'linear' }, R)
    expect(p).toMatchObject({ kind: 'hold', weight: 50, reps: 10 })
    expect(p.sets).toBeUndefined()
  })

  it('ends a stall streak at the edit — misses against the old plan do not count', () => {
    const at = (planned: Record<string, unknown>, reps: number[]) => ({ d: '2026-04-01', routineIds: ['r'], entries: [{ id: LIFT, planned, target: { ...planned }, sets: reps.map(r => ({ w: 50, r, done: true })) }] })
    const old = { sets: 3, reps: 15, weight: 50 }
    const now = { sets: 3, reps: 10, weight: 50 }
    const S = { unit: 'kg', workouts: [at(old, [12, 12, 12]), at(old, [12, 12, 12]), at(now, [9, 9, 9])] }
    expect(stallCount(sessionsFor(S, LIFT, null, 'r'))).toBe(1)
    expect(nextPrescription(S, { id: LIFT, ...now, prog: 'linear' }, R).kind).toBe('hold')
  })

  it('aims inside the new range under double progression, from what you managed', () => {
    const S = { unit: 'kg', workouts: [logged(LIFT, { sets: 3, reps: 8, weight: 36 }, { sets: 3, reps: 8, weight: 36 }, 36, [8, 8, 8])] }
    const p = nextPrescription(S, { id: LIFT, sets: 3, reps: 12, repsMin: 8, weight: 36, prog: 'double' }, R)
    expect(p).toMatchObject({ kind: 'hold', weight: 36, reps: 9 })
  })

  it('restarts a timed hold at its new duration', () => {
    const S = { unit: 'kg', workouts: [logged(LIFT, { sets: 2, sec: 60, weight: 0 }, { mode: 'time', sets: 2, sec: 60 }, 0, [], { sets: [{ sec: 60, done: true }, { sec: 60, done: true }] })] }
    const p = nextPrescription(S, { id: LIFT, mode: 'time', sets: 2, sec: 30, weight: 0, prog: 'time' }, R)
    expect(p).toMatchObject({ kind: 'hold', sec: 30 })
  })

  it('starts a routine from its own target when the only history is another routine\'s', () => {
    const B = { d: '2026-04-01', routineIds: ['b'], entries: [{ id: LIFT, rid: 'b', planned: { sets: 2, reps: 15, weight: 40 }, target: { sets: 2, reps: 15, weight: 40 }, sets: [{ w: 40, r: 15, done: true }, { w: 40, r: 15, done: true }] }] }
    const p = nextPrescription({ unit: 'kg', workouts: [B] }, { id: LIFT, sets: 2, reps: 10, weight: 60, prog: 'linear' }, { id: 'a' })
    expect(p).toMatchObject({ kind: 'hold', weight: 60, reps: 10 })
    expect(p.why[0]).toBe('首次进入该例程，从其自身目标起步。')
  })

  it('continues another routine\'s progression when its plan is the same one (a copied routine)', () => {
    const B = { d: '2026-04-01', routineIds: ['b'], entries: [{ id: LIFT, rid: 'b', planned: { sets: 2, reps: 10, weight: 60 }, target: { sets: 2, reps: 10, weight: 60 }, sets: [{ w: 60, r: 10, done: true }, { w: 60, r: 10, done: true }] }] }
    expect(nextPrescription({ unit: 'kg', workouts: [B] }, { id: LIFT, sets: 2, reps: 10, weight: 60, prog: 'linear' }, { id: 'copy' }))
      .toMatchObject({ kind: 'up', weight: 62.5 })
  })

  it('leaves history saved before plans were stamped to progress as it always did', () => {
    const S = { unit: 'kg', workouts: [{ d: '2026-04-01', routineIds: ['r'], entries: [{ id: LIFT, target: { sets: 2, reps: 15, weight: 40 }, sets: [{ w: 40, r: 15, done: true }, { w: 40, r: 15, done: true }] }] }] }
    expect(nextPrescription(S, { id: LIFT, sets: 2, reps: 10, weight: 40, prog: 'linear' }, R)).toMatchObject({ kind: 'up', weight: 42.5 })
  })

  it('aims an Epley deload at the plan\'s set count even for history saved before plans were stamped', () => {
    const miss = { d: '2026-04-01', routineIds: ['r'], entries: [{ id: LIFT, target: { sets: 3, reps: 8, weight: 60 }, sets: [6, 6, 6].map(r => ({ w: 60, r, done: true })) }] }
    const p = nextPrescription({ unit: 'kg', workouts: [miss, miss, miss] }, { id: LIFT, sets: 2, reps: 8, weight: 60, prog: 'linear' }, R)
    expect(p.kind).toBe('deload')
    expect(p.sets).toBe(2)
  })
})

describe('per-entry noProg (combine routines)', () => {
  const PRESS = 'press-1'
  const tgt = (w: number) => ({ sets: 3, reps: 5, weight: w })
  const entry = (id: string, w: number, reps: number[], extra?: Record<string, unknown>) => ({ id, target: tgt(w), sets: reps.map(r => ({ w, r, done: true })), ...extra })

  it('skips a noProg entry for that exercise only, in a mixed combined session', () => {
    const S = {
      unit: 'kg',
      workouts: [{
        d: '2026-02-01',
        routineIds: ['strength', 'rehab'],
        entries: [entry(LIFT, 60, [5, 5, 5]), entry(PRESS, 40, [5, 5, 5], { noProg: true })],
      }],
    }
    expect(sessionsFor(S, LIFT)).toHaveLength(1)
    expect(sessionsFor(S, PRESS)).toHaveLength(0)
  })

  it('still advances the non-excluded exercise of a mixed combined session', () => {
    const S = {
      unit: 'kg',
      workouts: [{
        d: '2026-02-01',
        entries: [entry(LIFT, 60, [5, 5, 5]), entry(PRESS, 40, [5, 5, 5], { noProg: true })],
      }],
    }
    expect(nextPrescription(S, { id: LIFT, ...tgt(60), prog: 'linear' }).weight).toBe(62.5)
  })

  it('a noProg gap never becomes the deload / stall baseline', () => {
    const S = {
      unit: 'kg',
      workouts: [
        { d: '2026-02-01', entries: [entry(LIFT, 60, [5, 5, 5])] },
        { d: '2026-02-03', entries: [entry(LIFT, 60, [5, 5, 5])] },
        { d: '2026-02-05', entries: [entry(LIFT, 30, [8, 8, 8], { noProg: true })] },
      ],
    }
    expect(sessionsFor(S, LIFT).map(s => s.d)).toEqual(['2026-02-01', '2026-02-03'])
    expect(nextPrescription(S, { id: LIFT, ...tgt(60), prog: 'linear' }).weight).toBe(62.5)
  })

  it('honours a legacy whole-workout excludeFromProgression flag (all entries skipped)', () => {
    const S = {
      unit: 'kg',
      workouts: [
        { d: '2026-02-01', entries: [entry(LIFT, 60, [5, 5, 5])] },
        { d: '2026-02-08', excludeFromProgression: true, entries: [entry(LIFT, 30, [8, 8])] },
      ],
    }
    expect(sessionsFor(S, LIFT).map(s => s.d)).toEqual(['2026-02-01'])
  })

  it('an exercise only ever logged noProg → sessionsFor [] → nextPrescription kind "first"', () => {
    const S = { unit: 'kg', workouts: [{ d: '2026-02-01', entries: [entry(LIFT, 30, [8, 8, 8], { noProg: true })] }] }
    expect(sessionsFor(S, LIFT)).toHaveLength(0)
    expect(nextPrescription(S, { id: LIFT, ...tgt(50), prog: 'linear' }).kind).toBe('first')
  })

  it('stallCount is not reset by a noProg gap at the same weight', () => {
    const miss = (d: string) => ({ d, entries: [entry(LIFT, 60, [4, 4, 4])] })
    const S = {
      unit: 'kg',
      workouts: [
        { d: '2026-02-01', entries: [entry(LIFT, 60, [5, 5, 5])] },
        miss('2026-02-03'),
        { d: '2026-02-04', entries: [entry(LIFT, 60, [3, 3, 3], { noProg: true })] },
        miss('2026-02-05'),
        miss('2026-02-07'),
      ],
    }
    const sessions = sessionsFor(S, LIFT)
    expect(sessions.map(s => s.d)).toEqual(['2026-02-01', '2026-02-03', '2026-02-05', '2026-02-07'])
    expect(stallCount(sessions)).toBe(3)
    expect(nextPrescription(S, { id: LIFT, ...tgt(60), prog: 'linear' }).kind).toBe('deload')
  })
})

describe('history logged before targets were recorded', () => {
  const legacy = (rows: Array<Array<number | null>>) => ({
    unit: 'kg',
    workouts: rows.map((row, i) => ({
      d: '2026-03-' + String(i + 1).padStart(2, '0'),
      entries: [{ id: LIFT, sets: row.slice(1).map(r => ({ w: row[0], r, done: true })) }],   // 无 target
    })),
  })
  const cfg = { id: LIFT, sets: 3, reps: 5, weight: 60, prog: 'linear' }

  it('judges a targetless session against the current plan instead of calling it a miss', () => {
    const p = nextPrescription(legacy([[60, 5, 5, 5]]), cfg)
    expect(p.kind).toBe('up')
    expect(p.weight).toBe(62.5)
  })

  it('does not manufacture a stall out of a long clean history', () => {
    const p = nextPrescription(legacy(Array.from({ length: 11 }, () => [60, 5, 5, 5])), cfg)
    expect(p.kind).toBe('up')
  })

  it('still spots a genuine miss in old data', () => {
    expect(nextPrescription(legacy([[60, 5, 5, 2]]), cfg).kind).toBe('hold')
  })

  it('matches the weight hint the app showed before this engine existed', () => {
    expect(nextPrescription(legacy([[60, 5, 6, 5]]), cfg).weight).toBe(62.5)
    expect(nextPrescription(legacy([[60, 5, 4, 5]]), cfg).kind).toBe('hold')
  })
})

describe('applyPrescription', () => {
  const sets = [{ w: 60, r: 5, done: true }, { w: 60, r: 5, done: false }]

  it('rewrites only what the policy decided, and only unlogged sets', () => {
    const out = applyPrescription(sets, { policy: 'linear', kind: 'up', weight: 62.5, why: ['x'] })
    expect(out[0]).toEqual({ w: 60, r: 5, done: true })
    expect(out[1]).toEqual({ w: 62.5, r: 5, done: false })
  })

  it('sets reps too when the policy has an opinion about them', () => {
    expect(applyPrescription(sets, { policy: 'linear', kind: 'up', weight: 42.5, reps: 8, why: ['x'] })[1]).toEqual({ w: 42.5, r: 8, done: false })
  })

  it('re-ramps an open warm-up toward the new weight but never under the bar', () => {
    const s = [{ w: 25, r: 10, done: false, phase: 'warmup' }, { w: 50, r: 10, done: false }]
    expect(applyPrescription(s, { policy: 'linear', kind: 'up', weight: 55, why: ['x'] }, 5, 45).map(r => r.w)).toEqual([45, 55])
    expect(applyPrescription(s, { policy: 'linear', kind: 'up', weight: 55, why: ['x'] }, 5).map(r => r.w)).toEqual([25, 55])
  })

  it('touches nothing for "off" or a first session', () => {
    expect(applyPrescription(sets, { policy: 'linear', kind: 'off', why: ['x'] })).toBe(sets)
    expect(applyPrescription(sets, { policy: 'linear', kind: 'first', why: ['x'] })).toBe(sets)
    expect(applyPrescription(sets, null)).toBe(sets)
  })

  it('adjusts a timed set without inventing a weight', () => {
    const timed = [{ sec: 45, w: 0, done: false }]
    expect(applyPrescription(timed, { policy: 'time', kind: 'up', sec: 50, why: ['x'] })).toEqual([{ sec: 50, w: 0, done: false }])
  })

  it('grows the list when the policy added a set (issue #33)', () => {
    const three = [{ w: 0, r: 10, done: false }, { w: 0, r: 10, done: false }, { w: 0, r: 10, done: false }]
    const out = applyPrescription(three, { policy: 'linear', kind: 'up', weight: 0, reps: 10, sets: 4, why: ['x'] })
    expect(out).toHaveLength(4)
    expect(out[3]).toEqual({ w: 0, r: 10, done: false })
  })

  it('never shrinks a session that has already logged sets', () => {
    expect(applyPrescription(sets, { policy: 'linear', kind: 'up', weight: 60, sets: 1, why: ['x'] })).toHaveLength(sets.length)
  })
})

describe('warm-up rows in session reads (round 3)', () => {
  it('readSession ignores warm-up rows for reps, count, low and ok', () => {
    const s = readSession({ id: LIFT, target: { sets: 2, reps: 5, mode: 'reps' }, sets: [
      { w: 20, r: 8, done: true, warmup: true },
      { w: 60, r: 5, done: true },
      { w: 60, r: 6, done: true },
    ] })
    expect(s.count).toBe(2)
    expect(s.low).toBe(5)
    expect(s.reps).toEqual([5, 6])
    expect(s.ok).toBe(true)
  })

  it('readSession keeps an undone warm-up out of held/ok in time mode', () => {
    const s = readSession({ id: LIFT, target: { sets: 2, sec: 45, mode: 'time' }, sets: [
      { sec: 45, done: true, warmup: true },
      { sec: 45, done: true },
      { sec: 30, done: true },
    ] })
    expect(s.held).toEqual([45, 30])
    expect(s.ok).toBe(false)
  })

  it('uses phase as authoritative and falls back to the legacy warm-up flag', () => {
    const s = readSession({ id: LIFT, target: { sets: 1, reps: 5 }, sets: [
      { phase: 'warmup', w: 120, r: 20, done: true },
      { phase: 'work', warmup: true, w: 60, r: 5, done: true },
    ] })
    expect(s.count).toBe(1)
    expect(s.weight).toBe(60)
    expect(s.low).toBe(5)
    expect(s.ok).toBe(true)
  })
})

describe('applyPrescription never touches warm-up rows (round 3)', () => {
  it('leaves a done warm-up exactly as logged', () => {
    const s = [
      { w: 20, r: 8, done: true, warmup: true },
      { w: 60, r: 5, done: true },
      { w: 60, r: 5, done: false },
    ]
    const out = applyPrescription(s, { policy: 'linear', kind: 'up', weight: 62.5, reps: 5, why: ['x'] })
    expect(out[0]).toEqual({ w: 20, r: 8, done: true, warmup: true })
    expect(out[1]).toEqual({ w: 60, r: 5, done: true })
    expect(out[2]).toEqual({ w: 62.5, r: 5, done: false })
  })

  it('grows the work rows, not the warm-up rows, when the policy adds sets', () => {
    const s = [
      { w: 20, r: 8, done: true, warmup: true },
      { w: 60, r: 5, done: true },
      { w: 60, r: 5, done: false },
    ]
    const out = applyPrescription(s, { policy: 'linear', kind: 'up', weight: 62.5, reps: 5, sets: 4, why: ['x'] })
    expect(out.filter(x => !x.warmup)).toHaveLength(4)
    expect(out.filter(x => x.warmup)).toHaveLength(1)
    expect(out[0]).toEqual({ w: 20, r: 8, done: true, warmup: true })
  })

  it('an open warm-up follows the reps or the hold the policy settled on, never a done one', () => {
    const reps = applyPrescription([
      { w: 20, r: 8, done: true, warmup: true },
      { w: 0, r: 10, done: false, phase: 'warmup' },
      { w: 0, r: 10, done: false },
    ], { policy: 'linear', kind: 'up', weight: 0, reps: 12, why: ['x'] })
    expect(reps.map(s => s.r)).toEqual([8, 12, 12])
    const held = applyPrescription([{ sec: 30, w: 0, done: false, phase: 'warmup' }, { sec: 30, w: 0, done: false }], { policy: 'time', kind: 'up', sec: 35, why: ['x'] })
    expect(held.map(s => s.sec)).toEqual([35, 35])
  })

  it('an all-warm-up entry terminates and stays untouched', () => {
    const s = [
      { w: 20, r: 8, done: true, warmup: true },
      { w: 25, r: 6, done: true, warmup: true },
    ]
    const out = applyPrescription(s, { policy: 'linear', kind: 'up', weight: 62.5, reps: 5, sets: 4, why: ['x'] })
    expect(out).toEqual(s)
  })
})

describe('drop-sets and rest-pause sets in progression', () => {
  it('readSession judges a drop-set row on its own main weight/reps, ignoring the drops', () => {
    const withDrops = readSession({ id: LIFT, target: { sets: 1, reps: 5 }, sets: [
      { type: 'dropset', w: 60, r: 5, done: true, drops: [{ w: 40, r: 8 }, { w: 20, r: 10 }] },
    ] })
    const plain = readSession({ id: LIFT, target: { sets: 1, reps: 5 }, sets: [{ w: 60, r: 5, done: true }] })
    expect(withDrops).toEqual(plain)
  })

  it('readSession judges a rest-pause row on its activation weight/reps, ignoring the bursts', () => {
    const withBursts = readSession({ id: LIFT, target: { sets: 1, reps: 8 }, sets: [
      { type: 'restpause', w: 60, r: 8, done: true, clusters: [{ r: 4, restSec: 15 }, { r: 3, restSec: 15 }] },
    ] })
    const plain = readSession({ id: LIFT, target: { sets: 1, reps: 8 }, sets: [{ w: 60, r: 8, done: true }] })
    expect(withBursts).toEqual(plain)
  })

  it('applyPrescription still rewrites a drop-set/rest-pause row\'s own weight, leaving its drops/clusters untouched', () => {
    const sets = [{ type: 'dropset', w: 60, r: 5, done: false, drops: [{ w: 40, r: 8 }] }]
    const out = applyPrescription(sets, { policy: 'linear', kind: 'up', weight: 62.5, why: ['x'] })
    expect(out[0]).toEqual({ type: 'dropset', w: 62.5, r: 5, done: false, drops: [{ w: 40, r: 8 }] })
  })

  it('a newly grown row keeps the seed\'s planned type but not its already-logged drops/clusters', () => {
    const sets = [{ type: 'dropset', w: 0, r: 10, done: false, drops: [{ w: 0, r: 12 }] }]
    const out = applyPrescription(sets, { policy: 'linear', kind: 'up', weight: 0, reps: 10, sets: 2, why: ['x'] })
    expect(out).toHaveLength(2)
    expect(out[1]).toEqual({ type: 'dropset', w: 0, r: 10, done: false })
  })
})
