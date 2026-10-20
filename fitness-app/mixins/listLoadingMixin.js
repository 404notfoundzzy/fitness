const SMART_DELAY_THRESHOLD = 300
const MIN_DISPLAY_DURATION = 500

const LOG_PREFIX = '[SmartLoading]'

function getPageName() {
  try {
    const pages = getCurrentPages()
    if (pages && pages.length > 0) {
      const current = pages[pages.length - 1]
      return current.route || current.$options?.__file || '未知页面'
    }
  } catch (e) {}
  return '未知页面'
}

export const listLoadingMixin = {
  data() {
    return {
      firstLoad: true,
      pageLoading: false,
      _loadingVisible: false,
      _loadingStartTime: 0,
      _loadingDelayTimer: null,
    }
  },

  onShow() {
    const page = getPageName()
    console.log(LOG_PREFIX, `[${page}] onShow 触发 → firstLoad 重置为 true`)
    this.firstLoad = true
  },

  computed: {
    isLoading() {
      return this.firstLoad || this.pageLoading
    },
    loadingVisible() {
      return this._loadingVisible
    },
    pageLoadingText() {
      return this.isLoading ? '加载中...' : ''
    },
  },

  methods: {
    startPageLoading() {
      this.pageLoading = true
    },

    stopPageLoading() {
      this.pageLoading = false
    },

    finishFirstLoad() {
      if (this.firstLoad) this.firstLoad = false
    },

    _showLoading(page, label) {
      this._loadingVisible = true
      this._loadingStartTime = Date.now()
      console.log(
        LOG_PREFIX,
        `[${page}] 🎬 加载动画已显示 | 接口: ${label} | 延迟 ${SMART_DELAY_THRESHOLD}ms 后触发`,
      )
    },

    _hideLoading(page, label) {
      if (this._loadingVisible) {
        const displayDuration = Date.now() - this._loadingStartTime
        console.log(
          LOG_PREFIX,
          `[${page}] 🏁 加载动画已隐藏 | 接口: ${label} | 实际展示: ${displayDuration}ms | 最小要求: ${MIN_DISPLAY_DURATION}ms`,
        )
      }
      this._loadingVisible = false
      this._loadingStartTime = 0
      if (this._loadingDelayTimer) {
        clearTimeout(this._loadingDelayTimer)
        this._loadingDelayTimer = null
      }
    },

    async _smartLoadingWrap(asyncFn, label) {
      const page = getPageName()
      const tag = label || asyncFn.name || '匿名函数'
      const callTime = Date.now()
      this._loadingStartTime = callTime

      console.log(
        LOG_PREFIX,
        `[${page}] ⏱️ 请求开始 | 接口: ${tag} | 阈值: ${SMART_DELAY_THRESHOLD}ms | 最小展示: ${MIN_DISPLAY_DURATION}ms`,
      )

      this._loadingDelayTimer = setTimeout(() => {
        if (this.isLoading) {
          console.log(
            LOG_PREFIX,
            `[${page}] ⏳ 接口 ${tag} 已耗时 ${SMART_DELAY_THRESHOLD}ms 未返回 → 触发加载动画显示`,
          )
          this._showLoading(page, tag)
        } else {
          console.log(
            LOG_PREFIX,
            `[${page}] ⚡ 延迟定时器触发，但 isLoading 已为 false → 跳过动画显示`,
          )
        }
      }, SMART_DELAY_THRESHOLD)

      try {
        const result = await asyncFn()
        const elapsed = Date.now() - callTime

        if (this._loadingDelayTimer) {
          clearTimeout(this._loadingDelayTimer)
          this._loadingDelayTimer = null
          console.log(
            LOG_PREFIX,
            `[${page}] ✅ 快速返回 | 接口: ${tag} | 耗时: ${elapsed}ms < 阈值 ${SMART_DELAY_THRESHOLD}ms → 不显示动画`,
          )
        } else {
          console.log(
            LOG_PREFIX,
            `[${page}] ✅ 慢速返回 | 接口: ${tag} | 耗时: ${elapsed}ms > 阈值 ${SMART_DELAY_THRESHOLD}ms → 动画已显示中`,
          )
        }

        if (this._loadingVisible) {
          const displayDuration = Date.now() - this._loadingStartTime
          const remaining = MIN_DISPLAY_DURATION - displayDuration
          if (remaining > 0) {
            console.log(
              LOG_PREFIX,
              `[${page}] ⏸️ 动画仅展示 ${displayDuration}ms < 最小 ${MIN_DISPLAY_DURATION}ms → 补等 ${remaining}ms | 接口: ${tag}`,
            )
            await new Promise(resolve => setTimeout(resolve, remaining))
          } else {
            console.log(
              LOG_PREFIX,
              `[${page}] ✓ 动画已展示 ${displayDuration}ms ≥ 最小 ${MIN_DISPLAY_DURATION}ms → 无需补等 | 接口: ${tag}`,
            )
          }
        }

        this._hideLoading(page, tag)
        return result
      } catch (error) {
        const elapsed = Date.now() - callTime

        if (this._loadingDelayTimer) {
          clearTimeout(this._loadingDelayTimer)
          this._loadingDelayTimer = null
          console.log(
            LOG_PREFIX,
            `[${page}] ❌ 快速失败 | 接口: ${tag} | 耗时: ${elapsed}ms | 错误: ${error.message}`,
          )
        } else {
          console.log(
            LOG_PREFIX,
            `[${page}] ❌ 慢速失败 | 接口: ${tag} | 耗时: ${elapsed}ms | 错误: ${error.message}`,
          )
        }

        if (this._loadingVisible) {
          const displayDuration = Date.now() - this._loadingStartTime
          const remaining = MIN_DISPLAY_DURATION - displayDuration
          if (remaining > 0) {
            console.log(
              LOG_PREFIX,
              `[${page}] ⏸️ 失败后动画仅展示 ${displayDuration}ms → 补等 ${remaining}ms | 接口: ${tag}`,
            )
            await new Promise(resolve => setTimeout(resolve, remaining))
          }
        }

        this._hideLoading(page, tag)
        throw error
      }
    },

    async withLoading(asyncFn, label) {
      const page = getPageName()
      const tag = label || asyncFn.name || '匿名函数'
      console.log(LOG_PREFIX, `[${page}] 🔄 withLoading 开始 | 接口: ${tag} → pageLoading = true`)
      this.startPageLoading()
      try {
        return await this._smartLoadingWrap(asyncFn, label)
      } finally {
        this.stopPageLoading()
        this.finishFirstLoad()
        console.log(LOG_PREFIX, `[${page}] 🔄 withLoading 结束 | 接口: ${tag} → pageLoading = false, firstLoad = false`)
      }
    },

    async withFirstLoad(asyncFn, label) {
      const page = getPageName()
      const tag = label || asyncFn.name || '匿名函数'
      console.log(LOG_PREFIX, `[${page}] 🔄 withFirstLoad 开始 | 接口: ${tag}`)
      try {
        return await this._smartLoadingWrap(asyncFn, label)
      } finally {
        this.finishFirstLoad()
        console.log(LOG_PREFIX, `[${page}] 🔄 withFirstLoad 结束 | 接口: ${tag} → firstLoad = false`)
      }
    },
  },
}
