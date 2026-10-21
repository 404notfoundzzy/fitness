import { describe, it, expect } from 'vitest'
import {
  toProfile, mapSets, dateOnly, parseRepRange,
  attachTargets, attachExerciseMeta, fetchHistoryProfile,
  type HistoryWindow,
} from './history'
import { isWarmupRow } from './model'
import { nextPrescription } from './progression'

// ── dateOnly ────────────────────────────────────────────────────────────────

describe('dateOnly', () => {
  it('截断到日期部分', () => {
    expect(dateOnly('2026-10-20 14:35:22')).toBe('2026-10-20')
    expect(dateOnly('2026-10-20')).toBe('2026-10-20')
    expect(dateOnly('2026-10-20T14:35:22.000Z')).toBe('2026-10-20')
    expect(dateOnly(null)).toBeNull()
  })
})

// ── parseRepRange ───────────────────────────────────────────────────────────

describe('parseRepRange', () => {
  it('区间 "8-12" → reps 12 / repsMin 8', () => {
    expect(parseRepRange('8-12')).toEqual({ reps: 12, repsMin: 8 })
  })
  it('单值 "8" → reps=repsMin=8', () => {
    expect(parseRepRange('8')).toEqual({ reps: 8, repsMin: 8 })
  })
  it('非法值 → 空', () => {
    expect(parseRepRange(null)).toEqual({})
    expect(parseRepRange('abc')).toEqual({})
    expect(parseRepRange(0)).toEqual({})
  })
})

// ── mapSets ─────────────────────────────────────────────────────────────────

describe('mapSets', () => {
  it('普通组：weightKg/actualReps/rir/isCompleted → w/r/rir/done', () => {
    const sets = mapSets([
      { setNumber: 1, setType: 'normal', weightKg: 100, actualReps: 8, rir: 2, isCompleted: 1 },
      { setNumber: 2, setType: 'normal', weightKg: 100, actualReps: 7, rir: null, isCompleted: 1 },
    ])
    expect(sets).toHaveLength(2)
    expect(sets[0]).toMatchObject({ w: 100, r: 8, rir: 2, done: true, type: 'normal' })
    expect(sets[1]).toMatchObject({ w: 100, r: 7, done: true })
  })

  it('warmup 组类型 → phase=warmup（isWarmupRow 识别）', () => {
    const sets = mapSets([
      { setNumber: 1, setType: 'warmup', weightKg: 50, actualReps: 10, isCompleted: 1 },
      { setNumber: 2, setType: 'normal', weightKg: 100, actualReps: 8, isCompleted: 1 },
    ])
    expect(isWarmupRow(sets[0])).toBe(true)
    expect(isWarmupRow(sets[1])).toBe(false)
  })

  it('字符串型数字（BigDecimal 序列化）也能转换', () => {
    const sets = mapSets([{ weightKg: '62.5', actualReps: '5', isCompleted: '1' }])
    expect(sets[0]).toMatchObject({ w: 62.5, r: 5, done: true })
  })

  it('单侧两行（perSide=1，同 setNumber）合并为 sides 单行', () => {
    const sets = mapSets([
      { setNumber: 1, perSide: 1, weightKg: 20, actualReps: 10, isCompleted: 1 }, // L
      { setNumber: 1, perSide: 1, weightKg: 20, actualReps: 12, isCompleted: 1 }, // R
      { setNumber: 2, perSide: 1, weightKg: 20, actualReps: 8, isCompleted: 0 },  // L 未完成
      { setNumber: 2, perSide: 1, weightKg: 20, actualReps: 10, isCompleted: 1 }, // R
    ])
    expect(sets).toHaveLength(2)
    expect(sets[0].sides?.L).toMatchObject({ w: 20, r: 10, done: true })
    expect(sets[0].sides?.R).toMatchObject({ w: 20, r: 12, done: true })
    // 行镜像：r 相加、w 取大、done 需两侧都完成（syncSideAggregate 语义）
    expect(sets[0]).toMatchObject({ r: 22, w: 20, done: true })
    expect(sets[1]).toMatchObject({ r: 18, done: false })
  })

  it('单侧行与普通行混排（热身直行 + 单侧工作组）保持顺序', () => {
    const sets = mapSets([
      { setNumber: 1, setType: 'warmup', weightKg: 10, actualReps: 10, isCompleted: 1 },
      { setNumber: 1, perSide: 1, weightKg: 20, actualReps: 10, isCompleted: 1 },
      { setNumber: 1, perSide: 1, weightKg: 20, actualReps: 10, isCompleted: 1 },
    ])
    expect(sets).toHaveLength(2)
    expect(isWarmupRow(sets[0])).toBe(true)
    expect(sets[1].sides?.L).toBeDefined()
  })
})

