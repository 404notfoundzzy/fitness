import { describe, it, expect, vi } from 'vitest'
import { listLoadingMixin } from '@/mixins/listLoadingMixin.js'

function createComponent(options = {}) {
  const merged = {
    ...listLoadingMixin,
    data() {
      const mixinData = listLoadingMixin.data()
      const ownData = options.data ? options.data() : {}
      return { ...mixinData, ...ownData }
    },
    computed: {
      ...listLoadingMixin.computed,
      ...(options.computed || {}),
    },
    methods: {
      ...listLoadingMixin.methods,
      ...(options.methods || {}),
    },
  }

  const mixinData = merged.data()
  const vm = {
    firstLoad: mixinData.firstLoad,
    pageLoading: mixinData.pageLoading,
    _loadingVisible: mixinData._loadingVisible,
    _loadingStartTime: mixinData._loadingStartTime,
    _loadingDelayTimer: mixinData._loadingDelayTimer,
  }

  const computedFns = merged.computed
  Object.keys(computedFns).forEach((key) => {
    Object.defineProperty(vm, key, {
      get: computedFns[key].bind(vm),
      enumerable: true,
    })
  })

  Object.keys(merged.methods).forEach((key) => {
    vm[key] = merged.methods[key].bind(vm)
  })

  return vm
}

