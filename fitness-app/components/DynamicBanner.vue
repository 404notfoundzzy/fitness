<template>
  <view class="banner" :class="'type' + currentType">
    <!-- 左侧文字 -->
    <view class="content">
      <view class="title">
        你好，<text class="name">{{ userName }}</text>
      </view>

      <view class="desc">
        请再次震动那颗
        <text class="highlight">不服输</text>
        的心脏
      </view>

      <view class="sub">开启清爽运动的一天吧！</view>
    </view>

    <!-- 右侧人物 -->
    <image class="figure" :src="imgSrc" mode="aspectFit" />

    <!-- 指示器 -->
    <view class="indicators">
      <view
        v-for="type in 4"
        :key="type"
        class="dot"
        :class="{ active: currentType === type }"
        @click="switchType(type)"
      />
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";

const props = defineProps({
  userName: {
    type: String,
    default: "新用户",
  },
});

const currentType = ref(1);
const timer = ref(null);

const imgSrc = computed(() => {
  const map = {
    1: "/static/banner/woman.png",
    2: "/static/banner/muscle.png",
    3: "/static/banner/runner3d.png",
    4: "/static/banner/boxing.png",
  };
  return map[currentType.value];
});

const switchType = (type) => {
  currentType.value = type;
  resetTimer();
};

const nextType = () => {
  currentType.value = currentType.value >= 4 ? 1 : currentType.value + 1;
};

const resetTimer = () => {
  if (timer.value) {
    clearInterval(timer.value);
  }
  timer.value = setInterval(nextType, 5000);
};

onMounted(() => {
  resetTimer();
});

onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value);
  }
});
</script>

<style lang="scss" scoped>
.banner {
  position: relative;
  display: flex;
  justify-content: space-between;
  padding: 40rpx 32rpx;
  border-radius: 32rpx;
  overflow: hidden;
  margin-bottom: 40rpx;
  min-height: 280rpx;
}

/* 左侧文本 */
.content {
  z-index: 2;
  width: 60%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.title {
  font-size: 42rpx;
  font-weight: bold;
  color: #111;
  margin-bottom: 16rpx;
}

.name {
  color: #3b82f6;
}

.desc {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 10rpx;
  line-height: 1.4;
}

.sub {
  font-size: 24rpx;
  color: #999;
}

.highlight {
  color: #3b82f6;
  font-weight: 600;
}

/* 人物 */
.figure {
  position: absolute;
  right: -20rpx;
  bottom: -20rpx;
  width: 55%;
  height: 110%;
  z-index: 1;
  animation: float 4s ease-in-out infinite;
}

/* 指示器 */
.indicators {
  position: absolute;
  bottom: 16rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12rpx;
  z-index: 3;
}

.dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;

  &.active {
    background: #3b82f6;
    width: 32rpx;
    border-radius: 8rpx;
  }
}

/* ===== 方案1：浅蓝活力 ===== */
.type1 {
  background: linear-gradient(
    135deg,
    #dbeafe 0%,
    #bfdbfe 25%,
    #93c5fd 50%,
    #60a5fa 75%,
    #3b82f6 100%
  );
  background-size: 200% 200%;
  animation: gradientFlow1 6s ease infinite;

  .title {
    color: #1e3a8a;
  }

  .name {
    color: #2563eb;
  }

  .desc {
    color: #1e40af;
  }

  .sub {
    color: #3b82f6;
  }

  &::after {
    content: "";
    position: absolute;
    right: -120rpx;
    top: -120rpx;
    width: 420rpx;
    height: 420rpx;
    background: radial-gradient(circle, rgba(147, 197, 253, 0.8), transparent);
    border-radius: 50%;
    animation: pulse 3s ease-in-out infinite;
  }

  .dot {
    background: rgba(255, 255, 255, 0.5);

    &.active {
      background: #fff;
    }
  }
}