// ── toProfile ───────────────────────────────────────────────────────────────

const sampleWindow: HistoryWindow = {
  from: '2026-07-24',
  days: 90,
  workoutCount: 2,
  workouts: [
    {
      workoutRecordId: 501,
      workoutDate: '2026-10-18',
      planId: 5,
      dayNumber: 1,
      trainingType: 'plan',
      exercises: [
        {
          exerciseId: 100,
          exerciseName: '杠铃卧推',
          sets: [
            { setNumber: 1, setType: 'normal', weightKg: 100, actualReps: 8, rir: 2, isCompleted: 1 },
            { setNumber: 2, setType: 'normal', weightKg: 100, actualReps: 8, rir: 2, isCompleted: 1 },
            { setNumber: 3, setType: 'normal', weightKg: 100, actualReps: 8, rir: 1, isCompleted: 1 },
          ],
        },
      ],
    },
    {
      workoutRecordId: 502,
      workoutDate: '2026-10-20 08:30:00',
      planId: 5,
      exercises: [
        {
          exerciseId: 100,
          exerciseName: '杠铃卧推',
          sets: [
            { setNumber: 1, setType: 'normal', weightKg: 102.5, actualReps: 6, rir: 2, isCompleted: 1 },
            { setNumber: 2, setType: 'normal', weightKg: 102.5, actualReps: 5, rir: 3, isCompleted: 1 },
            { setNumber: 3, setType: 'normal', weightKg: 102.5, actualReps: 5, rir: 4, isCompleted: 1 },
          ],
        },
        {
          exerciseId: 200,
          exerciseName: '杠铃深蹲',
          sets: [
            { setNumber: 1, setType: 'normal', weightKg: 120, actualReps: 5, rir: 2, isCompleted: 1 },
          ],
        },
      ],
    },
  ],
}

describe('toProfile', () => {
  it('训练/条目/组逐层映射，日期与 start 正确', () => {
    const S = toProfile(sampleWindow)
    expect(S.workouts).toHaveLength(2)
    expect(S.workouts[0].d).toBe('2026-10-18')
    // start 为本地零点
    expect(S.workouts[0].start).toBe(new Date('2026-10-18T00:00:00').getTime())
    const entry = S.workouts[0].entries![0]
    expect(entry.id).toBe('100')
    expect(entry.sets).toHaveLength(3)
    expect(entry.sets![0]).toMatchObject({ w: 100, r: 8, rir: 2, done: true })
  })

  it('planId 派生出引擎的 routineId（rid 过滤来源）', () => {
    const S = toProfile(sampleWindow)
    expect(S.workouts[0].routineId).toBe('5')
  })

  it('空窗口 → 空档案', () => {
    expect(toProfile(null).workouts).toEqual([])
    expect(toProfile({}).workouts).toEqual([])
    expect(toProfile({ workouts: [] }).workouts).toEqual([])
  })
})

// ── attachTargets / attachExerciseMeta ──────────────────────────────────────

describe('attachTargets', () => {
  it('D5 配置 → entry.target（区间展开）', () => {
    const S = attachTargets(toProfile(sampleWindow), {
      '100': { sets: 3, reps: '8-12', rir: 2, prog: 'linear', eq: 'barbell' },
    })
    const target = S.workouts[0].entries![0].target
    expect(target).toMatchObject({ sets: 3, reps: 12, repsMin: 8, rir: 2, prog: 'linear', eq: 'barbell' })
  })

  it('无配置的动作不带 target', () => {
    const S = attachTargets(toProfile(sampleWindow), { '100': { sets: 3 } })
    expect(S.workouts[1].entries![1].target).toBeUndefined()
  })
})

describe('attachExerciseMeta', () => {
  it('动作库元数据 → entry.tg/mg/sm/bp', () => {
    const S = attachExerciseMeta(toProfile(sampleWindow), {
      '100': { tg: 'chest', mg: 'triceps', sm: ['deltoids'], bp: 'chest', eq: 'barbell' },
    })
    const entry = S.workouts[0].entries![0]
    expect(entry.tg).toBe('chest')
    expect(entry.mg).toBe('triceps')
    expect(entry.bp).toBe('chest')
  })
})

// ── 端到端：窗口数据 → 引擎处方 ─────────────────────────────────────────────

