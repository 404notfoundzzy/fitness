import { defineStore } from 'pinia'

const DEFAULT_EXPIRY = 300000
const LOG_PREFIX = '[PageCache]'
const MAX_RETRY = 2
const RETRY_DELAY = 3000

export const usePageCacheStore = defineStore('pageCache', {
  state: () => ({
    cacheData: {},
    cacheTimestamps: {},
    refreshStatus: {},
  }),

  getters: {
    isCacheValid: (state) => (key, expiryMs = DEFAULT_EXPIRY) => {
      const ts = state.cacheTimestamps[key]
      if (!ts) return false
      return Date.now() - ts < expiryMs
    },

    isRefreshing: (state) => (key) => {
      return state.refreshStatus[key] === 'refreshing'
    },

    getRefreshError: (state) => (key) => {
      return state.refreshStatus[key]?.startsWith('error:') ? state.refreshStatus[key] : null
    },
  },

  actions: {
    _setRefreshStatus(key, status) {
      this.refreshStatus = { ...this.refreshStatus, [key]: status }
    },

    getCached(key) {
      if (!this.isCacheValid(key)) {
        console.log(LOG_PREFIX, `❌ 缓存已过期或不存在: ${key}`)
        return null
      }
      const age = Date.now() - this.cacheTimestamps[key]
      console.log(LOG_PREFIX, `✅ 命中缓存: ${key} | 数据年龄: ${Math.round(age / 1000)}s`)
      return this.cacheData[key] ?? null
    },

    setCache(key, data) {
      this.cacheData = { ...this.cacheData, [key]: data }
      this.cacheTimestamps = {
        ...this.cacheTimestamps,
        [key]: Date.now(),
      }
      console.log(LOG_PREFIX, `💾 缓存已写入: ${key} | 过期时间: ${DEFAULT_EXPIRY / 1000}s`)
    },

    clearCache(key) {
      if (key) {
        const newData = { ...this.cacheData }
        delete newData[key]
        this.cacheData = newData
        const newTs = { ...this.cacheTimestamps }
        delete newTs[key]
        this.cacheTimestamps = newTs
        console.log(LOG_PREFIX, `🗑️ 缓存已清除: ${key}`)
      } else {
        this.cacheData = {}
        this.cacheTimestamps = {}
        console.log(LOG_PREFIX, '🗑️ 全部缓存已清除')
      }
    },

    async silentRefresh(key, fetchFn, retryCount = 0) {
      this._setRefreshStatus(key, 'refreshing')
      console.log(
        LOG_PREFIX,
        `🔄 静默刷新开始: ${key}${retryCount > 0 ? ` | 重试第 ${retryCount} 次` : ''}`,
      )

      const startTime = Date.now()
      try {
        const result = await fetchFn()
        const elapsed = Date.now() - startTime

        if (result !== undefined && result !== null) {
          this.setCache(key, result)
          this._setRefreshStatus(key, 'success')
          console.log(LOG_PREFIX, `✅ 静默刷新成功: ${key} | 耗时: ${elapsed}ms`)
        } else {
          this._setRefreshStatus(key, 'empty')
          console.warn(LOG_PREFIX, `⚠️ 静默刷新返回空数据: ${key} | 耗时: ${elapsed}ms`)
        }
        return result
      } catch (e) {
        const elapsed = Date.now() - startTime
        console.error(
          LOG_PREFIX,
          `❌ 静默刷新失败: ${key} | 耗时: ${elapsed}ms | 错误: ${e.message || e}`,
        )

        if (retryCount < MAX_RETRY) {
          const nextRetry = retryCount + 1
          console.log(
            LOG_PREFIX,
            `🔁 将在 ${RETRY_DELAY / 1000}s 后重试: ${key} (${nextRetry}/${MAX_RETRY})`,
          )
          this._setRefreshStatus(key, `retry:${nextRetry}`)
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
          return this.silentRefresh(key, fetchFn, nextRetry)
        }

        this._setRefreshStatus(key, `error:${e.message || 'unknown'}`)
        console.error(
          LOG_PREFIX,
          `🚫 静默刷新最终失败: ${key} | 已重试 ${MAX_RETRY} 次 | 用户将看到缓存数据`,
        )
        return this.cacheData[key] ?? null
      }
    },

    async loadWithCache(key, fetchFn, options = {}) {
      const { forceRefresh = false, expiryMs = DEFAULT_EXPIRY } = options

      if (!forceRefresh && this.isCacheValid(key, expiryMs) && this.cacheData[key] != null) {
        console.log(LOG_PREFIX, `✅ 命中缓存: ${key}`)
        this.silentRefresh(key, fetchFn)
        return this.cacheData[key]
      }

      console.log(LOG_PREFIX, `🔄 缓存未命中, 请求: ${key}`)
      const startTime = Date.now()
      try {
        const result = await fetchFn()
        const elapsed = Date.now() - startTime
        console.log(LOG_PREFIX, `✅ 请求成功: ${key} | 耗时: ${elapsed}ms`)
        if (result !== undefined && result !== null) {
          this.setCache(key, result)
        }
        return result
      } catch (e) {
        const elapsed = Date.now() - startTime
        console.error(LOG_PREFIX, `❌ 请求失败: ${key} | 耗时: ${elapsed}ms | 错误: ${e.message || e}`)

        if (this.cacheData[key] != null) {
          console.warn(LOG_PREFIX, `⚠️ 请求失败，返回过期缓存: ${key}`)
          return this.cacheData[key]
        }
        throw e
      }
    },
  },

  persist: {
    storage: {
      getItem: (key) => {
        try {
          const value = uni.getStorageSync(key)
          if (value === '' || value === null || value === undefined) return null
          if (typeof value === 'string') return value
          return JSON.stringify(value)
        } catch {
          return null
        }
      },
      setItem: (key, value) => {
        try {
          uni.setStorageSync(key, value)
        } catch {}
      },
    },
  },
})
