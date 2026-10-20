<template>
  <view class="progress-ring" :style="ringStyle">
    <view class="ring-track"></view>
    <view class="ring-fill" :style="fillStyle"></view>
    <view
      class="ring-glow"
      v-if="currentProgress > 0 && glowEnabled"
      :style="{ background: glowBackground }"
    ></view>
    <view
      class="ring-halo"
      v-if="currentProgress >= 100"
      :style="{ borderColor: colors[0] }"
    ></view>
    <view class="ring-center" :class="{ transparent: transparentCenter }">
      <slot v-if="$slots.default"></slot>
      <view v-else class="ring-text-group">
        <text
          v-if="showText"
          class="ring-progress-text"
          :style="{ color: textColor, fontSize: textSize + 'rpx' }"
          >{{ displayProgress }}%</text
        >
        <text
          v-if="label"
          class="ring-label"
          :style="{ fontSize: labelSize + 'rpx', color: textColor }"
          >{{ label }}</text
        >
      </view>
    </view>
  </view>
</template>

<script>
const requestAnimFrame =
  typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame
    : typeof uni !== 'undefined' && typeof uni.requestAnimationFrame === 'function'
      ? uni.requestAnimationFrame
      : function (cb) { return setTimeout(cb, 16) }

const cancelAnimFrame =
  typeof cancelAnimationFrame === 'function'
    ? cancelAnimationFrame
    : typeof uni !== 'undefined' && typeof uni.cancelAnimationFrame === 'function'
      ? uni.cancelAnimationFrame
      : function (id) { clearTimeout(id) }

const getNow =
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? function () { return performance.now() }
    : function () { return Date.now() }

export default {
  name: "ProgressRing",
  props: {
    progress: { type: Number, default: 0 },
    size: { type: Number, default: 100 },
    strokeWidth: { type: Number, default: 6 },
    trackColor: {
      type: String,
      default: "rgba(0,0,0,0.06)",
    },
    colors: { type: Array, default: () => ["#2F6BFF", "#8A5CFF"] },
    showText: { type: Boolean, default: true },
    textSize: { type: Number, default: 18 },
    label: { type: String, default: "" },
    labelSize: { type: Number, default: 11 },
    textColor: { type: String, default: "#2F6BFF" },
    animated: { type: Boolean, default: true },
    duration: { type: Number, default: 800 },
    glowEnabled: { type: Boolean, default: true },
    transparentCenter: { type: Boolean, default: false },
  },
  data() {
    return {
      currentProgress: 0,
      animationFrame: null,
      isAnimating: false,
    };
  },
  computed: {
    ringStyle() {
      return {
        width: this.size + "rpx",
        height: this.size + "rpx",
      };
    },
    fillStyle() {
      const angle = (this.currentProgress / 100) * 360;
      return {
        background: `conic-gradient(from -90deg, ${this.colors[0]} ${angle}deg, ${this.trackColor} ${angle}deg)`,
      };
    },
    glowBackground() {
      return `radial-gradient(circle, ${this.colors[0]}1a 0%, ${this.colors[1] || this.colors[0]}0d 40%, transparent 70%)`;
    },
    displayProgress() {
      return Math.round(this.currentProgress);
    },
  },
  watch: {
    progress(newVal) {
      if (!this.animated) {
        this.currentProgress = newVal;
        return;
      }
      this.animateTo(newVal);
    },
  },
  mounted() {
    this.$nextTick(() => {
      setTimeout(() => {
        if (this.animated) {
          this.animateTo(this.progress);
        } else {
          this.currentProgress = this.progress;
        }
      }, 100);
    });
  },
  beforeUnmount() {
    if (this.animationFrame) {
      cancelAnimFrame(this.animationFrame)
    }
  },
  methods: {
    easeOutExpo(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    },

    animateTo(target) {
      if (this.isAnimating && Math.abs(target - this.progress) < 0.5) return

      const start = this.currentProgress
      const startTime = getNow()
      const animDuration = this.duration

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime
        let progress = Math.min(elapsed / animDuration, 1)

        const easedProgress = this.easeOutExpo(progress)
        this.currentProgress = start + (target - start) * easedProgress

        if (progress < 1) {
          this.isAnimating = true
          this.animationFrame = requestAnimFrame(animate)
        } else {
          this.isAnimating = false
          this.currentProgress = target
        }
      }

      if (this.animationFrame) {
        cancelAnimFrame(this.animationFrame)
      }

      this.isAnimating = true
      this.animationFrame = requestAnimFrame(animate)
    },
  },
};
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
  -webkit-mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 8rpx),
    #000 0
  );
}

.ring-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 70%;
  height: 70%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  pointer-events: none;
  animation: pulse 2.5s ease-in-out infinite;
}

.ring-halo {
  position: absolute;
  inset: -8rpx;
  border-radius: 50%;
  border: 3rpx solid;
  opacity: 0.4;
  animation: haloPulse 2s ease-in-out infinite;
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
  box-shadow: 0 4rpx 16rpx rgba(47, 107, 255, 0.08);
}

.ring-center.transparent {
  background: transparent;
  box-shadow: none;
}

.ring-text-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ring-progress-text {
  font-weight: 700;
  line-height: 1;
}

.ring-label {
  font-weight: 500;
  opacity: 0.8;
  margin-top: 2rpx;
}

@keyframes pulse {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.15);
    opacity: 0.8;
  }
}

@keyframes haloPulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.7;
  }
}
</style>
