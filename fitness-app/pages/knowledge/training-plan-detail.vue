<template>
  <view class="detail-page">
    <view class="nav-header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="22" color="#1A1D29"></uni-icons>
      </view>
      <text class="nav-title">训练计划</text>
      <view class="placeholder"></view>
    </view>

    <scroll-view scroll-y class="content-scroll" :show-scrollbar="false">
      <view v-if="planData" class="plan-container">
        <view class="hero-card glass-card hero-enter">
          <view class="hero-left">
            <view class="badge-row">
              <view class="type-badge">{{
                getSplitTypeLabel(planData.type)
              }}</view>
              <view :class="['diff-badge', planData.difficulty]">
                {{ getDifficultyLabel(planData.difficulty) }}
              </view>
            </view>

            <text class="plan-name">{{ planData.name }}</text>
            <text class="plan-desc">{{ planData.description }}</text>

            <view class="meta-row">
              <view class="meta-item">
                <uni-icons
                  type="calendar"
                  size="16"
                  color="#2F6BFF"
                ></uni-icons>
                <text>{{ planData.daysPerWeek }}天/周</text>
              </view>
              <view class="meta-item">
                <uni-icons type="person" size="16" color="#8A5CFF"></uni-icons>
                <text>{{
                  planData.targetAudience || "3个月以上系统训练基础"
                }}</text>
              </view>
            </view>

            <view class="tags-row">
              <text
                v-for="(tag, index) in planData.tags"
                :key="index"
                class="tag-pill"
                >{{ tag }}</text
              >
            </view>
          </view>

          <view class="hero-right">
            <view class="hero-image-box">
              <image
                class="hero-image"
                src="/static/images/fitness-hero.jpg"
                mode="aspectFill"
                @error="onImageError"
              ></image>
              <view v-if="imageError" class="hero-image-placeholder">
                <uni-icons
                  type="staff-filled"
                  size="80"
                  color="#4f72ff"
                ></uni-icons>
              </view>

              <view class="progress-ring-wrapper">
                <ProgressRing
                  :progress="weeklyProgress"
                  :size="72"
                  :stroke-width="6"
                  :colors="['#2F6BFF', '#8A5CFF']"
                  :show-text="true"
                  :text-size="18"
                  label="本周进度"
                  :label-size="11"
                  text-color="#2F6BFF"
                  :animated="true"
                  :duration="1200"
                />
              </view>
            </view>
          </view>
        </view>

        <view class="days-section section-enter">
          <view class="section-header">
            <view class="section-title-wrap">
              <uni-icons type="list" size="18" color="#2F6BFF"></uni-icons>
              <text class="section-title">每日安排</text>
            </view>
            <view class="collapse-btn" @click="toggleAllDays">
              <text>{{ allExpanded ? "收起" : "展开" }}</text>
              <uni-icons
                :type="allExpanded ? 'up' : 'down'"
                size="14"
                color="#9AA3AF"
              ></uni-icons>
            </view>
          </view>

          <view
            v-for="(day, index) in planData.schedule"
            :key="index"
            class="day-card-wrapper stagger-item"
            :style="{ animationDelay: index * 0.1 + 's' }"
          >
            <DayCard
              :day-number="day.day"
              :day-name="day.name"
              :focus="day.focus"
              :exercises="day.exercises || []"
              :progress="getDayProgress(index)"
              :default-expanded="expandedDay === index"
              @toggle="onDayToggle"
            />
          </view>
        </view>

        <view class="action-bar cta-enter">
          <button class="btn-cta" @click="startWorkout">
            <text class="cta-icon">🔥</text>
            <text>开始训练</text>
          </button>
        </view>

        <view class="safety-tip tip-enter">
          <uni-icons type="info" size="14" color="#9AA3AF"></uni-icons>
          <text>建议在训练前充分热身，注意动作规范与安全</text>
        </view>
      </view>

      <view v-else class="empty-state">
        <uni-icons type="info" size="56" color="#CBD5E1"></uni-icons>
        <text class="empty-text">未找到该训练计划</text>
        <button class="btn-back" @click="goBackToKnowledge">返回知识库</button>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import TrainingHero from "@/components/TrainingHero.vue";
import DayCard from "@/components/DayCard.vue";
import { trainingPlans } from "@/data/training-plans.js";

