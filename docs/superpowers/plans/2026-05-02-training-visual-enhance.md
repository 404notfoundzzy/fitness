# 训练计划页视觉增强 — 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将详情页和列表页视觉效果与效果图对齐 + 集成新组件（DayCard 图标增强、背景光晕、Store 集成、Lottie 文件、页面过渡）

**架构：** 5 个独立模块并行执行：A) DayCard 增强 B) 详情页背景 C) 列表页 Store 集成 D) Lottie 文件 E) 页面过渡动画

**技术栈：** Vue3 + Pinia + uni-app + lottie-web + CSS 动画

---

## 文件结构

| 文件 | 职责 | 操作 |
|------|------|------|
| `components/DayCard.vue` | 每日训练卡片（添加部位图标） | 修改 |
| `pages/knowledge/training-plan-detail.vue` | 详情页（确认光晕+增强 Hero） | 修改 |
| `pages/knowledge/training-plan-list.vue` | 列表页（集成 Store + TrainingCard） | 修改 |
| `static/lottie/chest.json` | 胸部呼吸动画 | 新增 |
| `static/lottie/fire.json` | 火焰闪烁动画 | 新增 |
| `static/lottie/progress.json` | 进度环旋转动画 | 新增 |

---

### 任务 1：创建 Lottie 简化版 JSON 文件

**文件：**
- 新增：`fitness-app/static/lottie/chest.json`
- 新增：`fitness-app/static/lottie/fire.json`
- 新增：`fitness-app/static/lottie/progress.json`

- [ ] **步骤 1.1：创建 /static/lottie/ 目录**

运行命令：
```powershell
New-Item -ItemType Directory -Force -Path "d:/softWare/develop/app-myself/fitness/fitness-app/static/lottie"
```

- [ ] **步骤 1.2：创建 chest.json（胸部呼吸动画）**

写入 `fitness-app/static/lottie/chest.json`：
```json
{
  "v": "5.7.4",
  "fr": 30,
  "ip": 0,
  "op": 60,
  "w": 80,
  "h": 80,
  "nm": "chest-breathe",
  "ddd": 0,
  "assets": [
    {
      "id": "comp_0",
      "nm": "shape",
      "ty": "gr",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "r": { "a": 0, "k": 0 },
        "p": { "a": 0, "k": [40, 40, 0] },
        "a": {
          "a": 1,
          "k": [
            {"t": 0, "s": [100, 100, 100]},
            {"t": 30, "s": [112, 112, 112]},
            {"t": 60, "s": [100, 100, 100]}
          ]
        }
      },
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ind": 0,
              "ty": "sh",
              "ix": 1,
              "ks": {
                "a": 0,
                "k": {
                  "i": [[0, -12], [12, 0], [0, 12], [-12, 0]],
                  "o": [[0, 12], [-12, 0], [0, -12], [12, 0]],
                  "v": [[0, -20], [20, 0], [0, 20], [-20, 0]],
                  "c": true
                }
              },
              "nm": "body"
            },
            {
              "ty": "st",
              "c": {"a": 0, "k": [0.18, 0.42, 1, 1]},
              "o": {"a": 0, "k": 100},
              "w": {"a": 0, "k": 2},
              "lc": 2,
              "lj": 2,
              "bm": 0,
              "nm": "stroke"
            }
          ],
          "nm": "group",
          "np": 2
        }
      ],
      "ip": 0,
      "op": 60,
      "st": 0
    }
  ],
  "layers": [
    {
      "ddd": 0,
      "ind": 0,
      "ty": 0,
      "nm": "chest",
      "refId": "comp_0",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "r": { "a": 0, "k": 0 },
        "p": { "a": 0, "k": [40, 40, 0] },
        "a": { "a": 0, "k": [100, 100, 100] }
      },
      "ao": 0
    }
  ]
}
```

- [ ] **步骤 1.3：创建 fire.json（火焰闪烁动画）**

写入 `fitness-app/static/lottie/fire.json`：
```json
{
  "v": "5.7.4",
  "fr": 30,
  "ip": 0,
  "op": 30,
  "w": 48,
  "h": 48,
  "nm": "fire-flicker",
  "assets": [
    {
      "id": "comp_fire",
      "nm": "fire_shape",
      "ty": "gr",
      "sr": 1,
      "ks": {
        "o": {
          "a": 1,
          "k": [
            {"t": 0, "s": [100]},
            {"t": 15, "s": [70]},
            {"t": 30, "s": [100]}
          ]
        }
      },
      "shapes": [{
        "ty": "gr",
        "it": [{
          "ind": 0,
          "ty": "sh",
          "ks": {
            "a": 0,
            "k": {
              "i": [[0, -8], [6, -4], [6, 4], [0, 8], [-6, 4], [-6, -4]],
              "o": [[0, -8], [6, -4], [6, 4], [0, 8], [-6, 4], [-6, -4]],
              "v": [[0, -16], [10, -8], [10, 8], [0, 16], [-10, 8], [-10, -8]],
              "c": true
            }
          }
        }, {
          "ty": "fl",
          "c": {"a": 0, "k": [1, 0.42, 0.18, 1]},
          "o": {"a": 0, "k": 100}
        }],
        "np": 2
      }]
    }
  ],
  "layers": [{
    "ddd": 0,
    "ind": 0,
    "ty": 0,
    "nm": "fire",
    "refId": "comp_fire",
    "ks": {
      "p": {"a": 0, "k": [24, 24, 0]}
    }
  }]
}
```

