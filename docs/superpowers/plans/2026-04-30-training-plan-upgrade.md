# 训练计划页升级版实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 引入 Pinia 状态管理，新增 AppIcon/ProgressIcon/TrainingCard 动态组件体系，与现有已美化组件渐进融合。

**架构：** Pinia Store 作为统一数据源，新组件（AppIcon → ProgressIcon → TrainingCard）形成层级复用链，现有组件保留不变，页面层通过 Store 桥接新旧组件。

**技术栈：** Vue3 + Pinia + uni-app + Canvas API

---

## 文件结构

| 操作 | 文件路径 | 职责 |
|------|---------|------|
| 修改 | `fitness-app/package.json` | 添加 pinia 依赖 |
| 修改 | `fitness-app/main.js` | 注册 Pinia 插件 |
| 创建 | `fitness-app/stores/training.js` | 训练计划 Pinia Store |
| 创建 | `fitness-app/components/AppIcon.vue` | 动态图标组件 |
| 创建 | `fitness-app/components/ProgressIcon.vue` | 进度联动图标组件 |
| 创建 | `fitness-app/components/TrainingCard.vue` | 训练卡片组件 |
| 修改 | `fitness-app/pages/knowledge/training-plan-list.vue` | 整合 TrainingCard + Store |
| 修改 | `fitness-app/pages/knowledge/training-plan-detail.vue` | 整合 AppIcon + CTA 流动动效 |

---

### 任务 1：安装 Pinia 并配置

**文件：**
- 修改：`fitness-app/package.json`
- 修改：`fitness-app/main.js`

- [ ] **步骤 1：安装 pinia 依赖**

运行：`cd d:\softWare\develop\app-myself\fitness\fitness-app && npm install pinia`

- [ ] **步骤 2：在 main.js 中注册 Pinia**

将 `fitness-app/main.js` 的 Vue3 分支修改为：

```js
// #ifdef VUE3
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  app.use(pinia)
  return {
    app
  }
}
// #endif
```

- [ ] **步骤 3：验证安装**

运行：`cd d:\softWare\develop\app-myself\fitness\fitness-app && npm run dev:mp-weixin`
预期：项目正常启动，无 Pinia 相关报错

---

### 任务 2：创建 Pinia Store

**文件：**
- 创建：`fitness-app/stores/training.js`
- 依赖：`fitness-app/data/training-plans.js`

- [ ] **步骤 1：创建 Store 文件**

创建 `fitness-app/stores/training.js`：

```js
import { defineStore } from 'pinia'
import { presetPlans } from '@/data/training-plans.js'

export const useTrainingStore = defineStore('training', {
  state: () => ({
    list: [],
    currentPlanId: null,
    dailyProgress: {}
  }),

  getters: {
    currentPlan(state) {
      if (!state.currentPlanId) return state.list[0] || null
      return state.list.find(p => p.id === state.currentPlanId) || null
    },

    todayTraining(state) {
      const plan = this.currentPlan
      if (!plan || !plan.days) return null
      const today = new Date().getDay()
      const dayIndex = today === 0 ? 6 : today - 1
      const day = plan.days[dayIndex]
      if (!day) return null
      return {
        id: day.id || `day-${dayIndex}`,
        title: day.name || `第${dayIndex + 1}天`,
        desc: day.focus || '',
        icon: 'staff-filled',
        color: '#2F6BFF',
        progress: state.dailyProgress[day.id || `day-${dayIndex}`] || 0,
        count: day.exercises ? day.exercises.length : 0
      }
    },

    weeklyStats(state) {
      const plan = this.currentPlan
      if (!plan || !plan.days) return { completed: 0, total: 0, percent: 0 }
      const total = plan.days.length
      const completed = plan.days.filter(d => {
        const p = state.dailyProgress[d.id] || 0
        return p >= 100
      }).length
      return {
        completed,
        total,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0
      }
    }
  },

  actions: {
    fetchPlans() {
      this.list = [...presetPlans]
    },

    selectPlan(id) {
      this.currentPlanId = id
    },

    updateProgress(dayKey, value) {
      this.dailyProgress[dayKey] = Math.min(100, Math.max(0, value))
    }
  }
})
```

