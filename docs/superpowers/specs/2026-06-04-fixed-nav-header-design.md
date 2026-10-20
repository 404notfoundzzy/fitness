# 固定顶部导航栏改造设计

**日期**: 2026-06-04  
**状态**: 设计中  
**目标**: 解决真机测试中顶部返回栏随内容滚动的问题，使导航栏在 iOS/Android 上均保持固定。

---

## 1. 问题诊断

- 所有页面 `navigationStyle: "custom"`（自定义导航栏）
- 当前 13 个页面的 header 处于文档流中，随 scroll-view 内容一起滚动
- 6 个页面已正确使用 Header + scroll-view 分离布局（`calorie-guide`, `training-plan-list/detail/edit`, `loader-test`, `loading-preview`）

## 2. 方案选型

采用 **Header + scroll-view 分离布局 + 通用 NavHeader 组件**，理由：
- iOS/Android 双端兼容，无已知兼容性问题
- 使用 flex 布局而非 `100vh` 计算，避免移动端视口高度 bug
- 与项目已有 6 个页面的正确模式一致
- 抽取通用组件降低维护成本

## 3. 组件设计

### 3.1 NavHeader 组件

**路径**: `components/NavHeader.vue`

**Props**:
| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| title | String | '' | 标题文字 |
| color | String | '#0EA5E9' | 主题色（返回图标 + 背景色） |
| iconBg | String | 'rgba(14,165,233,0.1)' | 返回按钮背景色 |
| showBack | Boolean | true | 是否显示返回按钮 |

**Slots**:
| Slot | 说明 |
|------|------|
| right | 右侧自定义内容（如历史按钮、今日kcal统计） |

**行为**:
- 自动通过 `uni.getSystemInfoSync().statusBarHeight` 适配状态栏高度
- 返回按钮默认调用 `uni.navigateBack()`

### 3.2 全局布局样式

在 `App.vue` 中定义两个全局 class：

```css
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.page-body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
```

## 4. 页面改造清单

### 第一批：高频记录页（4 个）
| 页面 | 主题色 | 标题 | 右侧内容 |
|------|--------|------|----------|
| workout.vue | #F97316 | 记录运动 | 今日分钟数 + 历史按钮 |
| diet.vue | #22C55E | 记录饮食 | 今日kcal + 历史按钮 |
| water.vue | #0EA5E9 | 记录饮水 | 历史按钮 |
| weight.vue | #14B8A6 | 记录体重 | 历史按钮 |

### 第二批：历史页（5 个）
| 页面 | 主题色 | 标题 |
|------|--------|------|
| history.vue | #F97316 | 历史运动记录 |
| weight-history.vue | #14B8A6 | 历史体重记录 |
| water-history.vue | #0EA5E9 | 历史饮水记录 |
| diet-history.vue | #22C55E | 历史饮食记录 |
| height-history.vue | #A855F7 | 历史身高记录 |

### 第三批：TabBar 页 + 其他（4 个）
| 页面 | 主题色 | 标题 | 备注 |
|------|--------|------|------|
| record.vue | #0EA5E9 | 健康记录 | 无返回按钮 |
| knowledge.vue | #0EA5E9 | 健身知识库 | 无返回按钮 |
| height.vue | #A855F7 | 记录身高 | 有历史按钮 |
| cache-refresh.vue | - | 缓存刷新测试 | 测试页 |

## 5. 模板改造规范

### 改造前
```html
<view class="container">
  <view class="header">...</view>
  <view class="content">...</view>
</view>
```

### 改造后
```html
<view class="page-container">
  <NavHeader title="xxx" color="#xxx" iconBg="...">
    <template #right>...</template>
  </NavHeader>
  <scroll-view scroll-y class="page-body">
    <view class="content">...</view>
  </scroll-view>
</view>
```

## 6. 兼容性保证

| 关注点 | iOS | Android | 处理方式 |
|--------|-----|---------|----------|
| 状态栏高度 | 灵动岛/刘海动态 | 固定 24dp | `statusBarHeight` 自动获取 |
| 安全区域底部 | Home Indicator | 无 | `env(safe-area-inset-bottom)` |
| 滚动性能 | 原生丝滑 | 部分卡顿 | `-webkit-overflow-scrolling: touch` |
| flex 布局 | 完美 | 完美 | 无需额外处理 |

