<template>
  <view class="container">
    <!-- 标题栏 -->
    <view class="header">
      <text class="title">健康记录</text>
    </view>

    <!-- 快速记录操作 -->
    <view class="action-grid">
      <view class="card action-card primary" @click="goWorkoutPage">
        <view class="primary-content">
          <view class="primary-icon-wrap">
            <uni-icons type="compose" size="40" color="#FFF"></uni-icons>
          </view>
          <view class="primary-text">
            <text class="primary-title">记录运动</text>
            <text class="primary-desc">开始你的训练计划</text>
          </view>
        </view>
      </view>
      <view class="card action-card water" @click="goWaterPage">
        <view class="icon-box-large">
          <uni-icons type="color" size="32" color="#38BDF8"></uni-icons>
        </view>
        <text class="action-name">记录饮水</text>
      </view>
      <view class="card action-card diet" @click="goDietPage">
        <view class="icon-box-large">
          <uni-icons type="shop" size="32" color="#22C55E"></uni-icons>
        </view>
        <text class="action-name">记录饮食</text>
      </view>
      <view class="card action-card height" @click="goHeightPage">
        <view class="icon-box-large">
          <uni-icons type="personadd" size="32" color="#A855F7"></uni-icons>
        </view>
        <text class="action-name">记录身高</text>
      </view>
      <view class="card action-card secondary" @click="goWeightPage">
        <view class="icon-box-large">
          <uni-icons type="paperplane" size="32" color="#0EA5E9"></uni-icons>
        </view>
        <text class="action-name">记录体重</text>
      </view>
    </view>

    <!-- 最近动态 -->
    <view class="recent-section">
      <view class="section-header-row">
        <text class="section-title">最近动态</text>
        <text class="activity-count" v-if="activityList.length > 0"
          >{{ totalCount }} 条</text
        >
      </view>

      <scroll-view
        scroll-y
        class="activity-scroll"
        @scrolltolower="loadMore"
        :lower-threshold="120"
        :refresher-enabled="true"
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
      >
        <view
          v-for="(item, index) in activityList"
          :key="item.id || index"
          class="card activity-card-enhanced"
          :class="'type-' + item.type"
          @click="openActivityDetail(item)"
        >
          <!-- 运动记录 -->
          <template v-if="item.type === 'workout'">
            <view class="activity-header">
              <view class="activity-icon workout-icon">
                <uni-icons type="compose" size="18" color="#fff"></uni-icons>
              </view>
              <text class="activity-title-main">{{
                item.data?.name || "运动训练"
              }}</text>
              <view class="activity-stats-inline">
                <text class="stat-chip"
                  >{{ item.data?.exerciseCount || 0 }}动作</text
                >
                <text class="stat-chip"
                  >{{ item.data?.durationMinutes || 0 }}分钟</text
                >
              </view>
            </view>
            <view class="activity-body">
              <text class="activity-desc-text">🏋️ 训练完成</text>
              <text class="activity-time-sub">{{ formatSmartTime(item) }}</text>
            </view>
          </template>

          <!-- 体重记录 -->
          <template v-else-if="item.type === 'weight'">
            <view class="activity-header">
              <view class="activity-icon weight-icon">
                <uni-icons type="paperplane" size="18" color="#fff"></uni-icons>
              </view>
              <text class="activity-title-main"
                >体重 {{ item.data?.weight }}kg</text
              >
              <text class="trend-badge" v-if="item.data?.timePeriod">
                {{ item.data.timePeriod === "morning" ? "晨重" : "晚重" }}
              </text>
            </view>
            <view class="activity-body">
              <text class="activity-desc-text">⚖️ 健康监测</text>
              <text class="activity-time-sub">{{ formatSmartTime(item) }}</text>
            </view>
          </template>

          <!-- 饮水记录 -->
          <template v-else-if="item.type === 'water'">
            <view class="activity-header">
              <view class="activity-icon water-icon">
                <uni-icons type="color" size="18" color="#fff"></uni-icons>
              </view>
              <text class="activity-title-main"
                >饮水 {{ item.data?.amountMl || 0 }}ml</text
              >
              <view class="progress-mini" v-if="item.data?.amountMl">
                <view
                  class="progress-bar"
                  :style="{
                    width:
                      Math.min((item.data.amountMl / 2000) * 100, 100) + '%',
                  }"
                ></view>
              </view>
            </view>
            <view class="activity-body">
              <text class="activity-desc-text">💧 补充水分</text>
              <text class="activity-time-sub">{{ formatSmartTime(item) }}</text>
            </view>
          </template>

          <!-- 饮食记录 -->
          <template v-else-if="item.type === 'diet'">
            <view class="activity-header">
              <view class="activity-icon diet-icon">
                <uni-icons type="shop" size="18" color="#fff"></uni-icons>
              </view>
              <text class="activity-title-main"
                >{{ getMealTypeText(item.data?.mealType) || "饮食" }}
                {{ item.data?.calories || 0 }}kcal</text
              >
            </view>
            <view class="activity-body">
              <text class="activity-desc-text" v-if="item.data?.foodName"
                >🍽️ {{ item.data.foodName }}</text
              >
              <text v-else class="activity-desc-text">🍽️ 饮食记录</text>
              <text class="activity-time-sub">{{ formatSmartTime(item) }}</text>
            </view>
          </template>

          <!-- 身高记录 -->
          <template v-else-if="item.type === 'height'">
            <view class="activity-header">
              <view class="activity-icon height-icon">
                <uni-icons type="personadd" size="18" color="#fff"></uni-icons>
              </view>
              <text class="activity-title-main"
                >身高 {{ item.data?.height }}cm</text
              >
            </view>
            <view class="activity-body">
              <text class="activity-desc-text">📏 身体数据</text>
              <text class="activity-time-sub">{{ formatSmartTime(item) }}</text>
            </view>
          </template>

          <view class="detail-hint">
            <text>查看详情</text>
            <uni-icons type="right" size="14" color="#CBD5E1"></uni-icons>
          </view>
        </view>

        <view v-if="loading && activityList.length > 0" class="loading-more">
          <text>加载中...</text>
        </view>

        <view v-if="noMoreData && activityList.length > 0" class="no-more-data">
          <text>- 已显示全部 -</text>
        </view>

        <view
          v-if="activityList.length === 0 && !loading"
          class="card record-card empty"
        >
          <text class="lbl">暂无动态，开始你的第一次记录吧！</text>
        </view>
      </scroll-view>
    </view>

    <!-- 活动详情弹窗 -->
    <uni-popup
      ref="activityDetailPopup"
      type="bottom"
      :safe-area-inset-bottom="false"
      :mask-click="true"
      @change="onActivityDetailPopupChange"
    >
      <view class="activity-detail-wrapper">
        <view class="detail-modal-content" v-if="currentActivity">
          <view class="handle"></view>

          <!-- 详情头部 -->
          <view class="detail-header" :class="'type-' + currentActivity.type">
            <view class="detail-icon-large">
              <uni-icons
                :type="getDetailIconType(currentActivity.type)"
                size="36"
                :color="getDetailIconColor(currentActivity.type)"
              ></uni-icons>
            </view>
            <text class="detail-title">{{
              getDetailTitle(currentActivity)
            }}</text>
            <text class="detail-subtitle">{{
              getDetailSubtitle(currentActivity)
            }}</text>
          </view>

          <!-- 详情信息 -->
          <scroll-view scroll-y class="detail-scroll">
            <view class="detail-info-section">
              <view class="info-row">
                <text class="info-label">{{
                  getRecordDateLabel(currentActivity)
                }}</text>
                <text class="info-value">{{
                  formatSmartTime(currentActivity)
                }}</text>
              </view>

              <view class="info-row" v-if="currentActivity.type === 'workout'">
                <text class="info-label">动作数量</text>
                <text class="info-value"
                  >{{ currentActivity.data?.exerciseCount || 0 }} 个</text
                >
              </view>

              <view class="info-row" v-if="currentActivity.type === 'workout'">
                <text class="info-label">训练时长</text>
                <text class="info-value"
                  >{{ currentActivity.data?.durationMinutes || 0 }} 分钟</text
                >
              </view>

              <view class="info-row" v-if="currentActivity.type === 'weight'">
                <text class="info-label">体重数值</text>
                <text class="info-value highlight"
                  >{{ currentActivity.data?.weight }} kg</text
                >
              </view>

              <view class="info-row" v-if="currentActivity.type === 'water'">
                <text class="info-label">饮水量</text>
                <text class="info-value highlight"
                  >{{ currentActivity.data?.amountMl || 0 }} ml</text
                >
              </view>

              <view class="info-row" v-if="currentActivity.type === 'diet'">
                <text class="info-label">热量摄入</text>
                <text class="info-value highlight"
                  >{{ currentActivity.data?.calories || 0 }} kcal</text
                >
              </view>

              <view class="info-row" v-if="currentActivity.type === 'height'">
                <text class="info-label">身高数值</text>
                <text class="info-value highlight"
                  >{{ currentActivity.data?.height }} cm</text
                >
              </view>

              <view class="info-row" v-if="currentActivity.data?.remark">
                <text class="info-label">备注信息</text>
                <text class="info-value remark">{{
                  currentActivity.data.remark
                }}</text>
              </view>

              <view
                class="info-row"
                v-if="
                  currentActivity.data?.foodName &&
                  currentActivity.type === 'diet'
                "
              >
                <text class="info-label">食物名称</text>
                <text class="info-value">{{
                  currentActivity.data.foodName
                }}</text>
              </view>

              <view
                class="info-row"
                v-if="
                  currentActivity.data?.mealType &&
                  currentActivity.type === 'diet'
                "
              >
                <text class="info-label">餐次类型</text>
                <text class="info-value">{{
                  getMealTypeText(currentActivity.data.mealType)
                }}</text>
              </view>
            </view>
          </scroll-view>

          <!-- 操作按钮 -->
          <view class="detail-actions">
            <button class="btn-detail-close" @click="closeActivityDetail">
              关闭
            </button>
          </view>
        </view>
      </view>
    </uni-popup>

    <!-- 体重记录弹窗 -->

    <uni-popup
      ref="weightPopup"
      type="bottom"
      :safe-area-inset-bottom="false"
      :mask-click="true"
      @change="onWeightPopupChange"
    >
      <view class="popup-wrapper">
        <view class="modal-content">
          <view class="handle"></view>
          <text class="modal-title">记录体重</text>

          <view class="date-selection">
            <picker
              mode="date"
              :value="weightDate"
              @change="onWeightDateChange"
            >
              <view class="date-picker-trigger">
                <uni-icons
                  type="calendar"
                  size="16"
                  color="#94A3B8"
                ></uni-icons>
                <text>{{ weightDate || "选择日期" }}</text>
              </view>
            </picker>
          </view>

          <view class="input-container">
            <input
              type="number"
              v-model="weightValue"
              class="weight-input"
              placeholder="00.0"
            />
            <text class="unit">kg</text>
          </view>

          <view class="btn-group">
            <button class="btn-cancel" @click="closeWeight">取消</button>
            <button class="btn-save" @click="saveWeight">保存</button>
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import {
  getRecentWorkouts,
  recordWeight,
  checkWeightRecorded,
} from "@/api/index";
import { getRecentActivities } from "@/api/health";
import { checkLogin } from "@/utils/auth";

