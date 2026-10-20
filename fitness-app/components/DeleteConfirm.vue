<template>
  <view class="modal-overlay" :class="overlayClass" @click="handleOverlayClick">
    <view class="modal-advanced" :class="[themeClass]" @click.stop>
      <view class="particles-container">
        <view class="particle" v-for="(p, i) in 7" :key="i"></view>
      </view>

      <view class="icon-wrapper">
        <view class="icon-glow"></view>
        <view class="icon-ring"></view>
        <view class="icon-main">{{ currentIcon }}</view>
      </view>

      <text class="modal-title">{{ modalTitle }}</text>
      <view class="modal-content">
        <text class="typing-text">{{ displayText }}</text>
        <text class="cursor" v-if="isTyping">|</text>
      </view>

      <view class="modal-buttons">
        <view class="modal-btn btn-cancel" @click="handleCancel">
          <text>取消</text>
        </view>
        <view
          class="modal-btn btn-confirm"
          :class="confirmMode === 'update' ? 'btn-update' : ''"
          @click="handleConfirm"
        >
          <text>{{ confirmBtnText }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: "DeleteConfirm",
  emits: ["update:visible", "confirm", "cancel"],
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      default: "general",
      validator: (value) =>
        [
          "workout",
          "water",
          "diet",
          "height",
          "weight",
          "general",
          "logout",
        ].includes(value),
    },
    itemName: {
      type: String,
      default: "",
    },
    confirmMode: {
      type: String,
      default: "delete",
      validator: (value) => ["delete", "update"].includes(value),
    },
    customDesc: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      isTyping: false,
      displayText: "",
      leaving: false,
      typingTimer: null,
      themeConfig: {
        workout: {
          icon: "🏋️",
          text: `确定删除该条${this.itemName || "运动"}记录吗？\n今天的努力不会被遗忘，继续加油！`,
          colors: {
            primary: "#F59E0B",
            secondary: "#F97316",
            bgLight: "#FFFBEB",
            badgeBg: "#FEF3C7",
            badgeColor: "#92400E",
          },
        },
        water: {
          icon: "💧",
          text: `确定删除该条${this.itemName || "饮水"}记录吗？\n记得多喝水，保持身体水分充足哦～`,
          colors: {
            primary: "#38BDF8",
            secondary: "#0EA5E9",
            bgLight: "#F0F9FF",
            badgeBg: "#E0F2FE",
            badgeColor: "#0369A1",
          },
        },
        diet: {
          icon: "🥗",
          text: `确定删除该条${this.itemName || "饮食"}记录吗？\n营养均衡很重要，下次继续记录吧！`,
          colors: {
            primary: "#10B981",
            secondary: "#059669",
            bgLight: "#F0FDF4",
            badgeBg: "#DCFCE7",
            badgeColor: "#166534",
          },
        },
        height: {
          icon: "📏",
          text: `确定删除该条${this.itemName || "身高"}记录吗？\n成长的数据值得珍藏哦～`,
          colors: {
            primary: "#A855F7",
            secondary: "#9333EA",
            bgLight: "#FAF5FF",
            badgeBg: "#F3E8FF",
            badgeColor: "#7C3AED",
          },
        },
        weight: {
          icon: "⚖️",
          text: `确定删除该条${this.itemName || "体重"}记录吗？\n每一次称重都是成长的见证～`,
          colors: {
            primary: "#5EEAD4",
            secondary: "#2DD4BF",
            bgLight: "#F0FDFA",
            badgeBg: "#99F6E4",
            badgeColor: "#0F766E",
          },
        },
        general: {
          icon: "🗑️",
          text: `确定要删除${this.itemName || "此内容"}吗？\n此操作无法撤销，请谨慎操作。`,
          colors: {
            primary: "#64748B",
            secondary: "#475569",
            bgLight: "#F8FAFC",
            badgeBg: "#F1F5F9",
            badgeColor: "#334155",
          },
        },
        logout: {
          icon: "👋",
          text: `确定要退出当前账号吗？\n下次登录可以继续记录你的健身旅程～`,
          colors: {
            primary: "#F43F5E",
            secondary: "#E11D48",
            bgLight: "#FFF1F2",
            badgeBg: "#FFE4E6",
            badgeColor: "#9F1239",
          },
        },
      },
    };
  },
  computed: {
    overlayClass() {
      return {
        active: this.visible && !this.leaving,
        leaving: this.leaving,
      };
    },
    themeClass() {
      return `theme-${this.type}`;
    },
    modalTitle() {
      if (this.confirmMode === "update") return "确认更新";
      if (this.type === "logout") return "退出登录";
      return "确认删除";
    },
    confirmBtnText() {
      if (this.confirmMode === "update") return "更新";
      if (this.type === "logout") return "确认退出";
      return "删除";
    },
    currentIcon() {
      if (this.confirmMode === "update") {
        return "🔄";
      }
      return this.themeConfig[this.type]?.icon || "🗑️";
    },
    fullText() {
      if (this.customDesc) return this.customDesc;
      if (this.confirmMode === "update") {
        return this.updateText;
      }
      return this.themeConfig[this.type]?.text || this.themeConfig.general.text;
    },
    updateText() {
      const updateConfig = {
        weight: `您已经记录过${this.itemName || "体重"}了，是否要更新为最新数据？\n保持记录习惯，追踪身体变化 ⚖️`,
        general: `确定要更新${this.itemName || "此内容"}吗？\n更新后将覆盖原有数据。`,
      };
      return updateConfig[this.type] || updateConfig.general;
    },
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.startTyping();
      } else {
        this.stopTyping();
      }
    },
    type() {
      if (this.visible) {
        this.displayText = "";
        this.startTyping();
      }
    },
  },
  methods: {
    startTyping() {
      this.isTyping = true;
      this.displayText = "";
      let index = 0;

      this.typingTimer = setInterval(() => {
        if (index < this.fullText.length) {
          this.displayText += this.fullText[index];
          index++;
        } else {
          this.stopTyping();
        }
      }, 50);
    },
    stopTyping() {
      this.isTyping = false;
      if (this.typingTimer) {
        clearInterval(this.typingTimer);
        this.typingTimer = null;
      }
    },
    handleOverlayClick() {
      this.handleCancel();
    },
    handleCancel() {
      this.stopTyping();
      this.leaving = true;
      setTimeout(() => {
        this.leaving = false;
        this.$emit("cancel");
        this.$emit("update:visible", false);
      }, 250);
    },
    handleConfirm() {
      this.stopTyping();
      this.leaving = true;
      setTimeout(() => {
        this.leaving = false;
        this.$emit("confirm");
        this.$emit("update:visible", false);
      }, 250);
    },
  },
  beforeUnmount() {
    this.stopTyping();
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 9999;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.modal-overlay.active {
  opacity: 1;
  pointer-events: auto;
}

.modal-overlay.leaving {
  opacity: 0;
  pointer-events: none;
}

.modal-advanced {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 40rpx;
  padding: 64rpx 52rpx;
  width: 100%;
  max-width: 620rpx;
  text-align: center;
  box-shadow:
    0 0 0 2rpx var(--modal-border),
    0 8rpx 12rpx -2rpx rgba(0, 0, 0, 0.05),
    0 40rpx 140rpx -30rpx var(--modal-shadow);
  transform: perspective(1200rpx) rotateX(8deg) scale(0.85) translateY(60rpx);
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;

  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial,
    sans-serif;
}

.modal-overlay.active .modal-advanced {
  transform: perspective(1200rpx) rotateX(0deg) scale(1) translateY(0);
}

.modal-overlay.leaving .modal-advanced {
  transform: scale(0.9) translateY(20rpx);
  transition: transform 0.25s ease-in;
}

.icon-wrapper {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  margin: 0 auto 40rpx;
}

.icon-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 230rpx;
  height: 230rpx;
  background: radial-gradient(
    circle,
    var(--icon-glow-color) 0%,
    transparent 70%
  );
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: glow-pulse 2.5s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.7;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.25);
    opacity: 1;
  }
}