## 7. 风险排查结果

### 7.1 嵌套 scroll-view 冲突（重要）

**实际排查发现**：13 个页面中有 **10 个页面已存在内层 `<scroll-view>`**，用于记录列表的局部滚动（带 swipe 手势）。如果在外层再包裹一个 `page-body` scroll-view，将产生嵌套 scroll-view 冲突：

| 页面 | 内层 scroll-view class | 内层事件 |
|------|----------------------|----------|
| workout.vue | `record-list` | — |
| diet.vue | `record-list` | — |
| water.vue | `record-list` | — |
| weight.vue | `record-list` | — |
| height.vue | `record-list` | — |
| record.vue | `activity-scroll` | `@scrolltolower`, `@refresherrefresh` |
| history.vue | `history-scroll` | `@scrolltolower` |
| water-history.vue | `history-scroll` | `@scrolltolower` |
| diet-history.vue | `history-scroll` | `@scrolltolower` |
| weight-history.vue | `history-scroll` | `@scrolltolower` |

**结论**：不能简单用外层 `page-body` scroll-view 包裹。需要采用 **"header 固定 + 内层 scroll-view 自适应高度"** 策略。

### 7.2 `uni.pageScrollTo()` 失效

- `training-plan-list.vue` 中使用了 `uni.pageScrollTo()`（该页面已正确分离，不在本次改造范围）
- 改造后若任何页面需要编程式滚动，需改用 scroll-view 的 `scroll-top` 属性或 `scroll-into-view`

### 7.3 无 `onPageScroll` / `onReachBottom` 生命周期依赖

- 全项目搜索：**未发现**任何页面使用 `onPageScroll` 或 `onReachBottom` 生命周期
- 无需迁移页面级生命周期

### 7.4 无 `onPullDownRefresh` 依赖

- 全项目搜索：**未发现**任何页面配置 `enablePullDownRefresh`
- `record.vue` 的下拉刷新使用的是 scroll-view 内置 `@refresherrefresh`，不受影响

---

## 8. 改造方案修正（针对嵌套 scroll-view）

### 策略 A：有内层 scroll-view 的页面（10 个）

不添加外层 `page-body` scroll-view，改为让内层 scroll-view 自适应高度：

```html
<view class="page-container">
  <NavHeader title="xxx" color="#xxx" />
  <!-- 中间区域用 flex:1 撑满，内层 scroll-view 继承高度 -->
  <view class="page-content">
    <scroll-view scroll-y class="record-list" @scrolltolower="loadMore">
      ...
    </scroll-view>
  </view>
</view>
```

```css
.page-content {
  flex: 1;
  overflow: hidden;          /* 防止内容溢出 */
}
.page-content .record-list,
.page-content .history-scroll,
.page-content .activity-scroll {
  height: 100%;              /* 内层 scroll-view 填充中间区域 */
}
```

### 策略 B：纯内容页面（3 个）

`knowledge.vue`、`cache-refresh.vue`、`height-history.vue` 无内层 scroll-view，可使用外层 `page-body`：

```html
<view class="page-container">
  <NavHeader title="xxx" color="#xxx" />
  <scroll-view scroll-y class="page-body">
    <!-- 全部内容 -->
  </scroll-view>
</view>
```

---

## 9. 改造前待办排查清单

