<template>
  <view class="container">
    <view class="header">
      <view class="nav-back" @click="goBack">
        <uni-icons type="left" size="20" color="#F97316"></uni-icons>
      </view>
      <text class="title">能量计算器</text>
      <view class="header-right"></view>
    </view>

    <scroll-view scroll-y class="main-scroll">
      <CalorieCalculator />

      <view class="info-section">
        <view class="info-card">
          <view class="card-header">
            <uni-icons type="info" size="18" color="#0EA5E9"></uni-icons>
            <text class="card-title">计算原理说明</text>
          </view>

          <view class="formula-block">
            <text class="block-title">BMR 基础代谢率 (Mifflin-St Jeor)</text>
            <text class="formula-text"
              >BMR = 10×体重(kg) + 6.25×身高(cm) - 5×年龄 + 常数</text
            >
            <text class="formula-note">男性常数 +5，女性常数 -161</text>
          </view>

          <view class="formula-block">
            <text class="block-title">TDEE 每日总消耗</text>
            <text class="formula-text">TDEE = BMR × 活动系数</text>
            <text class="formula-note"
              >活动系数根据运动频率在 1.15~1.60 之间</text
            >
          </view>

          <view class="formula-block">
            <text class="block-title">运动消耗 (MET 法)</text>
            <text class="formula-text"
              >热量 = MET值 × 体重(kg) × 时长(小时)</text
            >
            <text class="formula-note"
              >MET = 代谢当量，不同活动对应不同数值</text
            >
          </view>
        </view>

        <view class="info-card">
          <view class="card-header">
            <uni-icons type="star" size="18" color="#22C55E"></uni-icons>
            <text class="card-title">使用建议</text>
          </view>

          <view class="tip-list">
            <view class="tip-item">
              <text class="tip-num">1</text>
              <text class="tip-text"
                >减脂期建议制造 300~500 kcal/天 的热量缺口</text
              >
            </view>
            <view class="tip-item">
              <text class="tip-num">2</text>
              <text class="tip-text"
                >增肌期建议保持 200~400 kcal/天 的热量盈余</text
              >
            </view>
            <view class="tip-item">
              <text class="tip-num">3</text>
              <text class="tip-text"
                >蛋白质摄入建议：1.6~2.2 g / kg 体重 / 天</text
              >
            </view>
            <view class="tip-item">
              <text class="tip-num">4</text>
              <text class="tip-text"
                >建议每 4-6 周重新评估并调整目标摄入量</text
              >
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import CalorieCalculator from "@/components/CalorieCalculator.vue";

export default {
  name: "CalorieGuide",
  components: { CalorieCalculator },
  methods: {
    goBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        uni.navigateBack();
      } else {
        uni.switchTab({ url: "/pages/knowledge/knowledge" });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #fff7ed;
  padding: 100rpx 30rpx 40rpx;
}

.header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 28rpx;

  .nav-back {
    width: 68rpx;
    height: 68rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #ffedd5;
    border-radius: 20rpx;

    &:active {
      transform: scale(0.92);
      opacity: 0.8;
    }
  }

  .title {
    font-size: 40rpx;
    font-weight: 800;
    color: #1e293b;
    flex: 1;
  }

  .header-right {
    width: 68rpx;
  }
}

.main-scroll {
  max-height: calc(100vh - 180rpx);
}

.info-section {
  margin-top: 24rpx;
}

.info-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(249, 115, 22, 0.06);

  .card-header {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 24rpx;

    .card-title {
      font-size: 30rpx;
      font-weight: 700;
      color: #1e293b;
    }
  }
}

.formula-block {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f1f5f9;

  &:last-child {
    border-bottom: none;
  }

  .block-title {
    display: block;
    font-size: 26rpx;
    font-weight: 600;
    color: #334155;
    margin-bottom: 8rpx;
  }

  .formula-text {
    display: block;
    font-size: 25rpx;
    color: #0ea5e9;
    font-family: monospace;
    background: #f0f9ff;
    padding: 12rpx 16rpx;
    border-radius: 8rpx;
    margin-bottom: 6rpx;
  }

  .formula-note {
    display: block;
    font-size: 23rpx;
    color: #94a3b8;
  }
}

.tip-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;

  .tip-num {
    width: 40rpx;
    height: 40rpx;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: #fff;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 23rpx;
    font-weight: 700;
    flex-shrink: 0;
  }

  .tip-text {
    font-size: 26rpx;
    color: #475569;
    line-height: 1.5;
    padding-top: 4rpx;
  }
}
</style>
