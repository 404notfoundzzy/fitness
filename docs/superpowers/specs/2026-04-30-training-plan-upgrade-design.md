# 训练计划页升级版设计规格

## 概述

按升级版设计规范文档，引入 Pinia 状态管理，新增动态图标组件体系（AppIcon / ProgressIcon / TrainingCard），与现有已美化组件（DayCard / ProgressRing / TrainingHero）渐进融合。

## 架构

### 文件结构

```
fitness-app/
├── stores/
│   └── training.js              # Pinia Store
├── components/
│   ├── AppIcon.vue               # 动态图标（新增）
│   ├── ProgressIcon.vue          # 进度联动图标（新增）
│   ├── TrainingCard.vue          # 训练卡片（新增）
│   ├── DayCard.vue               # 保留
│   ├── ProgressRing.vue          # 保留
│   └── TrainingHero.vue          # 保留
├── pages/knowledge/
│   ├── training-plan-list.vue    # 整合 TrainingCard
│   └── training-plan-detail.vue  # 整合 ProgressIcon + AppIcon
├── data/
│   └── training-plans.js         # 数据源（保留）
└── main.js                       # 注册 Pinia
```

### 依赖变更

- 新增 `pinia` 依赖
- main.js 中注册 Pinia 插件（Vue3 分支）

## 组件设计

### 1. AppIcon.vue — 动态图标

**职责**：通用动态图标组件，提供呼吸动画和按压反馈。

**Props**：
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| name | String | '' | 图标名称/路径 |
| active | Boolean | false | 是否激活态（发光） |
| progress | Number | 0 | 关联进度 0-100 |
| size | Number | 48 | 图标尺寸 rpx |

**动效**：
- Idle：`breathe 3s ease-in-out infinite`（scale 1→1.08→1, opacity 0.9→1→0.9）
- 按压：`scale(0.88)` + 200ms 回弹
- 激活：`drop-shadow(0 0 12rpx currentColor)`

### 2. ProgressIcon.vue — 进度联动图标

**职责**：AppIcon + Canvas 进度环，展示训练进度。

**Props**：
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| progress | Number | 0 | 进度 0-100 |
| color | String | '#2F6BFF' | 进度环颜色 |
| icon | String | '' | 中心图标 |

**实现**：
- Canvas 绘制底层轨道 + 渐变进度弧
- 中心嵌套 AppIcon
- 进度变化时 `requestAnimationFrame` 逐帧动画绘制

### 3. TrainingCard.vue — 训练卡片

**职责**：整合 ProgressIcon 的训练日卡片，用于列表页展示。

**Props**：
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| item | Object | {} | 训练项数据 |
| index | Number | 0 | 列表索引（控制入场延迟） |

**数据结构**（item）：
```js
{
  id: String,
  title: String,
  desc: String,
  icon: String,
  color: String,
  progress: Number,
  count: Number
}
```

**视觉**：
- 左侧彩色竖条 `linear-gradient(180deg, color, transparent)`
- 左区：ProgressIcon + 标题/描述
- 右区：动作数 + 状态标签
- Glassmorphism 背景 + fadeUp 入场

### 4. Pinia Store — stores/training.js

**State**：
```js
{
  list: [],           // 训练计划列表
  currentPlanId: null, // 当前选中计划 ID
  dailyProgress: {}    // { [dayKey]: number } 每日进度
}
```

**Getters**：
- `currentPlan`：当前选中的计划对象
- `todayTraining`：今日训练数据
- `weeklyStats`：本周统计

**Actions**：
- `fetchPlans()`：加载训练计划数据
- `selectPlan(id)`：选择计划
- `updateProgress(dayKey, value)`：更新进度

## 页面整合

### training-plan-list.vue

- 保留现有 Hero Banner + Glassmorphism 卡片列表
- 新增"今日训练"区域，使用 TrainingCard 组件
- 数据源从本地 data 切换到 Pinia Store

### training-plan-detail.vue

- DayCard 中可选嵌入 ProgressIcon
- Header 返回/更多按钮使用 AppIcon
- CTA 按钮添加渐变流动动画 `flow 6s infinite`

## 动效体系统一

| 动效类型 | 实现 | 时长 |
|---------|------|------|
| 呼吸 | `breathe 3s ease-in-out infinite` | 3s 循环 |
| 按压 | `scale(0.88)` + cubic-bezier 回弹 | 200-250ms |
| 入场 | `fadeUp 0.6s` + 交错延迟 | 600ms |
| 进度 | Canvas `requestAnimationFrame` 逐帧 | ~800ms |
| CTA 流动 | `flow 6s infinite` 渐变位移 | 6s 循环 |

## 色彩体系

- 主色：`#2F6BFF` / `#4f72ff`
- 辅色：`#8A5CFF` / `#7c5cff`
- 成功：`#34C759` / `#10b981`
- 进行中：`#2F6BFF`
- 背景：`#f5f7fb` → `#f4f7ff` → `#e8eeff`
