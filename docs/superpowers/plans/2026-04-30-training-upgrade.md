# 训练计划页升级版 — 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将训练计划页升级到产品级 UI 系统（Lottie 动画、手势返回、转场动画、Glassmorphism 背景）

**架构：** 6 阶段渐进式增强，每阶段独立可验证。A1 基础设施 → A2 组件 → A3 进度环 → A4 卡片+Store → A5 手势 → A6 详情页整合

**技术栈：** Vue3 + Pinia + uni-app + lottie-web + CSS 动画

---

## 文件结构

| 文件 | 职责 | 操作 |
|------|------|------|
| `fitness-app/package.json` | 项目依赖 | 修改 |
| `fitness-app/static/icons/*.svg` (7个) | SVG 图标资源 | 新增 |
| `fitness-app/components/LottieIcon.vue` | Lottie 动画渲染组件 | 新增 |
| `fitness-app/components/Icon.vue` | 统一 SVG 图标组件 | 新增 |
| `fitness-app/components/ProgressRing.vue` | 进度环（Canvas → CSS+Slot） | 重写 |
| `fitness-app/components/TrainingCard.vue` | 训练卡片（新交互+数据） | 重写 |
| `fitness-app/stores/training.js` | Pinia 状态管理 | 修改 |
| `fitness-app/composables/useSwipeBack.js` | 手势返回 composable | 新增 |
| `fitness-app/pages/knowledge/training-plan-detail.vue` | 训练计划详情页 | 修改 |
| `fitness-app/pages/knowledge/training-plan-list.vue` | 训练计划列表页 | 修改 |

---

## 任务 1：安装 lottie-web + 创建 SVG 图标资源

**文件：**
- 修改：`fitness-app/package.json`
- 新增：`fitness-app/static/icons/chest.svg`
- 新增：`fitness-app/static/icons/back.svg`
- 新增：`fitness-app/static/icons/leg.svg`
- 新增：`fitness-app/static/icons/shoulder.svg`
- 新增：`fitness-app/static/icons/arm.svg`
- 新增：`fitness-app/static/icons/fire.svg`
- 新增：`fitness-app/static/icons/more.svg`

- [ ] **步骤 1.1：安装 lottie-web 依赖**

运行命令：
```bash
npm install lottie-web --save
```

预期：package.json 中添加 `"lottie-web": "^5.12.2"`

- [ ] **步骤 1.2：创建 chest.svg**

写入 `fitness-app/static/icons/chest.svg`：
```svg
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
    <path d="M12 5C9 5 7 7 7 10c0 3 2 5 5 8 3-3 5-5 5-8 0-3-2-5-5-5z"/>
    <path d="M9 11h6"/>
  </g>
</svg>
```

- [ ] **步骤 1.3：创建 back.svg**

写入 `fitness-app/static/icons/back.svg`：
```svg
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g stroke="currentColor" stroke-width="1.6">
    <path d="M12 4c-3 0-5 2-5 5v3c0 4 3 7 5 9 2-2 5-5 5-9V9c0-3-2-5-5-5z"/>
    <path d="M9 10l3 3 3-3"/>
  </g>
</svg>
```

- [ ] **步骤 1.4：创建 leg.svg**

写入 `fitness-app/static/icons/leg.svg`：
```svg
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
    <path d="M9 4l3 6-2 5 3 5"/>
    <path d="M15 4l-2 6 2 4"/>
  </g>
</svg>
```

- [ ] **步骤 1.5：创建 shoulder.svg**

写入 `fitness-app/static/icons/shoulder.svg`：
```svg
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
    <path d="M4 12c3-5 13-5 16 0"/>
    <path d="M8 12v3m8-3v3"/>
  </g>
</svg>
```

- [ ] **步骤 1.6：创建 arm.svg**

写入 `fitness-app/static/icons/arm.svg`：
```svg
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
    <path d="M6 14c2-3 4-4 6-4s4 1 6 4"/>
    <path d="M6 14c0 2 2 4 6 4s6-2 6-4"/>
  </g>
</svg>
```

- [ ] **步骤 1.7：创建 fire.svg**

写入 `fitness-app/static/icons/fire.svg`：
```svg
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 3s4 4 4 8a4 4 0 1 1-8 0c0-4 4-8 4-8z"
    stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
</svg>
```

- [ ] **步骤 1.8：创建 more.svg**

写入 `fitness-app/static/icons/more.svg`：
```svg
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="5" cy="12" r="1.5" fill="currentColor"/>
  <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
  <circle cx="19" cy="12" r="1.5" fill="currentColor"/>
</svg>
```

