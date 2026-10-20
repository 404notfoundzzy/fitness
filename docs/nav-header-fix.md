# 固定导航栏组件 - 代码修改记录

> 创建时间：2026-06-04
> 目的：解决顶部返回栏随内容滚动的问题，实现 Header + scroll-view 分离布局

---

## 涉及文件（共 3 个）

| # | 文件路径 | 操作 |
|---|---------|------|
| 1 | `fitness-app/components/NavHeader/NavHeader.vue` | **新建** |
| 2 | `fitness-app/pages/test/nav-header-test.vue` | **新建** |
| 3 | `fitness-app/pages.json` | **追加路由配置** |

> **注意：未修改任何现有业务页面。**

---

## 文件 1：NavHeader 组件（新建）

**完整路径**：`fitness-app/components/NavHeader/NavHeader.vue`

```vue
<template>
  <view class="nav-header" :style="{ paddingTop: statusBarHeight + 'px' }">
    <view class="nav-content">
      <!-- 左侧返回按钮 -->
      <view
        v-if="showBack"
        class="nav-back"
        :style="backStyle"
        @click="handleBack"
      >
        <uni-icons type="left" size="20" :color="color"></uni-icons>
      </view>

      <!-- 标题 -->
      <text class="nav-title">{{ title }}</text>

      <!-- 右侧插槽 -->
      <view class="nav-right">
        <slot name="right"></slot>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: "NavHeader",
  props: {
    title: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "#0EA5E9",
    },
    iconBg: {
      type: String,
      default: "rgba(14,165,233,0.1)",
    },
    iconShape: {
      type: String,
      default: "circle",
    },
    showBack: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      statusBarHeight: 0,
    };
  },
  computed: {
    backStyle() {
      return {
        backgroundColor: this.iconBg,
        borderRadius: this.iconShape === "circle" ? "50%" : "20rpx",
      };
    },
  },
  created() {
    try {
      const sysInfo = uni.getSystemInfoSync();
      // 真机返回实际值，H5/浏览器可能返回 0
      this.statusBarHeight = sysInfo.statusBarHeight || 0;
      // #ifdef H5
      // 浏览器调试时给一个默认值，方便开发预览（iPhone 14 Pro Max ≈ 59px）
      if (this.statusBarHeight === 0) {
        this.statusBarHeight = 59;
      }
      // #endif
    } catch (e) {
      this.statusBarHeight = 44; // 兜底值
    }
  },
  methods: {
    handleBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        uni.navigateBack();
      } else {
        uni.switchTab({ url: "/pages/index/index" });
      }
    },
  },
};
</script>

<style scoped>
.nav-header {
  flex-shrink: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(1.8);
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
  width: 100%;
  box-sizing: border-box;
}

.nav-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12rpx 30rpx 16rpx;
  width: 100%;
  box-sizing: border-box;
}

.nav-back {
  width: 68rpx;
  height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-title {
  font-size: 42rpx;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.5rpx;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-right {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-shrink: 0;
}
</style>
```

### Props 说明

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | String | `""` | 标题文字 |
| `color` | String | `"#0EA5E9"` | 返回图标颜色（主题色） |
| `iconBg` | String | `"rgba(14,165,233,0.1)"` | 返回按钮背景色 |
| `iconShape` | String | `"circle"` | 按钮形状：`circle` 或 `square` |
| `showBack` | Boolean | `true` | 是否显示返回按钮 |

### Slot

- **#right**：右侧自定义内容（如历史按钮、今日kcal等）

### 关键设计点

1. **状态栏留白**：通过 `uni.getSystemInfoSync().statusBarHeight` 动态获取，用内联样式 `paddingTop` 设置。H5 模式下 fallback 为 59px。
2. **毛玻璃效果**：`backdrop-filter: blur(20px)` 实现半透明磨砂效果。
3. **自动注册**：项目 easycom 配置了 `autoscan: true`，无需手动 import。

---

## 文件 2：测试页面（新建）

**完整路径**：`fitness-app/pages/test/nav-header-test.vue`