.icon-ring {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  border: 6rpx solid transparent;
  background:
    linear-gradient(135deg, var(--ring-inner), var(--ring-inner)) padding-box,
    linear-gradient(135deg, var(--color-1), var(--color-2)) border-box;
  animation: ring-pulse 2.5s ease-in-out infinite;
}

@keyframes ring-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.6;
  }
}

.icon-main {
  position: relative;
  width: 140rpx;
  height: 140rpx;
  margin: 0 auto;
  background: linear-gradient(135deg, var(--color-1), var(--color-2));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 68rpx;
  animation: icon-float 3.5s ease-in-out infinite;
  box-shadow:
    0 20rpx 60rpx var(--icon-shadow),
    inset 0 -10rpx 30rpx rgba(0, 0, 0, 0.15),
    inset 0 10rpx 30rpx rgba(255, 255, 255, 0.35);
  z-index: 1;

  image-rendering: -webkit-optimize-contrast;
}

@keyframes icon-float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  33% {
    transform: translateY(-14rpx) rotate(1.5deg);
  }
  66% {
    transform: translateY(-8rpx) rotate(-1.5deg);
  }
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
  width: 14rpx;
  height: 14rpx;
  background: var(--particle-color);
  border-radius: 50%;
  animation: particle-float 4.5s ease-in-out infinite;
  box-shadow: 0 0 20rpx var(--particle-glow);
}