- [ ] **步骤 2：验证 Store 可导入**

在任意页面临时添加 `import { useTrainingStore } from '@/stores/training'`，确认无编译错误

---

### 任务 3：创建 AppIcon 动态图标组件

**文件：**
- 创建：`fitness-app/components/AppIcon.vue`

- [ ] **步骤 1：创建 AppIcon.vue**

创建 `fitness-app/components/AppIcon.vue`：

```vue
<template>
  <view
    class="icon-wrap"
    :class="[animateClass]"
    @touchstart="onPress"
    @touchend="onRelease"
  >
    <uni-icons
      :type="name"
      :size="iconSize"
      :color="active ? activeColor : '#6B7280'"
    ></uni-icons>
  </view>
</template>

<script>
export default {
  name: 'AppIcon',
  props: {
    name: {
      type: String,
      default: ''
    },
    active: {
      type: Boolean,
      default: false
    },
    progress: {
      type: Number,
      default: 0
    },
    size: {
      type: Number,
      default: 48
    },
    activeColor: {
      type: String,
      default: '#2F6BFF'
    }
  },
  data() {
    return {
      pressing: false
    }
  },
  computed: {
    iconSize() {
      return Math.round(this.size * 0.55)
    },
    animateClass() {
      return {
        'is-active': this.active,
        'is-press': this.pressing
      }
    }
  },
  methods: {
    onPress() {
      this.pressing = true
    },
    onRelease() {
      this.pressing = false
    }
  }
}
</script>

<style scoped>
.icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  animation: breathe 3s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.08);
    opacity: 1;
  }
}

.is-press {
  transform: scale(0.88) !important;
  animation: none;
}

.is-active {
  filter: drop-shadow(0 0 12rpx currentColor);
}
</style>
```

---

### 任务 4：创建 ProgressIcon 进度联动图标组件

**文件：**
- 创建：`fitness-app/components/ProgressIcon.vue`
- 依赖：`fitness-app/components/AppIcon.vue`

- [ ] **步骤 1：创建 ProgressIcon.vue**

创建 `fitness-app/components/ProgressIcon.vue`：