```vue
<template>
  <view class="page-container">
    <!-- 固定顶部：NavHeader + 状态栏留白 -->
    <NavHeader
      title="测试固定导航栏"
      color="#14B8A6"
      iconBg="rgba(20,184,166,0.1)"
      iconShape="square"
    >
      <template #right>
        <view class="test-right-btn" @click="onRightClick">
          <image src="/static/history.svg" mode="aspectFit" class="test-icon"></image>
        </view>
      </template>
    </NavHeader>

    <!-- 可滚动内容区域 -->
    <scroll-view 
      scroll-y 
      class="page-body" 
      :style="{ height: scrollHeight + 'px' }"
    >
      <view class="page-body-inner">
        <!-- 模拟记录卡片 -->
        <view class="test-card">
          <text class="card-title">验证项 1：导航栏是否固定</text>
          <text class="card-desc">向下滚动页面，顶部导航栏应保持不动</text>
        </view>

        <view class="test-card">
          <text class="card-title">验证项 2：内容是否可正常滚动</text>
          <text class="card-desc">页面内容应平滑滚动，无卡顿</text>
        </view>

        <view class="test-card">
          <text class="card-title">验证项 3：状态栏留白</text>
          <text class="card-desc">导航栏上方应留出状态栏/刘海区域空间</text>
        </view>

        <view class="test-card">
          <text class="card-title">验证项 4：返回按钮</text>
          <text class="card-desc">点击左侧返回按钮应能返回上一页</text>
        </view>

        <view class="test-card">
          <text class="card-title">验证项 5：右侧插槽</text>
          <text class="card-desc">右上角应显示历史按钮图标</text>
        </view>

        <!-- 填充内容，确保页面可滚动 -->
        <view v-for="i in 20" :key="i" class="test-item">
          <text class="item-text">滚动内容第 {{ i }} 项</text>
        </view>

        <!-- 底部安全区域 -->
        <view class="bottom-safe"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      scrollHeight: 0
    }
  },
  onReady() {
    this.calcScrollHeight()
  },
  methods: {
    calcScrollHeight() {
      const sysInfo = uni.getSystemInfoSync()
      const windowHeight = sysInfo.windowHeight
      const statusBarHeight = sysInfo.statusBarHeight || 0
      // NavHeader 高度 = 状态栏 + 导航内容(约44px)
      const navContentHeight = 44
      const headerHeight = statusBarHeight + navContentHeight
      this.scrollHeight = windowHeight - headerHeight
    },
    onRightClick() {
      uni.showToast({ title: '右侧按钮点击成功', icon: 'none' })
    }
  }
}
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: #f0fdfa;
}

.page-body {
  width: 100%;
  box-sizing: border-box;
}

.page-body-inner {
  padding: 24rpx 30rpx;
  box-sizing: border-box;
}

.test-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  box-sizing: border-box;
}

.card-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #0f172a;
  display: block;
  margin-bottom: 12rpx;
}

.card-desc {
  font-size: 26rpx;
  color: #64748b;
  display: block;
}

.test-item {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 28rpx 32rpx;
  margin-bottom: 16rpx;
  border-left: 6rpx solid #14b8a6;
  box-sizing: border-box;
}

.item-text {
  font-size: 28rpx;
  color: #334155;
}

.test-right-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(20, 184, 166, 0.1);
  border-radius: 20rpx;
}

.test-icon {
  width: 32rpx;
  height: 32rpx;
}

.bottom-safe {
  height: 40rpx;
}
</style>
```

### 页面布局结构（核心模式）

```
┌───────────────────────────────┐
│   page-container (flex column │
│   height: 100vh, overflow:    │
│   hidden)                     │
│                               │
│  ┌───────────────────────────┐│
│  │ NavHeader (flex-shrink:0) ││ ← 固定不动，含状态栏paddingTop
│  └───────────────────────────┘│
│                               │
│  ┌───────────────────────────┐│
│  │ scroll-view (height: JS   ││ ← 动态计算高度 = windowH - headerH
│  │ 计算明确值)                ││
│  │  ┌─────────────────────┐  ││
│  │  │ page-body-inner     │  ││ ← 内容放这里，原样搬入即可
│  │  │ (padding: 24rpx     │  ││
│  │  │  30rpx)             │  ││
│  │  └─────────────────────┘  ││
│  └───────────────────────────┘│
└───────────────────────────────┘
```

### 关键设计点

1. **scroll-view 必须有明确高度**：uni-app 中 `scroll-view` 的 `scroll-y` 生效前提是设置了具体的高度值（不能用 flex:1），所以通过 `onReady()` 中 JS 计算 `windowHeight - headerHeight` 赋值。
2. **内容不溢出**：`scroll-view` 自身不加 padding，内部包一层 `<view class="page-body-inner">` 放 padding，所有元素加 `box-sizing: border-box`。
3. **不使用 SCSS 嵌套**：避免编译问题，全部使用 flat CSS 选择器。

---

## 文件 3：pages.json 路由注册（追加）

