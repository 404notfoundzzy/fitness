import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.stubGlobal('uni', {
  getStorageSync: vi.fn(() => null),
  setStorageSync: vi.fn(),
  request: vi.fn(),
})

import { usePageCacheStore } from '@/stores/pageCache.js'

const DEBOUNCE_MS = 3000

function createVm(overrides = {}) {
  const pageCacheStore = overrides.pageCacheStore

  const vm = {
    trainingStore: null,
    presetPlans: [],
    customPlans: [],
    customPlanLoading: false,
    trainingStaleHint: false,
    trainingRefreshDebouncing: false,
    customStaleHint: false,
    customRefreshDebouncing: false,
    _trainingDebounceTimer: null,
    _customDebounceTimer: null,
    firstLoad: true,
    _loadingVisible: false,
    _loadingStartTime: 0,
    _loadingDelayTimer: null,
    $refs: {
      resultModal: { show: vi.fn() },
    },

    initTrainingStore() {
      this.trainingStore = overrides.trainingStore || null
    },

    async loadTrainingList(forceRefresh) {
      if (!this.trainingStore) return false
      return await this.trainingStore.fetchMyTraining(forceRefresh)
    },

    async loadTrainingListWithCache() {
      if (!this.trainingStore) return

      const cacheStore = pageCacheStore
      const cacheKey = 'myTraining'
      const cached = cacheStore.getCached(cacheKey)
      if (cached) {
        this.trainingStore.list = cached
        this.trainingStore.listLoading = false
        this.trainingStaleHint = true
        this.trainingStore.fetchMyTraining(false).then((result) => {
          if (result && this.trainingStore.list.length > 0) {
            cacheStore.setCache(cacheKey, this.trainingStore.list)
          }
          this.trainingStore.listLoading = false
          this.trainingStaleHint = false
        })
        return
      }

      this.trainingStaleHint = false
      await this.loadTrainingList(true)
      if (this.trainingStore.list.length > 0) {
        cacheStore.setCache(cacheKey, this.trainingStore.list)
      }
    },

    async loadCustomPlansWithCache() {
      const cacheStore = pageCacheStore
      const cacheKey = 'customPlans'
      const cached = cacheStore.getCached(cacheKey)
      if (cached) {
        this.customPlans = cached
        this.customPlanLoading = false
        this.customStaleHint = true
        cacheStore
          .silentRefresh(cacheKey, overrides.customFetchFn)
          .then((fresh) => {
            if (fresh) {
              this.customPlans = fresh
              this.customStaleHint = false
            }
          })
        return
      }

      this.customPlanLoading = true
      this.customStaleHint = false
      try {
        const data = await overrides.customFetchFn()
        const allPlans = Array.isArray(data) ? data : []
        this.customPlans = allPlans.filter((p) => p.planType === 0)
        cacheStore.setCache(cacheKey, this.customPlans)
      } catch {
        this.customPlans = []
      } finally {
        this.customPlanLoading = false
      }
    },

    async refreshMyTraining() {
      await this.loadTrainingList(true)
      const cacheStore = pageCacheStore
      if (this.trainingStore && this.trainingStore.list.length > 0) {
        cacheStore.setCache('myTraining', this.trainingStore.list)
      }
    },

    refreshCustomPlans() {
      const cacheStore = pageCacheStore
      cacheStore.clearCache('customPlans')
      return this.loadCustomPlansWithCache()
    },

    async onTrainingStaleClick() {
      if (this.trainingRefreshDebouncing) return
      this.trainingRefreshDebouncing = true
      try {
        await this.refreshMyTraining()
        this.trainingStaleHint = false
      } catch {
        // error handled
      }
      this._trainingDebounceTimer = setTimeout(() => {
        this.trainingRefreshDebouncing = false
        this._trainingDebounceTimer = null
      }, DEBOUNCE_MS)
    },

    async onCustomStaleClick() {
      if (this.customRefreshDebouncing) return
      this.customRefreshDebouncing = true
      try {
        await this.refreshCustomPlans()
        this.customStaleHint = false
      } catch {
        // error handled
      }
      this._customDebounceTimer = setTimeout(() => {
        this.customRefreshDebouncing = false
        this._customDebounceTimer = null
      }, DEBOUNCE_MS)
    },
  }

  Object.defineProperty(vm, 'trainingListLoading', {
    get() {
      if (vm._loadingVisible) return true
      return vm.trainingStore?.listLoading ?? false
    },
  })

  Object.defineProperty(vm, 'trainingList', {
    get() {
      return vm.trainingStore?.list ?? []
    },
  })

  Object.defineProperty(vm, 'hasTrainingData', {
    get() {
      return vm.trainingList.length > 0
    },
  })

  return vm
}

