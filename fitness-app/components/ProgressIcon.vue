<template>
  <view class="wrap" :style="{ width: size + 'rpx', height: size + 'rpx' }">
    <canvas
      :canvas-id="canvasId"
      :id="canvasId"
      class="canvas"
      :style="{ width: size + 'rpx', height: size + 'rpx' }"
      :width="canvasPixelSize"
      :height="canvasPixelSize"
    ></canvas>
    <view class="center">
      <AppIcon
        :name="icon"
        :active="progress >= 100"
        :size="iconWrapSize"
        :active-color="color"
        :breathe="false"
      />
    </view>
  </view>
</template>

<script>
import AppIcon from "./AppIcon.vue";

const requestAnimFrame =
  typeof requestAnimationFrame === "function"
    ? requestAnimationFrame
    : typeof uni !== "undefined" &&
        typeof uni.requestAnimationFrame === "function"
      ? uni.requestAnimationFrame
      : function (cb) {
          return setTimeout(cb, 16);
        };

const cancelAnimFrame =
  typeof cancelAnimationFrame === "function"
    ? cancelAnimationFrame
    : typeof uni !== "undefined" &&
        typeof uni.cancelAnimationFrame === "function"
      ? uni.cancelAnimationFrame
      : function (id) {
          clearTimeout(id);
        };

const getNow =
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? function () {
        return performance.now();
      }
    : function () {
        return Date.now();
      };

const COLOR_SHIFT = {
  "#ef4444": "#dc2626",
  "#3b82f6": "#2563eb",
  "#a78bfa": "#7c3aed",
  "#10b981": "#059669",
  "#f59e0b": "#d97706",
  "#2F6BFF": "#8A5CFF",
  "#8A5CFF": "#2F6BFF",
};

export default {
  name: "ProgressIcon",
  components: { AppIcon },
  props: {
    progress: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      default: "#2F6BFF",
    },
    icon: {
      type: String,
      default: "staff-filled",
    },
    size: {
      type: Number,
      default: 80,
    },
    strokeWidth: {
      type: Number,
      default: 6,
    },
  },
  data() {
    return {
      canvasId: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      currentProgress: 0,
      animFrameId: 0,
    };
  },
  computed: {
    canvasPixelSize() {
      return this.size;
    },
    iconWrapSize() {
      return Math.round(this.size * 0.5);
    },
  },
  watch: {
    progress(newVal) {
      this.animateTo(newVal);
    },
  },
  mounted() {
    this.$nextTick(() => {
      setTimeout(() => {
        this.animateTo(this.progress);
      }, 200);
    });
  },
  beforeUnmount() {
    if (this.animFrameId) {
      cancelAnimFrame(this.animFrameId);
      this.animFrameId = 0;
    }
  },
  methods: {
    animateTo(target) {
      if (this.animFrameId) {
        cancelAnimFrame(this.animFrameId);
        this.animFrameId = 0;
      }

      const start = this.currentProgress;
      const startTime = getNow();
      const duration = 800;

      const step = (now) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 4);
        this.currentProgress = start + (target - start) * eased;
        this.drawRing(this.currentProgress);
        if (t < 1) {
          this.animFrameId = requestAnimFrame(step);
        } else {
          this.currentProgress = target;
          this.drawRing(target);
          this.animFrameId = 0;
        }
      };

      this.animFrameId = requestAnimFrame(step);
    },

    drawRing(p) {
      try {
        const ctx = uni.createCanvasContext(this.canvasId, this);
        const s = this.size / 2;
        const radius = Math.max(1, s - this.strokeWidth - 4);

        ctx.clearRect(0, 0, this.size, this.size);

        ctx.setStrokeStyle("rgba(0,0,0,0.06)");
        ctx.setLineWidth(this.strokeWidth);
        ctx.setLineCap("round");
        ctx.beginPath();
        ctx.arc(s, s, radius, 0, 2 * Math.PI);
        ctx.stroke();

        if (p > 0.5) {
          const gradient = ctx.createLinearGradient(0, 0, this.size, this.size);
          gradient.addColorStop(0, this.color);
          gradient.addColorStop(1, this.shiftColor(this.color));

          ctx.setStrokeStyle(gradient);
          ctx.setLineWidth(this.strokeWidth);
          ctx.setLineCap("round");
          ctx.beginPath();
          ctx.arc(
            s,
            s,
            radius,
            -Math.PI / 2,
            -Math.PI / 2 + (2 * Math.PI * p) / 100,
          );
          ctx.stroke();

          if (p > 5) {
            ctx.setGlobalAlpha(0.12);
            ctx.setStrokeStyle(this.color);
            ctx.setLineWidth(this.strokeWidth + 4);
            ctx.beginPath();
            ctx.arc(
              s,
              s,
              radius,
              -Math.PI / 2,
              -Math.PI / 2 + (2 * Math.PI * p) / 100,
            );
            ctx.stroke();
            ctx.setGlobalAlpha(1);
          }
        }

        ctx.draw(false, () => {});
      } catch (e) {
        console.warn("ProgressIcon draw error:", e);
      }
    },

    shiftColor(hex) {
      return COLOR_SHIFT[hex] || hex;
    },
  },
};
</script>

<style scoped>
.wrap {
  position: relative;
}

.canvas {
  position: absolute;
  top: 0;
  left: 0;
}

.center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
