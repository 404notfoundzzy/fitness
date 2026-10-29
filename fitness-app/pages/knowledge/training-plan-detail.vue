<template>
  <view
    class="detail-page"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <view class="bg-orb bg-orb-1"></view>
    <view class="bg-orb bg-orb-2"></view>
    <view class="bg-glow"></view>

    <view class="nav-header">
      <view class="back-btn" @click="goBack">
        <view class="back-icon-wrap">
          <AppIcon
            name="left"
            :size="48"
            active-color="#2F6BFF"
            :breathe="false"
          />
        </view>
      </view>
      <text class="nav-title">训练计划</text>
      <view class="more-btn" @click="showMoreOptions">
        <view class="more-icon-wrap">
          <AppIcon
            name="more-filled"
            :size="48"
            active-color="#6B7280"
            :breathe="false"
          />
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="content-scroll" :show-scrollbar="false">
      <view v-if="planLoading" class="detail-skeleton-wrap">
        <view class="skeleton-hero-card">
          <view class="skeleton-badge-row">
            <view class="skeleton-badge skeleton-shimmer"></view>
            <view class="skeleton-badge skeleton-shimmer"></view>
          </view>
          <view class="skeleton-hero-title skeleton-shimmer"></view>
          <view class="skeleton-hero-desc skeleton-shimmer"></view>
          <view
            class="skeleton-hero-desc skeleton-shimmer"
            style="width: 60%"
          ></view>
          <view class="skeleton-meta-row">
            <view class="skeleton-meta-item skeleton-shimmer"></view>
            <view class="skeleton-meta-item skeleton-shimmer"></view>
          </view>
          <view class="skeleton-tags-row">
            <view class="skeleton-tag skeleton-shimmer"></view>
            <view class="skeleton-tag skeleton-shimmer"></view>
            <view class="skeleton-tag skeleton-shimmer"></view>
          </view>
        </view>
        <view class="skeleton-section-header">
          <view class="skeleton-section-title skeleton-shimmer"></view>
          <view class="skeleton-section-count skeleton-shimmer"></view>
        </view>
        <view v-for="i in 3" :key="i" class="skeleton-day-card">
          <view class="skeleton-day-header">
            <view class="skeleton-day-icon skeleton-shimmer"></view>
            <view class="skeleton-day-info">
              <view class="skeleton-day-title skeleton-shimmer"></view>
              <view class="skeleton-day-sub skeleton-shimmer"></view>
            </view>
          </view>
        </view>
      </view>

      <view v-else-if="planData" class="plan-container">
        <view class="hero-card hero-enter">
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
                <view class="meta-icon-wrap meta-icon-blue">
                  <uni-icons
                    type="calendar"
                    size="14"
                    color="#2F6BFF"
                  ></uni-icons>
                </view>
                <text>{{ planData.daysPerWeek }}天/周</text>
              </view>
              <view class="meta-item">
                <view class="meta-icon-wrap meta-icon-purple">
                  <uni-icons
                    type="person"
                    size="14"
                    color="#8A5CFF"
                  ></uni-icons>
                </view>
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
        </view>

        <view class="days-section section-enter">
          <view class="section-header">
            <view class="section-title-wrap">
              <view class="section-indicator"></view>
              <text class="section-title">每日安排</text>
              <text class="section-subtitle"
                >{{ planData.schedule.length }}天</text
              >
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
            :style="{ animationDelay: index * 0.08 + 's' }"
          >
            <DayCard
              :day-number="day.day"
              :day-name="day.name"
              :focus="day.focus"
              :exercises="day.exercises || []"
              :progress="getDayProgress(index)"
              :default-expanded="expandedDayIndices.includes(index)"
              @toggle="onDayToggle"
            />
          </view>
        </view>

        <view class="action-bar cta-enter">
          <button class="btn-cta" @click="startWorkout">
            <view class="cta-shimmer"></view>
            <view class="cta-content-wrapper">
              <text class="cta-icon-wrap">&#x1F525;</text>
              <text class="cta-text">开始训练</text>
            </view>
          </button>
        </view>

        <view class="safety-tip tip-enter">
          <view class="tip-icon-wrap">
            <uni-icons type="info" size="14" color="#9AA3AF"></uni-icons>
          </view>
          <text>建议在训练前充分热身，注意动作规范与安全</text>
        </view>
      </view>

      <view v-else class="empty-state">
        <view class="empty-icon-wrap">
          <uni-icons type="info" size="56" color="#CBD5E1"></uni-icons>
        </view>
        <text class="empty-text">未找到该训练计划</text>
        <button class="btn-back" @click="goBackToKnowledge">返回知识库</button>
      </view>
    </scroll-view>

    <ResultModal ref="resultModal" />
  </view>
