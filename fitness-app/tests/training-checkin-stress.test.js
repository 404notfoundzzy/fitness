import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTrainingStore } from '@/stores/training.js'

const mockRequest = vi.fn()
const mockGetStorageSync = vi.fn()

global.uni = {
  request: mockRequest,
  getStorageSync: mockGetStorageSync,
}

function createSuccessResponse(data) {
  return { statusCode: 200, data: { code: 200, data, message: '操作成功' } }
}

function setupMultiExerciseStore(store, exerciseCount = 5) {
  const exercises = []
  for (let i = 1; i <= exerciseCount; i++) {
    exercises.push({ id: i * 10, exerciseName: `动作${i}`, isCompleted: false })
  }
  store.planDaysData[1] = {
    days: [{
      exercises,
      completedCount: 0,
      exerciseCount,
      isDayComplete: false,
      dayName: '训练日1',
    }],
    summary: { totalExercises: exerciseCount, completedExercises: 0, progress: 0 },
  }
}

describe('toggleCheckIn 高并发压力测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    mockRequest.mockReset()
    mockGetStorageSync.mockReset()
    mockGetStorageSync.mockReturnValue('mock-jwt-token-1')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('压力测试1：同一动作快速连续点击', () => {
    it('50ms 间隔连续点击 10 次，只应发出 1 次请求', async () => {
      let requestCount = 0
      let resolveRequest = null
      mockRequest.mockImplementation(() => {
        requestCount++
        return new Promise((resolve) => {
          resolveRequest = resolve
        })
      })

      const store = useTrainingStore()
      setupMultiExerciseStore(store, 1)

      const results = []
      for (let i = 0; i < 10; i++) {
        results.push(store.toggleCheckIn(1, 10, '动作1'))
      }

      expect(requestCount).toBe(1)

      resolveRequest(createSuccessResponse({ recordId: 1 }))

      const settled = await Promise.allSettled(results)
      const throttledCount = settled.filter(
        r => r.status === 'fulfilled' && r.value === 'throttled'
      ).length
      expect(throttledCount).toBe(9)

      await vi.advanceTimersByTimeAsync(1000)
    })

    it('100ms 间隔连续点击 20 次，请求次数不超过 2 次', async () => {
      let requestCount = 0
      let resolveRequest = null
      mockRequest.mockImplementation(() => {
        requestCount++
        return new Promise((resolve) => {
          resolveRequest = resolve
        })
      })

      const store = useTrainingStore()
      setupMultiExerciseStore(store, 1)

      const results = []
      for (let i = 0; i < 20; i++) {
        results.push(store.toggleCheckIn(1, 10, '动作1'))
        vi.advanceTimersByTime(100)
      }

      expect(requestCount).toBeLessThanOrEqual(2)

      resolveRequest(createSuccessResponse({ recordId: 1 }))
      await vi.advanceTimersByTimeAsync(1000)
    })
  })

  describe('压力测试2：多动作并发打卡', () => {
    it('5 个不同动作同时打卡，每个都应成功', async () => {
      const requestOrder = []
      mockRequest.mockImplementation(({ url }) => {
        const exerciseId = url.match(/exercises\/(\d+)/)?.[1]
        requestOrder.push(exerciseId)
        return Promise.resolve(createSuccessResponse({ recordId: 1 }))
      })

      const store = useTrainingStore()
      setupMultiExerciseStore(store, 5)

      const results = await Promise.all([
        store.toggleCheckIn(1, 10, '动作1'),
        store.toggleCheckIn(1, 20, '动作2'),
        store.toggleCheckIn(1, 30, '动作3'),
        store.toggleCheckIn(1, 40, '动作4'),
        store.toggleCheckIn(1, 50, '动作5'),
      ])

      expect(results.every(r => r === true)).toBe(true)
      expect(requestOrder).toHaveLength(5)
      expect(store.planDaysData[1].summary.completedExercises).toBe(5)
      expect(store.planDaysData[1].summary.progress).toBe(100)
    })

    it('10 个动作并发打卡 + 每个动作同时被点击 3 次', async () => {
      let requestCount = 0
      mockRequest.mockImplementation(() => {
        requestCount++
        return Promise.resolve(createSuccessResponse({ recordId: 1 }))
      })

      const store = useTrainingStore()
      setupMultiExerciseStore(store, 10)

      const allPromises = []
      for (let i = 1; i <= 10; i++) {
        const exerciseId = i * 10
        for (let j = 0; j < 3; j++) {
          allPromises.push(store.toggleCheckIn(1, exerciseId, `动作${i}`))
        }
      }

      await Promise.allSettled(allPromises)

      expect(requestCount).toBe(10)

      let completedCount = 0
      for (let i = 1; i <= 10; i++) {
        if (store.exerciseProgress[1]?.[i * 10]) completedCount++
      }
      expect(completedCount).toBe(10)
    })
  })

  describe('压力测试3：打卡→取消→打卡 快速交替', () => {
    it('快速交替操作时，冷却期应阻止反向操作', async () => {
      mockRequest.mockResolvedValue(createSuccessResponse({ recordId: 1 }))

      const store = useTrainingStore()
      setupMultiExerciseStore(store, 1)

      const result1 = await store.toggleCheckIn(1, 10, '动作1')
      expect(result1).toBe(true)

      const result2 = await store.toggleCheckIn(1, 10, '动作1')
      expect(result2).toBe('throttled')

      vi.advanceTimersByTime(500)

      const result3 = await store.toggleCheckIn(1, 10, '动作1')
      expect(result3).toBe(false)

      const result4 = await store.toggleCheckIn(1, 10, '动作1')
      expect(result4).toBe('throttled')

      vi.advanceTimersByTime(500)

      const result5 = await store.toggleCheckIn(1, 10, '动作1')
      expect(result5).toBe(true)
    })
  })

  describe('压力测试4：网络延迟下的并发', () => {
    it('5 个动作各有 2 秒延迟，并发打卡应全部成功', async () => {
      mockRequest.mockImplementation(({ url }) => {
        const exerciseId = url.match(/exercises\/(\d+)/)?.[1]
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(createSuccessResponse({ recordId: exerciseId }))
          }, 2000)
        })
      })

      const store = useTrainingStore()
      setupMultiExerciseStore(store, 5)

      const promises = [
        store.toggleCheckIn(1, 10, '动作1'),
        store.toggleCheckIn(1, 20, '动作2'),
        store.toggleCheckIn(1, 30, '动作3'),
        store.toggleCheckIn(1, 40, '动作4'),
        store.toggleCheckIn(1, 50, '动作5'),
      ]

      vi.advanceTimersByTime(2000)

      const results = await Promise.all(promises)
      expect(results.every(r => r === true)).toBe(true)
      expect(store.planDaysData[1].summary.progress).toBe(100)
    })

    it('部分请求成功部分失败时，状态应正确', async () => {
      mockRequest.mockImplementation(({ url }) => {
        const exerciseId = parseInt(url.match(/exercises\/(\d+)/)?.[1])
        if (exerciseId === 30) {
          return Promise.resolve(createErrorResponse('服务端错误'))
        }
        return Promise.resolve(createSuccessResponse({ recordId: 1 }))
      })

      const store = useTrainingStore()
      setupMultiExerciseStore(store, 5)

      const results = await Promise.all([
        store.toggleCheckIn(1, 10, '动作1'),
        store.toggleCheckIn(1, 20, '动作2'),
        store.toggleCheckIn(1, 30, '动作3'),
        store.toggleCheckIn(1, 40, '动作4'),
        store.toggleCheckIn(1, 50, '动作5'),
      ])

      expect(results[0]).toBe(true)
      expect(results[1]).toBe(true)
      expect(results[2]).toBe('error')
      expect(results[3]).toBe(true)
      expect(results[4]).toBe(true)

      expect(store.exerciseProgress[1][10]).toBe(true)
      expect(store.exerciseProgress[1][30]).toBeFalsy()
      expect(store.planDaysData[1].summary.completedExercises).toBe(4)
    })
  })

  describe('压力测试5：极端场景', () => {
    it('Promise 卡死 + 其他动作正常打卡应互不影响', async () => {
      mockRequest.mockImplementation(({ url }) => {
        const exerciseId = parseInt(url.match(/exercises\/(\d+)/)?.[1])
        if (exerciseId === 10) {
          return new Promise(() => {})
        }
        return Promise.resolve(createSuccessResponse({ recordId: 1 }))
      })

      const store = useTrainingStore()
      setupMultiExerciseStore(store, 5)

      store.toggleCheckIn(1, 10, '动作1')

      const results = await Promise.all([
        store.toggleCheckIn(1, 20, '动作2'),
        store.toggleCheckIn(1, 30, '动作3'),
        store.toggleCheckIn(1, 40, '动作4'),
        store.toggleCheckIn(1, 50, '动作5'),
      ])

      expect(results.every(r => r === true)).toBe(true)
      expect(store.checkInLoading['1_10']).toBe(true)

      vi.advanceTimersByTime(15000)

      expect(store.checkInLoading['1_10']).toBe(false)
    })

    it('所有请求都卡死时，15秒兜底应释放所有锁', async () => {
      mockRequest.mockImplementation(() => new Promise(() => {}))

      const store = useTrainingStore()
      setupMultiExerciseStore(store, 5)

      for (let i = 1; i <= 5; i++) {
        store.toggleCheckIn(1, i * 10, `动作${i}`)
      }

      for (let i = 1; i <= 5; i++) {
        expect(store.checkInLoading[`1_${i * 10}`]).toBe(true)
      }

      vi.advanceTimersByTime(15000)

      for (let i = 1; i <= 5; i++) {
        expect(store.checkInLoading[`1_${i * 10}`]).toBe(false)
        expect(store.checkInCooldown[`1_${i * 10}`]).toBe(false)
      }
    })

    it('连续 100 次快速点击同一动作，请求次数不超过 1', async () => {
      let requestCount = 0
      let resolveRequest = null
      mockRequest.mockImplementation(() => {
        requestCount++
        return new Promise((resolve) => {
          resolveRequest = resolve
        })
      })

      const store = useTrainingStore()
      setupMultiExerciseStore(store, 1)

      for (let i = 0; i < 100; i++) {
        store.toggleCheckIn(1, 10, '动作1')
      }

      expect(requestCount).toBe(1)

      resolveRequest(createSuccessResponse({ recordId: 1 }))
      await vi.advanceTimersByTimeAsync(1000)
    })
  })
})

function createErrorResponse(message) {
  return { statusCode: 200, data: { code: 400, message } }
}