describe('listLoadingMixin', () => {
  describe('data', () => {
    it('firstLoad 默认为 true', () => {
      const data = listLoadingMixin.data()
      expect(data.firstLoad).toBe(true)
    })

    it('pageLoading 默认为 false', () => {
      const data = listLoadingMixin.data()
      expect(data.pageLoading).toBe(false)
    })

    it('_loadingVisible 默认为 false', () => {
      const data = listLoadingMixin.data()
      expect(data._loadingVisible).toBe(false)
    })
  })

  describe('computed: isLoading', () => {
    it('firstLoad 为 true 时 isLoading 为 true', () => {
      const vm = createComponent()
      vm.firstLoad = true
      vm.pageLoading = false
      expect(vm.isLoading).toBe(true)
    })

    it('pageLoading 为 true 时 isLoading 为 true', () => {
      const vm = createComponent()
      vm.firstLoad = false
      vm.pageLoading = true
      expect(vm.isLoading).toBe(true)
    })

    it('两者都为 false 时 isLoading 为 false', () => {
      const vm = createComponent()
      vm.firstLoad = false
      vm.pageLoading = false
      expect(vm.isLoading).toBe(false)
    })
  })

  describe('computed: loadingVisible', () => {
    it('_loadingVisible 为 true 时 loadingVisible 为 true', () => {
      const vm = createComponent()
      vm._loadingVisible = true
      expect(vm.loadingVisible).toBe(true)
    })

    it('_loadingVisible 为 false 时 loadingVisible 为 false', () => {
      const vm = createComponent()
      vm._loadingVisible = false
      expect(vm.loadingVisible).toBe(false)
    })
  })

  describe('computed: pageLoadingText', () => {
    it('isLoading 为 true 时返回加载中', () => {
      const vm = createComponent()
      vm.firstLoad = true
      expect(vm.pageLoadingText).toBe('加载中...')
    })

    it('isLoading 为 false 时返回空字符串', () => {
      const vm = createComponent()
      vm.firstLoad = false
      vm.pageLoading = false
      expect(vm.pageLoadingText).toBe('')
    })
  })

  describe('methods: startPageLoading / stopPageLoading', () => {
    it('startPageLoading 设置 pageLoading 为 true', () => {
      const vm = createComponent()
      vm.pageLoading = false
      vm.startPageLoading()
      expect(vm.pageLoading).toBe(true)
    })

    it('stopPageLoading 设置 pageLoading 为 false', () => {
      const vm = createComponent()
      vm.pageLoading = true
      vm.stopPageLoading()
      expect(vm.pageLoading).toBe(false)
    })
  })

  describe('methods: finishFirstLoad', () => {
    it('firstLoad 为 true 时设为 false', () => {
      const vm = createComponent()
      vm.firstLoad = true
      vm.finishFirstLoad()
      expect(vm.firstLoad).toBe(false)
    })

    it('firstLoad 已经为 false 时保持不变', () => {
      const vm = createComponent()
      vm.firstLoad = false
      vm.finishFirstLoad()
      expect(vm.firstLoad).toBe(false)
    })
  })

  describe('智能延迟: _smartLoadingWrap', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('接口 <300ms 时不显示加载动画', async () => {
      const vm = createComponent()
      vm.firstLoad = true

      const promise = vm._smartLoadingWrap(async () => {
        return 'fast'
      })

      await promise

      expect(vm._loadingVisible).toBe(false)
    })

    it('接口 >300ms 时显示加载动画', async () => {
      const vm = createComponent()
      vm.firstLoad = true

      const promise = vm._smartLoadingWrap(async () => {
        vi.advanceTimersByTime(400)
        return 'slow'
      })

      vi.advanceTimersByTime(300)
      await vi.runAllTimersAsync()

      const result = await promise

      expect(result).toBe('slow')
    })

    it('加载动画显示后至少保持 500ms', async () => {
      const vm = createComponent()
      vm.firstLoad = true

      let resolveFn
      const promise = vm._smartLoadingWrap(async () => {
        return new Promise(resolve => {
          resolveFn = resolve
        })
      })

      vi.advanceTimersByTime(300)
      expect(vm._loadingVisible).toBe(true)

      vi.advanceTimersByTime(100)
      resolveFn('data')

      await vi.runAllTimersAsync()
      await promise

      expect(vm._loadingVisible).toBe(false)
    })

    it('接口返回后清理延迟定时器', async () => {
      const vm = createComponent()
      vm.firstLoad = true

      await vm._smartLoadingWrap(async () => 'fast')

      expect(vm._loadingDelayTimer).toBeNull()
    })
  })

  describe('methods: withLoading', () => {
    it('执行期间 pageLoading 为 true，执行完毕后为 false', async () => {
      const vm = createComponent()
      vm.firstLoad = true
      const states = []
      await vm.withLoading(async () => {
        states.push({ pageLoading: vm.pageLoading, firstLoad: vm.firstLoad })
      })
      expect(states[0].pageLoading).toBe(true)
      expect(vm.pageLoading).toBe(false)
    })

    it('执行完毕后 firstLoad 变为 false', async () => {
      const vm = createComponent()
      vm.firstLoad = true
      await vm.withLoading(async () => {})
      expect(vm.firstLoad).toBe(false)
    })

    it('返回异步函数的结果', async () => {
      const vm = createComponent()
      const result = await vm.withLoading(async () => 42)
      expect(result).toBe(42)
    })

    it('异步函数抛出异常时仍然重置加载状态', async () => {
      const vm = createComponent()
      vm.firstLoad = true
      await expect(
        vm.withLoading(async () => {
          throw new Error('test error')
        }),
      ).rejects.toThrow('test error')
      expect(vm.pageLoading).toBe(false)
      expect(vm.firstLoad).toBe(false)
    })
  })

  describe('methods: withFirstLoad', () => {
    it('执行完毕后 firstLoad 变为 false', async () => {
      const vm = createComponent()
      vm.firstLoad = true
      await vm.withFirstLoad(async () => {})
      expect(vm.firstLoad).toBe(false)
    })

    it('不影响 pageLoading', async () => {
      const vm = createComponent()
      vm.pageLoading = false
      await vm.withFirstLoad(async () => {})
      expect(vm.pageLoading).toBe(false)
    })

    it('返回异步函数的结果', async () => {
      const vm = createComponent()
      const result = await vm.withFirstLoad(async () => 'hello')
      expect(result).toBe('hello')
    })

    it('异步函数抛出异常时仍然调用 finishFirstLoad', async () => {
      const vm = createComponent()
      vm.firstLoad = true
      await expect(
        vm.withFirstLoad(async () => {
          throw new Error('fail')
        }),
      ).rejects.toThrow('fail')
      expect(vm.firstLoad).toBe(false)
    })
  })

  describe('onShow 合并逻辑', () => {
    it('mixin 的 onShow 将 firstLoad 重置为 true', () => {
      const vm = createComponent()
      vm.firstLoad = false
      listLoadingMixin.onShow.call(vm)
      expect(vm.firstLoad).toBe(true)
    })

    it('组件 onShow 中调用 fetch 后 firstLoad 被 finishFirstLoad 关闭', async () => {
      const vm = createComponent()
      vm.firstLoad = false

      listLoadingMixin.onShow.call(vm)
      expect(vm.firstLoad).toBe(true)

      await vm.withFirstLoad(async () => {})
      expect(vm.firstLoad).toBe(false)
    })

    it('连续两次 onShow 后 firstLoad 仍为 true', () => {
      const vm = createComponent()
      vm.firstLoad = false

      listLoadingMixin.onShow.call(vm)
      listLoadingMixin.onShow.call(vm)

      expect(vm.firstLoad).toBe(true)
    })

    it('onShow 后 fetchRecords 模式：firstLoad 先 true 后 false', async () => {
      const vm = createComponent()

      expect(vm.firstLoad).toBe(true)

      await vm.withFirstLoad(async () => {})
      expect(vm.firstLoad).toBe(false)

      listLoadingMixin.onShow.call(vm)
      expect(vm.firstLoad).toBe(true)

      await vm.withFirstLoad(async () => {})
      expect(vm.firstLoad).toBe(false)
    })
  })
})
