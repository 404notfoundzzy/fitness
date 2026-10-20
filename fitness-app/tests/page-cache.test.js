import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.stubGlobal('uni', {
  getStorageSync: vi.fn(() => null),
  setStorageSync: vi.fn(),
})

import { usePageCacheStore } from '@/stores/pageCache.js'

describe('pageCache - silentRefresh 重试机制', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePageCacheStore()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('首次成功时不重试', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ data: 'ok' })

    const result = await store.silentRefresh('testKey', fetchFn)

    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ data: 'ok' })
    expect(store.cacheData.testKey).toEqual({ data: 'ok' })
    expect(store.refreshStatus.testKey).toBe('success')
  })

  it('失败1次后重试成功', async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce({ data: 'recovered' })

    const refreshPromise = store.silentRefresh('testKey', fetchFn)

    await vi.advanceTimersByTimeAsync(3000)

    const result = await refreshPromise

    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ data: 'recovered' })
    expect(store.cacheData.testKey).toEqual({ data: 'recovered' })
    expect(store.refreshStatus.testKey).toBe('success')
  })

  it('失败2次后第3次重试成功', async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValueOnce({ data: 'third-try' })

    const refreshPromise = store.silentRefresh('testKey', fetchFn)

    await vi.advanceTimersByTimeAsync(3000)
    await vi.advanceTimersByTimeAsync(3000)

    const result = await refreshPromise

    expect(fetchFn).toHaveBeenCalledTimes(3)
    expect(result).toEqual({ data: 'third-try' })
    expect(store.refreshStatus.testKey).toBe('success')
  })

  it('超过最大重试次数后返回缓存数据', async () => {
    store.cacheData = { testKey: { data: 'cached' } }
    store.cacheTimestamps = { testKey: Date.now() - 100000 }

    const fetchFn = vi.fn().mockRejectedValue(new Error('Always fails'))

    const refreshPromise = store.silentRefresh('testKey', fetchFn)

    await vi.advanceTimersByTimeAsync(3000)
    await vi.advanceTimersByTimeAsync(3000)

    const result = await refreshPromise

    expect(fetchFn).toHaveBeenCalledTimes(3)
    expect(result).toEqual({ data: 'cached' })
    expect(store.refreshStatus.testKey).toBe('error:Always fails')
  })

  it('超过最大重试次数且无缓存时返回 null', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('No cache'))

    const refreshPromise = store.silentRefresh('testKey', fetchFn)

    await vi.advanceTimersByTimeAsync(3000)
    await vi.advanceTimersByTimeAsync(3000)

    const result = await refreshPromise

    expect(fetchFn).toHaveBeenCalledTimes(3)
    expect(result).toBeNull()
    expect(store.refreshStatus.testKey).toBe('error:No cache')
  })

  it('重试间隔为 3 秒', async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail'))
      .mockResolvedValueOnce({ data: 'ok' })

    const refreshPromise = store.silentRefresh('testKey', fetchFn)

    expect(fetchFn).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(2999)
    expect(fetchFn).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1)
    const result = await refreshPromise

    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ data: 'ok' })
  })

  it('刷新过程中 refreshStatus 正确流转', async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValueOnce({ data: 'ok' })

    const refreshPromise = store.silentRefresh('testKey', fetchFn)

    expect(store.refreshStatus.testKey).toBe('refreshing')

    await vi.advanceTimersByTimeAsync(3000)
    expect(store.refreshStatus.testKey).toBe('retry:2')

    await vi.advanceTimersByTimeAsync(3000)
    const result = await refreshPromise

    expect(result).toEqual({ data: 'ok' })
    expect(store.refreshStatus.testKey).toBe('success')
  })

  it('getRefreshError 在失败时返回错误信息', async () => {
    store.cacheData = { testKey: { data: 'cached' } }

    const fetchFn = vi.fn().mockRejectedValue(new Error('Timeout'))

    const refreshPromise = store.silentRefresh('testKey', fetchFn)

    expect(store.getRefreshError('testKey')).toBeNull()

    await vi.advanceTimersByTimeAsync(3000)
    await vi.advanceTimersByTimeAsync(3000)
    await refreshPromise

    expect(store.getRefreshError('testKey')).toBe('error:Timeout')
  })

  it('getRefreshError 在成功时返回 null', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ data: 'ok' })

    await store.silentRefresh('testKey', fetchFn)

    expect(store.getRefreshError('testKey')).toBeNull()
  })

  it('isRefreshing 在刷新期间返回 true', async () => {
    let resolveFetch
    const fetchFn = vi.fn().mockImplementation(() => new Promise((r) => { resolveFetch = r }))

    const refreshPromise = store.silentRefresh('testKey', fetchFn)

    expect(store.isRefreshing('testKey')).toBe(true)

    resolveFetch({ data: 'ok' })
    await refreshPromise

    expect(store.isRefreshing('testKey')).toBe(false)
  })

  it('返回空数据时标记为 empty', async () => {
    const fetchFn = vi.fn().mockResolvedValue(null)

    const result = await store.silentRefresh('testKey', fetchFn)

    expect(result).toBeNull()
    expect(store.refreshStatus.testKey).toBe('empty')
  })

  it('返回 undefined 时标记为 empty', async () => {
    const fetchFn = vi.fn().mockResolvedValue(undefined)

    const result = await store.silentRefresh('testKey', fetchFn)

    expect(result).toBeUndefined()
    expect(store.refreshStatus.testKey).toBe('empty')
  })
})