export default {
  components: {
    TrainingHero,
    DayCard,
  },
  data() {
    return {
      planId: "",
      planData: null,
      expandedDay: null,
      allExpanded: false,
      weeklyProgress: 32,
      dayProgresses: [80, 40, 20, 0, 0],
      allPlans: trainingPlans,
      imageError: false,
    };
  },
  onLoad(options) {
    console.log("onLoad options:", options);

    if (options && options.id) {
      this.planId = options.id;
      this.loadPlanData();
    } else if (options && options.type) {
      this.planId = options.type;
      this.loadPlanData();
    } else {
      console.warn("No plan ID provided, loading default plan");
      this.loadDefaultPlan();
    }
  },
  methods: {
    loadPlanData() {
      try {
        console.log("Loading plan with ID:", this.planId);

        this.planData = this.allPlans.find((p) => p.id === this.planId) || null;

        if (!this.planData) {
          console.warn("Plan not found, trying to load default");
          this.loadDefaultPlan();
        } else {
          console.log("Successfully loaded plan:", this.planData.name);
        }
      } catch (e) {
        console.error("Failed to load plan data:", e);
        this.loadDefaultPlan();
      }
    },

    loadDefaultPlan() {
      if (this.allPlans && this.allPlans.length > 0) {
        this.planData = this.allPlans[0];
        this.planId = this.planData.id;
        console.log("Loaded default plan:", this.planData.name);
      }
    },

    onImageError() {
      this.imageError = true;
    },

    getDayProgress(index) {
      return this.dayProgresses[index] || 0;
    },

    onDayToggle({ dayNumber, expanded }) {
      this.expandedDay = expanded ? dayNumber - 1 : null;
    },

    toggleAllDays() {
      this.allExpanded = !this.allExpanded;
      this.expandedDay = this.allExpanded ? 0 : null;
    },

    startWorkout() {
      uni.showToast({
        title: "准备开始训练...",
        icon: "none",
        duration: 1500,
      });
    },

    goBack() {
      try {
        const pages = getCurrentPages();

        if (pages.length > 1) {
          uni.navigateBack({
            delta: 1,
            success: () => {
              console.log("navigateBack success");
            },
            fail: (err) => {
              console.log("navigateBack failed:", err);
              this.goBackToKnowledge();
            },
          });
        } else {
          this.goBackToKnowledge();
        }
      } catch (e) {
        console.error("goBack error:", e);
        this.goBackToKnowledge();
      }
    },

    goBackToKnowledge() {
      uni.switchTab({
        url: "/pages/knowledge/knowledge",
        success: () => {
          console.log("switchTab success");
        },
        fail: (err) => {
          console.log("switchTab failed, trying reLaunch:", err);
          uni.reLaunch({
            url: "/pages/knowledge/knowledge",
            fail: (err2) => {
              console.log("reLaunch also failed:", err2);
              uni.showToast({
                title: "返回失败",
                icon: "none",
                duration: 1500,
              });
            },
          });
        },
      });
    },

    getSplitTypeLabel(type) {
      const map = {
        "5-split": "五分化",
        "five-split": "五分化",
        "3-split": "三分化",
        "three-split": "三分化",
        "kai-three-split": "改良三分化",
        "upper-lower": "上下肢",
        fullbody: "全身",
        "full-body": "一分化",
        ppl: "推拉腿",
      };
      return map[type] || type || "训练计划";
    },

    getDifficultyLabel(difficulty) {
      const map = {
        beginner: "入门",
        intermediate: "进阶",
        advanced: "进阶",
      };
      return map[difficulty] || difficulty;
    },
  },
};
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.45);
  box-shadow:
    0 10rpx 30rpx rgba(0, 0, 0, 0.05),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.4);
}

.detail-page {
  min-height: 100vh;
  background: linear-gradient(
    180deg,
    #f4f7ff 0%,
    #eef2ff 25%,
    #e8eeff 50%,
    #eaf0ff 75%,
    #f0f3ff 100%
  );
  position: relative;
  overflow-x: hidden;
}

.detail-page::before {
  content: "";
  position: absolute;
  top: -8%;
  right: -12%;
  width: 420rpx;
  height: 420rpx;
  background: radial-gradient(
    circle,
    rgba(138, 92, 255, 0.14) 0%,
    rgba(124, 92, 255, 0.08) 50%,
    transparent 70%
  );
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  animation: bgFloat1 12s ease-in-out infinite;
}

