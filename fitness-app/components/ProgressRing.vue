<template>
  <view
    class="progress-ring-container"
    :style="{ width: size + 'px', height: size + 'px' }"
  >
    <canvas
      :canvas-id="canvasId"
      :id="canvasId"
      class="ring-canvas"
      :style="{ width: size + 'px', height: size + 'px' }"
    ></canvas>
    <view class="ring-glow" v-if="currentProgress > 0 && glowEnabled"></view>
    <view class="ring-content" v-if="showText">
      <text
        class="ring-percent"
        :style="{ fontSize: textSize + 'px', color: textColor }"
        >{{ displayProgress }}%</text
      >
      <text
        v-if="label"
        class="ring-label"
        :style="{ fontSize: labelSize + 'px' }"
        >{{ label }}</text
      >
    </view>
  </view>
</template>

<script>
export default {
  name: "ProgressRing",
  props: {
    progress: {
      type: Number,
      default: 0,
      validator: (val) => val >= 0 && val <= 100,
    },
    size: {
      type: Number,
      default: 72,
    },
    strokeWidth: {
      type: Number,
      default: 6,
    },
    trackColor: {
      type: String,
      default: "rgba(0,0,0,0.05)",
    },
    colors: {
      type: Array,
      default: () => ["#2F6BFF", "#8A5CFF"],
    },
    showText: {
      type: Boolean,
      default: true,
    },
    label: {
      type: String,
      default: "",
    },
    textSize: {
      type: Number,
      default: 18,
    },
    labelSize: {
      type: Number,
      default: 12,
    },
    textColor: {
      type: String,
      default: "#2F6BFF",
    },
    animated: {
      type: Boolean,
      default: true,
    },
    duration: {
      type: Number,
      default: 1000,
    },
    glowEnabled: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      canvasId: `progressRing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      currentProgress: 0,
      displayProgress: 0,
      animationFrame: null,
      isAnimating: false,
    };
  },
  computed: {},
  watch: {
    progress: {
      handler(newVal) {
        this.animateTo(newVal);
      },
      immediate: false,
    },
  },
  mounted() {
    this.$nextTick(() => {
      setTimeout(() => {
        if (this.animated) {
          this.animateTo(this.progress);
        } else {
          this.currentProgress = this.progress;
          this.displayProgress = this.progress;
          this.drawRing();
        }
      }, 150);
    });
  },
  beforeUnmount() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  },
  methods: {
    easeOutExpo(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    },

    easeOutQuart(t) {
      return 1 - Math.pow(1 - t, 4);
    },

    animateTo(target) {
      if (this.isAnimating && Math.abs(target - this.progress) < 0.5) {
        return;
      }

      const start = this.currentProgress;
      const startTime = performance.now();
      const animDuration = this.duration;

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        let progress = Math.min(elapsed / animDuration, 1);

        const easedProgress = this.easeOutExpo(progress);
        this.currentProgress = start + (target - start) * easedProgress;

        this.displayProgress = Math.round(this.currentProgress);

        this.drawRing();

        if (progress < 1) {
          this.isAnimating = true;
          this.animationFrame = requestAnimationFrame(animate);
        } else {
          this.isAnimating = false;
          this.currentProgress = target;
          this.displayProgress = target;
          this.drawRing();
        }
      };

      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }

      this.isAnimating = true;
      this.animationFrame = requestAnimationFrame(animate);
    },

    drawRing() {
      try {
        const ctx = uni.createCanvasContext(this.canvasId, this);
        const centerX = this.size / 2;
        const centerY = this.size / 2;
        const radius = Math.max(1, this.size / 2 - this.strokeWidth / 2 - 2);

        ctx.clearRect(0, 0, this.size, this.size);

        ctx.setLineCap("round");

        ctx.setStrokeStyle(this.trackColor);
        ctx.setLineWidth(this.strokeWidth);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();

        if (this.currentProgress > 0.5) {
          const gradient = ctx.createLinearGradient(0, 0, this.size, this.size);
          gradient.addColorStop(0, this.colors[0]);
          gradient.addColorStop(1, this.colors[1] || this.colors[0]);

          ctx.setStrokeStyle(gradient);
          ctx.setLineWidth(this.strokeWidth);

          const startAngle = -Math.PI / 2;
          const endAngle =
            startAngle + (this.currentProgress / 100) * 2 * Math.PI;

          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, startAngle, endAngle);
          ctx.stroke();

          if (this.glowEnabled && this.currentProgress > 5) {
            ctx.setGlobalAlpha(0.15);
            ctx.setStrokeStyle(this.colors[0]);
            ctx.setLineWidth(this.strokeWidth + 4);
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.stroke();
            ctx.setGlobalAlpha(1);
          }
        }

        ctx.draw(false, () => {});
      } catch (e) {
        console.warn("ProgressRing draw error:", e);
      }
    },
  },
};
</script>

<style scoped>
.progress-ring-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring-canvas {
  position: absolute;
  top: 0;
  left: 0;
}

.ring-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60%;
  height: 60%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(47, 107, 255, 0.12) 0%,
    transparent 70%
  );
  pointer-events: none;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.08);
  }
}

.ring-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ring-percent {
  font-weight: 700;
  line-height: 1;
  transition: all 0.15s ease;
}

.ring-label {
  color: #9aa3af;
  margin-top: 4rpx;
  font-weight: 500;
}
</style>