```vue
<template>
  <view class="wrap" :style="{ width: wrapSize + 'rpx', height: wrapSize + 'rpx' }">
    <canvas
      :canvas-id="canvasId"
      :id="canvasId"
      class="canvas"
      :style="{ width: wrapSize + 'rpx', height: wrapSize + 'rpx' }"
    ></canvas>
    <view class="center">
      <AppIcon
        :name="icon"
        :active="progress >= 100"
        :size="iconWrapSize"
        :active-color="color"
      />
    </view>
  </view>
</template>

<script>
import AppIcon from './AppIcon.vue'

export default {
  name: 'ProgressIcon',
  components: { AppIcon },
  props: {
    progress: {
      type: Number,
      default: 0
    },
    color: {
      type: String,
      default: '#2F6BFF'
    },
    icon: {
      type: String,
      default: 'staff-filled'
    },
    size: {
      type: Number,
      default: 80
    }
  },
  data() {
    return {
      canvasId: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      currentProgress: 0
    }
  },
  computed: {
    wrapSize() {
      return this.size
    },
    iconWrapSize() {
      return Math.round(this.size * 0.5)
    }
  },
  watch: {
    progress(newVal) {
      this.animateTo(newVal)
    }
  },
  mounted() {
    this.$nextTick(() => {
      setTimeout(() => {
        this.animateTo(this.progress)
      }, 200)
    })
  },
  methods: {
    animateTo(target) {
      const start = this.currentProgress
      const startTime = performance.now()
      const duration = 800

      const step = (now) => {
        const elapsed = now - startTime
        const t = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - t, 4)
        this.currentProgress = start + (target - start) * eased
        this.drawRing(this.currentProgress)
        if (t < 1) {
          requestAnimationFrame(step)
        } else {
          this.currentProgress = target
          this.drawRing(target)
        }
      }

      requestAnimationFrame(step)
    },

    drawRing(p) {
      try {
        const ctx = uni.createCanvasContext(this.canvasId, this)
        const s = this.size / 2
        const radius = Math.max(1, s - 8)
        const px = s
        const py = s

        ctx.clearRect(0, 0, this.size, this.size)

        ctx.setStrokeStyle('rgba(255,255,255,0.15)')
        ctx.setLineWidth(6)
        ctx.setLineCap('round')
        ctx.beginPath()
        ctx.arc(px, py, radius, 0, 2 * Math.PI)
        ctx.stroke()

        if (p > 0.5) {
          ctx.setStrokeStyle(this.color)
          ctx.setLineWidth(6)
          ctx.setLineCap('round')
          ctx.beginPath()
          ctx.arc(px, py, radius, -Math.PI / 2, -Math.PI / 2 + (2 * Math.PI * p / 100))
          ctx.stroke()
        }

        ctx.draw(false, () => {})
      } catch (e) {
        console.warn('ProgressIcon draw error:', e)
      }
    }
  }
}
</script>

<style scoped>
.wrap {
  position: relative;
}

.canvas {
  position: absolute;
  top: 0;
  left: 0;
}

.center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
```

---

### 任务 5：创建 TrainingCard 训练卡片组件

**文件：**
- 创建：`fitness-app/components/TrainingCard.vue`
- 依赖：`fitness-app/components/ProgressIcon.vue`

- [ ] **步骤 1：创建 TrainingCard.vue**

创建 `fitness-app/components/TrainingCard.vue`：

```vue
<template>
  <view
    class="card fade-up"
    :style="{ animationDelay: delay }"
  >
    <view class="bar" :style="{ background: barGradient }"></view>

    <view class="left">
      <ProgressIcon
        :progress="item.progress"
        :color="item.color || '#2F6BFF'"
        :icon="item.icon || 'staff-filled'"
        :size="80"
      />
      <view class="info">
        <text class="title">{{ item.title }}</text>
        <text class="desc">{{ item.desc }}</text>
      </view>
    </view>

    <view class="right">
      <text class="count">{{ item.count }}个动作</text>
      <view v-if="item.progress >= 100" class="status done">
        <text class="status-text done-text">&#10003; 完成</text>
      </view>
      <view v-else-if="item.progress > 0" class="status doing">
        <text class="status-text doing-text">进行中</text>
      </view>
    </view>
  </view>
</template>

<script>
import ProgressIcon from './ProgressIcon.vue'

export default {
  name: 'TrainingCard',
  components: { ProgressIcon },
  props: {
    item: {
      type: Object,
      default: () => ({})
    },
    index: {
      type: Number,
      default: 0
    }
  },
  computed: {
    delay() {
      return `${0.2 + this.index * 0.05}s`
    },
    barGradient() {
      return `linear-gradient(180deg, ${this.item.color || '#2F6BFF'}, transparent)`
    }
  }
}
</script>

<style scoped>
.card {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 20rpx;
  opacity: 0;
  animation: fadeUp 0.6s forwards;
}

.bar {
  position: absolute;
  left: 0;
  top: 20rpx;
  bottom: 20rpx;
  width: 6rpx;
  border-radius: 3rpx;
}

.left {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
  min-width: 0;
  padding-left: 12rpx;
}

.info {
  flex: 1;
  min-width: 0;
}

.title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1d29;
  line-height: 1.3;
}

.desc {
  display: block;
  font-size: 22rpx;
  color: #9aa3af;
  margin-top: 4rpx;
}

.right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
  flex-shrink: 0;
}

.count {
  font-size: 22rpx;
  color: #9aa3af;
}

.status {
  padding: 4rpx 16rpx;
  border-radius: 12rpx;
}

.status.done {
  background: rgba(52, 199, 89, 0.1);
}

.status.doing {
  background: rgba(47, 107, 255, 0.1);
}

.status-text {
  font-size: 22rpx;
  font-weight: 600;
}

.done-text {
  color: #34C759;
}

.doing-text {
  color: #2F6BFF;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(24rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
```

