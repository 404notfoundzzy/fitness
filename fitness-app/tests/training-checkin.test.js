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

function createErrorResponse(message) {
  return { statusCode: 200, data: { code: 400, message } }
}

function setupStoreData(store) {
  store.planDaysData[1] = {
    days: [{
      exercises: [
        { id: 10, exerciseName: '卧推', isCompleted: false },
        { id: 20, exerciseName: '深蹲', isCompleted: false },
      ],
      completedCount: 0,
      exerciseCount: 2,
      isDayComplete: false,
      dayName: '训练日1',
    }],
    summary: { totalExercises: 2, completedExercises: 0, progress: 0 },
  }
}

describe('toggleCheckIn 防抖与超时', () => {
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

  describe('场景1：正常请求', () => {
    it('打卡成功应返回 true 并更新本地状态', async () => {
      mockRequest.mockResolvedValue(createSuccessResponse({ recordId: 1 }))

      const store = useTrainingStore()
      setupStoreData(store)

      const result = await store.toggleCheckIn(1, 10, '卧推')

      expect(result).toBe(true)
      expect(store.exerciseProgress[1][10]).toBe(true)
      expect(store.planDaysData[1].days[0].exercises[0].isCompleted).toBe(true)
      expect(store.planDaysData[1].days[0].completedCount).toBe(1)
      expect(store.planDaysData[1].days[0].isDayComplete).toBe(false)
      expect(store.planDaysData[1].summary.completedExercises).toBe(1)
      expect(store.planDaysData[1].summary.progress).toBe(50)
    })

    it('取消打卡成功应返回 false 并更新本地状态', async () => {
      mockRequest.mockResolvedValue(createSuccessResponse({}))

      const store = useTrainingStore()
      setupStoreData(store)
      store.exerciseProgress[1] = { 10: true }
      store.planDaysData[1].days[0].exercises[0].isCompleted = true
      store.planDaysData[1].days[0].completedCount = 1
      store.planDaysData[1].summary.completedExercises = 1
      store.planDaysData[1].summary.progress = 50

      const result = await store.toggleCheckIn(1, 10, '卧推')

      expect(result).toBe(false)
      expect(store.exerciseProgress[1][10]).toBe(false)
      expect(store.planDaysData[1].days[0].exercises[0].isCompleted).toBe(false)
      expect(store.planDaysData[1].days[0].completedCount).toBe(0)
      expect(store.planDaysData[1].summary.progress).toBe(0)
    })

    it('请求完成后应设置 500ms 冷却期', async () => {
      mockRequest.mockResolvedValue(createSuccessResponse({ recordId: 1 }))

      const store = useTrainingStore()
      setupStoreData(store)

      await store.toggleCheckIn(1, 10, '卧推')

      expect(store.checkInCooldown['1_10']).toBe(true)

      const throttled = await store.toggleCheckIn(1, 10, '卧推')
      expect(throttled).toBe('throttled')

      vi.advanceTimersByTime(500)

      expect(store.checkInCooldown['1_10']).toBe(false)
    })
  })

  describe('场景2：请求超时（8秒）', () => {
    it('uni.request 超时后应返回 error 并释放请求锁', async () => {
      mockRequest.mockImplementation(({ timeout }) => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject({ errMsg: 'request:fail timeout' })
          }, timeout)
        })
      })

      const store = useTrainingStore()
      setupStoreData(store)

      const promise = store.toggleCheckIn(1, 10, '卧推')

      expect(store.checkInLoading['1_10']).toBe(true)

      vi.advanceTimersByTime(8000)

      try {
        await promise
      } catch (e) {
        // timeout error
      }

      expect(store.checkInLoading['1_10']).toBe(false)
    })
  })

  describe('场景3：Promise 卡死（15秒兜底定时器）', () => {
    it('Promise 永远不 settle 时，15秒兜底定时器应强制释放 checkInLoading', async () => {
      mockRequest.mockImplementation(() => {
        return new Promise(() => {})
      })

      const store = useTrainingStore()
      setupStoreData(store)

      store.toggleCheckIn(1, 10, '卧推')

      expect(store.checkInLoading['1_10']).toBe(true)

      vi.advanceTimersByTime(15000)

      expect(store.checkInLoading['1_10']).toBe(false)
      expect(store.checkInCooldown['1_10']).toBe(false)
    })

    it('Promise 正常完成后，兜底定时器应被清除不触发', async () => {
      mockRequest.mockResolvedValue(createSuccessResponse({ recordId: 1 }))

      const store = useTrainingStore()
      setupStoreData(store)

      await store.toggleCheckIn(1, 10, '卧推')

      expect(store.checkInLoading['1_10']).toBe(false)

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      vi.advanceTimersByTime(15000)

      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('防抖兜底')
      )
      warnSpy.mockRestore()
    })
  })

  describe('场景4：连续快速点击防抖', () => {
    it('请求进行中再次点击应返回 throttled', async () => {
      let resolveRequest = null
      mockRequest.mockImplementation(() => {
        return new Promise((resolve) => {
          resolveRequest = resolve
        })
      })

      const store = useTrainingStore()
      setupStoreData(store)

      store.toggleCheckIn(1, 10, '卧推')

      const secondResult = await store.toggleCheckIn(1, 10, '卧推')
      expect(secondResult).toBe('throttled')

      resolveRequest(createSuccessResponse({ recordId: 1 }))
      await vi.advanceTimersByTimeAsync(1000)
    })

    it('冷却期内再次点击应返回 throttled', async () => {
      mockRequest.mockResolvedValue(createSuccessResponse({ recordId: 1 }))

      const store = useTrainingStore()
      setupStoreData(store)

      await store.toggleCheckIn(1, 10, '卧推')

      expect(store.checkInCooldown['1_10']).toBe(true)

      const result = await store.toggleCheckIn(1, 10, '卧推')
      expect(result).toBe('throttled')

      vi.advanceTimersByTime(500)

      expect(store.checkInCooldown['1_10']).toBe(false)
    })

    it('不同动作之间互不影响', async () => {
      mockRequest.mockResolvedValue(createSuccessResponse({ recordId: 1 }))

      const store = useTrainingStore()
      setupStoreData(store)

      const result1 = await store.toggleCheckIn(1, 10, '卧推')
      expect(result1).toBe(true)

      const result2 = await store.toggleCheckIn(1, 20, '深蹲')
      expect(result2).toBe(true)

      expect(store.exerciseProgress[1][10]).toBe(true)
      expect(store.exerciseProgress[1][20]).toBe(true)
    })
  })

  describe('场景5：服务端返回错误', () => {
    it('服务端返回非200 code 应返回 error', async () => {
      mockRequest.mockResolvedValue(createErrorResponse('操作失败'))

      const store = useTrainingStore()
      setupStoreData(store)

      const result = await store.toggleCheckIn(1, 10, '卧推')
      expect(result).toBe('error')
      expect(store.exerciseProgress[1]?.[10]).toBeFalsy()
    })

    it('网络异常抛出错误应返回 error 并释放锁', async () => {
      mockRequest.mockRejectedValue(new Error('Network Error'))

      const store = useTrainingStore()
      setupStoreData(store)

      const result = await store.toggleCheckIn(1, 10, '卧推')
      expect(result).toBe('error')
      expect(store.checkInLoading['1_10']).toBe(false)
    })
  })
})
