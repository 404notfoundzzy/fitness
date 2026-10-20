<template>
  <view class="loading-training-state">
    <view class="loading-skeleton">
      <view
        v-for="i in rows"
        :key="i"
        class="skeleton-card"
        :style="{ animationDelay: (i * 0.1) + 's' }"
      >
        <view class="skeleton-left">
          <view class="skeleton-icon shimmer"></view>
          <view class="skeleton-text-group">
            <view class="skeleton-title shimmer"></view>
            <view class="skeleton-desc shimmer"></view>
          </view>
        </view>
        <view class="skeleton-right">
          <view class="skeleton-badge shimmer"></view>
        </view>
      </view>
    </view>
    <text class="loading-hint">{{ hint }}</text>
  </view>
</template>

<script>
export default {
  name: 'ListSkeleton',
  props: {
    rows: {
      type: Number,
      default: 1,
    },
    hint: {
      type: String,
      default: '正在加载...',
    },
  },
}
</script>

<style scoped>
.loading-training-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 30rpx;
  gap: 24rpx;
}

.loading-skeleton {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.skeleton-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 24rpx;
  background: #ffffff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
  animation: skeleton-breathe 2s ease-in-out infinite;
}

.skeleton-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.skeleton-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: #e2e8f0;
}

.skeleton-text-group {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.skeleton-title {
  width: 200rpx;
  height: 30rpx;
  border-radius: 8rpx;
  background: #e2e8f0;
}

.skeleton-desc {
  width: 140rpx;
  height: 24rpx;
  border-radius: 6rpx;
  background: #e2e8f0;
}

.skeleton-right {
  display: flex;
  align-items: center;
}

.skeleton-badge {
  width: 100rpx;
  height: 40rpx;
  border-radius: 20rpx;
  background: #e2e8f0;
}

.shimmer {
  position: relative;
  overflow: hidden;
}

.shimmer::after {
  content: '';
  position: absolute;
  top: 0;
  left: -150%;
  width: 150%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    transparent 20%,
    rgba(255, 255, 255, 0.7) 50%,
    transparent 80%,
    transparent 100%
  );
  animation: shimmer 1.8s ease-in-out infinite;
}

@keyframes shimmer {
  0% { left: -150%; }
  100% { left: 150%; }
}

@keyframes skeleton-breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.loading-hint {
  font-size: 24rpx;
  color: #94a3b8;
  animation: skeleton-breathe 2s ease-in-out infinite;
}
</style>