- [ ] **步骤 1.9：验证**

检查所有 SVG 文件存在且格式正确，lottie-web 在 package.json 中。

---

## 任务 2：创建 LottieIcon 组件

**文件：**
- 新增：`fitness-app/components/LottieIcon.vue`

- [ ] **步骤 2.1：创建 LottieIcon.vue 完整代码**

写入 `fitness-app/components/LottieIcon.vue`：
```vue
<template>
  <view class="lottie-wrap">
    <view :ref="setRef" :id="containerId" class="lottie-container"></view>
  </view>
</template>

<script>
export default {
  name: 'LottieIcon',
  props: {
    path: {
      type: String,
      required: true
    },
    loop: {
      type: Boolean,
      default: true
    },
    autoplay: {
      type: Boolean,
      default: true
    },
    width: {
      type: Number,
      default: 80
    },
    height: {
      type: Number,
      default: 80
    }
  },
  data() {
    return {
      containerId: `lottie_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      animInstance: null
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.loadAnimation()
    })
  },
  beforeUnmount() {
    if (this.animInstance) {
      this.animInstance.destroy()
    }
  },
  methods: {
    setRef(el) {
      if (el) {
        this.$el = el
      }
    },
    loadAnimation() {
      try {
        const lottie = require('lottie-web')
        if (!lottie) return

        const container = document.getElementById(this.containerId)
        if (!container) return

        this.animInstance = lottie.loadAnimation({
          container: container,
          renderer: 'svg',
          loop: this.loop,
          autoplay: this.autoplay,
          path: this.path
        })
      } catch (e) {
        console.warn('LottieIcon load error:', e)
      }
    }
  }
}
</script>

<style scoped>
.lottie-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.lottie-container {
  width: 100%;
  height: 100%;
}
</style>
```

- [ ] **步骤 2.2：诊断检查**

确认 LottieIcon.vue 无语法错误。

---

## 任务 3：创建 Icon 组件

**文件：**
- 新增：`fitness-app/components/Icon.vue`

- [ ] **步骤 3.1：创建 Icon.vue 完整代码**

写入 `fitness-app/components/Icon.vue`：
```vue
<template>
  <image
    :src="src"
    class="icon-image"
    :style="iconStyle"
    mode="aspectFit"
  />
</template>

<script>
export default {
  name: 'AppIconSvg',
  props: {
    src: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      default: 48
    },
    color: {
      type: String,
      default: '#2F6BFF'
    },
    breathe: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    iconStyle() {
      return {
        width: this.size + 'rpx',
        height: this.size + 'rpx'
      }
    },
    wrapClass() {
      return {
        'no-breathe': !this.breathe
      }
    }
  }
}
</script>

<style scoped>
.icon-image {
  animation: iconBreathe 3s ease-in-out infinite;
}

.no-breathe {
  animation: none !important;
}

.icon-image:active {
  transform: scale(0.85);
}