</template>

<script>
import TrainingHero from "@/components/TrainingHero.vue";
import DayCard from "@/components/DayCard.vue";
import AppIcon from "@/components/AppIcon.vue";
import ResultModal from "@/components/ResultModal.vue";
import { useSwipeBack } from "@/composables/useSwipeBack.js";
import { trainingPlans } from "@/data/training-plans.js";
import { getTrainingPlanDetail, getTrainingPlanDays } from "@/api/index.js";
import { adaptPlanDetail } from "@/utils/planAdapter.js";
import { usePageCacheStore } from "@/stores/pageCache.js";

export default {
  components: {
    TrainingHero,
    DayCard,
    AppIcon,
    ResultModal,
  },
  data() {
    return {
      planId: "",
      source: "preset",
      planData: null,
      planLoading: false,
      expandedDayIndices: [],
      allExpanded: false,
      weeklyProgress: 32,
      dayProgresses: [80, 40, 20, 0, 0],
      allPlans: trainingPlans,
      isActivating: false,
      ...useSwipeBack(),
    };
  },
  onLoad(options) {
    if (options && options.id) {
      this.planId = options.id;
      this.source = options.source || "preset";
      this.loadPlanData();
    } else if (options && options.type) {
      this.planId = options.type;
      this.source = options.source || "preset";
      this.loadPlanData();
    } else {
      this.loadDefaultPlan();
    }
  },
  methods: {
    async loadPlanData() {
      this.planLoading = true;
      try {
        if (this.source === "custom") {
          await this.loadCustomPlanData();
        } else {
          this.loadPresetPlanData();
        }
      } finally {
        this.planLoading = false;
      }
    },

    loadPresetPlanData() {
      try {
        this.planData = this.allPlans.find((p) => p.id === this.planId) || null;
        if (!this.planData) {
          this.loadDefaultPlan();
        }
      } catch (e) {
        this.loadDefaultPlan();
      }
    },

    async loadCustomPlanData() {
      const cacheKey = `planDetail_${this.planId}`;
      const cacheStore = usePageCacheStore();
      const cached = cacheStore.getCached(cacheKey);
      if (cached) {
        this.planData = cached;
        cacheStore
          .silentRefresh(cacheKey, async () => {
            const planRes = await getTrainingPlanDetail(this.planId);
            const plan = planRes.data || planRes;
            const daysRes = await getTrainingPlanDays(this.planId);
            const daysData = daysRes.data || daysRes;
            const days = daysData.days || [];
            return adaptPlanDetail(plan, days);
          })
          .then((fresh) => {
            if (fresh) this.planData = fresh;
          });
        return;
      }

      try {
        const planRes = await getTrainingPlanDetail(this.planId);
        const plan = planRes.data || planRes;

        const daysRes = await getTrainingPlanDays(this.planId);
        const daysData = daysRes.data || daysRes;
        const days = daysData.days || [];

        this.planData = adaptPlanDetail(plan, days);
        cacheStore.setCache(cacheKey, this.planData);
        this.dayProgresses = this.planData.schedule.map(() => 0);
      } catch (e) {
        console.error("Failed to load custom plan:", e);
        this.loadDefaultPlan();
      }
    },

    loadDefaultPlan() {
      if (this.allPlans && this.allPlans.length > 0) {
        this.planData = this.allPlans[0];
        this.planId = this.planData.id;
      }
    },

    getDayProgress(index) {
      return this.dayProgresses[index] || 0;
    },

    onDayToggle({ dayNumber, expanded }) {
      const index = dayNumber - 1;
      if (expanded) {
        if (!this.expandedDayIndices.includes(index)) {
          this.expandedDayIndices = [...this.expandedDayIndices, index];
        }
      } else {
        this.expandedDayIndices = this.expandedDayIndices.filter(
          (i) => i !== index,
        );
      }
      this.allExpanded = this.planData
        ? this.expandedDayIndices.length === this.planData.schedule.length
        : false;
    },

    toggleAllDays() {
      this.allExpanded = !this.allExpanded;
      if (this.allExpanded && this.planData) {
        this.expandedDayIndices = this.planData.schedule.map((_, i) => i);
      } else {
        this.expandedDayIndices = [];
      }
    },

    async startWorkout() {
      if (this.isActivating) return;
      this.isActivating = true;

      if (typeof uni !== "undefined" && uni.vibrateShort) {
        uni.vibrateShort({ type: "medium" });
      }

      try {
        uni.showLoading({
          title: "正在准备训练...",
          mask: true,
        });

        const API_BASE = "https://zzy404notfound.site";
        const token = uni.getStorageSync("token") || "mock-jwt-token-1";

        const res = await uni.request({
          url: `${API_BASE}/api/user-active-plan/activate/${this.planId}`,
          method: "POST",
          header: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        });

        uni.hideLoading();

        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          this.$refs.resultModal.show({
            type: "success",
            theme: "plan",
            title: "训练已激活",
            desc: "计划已激活，开始你的训练之旅吧 🎉",
            autoClose: 2500,
          });

          setTimeout(() => {
            this.navigateToWorkout();
          }, 1000);
        } else {
          const errorMsg = res.data?.message || "激活失败";

          this.$refs.resultModal.show({
            type: "warning",
            theme: "plan",
            title: "激活失败",
            desc: `${errorMsg}，可以尝试直接开始训练`,
            btnText: "开始训练",
            autoClose: 0,
          });
        }
      } catch (error) {
        uni.hideLoading();
        console.error("激活计划失败:", error);

        this.$refs.resultModal.show({
          type: "info",
          theme: "plan",
          title: "网络异常",
          desc: "已切换到本地模式，仍可继续训练",
          autoClose: 2500,
        });

        setTimeout(() => {
          this.navigateToWorkout();
        }, 1200);
      } finally {
        this.isActivating = false;
      }
    },

    navigateToWorkout() {
      // 引导式训练台（阶段 4）：预填上次重量、组级记录、休息计时、PR 提示
      uni.navigateTo({
        url: `/pages/record/workout/guided-training?planId=${this.planId}`,
        fail: () => {
          this.$refs.resultModal.show({
            type: "info",
            theme: "plan",
            title: "打开训练台失败",
            desc: "请稍后重试，或到记录页手动记录本次训练",
            autoClose: 2500,
          });
        },
      });
    },

    showMoreOptions() {
      uni.showActionSheet({
        itemList: ["分享计划", "编辑计划", "重置进度"],
        success: (res) => {
          if (res.tapIndex === 1) {
            uni.navigateTo({
              url: `/pages/knowledge/training-plan-edit?id=${this.planId}`,
            });
          }
        },
      });
    },

    goBack() {
      try {
        const pages = getCurrentPages();
        if (pages.length > 1) {
          uni.navigateBack({
            delta: 1,
            fail: () => {
              this.goBackToKnowledge();
            },
          });
        } else {
          this.goBackToKnowledge();
        }
      } catch (e) {
        this.goBackToKnowledge();
      }
    },

    goBackToKnowledge() {
      uni.switchTab({
        url: "/pages/knowledge/knowledge",
        fail: () => {
          uni.reLaunch({
            url: "/pages/knowledge/knowledge",
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
.detail-skeleton-wrap {
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.skeleton-hero-card {
  padding: 40rpx 32rpx;
  border-radius: 32rpx;
  background: #ffffff;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.skeleton-badge-row {
  display: flex;
  gap: 16rpx;
}

.skeleton-badge {
  width: 100rpx;
  height: 44rpx;
  border-radius: 22rpx;
  background: #e2e8f0;
}

.skeleton-hero-title {
  width: 55%;
  height: 40rpx;
  border-radius: 10rpx;
  background: #e2e8f0;
}

.skeleton-hero-desc {
  width: 100%;
  height: 26rpx;
  border-radius: 6rpx;
  background: #e2e8f0;
}

.skeleton-meta-row {
  display: flex;
  gap: 20rpx;
  margin-top: 8rpx;
}

.skeleton-meta-item {
  flex: 1;
  height: 60rpx;
  border-radius: 16rpx;
  background: #e2e8f0;
}

.skeleton-tags-row {
  display: flex;
  gap: 14rpx;
  margin-top: 4rpx;
}

.skeleton-tag {
  width: 80rpx;
  height: 40rpx;
  border-radius: 20rpx;
  background: #e2e8f0;
}

.skeleton-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 8rpx;
}

.skeleton-section-title {
  width: 140rpx;
  height: 32rpx;
  border-radius: 8rpx;
  background: #e2e8f0;
}

.skeleton-section-count {
  width: 60rpx;
  height: 28rpx;
  border-radius: 6rpx;
  background: #e2e8f0;
}

.skeleton-day-card {
  padding: 32rpx 28rpx;
  border-radius: 24rpx;
  background: #ffffff;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.skeleton-day-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.skeleton-day-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  background: #e2e8f0;
  flex-shrink: 0;
}

.skeleton-day-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.skeleton-day-title {
  width: 40%;
  height: 30rpx;
  border-radius: 8rpx;
  background: #e2e8f0;
}

.skeleton-day-sub {
  width: 60%;
  height: 22rpx;
  border-radius: 6rpx;
  background: #e2e8f0;
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

.detail-page {
  min-height: 100vh;
  padding-top: 100rpx;
  background: linear-gradient(
    180deg,
    #f5f7fb 0%,
    #eef1f7 50%,
    #eaf0ff 85%,
    #f0f3ff 100%
  );
  position: relative;
  overflow-x: hidden;
}

.bg-glow {
  position: absolute;
  width: 600rpx;
  height: 600rpx;
  background: radial-gradient(
    circle,
    rgba(108, 99, 255, 0.22),
    transparent 70%
  );
  top: -200rpx;
  right: -200rpx;
  pointer-events: none;
  z-index: 0;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.bg-orb-1 {
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
  animation: bgFloat1 12s ease-in-out infinite;
}

.bg-orb-2 {
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
  animation: bgFloat2 15s ease-in-out infinite reverse;
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

.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 32rpx;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px) saturate(1.8);
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.55);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn,
.more-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:active {
    transform: scale(0.92);
  }
}

.back-icon-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    rgba(47, 107, 255, 0.08),
    rgba(138, 92, 255, 0.05)
  );
  border-radius: 50%;
  box-shadow:
    0 2rpx 6rpx rgba(47, 107, 255, 0.08),
    inset 0 1rpx 2rpx rgba(255, 255, 255, 0.5);
}

.more-icon-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    rgba(107, 114, 128, 0.06),
    rgba(107, 114, 128, 0.03)
  );
  border-radius: 50%;
  box-shadow:
    0 2rpx 6rpx rgba(0, 0, 0, 0.04),
    inset 0 1rpx 2rpx rgba(255, 255, 255, 0.5);
}

.nav-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #1a1d29;
  letter-spacing: -0.5rpx;
}

.content-scroll {
  height: calc(100vh - 100rpx);
}

.plan-container {
  padding: 28rpx 32rpx;
  padding-bottom: calc(56rpx + env(safe-area-inset-bottom));
  position: relative;
  z-index: 1;
}

.hero-card {
  padding: 40rpx 32rpx;
  margin-bottom: 28rpx;
  position: relative;
  overflow: hidden;
  background-image: url("/static/images/hero-bg.png");
  background-size: 100% 100%;
  background-position: center center;
  background-repeat: no-repeat;
  border-radius: 32rpx;
}

.hero-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(138, 92, 255, 0.3) 0%,
    rgba(79, 114, 255, 0.25) 20%,
    rgba(47, 107, 255, 0.2) 40%,
    rgba(79, 114, 255, 0.25) 60%,
    rgba(138, 92, 255, 0.3) 80%,
    rgba(167, 92, 255, 0.28) 100%
  );
  background-size: 400% 400%;
  animation: gradientFlow 10s ease infinite;
  z-index: 0;
}