---

### 任务 6：整合 TrainingCard 到列表页

**文件：**
- 修改：`fitness-app/pages/knowledge/training-plan-list.vue`

- [ ] **步骤 1：在 training-plan-list.vue 中导入 Store 和 TrainingCard**

在 `<script>` 部分添加导入：

```js
import { useTrainingStore } from '@/stores/training'
import TrainingCard from '@/components/TrainingCard.vue'
```

在 `data()` 或 `setup` 中初始化 Store：

```js
const store = useTrainingStore()
```

在 `onLoad` 或 `onShow` 生命周期中调用 `store.fetchPlans()`。

- [ ] **步骤 2：在模板中添加"今日训练"区域**

在 Hero Banner 和"系统推荐"section 之间，添加：

```html
<view class="section" v-if="store.todayTraining">
  <view class="section-header">
    <view class="section-title-wrap">
      <view class="section-indicator"></view>
      <text class="section-title">今日训练</text>
    </view>
  </view>
  <TrainingCard
    :item="store.todayTraining"
    :index="0"
  />
</view>
```

- [ ] **步骤 3：验证页面渲染**

运行项目，确认列表页显示"今日训练"区域，TrainingCard 正常渲染

---

### 任务 7：整合 AppIcon 到详情页 + CTA 流动动效

**文件：**
- 修改：`fitness-app/pages/knowledge/training-plan-detail.vue`

- [ ] **步骤 1：导入 AppIcon**

```js
import AppIcon from '@/components/AppIcon.vue'
```

注册组件。

- [ ] **步骤 2：替换 Header 按钮图标**

将返回按钮的 `<uni-icons type="left">` 替换为：

```html
<AppIcon name="left" :size="48" active-color="#2F6BFF" />
```

将更多按钮的 `<uni-icons type="more-filled">` 替换为：

```html
<AppIcon name="more-filled" :size="48" active-color="#6B7280" />
```

- [ ] **步骤 3：添加 CTA 渐变流动动画**

在 `.btn-cta` 样式中，将 `background-size: 200% 200%` 和 `animation: gradientMove 4s ease infinite` 替换为：

```css
.btn-cta {
  background: linear-gradient(270deg, #2F6BFF, #8A5CFF, #2F6BFF);
  background-size: 300% 300%;
  animation: flow 6s infinite;
}

@keyframes flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

- [ ] **步骤 4：验证详情页渲染**

运行项目，确认详情页 AppIcon 呼吸动画正常，CTA 按钮渐变流动

---

### 任务 8：最终验证

- [ ] **步骤 1：完整流程测试**

1. 打开训练计划列表页 → 确认"今日训练"区域显示 TrainingCard
2. 点击进入详情页 → 确认 AppIcon 呼吸动画 + CTA 流动效果
3. 返回列表页 → 确认无报错、无白屏

- [ ] **步骤 2：检查 Pinia Store 数据流**

在浏览器 DevTools 或微信开发者工具中确认 Store 状态正常：
- `store.list` 有数据
- `store.currentPlan` 正确
- `store.todayTraining` 返回今日训练

- [ ] **步骤 3：Commit**

```bash
git add -A
git commit -m "feat: 引入Pinia状态管理 + 新增AppIcon/ProgressIcon/TrainingCard动态组件体系"
```
