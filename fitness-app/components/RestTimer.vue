<template>
  <view v-if="show" class="rest-timer" :class="{ 'is-finished': finished, 'is-paused': paused }">
    <view class="rest-card">
      <view class="ring" :style="ringStyle">
        <view class="ring-hole">
          <text class="ring-time">{{ label }}</text>
          <text class="ring-caption">{{ finished ? "休息结束" : paused ? "已暂停" : "组间休息" }}</text>
        </view>
      </view>

      <view class="rest-info">
        <text class="rest-title">{{ title }}</text>
        <text class="rest-sub">{{ finished ? "可以开始下一组了" : sub }}</text>
      </view>

      <view class="rest-actions">
        <view class="rest-btn" @click.stop="addTime(30)">
          <text class="rest-btn-text">+30s</text>
        </view>
        <view class="rest-btn ghost" @click.stop="reset">
          <text class="rest-btn-text">重置</text>
        </view>
        <view class="rest-btn primary" @click.stop="skip">
          <text class="rest-btn-text">{{ finished ? "完成" : "跳过" }}</text>
        </view>
      </view>
    </view>

    <view class="flash" v-if="flashing"></view>
  </view>
</template>

<script>
/**
 * 组间休息计时器（A4.5 / A4.6）
 *
 * - 倒计时以"截止时间戳"为准，而不是逐秒自减：切后台/锁屏后回到前台
 *   由 Date.now() 重新算剩余，不会因为定时器被节流而走慢。
 * - 到点：震动 + 提示音 + 屏幕闪烁（嘈杂健身房里的三重提醒），随后
 *   3 秒自动收起。
 * - 父组件通过 ref 调用 start / addTime / skip / stop。
 */