.hero-card::after {
  content: "";
  position: absolute;
  top: -25%;
  right: -15%;
  width: 350rpx;
  height: 350rpx;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.2) 40%,
    transparent 70%
  );
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.hero-left {
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 2;
}

.badge-row {
  display: flex;
  gap: 12rpx;
  margin-bottom: 20rpx;
  flex-wrap: wrap;
  align-items: center;
}

.type-badge {
  padding: 11rpx 22rpx;
  background: linear-gradient(135deg, #4f72ff 0%, #7c5cff 100%);
  color: white;
  font-size: 23rpx;
  font-weight: 700;
  border-radius: 18rpx;
  letter-spacing: 0.8rpx;
}

.diff-badge {
  padding: 11rpx 22rpx;
  border-radius: 18rpx;
  font-size: 23rpx;
  font-weight: 600;
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
  font-size: 46rpx;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 18rpx;
  line-height: 1.25;
  letter-spacing: -0.8rpx;
}

.plan-desc {
  display: block;
  font-size: 25rpx;
  color: #6b7280;
  line-height: 1.65;
  margin-bottom: 26rpx;
}

.meta-row {
  display: flex;
  gap: 22rpx;
  margin-bottom: 26rpx;
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

.meta-icon-wrap {
  width: 30rpx;
  height: 30rpx;
  border-radius: 6rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.meta-icon-blue {
  background: rgba(47, 107, 255, 0.1);
}

.meta-icon-purple {
  background: rgba(138, 92, 255, 0.1);
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag-pill {
  padding: 9rpx 20rpx;
  background: rgba(47, 107, 255, 0.06);
  color: #3b82f6;
  font-size: 23rpx;
  border-radius: 14rpx;
  font-weight: 500;
  border: 1rpx solid rgba(59, 130, 246, 0.18);
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

.section-indicator {
  width: 6rpx;
  height: 28rpx;
  border-radius: 3rpx;
  background: linear-gradient(180deg, #2f6bff, #8a5cff);
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1a1d29;
  letter-spacing: -0.3rpx;
}

.section-subtitle {
  font-size: 22rpx;
  color: #9aa3af;
  font-weight: 500;
  margin-left: 4rpx;
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
  margin-top: 36rpx;
  margin-bottom: 24rpx;
  padding: 0 8rpx;
}

.btn-cta {
  width: 100%;
  height: 112rpx;
  border-radius: 56rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transform: translateZ(0);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(270deg, #2f6bff, #8a5cff, #2f6bff);
  background-size: 300% 300%;
  animation: flow 6s infinite;
  box-shadow:
    0 16rpx 44rpx rgba(79, 114, 255, 0.42),
    0 6rpx 18rpx rgba(138, 92, 255, 0.28),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.25),
    inset 0 -2rpx 6rpx rgba(0, 0, 0, 0.1);
}

.cta-shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.15),
    transparent
  );
  animation: shimmer 3s ease-in-out infinite;
}

.cta-icon-wrap {
  font-size: 36rpx;
  filter: drop-shadow(0 2rpx 6rpx rgba(0, 0, 0, 0.2));
}

.cta-content-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  position: relative;
  z-index: 1;
}

.cta-text {
  font-size: 34rpx;
  font-weight: 800;
  color: white;
  letter-spacing: 4rpx;
  text-shadow:
    0 2rpx 10rpx rgba(0, 0, 0, 0.2),
    0 1rpx 3rpx rgba(0, 0, 0, 0.15);
}

.btn-cta:active {
  transform: scale(0.96) !important;
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

.tip-icon-wrap {
  width: 32rpx;
  height: 32rpx;
  border-radius: 8rpx;
  background: rgba(156, 163, 175, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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

.empty-icon-wrap {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: rgba(203, 213, 225, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
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
  box-shadow: 0 8rpx 24rpx rgba(47, 107, 255, 0.3);
}

@keyframes flow {
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

@keyframes gradientFlow {
  0% {
    background-position: 0% 50%;
  }
  20% {
    background-position: 50% 0%;
  }
  40% {
    background-position: 100% 50%;
  }
  60% {
    background-position: 80% 100%;
  }
  80% {
    background-position: 20% 80%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes shimmer {
  0% {
    left: -150%;
  }
  50% {
    left: 150%;
  }
  100% {
    left: 150%;
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
  transform: scale(0.92);
  opacity: 0;
  animation: pageEnter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: 0.15s;
}

@keyframes pageEnter {
  to {
    transform: scale(1);
    opacity: 1;
  }
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