.particle:nth-child(1) {
  left: 8%;
  top: 18%;
  animation-delay: 0s;
}
.particle:nth-child(2) {
  left: 88%;
  top: 12%;
  animation-delay: 0.6s;
  width: 10rpx;
  height: 10rpx;
}
.particle:nth-child(3) {
  left: 78%;
  top: 78%;
  animation-delay: 1.2s;
  width: 12rpx;
  height: 12rpx;
}
.particle:nth-child(4) {
  left: 12%;
  top: 82%;
  animation-delay: 1.8s;
  width: 16rpx;
  height: 16rpx;
}
.particle:nth-child(5) {
  left: 48%;
  top: 8%;
  animation-delay: 2.4s;
  width: 8rpx;
  height: 8rpx;
}
.particle:nth-child(6) {
  left: 92%;
  top: 48%;
  animation-delay: 3s;
  width: 12rpx;
  height: 12rpx;
}
.particle:nth-child(7) {
  left: 25%;
  top: 68%;
  animation-delay: 3.6s;
  width: 10rpx;
  height: 10rpx;
}

@keyframes particle-float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.5;
  }
  25% {
    transform: translate(24rpx, -36rpx) scale(1.3);
    opacity: 0.9;
  }
  50% {
    transform: translate(-16rpx, -56rpx) scale(0.9);
    opacity: 0.7;
  }
  75% {
    transform: translate(20rpx, -24rpx) scale(1.2);
    opacity: 1;
  }
}

.modal-title {
  font-size: 44rpx;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 28rpx;
  position: relative;
  z-index: 1;
  letter-spacing: 0.02em;

  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.05);
}