describe('端到端：历史窗口 → nextPrescription', () => {
  it('上次全部完成 → linear 加 2.5kg', () => {
    const S = attachTargets(toProfile({
      workouts: [{
        workoutRecordId: 501,
        workoutDate: '2026-10-20',
        planId: 5,
        exercises: [{
          exerciseId: 100,
          exerciseName: '杠铃卧推',
          sets: [
            { setNumber: 1, weightKg: 100, actualReps: 8, isCompleted: 1 },
            { setNumber: 2, weightKg: 100, actualReps: 8, isCompleted: 1 },
            { setNumber: 3, weightKg: 100, actualReps: 8, isCompleted: 1 },
          ],
        }],
      }],
    }), { '100': { sets: 3, reps: 8, rir: 2, prog: 'linear', eq: 'barbell' } })

    const p = nextPrescription(
      S,
      { id: '100', sets: 3, reps: 8, repsMin: 8, prog: 'linear', weight: 100, inc: 2.5, eq: 'barbell', mode: 'reps' },
      { id: '5', prog: 'linear' },
    )
    expect(p.kind).toBe('up')
    expect(p.weight).toBe(102.5)
    expect(p.why[0]).toContain('加')
  })

  it('上次次数未达标 → 重量不变', () => {
    const S = attachTargets(toProfile({
      workouts: [{
        workoutRecordId: 501,
        workoutDate: '2026-10-20',
        planId: 5,
        exercises: [{
          exerciseId: 100,
          exerciseName: '杠铃卧推',
          sets: [
            { setNumber: 1, weightKg: 100, actualReps: 6, isCompleted: 1 },
            { setNumber: 2, weightKg: 100, actualReps: 6, isCompleted: 1 },
            { setNumber: 3, weightKg: 100, actualReps: 6, isCompleted: 1 },
          ],
        }],
      }],
    }), { '100': { sets: 3, reps: 8, prog: 'linear', eq: 'barbell' } })

    const p = nextPrescription(
      S,
      { id: '100', sets: 3, reps: 8, repsMin: 8, prog: 'linear', weight: 100, inc: 2.5, eq: 'barbell', mode: 'reps' },
      { id: '5', prog: 'linear' },
    )
    expect(p.kind).toBe('hold')
    expect(p.weight).toBe(100)
  })

  it('单侧动作（两行合并）也能给出处方', () => {
    const S = attachTargets(toProfile({
      workouts: [{
        workoutRecordId: 501,
        workoutDate: '2026-10-20',
        planId: 5,
        exercises: [{
          exerciseId: 300,
          exerciseName: '哑铃单腿硬拉',
          sets: [
            { setNumber: 1, perSide: 1, weightKg: 24, actualReps: 10, isCompleted: 1 },
            { setNumber: 1, perSide: 1, weightKg: 24, actualReps: 10, isCompleted: 1 },
            { setNumber: 2, perSide: 1, weightKg: 24, actualReps: 10, isCompleted: 1 },
            { setNumber: 2, perSide: 1, weightKg: 24, actualReps: 10, isCompleted: 1 },
          ],
        }],
      }],
    }), { '300': { sets: 2, reps: 10, side: true, prog: 'linear', eq: 'dumbbell' } })

    const p = nextPrescription(
      S,
      { id: '300', sets: 2, reps: 10, repsMin: 10, prog: 'linear', weight: 24, inc: 2, eq: 'dumbbell', mode: 'reps', side: true },
      { id: '5', prog: 'linear' },
    )
    expect(p.kind).toBe('up')
    expect(p.weight).toBe(26)
  })
})

// ── fetchHistoryProfile ─────────────────────────────────────────────────────

describe('fetchHistoryProfile', () => {
  it('注入的请求替身：成功时返回档案', async () => {
    const calls: Array<{ url: string; method: string }> = []
    const S = await fetchHistoryProfile(
      async opts => { calls.push({ url: opts.url, method: opts.method }); return { statusCode: 200, data: { code: 200, data: sampleWindow } } },
      'https://example.com',
      90,
      { Authorization: 'Bearer t' },
    )
    expect(calls[0].url).toBe('https://example.com/api/workouts/history-window?days=90')
    expect(calls[0].method).toBe('GET')
    expect(S.workouts).toHaveLength(2)
  })

  it('业务码非 200 → 抛错', async () => {
    await expect(fetchHistoryProfile(
      async () => ({ statusCode: 200, data: { code: 500, message: 'boom' } }),
      'https://example.com',
    )).rejects.toThrow('boom')
  })
})
