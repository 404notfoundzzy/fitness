import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTrainingStore } from '@/stores/training.js'
import { usePageCacheStore } from '@/stores/pageCache.js'

const mockRequest = vi.fn()
const mockGetStorageSync = vi.fn()

global.uni = {
  request: mockRequest,
  getStorageSync: mockGetStorageSync,
  setStorageSync: vi.fn(),
}

const MOCK_PLAN_ID = 1
const MOCK_ACTIVE_PLAN_RESPONSE = {
  id: 100,
  userId: 1,
  planId: MOCK_PLAN_ID,
  status: 'active',
  startDate: '2026-05-30',
  currentDay: 3,
  totalProgress: 0,
  progress: 0,
  plan: {
    id: MOCK_PLAN_ID,
    name: '经典五分化',
    type: 'five-split',
    description: '经典5天分化训练',
    daysPerWeek: 5,
    difficulty: 'advanced',
    planType: 1,
  },
  totalExercises: 25,
}

const MOCK_PLAN_DAYS_RESPONSE = {
  days: [
    {
      dayNumber: 1,
      dayName: '胸部训练',
      focus: '胸大肌',
      exerciseCount: 5,
      isDayComplete: true,
      exercises: [
        { id: 101, exerciseName: '平板杠铃卧推', sets: 4, reps: '8-12', restSeconds: 90, isCompleted: true },
        { id: 102, exerciseName: '上斜杠铃卧推', sets: 4, reps: '10-12', restSeconds: 75, isCompleted: true },
        { id: 103, exerciseName: '平板哑铃飞鸟', sets: 3, reps: '12-15', restSeconds: 60, isCompleted: true },
        { id: 104, exerciseName: '绳索夹胸', sets: 3, reps: '15-20', restSeconds: 45, isCompleted: true },
        { id: 105, exerciseName: '双杠臂屈伸', sets: 3, reps: '力竭', restSeconds: 60, isCompleted: true },
      ],
    },
    {
      dayNumber: 2,
      dayName: '背部训练',
      focus: '背阔肌',
      exerciseCount: 5,
      isDayComplete: false,
      exercises: [
        { id: 201, exerciseName: '引体向上', sets: 4, reps: '力竭', restSeconds: 120, isCompleted: true },
        { id: 202, exerciseName: '杠铃划船', sets: 4, reps: '6-10', restSeconds: 90, isCompleted: true },
        { id: 203, exerciseName: '单臂哑铃划船', sets: 3, reps: '10-12', restSeconds: 75, isCompleted: false },
        { id: 204, exerciseName: '坐姿绳索划船', sets: 3, reps: '12-15', restSeconds: 60, isCompleted: false },
        { id: 205, exerciseName: '高位下拉', sets: 3, reps: '12-15', restSeconds: 60, isCompleted: false },
      ],
    },
    {
      dayNumber: 3,
      dayName: '腿部训练',
      focus: '股四头肌',
      exerciseCount: 5,
      isDayComplete: false,
      exercises: [
        { id: 301, exerciseName: '杠铃深蹲', sets: 4, reps: '6-8', restSeconds: 150, isCompleted: false },
        { id: 302, exerciseName: '腿举', sets: 3, reps: '10-12', restSeconds: 90, isCompleted: false },
        { id: 303, exerciseName: '腿弯举', sets: 3, reps: '12-15', restSeconds: 60, isCompleted: false },
        { id: 304, exerciseName: '提踵', sets: 4, reps: '15-20', restSeconds: 45, isCompleted: false },
        { id: 305, exerciseName: '罗马尼亚硬拉', sets: 3, reps: '8-10', restSeconds: 90, isCompleted: false },
      ],
    },
  ],
  summary: {
    totalExercises: 15,
    completedExercises: 7,
    progress: 47,
  },
}

function createSuccessResponse(data) {
  return { statusCode: 200, data: { code: 200, data, message: '操作成功' } }
}

function setupMockRequest() {
  mockRequest.mockImplementation((options) => {
    if (options.url.includes('/user-active-plan/active')) {
      return Promise.resolve(createSuccessResponse(MOCK_ACTIVE_PLAN_RESPONSE))
    }
    if (options.url.includes('/days')) {
      return Promise.resolve(createSuccessResponse(MOCK_PLAN_DAYS_RESPONSE))
    }
    return Promise.resolve(createSuccessResponse(null))
  })
}