export default {
  name: "RestTimer",
  props: {
    // 默认休息秒数（动作的 rest_seconds）
    defaultSeconds: { type: Number, default: 90 },
    // 自动收起延迟（毫秒）
    autoHideDelay: { type: Number, default: 3000 },
  },
  data() {
    return {
      show: false,
      total: 90,
      remaining: 90000,
      deadline: 0,
      paused: false,
      finished: false,
      flashing: false,
      title: "",
      sub: "",
      timer: null,
      hideTimer: null
    };
  },
  computed: {
    label() {
      const sec = Math.ceil(this.remaining / 1000);
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${String(s).padStart(2, "0")}`;
    },
    progress() {
      if (!this.total) return 0;
      return Math.min(1, Math.max(0, 1 - this.remaining / this.total));
    },
    ringStyle() {
      const deg = Math.round(this.progress * 360);
      const from = this.finished ? "#22C55E" : "#2F6BFF";
      const to = this.finished ? "#16A34A" : "#8A5CFF";
      return {
        background: `conic-gradient(${from} 0deg, ${to} ${deg}deg, rgba(47,107,255,0.10) ${deg}deg 360deg)`
      };
    }
  },
  beforeUnmount() {
    this.stop();
  },
  methods: {
    /** 开始倒计时：seconds 秒后提醒；title/sub 为面板文案 */
    start(seconds, options = {}) {
      const total = Math.max(1, Math.round(Number(seconds) || this.defaultSeconds));
      this.total = total * 1000;
      this.remaining = this.total;
      this.deadline = Date.now() + this.total;
      this.paused = false;
      this.finished = false;
      this.show = true;
      this.title = options.title || "休息";
      this.sub = options.sub || `建议休息 ${total} 秒`;
      this.clearHideTimer();
      this.runTicker();
    },

    runTicker() {
      this.clearTicker();
      this.timer = setInterval(() => this.tick(), 200);
      this.tick();
    },

    tick() {
      if (this.paused || !this.show) return;
      this.remaining = Math.max(0, this.deadline - Date.now());
      if (this.remaining <= 0) this.onFinish();
    },

    /** 加时（负数即减时）；已结束时加时会把计时重新拉起来 */
    addTime(seconds) {
      const delta = Math.round(Number(seconds) || 0) * 1000;
      if (!delta) return;
      if (this.finished) {
        // 结束后加时：从 0 重新计
        this.finished = false;
        this.total = Math.max(this.total, Math.abs(delta));
        this.deadline = Date.now() + delta;
        this.remaining = Math.max(0, delta);
        this.runTicker();
        return;
      }
      this.total = Math.max(1000, this.total + delta);
      this.deadline = Math.max(Date.now(), this.deadline + delta);
      this.remaining = Math.max(0, this.deadline - Date.now());
      if (this.remaining > 0) this.finished = false;
    },

    /** 重置为同一动作的建议休息时长 */
    reset() {
      this.start(Math.round(this.total / 1000), { title: this.title, sub: this.sub });
    },

    /** 暂停/继续（长组间走动时用） */
    pause() {
      if (!this.show || this.finished || this.paused) return;
      this.paused = true;
      this.remaining = Math.max(0, this.deadline - Date.now());
      this.clearTicker();
    },

    resume() {
      if (!this.paused) return;
      this.paused = false;
      this.deadline = Date.now() + this.remaining;
      this.runTicker();
    },

    togglePause() {
      if (this.paused) this.resume();
      else this.pause();
    },

    /** 跳过休息，立即收起 */
    skip() {
      this.stop();
      this.$emit("skip");
    },

    /** 收起面板并清空计时 */
    stop() {
      this.clearTicker();
      this.clearHideTimer();
      this.show = false;
      this.remaining = 0;
    },

    clearTicker() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },

    clearHideTimer() {
      if (this.hideTimer) {
        clearTimeout(this.hideTimer);
        this.hideTimer = null;
      }
    },

    onFinish() {
      if (this.finished) return;
      this.finished = true;
      this.remaining = 0;
      this.clearTicker();
      this.$emit("finish");
      this.notify();
      this.clearHideTimer();
      this.hideTimer = setTimeout(() => {
        // 只收起已完成的面板；期间若已开始下一组则保留
        if (this.finished) this.stop();
      }, this.autoHideDelay);
    },

    /** 到点提醒：震动 + 提示音 + 屏幕闪烁 */
    notify() {
      this.flash();
      this.vibrate();
      this.beep();
    },

    vibrate() {
      const buzz = () => {
        // #ifdef APP-PLUS
        try {
          plus.device.vibrate(300);
        } catch (e) {}
        // #endif
        // #ifndef APP-PLUS
        try {
          if (typeof uni !== "undefined" && uni.vibrateLong) {
            uni.vibrateLong({});
          }
        } catch (e) {}
        // #endif
      };
      buzz();
      [350, 700].forEach((delay) => setTimeout(buzz, delay));
    },

    beep() {
      // #ifdef APP-PLUS
      try {
        if (typeof plus !== "undefined" && plus.device && plus.device.beep) {
          plus.device.beep(2);
        }
      } catch (e) {}
      // #endif
      // #ifdef H5
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
        osc.onended = () => ctx.close && ctx.close();
      } catch (e) {}
      // #endif
    },

    flash() {
      this.flashing = true;
      setTimeout(() => {
        this.flashing = false;
      }, 900);
    }
  }
};
</script>

<style scoped>
.rest-timer {
  position: relative;
  padding: 0 24rpx 24rpx;
}

.rest-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 24rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.94);
  border: 1rpx solid rgba(47, 107, 255, 0.12);
  box-shadow:
    0 16rpx 48rpx rgba(15, 23, 42, 0.12),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
}

.rest-timer.is-finished .rest-card {
  border-color: rgba(34, 197, 94, 0.28);
  box-shadow: 0 16rpx 48rpx rgba(34, 197, 94, 0.14);
}

.ring {
  position: relative;
  width: 108rpx;
  height: 108rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s linear;
}

.ring-hole {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 2rpx 6rpx rgba(15, 23, 42, 0.06);
}

.ring-time {
  font-size: 30rpx;
  font-weight: 800;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.5rpx;
}

.ring-caption {
  font-size: 16rpx;
  color: #94a3b8;
  margin-top: 2rpx;
}

.is-finished .ring-time {
  color: #16a34a;
}

.rest-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.rest-title {
  font-size: 26rpx;
  font-weight: 700;
  color: #0f172a;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.rest-sub {
  font-size: 22rpx;
  color: #64748b;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.rest-actions {
  display: flex;
  align-items: center;
  gap: 10rpx;
  flex-shrink: 0;
}

.rest-btn {
  padding: 10rpx 16rpx;
  border-radius: 16rpx;
  background: rgba(47, 107, 255, 0.08);
}

.rest-btn.ghost {
  background: rgba(15, 23, 42, 0.05);
}

.rest-btn.primary {
  background: linear-gradient(135deg, #2f6bff 0%, #8a5cff 100%);
}

.rest-btn-text {
  font-size: 22rpx;
  font-weight: 600;
  color: #2f6bff;
}

.rest-btn.ghost .rest-btn-text {
  color: #64748b;
}

.rest-btn.primary .rest-btn-text {
  color: #ffffff;
}

.is-finished .rest-btn.primary {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

/* 到点屏幕闪烁：嘈杂健身房里比声音更显眼 */
.flash {
  position: fixed;
  inset: 0;
  z-index: 999;
  pointer-events: none;
  background: rgba(47, 107, 255, 0.18);
  animation: rest-flash 0.9s ease-out;
}

@keyframes rest-flash {
  0% {
    opacity: 0;
  }
  12% {
    opacity: 1;
  }
  30% {
    opacity: 0.25;
  }
  45% {
    opacity: 0.9;
  }
  70% {
    opacity: 0.15;
  }
  100% {
    opacity: 0;
  }
}
</style>
