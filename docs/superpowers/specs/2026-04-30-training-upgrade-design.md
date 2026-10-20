# 训练计划页升级版设计规范 — 实现规格

> 日期：2026-04-30
> 方案：方案 A — 渐进式增强（6 阶段）
> 来源：健身App「训练计划页」高级版设计规范.md

---

## 一、目标

将训练计划页从当前实现升级到产品级 UI 系统，包含：
- Lottie 动画图标系统
- 手势返回交互
- 页面级转场动画
- Glassmorphism + 动态渐变背景
- 统一 SVG 图标库

---

## 二、当前状态

### 已有组件
- `components/AppIcon.vue` — 呼吸动画图标（uni-icons 封装）
- `components/ProgressIcon.vue` — Canvas 进度环 + AppIcon
- `components/TrainingCard.vue` — 训练卡片（使用 ProgressIcon）
- `components/DayCard.vue` — 每日训练卡片
- `components/ProgressRing.vue` — Canvas 进度环
- `components/TrainingHero.vue` — Hero 区域
- `stores/training.js` — Pinia Store

### 已有页面
- `pages/knowledge/training-plan-list.vue` — 训练计划列表
- `pages/knowledge/training-plan-detail.vue` — 训练计划详情

### 缺失能力
1. ❌ Lottie 动画支持（lottie-web 未安装）
2. ❌ SVG 图标资源文件
3. ❌ 手势返回 composable
4. ❌ 详情页转场动画
5. ❌ 背景光晕效果
6. ❌ Icon 统一组件

---

## 三、实施阶段

### 阶段 A1：基础设施准备

**任务**：
1. 安装 lottie-web 依赖
2. 创建 `/static/icons/` 目录及 7 个 SVG 文件
3. 创建 `/static/lottie/` 目录结构预留

**新增文件**：
```
/static/icons/chest.svg     — 胸部图标
/static/icons/back.svg      — 背部图标
/static/icons/leg.svg       — 腿部图标
/static/icons/shoulder.svg  — 肩部图标
/static/icons/arm.svg       — 手臂图标
/static/icons/fire.svg      — CTA 火焰图标
/static/icons/more.svg      — 更多图标
```

**SVG 规范**：
- 统一线性风格
- 使用 `currentColor`（支持动态变色）
- stroke-width: 1.6
- viewBox: "0 0 24 24"

**修改文件**：
- `package.json` — 添加 `"lottie-web": "^5.12.2"`

**验证标准**：
- npm install 成功
- SVG 文件可正常加载

---

### 阶段 A2：LottieIcon + Icon 组件

**任务**：
1. 创建 `components/LottieIcon.vue`
2. 创建 `components/Icon.vue`

**LottieIcon.vue 规格**：
```vue
<template>
  <view ref="box" class="lottie"></view>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import lottie from 'lottie-web'

const props = defineProps({
  path: String,      // Lottie JSON 路径
  loop: { type: Boolean, default: true },
  autoplay: { type: Boolean, default: true }
})

const box = ref(null)

onMounted(() => {
  lottie.loadAnimation({
    container: box.value,
    renderer: 'svg',
    loop: props.loop,
    autoplay: props.autoplay,
    path: props.path
  })
})
</script>

<style scoped>
.lottie {
  width: 80rpx;
  height: 80rpx;
}
</style>
```

**Icon.vue 规格**：
```vue
<template>
  <image :src="src" class="icon" :style="iconStyle" />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  src: String,
  size: { type: Number, default: 48 },
  color: { type: String, default: '#2F6BFF' }
})

const iconStyle = computed(() => ({
  width: props.size + 'rpx',
  height: props.size + 'rpx',
  color: props.color
}))
</script>

<style scoped>
.icon {
  animation: breathe 3s ease-in-out infinite;
}

.icon:active {
  transform: scale(0.85);
}

@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50% { transform: scale(1.12); opacity: 1; }
}
</style>
```

**验证标准**：
- LottieIcon 可渲染外部 JSON 动画
- Icon 可显示 SVG 并支持动态变色和呼吸动画

---

### 阶段 A3：ProgressRing 重构

**任务**：
1. 重写 `components/ProgressRing.vue`
2. 从 Canvas 实现改为 Lottie + Slot 结构

**新规格**：
```vue
<template>
  <view class="wrap">
    <view class="ring-bg"></view>
    <view class="center">
      <slot></slot>
    </view>
  </view>
</template>
```

**关键变化**：
- 移除 Canvas 绘制逻辑
- 改用 CSS 渐变圆环 + Slot 内容
- 外层尺寸：100rpx × 100rpx
- 支持 slot 传入任意内容（Icon/LottieIcon/文字）

**样式**：
```css
.wrap {
  position: relative;
  width: 100rpx;
  height: 100rpx;
}

.ring-bg {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    var(--progress-color) calc(var(--progress) * 3.6deg),
    rgba(0,0,0,0.06) 0
  );
}

.center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
```

**向后兼容**：
- 保留原有 Props 接口（progress、size、strokeWidth、colors、showText 等）
- 内部适配新渲染方式
- 不影响现有调用方

**验证标准**：
- ProgressRing 正常显示进度环
- Slot 内容居中显示
- 现有调用方无需修改

---

### 阶段 A4：TrainingCard + Store 更新

**任务**：
1. 更新 `stores/training.js` 数据结构
2. 重写 `components/TrainingCard.vue`

**Store 新数据结构**：
```js
{
  id: Number,
  title: String,        // 如 "胸部训练"
  desc: String,         // 如 "力量强化"
  progress: Number,     // 0-100
  count: Number,        // 动作数量
  color: String,        // 主题色 #2F6BFF
  icon: String          // Lottie/SVG 路径
}
```