| # | 排查项 | 涉及页面 | 风险等级 | 状态 |
|---|--------|----------|----------|------|
| 1 | 内层 scroll-view 高度写死为固定值（如 `500rpx`），改为 `flex:1` 自适应后布局是否正常？ | workout/diet/water/weight/height 的 `record-list` | 中 | 待查 |
| 2 | `record.vue` 的 `activity-scroll` 同时有 `@scrolltolower`、`@refresherrefresh`、`:refresher-enabled`，改为 `height:100%` 后下拉刷新是否正常触发？ | record.vue | 中 | 待查 |
| 3 | history 系列页面的 `history-scroll` 带 `@scrolltolower` 分页加载，外层 flex 布局后触底加载行为是否一致？ | history / water-history / diet-history / weight-history | 中 | 待查 |
| 4 | `record.vue` 的 `activity-scroll` 之前是否间接依赖了页面的自然滚动（非 scroll-view 滚动）来实现某些布局？ | record.vue | 低 | 待查 |
| 5 | `knowledge.vue` 中存在多个 `v-if` 分支（grid/list/search），每个分支的滚动容器不同，改造后需统一 | knowledge.vue | 低 | 待查 |
| 6 | 改造后页面底部 padding（原 `padding-bottom: 80px`）是否仍需保留？ | 所有页面 | 低 | 待查 |
| 7 | `height-history.vue` 的 `history-list` scroll-view 检查是否有额外事件绑定 | height-history.vue | 低 | 待查 |
| 8 | `workout.vue` 和 `diet.vue` 的 header 右侧动态数据（今日 kcal/分钟）原通过组件 data 驱动，NavHeader slot 方式是否需额外传递响应式数据？ | workout.vue / diet.vue | 低 | 待查 |
| 9 | iOS 真机：flex 布局 + `overflow: hidden` 在 WebView 中是否会导致 scroll-view 无法滚动？ | 全部 | 高 | 待查 |
| 10 | Android 真机：内层 scroll-view 在 flex 容器中 `height:100%` 是否生效？ | 全部 | 高 | 待查 |

---

## 10. Android 内层 scroll-view `height:100%` 实现细节

### 10.1 现状：所有内层 scroll-view 当前使用固定高度

| 页面 | class | 当前策略 |
|------|-------|----------|
| workout / diet | `record-list` | `max-height: 55vh` |
| water | `record-list` | `max-height: 50vh` |
| weight / height | `record-list` | `max-height: 60vh` |
| record | `activity-scroll` | `max-height: 55vh` |
| history / water-history / diet-history / weight-history | `history-scroll` | `height: calc(100vh - 180rpx)` |
| height-history | `history-list` | `max-height: 50vh` |

### 10.2 为什么用 `flex: 1` 而不是 `height: 100%`

| 方式 | iOS WebView | Android WebView | Android 9- WebView |
|------|-------------|-----------------|-------------------|
| `height: 100%` | 稳定 | 依赖父元素有显式高度 | **不稳定**（百分比级联可能断裂） |
| `flex: 1` | 稳定 | 稳定 | 稳定 |

**原因**：`height: 100%` 需要父元素有确定的 computed height。在多层 flex 嵌套中，Android 旧版 WebView 的 computed height 传播可能中断。`flex: 1` 由 flex 布局引擎直接计算剩余空间，不依赖百分比级联，所有平台一致。

### 10.3 推荐方案：scroll-view 直接作为 flex 子元素

```html
<view class="page-container">
  <!-- 步骤 1: 容器 flex column, height:100vh, overflow:hidden -->
  
  <NavHeader />                    <!-- flex-shrink: 0 -->
  <view class="section-header" />  <!-- flex-shrink: 0 (如在 header 和 scroll 之间) -->
  
  <!-- 步骤 2: scroll-view 用 style="flex: 1" 填充剩余空间 -->
  <scroll-view 
    scroll-y 
    class="record-list" 
    style="flex: 1"              <!-- 关键：由 flex 引擎计算高度 -->
    @scrolltolower="loadMore"
  >
    ...
  </scroll-view>
</view>
```

```css
/* 各页面原固定高度全部删除 */
/* max-height: 55vh;        ← 删除 */
/* height: calc(100vh - X); ← 删除 */
/* 统一由模板行内 style="flex: 1" 接管 */
```

**注意**：行内 `style="flex: 1"` 比 class 优先级更高，且无需修改 scoped CSS（避免 scoped 选择器穿透问题）。

### 10.4 嵌套验证矩阵