- [ ] **步骤 1.4：创建 progress.json（进度环旋转）**

写入 `fitness-app/static/lottie/progress.json`：
```json
{
  "v": "5.7.4",
  "fr": 30,
  "ip": 0,
  "op": 90,
  "w": 100,
  "h": 100,
  "nm": "progress-spin",
  "assets": [{
    "id": "comp_ring",
    "nm": "ring",
    "ty": "gr",
    "ks": {
      "r": {
        "a": 1,
        "k": [
          {"t": 0, "s": [0]},
          {"t": 90, "s": [360]}
        ]
      }
    },
    "shapes": [{
      "ty": "gr",
      "it": [{
        "ty": "el",
        "d": 1,
        "s": {"a": 0, "k": [84, 84]},
        "p": {"a": 0, "k": [0, 0]}
      }, {
        "ty": "st",
        "c": {"a": 0, "k": [0.18, 0.42, 1, 1]},
        "o": {"a": 0, "k": 100},
        "w": {"a": 0, "k": 6},
        "lc": 2,
        "lj": 2
      }],
      "np": 2
    }]
  }],
  "layers": [{
    "ddd": 0,
    "ind": 0,
    "ty": 0,
    "nm": "ring_layer",
    "refId": "comp_ring",
    "ks": {
      "p": {"a": 0, "k": [50, 50, 0]}
    }
  }]
}
```

- [ ] **步骤 1.5：验证文件存在**

检查三个 JSON 文件已创建且格式正确。

---

### 任务 2：DayCard 视觉增强（添加部位图标）

**文件：**
- 修改：`fitness-app/components/DayCard.vue`

- [ ] **步骤 2.1：读取当前 DayCard.vue 内容**

确认当前模板结构。

- [ ] **步骤 2.2：在 day-badge 区域添加部位图标**

在 day-badge 内部或下方添加 Icon 组件：

模板修改（day-header 部分）：
```html
<view class="day-badge" :style="{ background: badgeGradient }">
  <text class="day-label">DAY</text>
  <text class="day-number">{{ dayNumber }}</text>
  <view v-if="progress >= 100" class="badge-check">
    <text class="check-mark">&#10003;</text>
  </view>
</view>

<!-- 新增：部位图标 -->
<Icon
  :src="partIcon"
  :size="36"
  :color="iconColor"
  class="part-icon"
/>
```

- [ ] **步骤 2.3：添加部位图标映射计算属性**

在 computed 中添加：
```js
partMap: {
  1: '/static/icons/chest.svg',
  2: '/static/icons/back.svg',
  3: '/static/icons/leg.svg',
  4: '/static/icons/shoulder.svg',
  5: '/static/icons/arm.svg'
},

partIcon() {
  return this.partMap[this.dayNumber] || '/static/icons/chest.svg'
},

iconColor() {
  if (this.progress >= 100) return '#10B981'
  const colors = ['#5B8CFF', '#9B6BFF', '#FF9F4D', '#52C41A', '#4C7DFF']
  return colors[(this.dayNumber - 1) % colors.length]
}
```

- [ ] **步骤 2.4：导入 Icon 组件**

在 script 中添加：
```js
import Icon from './Icon.vue'

components: {
  ProgressRing,
  Icon
}
```

- [ ] **步骤 2.5：添加图标样式**

在 style 中添加：
```css
.part-icon {
  margin-top: 6rpx;
  opacity: 0.9;
}
```

- [ ] **步骤 2.6：诊断检查**

确认 DayCard.vue 无语法错误。

---

### 任务 3：详情页背景系统确认与增强

**文件：**
- 修改：`fitness-app/pages/knowledge/training-plan-detail.vue`

- [ ] **步骤 3.1：确认 .bg-glow 元素存在**

检查模板中是否有 `<view class="bg-glow"></view>`。

- [ ] **步骤 3.2：如果不存在，添加 bg-glow 元素**

在 `.bg-orb-2` 后面添加：
```html
<view class="bg-glow"></view>
```

- [ ] **步骤 3.3：确认 .bg-glow 样式存在**

