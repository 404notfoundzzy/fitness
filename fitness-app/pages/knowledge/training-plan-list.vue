<template>
  <view class="list-page">
    <view class="nav-header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="22" color="#1E293B"></uni-icons>
      </view>
      <text class="nav-title">训练计划</text>
      <view class="placeholder"></view>
    </view>

    <scroll-view scroll-y class="content-scroll">
      <view class="section">
        <view class="section-header">
          <text class="section-title">系统推荐</text>
          <text class="section-count">{{ presetPlans.length }} 套预置计划</text>
        </view>

        <view class="plan-list">
          <view
            v-for="(plan, index) in presetPlans"
            :key="'preset-' + index"
            class="plan-card"
            @click="openPlanDetail(plan)"
          >
            <view class="card-icon" :class="getIconClass(plan.type)">
              <uni-icons
                :type="getPlanIcon(plan.type)"
                size="26"
                color="#fff"
              ></uni-icons>
            </view>

            <view class="card-content">
              <text class="plan-name">{{ plan.name }}</text>
              <text class="plan-desc">{{ plan.description }}</text>

              <view class="tag-row">
                <text class="tag type-tag">{{
                  getSplitTypeLabel(plan.type)
                }}</text>
                <text class="tag diff-tag" :class="plan.difficulty">
                  {{ getDifficultyLabel(plan.difficulty) }}
                </text>
                <text class="tag days-tag">{{ plan.daysPerWeek }}天/周</text>
              </view>
            </view>

            <uni-icons type="right" size="16" color="#CBD5E1"></uni-icons>
          </view>
        </view>
      </view>

      <view class="section" v-if="customPlans.length > 0">
        <view class="section-header">
          <text class="section-title">我的计划</text>
          <text class="section-count">{{ customPlans.length }} 套自定义</text>
        </view>

        <view class="plan-list">
          <view
            v-for="(plan, index) in customPlans"
            :key="'custom-' + index"
            class="plan-card custom"
            @click="openPlanDetail(plan)"
          >
            <view class="card-icon icon-custom">
              <uni-icons type="person" size="24" color="#fff"></uni-icons>
            </view>

            <view class="card-content">
              <text class="plan-name">{{ plan.name }}</text>
              <text class="plan-desc">{{
                plan.description || "自定义训练计划"
              }}</text>

              <view class="tag-row">
                <text class="tag type-tag custom-type">
                  {{ getSplitTypeLabel(plan.type) }}
                </text>
                <text class="tag days-tag"
                  >{{ plan.daysPerWeek || 3 }}天/周</text
                >
              </view>
            </view>

            <uni-icons type="right" size="16" color="#CBD5E1"></uni-icons>
          </view>
        </view>
      </view>

      <view class="plan-list">
        <view class="plan-card custom-add" @click="createCustomPlan">
          <view class="card-icon icon-custom-add">
            <uni-icons type="compose" size="26" color="#fff"></uni-icons>
          </view>

          <view class="card-content">
            <text class="plan-name">自定义训练计划</text>
            <text class="plan-desc">创建属于你自己的专属训练计划</text>

            <view class="tag-row">
              <text class="tag type-tag custom-type">自定义</text>
              <text class="tag diff-tag beginner">创建</text>
              <text class="tag days-tag">灵活</text>
            </view>
          </view>

          <uni-icons type="right" size="16" color="#CBD5E1"></uni-icons>
        </view>
      </view>

      <view style="height: 60rpx"></view>
    </scroll-view>
  </view>
</template>

<script>
import {
  getPresetPlans,
  getSplitTypeLabel,
  getDifficultyLabel,
} from "@/data/training-plans";

export default {
  data() {
    return {
      presetPlans: [],
      customPlans: [],
    };
  },

  onShow() {
    this.loadPresetPlans();
    this.loadCustomPlans();
  },

  methods: {
    loadPresetPlans() {
      this.presetPlans = getPresetPlans();
    },

    loadCustomPlans() {
      try {
        const plans = uni.getStorageSync("custom_training_plans") || [];
        this.customPlans = Array.isArray(plans) ? plans : [];
      } catch (e) {
        this.customPlans = [];
      }
    },

    goBack() {
      try {
        const pages = getCurrentPages();
        console.log("返回按钮点击 - 页面栈长度:", pages.length);

        if (pages.length > 1) {
          uni.navigateBack({
            delta: 1,
            success: () => {
              console.log("返回成功");
            },
            fail: (err) => {
              console.log("navigateBack失败，使用switchTab:", err);
              uni.switchTab({
                url: "/pages/knowledge/knowledge",
              });
            },
          });
        } else {
          console.log("页面栈只有当前页，直接跳转知识库");
          uni.switchTab({
            url: "/pages/knowledge/knowledge",
          });
        }
      } catch (e) {
        console.error("返回出错:", e);
        uni.switchTab({
          url: "/pages/knowledge/knowledge",
        });
      }
    },

    openPlanDetail(plan) {
      const source = plan.isPreset ? "preset" : "custom";
      uni.navigateTo({
        url: `/pages/knowledge/training-plan-detail?id=${plan.id}&source=${source}`,
      });
    },

    createCustomPlan() {
      uni.navigateTo({
        url: "/pages/knowledge/training-plan-edit",
      });
    },

    getSplitTypeLabel(type) {
      return getSplitTypeLabel(type);
    },

    getDifficultyLabel(difficulty) {
      return getDifficultyLabel(difficulty);
    },

    getIconClass(type) {
      const map = {
        "five-split": "icon-red",
        "three-split": "icon-blue",
        "kai-three-split": "icon-purple",
        "full-body": "icon-green",
      };
      return map[type] || "icon-blue";
    },

    getPlanIcon(type) {
      const map = {
        "five-split": "flag-filled",
        "three-split": "loop",
        "kai-three-split": "star-filled",
        "full-body": "staff-filled",
      };
      return map[type] || "list";
    },
  },
};
</script>