| 平台 | flex column + flex:1 scroll-view | 内层 @scrolltolower | 内层 @refresherrefresh |
|------|----------------------------------|---------------------|------------------------|
| iOS Safari | 预期正常 | 预期正常 | 预期正常 |
| iOS WKWebView | 预期正常 | 预期正常 | 预期正常 |
| Android Chrome | 预期正常 | 预期正常 | 预期正常 |
| Android System WebView 80+ | 预期正常 | 预期正常 | 预期正常 |
| Android System WebView 60-79 | **需验证** | 需验证 | 需验证 |
| 微信小程序 iOS | 预期正常 | 预期正常 | 需验证 |
| 微信小程序 Android | 预期正常 | 预期正常 | 需验证 |

---

## 11. 回归测试清单

> 按页面分组，覆盖所有交互功能点。测试时需在 iOS + Android 真机上各执行一遍。

### 11.1 高频记录页（4 个）

#### diet.vue — 记录饮食
| # | 测试项 | 预期结果 | 风险点 |
|---|--------|----------|--------|
| D1 | header 固定 | 滚动记录列表时 header 不动 | flex 布局 |
| D2 | 返回按钮 | 点击后 navigateBack 到上一页 | NavHeader 的 goBack |
| D3 | 历史按钮 | 点击跳转 diet-history 页 | slot 中 @click 事件 |
| D4 | 今日 kcal 实时显示 | `nutrition.totalCalories > 0` 时显示数值 | slot 响应式数据 |
| D5 | 餐次类型切换 | 5 个 tab（早餐/午餐/晚餐/加餐/零食）正常切换 | 不受影响 |
| D6 | 食物表单填写 → 提交 | 填写后点击记录，数据保存并刷新列表 | 不受影响 |
| D7 | 记录列表滚动 | `record-list` scroll-view 独立滚动 | flex:1 后高度正常 |
| D8 | swipe 左滑删除 | 触摸左滑露出删除按钮，点击删除 | touch 事件在 scroll-view 内 |
| D9 | 编辑弹窗 | 点击列表项弹出编辑 popup，popup 内 scroll-view 独立滚动 | 嵌套 scroll-view 不受影响 |
| D10 | 删除弹窗 | 左滑后点击删除，弹出 DeleteConfirm | 不受影响 |

#### workout.vue — 记录运动
| # | 测试项 | 预期结果 |
|---|--------|----------|
| W1 | header 固定 | 滚动记录列表时 header 不动 |
| W2 | 返回按钮 | navigateBack |
| W3 | 历史按钮 | 跳转 history 页 |
| W4 | 今日分钟数实时显示 | `todayStats.totalDuration > 0` 时显示 |
| W5 | 运动类型选择 | 自定义/预置运动切换 |
| W6 | 运动表单 → 提交 | 填写后点击记录，数据保存 |
| W7 | 记录列表滚动 + swipe 删除 | flex:1 后功能正常 |
| W8 | 编辑/删除弹窗 | popup 内 scroll-view 独立 |

#### water.vue — 记录饮水
| # | 测试项 | 预期结果 |
|---|--------|----------|
| WA1 | header 固定 + 返回 + 历史按钮 | 正常 |
| WA2 | 今日总量实时显示 | `dailyTotal` ml 显示在 header |
| WA3 | 快捷水量按钮 (200/300/500ml) | 点击后提交 |
| WA4 | 记录列表滚动 + swipe 删除 | flex:1 正常 |
| WA5 | 编辑弹窗 | popup 内 scroll-view 独立 |

#### weight.vue — 记录体重
| # | 测试项 | 预期结果 |
|---|--------|----------|
| WE1 | header 固定 + 返回 + 历史按钮 | 正常 |
| WE2 | 时段切换 (晨重/晚重) | 正常切换 |
| WE3 | 体重输入 + 提交 | 正常 |
| WE4 | 记录列表滚动 + swipe 删除 | flex:1 正常 |
| WE5 | 编辑弹窗 | popup 内 scroll-view 独立 |

### 11.2 历史页（5 个）

#### history.vue — 历史运动记录
| # | 测试项 | 预期结果 | 风险点 |
|---|--------|----------|--------|
| H1 | header 固定 | 滚动时 header 不动 | — |
| H2 | 返回按钮 | navigateBack | — |
| H3 | section-header 跟随滚动 | "全部记录 X条" 在 scroll-view 内随内容滚动 | 确认是否放入 page-body |
| H4 | `@scrolltolower` 触底加载 | 滚动到底部自动加载更多 | **重点**：flex:1 后触底行为 |
| H5 | swipe 左滑删除 | touch 事件正常 | scroll-view 内 touch 不受影响 |
| H6 | 加载中 MathCurveLoader | 首次进入显示加载动画 | 不受影响 |
| H7 | 空状态 | 无记录时显示空提示 | 不受影响 |