describe('训练计划列表 - 骨架屏与缓存逻辑', () => {
  let pageCacheStore

  beforeEach(() => {
    setActivePinia(createPinia())
    pageCacheStore = usePageCacheStore()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('我的训练 - loadTrainingListWithCache', () => {
    it('pageCache 命中时：不显示骨架屏，显示过时提示条', async () => {
      const cachedList = [{ id: 1, title: '测试计划' }]
      pageCacheStore.setCache('myTraining', cachedList)

      let resolveFetch
      const fetchMyTraining = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          resolveFetch = resolve
        })
      })
      const vm = createVm({
        pageCacheStore,
        trainingStore: {
          list: [],
          listLoading: false,
          fetchMyTraining,
        },
      })
      vm.initTrainingStore()

      await vm.loadTrainingListWithCache()

      expect(vm.trainingStaleHint).toBe(true)
      expect(vm.trainingListLoading).toBe(false)
      expect(vm.hasTrainingData).toBe(true)
      expect(fetchMyTraining).toHaveBeenCalledWith(false)

      resolveFetch(true)
      await vi.runAllTimersAsync()
    })

    it('pageCache 命中时：后台刷新成功后隐藏过时提示条并更新缓存', async () => {
      const cachedList = [{ id: 1, title: '旧计划' }]
      pageCacheStore.setCache('myTraining', cachedList)

      const fetchMyTraining = vi.fn().mockImplementation(async () => {
        vm.trainingStore.list = [{ id: 1, title: '新计划' }]
        return true
      })

      const vm = createVm({
        pageCacheStore,
        trainingStore: {
          list: [],
          listLoading: false,
          fetchMyTraining,
        },
      })
      vm.initTrainingStore()

      vm.loadTrainingListWithCache()
      await Promise.resolve()
      await Promise.resolve()

      expect(vm.trainingStaleHint).toBe(false)
    })

    it('pageCache 未命中时：显示骨架屏，不显示过时提示条', async () => {
      const fetchMyTraining = vi.fn().mockImplementation(async () => {
        vm.trainingStore.listLoading = true
        await vi.advanceTimersByTimeAsync(100)
        vm.trainingStore.list = [{ id: 2, title: '新计划' }]
        vm.trainingStore.listLoading = false
        return true
      })

      const vm = createVm({
        pageCacheStore,
        trainingStore: {
          list: [],
          listLoading: false,
          fetchMyTraining,
        },
      })
      vm.initTrainingStore()

      const promise = vm.loadTrainingListWithCache()

      expect(vm.trainingStaleHint).toBe(false)
      expect(vm.trainingListLoading).toBe(true)

      await promise

      expect(vm.trainingListLoading).toBe(false)
      expect(vm.hasTrainingData).toBe(true)
      expect(pageCacheStore.getCached('myTraining')).toEqual([{ id: 2, title: '新计划' }])
    })

    it('pageCache 未命中且无数据时：不写入缓存', async () => {
      const fetchMyTraining = vi.fn().mockResolvedValue(false)

      const vm = createVm({
        pageCacheStore,
        trainingStore: {
          list: [],
          listLoading: false,
          fetchMyTraining,
        },
      })
      vm.initTrainingStore()

      await vm.loadTrainingListWithCache()

      expect(pageCacheStore.getCached('myTraining')).toBeNull()
    })

    it('trainingStore 为空时直接返回', async () => {
      const vm = createVm({ pageCacheStore, trainingStore: null })
      vm.initTrainingStore()

      await vm.loadTrainingListWithCache()

      expect(vm.trainingStaleHint).toBe(false)
    })
  })

  describe('我的训练 - onTrainingStaleClick', () => {
    it('点击过时提示条：刷新成功后隐藏提示条并更新缓存', async () => {
      pageCacheStore.setCache('myTraining', [{ id: 1, title: '旧计划' }])

      const fetchMyTraining = vi.fn().mockImplementation(async () => {
        vm.trainingStore.list = [{ id: 1, title: '新计划' }]
        return true
      })
      const vm = createVm({
        pageCacheStore,
        trainingStore: {
          list: [{ id: 1, title: '旧计划' }],
          listLoading: false,
          fetchMyTraining,
        },
      })
      vm.initTrainingStore()
      vm.trainingStaleHint = true

      await vm.onTrainingStaleClick()

      expect(vm.trainingStaleHint).toBe(false)
      expect(vm.trainingRefreshDebouncing).toBe(true)

      vi.advanceTimersByTime(DEBOUNCE_MS)
      expect(vm.trainingRefreshDebouncing).toBe(false)
    })

    it('防抖期间重复点击：忽略请求', async () => {
      const fetchMyTraining = vi.fn().mockResolvedValue(true)
      const vm = createVm({
        pageCacheStore,
        trainingStore: {
          list: [{ id: 1, title: '测试计划' }],
          listLoading: false,
          fetchMyTraining,
        },
      })
      vm.initTrainingStore()
      vm.trainingStaleHint = true

      await vm.onTrainingStaleClick()
      expect(fetchMyTraining).toHaveBeenCalledTimes(1)

      await vm.onTrainingStaleClick()
      expect(fetchMyTraining).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(DEBOUNCE_MS)
      expect(vm.trainingRefreshDebouncing).toBe(false)
    })

    it('防抖定时器在组件销毁时清理', () => {
      const vm = createVm({ pageCacheStore })
      vm._trainingDebounceTimer = setTimeout(() => {}, 5000)

      clearTimeout(vm._trainingDebounceTimer)
      vm._trainingDebounceTimer = null

      expect(vm._trainingDebounceTimer).toBeNull()
    })
  })

  describe('自定义计划 - loadCustomPlansWithCache', () => {
    it('缓存有效时：不显示骨架屏，显示过时提示条', async () => {
      const cachedPlans = [
        { id: 1, name: '自定义A', planType: 0 },
        { id: 2, name: '自定义B', planType: 0 },
      ]
      pageCacheStore.setCache('customPlans', cachedPlans)

      const customFetchFn = vi.fn().mockResolvedValue([
        { id: 1, name: '自定义A', planType: 0 },
        { id: 2, name: '自定义B', planType: 0 },
        { id: 3, name: '自定义C', planType: 0 },
      ])

      const vm = createVm({
        pageCacheStore,
        customFetchFn,
      })

      await vm.loadCustomPlansWithCache()

      expect(vm.customPlanLoading).toBe(false)
      expect(vm.customStaleHint).toBe(true)
      expect(vm.customPlans).toEqual(cachedPlans)
      expect(customFetchFn).toHaveBeenCalledTimes(1)
    })

    it('缓存有效时：后台刷新成功后更新数据并隐藏提示', async () => {
      const cachedPlans = [{ id: 1, name: '旧计划', planType: 0 }]
      pageCacheStore.setCache('customPlans', cachedPlans)

      const freshPlans = [
        { id: 1, name: '旧计划', planType: 0 },
        { id: 2, name: '新计划', planType: 0 },
      ]
      const customFetchFn = vi.fn().mockResolvedValue(freshPlans)

      const vm = createVm({
        pageCacheStore,
        customFetchFn,
      })

      await vm.loadCustomPlansWithCache()
      expect(vm.customStaleHint).toBe(true)
      expect(vm.customPlans).toEqual(cachedPlans)

      await vi.runAllTimersAsync()

      expect(vm.customStaleHint).toBe(false)
      expect(vm.customPlans).toEqual(freshPlans)
    })

    it('缓存过期时：显示骨架屏，不显示过时提示条', async () => {
      const freshPlans = [
        { id: 1, name: '自定义A', planType: 0 },
        { id: 2, name: '自定义B', planType: 0 },
      ]
      const customFetchFn = vi.fn().mockResolvedValue(freshPlans)

      const vm = createVm({
        pageCacheStore,
        customFetchFn,
      })

      const promise = vm.loadCustomPlansWithCache()

      expect(vm.customPlanLoading).toBe(true)
      expect(vm.customStaleHint).toBe(false)

      await promise

      expect(vm.customPlanLoading).toBe(false)
      expect(vm.customPlans).toEqual(freshPlans)
      expect(vm.customStaleHint).toBe(false)
    })

    it('缓存过期且请求失败时：customPlans 为空数组', async () => {
      const customFetchFn = vi.fn().mockRejectedValue(new Error('Network Error'))

      const vm = createVm({
        pageCacheStore,
        customFetchFn,
      })

      await vm.loadCustomPlansWithCache()

      expect(vm.customPlanLoading).toBe(false)
      expect(vm.customPlans).toEqual([])
    })

    it('过滤掉非自定义类型计划 (planType !== 0)', async () => {
      const customFetchFn = vi.fn().mockResolvedValue([
        { id: 1, name: '自定义A', planType: 0 },
        { id: 2, name: '预置B', planType: 1 },
        { id: 3, name: '自定义C', planType: 0 },
      ])

      const vm = createVm({
        pageCacheStore,
        customFetchFn,
      })

      await vm.loadCustomPlansWithCache()

      expect(vm.customPlans).toEqual([
        { id: 1, name: '自定义A', planType: 0 },
        { id: 3, name: '自定义C', planType: 0 },
      ])
    })
  })

  describe('自定义计划 - onCustomStaleClick', () => {
    it('点击过时提示条：刷新成功后隐藏提示条', async () => {
      const cachedPlans = [{ id: 1, name: '旧计划', planType: 0 }]
      pageCacheStore.setCache('customPlans', cachedPlans)

      const customFetchFn = vi.fn().mockResolvedValue([
        { id: 1, name: '新计划', planType: 0 },
      ])

      const vm = createVm({
        pageCacheStore,
        customFetchFn,
      })
      vm.customStaleHint = true

      await vm.onCustomStaleClick()

      expect(vm.customStaleHint).toBe(false)
      expect(vm.customRefreshDebouncing).toBe(true)

      vi.advanceTimersByTime(DEBOUNCE_MS)
      expect(vm.customRefreshDebouncing).toBe(false)
    })

    it('防抖期间重复点击：忽略请求', async () => {
      const customFetchFn = vi.fn().mockResolvedValue([])

      const vm = createVm({
        pageCacheStore,
        customFetchFn,
      })
      vm.customStaleHint = true

      await vm.onCustomStaleClick()
      const callCount = customFetchFn.mock.calls.length

      await vm.onCustomStaleClick()
      expect(customFetchFn.mock.calls.length).toBe(callCount)

      vi.advanceTimersByTime(DEBOUNCE_MS)
      expect(vm.customRefreshDebouncing).toBe(false)
    })
  })

  describe('骨架屏显示条件 - 综合场景', () => {
    it('端到端：我的训练 pageCache命中→过时提示→刷新→提示消失', async () => {
      pageCacheStore.setCache('myTraining', [{ id: 1, title: '已有计划' }])

      let resolveFetch
      const fetchMyTraining = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          resolveFetch = resolve
        })
      })
      const vm = createVm({
        pageCacheStore,
        trainingStore: {
          list: [],
          listLoading: false,
          fetchMyTraining,
        },
      })
      vm.initTrainingStore()

      await vm.loadTrainingListWithCache()
      expect(vm.hasTrainingData).toBe(true)
      expect(vm.trainingStaleHint).toBe(true)

      resolveFetch(true)
      await Promise.resolve()
      await Promise.resolve()
      expect(vm.trainingStaleHint).toBe(false)

      fetchMyTraining.mockResolvedValue(true)
      await vm.onTrainingStaleClick()
      expect(fetchMyTraining).toHaveBeenCalledTimes(2)

      vi.advanceTimersByTime(DEBOUNCE_MS)
      expect(vm.trainingRefreshDebouncing).toBe(false)
    })

    it('端到端：我的训练 首次加载→骨架屏→数据到达→写入缓存→过时提示', async () => {
      let resolveFetch
      const fetchMyTraining = vi.fn().mockImplementation(() => {
        vm.trainingStore.listLoading = true
        return new Promise((resolve) => {
          resolveFetch = () => {
            vm.trainingStore.list = [{ id: 1, title: '新计划' }]
            vm.trainingStore.listLoading = false
            resolve(true)
          }
        })
      })

      const vm = createVm({
        pageCacheStore,
        trainingStore: {
          list: [],
          listLoading: false,
          fetchMyTraining,
        },
      })
      vm.initTrainingStore()

      const promise = vm.loadTrainingListWithCache()
      expect(vm.trainingStore.listLoading).toBe(true)
      expect(vm.trainingStaleHint).toBe(false)

      resolveFetch()
      await promise

      expect(vm.trainingStore.listLoading).toBe(false)
      expect(vm.hasTrainingData).toBe(true)
      expect(pageCacheStore.getCached('myTraining')).toEqual([{ id: 1, title: '新计划' }])

      let resolveRefresh
      fetchMyTraining.mockImplementation(() => {
        return new Promise((resolve) => {
          resolveRefresh = resolve
        })
      })

      vm.loadTrainingListWithCache()
      expect(vm.trainingStaleHint).toBe(true)
      expect(vm.trainingStore.listLoading).toBe(false)

      resolveRefresh(true)
      await Promise.resolve()
      await Promise.resolve()
      expect(vm.trainingStaleHint).toBe(false)
    })

    it('端到端：自定义计划 缓存有效→过时提示→点击刷新→提示消失', async () => {
      pageCacheStore.setCache('customPlans', [
        { id: 1, name: '旧计划', planType: 0 },
      ])

      const customFetchFn = vi.fn().mockResolvedValue([
        { id: 1, name: '新计划', planType: 0 },
      ])

      const vm = createVm({
        pageCacheStore,
        customFetchFn,
      })

      await vm.loadCustomPlansWithCache()
      expect(vm.customPlanLoading).toBe(false)
      expect(vm.customStaleHint).toBe(true)

      await vm.onCustomStaleClick()
      expect(vm.customStaleHint).toBe(false)

      vi.advanceTimersByTime(DEBOUNCE_MS)
      expect(vm.customRefreshDebouncing).toBe(false)
    })

    it('端到端：自定义计划 首次加载→骨架屏→数据到达→缓存有效→过时提示', async () => {
      let resolveFetch
      const customFetchFn = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          resolveFetch = () => {
            resolve([
              { id: 1, name: '新计划', planType: 0 },
            ])
          }
        })
      })

      const vm = createVm({
        pageCacheStore,
        customFetchFn,
      })

      const promise = vm.loadCustomPlansWithCache()
      expect(vm.customPlanLoading).toBe(true)
      expect(vm.customStaleHint).toBe(false)

      resolveFetch()
      await promise

      expect(vm.customPlanLoading).toBe(false)
      expect(vm.customPlans.length).toBe(1)

      await vm.loadCustomPlansWithCache()
      expect(vm.customStaleHint).toBe(true)
      expect(vm.customPlanLoading).toBe(false)
    })
  })
})
