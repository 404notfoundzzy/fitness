<template>
  <view class="skeleton-card" :class="[`skeleton-card--${variant}`]" :style="{ animationDelay: delay }">
    <view class="skeleton-item skeleton-shimmer" :style="{ width: iconSize, height: iconSize, borderRadius: '24rpx' }"></view>
    <view class="skeleton-item skeleton-shimmer" :style="{ width: valueWidth, height: '48rpx', borderRadius: '12rpx' }"></view>
    <view class="skeleton-item skeleton-shimmer" :style="{ width: labelWidth, height: '28rpx', borderRadius: '8rpx' }"></view>
    <view v-if="variant === 'water'" class="skeleton-item skeleton-shimmer" style="width: 100%; height: 16rpx; border-radius: 8rpx; margin-top: 12rpx;"></view>
  </view>
</template>

<script>
export default {
  name: 'SkeletonCard',
  props: {
    variant: {
      type: String,
      default: 'default',
      validator: (v) => ['default', 'water'].includes(v),
    },
    iconSize: {
      type: String,
      default: '88rpx',
    },
    valueWidth: {
      type: String,
      default: '60%',
    },
    labelWidth: {
      type: String,
      default: '40%',
    },
    delay: {
      type: String,
      default: '0s',
    },
  },
}
</script>

<style scoped>
.skeleton-card {
  display: flex;
  flex-direction: column;
  padding: 30rpx 36rpx;
  background: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
  animation: skeleton-breathe 2s ease-in-out infinite;
}

.skeleton-card--water {
  flex-direction: row;
  align-items: center;
  gap: 28rpx;
  grid-column: span 2;
}

.skeleton-card--water .skeleton-item:nth-child(2) {
  width: 120rpx;
}

.skeleton-card--water .skeleton-item:nth-child(3) {
  width: 200rpx;
}

.skeleton-item {
  background: #e2e8f0;
  margin-bottom: 16rpx;
}

.skeleton-item:last-child {
  margin-bottom: 0;
}

.skeleton-shimmer {
  position: relative;
  overflow: hidden;
}

.skeleton-shimmer::after {
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
  0% {
    left: -150%;
  }
  100% {
    left: 150%;
  }
}

@keyframes skeleton-breathe {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
