<template>
  <view class="section-loader">
    <view
      v-if="loading"
      class="section-loader__loading"
      :class="{ 'section-loader__loading--skeleton': mode === 'skeleton' }"
      :style="{ minHeight: minHeight || '300rpx' }"
    >
      <template v-if="mode === 'skeleton'">
        <slot name="skeleton">
          <view class="skeleton-list">
            <view class="skeleton-list-item" v-for="i in 2" :key="i">
              <view class="skeleton-list-item__icon skeleton-shimmer"></view>
              <view class="skeleton-list-item__body">
                <view class="skeleton-list-item__title skeleton-shimmer"></view>
                <view class="skeleton-list-item__tags skeleton-shimmer"></view>
              </view>
            </view>
          </view>
        </slot>
      </template>
      <template v-else>
        <MathCurveLoader
          :name="pageConfig ? '' : name"
          :size="pageConfig ? 0 : size"
          :color="pageConfig ? '' : color"
          :text="text"
          :overlay="false"
          :duration="pageConfig ? 0 : duration"
          :page-config="pageConfig"
        />
      </template>
    </view>
    <view v-else class="section-loader__content">
      <view
        v-if="staleHint"
        class="section-loader__stale-hint"
        :class="{ 'section-loader__stale-hint--disabled': refreshDebouncing }"
        @click="onStaleHintClick"
      >
        <uni-icons
          type="info"
          size="14"
          :color="refreshDebouncing ? '#D1D5DB' : '#F59E0B'"
        ></uni-icons>
        <text
          class="stale-hint-text"
          :class="{ 'stale-hint-text--disabled': refreshDebouncing }"
        >
          {{ refreshDebouncing ? "正在刷新..." : "数据可能不是最新，点击刷新" }}
        </text>
      </view>
      <slot></slot>
    </view>
  </view>
</template>

<script>
import MathCurveLoader from "@/components/MathCurveLoader/MathCurveLoader.vue";

const LOG_PREFIX = "[SectionLoader]";
const DEBOUNCE_MS = 3000;

export default {
  name: "SectionLoader",
  components: { MathCurveLoader },
  props: {
    loading: {
      type: Boolean,
      required: true,
    },
    mode: {
      type: String,
      default: "curve",
      validator: (v) => ["curve", "skeleton"].includes(v),
    },
    name: {
      type: String,
      default: "rose-three",
    },
    size: {
      type: Number,
      default: 180,
    },
    color: {
      type: String,
      default: "#A855F7",
    },
    text: {
      type: String,
      default: "",
    },
    duration: {
      type: Number,
      default: 0,
    },
    minHeight: {
      type: String,
      default: "300rpx",
    },
    cacheKey: {
      type: String,
      default: "",
    },
    pageConfig: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      staleHint: false,
      refreshDebouncing: false,
      _debounceTimer: null,
    };
  },
  watch: {
    loading: {
      handler(newVal, oldVal) {
        if (newVal && !oldVal) {
          console.log(
            LOG_PREFIX,
            `⏳ 加载开始 | 区域: ${this.cacheKey || this.text || "未知"}`,
          );
        }
        if (!newVal && oldVal) {
          console.log(
            LOG_PREFIX,
            `✅ 加载完成 | 区域: ${this.cacheKey || this.text || "未知"}`,
          );
          this.refreshDebouncing = false;
          if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = null;
          }
        }
        if (!newVal) {
          this.staleHint = false;
        }
      },
    },
  },
  mounted() {
    console.log(
      LOG_PREFIX,
      `📦 组件挂载 | 区域: ${this.cacheKey || this.text || "未知"}`,
    );
  },
  beforeUnmount() {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
  },
  methods: {
    onStaleHintClick() {
      const clickTime = new Date();
      const ts = `${clickTime.getFullYear()}-${String(clickTime.getMonth() + 1).padStart(2, "0")}-${String(clickTime.getDate()).padStart(2, "0")} ${String(clickTime.getHours()).padStart(2, "0")}:${String(clickTime.getMinutes()).padStart(2, "0")}:${String(clickTime.getSeconds()).padStart(2, "0")}.${String(clickTime.getMilliseconds()).padStart(3, "0")}`;

      if (this.refreshDebouncing) {
        console.log(
          LOG_PREFIX,
          `🚫 防抖中，忽略重复点击 | 区域: ${this.cacheKey} | 点击时间: ${ts} | 防抖剩余: ${this._debounceTimer ? "进行中" : "无定时器"}`,
        );
        return;
      }

      this.refreshDebouncing = true;
      console.log(
        LOG_PREFIX,
        `👆 用户点击刷新过时数据 | 区域: ${this.cacheKey} | 点击时间: ${ts} | 防抖时长: ${DEBOUNCE_MS}ms`,
      );
      this.$emit("refresh");

      this._debounceTimer = setTimeout(() => {
        const debounceEndTime = new Date();
        const endTs = `${String(debounceEndTime.getHours()).padStart(2, "0")}:${String(debounceEndTime.getMinutes()).padStart(2, "0")}:${String(debounceEndTime.getSeconds()).padStart(2, "0")}.${String(debounceEndTime.getMilliseconds()).padStart(3, "0")}`;
        this.refreshDebouncing = false;
        this._debounceTimer = null;
        console.log(
          LOG_PREFIX,
          `🔓 防抖结束 | 区域: ${this.cacheKey} | 结束时间: ${endTs}`,
        );
      }, DEBOUNCE_MS);
    },

    showStaleHint() {
      this.staleHint = true;
      const showTime = new Date();
      const ts = `${String(showTime.getHours()).padStart(2, "0")}:${String(showTime.getMinutes()).padStart(2, "0")}:${String(showTime.getSeconds()).padStart(2, "0")}.${String(showTime.getMilliseconds()).padStart(3, "0")}`;
      console.warn(
        LOG_PREFIX,
        `⚠️ 显示过时数据提示 | 区域: ${this.cacheKey || this.text || "未知"} | 显示时间: ${ts}`,
      );
    },
  },
};
</script>

<style scoped>
.section-loader {
  width: 100%;
}

.section-loader__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx 0;
}

.section-loader__loading--skeleton {
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
}

.section-loader__content {
  width: 100%;
}

.section-loader__stale-hint {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 24rpx;
  margin-bottom: 16rpx;
  background: #fffbeb;
  border-radius: 12rpx;
  border: 1rpx solid #fde68a;
  transition: opacity 0.2s ease;
}

.section-loader__stale-hint--disabled {
  opacity: 0.6;
  pointer-events: none;
}

.stale-hint-text {
  font-size: 24rpx;
  color: #d97706;
}

.stale-hint-text--disabled {
  color: #9ca3af;
}

.skeleton-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.skeleton-list-item {
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
  background: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
  gap: 20rpx;
  animation: skeleton-breathe 2s ease-in-out infinite;
}

.skeleton-list-item__icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 24rpx;
  background: #e2e8f0;
  flex-shrink: 0;
}

.skeleton-list-item__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.skeleton-list-item__title {
  height: 32rpx;
  border-radius: 8rpx;
  background: #e2e8f0;
  width: 50%;
}

.skeleton-list-item__tags {
  height: 24rpx;
  border-radius: 6rpx;
  background: #e2e8f0;
  width: 70%;
}

.skeleton-shimmer {
  position: relative;
  overflow: hidden;
}

.skeleton-shimmer::after {
  content: "";
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
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
