<template>
  <view
    class="nav-header"
    :style="{ paddingTop: statusBarHeight + 'px', backgroundColor: bgColor }"
  >
    <view class="nav-content">
      <!-- 左侧返回按钮 -->
      <view
        v-if="showBack"
        class="nav-back"
        :style="backStyle"
        @click="handleBack"
      >
        <uni-icons type="left" size="20" :color="color"></uni-icons>
      </view>

      <!-- 中间标题区域：支持自定义 slot 或默认标题 -->
      <view class="nav-center">
        <slot name="center">
          <text class="nav-title">{{ title }}</text>
          <text class="nav-subtitle" v-if="subtitle">{{ subtitle }}</text>
        </slot>
      </view>

      <!-- 右侧插槽 -->
      <view class="nav-right">
        <slot name="right"></slot>
      </view>
    </view>
  </view>
</template>

<script>
import { getStatusBarHeight } from "@/utils/navLayout";
export default {
  name: "NavHeader",
  props: {
    title: {
      type: String,
      default: "",
    },
    subtitle: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "#0EA5E9",
    },
    iconBg: {
      type: String,
      default: "rgba(14,165,233,0.1)",
    },
    iconShape: {
      type: String,
      default: "circle",
    },
    showBack: {
      type: Boolean,
      default: true,
    },
    bgColor: {
      type: String,
      default: "rgba(255,255,255,0.72)",
    },
  },
  data() {
    return {
      statusBarHeight: 0,
    };
  },
  computed: {
    backStyle() {
      return {
        backgroundColor: this.iconBg,
        borderRadius: this.iconShape === "circle" ? "50%" : "20rpx",
      };
    },
  },
  created() {
    this.statusBarHeight = getStatusBarHeight();
  },
  methods: {
    handleBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        uni.navigateBack();
      } else {
        uni.switchTab({ url: "/pages/index/index" });
      }
    },
  },
};
</script>

<style scoped>
.nav-header {
  flex-shrink: 0;
  z-index: 100;
  backdrop-filter: blur(20px) saturate(1.8);
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
  width: 100%;
  box-sizing: border-box;
}

.nav-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12rpx 30rpx 16rpx;
  width: 100%;
  box-sizing: border-box;
}

.nav-back {
  width: 68rpx;
  height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-center {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.nav-title {
  font-size: 42rpx;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.5rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-subtitle {
  font-size: 24rpx;
  color: #64748b;
  font-weight: 500;
  margin-top: 2rpx;
}

.nav-right {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-shrink: 0;
}
</style>