/* ===== 方案2：暗夜荧光 ===== */
.type2 {
  background: linear-gradient(
    135deg,
    #0a0a0a 0%,
    #1a1a2e 25%,
    #16213e 50%,
    #0f3460 75%,
    #1a1a2e 100%
  );
  background-size: 300% 300%;
  animation: gradientFlow2 5s ease infinite;

  .title,
  .desc,
  .sub {
    color: #fff;
  }

  .highlight {
    color: #9eff00;
    text-shadow: 0 0 20rpx rgba(158, 255, 0, 0.6);
  }

  .name {
    color: #9eff00;
    text-shadow: 0 0 15rpx rgba(158, 255, 0, 0.5);
  }

  &::before {
    content: "";
    position: absolute;
    right: -80rpx;
    top: 40rpx;
    width: 260rpx;
    height: 260rpx;
    border: 6rpx solid #9eff00;
    border-radius: 50%;
    opacity: 0.5;
    animation: glowPulse 2s ease-in-out infinite;
  }

  .dot {
    background: rgba(255, 255, 255, 0.3);

    &.active {
      background: #9eff00;
      box-shadow: 0 0 10rpx rgba(158, 255, 0, 0.8);
    }
  }
}

/* ===== 方案3：紫蓝科技 ===== */
.type3 {
  background: linear-gradient(
    135deg,
    #eef2ff 0%,
    #c7d2fe 25%,
    #a5b4fc 50%,
    #818cf8 75%,
    #6366f1 100%
  );
  background-size: 250% 250%;
  animation: gradientFlow3 7s ease infinite;

  .name,
  .highlight {
    color: #4338ca;
    text-shadow: 0 0 10rpx rgba(99, 102, 241, 0.4);
  }

  .title {
    color: #312e81;
  }

  .desc {
    color: #3730a3;
  }

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 120rpx;
    background: linear-gradient(180deg, transparent, rgba(99, 102, 241, 0.3));
    animation: shimmer 3s ease-in-out infinite;
  }

  .dot {
    background: rgba(99, 102, 241, 0.3);

    &.active {
      background: #6366f1;
      box-shadow: 0 0 8rpx rgba(99, 102, 241, 0.6);
    }
  }
}

/* ===== 方案4：橙色力量 ===== */
.type4 {
  background: linear-gradient(
    135deg,
    #fff7ed 0%,
    #fed7aa 25%,
    #fdba74 50%,
    #fb923c 75%,
    #f97316 100%
  );
  background-size: 220% 220%;
  animation: gradientFlow4 5s ease infinite;

  .highlight {
    color: #c2410c;
    text-shadow: 0 0 10rpx rgba(249, 115, 22, 0.4);
  }

  .name {
    color: #ea580c;
  }

  .title {
    color: #7c2d12;
  }

  .desc {
    color: #9a3412;
  }

  &::after {
    content: "";
    position: absolute;
    right: 0;
    bottom: 0;
    width: 140rpx;
    height: 140rpx;
    background: linear-gradient(135deg, #fb923c, #ea580c);
    clip-path: polygon(100% 0, 0 100%, 100% 100%);
    animation: rotateGlow 4s linear infinite;
  }

  .dot {
    background: rgba(249, 115, 22, 0.3);

    &.active {
      background: #f97316;
      box-shadow: 0 0 8rpx rgba(249, 115, 22, 0.6);
    }
  }
}

/* 动画 */
@keyframes float {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10rpx);
  }
  100% {
    transform: translateY(0);
  }
}

/* 渐变流动动画 */
@keyframes gradientFlow1 {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes gradientFlow2 {
  0% {
    background-position: 0% 0%;
  }
  25% {
    background-position: 100% 0%;
  }
  50% {
    background-position: 100% 100%;
  }
  75% {
    background-position: 0% 100%;
  }
  100% {
    background-position: 0% 0%;
  }
}

@keyframes gradientFlow3 {
  0%,
  100% {
    background-position: 0% 50%;
  }
  33% {
    background-position: 50% 0%;
  }
  66% {
    background-position: 100% 50%;
  }
}

@keyframes gradientFlow4 {
  0% {
    background-position: 0% 100%;
  }
  50% {
    background-position: 100% 0%;
  }
  100% {
    background-position: 0% 100%;
  }
}

/* 装饰元素动画 */
@keyframes pulse {
  0%,
  100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

@keyframes glowPulse {
  0%,
  100% {
    opacity: 0.3;
    box-shadow: 0 0 20rpx rgba(158, 255, 0, 0.2);
  }
  50% {
    opacity: 0.8;
    box-shadow: 0 0 40rpx rgba(158, 255, 0, 0.6);
  }
}

@keyframes shimmer {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes rotateGlow {
  0% {
    clip-path: polygon(100% 0, 0 100%, 100% 100%);
    filter: hue-rotate(0deg);
  }
  50% {
    filter: hue-rotate(30deg);
  }
  100% {
    clip-path: polygon(100% 0, 0 100%, 100% 100%);
    filter: hue-rotate(0deg);
  }
}
</style>