<style lang="scss" scoped>
.list-page {
  min-height: 100vh;
  background: #f8fafc;
}

.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 56rpx 32rpx 20rpx;
  background: #fff;
  position: relative;
  z-index: 100;

  .back-btn {
    width: 68rpx;
    height: 68rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    position: relative;
    z-index: 101;
    cursor: pointer;

    &:active {
      background-color: rgba(0, 0, 0, 0.05);
    }
  }

  .nav-title {
    font-size: 34rpx;
    font-weight: 600;
    color: #1e293b;
  }

  .placeholder {
    width: 68rpx;
  }
}

.content-scroll {
  height: calc(100vh - 144rpx);
  padding: 20rpx 24rpx;
  box-sizing: border-box;
  width: 100%;
}

.section {
  margin-bottom: 28rpx;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 16rpx;
    padding: 0 2rpx;
  }

  .section-title {
    font-size: 28rpx;
    font-weight: 700;
    color: #1e293b;
  }

  .section-count {
    font-size: 22rpx;
    color: #94a3b8;
  }
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.plan-card {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 100%;
  background: #fff;
  border-radius: 18rpx;
  padding: 18rpx 18rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.04);
  box-sizing: border-box;

  &:active {
    opacity: 0.85;
    transform: scale(0.98);
  }

  &.custom {
    border-left: 5rpx solid #f59e0b;
  }

  .card-icon {
    width: 64rpx;
    height: 64rpx;
    border-radius: 14rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 14rpx;
    flex-shrink: 0;

    &.icon-red {
      background: linear-gradient(135deg, #ef4444, #dc2626);
    }

    &.icon-blue {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
    }

    &.icon-purple {
      background: linear-gradient(135deg, #a78bfa, #7c3aed);
    }

    &.icon-green {
      background: linear-gradient(135deg, #10b981, #059669);
    }

    &.icon-custom {
      background: linear-gradient(135deg, #f59e0b, #d97706);
    }
  }

  .card-content {
    flex: 1;
    min-width: 0;
    overflow: hidden;

    .plan-name {
      display: block;
      font-size: 26rpx;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4rpx;
      line-height: 1.3;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .plan-desc {
      display: block;
      font-size: 21rpx;
      color: #94a3b8;
      line-height: 1.35;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 6rpx;
    }

    .tag-row {
      display: flex;
      align-items: center;
      gap: 6rpx;
      flex-wrap: nowrap;
      overflow: hidden;
    }

    .tag {
      display: inline-flex;
      align-items: center;
      padding: 2rpx 10rpx;
      border-radius: 6rpx;
      font-size: 19rpx;
      font-weight: 500;
      line-height: 1.6;
      flex-shrink: 0;

      &.type-tag {
        background: #eff6ff;
        color: #2563eb;

        &.custom-type {
          background: #fffbeb;
          color: #d97706;
        }
      }

      &.diff-tag {
        &.beginner {
          background: #d1fae5;
          color: #059669;
        }

        &.intermediate,
        &.advanced {
          background: #fef3c7;
          color: #d97706;
        }
      }

      &.days-tag {
        background: #f1f5f9;
        color: #64748b;
      }
    }
  }

  > uni-icons {
    flex-shrink: 0;
    margin-left: 8rpx;
  }

  &.custom-add {
    border-left: 5rpx solid #8b5cf6;
    background: linear-gradient(
      135deg,
      rgba(139, 92, 246, 0.03) 0%,
      rgba(59, 130, 246, 0.02) 100%
    );

    .card-icon.icon-custom-add {
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      box-shadow:
        0 4rpx 12rpx rgba(139, 92, 246, 0.35),
        inset 0 1rpx 2rpx rgba(255, 255, 255, 0.25);
    }

    &:active {
      opacity: 0.85;
      transform: scale(0.98);
      background: linear-gradient(
        135deg,
        rgba(139, 92, 246, 0.06) 0%,
        rgba(59, 130, 246, 0.04) 100%
      );
    }
  }
}
</style>