export default {
  data() {
    return {
      weightValue: "",
      weightDate: new Date().toISOString().split("T")[0],
      recentWorkouts: [],
      activityList: [],
      page: 1,
      pageSize: 10,
      totalCount: 0,
      loading: false,
      noMoreData: false,
      refreshing: false,
      currentActivity: null,
    };
  },
  onShow() {
    if (checkLogin()) {
      this.resetAndLoad();
    }
  },
  methods: {
    resetAndLoad() {
      this.page = 1;
      this.noMoreData = false;
      this.activityList = [];
      this.fetchActivities();
    },

    async fetchActivities() {
      if (this.loading) return;

      this.loading = true;
      try {
        const res = await getRecentActivities({
          page: this.page,
          pageSize: this.pageSize,
        });
        const list = Array.isArray(res) ? res : res?.records || [];
        const total = res?.total || res?.count || 0;

        if (this.page === 1) {
          this.activityList = list;
        } else {
          const existingIds = new Set(this.activityList.map((item) => item.id));
          const newList = list.filter((item) => !existingIds.has(item.id));
          this.activityList = [...this.activityList, ...newList];
        }

        this.totalCount = total;

        if (list.length === 0 || this.activityList.length >= total) {
          this.noMoreData = true;
        }
      } catch (e) {
        console.error("Failed to fetch activities", e);
        if (this.page === 1) this.activityList = [];
      } finally {
        this.loading = false;
        if (this.refreshing) {
          setTimeout(() => {
            this.refreshing = false;
          }, 300);
        }
      }
    },

    loadMore() {
      if (!this.loading && !this.noMoreData && this.activityList.length > 0) {
        this.page++;
        this.fetchActivities();
      }
    },

    onRefresh() {
      this.refreshing = true;
      this.resetAndLoad();
    },

    formatActivityTime(timeStr) {
      if (!timeStr) return "";
      const date = new Date(timeStr);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();

      if (isToday) {
        const h = String(date.getHours()).padStart(2, "0");
        const m = String(date.getMinutes()).padStart(2, "0");
        return `今天 ${h}:${m}`;
      }

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return "昨天";
      }

      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${m}/${d}`;
    },

    formatFullTime(timeStr) {
      if (!timeStr) return "";
      const date = new Date(timeStr);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      const h = String(date.getHours()).padStart(2, "0");
      const min = String(date.getMinutes()).padStart(2, "0");
      return `${y}-${m}-${d} ${h}:${min}`;
    },

    formatDateOnly(timeStr) {
      if (!timeStr) return "";
      const date = new Date(timeStr);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    },

    hasValidTime(timeStr) {
      if (!timeStr) return false;
      const date = new Date(timeStr);
      const h = date.getHours();
      const min = date.getMinutes();
      const s = date.getSeconds();
      return !(h === 0 && min === 0 && s === 0);
    },

    formatSmartTime(item) {
      if (!item) return "";
      const data = item.data || {};
      const activityTime = item.activityTime;
      const recordTime = data.recordTime;
      const recordDate = data.recordDate;

      if (recordTime && this.hasValidTime(recordTime)) {
        return this.formatFullTime(recordTime);
      }

      if (activityTime && this.hasValidTime(activityTime)) {
        return this.formatFullTime(activityTime);
      }

      if (recordDate) {
        return this.formatDateOnly(recordDate);
      }

      if (activityTime) {
        return this.formatDateOnly(activityTime);
      }

      return "";
    },

    getRecordDateLabel(item) {
      if (!item) return "记录日期";
      const data = item.data || {};
      const recordTime = data.recordTime;

      if (recordTime && this.hasValidTime(recordTime)) {
        return "记录时间";
      }
      return "记录日期";
    },

    openActivityDetail(item) {
      this.currentActivity = item;
      uni.hideTabBar({ animation: true });
      this.$nextTick(() => {
        setTimeout(() => {
          uni.hideTabBar({ animation: true });
        }, 50);
      });
      this.$nextTick(() => {
        if (
          this.$refs.activityDetailPopup &&
          typeof this.$refs.activityDetailPopup.open === "function"
        ) {
          this.$refs.activityDetailPopup.open();
        }
      });
    },

    closeActivityDetail() {
      if (
        this.$refs.activityDetailPopup &&
        typeof this.$refs.activityDetailPopup.close === "function"
      ) {
        this.$refs.activityDetailPopup.close();
      }
      setTimeout(() => {
        this.currentActivity = null;
      }, 300);
    },

    onActivityDetailPopupChange(e) {
      if (!e.show) {
        setTimeout(() => {
          uni.showTabBar({ animation: true });
        }, 280);
      }
    },

    getDetailIconType(type) {
      const icons = {
        workout: "compose",
        weight: "paperplane",
        water: "color",
        diet: "shop",
        height: "personadd",
      };
      return icons[type] || "info";
    },

    getDetailIconColor(type) {
      const colors = {
        workout: "#0284C7",
        weight: "#0369A1",
        water: "#0284C7",
        diet: "#16A34A",
        height: "#7C3AED",
      };
      return colors[type] || "#64748B";
    },

    getDetailTitle(item) {
      const data = item.data || {};
      const titles = {
        workout: data.name || "运动训练",
        weight: `体重 ${data.weight}kg`,
        water: `饮水 ${data.amountMl || 0}ml`,
        diet: `${this.getMealTypeText(data.mealType) || "饮食"} ${data.calories || 0}kcal`,
        height: `身高 ${data.height}cm`,
      };
      return titles[item.type] || "记录详情";
    },

    getDetailSubtitle(item) {
      const data = item.data || {};
      const subtitles = {
        workout: `${data.exerciseCount || 0}个动作 · ${data.durationMinutes || 0}分钟`,
        weight: data.timePeriod === "morning" ? "晨起测量" : "晚间测量",
        water: "补充水分，保持健康",
        diet: data.foodName ? data.foodName : "营养摄入记录",
        height: "身体数据监测",
      };
      return subtitles[item.type] || "";
    },

    getMealTypeText(mealType) {
      const types = {
        breakfast: "早餐",
        lunch: "午餐",
        dinner: "晚餐",
        snack: "加餐",
      };
      return types[mealType] || mealType;
    },
    goWeightPage() {
      uni.navigateTo({
        url: "/pages/record/weight/weight",
      });
    },
    goWaterPage() {
      uni.navigateTo({
        url: "/pages/record/water/water",
      });
    },
    goDietPage() {
      uni.navigateTo({
        url: "/pages/record/diet/diet",
      });
    },
    goHeightPage() {
      uni.navigateTo({
        url: "/pages/record/height/height",
      });
    },
    goWorkoutPage() {
      uni.navigateTo({
        url: "/pages/record/workout/workout",
      });
    },
    recordWeight() {
      uni.hideTabBar({ animation: true });
      this.$nextTick(() => {
        setTimeout(() => {
          uni.hideTabBar({ animation: true });
        }, 50);
      });
      if (
        this.$refs.weightPopup &&
        typeof this.$refs.weightPopup.open === "function"
      ) {
        this.$refs.weightPopup.open();
      } else {
        this.showComponentError("体重记录弹窗");
      }
    },
    closeWeight() {
      if (
        this.$refs.weightPopup &&
        typeof this.$refs.weightPopup.close === "function"
      ) {
        this.$refs.weightPopup.close();
      }
    },
    onWeightPopupChange(e) {
      if (!e.show) {
        setTimeout(() => {
          uni.showTabBar({ animation: true });
        }, 280);
      }
    },
    onWeightDateChange(e) {
      this.weightDate = e.detail.value;
    },
    async saveWeight() {
      if (!this.weightValue) {
        uni.showToast({ title: "请输入体重", icon: "none" });
        return;
      }

      try {
        // 1. 检查该日期是否已经记录过
        const hasRecorded = await checkWeightRecorded(this.weightDate);

        if (hasRecorded) {
          uni.showModal({
            title: "提示",
            content: `您在 ${this.weightDate} 已经记录过体重了，是否要更新？`,
            success: async (res) => {
              if (res.confirm) {
                await this.performRecordWeight();
              }
            },
          });
        } else {
          await this.performRecordWeight();
        }
      } catch (e) {
        console.error("Failed to record weight", e);
      }
    },
    async performRecordWeight() {
      try {
        await recordWeight(this.weightValue, this.weightDate);
        uni.showToast({ title: "✨ 记录成功！", icon: "success" });
        this.closeWeight();
        this.weightValue = "";
        this.weightDate = new Date().toISOString().split("T")[0];
      } catch (e) {
        console.error("Failed to record weight", e);
      }
    },
    formatDate(dateStr) {
      const date = new Date(dateStr);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    },
    formatVolume(volume) {
      if (!volume) return "0";
      if (volume >= 1000) {
        return (volume / 1000).toFixed(1) + "k";
      }
      return volume.toString();
    },
    showComponentError(name) {
      console.error(
        `${name} 组件 (uni-popup) 未正确加载，请检查 uni_modules 是否安装`,
      );
      uni.showToast({
        title: `${name} 加载失败，请检查 uni-ui 组件库`,
        icon: "none",
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: $bg-color;
  padding: 100rpx 40rpx 40rpx;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 60rpx;
  .title {
    font-size: 56rpx;
    font-weight: 800;
    color: $text-main;
  }
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
  margin-bottom: 60rpx;
}

.card {
  background-color: $card-bg;
  border-radius: 48rpx;
  padding: 40rpx;
  box-shadow: $card-shadow;
  border: 1px solid rgba(14, 165, 233, 0.05);
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;

  &.primary {
    grid-column: 1 / -1;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 40rpx 44rpx;
    background: linear-gradient(
      -45deg,
      #0ea5e9,
      #6366f1,
      #a855f7,
      #ec4899,
      #0ea5e9
    );
    background-size: 400% 400%;
    animation: gradientFlow 8s ease infinite;
    color: #fff;
    border: none;
    box-shadow:
      0 20rpx 50rpx rgba(14, 165, 233, 0.3),
      0 10rpx 30rpx rgba(168, 85, 247, 0.2);
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(
        circle,
        rgba(255, 255, 255, 0.15) 0%,
        transparent 60%
      );
      animation: shimmer 3s ease-in-out infinite;
    }

    &:active {
      transform: scale(0.98);
      opacity: 0.95;
    }

    .primary-content {
      display: flex;
      align-items: center;
      gap: 28rpx;
      position: relative;
      z-index: 2;

      .primary-icon-wrap {
        width: 112rpx;
        height: 112rpx;
        background: rgba(255, 255, 255, 0.25);
        border-radius: 32rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(12px);
        border: 2rpx solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
      }

      .primary-text {
        .primary-title {
          display: block;
          font-size: 38rpx;
          font-weight: 800;
          color: #fff;
          margin-bottom: 6rpx;
          text-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.1);
        }

        .primary-desc {
          display: block;
          font-size: 24rpx;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
        }
      }
    }
  }

  &.secondary {
    .icon-box-large {
      background-color: $primary-light;
    }
  }

  &.water {
    .icon-box-large {
      background-color: #e0f2fe;
    }
    .action-name {
      color: #0369a1;
    }
  }

  &.diet {
    .icon-box-large {
      background-color: #dcfce7;
    }
    .action-name {
      color: #15803d;
    }
  }

  &.height {
    .icon-box-large {
      background-color: #f3e8ff;
    }
    .action-name {
      color: #7c3aed;
    }
  }

  .icon-box-large {
    width: 120rpx;
    height: 120rpx;
    border-radius: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 30rpx;
  }

  .action-name {
    font-size: 32rpx;
    font-weight: 700;
  }
}

.section-title {
  display: block;
  font-size: 22rpx;
  font-weight: 800;
  color: $text-light;
  text-transform: uppercase;
  letter-spacing: 4rpx;
  margin-bottom: 30rpx;
  padding-left: 10rpx;
}

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .activity-count {
    font-size: 22rpx;
    color: #94a3b8;
    background: #f8fafc;
    padding: 6rpx 16rpx;
    border-radius: 20rpx;
  }
}

.activity-scroll {
  max-height: 55vh;
}

.activity-card {
  padding: 28rpx 32rpx;
  margin-bottom: 16rpx;
  border-radius: 24rpx;
  border-left: 6rpx solid transparent;
  background: #fff;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  }

  &.type-workout {
    border-left-color: #0ea5e9;
    .activity-icon {
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
    }
    .activity-title {
      color: #0369a1;
    }
    .stat-chip {
      background: #e0f2fe;
      color: #0369a1;
    }
  }
  &.type-weight {
    border-left-color: #0ea5e9;
    .activity-icon {
      background: linear-gradient(135deg, #38bdf8, #0284c7);
    }
    .activity-title {
      color: #0369a1;
    }
  }
  &.type-water {
    border-left-color: #38bdf8;
    .activity-icon {
      background: linear-gradient(135deg, #38bdf8, #0ea5e9);
    }
    .activity-title {
      color: #0369a1;
    }
    .stat-chip {
      background: #e0f2fe;
      color: #0369a1;
    }
  }
  &.type-diet {
    border-left-color: #22c55e;
    .activity-icon {
      background: linear-gradient(135deg, #22c55e, #16a34a);
    }
    .activity-title {
      color: #15803d;
    }
    .stat-chip {
      background: #dcfce7;
      color: #15803d;
    }
  }
  &.type-height {
    border-left-color: #a855f7;
    .activity-icon {
      background: linear-gradient(135deg, #a855f7, #9333ea);
    }
    .activity-title {
      color: #7c3aed;
    }
  }

  .activity-main {
    display: flex;
    align-items: center;
    gap: 20rpx;
  }

  .activity-icon {
    width: 72rpx;
    height: 72rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  }

  .activity-info {
    flex: 1;
    min-width: 0;

    .activity-title {
      display: block;
      font-size: 30rpx;
      font-weight: 800;
      color: #1e293b;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 4rpx;
    }

    .activity-time {
      display: block;
      font-size: 24rpx;
      color: #94a3b8;
      font-weight: 500;
    }
  }

  .activity-stats {
    display: flex;
    gap: 10rpx;
    flex-shrink: 0;

    .stat-chip {
      font-size: 22rpx;
      font-weight: 700;
      padding: 6rpx 16rpx;
      border-radius: 12rpx;
      white-space: nowrap;
    }
  }

  .activity-tag {
    font-size: 22rpx;
    font-weight: 700;
    padding: 6rpx 16rpx;
    border-radius: 12rpx;
    flex-shrink: 0;

    &.weight-tag {
      color: #0369a1;
      background: #e0f2fe;
    }
  }

  .activity-desc {
    font-size: 24rpx;
    color: #64748b;
    margin-left: 92rpx;
    margin-top: 8rpx;
    padding: 8rpx 16rpx;
    background: #f8fafc;
    border-radius: 12rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.activity-card-enhanced {
  padding: 28rpx 32rpx;
  margin-bottom: 20rpx;
  border-radius: 28rpx;
  border-left: 6rpx solid transparent;
  background: #fff;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  transition: all 0.25s ease;
  cursor: pointer;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
  }

  &.type-workout {
    border-left-color: #0ea5e9;
  }
  &.type-weight {
    border-left-color: #38bdf8;
  }
  &.type-water {
    border-left-color: #0ea5e9;
  }
  &.type-diet {
    border-left-color: #22c55e;
  }
  &.type-height {
    border-left-color: #a855f7;
  }

  .activity-header {
    display: flex;
    align-items: center;
    gap: 18rpx;
    margin-bottom: 12rpx;

    .activity-icon {
      width: 72rpx;
      height: 72rpx;
      border-radius: 20rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

      &.workout-icon {
        background: linear-gradient(135deg, #0ea5e9, #0284c7);
      }
      &.weight-icon {
        background: linear-gradient(135deg, #38bdf8, #0284c7);
      }
      &.water-icon {
        background: linear-gradient(135deg, #38bdf8, #0ea5e9);
      }
      &.diet-icon {
        background: linear-gradient(135deg, #22c55e, #16a34a);
      }
      &.height-icon {
        background: linear-gradient(135deg, #a855f7, #9333ea);
      }
    }

    .activity-title-main {
      font-size: 32rpx;
      font-weight: 800;
      color: #1e293b;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .activity-stats-inline {
      display: flex;
      gap: 10rpx;
      flex-shrink: 0;

      .stat-chip {
        font-size: 22rpx;
        font-weight: 700;
        padding: 6rpx 14rpx;
        border-radius: 12rpx;
        background: #f1f5f9;
        color: #475569;
        white-space: nowrap;
      }
    }

    .trend-badge {
      font-size: 22rpx;
      font-weight: 700;
      padding: 6rpx 16rpx;
      border-radius: 12rpx;
      background: #e0f2fe;
      color: #0369a1;
      flex-shrink: 0;
    }

    .progress-mini {
      width: 100rpx;
      height: 12rpx;
      background: #f1f5f9;
      border-radius: 6rpx;
      overflow: hidden;
      flex-shrink: 0;

      .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #38bdf8, #0ea5e9);
        border-radius: 6rpx;
        transition: width 0.3s ease;
      }
    }
  }

  .activity-body {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-left: 90rpx;

    .activity-desc-text {
      font-size: 24rpx;
      color: #64748b;
      font-weight: 500;
    }

    .activity-time-sub {
      font-size: 22rpx;
      color: #94a3b8;
      font-weight: 500;
    }
  }

  .detail-hint {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4rpx;
    margin-top: 12rpx;
    padding-top: 12rpx;
    border-top: 1rpx solid #f1f5f9;

    text {
      font-size: 22rpx;
      color: #94a3b8;
      font-weight: 600;
    }
  }
}

.activity-detail-wrapper {
  position: relative;
  z-index: 9999;
  background-color: #fff;
  padding-bottom: env(safe-area-inset-bottom);

  :deep(.uni-popup) {
    z-index: 9999 !important;
  }

  :deep(.uni-popup__mask) {
    z-index: 9998 !important;
  }
}

.detail-modal-content {
  background-color: #fff;
  border-radius: 48rpx 48rpx 0 0;
  padding: 40rpx 44rpx 60rpx;

  .handle {
    width: 100rpx;
    height: 12rpx;
    background-color: #f1f5f9;
    border-radius: 100rpx;
    margin: 0 auto 40rpx;
  }

  .detail-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 36rpx;
    border-radius: 32rpx;
    margin-bottom: 36rpx;

    &.type-workout {
      background: linear-gradient(135deg, #e0f2fe, #bae6fd);
    }
    &.type-weight {
      background: linear-gradient(135deg, #e0f2fe, #bae6fd);
    }
    &.type-water {
      background: linear-gradient(135deg, #e0f2fe, #bae6fd);
    }
    &.type-diet {
      background: linear-gradient(135deg, #dcfce7, #bbf7d0);
    }
    &.type-height {
      background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
    }

    .detail-icon-large {
      width: 112rpx;
      height: 112rpx;
      background: #ffffff;
      border-radius: 32rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20rpx;
      box-shadow:
        0 8rpx 24rpx rgba(0, 0, 0, 0.12),
        0 2rpx 8rpx rgba(0, 0, 0, 0.06);
    }

    .detail-title {
      font-size: 40rpx;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 8rpx;
    }

    .detail-subtitle {
      font-size: 26rpx;
      color: #64748b;
      font-weight: 500;
    }
  }

  .detail-scroll {
    max-height: 50vh;
    margin-bottom: 36rpx;
  }

  .detail-info-section {
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24rpx 0;
      border-bottom: 1rpx solid #f1f5f9;

      &:last-child {
        border-bottom: none;
      }

      .info-label {
        font-size: 28rpx;
        color: #64748b;
        font-weight: 600;
      }

      .info-value {
        font-size: 30rpx;
        color: #1e293b;
        font-weight: 700;

        &.highlight {
          color: #0369a1;
          font-size: 34rpx;
          font-weight: 800;
        }

        &.remark {
          max-width: 400rpx;
          text-align: right;
          color: #64748b;
          font-weight: 500;
          line-height: 1.5;
        }
      }
    }
  }

  .detail-actions {
    .btn-detail-close {
      width: 100%;
      height: 96rpx;
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      color: #fff;
      border-radius: 28rpx;
      font-size: 32rpx;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      box-shadow: 0 12rpx 32rpx rgba(14, 165, 233, 0.25);

      &:active {
        opacity: 0.9;
        transform: scale(0.98);
      }
    }
  }
}

.loading-more,
.no-more-data {
  text-align: center;
  padding: 30rpx 0;
  font-size: 24rpx;
  color: #cbd5e1;
}

.record-card {
  padding: 40rpx;
  .record-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
  }
  .record-title {
    font-size: 32rpx;
    font-weight: 700;
    color: $text-main;
  }
  .status-badge {
    padding: 6rpx 16rpx;
    background-color: #f0fdf4;
    color: #16a34a;
    border-radius: 8rpx;
    font-size: 18rpx;
    font-weight: 800;
  }
}

.stats-row {
  display: flex;
  justify-content: space-between;
  .stat-item {
    flex: 1;
    text-align: center;
    .val {
      display: block;
      font-size: 32rpx;
      font-weight: 800;
      color: $text-main;
      margin-bottom: 4rpx;
    }
    .lbl {
      font-size: 20rpx;
      color: $text-light;
      font-weight: 700;
    }
  }
}

.modal-content {
  background-color: #fff;
  border-radius: 72rpx 72rpx 0 0;
  padding: 40rpx 50rpx 80rpx;

  .handle {
    width: 120rpx;
    height: 12rpx;
    background-color: #f1f5f9;
    border-radius: 100rpx;
    margin: 0 auto 60rpx;
  }

  .modal-title {
    display: block;
    font-size: 36rpx;
    font-weight: 800;
    color: #1e293b;
    margin-bottom: 20rpx;
    text-align: center;
  }

  .form-item {
    margin-bottom: 30rpx;
    .label {
      display: block;
      font-size: 24rpx;
      font-weight: 700;
      color: $text-light;
      margin-bottom: 16rpx;
      text-transform: uppercase;
      letter-spacing: 2rpx;
    }
    input {
      background-color: #f8fafc;
      height: 100rpx;
      border-radius: 24rpx;
      padding: 0 30rpx;
      font-size: 28rpx;
    }
    .picker-box {
      background-color: #f8fafc;
      height: 100rpx;
      border-radius: 24rpx;
      padding: 0 30rpx;
      display: flex;
      align-items: center;
      justify-content: space-between;
      text {
        font-size: 28rpx;
        color: $text-main;
      }
    }
    .custom-input {
      margin-top: 20rpx;
      border: 2rpx solid $primary-light;
    }
  }

  .form-row {
    display: flex;
    gap: 30rpx;
    .half {
      flex: 1;
    }
  }
}

.date-selection {
  display: flex;
  justify-content: center;
  margin-bottom: 30rpx;

  .date-picker-trigger {
    display: flex;
    align-items: center;
    gap: 12rpx;
    background-color: #f8fafc;
    padding: 12rpx 30rpx;
    border-radius: 100rpx;
    border: 1px solid #f1f5f9;

    text {
      font-size: 26rpx;
      color: #64748b;
      font-weight: 600;
    }
  }
}

.input-container {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 20rpx;
  margin-bottom: 80rpx;

  .weight-input {
    width: 300rpx;
    height: 120rpx;
    border-bottom: 8rpx solid $primary-color;
    font-size: 80rpx;
    font-weight: 800;
    color: $primary-color;
    text-align: center;
  }
  .unit {
    font-size: 40rpx;
    font-weight: 800;
    color: $text-light;
    margin-bottom: 20rpx;
  }
}

.btn-group {
  display: flex;
  gap: 30rpx;
  button {
    flex: 1;
    height: 110rpx;
    border-radius: 36rpx;
    font-size: 32rpx;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;

    &.btn-cancel {
      background-color: #f1f5f9;
      color: $text-muted;
    }
    &.btn-save {
      background-color: $primary-color;
      color: #fff;
      box-shadow: 0 20rpx 40rpx rgba(14, 165, 233, 0.2);
    }
  }
}

.popup-wrapper {
  position: relative;
  z-index: 9999;
  background-color: #fff;
  padding-bottom: env(safe-area-inset-bottom);
}

:deep(.uni-popup) {
  z-index: 9999 !important;
}

:deep(.uni-popup__mask) {
  z-index: 9998 !important;
}

@keyframes gradientFlow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes shimmer {
  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 0.3;
  }
  50% {
    transform: translate(25px, -25px) rotate(180deg);
    opacity: 0.6;
  }
}
</style>