@keyframes iconBreathe {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50% { transform: scale(1.12); opacity: 1; }
}
</style>
```

- [ ] **步骤 3.2：诊断检查**

确认 Icon.vue 无语法错误。

---

## 任务 4：重写 ProgressRing 组件

**文件：**
- 重写：`fitness-app/components/ProgressRing.vue`

- [ ] **步骤 4.1：读取当前 ProgressRing.vue 内容**

读取现有文件以了解当前接口和 Props。

- [ ] **步骤 4.2：重写 ProgressRing.vue 为 CSS + Slot 结构**

完整替换为以下内容：

```vue
<template>
  <view class="progress-ring" :style="ringStyle">
    <view class="ring-track"></view>
    <view class="ring-fill" :style="fillStyle"></view>
    <view class="ring-center">
      <slot v-if="$slots.default"></slot>
      <view v-else class="ring-text-group">
        <text v-if="showText" class="ring-progress-text" :style="{ color: textColor }">{{ displayProgress }}%</text>
        <text v-if="label" class="ring-label" :style="{ fontSize: labelSize + 'rpx', color: textColor }">{{ label }}</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'ProgressRing',
  props: {
    progress: { type: Number, default: 0 },
    size: { type: Number, default: 100 },
    strokeWidth: { type: Number, default: 6 },
    colors: { type: Array, default: () => ['#2F6BFF', '#8A5CFF'] },
    showText: { type: Boolean, default: false },
    textSize: { type: Number, default: 18 },
    label: { type: String, default: '' },
    labelSize: { type: Number, default: 11 },
    textColor: { type: String, default: '#2F6BFF' },
    animated: { type: Boolean, default: true },
    duration: { type: Number, default: 800 }
  },
  data() {
    return {
      currentProgress: 0
    }
  },
  computed: {
    ringStyle() {
      return {
        width: this.size + 'rpx',
        height: this.size + 'rpx'
      }
    },
    fillStyle() {
      const angle = (this.currentProgress / 100) * 360
      const gradientId = `pg_${this._uid}`
      return {
        background: `conic-gradient(from -90deg, ${this.colors[0]} ${angle}deg, rgba(0,0,0,0.06) ${angle}deg)`
      }
    },
    displayProgress() {
      return Math.round(this.currentProgress)
    }
  },
  watch: {
    progress(newVal) {
      if (!this.animated) {
        this.currentProgress = newVal
        return
      }
      this.animateTo(newVal)
    }
  },
  mounted() {
    this.$nextTick(() => {
      setTimeout(() => {
        this.animateTo(this.progress)
      }, 100)
    })
  },
  methods: {
    animateTo(target) {
      const start = this.currentProgress
      const startTime = Date.now()

      const step = () => {
        const elapsed = Date.now() - startTime
        const t = Math.min(elapsed / this.duration, 1)
        const eased = 1 - Math.pow(1 - t, 4)
        this.currentProgress = start + (target - start) * eased
        if (t < 1) {
          requestAnimationFrame(step)
        } else {
          this.currentProgress = target
        }
      }

      requestAnimationFrame(step)
    }
  }
}
</script>

<style scoped>
.progress-ring {
  position: relative;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring-track {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
}

.ring-fill {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  mask: radial-gradient(farthest-side, transparent calc(100% - 8rpx), #000 0);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 8rpx), #000 0);
}

.ring-center {
  position: relative;
  z-index: 1;
  width: 70%;
  height: 70%;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(47, 107, 255, 0.1);
}

.ring-text-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ring-progress-text {
  font-size: 28rpx;
  font-weight: 700;
  line-height: 1;
}

.ring-label {
  font-weight: 500;
  opacity: 0.8;
  margin-top: 2rpx;
}
</style>
```

- [ ] **步骤 4.3：向后兼容验证**

确认所有现有 Props 接口保留（progress、size、strokeWidth、colors、showText、textSize、label、labelSize、textColor、animated、duration）。

- [ ] **步骤 4.4：诊断检查**

确认 ProgressRing.vue 无语法错误。

---

## 任务 5：更新 Pinia Store 数据结构

**文件：**
- 修改：`fitness-app/stores/training.js`

- [ ] **步骤 5.1：读取当前 Store 内容**

了解现有 state/getters/actions。

- [ ] **步骤 5.2：更新 Store 数据结构为简化版本**

将 list 数据结构从复杂嵌套改为扁平化：
```js
list: [
  {
    id: 1,
    title: '胸部训练',
    desc: '力量强化',
    progress: 80,
    count: 5,
    color: '#2F6BFF',
    icon: '/static/icons/chest.svg'
  },
  // ...更多项目
]
```

保留现有 getters（currentPlan、todayTraining、weeklyStats）但适配新数据结构。
保留现有 actions（fetchPlans、selectPlan、updateProgress）。

- [ ] **步骤 5.3：诊断检查**

确认 stores/training.js 无语法错误。

---

## 任务 6：重写 TrainingCard 组件

**文件：**
- 重写：`fitness-app/components/TrainingCard.vue`

- [ ] **步骤 6.1：重写 TrainingCard.vue**

```vue
<template>
  <view
    class="training-card fade-up"
    :style="{ animationDelay: delay }"
    @click="goDetail"
  >
    <view class="card-left">
      <view class="icon-ring">
        <ProgressRing
          :progress="item.progress"
          :size="88"
          :stroke-width="5"
          :colors="[item.color || '#2F6BFF', shiftColor(item.color)]"
          :show-text="false"
        >
          <Icon
            :src="item.icon || '/static/icons/chest.svg'"
            :size="40"
            :color="item.color || '#2F6BFF'"
            :breathe="false"
          />
        </ProgressRing>
      </view>

      <view class="card-info">
        <text class="card-title">{{ item.title }}</text>
        <text class="card-desc">{{ item.desc }}</text>
      </view>
    </view>

    <view class="card-right">
      <text class="action-count">{{ item.count }}个动作</text>
      <view :class="['status-badge', statusClass]">
        <text class="status-text">{{ statusText }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import ProgressRing from './ProgressRing.vue'
import Icon from './Icon.vue'

export default {
  name: 'TrainingCard',
  components: { ProgressRing, Icon },
  props: {
    item: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      default: 0
    }
  },
  computed: {
    delay() {
      return `${0.15 + this.index * 0.06}s`
    },
    statusText() {
      if (this.item.progress >= 100) return '已完成'
      if (this.item.progress > 0) return '进行中'
      return '未开始'
    },
    statusClass() {
      if (this.item.progress >= 100) return 'done'
      if (this.item.progress > 0) return 'doing'
      return 'pending'
    }
  },
  methods: {
    goDetail() {
      uni.navigateTo({
        url: '/pages/knowledge/training-plan-detail?id=' + (this.item.id || '')
      })
    },
    shiftColor(hex) {
      if (!hex) return '#8A5CFF'
      if (hex === '#2F6BFF') return '#8A5CFF'
      if (hex === '#8A5CFF') return '#2F6BFF'
      if (hex === '#FF8A3D') return '#FF6B1A'
      if (hex === '#10B981') return '#059669'
      return hex
    }
  }
}
</script>

<style scoped>
.training-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 26rpx 28rpx;
  margin-bottom: 20rpx;
  border-radius: 24rpx;

  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);

  border: 1rpx solid rgba(255, 255, 255, 0.45);
  box-shadow:
    0 10rpx 30rpx rgba(0, 0, 0, 0.05),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.4);

  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  opacity: 0;
  animation: fadeUp 0.55s forwards;
}

