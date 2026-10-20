<template>
  <view
    class="result-modal-overlay"
    :class="[
      overlayClass,
      'modal-type-' + modal.type,
      modal.theme ? 'modal-theme-' + modal.theme : '',
    ]"
    @click="onOverlayClick"
  >
    <view class="result-modal-card" @click.stop>
      <view class="particles-container">
        <view
          class="particle"
          v-for="(p, i) in 8"
          :key="i"
          :style="particleStyle(i)"
        ></view>
      </view>

      <view class="icon-area">
        <view class="icon-glow"></view>
        <view class="icon-circle">
          <svg
            v-if="modal.type === 'success'"
            class="icon-svg checkmark-svg"
            viewBox="0 0 40 40"
            fill="none"
          >
            <path class="draw-path checkmark-path" d="M10 20L17 27L30 13" />
          </svg>
          <svg
            v-else-if="modal.type === 'error'"
            class="icon-svg"
            viewBox="0 0 40 40"
            fill="none"
          >
            <path class="draw-path cross-path-l" d="M12 12L28 28" />
            <path class="draw-path cross-path-r" d="M28 12L12 28" />
          </svg>
          <svg
            v-else-if="modal.type === 'warning'"
            class="icon-svg"
            viewBox="0 0 40 40"
            fill="none"
          >
            <path
              class="draw-path warn-line"
              d="M20 12V22"
              stroke-width="3.5"
              stroke-linecap="round"
            />
            <circle cx="20" cy="28" r="2" fill="white" />
          </svg>
          <svg v-else class="icon-svg" viewBox="0 0 40 40" fill="none">
            <path
              d="M20 14V14.01"
              stroke="white"
              stroke-width="3.5"
              stroke-linecap="round"
            />
            <path
              class="draw-path info-line"
              d="M20 20V28"
              stroke-width="3"
              stroke-linecap="round"
            />
          </svg>
        </view>
      </view>

      <text class="result-modal-title">{{ modal.title }}</text>
      <text class="result-modal-desc" v-if="modal.desc">{{ modal.desc }}</text>

      <view
        class="result-modal-btn"
        :class="'btn-' + modal.type"
        @click="close"
      >
        {{ modal.btnText }}
      </view>

      <view class="auto-close-bar" v-if="modal.autoClose > 0">
        <view
          class="bar-fill"
          :class="[barRunning ? 'running' : '']"
          :style="{ animationDuration: modal.autoClose + 'ms' }"
        ></view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: "ResultModal",
  data() {
    return {
      modal: {
        visible: false,
        leaving: false,
        type: "success",
        theme: "",
        title: "",
        desc: "",
        btnText: "知道了",
        autoClose: 0,
        maskClosable: true,
      },
      barRunning: false,
      timer: null,
    };
  },
  computed: {
    overlayClass() {
      return {
        show: this.modal.visible && !this.modal.leaving,
        leaving: this.modal.leaving,
      };
    },
  },
  methods: {
    show(options = {}) {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }

      this.modal = {
        visible: true,
        leaving: false,
        type: options.type || "success",
        theme: options.theme || "",
        title: options.title || "",
        desc: options.desc || "",
        btnText: options.btnText || this.getDefaultBtnText(options.type),
        autoClose: options.autoClose !== undefined ? options.autoClose : 2500,
        maskClosable:
          options.maskClosable !== undefined ? options.maskClosable : true,
        onConfirm: options.onConfirm || null,
      };

      this.barRunning = false;
      this.$nextTick(() => {
        this.barRunning = true;
      });

      if (this.modal.autoClose > 0) {
        this.timer = setTimeout(() => {
          this.close();
        }, this.modal.autoClose);
      }
    },

    close() {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      this.barRunning = false;
      this.modal.leaving = true;
      const onConfirm = this.modal.onConfirm;
      setTimeout(() => {
        this.modal.visible = false;
        this.modal.leaving = false;
        if (typeof onConfirm === "function") {
          onConfirm();
        }
      }, 300);
    },

    onOverlayClick() {
      if (this.modal.maskClosable) {
        this.close();
      }
    },

    getDefaultBtnText(type) {
      const map = {
        success: "太好了",
        error: "再试一次",
        warning: "我知道了",
        info: "知道了",
      };
      return map[type] || "知道了";
    },

    particleStyle(index) {
      const positions = [
        { px: "-25px", py: "-35px", left: "30%", top: "25%" },
        { px: "30px", py: "-28px", left: "65%", top: "20%" },
        { px: "35px", py: "10px", left: "75%", top: "40%" },
        { px: "-30px", py: "15px", left: "20%", top: "45%" },
        { px: "5px", py: "-40px", left: "50%", top: "15%" },
        { px: "25px", py: "20px", left: "80%", top: "55%" },
        { px: "-20px", py: "25px", left: "15%", top: "60%" },
        { px: "10px", py: "30px", left: "45%", top: "65%" },
      ];
      const delays = [0.1, 0.15, 0.2, 0.25, 0.12, 0.3, 0.18, 0.22];
      const sizes = [6, 4, 5, 3, 7, 4, 5, 3];
      const p = positions[index];
      return {
        "--px": p.px,
        "--py": p.py,
        left: p.left,
        top: p.top,
        width: sizes[index] + "px",
        height: sizes[index] + "px",
        animationDelay: delays[index] + "s",
      };
    },
  },
  mounted() {
    this._onGlobalModal = (options) => {
      this.show(options);
    };
    uni.$on("globalModal", this._onGlobalModal);
  },
  beforeUnmount() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    if (this._onGlobalModal) {
      uni.$off("globalModal", this._onGlobalModal);
    }
  },
};
</script>