describe('pageCache - loadWithCache', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePageCacheStore()
  })

  it('缓存命中时返回缓存并触发静默刷新', async () => {
    store.setCache('testKey', { data: 'cached' })

    const fetchFn = vi.fn().mockResolvedValue({ data: 'fresh' })

    const result = await store.loadWithCache('testKey', fetchFn)

    expect(result).toEqual({ data: 'cached' })
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('缓存未命中时直接请求', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ data: 'fresh' })

    const result = await store.loadWithCache('testKey', fetchFn)

    expect(result).toEqual({ data: 'fresh' })
    expect(store.cacheData.testKey).toEqual({ data: 'fresh' })
  })

  it('请求失败且有缓存时返回过期缓存', async () => {
    store.cacheData = { testKey: { data: 'stale' } }
    store.cacheTimestamps = { testKey: Date.now() - 600000 }

    const fetchFn = vi.fn().mockRejectedValue(new Error('Network Error'))

    const result = await store.loadWithCache('testKey', fetchFn, { forceRefresh: true })

    expect(result).toEqual({ data: 'stale' })
  })

  it('请求失败且无缓存时抛出异常', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('Network Error'))

    await expect(store.loadWithCache('testKey', fetchFn)).rejects.toThrow('Network Error')
  })
})

describe('pageCache - 缓存基础操作', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePageCacheStore()
  })

  it('setCache 写入后 getCached 可读取', () => {
    store.setCache('testKey', { value: 42 })

    const result = store.getCached('testKey')
    expect(result).toEqual({ value: 42 })
  })

  it('缓存过期后 getCached 返回 null', () => {
    store.setCache('testKey', { value: 42 })
    store.cacheTimestamps = { testKey: Date.now() - 400000 }

    const result = store.getCached('testKey')
    expect(result).toBeNull()
  })

  it('clearCache 清除指定 key', () => {
    store.setCache('testKey', { value: 42 })
    store.clearCache('testKey')

    expect(store.cacheData.testKey).toBeUndefined()
    expect(store.cacheTimestamps.testKey).toBeUndefined()
  })

  it('clearCache 无参数时清除全部缓存', () => {
    store.setCache('weightTrend', [1, 2, 3])
    store.setCache('weeklyActivity', { data: 'test' })

    store.clearCache()

    expect(Object.keys(store.cacheData)).toHaveLength(0)
    expect(Object.keys(store.cacheTimestamps)).toHaveLength(0)
  })
})