.detail-page::after {
  content: "";
  position: absolute;
  bottom: 18%;
  left: -12%;
  width: 320rpx;
  height: 320rpx;
  background: radial-gradient(
    circle,
    rgba(47, 107, 255, 0.1) 0%,
    rgba(79, 114, 255, 0.05) 50%,
    transparent 70%
  );
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  animation: bgFloat2 15s ease-in-out infinite reverse;
}

.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 32rpx;
  padding-top: calc(22rpx + env(safe-area-inset-top));
  background: rgba(255, 255, 255, 85);
  backdrop-filter: blur(20px) saturate(1.8);
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.65);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  width: 68rpx;
  height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    rgba(26, 29, 41, 0.06),
    rgba(26, 29, 41, 0.03)
  );
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2rpx 6rpx rgba(0, 0, 0, 0.04),
    inset 0 1rpx 2rpx rgba(255, 255, 255, 0.5);
}

.back-btn:active {
  background: rgba(26, 29, 41, 0.12);
  transform: scale(0.95);
}

.nav-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #1a1d29;
  letter-spacing: -0.5rpx;
}

.placeholder {
  width: 68rpx;
}

.content-scroll {
  height: calc(100vh - env(safe-area-inset-top) - 120rpx);
}

.plan-container {
  padding: 28rpx 32rpx;
  padding-bottom: calc(56rpx + env(safe-area-inset-bottom));
  position: relative;
  z-index: 1;
}

.hero-card {
  padding: 32rpx 28rpx;
  margin-bottom: 28rpx;
  display: flex;
  gap: 24rpx;
  align-items: stretch;
}

.hero-left {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.badge-row {
  display: flex;
  gap: 12rpx;
  margin-bottom: 18rpx;
  flex-wrap: wrap;
  align-items: center;
}

.type-badge {
  padding: 10rpx 22rpx;
  background: linear-gradient(135deg, #4f72ff 0%, #7c5cff 100%);
  color: white;
  font-size: 23rpx;
  font-weight: 700;
  border-radius: 18rpx;
  letter-spacing: 1rpx;
  box-shadow:
    0 4rpx 14rpx rgba(79, 114, 255, 0.35),
    inset 0 1rpx 2rpx rgba(255, 255, 255, 0.25);
}

.diff-badge {
  padding: 10rpx 22rpx;
  border-radius: 18rpx;
  font-size: 23rpx;
  font-weight: 600;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.diff-badge.beginner {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  color: #059669;
}

.diff-badge.intermediate,
.diff-badge.advanced {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #d97706;
}

.plan-name {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  color: #1a1d29;
  margin-bottom: 14rpx;
  line-height: 1.3;
  letter-spacing: -0.5rpx;
}

.plan-desc {
  display: block;
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 20rpx;
}

.meta-row {
  display: flex;
  gap: 24rpx;
  margin-bottom: 20rpx;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #6b7280;
  font-weight: 500;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag-pill {
  padding: 8rpx 20rpx;
  background: linear-gradient(
    135deg,
    rgba(47, 107, 255, 0.08),
    rgba(138, 92, 255, 0.06)
  );
  color: #2f6bff;
  font-size: 23rpx;
  border-radius: 14rpx;
  font-weight: 600;
  border: 1.5rpx solid rgba(47, 107, 255, 0.15);
}

.hero-right {
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.hero-image-box {
  position: relative;
  width: 240rpx;
  height: 300rpx;
  border-radius: 24rpx;
  overflow: hidden;
  background: linear-gradient(
    160deg,
    #e8eeff 0%,
    #d4deff 40%,
    #c8d4ff 70%,
    #bcc8ff 100%
  );
  box-shadow:
    0 16rpx 40rpx rgba(47, 107, 255, 0.18),
    0 8rpx 20rpx rgba(138, 92, 255, 0.12),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.4);
}

.hero-image {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}

.hero-image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    160deg,
    #e8eeff 0%,
    #d4deff 40%,
    #c8d4ff 70%,
    #bcc8ff 100%
  );
  z-index: 1;
}

.progress-ring-wrapper {
  position: absolute;
  bottom: 14rpx;
  right: 14rpx;
  background: rgba(255, 255, 255, 96);
  border-radius: 50%;
  padding: 8rpx;
  box-shadow:
    0 8rpx 24rpx rgba(0, 0, 0, 0.12),
    0 3rpx 10rpx rgba(0, 0, 0, 0.06),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  animation: floatRing 3.5s ease-in-out infinite;
  z-index: 3;
}

.days-section {
  margin-bottom: 28rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22rpx;
  padding: 0 8rpx;
}

.section-title-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1a1d29;
  letter-spacing: -0.3rpx;
}

.collapse-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 18rpx;
  border-radius: 14rpx;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(154, 163, 175, 0.06);
}