检查样式中是否有：
```css
.bg-glow {
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

- [ ] **步骤 3.4：增强 hero-card visual-bg 效果**

确保 visual-bg 有正确的渐变和微妙的浮动动画：
```css
.visual-bg::after {
  content: "";
  position: absolute;
  bottom: -20%;
  right: -20%;
  width: 180rpx;
  height: 180rpx;
  background: radial-gradient(circle, rgba(79, 114, 255, 0.15), transparent 70%);
  animation: glowPulse 4s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.15); opacity: 1; }
}
```

- [ ] **步骤 3.5：诊断检查**

确认 training-plan-detail.vue 无语法错误。

---

### 任务 4：列表页 Pinia Store 集成

**文件：**
- 修改：`fitness-app/pages/knowledge/training-plan-list.vue`

- [ ] **步骤 4.1：读取当前列表页完整内容**

了解现有 import 和 data 结构。

- [ ] **步骤 4.2：添加 Store 和 TrainingCard 导入**

在 script 部分添加：
```js
import { useTrainingStore } from '@/stores/training.js'
import TrainingCard from '@/components/TrainingCard.vue'
```

- [ ] **步骤 4.3：注册 TrainingCard 组件**

在 components 中添加：
```js
components: {
  TrainingCard
}
```

- [ ] **步骤 4.4：初始化 Store**

在 data 或 setup 中添加：
```js
data() {
  return {
    // ... 现有数据
    store: null
  }
},
onShow() {
  this.store = useTrainingStore()
  // ... 现有逻辑
}
```

- [ ] **步骤 4.5：在模板中添加 TrainingCard 列表区域**

在 hero-banner 后面、section 前面添加：
```html
<!-- Store 数据展示区域 -->
<view class="section store-section">
  <view class="section-header">
    <view class="section-title-wrap">
      <view class="section-indicator"></view>
      <text class="section-title">我的训练</text>
    </view>
    <text class="section-count">{{ store ? store.list.length : 0 }} 个计划</text>
  </view>

  <view v-if="store" class="training-list">
    <TrainingCard
      v-for="(item, index) in store.list"
      :key="item.id"
      :item="item"
      :index="index"
    />
  </view>
</view>
```

- [ ] **步骤 4.6：添加 store-section 样式**

```css
.store-section {
  margin-bottom: 28rpx;
}

.training-list {
  display: flex;
  flex-direction: column;
}
```

- [ ] **步骤 4.7：诊断检查**

确认 training-plan-list.vue 无语法错误。

---

### 任务 5：页面级过渡动画配置

**文件：**
- 修改：`fitness-app/pages.json`（如果存在）
- 或：全局 CSS 文件

- [ ] **步骤 5.1：查找 pages.json 文件位置**

搜索项目根目录下的 pages.json。

- [ ] **步骤 5.2：读取 pages.json 内容**

查看现有页面配置结构。

- [ ] **步骤 5.3：为训练计划相关页面添加转场配置**

在 pages 数组中找到 training-plan-detail 和 training-plan-list，添加或更新 style 配置：

```json
{
  "path": "pages/knowledge/training-plan-detail",
  "style": {
    "navigationBarTitleText": "",
    "navigationStyle": "custom",
    "app-plus": {
      "titleNView": false,
      "animationType": "slide-in-right",
      "animationDuration": 300
    }
  }
}
```

- [ ] **步骤 5.4：如果没有 pages.json 或无法修改，添加全局 CSS 过渡**

在 App.vue 或全局样式中添加：
```css
/* 页面切换过渡 */
page-enter-active,
.page-leave-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

page-enter-from {
  opacity: 0;
  transform: translateX(30rpx);
}

page-leave-to {
  opacity: 0;
  transform: translateX(-30rpx);
}
```

- [ ] **步骤 5.5：诊断检查**

确认配置无语法错误。

---

### 任务 6：最终验证

- [ ] **步骤 6.1：全局诊断检查**

对所有修改/新增文件运行 GetDiagnostics，确认零错误。

- [ ] **步骤 6.2：功能清单核对**

| 功能 | 状态 |
|------|------|
| Lottie JSON 文件 (3个) | ☐ |
| DayCard 部位图标显示 | ☐ |
| 详情页 .bg-glow 光晕可见 | ☐ |
| 列表页 Store + TrainingCard 集成 | ☐ |
| 页面过渡动画配置 | ☐ |
| 全局零诊断错误 | ☐ |

---

## 自检

### 规格覆盖度
- ✅ 任务 1：Lottie 简化版文件（模块 D）
- ✅ 任务 2：DayCard 视觉增强（模块 A）
- ✅ 任务 3：详情页背景系统（模块 B）
- ✅ 任务 4：列表页 Store 集成（模块 C）
- ✅ 任务 5：页面级过渡动画（模块 E）
- ✅ 任务 6：最终验证

### 占位符扫描
- 所有代码步骤包含实际代码 ✅
- 无 TODO/待定内容 ✅

### 类型一致性
- partIcon 映射表与 SVG 文件名一致 ✅
- Store 使用 useTrainingStore 与 stores/training.js 匹配 ✅
- Icon 组件导入路径正确 ✅
