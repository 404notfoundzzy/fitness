import { defineStore } from 'pinia'

const API_BASE = 'https://zzy404notfound.site'

const DEFAULT_USER_ID = 1

/** 训练台草稿的本地存储键（导出便于测试与手动清理） */
export const GUIDED_DRAFT_KEY = 'guided_session_draft_v1'

/** 草稿有效期：超过一天视为过期（昨天没练完的组不该今天接着算） */
export const GUIDED_DRAFT_TTL = 24 * 60 * 60 * 1000

const PLAN_ICON_MAP = {
  'five-split': 'flag-filled',
  'three-split': 'loop',
  'kai-three-split': 'star-filled',
  'full-body': 'staff-filled',
  'custom': 'person'
}

const PLAN_COLOR_MAP = {
  'five-split': '#ef4444',
  'three-split': '#3b82f6',
  'full-body': '#10b981',
  'kai-three-split': '#a78bfa',
  'custom': '#f59e0b'
}

const PLAN_ICON_CLASS_MAP = {
  'five-split': 'icon-red',
  'three-split': 'icon-blue',
  'kai-three-split': 'icon-purple',
  'full-body': 'icon-green',
  'custom': 'icon-custom'
}

export { PLAN_ICON_MAP, PLAN_COLOR_MAP, PLAN_ICON_CLASS_MAP }

export const getPlanIcon = (type) => PLAN_ICON_MAP[type] || 'flag-filled'
export const getPlanColor = (type) => PLAN_COLOR_MAP[type] || '#2F6BFF'
export const getPlanIconClass = (type) => PLAN_ICON_CLASS_MAP[type] || 'icon-blue'