.collapse-btn text {
  font-size: 24rpx;
  color: #9aa3af;
  font-weight: 500;
}

.collapse-btn:active {
  background: rgba(154, 163, 175, 0.18);
  transform: scale(0.98);
}

.day-card-wrapper {
  animation: slideInUp 0.5s ease-out both;
}

.action-bar {
  margin-top: 32rpx;
  margin-bottom: 24rpx;
  padding: 0 8rpx;
}

.btn-cta {
  width: 100%;
  height: 108rpx;
  border-radius: 54rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  position: relative;
  overflow: visible;
  cursor: pointer;
  transform: translateZ(0);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(90deg, #4f72ff, #8a5cff);
  background-size: 200% 200%;
  animation: gradientMove 4s ease infinite;
  box-shadow:
    0 16rpx 44rpx rgba(79, 114, 255, 0.42),
    0 6rpx 18rpx rgba(138, 92, 255, 0.28),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.25),
    inset 0 -2rpx 6rpx rgba(0, 0, 0, 0.1);
}

.btn-cta text {
  font-size: 34rpx;
  font-weight: 800;
  color: white;
  letter-spacing: 4rpx;
  text-shadow:
    0 2rpx 10rpx rgba(0, 0, 0, 0.2),
    0 1rpx 3rpx rgba(0, 0, 0, 0.15);
}

.cta-icon {
  font-size: 36rpx;
  filter: drop-shadow(0 2rpx 6rpx rgba(0, 0, 0, 0.2));
}

.btn-cta:active {
  transform: scale(0.97) !important;
  box-shadow:
    0 8rpx 24rpx rgba(79, 114, 255, 0.5),
    inset 0 6rpx 16rpx rgba(0, 0, 0, 0.18),
    0 0 40rpx rgba(138, 92, 255, 0.35);
}

.safety-tip {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  padding: 20rpx 24rpx;
  margin-top: 18rpx;
  background: linear-gradient(
    135deg,
    rgba(156, 163, 175, 0.08),
    rgba(156, 163, 175, 0.04)
  );
  border-radius: 16rpx;
  border-left: 4rpx solid #cbd5e1;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.safety-tip text {
  flex: 1;
  font-size: 24rpx;
  color: #6b7280;
  line-height: 1.58;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 48rpx;
  gap: 24rpx;
}

.empty-text {
  font-size: 30rpx;
  color: #94a3b8;
  font-weight: 500;
}

.btn-back {
  margin-top: 16rpx;
  padding: 20rpx 52rpx;
  background: linear-gradient(135deg, #2f6bff, #8a5cff);
  color: white;
  font-size: 28rpx;
  font-weight: 600;
  border-radius: 44rpx;
  border: none;
}

@keyframes gradientMove {
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

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes heroFadeIn {
  from {
    opacity: 0;
    transform: translateY(24rpx) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes sectionSlideIn {
  from {
    opacity: 0;
    transform: translateX(-20rpx);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes ctaSlideUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes tipFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes bgFloat1 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  33% {
    transform: translate(15px, -10px) scale(1.05);
    opacity: 0.85;
  }
  66% {
    transform: translate(-8px, 12px) scale(0.98);
    opacity: 0.92;
  }
}

@keyframes bgFloat2 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  33% {
    transform: translate(-12px, 8px) scale(1.03);
    opacity: 0.88;
  }
  66% {
    transform: translate(10px, -6px) scale(0.96);
    opacity: 0.94;
  }
}

@keyframes floatRing {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

.hero-enter {
  animation: heroFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: 0.1s;
}

.section-enter {
  animation: sectionSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: 0.3s;
}

.cta-enter {
  animation: ctaSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: 0.9s;
}

.tip-enter {
  animation: tipFadeIn 0.4s ease-out both;
  animation-delay: 1.1s;
}
</style>
