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
          <image
            src="/static/history.svg"
            mode="aspectFit"
            class="test-icon"
          ></image>
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
      scrollHeight: 0,
    };
  },
  onReady() {
    this.calcScrollHeight();
  },
  methods: {
    calcScrollHeight() {
      const sysInfo = uni.getSystemInfoSync();
      const windowHeight = sysInfo.windowHeight;
      const statusBarHeight = sysInfo.statusBarHeight || 0;
      // NavHeader 高度 = 状态栏 + 导航内容(约44px)
      const navContentHeight = 44;
      const headerHeight = statusBarHeight + navContentHeight;
      this.scrollHeight = windowHeight - headerHeight;
    },
    onRightClick() {
      uni.showToast({ title: "右侧按钮点击成功", icon: "none" });
    },
  },
};
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