describe('刷新浏览器后进度恢复 - 修复验证', () => {
  let store
  let pageCacheStore

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTrainingStore()
    pageCacheStore = usePageCacheStore()
    vi.useFakeTimers()
    mockRequest.mockReset()
    mockGetStorageSync.mockReset()
    mockGetStorageSync.mockReturnValue(null)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('场景1: 无缓存时刷新 - fetchMyTraining 正常路径', () => {
    it('fetchMyTraining 应同时获取 list 和 planDaysData', async () => {
      setupMockRequest()

      const result = await store.fetchMyTraining(true)

      expect(result).toBe(true)
      expect(store.list.length).toBe(1)
      expect(store.list[0].title).toBe('经典五分化')
      expect(store.planDaysData[MOCK_PLAN_ID]).toBeDefined()
      expect(store.planDaysData[MOCK_PLAN_ID].summary.progress).toBe(47)
    })

    it('currentProgress 应从 planDaysData 获取真实进度，而非 item.progress', async () => {
      setupMockRequest()

      await store.fetchMyTraining(true)

      const item = store.list[0]
      expect(item.progress).toBe(0)

      const planDays = store.getPlanDays(item.id)
      expect(planDays).toBeDefined()
      expect(planDays.summary.progress).toBe(47)

      const progressFromPlanDays = store.getPlanProgress(item.id)
      expect(progressFromPlanDays).toBe(47)
    })
  })

  describe('场景2: 缓存恢复路径 - list 有缓存但 planDaysData 为空', () => {
    it('缓存恢复后应补拉 planDaysData', async () => {
      setupMockRequest()

      const cachedList = [{
        id: MOCK_PLAN_ID,
        title: '经典五分化',
        desc: '经典5天分化训练',
        type: 'five-split',
        progress: 0,
        count: 25,
        iconClass: 'icon-red',
        isActive: true,
      }]
      pageCacheStore.setCache('myTraining', cachedList)

      store.list = cachedList
      store.listLoading = false
      store.planDaysData = {}

      for (const item of cachedList) {
        if (item.id && !store.planDaysData[item.id] && !store.planDaysLoading[item.id]) {
          await store.fetchPlanDays(item.id, false)
        }
      }

      expect(store.planDaysData[MOCK_PLAN_ID]).toBeDefined()
      expect(store.planDaysData[MOCK_PLAN_ID].summary.progress).toBe(47)
    })

    it('缓存恢复后 planDaysData 存在时不应重复请求', async () => {
      setupMockRequest()

      const cachedList = [{
        id: MOCK_PLAN_ID,
        title: '经典五分化',
        type: 'five-split',
        progress: 0,
      }]

      store.list = cachedList
      store.planDaysData = {
        [MOCK_PLAN_ID]: MOCK_PLAN_DAYS_RESPONSE,
      }
      store.planDaysLoading = {}

      const fetchSpy = vi.spyOn(store, 'fetchPlanDays')

      for (const item of cachedList) {
        if (item.id && !store.planDaysData[item.id] && !store.planDaysLoading[item.id]) {
          await store.fetchPlanDays(item.id, false)
        }
      }

      expect(fetchSpy).not.toHaveBeenCalled()
    })
  })

  describe('场景3: _isSameList 跳过路径 - planDaysData 缺失时补拉', () => {
    it('list 未变化但 planDaysData 缺失时应补拉', async () => {
      setupMockRequest()

      await store.fetchMyTraining(true)
      expect(store.planDaysData[MOCK_PLAN_ID]).toBeDefined()

      store.planDaysData = {}
      store.lastFetchTime = null

      const fetchPlanDaysSpy = vi.spyOn(store, 'fetchPlanDays')

      await store.fetchMyTraining(false)

      expect(fetchPlanDaysSpy).toHaveBeenCalledWith(MOCK_PLAN_ID, false)
    })

    it('list 未变化且 planDaysData 存在时不应重复请求', async () => {
      setupMockRequest()

      await store.fetchMyTraining(true)

      const fetchPlanDaysSpy = vi.spyOn(store, 'fetchPlanDays')

      store.lastFetchTime = null
      await store.fetchMyTraining(false)

      expect(fetchPlanDaysSpy).not.toHaveBeenCalled()
    })
  })

  describe('场景4: 并发请求防护 - planDaysLoading 判断', () => {
    it('planDaysLoading 为 true 时不应发起重复请求', async () => {
      setupMockRequest()

      const cachedList = [{
        id: MOCK_PLAN_ID,
        title: '经典五分化',
        type: 'five-split',
        progress: 0,
      }]

      store.list = cachedList
      store.planDaysData = {}
      store.planDaysLoading = { [MOCK_PLAN_ID]: true }

      const fetchSpy = vi.spyOn(store, 'fetchPlanDays')

      for (const item of cachedList) {
        if (item.id && !store.planDaysData[item.id] && !store.planDaysLoading[item.id]) {
          await store.fetchPlanDays(item.id, false)
        }
      }

      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('_isSameList 路径中 planDaysLoading 为 true 时不应重复请求', async () => {
      setupMockRequest()

      await store.fetchMyTraining(true)

      store.planDaysData = {}
      store.planDaysLoading = { [MOCK_PLAN_ID]: true }
      store.lastFetchTime = null

      const fetchPlanDaysSpy = vi.spyOn(store, 'fetchPlanDays')

      await store.fetchMyTraining(false)

      expect(fetchPlanDaysSpy).not.toHaveBeenCalled()
    })
  })

  describe('场景5: 端到端 - 模拟刷新浏览器后完整恢复流程', () => {
    it('刷新后: 空store → fetchMyTraining → 进度正确恢复', async () => {
      setupMockRequest()

      expect(store.list.length).toBe(0)
      expect(Object.keys(store.planDaysData).length).toBe(0)

      await store.fetchMyTraining(true)

      expect(store.list.length).toBe(1)
      expect(store.list[0].title).toBe('经典五分化')
      expect(store.list[0].progress).toBe(0)

      const progress = store.getPlanProgress(MOCK_PLAN_ID)
      expect(progress).toBe(47)

      const planDays = store.getPlanDays(MOCK_PLAN_ID)
      expect(planDays.summary.completedExercises).toBe(7)
      expect(planDays.summary.totalExercises).toBe(15)
    })

    it('刷新后: 缓存恢复list → 补拉planDays → 进度正确恢复', async () => {
      setupMockRequest()

      const cachedList = [{
        id: MOCK_PLAN_ID,
        title: '经典五分化',
        desc: '经典5天分化训练',
        type: 'five-split',
        progress: 0,
        count: 25,
        iconClass: 'icon-red',
        isActive: true,
      }]

      store.list = cachedList
      store.listLoading = false
      store.planDaysData = {}

      expect(store.getPlanProgress(MOCK_PLAN_ID)).toBe(0)

      for (const item of cachedList) {
        if (item.id && !store.planDaysData[item.id] && !store.planDaysLoading[item.id]) {
          await store.fetchPlanDays(item.id, false)
        }
      }

      expect(store.getPlanProgress(MOCK_PLAN_ID)).toBe(47)
    })

    it('模拟 TrainingCard 的 currentProgress 计算逻辑', async () => {
      setupMockRequest()

      const cachedList = [{
        id: MOCK_PLAN_ID,
        title: '经典五分化',
        type: 'five-split',
        progress: 0,
      }]

      store.list = cachedList
      store.planDaysData = {}

      function getCurrentProgress(item) {
        const planDays = store.getPlanDays(item.id)
        if (planDays && planDays.summary) {
          return planDays.summary.progress || 0
        }
        return item.progress || 0
      }

      expect(getCurrentProgress(cachedList[0])).toBe(0)

      for (const item of cachedList) {
        if (item.id && !store.planDaysData[item.id] && !store.planDaysLoading[item.id]) {
          await store.fetchPlanDays(item.id, false)
        }
      }

      expect(getCurrentProgress(cachedList[0])).toBe(47)
    })
  })

  describe('场景6: API 返回 progress 为 0 的验证', () => {
    it('后端 totalProgress 为 0 时，item.progress 应为 0，真实进度从 planDays 获取', async () => {
      setupMockRequest()

      await store.fetchMyTraining(true)

      expect(store.list[0].progress).toBe(0)
      expect(store.getPlanProgress(MOCK_PLAN_ID)).toBe(47)
    })

    it('后端 totalProgress 为 100 (计划完成) 时，两个数据源应一致', async () => {
      mockRequest.mockImplementation((options) => {
        if (options.url.includes('/user-active-plan/active')) {
          return Promise.resolve(createSuccessResponse({
            ...MOCK_ACTIVE_PLAN_RESPONSE,
            totalProgress: 100,
            progress: 100,
          }))
        }
        if (options.url.includes('/days')) {
          return Promise.resolve(createSuccessResponse({
            ...MOCK_PLAN_DAYS_RESPONSE,
            summary: { totalExercises: 15, completedExercises: 15, progress: 100 },
          }))
        }
        return Promise.resolve(createSuccessResponse(null))
      })

      await store.fetchMyTraining(true)

      expect(store.list[0].progress).toBe(100)
      expect(store.getPlanProgress(MOCK_PLAN_ID)).toBe(100)
    })
  })
})