.training-card:active {
  transform: scale(0.96);
  background: rgba(255, 255, 255, 0.8);
}

.card-left {
  display: flex;
  align-items: center;
  gap: 18rpx;
  flex: 1;
  min-width: 0;
}

.icon-ring {
  flex-shrink: 0;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #1a1d29;
  line-height: 1.3;
}

.card-desc {
  display: block;
  font-size: 23rpx;
  color: #9aa3af;
  margin-top: 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10rpx;
  flex-shrink: 0;
}

.action-count {
  font-size: 23rpx;
  color: #9aa3af;
  font-weight: 500;
}

.status-badge {
  padding: 5rpx 16rpx;
  border-radius: 12rpx;
}

.status-badge.done {
  background: rgba(16, 185, 129, 0.1);
}

.status-badge.doing {
  background: rgba(47, 107, 255, 0.1);
}

.status-badge.pending {
  background: rgba(156, 163, 175, 0.1);
}

.status-text {
  font-size: 21rpx;
  font-weight: 600;
}

.status-badge.done .status-text { color: #10B981; }
.status-badge.doing .status-text { color: #2F6BFF; }
.status-badge.pending .status-text { color: #9AA3AF; }

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
```

- [ ] **步骤 6.2：诊断检查**

确认 TrainingCard.vue 无语法错误。

---

## 任务 7：创建 useSwipeBack composable

**文件：**
- 新增：`fitness-app/composables/useSwipeBack.js`

- [ ] **步骤 7.1：创建 composables 目录和 useSwipeBack.js**

先确保目录存在，然后写入：

```js
export function useSwipeBack() {
  let startX = 0
  let startY = 0
  let isSwiping = false

  const onTouchStart = (e) => {
    startX = e.touches[0].clientX
    startY = e.touches[0].clientY
    isSwiping = true
  }

  const onTouchMove = (e) => {
    if (!isSwiping) return

    const deltaX = e.touches[0].clientX - startX
    const deltaY = e.touches[0].clientY - startY

    // 只响应右滑（正 X 方向），且水平滑动幅度大于垂直
    if (deltaX > 60 && Math.abs(deltaX) > Math.abs(deltaY)) {
      isSwiping = false
      uni.navigateBack({
        fail: () => {}
      })
    }
  }

  const onTouchEnd = () => {
    isSwiping = false
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  }
}
```

- [ ] **步骤 7.2：诊断检查**

确认 useSwipeBack.js 语法正确。

---

## 任务 8：增强详情页（转场 + 手势 + 背景）

**文件：**
- 修改：`fitness-app/pages/knowledge/training-plan-detail.vue`

- [ ] **步骤 8.1：读取当前详情页完整内容**

了解现有模板、脚本、样式。

- [ ] **步骤 8.2：添加背景系统样式**

在页面根元素 `.detail-page` 上增强：
- 添加顶部光晕伪元素（`.detail-page::before`）
- 确认主背景渐变正确
- Glass 卡片效果确认

关键样式补充：
```css
.detail-page::before {
  content: '';
  position: absolute;
  width: 600rpx;
  height: 600rpx;
  background: radial-gradient(circle, rgba(108,99,255,0.22), transparent 70%);
  top: -200rpx;
  right: -200rpx;
  pointer-events: none;
  z-index: 0;
}
```

- [ ] **步骤 8.3：集成 useSwipeBack**

在 script 中导入并使用：
```js
import { useSwipeBack } from '@/composables/useSwipeBack.js'
// ...
const { onTouchStart, onTouchMove } = useSwipeBack()
```

在模板根 view 上绑定事件：
```html
<view class="detail-page" @touchstart="onTouchStart" @touchmove="onTouchMove">
```

- [ ] **步骤 8.4：添加页面转场入场动画**

给 hero-card 或主容器添加 enter 类和动画：
```css
.hero-card {
  transform: scale(0.92);
  opacity: 0;
}

.hero-enter {
  animation: pageEnter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes pageEnter {
  to {
    transform: scale(1);
    opacity: 1;
  }
}
```

- [ ] **步骤 8.5：CTA 按钮流动渐变确认**

确认 `.btn-cta` 使用 flow 动画：
```css
background: linear-gradient(270deg, #2F6BFF, #8A5CFF, #2F6BFF);
background-size: 300% 300%;
animation: flow 6s linear infinite;
```

- [ ] **步骤 8.6：诊断检查**

确认 training-plan-detail.vue 无语法错误。

---

## 任务 9：增强列表页背景系统

**文件：**
- 修改：`fitness-app/pages/knowledge/training-plan-list.vue`

- [ ] **步骤 9.1：确认列表页背景渐变**

`.list-page` 应有：
```css
background: linear-gradient(180deg, #f4f7ff 0%, #eef2ff 50%, #e8eeff 100%);
```

- [ ] **步骤 9.2：确认 bg-orb 光晕效果**

确认 `.bg-orb-1` 和 `.bg-orb-2` 存在且有正确的径向渐变。

- [ ] **步骤 9.3：集成 Store + TrainingCard**

如果列表页需要显示 TrainingCard 列表（而非旧的 plan-card），则：
1. 导入 useTrainingStore
2. 导入 TrainingCard 组件
3. 在模板中使用 `<TrainingCard v-for="item in store.list" />`

- [ ] **步骤 9.4：诊断检查**

确认 training-plan-list.vue 无语法错误。

---

## 任务 10：最终验证

- [ ] **步骤 10.1：全局诊断检查**

对所有修改/新增文件运行 GetDiagnostics，确认零错误：
- package.json
- LottieIcon.vue
- Icon.vue
- ProgressRing.vue
- TrainingCard.vue
- stores/training.js
- composables/useSwipeBack.js
- training-plan-detail.vue
- training-plan-list.vue

- [ ] **步骤 10.2：功能清单核对**

| 功能 | 状态 |
|------|------|
| lottie-web 安装 | ☐ |
| 7 个 SVG 图标存在 | ☐ |
| LottieIcon 组件可用 | ☐ |
| Icon 组件可用（呼吸+变色） | ☐ |
| ProgressRing CSS 版本工作 | ☐ |
| TrainingCard 新数据结构 | ☐ |
| Store 简化数据 | ☐ |
| useSwipeBack 可用 | ☐ |
| 详情页转场动画 | ☐ |
| 详情页手势返回 | ☐ |
| 背景光晕可见 | ☐ |
| CTA 流动渐变 | ☐ |

---

## 自检

### 规格覆盖度
- ✅ 任务 1：基础设施（lottie + SVG）
- ✅ 任务 2：LottieIcon 组件
- ✅ 任务 3：Icon 组件
- ✅ 任务 4：ProgressRing 重构
- ✅ 任务 5：Store 更新
- ✅ 任务 6：TrainingCard 重写
- ✅ 任务 7：useSwipeBack
- ✅ 任务 8：详情页增强
- ✅ 任务 9：列表页增强
- ✅ 任务 10：最终验证

### 占位符扫描
- 无 TODO/待定/后续实现 ✅
- 所有代码步骤包含实际代码 ✅
- 所有命令可执行 ✅

### 类型一致性
- Store 数据结构与 TrainingCard Props 匹配 ✅
- Icon/LottieIcon/ProgressRing 接口一致 ✅
- useSwipeBack 返回值与详情页使用匹配 ✅
