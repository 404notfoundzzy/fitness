// 训练台草稿（A4.11）：保存 / 恢复 / 过期 / 损坏 的兜底行为
//
// 草稿是"杀进程重进还能继续练"的唯一保障，所以这里覆盖的是失败路径：
// 存储抛异常、JSON 损坏、形态不对、过期，都不能把训练台弄崩。

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTrainingStore, GUIDED_DRAFT_KEY, GUIDED_DRAFT_TTL } from '@/stores/training.js'

const storage = new Map()
const mockGet = vi.fn((key) => storage.get(key) ?? '')
const mockSet = vi.fn((key, value) => { storage.set(key, value) })
const mockRemove = vi.fn((key) => { storage.delete(key) })

global.uni = {
  getStorageSync: mockGet,
  setStorageSync: mockSet,
  removeStorageSync: mockRemove,
  request: vi.fn(),
}

const KEYS = 'guided-1'

function session(over = {}) {
  return {
    v: 1,
    planId: 5,
    planName: '推拉腿',
    dayNumber: 2,
    dayName: '推日',
    focus: '胸',
    startedAt: 1000,
    unit: 'kg',
    exercises: [{
      key: KEYS,
      planExerciseId: 11,
      exerciseId: 100,
      name: '杠铃卧推',
      targetSets: 3,
      targetReps: '8',
      repsMin: 8,
      repsMax: 8,
      restSeconds: 120,
      notes: '',
      perSide: false,
      equipment: 'barbell',
      bodyPart: 'chest',
      primaryMuscle: 'chest',
      policy: 'linear',
      params: {},
      prescription: { kind: 'up', policy: 'linear', weight: 102.5, reps: 8, sets: null, title: '建议', detail: '' },
      last: { weight: 100, reps: 8, sets: 3 },
      rows: [{
        key: 'row-1',
        setNumber: 1,
        type: 'normal',
        weight: 102.5,
        reps: 8,
        rir: null,
        done: true,
        sides: null,
        isPr: false,
        prTypes: [],
        prefilled: true,
      }],
      ...over,
    }],
  }
}

describe('训练台草稿', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    storage.clear()
    mockGet.mockClear()
    mockSet.mockClear()
    mockRemove.mockClear()
  })

  it('保存后可原样读回（含已完成组）', () => {
    const store = useTrainingStore()
    const s = session()
    store.setGuidedSession(s)
    expect(store.saveGuidedDraft()).toBe(true)

    const restored = store.loadGuidedDraft()
    expect(restored.session.planName).toBe('推拉腿')
    expect(restored.session.exercises[0].rows[0]).toMatchObject({
      weight: 102.5,
      reps: 8,
      done: true,
    })
    expect(storage.get(GUIDED_DRAFT_KEY)).toBeTruthy()
  })

  it('未设置会话时不写草稿', () => {
    const store = useTrainingStore()
    expect(store.saveGuidedDraft()).toBe(false)
    expect(mockSet).not.toHaveBeenCalled()
  })

  it('无草稿 / 空字符串 → null', () => {
    const store = useTrainingStore()
    expect(store.loadGuidedDraft()).toBeNull()
  })

  it('JSON 损坏 → 返回 null 并清掉坏数据', () => {
    storage.set(GUIDED_DRAFT_KEY, '{not json')
    const store = useTrainingStore()
    expect(store.loadGuidedDraft()).toBeNull()
    expect(mockRemove).toHaveBeenCalledWith(GUIDED_DRAFT_KEY)
  })

  it('形态不对（缺 exercises）→ 返回 null', () => {
    storage.set(GUIDED_DRAFT_KEY, JSON.stringify({ v: 1, savedAt: Date.now(), session: { planName: 'x' } }))
    const store = useTrainingStore()
    expect(store.loadGuidedDraft()).toBeNull()
  })

  it('过期的草稿被丢弃（默认 24 小时）', () => {
    const store = useTrainingStore()
    store.setGuidedSession(session())
    store.saveGuidedDraft()
    expect(store.loadGuidedDraft(Date.now() + GUIDED_DRAFT_TTL + 1000)).toBeNull()
    expect(mockRemove).toHaveBeenCalled()
  })

  it('未过期（23 小时）仍可恢复', () => {
    const store = useTrainingStore()
    store.setGuidedSession(session())
    store.saveGuidedDraft()
    const restored = store.loadGuidedDraft(Date.now() + GUIDED_DRAFT_TTL - 60 * 60 * 1000)
    expect(restored).not.toBeNull()
  })

  it('存储写入抛异常 → 返回 false 但不抛出（不能弄崩训练）', () => {
    mockSet.mockImplementationOnce(() => { throw new Error('quota exceeded') })
    const store = useTrainingStore()
    store.setGuidedSession(session())
    expect(store.saveGuidedDraft()).toBe(false)
  })

  it('清除草稿：存储与内存态都清空', () => {
    const store = useTrainingStore()
    store.setGuidedSession(session())
    store.saveGuidedDraft()
    store.clearGuidedDraft()
    expect(store.guidedDraft).toBeNull()
    expect(storage.has(GUIDED_DRAFT_KEY)).toBe(false)
    // 进行中的会话不受影响（草稿与内存态分离）
    expect(store.guidedSession).not.toBeNull()
  })

  it('结束训练：会话与草稿一起清空', () => {
    const store = useTrainingStore()
    store.setGuidedSession(session())
    store.saveGuidedDraft()
    store.resetGuidedSession()
    expect(store.guidedSession).toBeNull()
    expect(store.guidedDraft).toBeNull()
    expect(storage.has(GUIDED_DRAFT_KEY)).toBe(false)
  })

  it('updateGuidedSession 覆盖内存态，后续草稿取新值', () => {
    const store = useTrainingStore()
    store.setGuidedSession(session())
    const next = session()
    next.exercises[0].rows[0].weight = 110
    store.updateGuidedSession(next)
    store.saveGuidedDraft()
    expect(JSON.parse(storage.get(GUIDED_DRAFT_KEY)).session.exercises[0].rows[0].weight).toBe(110)
  })
})