#### water-history / diet-history / weight-history / height-history
| # | 测试项 | 预期结果 |
|---|--------|----------|
| HS1 | header 固定 + 返回 | 正常 |
| HS2 | `@scrolltolower` 分页加载 | flex:1 后正常触发 |
| HS3 | swipe 左滑删除 | 正常 |
| HS4 | 编辑弹窗 (water-history/diet-history) | popup 内 scroll-view 独立 |
| HS5 | 删除弹窗 (height-history/weight-history) | 正常 |
| HS6 | height-history 的 `history-list` `max-height:50vh` → `flex:1` | 列表高度填满 |

### 11.3 TabBar 页 + 其他（4 个）

#### record.vue — 健康记录
| # | 测试项 | 预期结果 | 风险点 |
|---|--------|----------|--------|
| R1 | header 固定 | 滚动活动列表时 header 不动 | — |
| R2 | 操作网格 (5 个卡片) | 5 个快捷入口跳转正常 | 在 header 下方不受影响 |
| R3 | `activity-scroll` 滚动 | flex:1 后列表高度正常 | **重点** |
| R4 | `@scrolltolower` 分页加载 | flex:1 后触底行为正常 | **重点** |
| R5 | `@refresherrefresh` 下拉刷新 | flex:1 后下拉手势正常触发 | **重点** |
| R6 | `:refresher-enabled="true"` | 下拉刷新可用 | **重点** |
| R7 | 活动详情弹窗 | 点击列表项弹出 detail-scroll | 嵌套 scroll-view 不受影响 |
| R8 | TabBar 切换 | 切换到其他 tab 再切回，状态保留 | 不受影响 |

#### knowledge.vue — 健身知识库
| # | 测试项 | 预期结果 |
|---|--------|----------|
| K1 | header 固定 | "健身知识库" 标题不动 |
| K2 | 搜索框 | 输入搜索关键词 |
| K3 | Grid 视图滚动 | 分类卡片列表正常滚动 |
| K4 | List 视图滚动 | 搜索后切换到 list 视图 |
| K5 | 训练计划入口 | 点击跳转 training-plan-list |
| K6 | 能量计算器入口 | 点击跳转 calorie-guide |
| K7 | 自定义动作弹窗 | 添加自定义动作 popup 正常 |

#### height.vue — 记录身高
| # | 测试项 | 预期结果 |
|---|--------|----------|
| HT1 | header 固定 + 返回 + 历史按钮 | 正常 |
| HT2 | 身高输入 + 提交 | 正常 |
| HT3 | 记录列表滚动 + swipe 删除 | flex:1 正常 |
| HT4 | 编辑弹窗 | popup 内 scroll-view 独立 |

#### cache-refresh.vue — 缓存刷新测试
| # | 测试项 | 预期结果 |
|---|--------|----------|
| C1 | header 固定 + 返回 | 正常 |
| C2 | 缓存数据展示 | 正常 |
| C3 | 日志滚动 | flex:1 正常 |

### 11.4 通用回归项（所有页面）

| # | 测试项 | 预期结果 |
|---|--------|----------|
| G1 | iOS 真机：页面打开后 header 固定在顶部 | 不随内容滚动 |
| G2 | Android 真机：页面打开后 header 固定在顶部 | 不随内容滚动 |
| G3 | iOS 底部安全区域 | Home Indicator 处内容不被遮挡 |
| G4 | Android 底部 | 内容不被底部导航栏遮挡 |
| G5 | 键盘弹出 (iOS) | 输入框聚焦时页面布局不错乱 |
| G6 | 键盘弹出 (Android) | 输入框聚焦时页面布局不错乱 |
| G7 | 横竖屏切换 | 布局正常（若支持） |
| G8 | 快速连续点击返回 | 不会多次 navigateBack 导致白屏 |