**TrainingCard 新规格**：

模板结构：
```
┌─────────────────────────────────────┐
│ [ProgressRing]  [title]             │
│   [Icon]        [desc]    [count]   │
│                          [status]   │
└─────────────────────────────────────┘
```

**交互**：
- 点击 → uni.navigateTo 详情页
- active → scale(0.96)
- 入场 → fadeUp 动画（delay 基于 index）

**状态文本逻辑**：
- progress === 100 → "已完成"（绿色）
- progress > 0 → "进行中"（蓝色）
- progress === 0 → "未开始"（灰色）

**验证标准**：
- TrainingCard 显示正确的数据
- 点击可跳转详情页
- 状态文字正确显示

---

### 阶段 A5：useSwipeBack composable

**任务**：
1. 创建 `composables/useSwipeBack.js`

**规格**：
```js
import { ref } from 'vue'

export function useSwipeBack() {
  const startX = ref(0)

  const onTouchStart = (e) => {
    startX.value = e.touches[0].clientX
  }

  const onTouchMove = (e) => {
    const delta = e.touches[0].clientX - startX.value
    if (delta > 80) {
      uni.navigateBack()
    }
  }

  return { onTouchStart, onTouchMove }
}
```

**使用方式**：
```vue
<script setup>
import { useSwipeBack } from '@/composables/useSwipeBack'
const { onTouchStart, onTouchMove } = useSwipeBack()
</script>

<template>
  <view @touchstart="onTouchStart" @touchmove="onTouchMove">
    <!-- 页面内容 -->
  </view>
</template>
```

**验证标准**：
- 右滑超过 80px 触发返回
- 左滑和其他方向不触发

---

### 阶段 A6：详情页转场 + 背景系统

**任务**：
1. 增强 `training-plan-detail.vue` 视觉效果
2. 添加页面转场动画
3. 集成手势返回
4. 应用背景系统

**背景系统规格**：

1. **页面主背景**：
```css
background: linear-gradient(180deg, #f5f7fb 0%, #eef1f7 100%);
```

2. **顶部光晕**（伪元素）：
```css
position: absolute;
width: 600rpx; height: 600rpx;
background: radial-gradient(circle, rgba(108,99,255,0.25), transparent 70%);
top: -200rpx; right: -200rpx;
```

3. **CTA 流动渐变**：
```css
background: linear-gradient(270deg, #2F6BFF, #8A5CFF, #2F6BFF);
background-size: 300% 300%;
animation: flow 6s linear infinite;
```

4. **Glass 卡片**：
```css
background: rgba(255,255,255,0.65);
backdrop-filter: blur(20rpx);
border-radius: 24rpx;
box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.05), inset 0 1rpx rgba(255,255,255,0.6);
```

**详情页转场规格**：

1. **遮罩层**：
```css
position: absolute; inset: 0;
background: rgba(0,0,0,0.2);
backdrop-filter: blur(20rpx);
```

2. **卡片入场动画**：
```css
transform: scale(0.9);
opacity: 0;
animation: enter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;

@keyframes enter {
  to { transform: scale(1); opacity: 1; }
}
```

**验证标准**：
- 详情页进入时有弹性缩放动画
- 右滑可返回列表页
- 背景光晕可见
- CTA 按钮有流动渐变效果

---

## 四、文件变更清单

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| 修改 | `fitness-app/package.json` | 添加 lottie-web |
| 新增 | `fitness-app/static/icons/*.svg` (7个) | SVG 图标资源 |
| 新增 | `fitness-app/components/LottieIcon.vue` | Lottie 动画组件 |
| 新增 | `fitness-app/components/Icon.vue` | 统一图标组件 |
| 重写 | `fitness-app/components/ProgressRing.vue` | Canvas → CSS + Slot |
| 重写 | `fitness-app/components/TrainingCard.vue` | 新数据结构 + 交互 |
| 修改 | `fitness-app/stores/training.js` | 简化数据结构 |
| 新增 | `fitness-app/composables/useSwipeBack.js` | 手势返回 |
| 修改 | `fitness-app/pages/knowledge/training-plan-detail.vue` | 转场+手势+背景 |
| 修改 | `fitness-app/pages/knowledge/training-plan-list.vue` | 背景系统集成 |

---

## 五、依赖关系图

```
A1 (基础设施)
 ↓
A2 (LottieIcon + Icon) ←── A1 的 SVG 文件
 ↓
A3 (ProgressRing) ←── A2 的 LottieIcon
 ↓
A4 (TrainingCard + Store) ←── A3 的 ProgressRing
 ↓
A5 (useSwipeBack) ←── 独立
 ↓
A6 (详情页增强) ←── A4 + A5
```

各阶段按顺序执行，每个阶段完成后验证再进入下一阶段。

---

## 六、风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| lottie-web 在 uni-app 兼容性问题 | 中 | 高 | 先做 PoC 验证；备选方案用 CSS 动画替代 |
| Canvas → CSS 进度环精度差异 | 低 | 中 | 保留 conic-gradient 方案；测试各端表现 |
| 手势返回与页面滚动冲突 | 中 | 中 | 限制触发区域；增加方向判断 |
| SVG currentColor 兼容性 | 低 | 低 | uni-app image 组件已支持 |

---

## 七、验收标准

1. ✅ 所有 6 个阶段完成且零诊断错误
2. ✅ 列表页显示 TrainingCard 列表，带 fadeUp 入场
3. ✅ 详情页有弹性入场动画 + 右滑返回
4. ✅ CTA 按钮有流动渐变效果
5. ✅ 背景顶部紫色光晕可见
6. ✅ 所有图标支持呼吸动画 + 点击反馈
7. ✅ ProgressRing 显示正确进度