const getAuthHeaders = () => {
  const token = uni.getStorageSync('token') || `mock-jwt-token-${DEFAULT_USER_ID}`
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

export const useTrainingStore = defineStore('training', {
  state: () => ({
    list: [],
    listLoading: false,
    currentPlanId: null,

    activePlan: null,
    activePlanLoading: false,
    customPlans: [],
    exerciseProgress: {},
    workoutHistory: [],
    lastFetchTime: null,
    cacheExpiry: 300000,

    planDaysData: {},
    planDaysLoading: {},
    checkInLoading: {},
    checkInCooldown: {},
    createPlanLoading: false,

    // ── 引导式训练台（阶段 4）──
    /** 进行中的训练会话（内存态，页面驱动） */
    guidedSession: null,
    /** 上次读取到的草稿（进入训练台时用于"继续训练"提示） */
    guidedDraft: null
  }),

  getters: {
    currentPlan(state) {
      if (!state.currentPlanId) return state.list[0] || null
      return state.list.find(p => p.id === state.currentPlanId) || null
    },

    todayTraining(state) {
      const today = new Date().getDay()
      const index = (today - 1 + 7) % 7
      return state.list[index] || state.list[0]
    },

    weeklyStats(state) {
      const total = state.list.length
      const completed = state.list.filter(p => p.progress >= 100).length
      return {
        completed,
        total,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0
      }
    },

    // 新增 getters
    hasActivePlan(state) {
      return !!state.activePlan && state.activePlan.status === 'active'
    },

    activePlanProgress(state) {
      if (!state.activePlan) return 0
      return state.activePlan.totalProgress || 0
    },

    getExerciseCompletion(state) {
      return (planId, exerciseId) => {
        return state.exerciseProgress[planId]?.[exerciseId] || false
      }
    },

    getPlanDays(state) {
      return (planId) => {
        return state.planDaysData[planId] || null
      }
    },

    getPlanProgress(state) {
      return (planId) => {
        const data = state.planDaysData[planId]
        if (!data || !data.summary) return 0
        return data.summary.progress || 0
      }
    },

    isExerciseLoading(state) {
      return (planId, exerciseId) => {
        const key = `${planId}_${exerciseId}`
        return state.checkInLoading[key] || false
      }
    }
  },

  actions: {
    /**
     * 获取"我的训练"列表 - 显示用户激活的计划（带缓存）
     * @param {boolean} forceRefresh - 是否强制刷新（忽略缓存）
     */
    async fetchMyTraining(forceRefresh = false, silent = false) {
      const now = Date.now()
      const isCacheValid = this.lastFetchTime && (now - this.lastFetchTime) < this.cacheExpiry

      console.log('📊 fetchMyTraining 调用:', {
        forceRefresh,
        silent,
        lastFetchTime: this.lastFetchTime ? new Date(this.lastFetchTime).toLocaleTimeString() : null,
        cacheExpiry: this.cacheExpiry / 1000 + '秒',
        isCacheValid,
        currentListLength: this.list.length
      })

      if (!forceRefresh && isCacheValid && this.list.length > 0) {
        console.log('✅ 使用缓存数据，跳过请求 - 避免组件重建')
        return true
      }

      if (!silent) {
        this.listLoading = true
      }

      try {
        console.log('🔄 正在获取"我的训练"...')

        const res = await uni.request({
          url: `${API_BASE}/api/user-active-plan/active`,
          method: 'GET',
          header: getAuthHeaders(),
          timeout: 10000
        })

        console.log('API响应状态:', res.statusCode)
        console.log('API响应数据:', res.data)

        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          const activePlanData = res.data.data

          if (activePlanData) {
            const plan = activePlanData.plan || activePlanData
            
            const newList = [{
              id: plan.id,
              title: plan.name || '未命名计划',
              desc: plan.description ? 
                (plan.description.length > 20 ? plan.description.substring(0, 20) + '...' : plan.description) : 
                this._getTypeDescription(plan.type),
              type: plan.type,
              progress: activePlanData.progress || 0,
              count: activePlanData.totalExercises || this._getExerciseCountFromPlan(plan.id),
              color: this._getColorByType(plan.type),
              icon: this._getIconByType(plan.type),
              iconClass: getPlanIconClass(plan.type),
              isActive: true,
              startDate: activePlanData.start_date,
              status: activePlanData.status
            }]

            if (this._isSameList(this.list, newList)) {
              console.log('ℹ️ 数据未变化，保持原状态 - 不更新this.list')
              this.lastFetchTime = now
              if (!silent) this.listLoading = false
              if (!this.planDaysData[plan.id] && !this.planDaysLoading[plan.id]) {
                this.fetchPlanDays(plan.id, false)
                console.log('✅ planDaysData缺失，补拉训练日进度 - planId:', plan.id)
              }
              return true
            }

            console.log('⚠️ 数据发生变化，即将更新this.list - 这会触发组件重建！')
            
            this.list = newList
            this.activePlan = activePlanData
            this.lastFetchTime = now
            console.log('✅ this.list 已更新 - 新引用已赋值')

            await this.fetchPlanDays(plan.id, true)
            console.log('✅ 训练日进度已获取 - planId:', plan.id)

            if (!silent) this.listLoading = false
            return true
          } else {
            console.log('ℹ️ 当前无激活计划')
            this.list = []
            this.activePlan = null
            this.lastFetchTime = now
            if (!silent) this.listLoading = false
            return false
          }
        }

        throw new Error(res.data?.message || '获取失败')
      } catch (error) {
        console.error('❌ 获取"我的训练"失败:', error.message)
        
        this.list = []
        this.activePlan = null
        if (!silent) this.listLoading = false
        
        return false
      }
    },

    /**
     * 获取所有可用计划（用于系统推荐）
     */
    async fetchAllPlans() {
      try {
        const res = await uni.request({
          url: `${API_BASE}/api/training-plan/list`,
          method: 'GET',
          header: getAuthHeaders(),
          timeout: 10000
        })

        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          return res.data.data || []
        }
        
        return []
      } catch (error) {
        console.error('获取所有计划失败:', error.message)
        return []
      }
    },

    /**
     * 比较两个列表是否相同（避免不必要的组件重建）
     */
    _isSameList(oldList, newList) {
      if (oldList.length !== newList.length) return false
      
      return oldList.every((oldItem, index) => {
        const newItem = newList[index]
        return (
          oldItem.id === newItem.id &&
          oldItem.title === newItem.title &&
          oldItem.progress === newItem.progress
        )
      })
    },

    _getTypeDescription(type) {
      const descriptions = {
        'five-split': '经典五分化训练',
        'three-split': '推拉腿三分化',
        'full-body': '全身综合训练',
        'kai-three-split': '改良PPL分化'
      }
      return descriptions[type] || '系统训练计划'
    },

    _getExerciseCountFromPlan(planId) {
      const counts = { 1: 25, 2: 18, 3: 12, 4: 15, 5: 20 }
      return counts[planId] || 15
    },

    _getColorByType(type) {
      return PLAN_COLOR_MAP[type] || '#2F6BFF'
    },

    _getIconByType(type) {
      return PLAN_ICON_MAP[type] || 'flag-filled'
    },

    selectPlan(id) {
      this.currentPlanId = id
    },

    updateProgress(planId, value) {
      const plan = this.list.find(p => p.id === planId)
      if (plan) {
        plan.progress = Math.min(100, Math.max(0, value))
      }
    },

    // ========== 新增：用户激活计划管理 ==========

    /**
     * 获取当前用户的激活计划
     */
    async fetchActivePlan() {
      try {
        this.activePlanLoading = true
        
        const res = await uni.request({
          url: `${API_BASE}/api/user-active-plan/current`,
          method: 'GET'
        })

        if (res.data.code === 200 && res.data.data) {
          this.activePlan = res.data.data
          
          const planId = res.data.data.planId
          const planProgress = this.exerciseProgress[planId] || {}
          this.exerciseProgress = {
            ...this.exerciseProgress,
            [planId]: { ...planProgress }
          }
          
          return res.data.data
        } else {
          this.activePlan = null
          return null
        }
      } catch (error) {
        console.error('获取激活计划失败:', error)
        this.activePlan = null
        return null
      } finally {
        this.activePlanLoading = false
      }
    },

    /**
     * 激活一个训练计划（单计划模式）
     * @param {number} planId - 计划ID
     * @returns {Promise<Object>} 激活结果
     */
    async activatePlan(planId) {
      if (this.activePlanLoading) return null

      this.activePlanLoading = true
      try {
        const res = await uni.request({
          url: `${API_BASE}/api/user-active-plan/activate`,
          method: 'POST',
          data: { planId }
        })

        if (res.data.code === 200) {
          await this.fetchActivePlan()
          return res.data.data
        } else {
          throw new Error(res.data.msg || '激活失败')
        }
      } catch (error) {
        console.error('激活计划失败:', error)
        throw error
      } finally {
        this.activePlanLoading = false
      }
    },

    /**
     * 暂停当前激活的计划
     */
    async pausePlan() {
      try {
        if (!this.activePlan?.id) return

        const res = await uni.request({
          url: `${API_BASE}/api/user-active-plan/${this.activePlan.id}/pause`,
          method: 'PUT'
        })

        if (res.data.code === 200) {
          await this.fetchActivePlan()
          return true
        }
      } catch (error) {
        console.error('暂停计划失败:', error)
        throw error
      }
    },

    /**
     * 完成当前计划
     */
    async completePlan() {
      try {
        if (!this.activePlan?.id) return

        const res = await uni.request({
          url: `${API_BASE}/api/user-active-plan/${this.activePlan.id}/complete`,
          method: 'PUT'
        })

        if (res.data.code === 200) {
          await this.fetchActivePlan()
          return true
        }
      } catch (error) {
        console.error('完成计划失败:', error)
        throw error
      }
    },

    // ========== 训练进度管理 ==========

    async fetchPlanDays(planId, forceRefresh = false) {
      if (!planId) return null

      if (!forceRefresh && this.planDaysData[planId]) {
        return this.planDaysData[planId]
      }

      this.planDaysLoading = { ...this.planDaysLoading, [planId]: true }

      try {
        const res = await uni.request({
          url: `${API_BASE}/api/training-plan/${planId}/days`,
          method: 'GET',
          header: getAuthHeaders(),
          timeout: 10000
        })

        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          const data = res.data.data
          this.planDaysData = { ...this.planDaysData, [planId]: data }

          if (data && data.days) {
            this.exerciseProgress = {
              ...this.exerciseProgress,
              [planId]: data.days.reduce((acc, day) => {
                if (day.exercises) {
                  day.exercises.forEach(ex => {
                    acc[ex.id] = ex.isCompleted
                  })
                }
                return acc
              }, {})
            }
          }

          return data
        }

        return null
      } catch (error) {
        console.error('获取训练日数据失败:', error)
        return null
      } finally {
        this.planDaysLoading = { ...this.planDaysLoading, [planId]: false }
      }
    },

    async toggleCheckIn(planId, exerciseId, exerciseName) {
      const key = `${planId}_${exerciseId}`

      if (this.checkInLoading[key] || this.checkInCooldown[key]) {
        return 'throttled'
      }

      const isCurrentlyCompleted = this.exerciseProgress[planId]?.[exerciseId] || false

      this.checkInLoading = { ...this.checkInLoading, [key]: true }

      const safetyTimer = setTimeout(() => {
        if (this.checkInLoading[key]) {
          console.warn(`[防抖兜底] 打卡请求超时，强制释放锁: ${key}`)
          this.checkInLoading = { ...this.checkInLoading, [key]: false }
          this.checkInCooldown = { ...this.checkInCooldown, [key]: false }
        }
      }, 15000)

      try {
        let success = false

        if (isCurrentlyCompleted) {
          success = await this.syncExerciseUncomplete(planId, exerciseId)
        } else {
          success = await this.syncExerciseComplete(planId, exerciseId, exerciseName)
        }

        if (success) {
          const planProgress = this.exerciseProgress[planId] || {}
          this.exerciseProgress = {
            ...this.exerciseProgress,
            [planId]: { ...planProgress, [exerciseId]: !isCurrentlyCompleted }
          }

          if (this.planDaysData[planId] && this.planDaysData[planId].days) {
            const updatedDays = this.planDaysData[planId].days.map(day => {
              if (!day.exercises) return day
              const updatedExercises = day.exercises.map(ex => {
                if (ex.id === exerciseId) {
                  return { ...ex, isCompleted: !isCurrentlyCompleted }
                }
                return ex
              })
              const completedCount = updatedExercises.filter(ex => ex.isCompleted).length
              return {
                ...day,
                exercises: updatedExercises,
                completedCount,
                isDayComplete: completedCount === updatedExercises.length && updatedExercises.length > 0
              }
            })

            let totalExercises = 0
            let completedExercises = 0
            updatedDays.forEach(day => {
              totalExercises += day.exercises.length
              completedExercises += day.exercises.filter(ex => ex.isCompleted).length
            })

            this.planDaysData = {
              ...this.planDaysData,
              [planId]: {
                ...this.planDaysData[planId],
                days: updatedDays,
                summary: {
                  totalExercises,
                  completedExercises,
                  progress: totalExercises > 0 ? Math.round((completedExercises * 100.0) / totalExercises) : 0
                }
              }
            }
          }

          const plan = this.list.find(p => p.id === planId)
          if (plan && this.planDaysData[planId]) {
            plan.progress = this.planDaysData[planId].summary.progress
          }

          return !isCurrentlyCompleted
        }

        return 'error'
      } finally {
        clearTimeout(safetyTimer)
        this.checkInLoading = { ...this.checkInLoading, [key]: false }

        this.checkInCooldown = { ...this.checkInCooldown, [key]: true }
        setTimeout(() => {
          this.checkInCooldown = { ...this.checkInCooldown, [key]: false }
        }, 500)
      }
    },

    markExerciseComplete(planId, exerciseId, isCompleted, exerciseName) {
      const planProgress = this.exerciseProgress[planId] || {}
      this.exerciseProgress = {
        ...this.exerciseProgress,
        [planId]: { ...planProgress, [exerciseId]: isCompleted }
      }
      
      if (isCompleted) {
        this.syncExerciseComplete(planId, exerciseId, exerciseName)
      } else {
        this.syncExerciseUncomplete(planId, exerciseId)
      }
    },

    async syncExerciseComplete(planId, exerciseId, exerciseName) {
      try {
        const res = await uni.request({
          url: `${API_BASE}/api/training-plan/${planId}/exercises/${exerciseId}/complete`,
          method: 'POST',
          header: getAuthHeaders(),
          timeout: 8000,
          data: {
            exerciseName: exerciseName || '训练动作',
            duration: 300
          }
        })

        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          console.log(`[打卡同步] 计划${planId} 动作${exerciseId} 打卡成功`)
          return true
        } else {
          console.error('[打卡同步] 服务端返回异常:', res.data)
          return false
        }
      } catch (error) {
        console.error('打卡同步失败:', error)
        return false
      }
    },

    async syncExerciseUncomplete(planId, exerciseId) {
      try {
        const res = await uni.request({
          url: `${API_BASE}/api/training-plan/${planId}/exercises/${exerciseId}/complete`,
          method: 'DELETE',
          header: getAuthHeaders(),
          timeout: 8000
        })

        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          console.log(`[取消打卡同步] 计划${planId} 动作${exerciseId} 取消成功`)
          return true
        } else {
          console.error('[取消打卡同步] 服务端返回异常:', res.data)
          return false
        }
      } catch (error) {
        console.error('取消打卡同步失败:', error)
        return false
      }
    },

    /**
     * 开始训练某个动作
     */
    startTraining(planId, exercise) {
      console.log(`开始训练: ${exercise.name}`, { planId, exercise })
      
      // 可以在这里添加计时器、日志等逻辑
      // 或者跳转到专门的训练页面
    },

    // ========== 自定义计划管理 ==========

    /**
     * 获取用户自定义计划列表
     */
    async fetchCustomPlans() {
      try {
        const res = await uni.request({
          url: `${API_BASE}/api/training-plan/custom`,
          method: 'GET'
        })

        if (res.data.code === 200) {
          this.customPlans = res.data.data || []
        }
      } catch (error) {
        console.error('获取自定义计划失败:', error)
      }
    },

    /**
     * 创建新的自定义训练计划
     */
    async createCustomPlan(planData) {
      if (this.createPlanLoading) return null
      this.createPlanLoading = true

      try {
        const res = await uni.request({
          url: `${API_BASE}/api/training-plan/create-custom`,
          method: 'POST',
          data: planData
        })

        if (res.data.code === 200) {
          await this.fetchCustomPlans()
          return res.data.data
        } else {
          throw new Error(res.data.msg || '创建失败')
        }
      } catch (error) {
        console.error('创建自定义计划失败:', error)
        throw error
      } finally {
        this.createPlanLoading = false
      }
    },

    // ========== 引导式训练台：会话与草稿（阶段 4） ==========

    /** 设置/替换进行中的训练会话 */
    setGuidedSession(session) {
      this.guidedSession = session || null
      return this.guidedSession
    },

    /** 局部更新会话（页面每次操作后调用，保证草稿拿到最新状态） */
    updateGuidedSession(session) {
      this.guidedSession = session || this.guidedSession
      return this.guidedSession
    },

    /**
     * 写入草稿：切后台、退出页面、每完成一组都会调用。
     * 存储失败（配额/隐私模式）不抛出——草稿是兜底能力，不能反过来弄崩训练。
     */
    saveGuidedDraft(session = null) {
      const target = session || this.guidedSession
      if (!target || !Array.isArray(target.exercises)) return false
      const payload = { v: 1, savedAt: Date.now(), session: target }
      try {
        uni.setStorageSync(GUIDED_DRAFT_KEY, JSON.stringify(payload))
        this.guidedDraft = payload
        return true
      } catch (error) {
        console.warn('[TrainingStore] 草稿保存失败:', error && error.message)
        return false
      }
    },

    /** 读取草稿；过期、损坏、形态不对一律返回 null（并顺手清掉） */
    loadGuidedDraft(now = Date.now()) {
      let raw = null
      try {
        raw = uni.getStorageSync(GUIDED_DRAFT_KEY)
      } catch (error) {
        return null
      }
      if (!raw) return null
      let parsed = null
      try {
        parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      } catch (error) {
        this.clearGuidedDraft()
        return null
      }
      const session = parsed && parsed.session
      if (!session || !Array.isArray(session.exercises) || !session.exercises.length) {
        this.clearGuidedDraft()
        return null
      }
      if (parsed.savedAt && now - parsed.savedAt > GUIDED_DRAFT_TTL) {
        this.clearGuidedDraft()
        return null
      }
      this.guidedDraft = parsed
      return parsed
    },

    /** 清除草稿（保存成功、用户放弃训练时调用） */
    clearGuidedDraft() {
      this.guidedDraft = null
      try {
        uni.removeStorageSync(GUIDED_DRAFT_KEY)
      } catch (error) {
        // 存储不可用时忽略：内存态已清空
      }
    },

    /** 结束训练台：清空会话与草稿 */
    resetGuidedSession() {
      this.guidedSession = null
      this.clearGuidedDraft()
    },

    // ========== 工具方法 ==========

    /**
     * 重置所有状态
     */
    resetState() {
      this.activePlan = null
      this.activePlanLoading = false
      this.customPlans = []
      this.exerciseProgress = {}
      this.workoutHistory = []
      this.resetGuidedSession()
    },

    /**
     * 初始化 Store（应用启动时调用）
     */
    async initialize() {
      console.log('[TrainingStore] 初始化...')
      
      try {
        // 并行加载多个数据源
        await Promise.all([
          this.fetchActivePlan(),
          this.fetchCustomPlans()
        ])
        
        console.log('[TrainingStore] 初始化完成', {
          hasActivePlan: !!this.activePlan,
          customPlansCount: this.customPlans.length
        })
      } catch (error) {
        console.error('[TrainingStore] 初始化失败:', error)
      }
    }
  }
})