<style lang="scss" scoped>
.result-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.35s ease;
}

.result-modal-overlay.show {
  opacity: 1;
  pointer-events: auto;
}

.result-modal-overlay.leaving {
  opacity: 0;
  pointer-events: none;
}

.result-modal-card {
  width: 520rpx;
  max-width: 85vw;
  min-height: 360rpx;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 36rpx;
  padding: 60rpx 44rpx 46rpx;
  text-align: center;
  position: relative;
  overflow: hidden;
  transform: scale(0.8) translateY(60rpx);
  transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 44rpx 108rpx rgba(0, 0, 0, 0.15);
}

.result-modal-overlay.show .result-modal-card {
  transform: scale(1) translateY(0);
}

.result-modal-overlay.leaving .result-modal-card {
  transform: scale(0.9) translateY(40rpx);
  transition: transform 0.25s ease-in;
}

.particles-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.particle {
  position: absolute;
  border-radius: 50%;
  opacity: 0;
}

.result-modal-overlay.show .particle {
  animation: particleBurst 0.8s ease-out forwards;
}

.modal-type-success .particle {
  background: rgba(16, 185, 129, 0.6);
  box-shadow: 0 0 16rpx rgba(16, 185, 129, 0.4);
}
.modal-type-error .particle {
  background: rgba(239, 68, 68, 0.6);
  box-shadow: 0 0 16rpx rgba(239, 68, 68, 0.4);
}
.modal-type-warning .particle {
  background: rgba(245, 158, 11, 0.6);
  box-shadow: 0 0 16rpx rgba(245, 158, 11, 0.4);
}
.modal-type-info .particle {
  background: rgba(59, 130, 246, 0.6);
  box-shadow: 0 0 16rpx rgba(59, 130, 246, 0.4);
}

@keyframes particleBurst {
  0% {
    transform: translate(0, 0) scale(0);
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  100% {
    transform: translate(var(--px, 20px), var(--py, -30px)) scale(1);
    opacity: 0;
  }
}

.icon-area {
  position: relative;
  width: 100rpx;
  height: 100rpx;
  margin: 0 auto 28rpx;
  z-index: 1;
}

.icon-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 150rpx;
  height: 150rpx;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: glowPulse 2.5s ease-in-out infinite;
}

.modal-type-success .icon-glow {
  background: radial-gradient(
    circle,
    rgba(16, 185, 129, 0.25) 0%,
    transparent 70%
  );
}
.modal-type-error .icon-glow {
  background: radial-gradient(
    circle,
    rgba(239, 68, 68, 0.25) 0%,
    transparent 70%
  );
}
.modal-type-warning .icon-glow {
  background: radial-gradient(
    circle,
    rgba(245, 158, 11, 0.25) 0%,
    transparent 70%
  );
}
.modal-type-info .icon-glow {
  background: radial-gradient(
    circle,
    rgba(59, 130, 246, 0.25) 0%,
    transparent 70%
  );
}