**文件**：`fitness-app/pages.json`
**位置**：在 `loading-preview` 路由之后、数组闭合之前

**追加内容**：

```json
		{
			"path": "pages/test/nav-header-test",
			"style": {
				"navigationStyle": "custom",
				"navigationBarTitleText": "导航栏测试"
			}
		}
```

**上下文参考**（在 loading-preview 条目后面追加）：

```json
// ... 前面已有内容 ...
		{
			"path": "pages/test/loading-preview",
			"style": {
				"navigationStyle": "custom",
				"navigationBarTitleText": "加载动画总览"
			}
		},
		{
			"path": "pages/test/nav-header-test",       <-- 新增这一段
			"style": {                                   <--
				"navigationStyle": "custom",             <--
				"navigationBarTitleText": "导航栏测试"    <--
			}                                           <--
		}
// ... 后续内容 ...
```

---

## 后续应用步骤（待测试通过后执行）

确认测试页面在真机上正常后，对以下页面逐一改造：

### 改造模板

每个页面只需做两件事：

**Step 1**：外层容器改为 flex 布局
```html
<!-- 原来 -->
<view class="container">

<!-- 改为 -->
<view class="page-container">
```

**Step 2**：把原有 header 替换为 NavHeader 组件，内容包进 scroll-view
```html
<view class="page-container">
  <NavHeader title="xxx" color="#xxx" iconBg="rgba(...)">
    <template #right>
      <!-- 原来header右侧的内容放这里 -->
    </template>
  </NavHeader>

  <scroll-view scroll-y class="page-body" :style="{ height: scrollHeight + 'px' }">
    <view class="page-body-inner">
      <!-- 原有内容原样搬入，一个字都不用改 -->
    </view>
  </scroll-view>
</view>
```

**Step 3**：JS 中添加 scrollHeight 计算
```javascript
data() {
  return {
    scrollHeight: 0,
    // ... 其他 data 不变
  }
},
onReady() {
  this.calcScrollHeight()
},
methods: {
  calcScrollHeight() {
    const sysInfo = uni.getSystemInfoSync()
    const windowHeight = sysInfo.windowHeight
    const statusBarHeight = sysInfo.statusBarHeight || 0
    const headerHeight = statusBarHeight + 44 // 44是导航内容区高度
    this.scrollHeight = windowHeight - headerHeight
  },
  // ... 其他 methods 不变
}
```

**Step 4**：CSS 添加两个类
```css
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  /* 保留原有的背景色 */
}

.page-body {
  width: 100%;
  box-sizing: border-box;
}

.page-body-inner {
  /* 把原来 .container 的 padding 移到这里 */
  padding: 24rpx 30rpx; /* 根据各页面实际情况调整 */
  box-sizing: border-box;
}
```

### 待改造页面清单（按优先级排序）

| 优先级 | 页面 | 导航栏类型 | 对应主题色 |
|--------|------|-----------|-----------|
| P1 | `workout.vue` | 返回+标题+历史 | `#F97316` (橙) |
| P1 | `diet.vue` | 返回+标题+kcal+历史 | `#F97316` (橙) |
| P1 | `water.vue` | 返回+标题+历史 | `#06B6D4` (青) |
| P1 | `weight.vue` | 返回+标题+历史 | `#14B8A6` (绿) |
| P2 | `weight-history.vue` | 返回+标题 | `#14B8A6` (绿) |
| P2 | `water-history.vue` | 返回+标题 | `#06B6D4` (青) |
| P2 | `diet-history.vue` | 返回+标题 | `#F97316` (橙) |
| P2 | `height-history.vue` | 返回+标题 | `#8B5CF6` (紫) |
| P2 | `history.vue` | 返回+标题+筛选 | `#0EA5E9` (蓝) |
| P2 | `height.vue` | 返回+标题+历史 | `#8B5CF6` (紫) |
| P3 | `record.vue` | 纯标题 | 无返回按钮 |
| P3 | `knowledge.vue` | 纯标题 | 无返回按钮 |

---

## 已知注意事项

1. **H5 浏览器调试时状态栏高度为 0 是正常的**——浏览器没有真实的状态栏区域。真机上 `statusBarHeight` 会返回正确值（如 iPhone 14 Pro Max = 59px）。
2. **如果某页面使用了 `onReachBottom` 生命周期**，需要改为监听 scroll-view 的 `@scrolltolower` 事件。
3. **如果某页面使用了页面级下拉刷新**，需要在 scroll-view 上加 `refresher-enabled` 属性替代。