.modal-content {
  font-size: 31rpx;
  color: #475569;
  line-height: 1.8;
  margin-bottom: 48rpx;
  position: relative;
  z-index: 1;
  min-height: 80rpx;

  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.typing-text {
  font-weight: 500;
  letter-spacing: 0.03em;
}

.cursor {
  color: var(--caret-color);
  animation: blink-caret 0.75s step-end infinite;
  font-weight: 300;
}

@keyframes blink-caret {
  from,
  to {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}

.modal-buttons {
  display: flex;
  gap: 20rpx;
  position: relative;
  z-index: 1;
}

.modal-btn {
  flex: 1;
  padding: 26rpx 36rpx;
  border-radius: 24rpx;
  font-size: 33rpx;
  font-weight: 600;
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.08rpx;

  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.btn-cancel {
  background: white;
  color: #64748b;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.04);
}

.btn-cancel:active {
  transform: scale(0.97);
  background: #f8fafc;
}

.btn-confirm {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  box-shadow:
    0 10rpx 40rpx rgba(239, 68, 68, 0.35),
    inset 0 2rpx 0 rgba(255, 255, 255, 0.25);
}

.btn-confirm:active {
  transform: scale(0.97);
}

.btn-update {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow:
    0 10rpx 40rpx rgba(59, 130, 246, 0.35),
    inset 0 2rpx 0 rgba(255, 255, 255, 0.25);
}

.theme-workout {
  --color-1: rgba(245, 158, 11, 0.4);
  --color-2: rgba(249, 115, 22, 0.5);
  --ring-inner: rgba(245, 158, 11, 0.08);
  --icon-glow-color: rgba(245, 158, 11, 0.35);
  --icon-shadow: rgba(245, 158, 11, 0.45);
  --particle-color: rgba(245, 158, 11, 0.45);
  --particle-glow: rgba(245, 158, 11, 0.3);
  --caret-color: #f59e0b;
  --modal-border: rgba(245, 158, 11, 0.15);
  --modal-shadow: rgba(245, 158, 11, 0.28);
}

.theme-water {
  --color-1: rgba(56, 189, 248, 0.35);
  --color-2: rgba(14, 165, 233, 0.5);
  --ring-inner: rgba(56, 189, 248, 0.08);
  --icon-glow-color: rgba(56, 189, 248, 0.35);
  --icon-shadow: rgba(56, 189, 248, 0.45);
  --particle-color: rgba(56, 189, 248, 0.45);
  --particle-glow: rgba(56, 189, 248, 0.3);
  --caret-color: #38bdf8;
  --modal-border: rgba(56, 189, 248, 0.15);
  --modal-shadow: rgba(56, 189, 248, 0.28);
}

.theme-diet {
  --color-1: rgba(16, 185, 129, 0.35);
  --color-2: rgba(5, 150, 105, 0.5);
  --ring-inner: rgba(16, 185, 129, 0.08);
  --icon-glow-color: rgba(16, 185, 129, 0.35);
  --icon-shadow: rgba(16, 185, 129, 0.45);
  --particle-color: rgba(16, 185, 129, 0.45);
  --particle-glow: rgba(16, 185, 129, 0.3);
  --caret-color: #10b981;
  --modal-border: rgba(16, 185, 129, 0.15);
  --modal-shadow: rgba(16, 185, 129, 0.28);
}

.theme-height {
  --color-1: rgba(168, 85, 247, 0.35);
  --color-2: rgba(147, 51, 234, 0.5);
  --ring-inner: rgba(168, 85, 247, 0.08);
  --icon-glow-color: rgba(168, 85, 247, 0.35);
  --icon-shadow: rgba(168, 85, 247, 0.45);
  --particle-color: rgba(168, 85, 247, 0.45);
  --particle-glow: rgba(168, 85, 247, 0.3);
  --caret-color: #a855f7;
  --modal-border: rgba(168, 85, 247, 0.15);
  --modal-shadow: rgba(168, 85, 247, 0.28);
}

.theme-weight {
  --color-1: rgba(94, 234, 212, 0.4);
  --color-2: rgba(45, 212, 191, 0.55);
  --ring-inner: rgba(94, 234, 212, 0.12);
  --icon-glow-color: rgba(45, 212, 191, 0.4);
  --icon-shadow: rgba(45, 212, 191, 0.45);
  --particle-color: rgba(94, 234, 212, 0.5);
  --particle-glow: rgba(45, 212, 191, 0.35);
  --caret-color: #2dd4bf;
  --modal-border: rgba(94, 234, 212, 0.25);
  --modal-shadow: rgba(45, 212, 191, 0.28);
}

.theme-general {
  --color-1: rgba(100, 116, 139, 0.3);
  --color-2: rgba(71, 85, 105, 0.5);
  --ring-inner: rgba(100, 116, 139, 0.06);
  --icon-glow-color: rgba(100, 116, 139, 0.3);
  --icon-shadow: rgba(100, 116, 139, 0.4);
  --particle-color: rgba(100, 116, 139, 0.4);
  --particle-glow: rgba(100, 116, 139, 0.25);
  --caret-color: #64748b;
  --modal-border: rgba(100, 116, 139, 0.15);
  --modal-shadow: rgba(100, 116, 139, 0.28);
}
</style>