@keyframes glowPulse {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.6;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 1;
  }
}

.icon-circle {
  position: relative;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  animation: iconBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes iconBounce {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
}

.modal-type-success .icon-circle {
  background: linear-gradient(135deg, #10b981, #34d399);
  box-shadow:
    0 14rpx 40rpx rgba(16, 185, 129, 0.35),
    inset 0 -4rpx 10rpx rgba(0, 0, 0, 0.1),
    inset 0 4rpx 10rpx rgba(255, 255, 255, 0.25);
}
.modal-type-error .icon-circle {
  background: linear-gradient(135deg, #ef4444, #f87171);
  box-shadow:
    0 14rpx 40rpx rgba(239, 68, 68, 0.35),
    inset 0 -4rpx 10rpx rgba(0, 0, 0, 0.1),
    inset 0 4rpx 10rpx rgba(255, 255, 255, 0.25);
}
.modal-type-warning .icon-circle {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  box-shadow:
    0 14rpx 40rpx rgba(245, 158, 11, 0.35),
    inset 0 -4rpx 10rpx rgba(0, 0, 0, 0.1),
    inset 0 4rpx 10rpx rgba(255, 255, 255, 0.25);
}
.modal-type-info .icon-circle {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  box-shadow:
    0 14rpx 40rpx rgba(59, 130, 246, 0.35),
    inset 0 -4rpx 10rpx rgba(0, 0, 0, 0.1),
    inset 0 4rpx 10rpx rgba(255, 255, 255, 0.25);
}

.draw-path {
  stroke: white;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
  stroke-dasharray: 40;
  stroke-dashoffset: 40;
  stroke-width: 3;
}

.result-modal-overlay.show .draw-path {
  animation: drawPath 0.5s 0.3s ease-out forwards;
}

@keyframes drawPath {
  to {
    stroke-dashoffset: 0;
  }
}

.checkmark-svg {
  width: 48rpx;
  height: 48rpx;
}

.icon-svg {
  width: 48rpx;
  height: 48rpx;
}

.result-modal-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 6rpx;
  position: relative;
  z-index: 1;
}

.result-modal-desc {
  display: block;
  font-size: 24rpx;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 32rpx;
  position: relative;
  z-index: 1;
}

.result-modal-btn {
  width: 100%;
  padding: 18rpx;
  border-radius: 22rpx;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  font-size: 26rpx;
  font-weight: 600;
  color: #fff;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
}

.result-modal-btn:active {
  transform: scale(0.96);
}

.btn-success {
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 8rpx 28rpx rgba(16, 185, 129, 0.3);
}
.btn-error {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  box-shadow: 0 8rpx 28rpx rgba(239, 68, 68, 0.3);
}
.btn-warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  box-shadow: 0 8rpx 28rpx rgba(245, 158, 11, 0.3);
}
.btn-info {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 8rpx 28rpx rgba(59, 130, 246, 0.3);
}

.auto-close-bar {
  width: 100%;
  height: 4rpx;
  border-radius: 2rpx;
  background: #f1f5f9;
  margin-top: 24rpx;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.bar-fill {
  height: 100%;
  border-radius: 3rpx;
  width: 100%;
  transform-origin: left;
}

.modal-type-success .bar-fill {
  background: linear-gradient(90deg, #10b981, #34d399);
}
.modal-type-error .bar-fill {
  background: linear-gradient(90deg, #ef4444, #f87171);
}
.modal-type-warning .bar-fill {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}
.modal-type-info .bar-fill {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
}

.bar-fill.running {
  animation: barShrink 2500ms linear forwards;
}

@keyframes barShrink {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

.modal-theme-workout .icon-circle {
  background: linear-gradient(135deg, #f59e0b, #f97316) !important;
  box-shadow:
    0 14rpx 40rpx rgba(245, 158, 11, 0.35),
    inset 0 -4rpx 10rpx rgba(0, 0, 0, 0.1),
    inset 0 4rpx 10rpx rgba(255, 255, 255, 0.25) !important;
}
.modal-theme-workout .icon-glow {
  background: radial-gradient(
    circle,
    rgba(245, 158, 11, 0.25) 0%,
    transparent 70%
  ) !important;
}
.modal-theme-workout .particle {
  background: rgba(245, 158, 11, 0.6) !important;
  box-shadow: 0 0 16rpx rgba(245, 158, 11, 0.4) !important;
}
.modal-theme-workout .result-modal-btn {
  background: linear-gradient(135deg, #f59e0b, #d97706) !important;
  box-shadow: 0 8rpx 28rpx rgba(245, 158, 11, 0.3) !important;
}
.modal-theme-workout .bar-fill {
  background: linear-gradient(90deg, #f59e0b, #fbbf24) !important;
}

.modal-theme-water .icon-circle {
  background: linear-gradient(135deg, #38bdf8, #0ea5e9) !important;
  box-shadow:
    0 14rpx 40rpx rgba(56, 189, 248, 0.35),
    inset 0 -4rpx 10rpx rgba(0, 0, 0, 0.1),
    inset 0 4rpx 10rpx rgba(255, 255, 255, 0.25) !important;
}
.modal-theme-water .icon-glow {
  background: radial-gradient(
    circle,
    rgba(56, 189, 248, 0.25) 0%,
    transparent 70%
  ) !important;
}
.modal-theme-water .particle {
  background: rgba(56, 189, 248, 0.6) !important;
  box-shadow: 0 0 16rpx rgba(56, 189, 248, 0.4) !important;
}
.modal-theme-water .result-modal-btn {
  background: linear-gradient(135deg, #38bdf8, #0284c7) !important;
  box-shadow: 0 8rpx 28rpx rgba(56, 189, 248, 0.3) !important;
}
.modal-theme-water .bar-fill {
  background: linear-gradient(90deg, #38bdf8, #7dd3fc) !important;
}

.modal-theme-diet .icon-circle {
  background: linear-gradient(135deg, #22c55e, #16a34a) !important;
  box-shadow:
    0 14rpx 40rpx rgba(34, 197, 94, 0.35),
    inset 0 -4rpx 10rpx rgba(0, 0, 0, 0.1),
    inset 0 4rpx 10rpx rgba(255, 255, 255, 0.25) !important;
}
.modal-theme-diet .icon-glow {
  background: radial-gradient(
    circle,
    rgba(34, 197, 94, 0.25) 0%,
    transparent 70%
  ) !important;
}
.modal-theme-diet .particle {
  background: rgba(34, 197, 94, 0.6) !important;
  box-shadow: 0 0 16rpx rgba(34, 197, 94, 0.4) !important;
}
.modal-theme-diet .result-modal-btn {
  background: linear-gradient(135deg, #22c55e, #15803d) !important;
  box-shadow: 0 8rpx 28rpx rgba(34, 197, 94, 0.3) !important;
}
.modal-theme-diet .bar-fill {
  background: linear-gradient(90deg, #22c55e, #4ade80) !important;
}

.modal-theme-weight .icon-circle {
  background: linear-gradient(135deg, #14b8a6, #0d9488) !important;
  box-shadow:
    0 14rpx 40rpx rgba(20, 184, 166, 0.35),
    inset 0 -4rpx 10rpx rgba(0, 0, 0, 0.1),
    inset 0 4rpx 10rpx rgba(255, 255, 255, 0.25) !important;
}
.modal-theme-weight .icon-glow {
  background: radial-gradient(
    circle,
    rgba(20, 184, 166, 0.25) 0%,
    transparent 70%
  ) !important;
}
.modal-theme-weight .particle {
  background: rgba(20, 184, 166, 0.6) !important;
  box-shadow: 0 0 16rpx rgba(20, 184, 166, 0.4) !important;
}
.modal-theme-weight .result-modal-btn {
  background: linear-gradient(135deg, #14b8a6, #0f766e) !important;
  box-shadow: 0 8rpx 28rpx rgba(20, 184, 166, 0.3) !important;
}
.modal-theme-weight .bar-fill {
  background: linear-gradient(90deg, #14b8a6, #2dd4bf) !important;
}

.modal-theme-height .icon-circle {
  background: linear-gradient(135deg, #a855f7, #9333ea) !important;
  box-shadow:
    0 14rpx 40rpx rgba(168, 85, 247, 0.35),
    inset 0 -4rpx 10rpx rgba(0, 0, 0, 0.1),
    inset 0 4rpx 10rpx rgba(255, 255, 255, 0.25) !important;
}
.modal-theme-height .icon-glow {
  background: radial-gradient(
    circle,
    rgba(168, 85, 247, 0.25) 0%,
    transparent 70%
  ) !important;
}
.modal-theme-height .particle {
  background: rgba(168, 85, 247, 0.6) !important;
  box-shadow: 0 0 16rpx rgba(168, 85, 247, 0.4) !important;
}
.modal-theme-height .result-modal-btn {
  background: linear-gradient(135deg, #a855f7, #7c3aed) !important;
  box-shadow: 0 8rpx 28rpx rgba(168, 85, 247, 0.3) !important;
}
.modal-theme-height .bar-fill {
  background: linear-gradient(90deg, #a855f7, #c084fc) !important;
}

.modal-theme-checkin .icon-circle {
  background: linear-gradient(135deg, #10b981, #059669) !important;
  box-shadow:
    0 14rpx 40rpx rgba(16, 185, 129, 0.4),
    inset 0 -4rpx 10rpx rgba(0, 0, 0, 0.1),
    inset 0 4rpx 10rpx rgba(255, 255, 255, 0.25) !important;
}
.modal-theme-checkin .icon-glow {
  background: radial-gradient(
    circle,
    rgba(16, 185, 129, 0.3) 0%,
    transparent 70%
  ) !important;
}
.modal-theme-checkin .particle {
  background: rgba(16, 185, 129, 0.6) !important;
  box-shadow: 0 0 16rpx rgba(16, 185, 129, 0.4) !important;
}
.modal-theme-checkin .result-modal-btn {
  background: linear-gradient(135deg, #10b981, #047857) !important;
  box-shadow: 0 8rpx 28rpx rgba(16, 185, 129, 0.35) !important;
}
.modal-theme-checkin .bar-fill {
  background: linear-gradient(90deg, #10b981, #34d399) !important;
}

.modal-theme-profile .icon-circle {
  background: linear-gradient(135deg, #6366f1, #4f46e5) !important;
  box-shadow:
    0 14rpx 40rpx rgba(99, 102, 241, 0.35),
    inset 0 -4rpx 10rpx rgba(0, 0, 0, 0.1),
    inset 0 4rpx 10rpx rgba(255, 255, 255, 0.25) !important;
}
.modal-theme-profile .icon-glow {
  background: radial-gradient(
    circle,
    rgba(99, 102, 241, 0.25) 0%,
    transparent 70%
  ) !important;
}
.modal-theme-profile .particle {
  background: rgba(99, 102, 241, 0.6) !important;
  box-shadow: 0 0 16rpx rgba(99, 102, 241, 0.4) !important;
}
.modal-theme-profile .result-modal-btn {
  background: linear-gradient(135deg, #6366f1, #4338ca) !important;
  box-shadow: 0 8rpx 28rpx rgba(99, 102, 241, 0.3) !important;
}
.modal-theme-profile .bar-fill {
  background: linear-gradient(90deg, #6366f1, #818cf8) !important;
}

.modal-theme-plan .icon-circle {
  background: linear-gradient(135deg, #0ea5e9, #6366f1) !important;
  box-shadow:
    0 14rpx 40rpx rgba(14, 165, 233, 0.35),
    inset 0 -4rpx 10rpx rgba(0, 0, 0, 0.1),
    inset 0 4rpx 10rpx rgba(255, 255, 255, 0.25) !important;
}
.modal-theme-plan .icon-glow {
  background: radial-gradient(
    circle,
    rgba(14, 165, 233, 0.25) 0%,
    transparent 70%
  ) !important;
}
.modal-theme-plan .particle {
  background: rgba(14, 165, 233, 0.6) !important;
  box-shadow: 0 0 16rpx rgba(14, 165, 233, 0.4) !important;
}
.modal-theme-plan .result-modal-btn {
  background: linear-gradient(135deg, #0ea5e9, #4f46e5) !important;
  box-shadow: 0 8rpx 28rpx rgba(14, 165, 233, 0.3) !important;
}
.modal-theme-plan .bar-fill {
  background: linear-gradient(90deg, #0ea5e9, #6366f1) !important;
}
</style>
