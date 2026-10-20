<template>
  <view class="list-page">
    <view class="bg-orb bg-orb-1"></view>
    <view class="bg-orb bg-orb-2"></view>

    <view class="nav-header">
      <view class="back-btn" @click="goBack">
        <view class="back-icon-wrap">
          <uni-icons type="left" size="20" color="#2F6BFF"></uni-icons>
        </view>
      </view>
      <text class="nav-title">训练计划</text>
      <view class="more-btn" @click="showMoreOptions">
        <view class="more-icon-wrap">
          <uni-icons type="more-filled" size="20" color="#6B7280"></uni-icons>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="content-scroll" :show-scrollbar="false">
      <view class="hero-banner glass-card">
        <view class="hero-banner-bg"></view>
        <view class="hero-banner-content">
          <view class="hero-text-group">
            <text class="hero-greeting">选择你的</text>
            <text class="hero-highlight">训练计划</text>
          </view>
          <view class="hero-stats">
            <view class="stat-item">
              <text class="stat-number">{{ activePlanCount }}</text>
              <text class="stat-label">激活计划</text>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-item">
              <text class="stat-number">{{ presetPlans.length }}</text>
              <text class="stat-label">预置计划</text>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-item">
              <text class="stat-number">{{ customPlans.length }}</text>
              <text class="stat-label">自定义</text>
            </view>
          </view>
        </view>
        <view class="hero-decor">
          <view class="decor-ring decor-ring-1"></view>
          <view class="decor-ring decor-ring-2"></view>
        </view>
      </view>

      <view v-if="trainingStore" class="section store-section">
        <view class="section-header">
          <view class="section-title-wrap">
            <view class="section-indicator"></view>
            <text class="section-title">我的训练</text>
          </view>
          <text class="section-count">{{ trainingListCount }}</text>
        </view>

        <SectionLoader
          ref="trainingLoader"
          :loading="trainingListLoading"
          mode="skeleton"
          min-height="300rpx"
        >
          <view v-if="hasTrainingData" class="training-list">
            <TrainingCard
              v-for="(item, index) in trainingList"
              :key="`stable-card-${item.id}`"
              :item="item"
              :index="index"
            />
          </view>

          <view v-else class="empty-training-state">
            <view class="empty-icon-wrap">
              <uni-icons type="flag" size="60" color="#D1D5DB"></uni-icons>
            </view>
            <text class="empty-title">暂无激活的训练计划</text>
            <text class="empty-desc"
              >从下方"系统推荐"中选择一个计划开始训练</text
            >
            <view class="empty-action-btn" @click="scrollToPresetSection">
              <uni-icons type="right" size="16" color="#fff"></uni-icons>
              <text class="empty-btn-text">去选择计划</text>
            </view>
          </view>
        </SectionLoader>
      </view>

      <!-- 第二栏：自定义训练计划（独立栏目） -->
      <view class="section custom-section">
        <view class="section-header">
          <view class="section-title-wrap">
            <view class="section-indicator indicator-custom"></view>
            <text class="section-title">自定义训练计划</text>
          </view>
          <text class="section-count">{{ customPlanCount }}</text>
        </view>

        <SectionLoader
          ref="customLoader"
          :loading="customPlanLoading"
          mode="skeleton"
          min-height="300rpx"
        >
          <view class="plan-list">
            <view
              class="plan-card glass-card custom-add"
              @click="createCustomPlan"
            >
              <view class="card-glow glow-add"></view>
              <view class="add-icon-circle">
                <uni-icons type="compose" size="28" color="#fff"></uni-icons>
              </view>

              <view class="card-content">
                <text class="plan-name">创建新的训练计划</text>
                <text class="plan-desc">设计属于你自己的专属训练方案</text>

                <view class="tag-row">
                  <text class="tag primary-tag custom-type">自定义</text>
                  <text class="tag diff-tag beginner">灵活配置</text>
                </view>
              </view>

              <view class="card-arrow">
                <uni-icons type="right" size="16" color="#CBD5E1"></uni-icons>
              </view>
            </view>

            <view
              v-for="(plan, index) in customPlans"
              :key="'custom-' + index"
              class="plan-card glass-card custom"
              @click="openPlanDetail(plan)"
            >
              <view class="card-glow glow-custom"></view>
              <view class="card-icon icon-custom">
                <uni-icons type="person" size="24" color="#fff"></uni-icons>
              </view>

              <view class="card-content">
                <text class="plan-name">{{ plan.name }}</text>
                <text class="plan-desc">{{
                  plan.description || "自定义训练计划"
                }}</text>

                <view class="tag-row">
                  <text class="tag primary-tag custom-type">
                    {{ getSplitTypeLabel(plan.type) }}
                  </text>
                  <text class="tag days-tag"
                    >{{ plan.daysPerWeek || 3 }}天/周</text
                  >
                </view>
              </view>

              <view class="card-arrow">
                <uni-icons type="right" size="16" color="#CBD5E1"></uni-icons>
              </view>
            </view>
          </view>
        </SectionLoader>
      </view>

      <!-- 第三栏：系统推荐 -->
      <view class="section preset-section" id="presetSection">
        <view class="section-header">
          <view class="section-title-wrap">
            <view class="section-indicator"></view>
            <text class="section-title">系统推荐</text>
          </view>
          <text class="section-count">{{ presetPlans.length }} 套预置计划</text>
        </view>

        <view class="plan-list">
          <view
            v-for="(plan, index) in presetPlans"
            :key="'preset-' + index"
            class="plan-card glass-card"
            :class="'plan-card-' + plan.type"
            @click="openPlanDetail(plan)"
          >
            <view class="card-glow" :class="'glow-' + plan.type"></view>
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
                <text class="tag primary-tag">{{
                  getSplitTypeLabel(plan.type)
                }}</text>
                <text class="tag diff-tag" :class="plan.difficulty">
                  {{ getDifficultyLabel(plan.difficulty) }}
                </text>
                <text class="tag days-tag">{{ plan.daysPerWeek }}天/周</text>
              </view>
            </view>

            <view class="card-arrow">
              <uni-icons type="right" size="16" color="#CBD5E1"></uni-icons>
            </view>
          </view>
        </view>
      </view>

      <view style="height: 80rpx"></view>
    </scroll-view>

    <ResultModal ref="resultModal" />
  </view>
</template>

<script>
import {
  getPresetPlans,
  getSplitTypeLabel,
  getDifficultyLabel,
} from "@/data/training-plans";
import { getTrainingPlanList, getActivePlanCount } from "@/api/index";
import TrainingCard from "@/components/TrainingCard.vue";
import ResultModal from "@/components/ResultModal.vue";
import { getPlanIcon, getPlanIconClass } from "@/stores/training.js";
import { trainingListMixin } from "@/mixins/trainingListMixin.js";
import { usePageCacheStore } from "@/stores/pageCache.js";

export default {
  mixins: [trainingListMixin],

  components: {
    TrainingCard,
    ResultModal,
  },

  data() {
    return {
      presetPlans: [],
      customPlans: [],
      customPlanLoading: false,
      activePlanCount: 0,
    };
  },

  computed: {
    customPlanCount() {
      if (this.customPlanLoading) return "加载中...";
      return `${this.customPlans.length} 个计划`;
    },
  },

  onShow() {
    console.log(
      "📱 [训练计划列表] onShow 触发 - 时间:",
      new Date().toLocaleTimeString(),
    );
    this._hideLoading("训练计划列表", "onShow");
    this.initTrainingStore();

    this.loadTrainingListWithCache();

    this.loadPresetPlans();
    this.loadCustomPlansWithCache();
    this.loadActivePlanCount();
  },

  onLoad() {
    uni.$on("globalModal", (options) => {
      this.$refs.resultModal.show(options);
    });
  },

  onUnload() {
    uni.$off("globalModal");
  },

  methods: {
    loadPresetPlans() {
      this.presetPlans = getPresetPlans();
    },

    async loadActivePlanCount() {
      try {
        const data = await getActivePlanCount();
        this.activePlanCount = data?.activePlanCount ?? 0;
      } catch {
        this.activePlanCount = this.trainingList.length;
      }
    },

    async loadTrainingListWithCache() {
      if (!this.trainingStore) return;

      const cacheStore = usePageCacheStore();
      const cacheKey = "myTraining";
      let cached = cacheStore.getCached(cacheKey);

      if (!cached) {
        try {
          let raw = uni.getStorageSync("pageCache");
          if (typeof raw === "string") raw = JSON.parse(raw);
          if (
            raw &&
            typeof raw === "object" &&
            raw.cacheData &&
            raw.cacheData[cacheKey]
          ) {
            const ts = raw.cacheTimestamps && raw.cacheTimestamps[cacheKey];
            if (ts && Date.now() - ts < 300000) {
              cached = raw.cacheData[cacheKey];
              cacheStore.setCache(cacheKey, cached);
              console.log("[我的训练] 从原始存储恢复缓存 (persist 未生效)");
            }
          }
        } catch (e) {
          console.error("[我的训练] 读取原始存储失败:", e);
        }
      }

      console.log("[我的训练] 缓存检查:", {
        hasCached: !!cached,
        cacheData: cached ? `数组长度=${cached.length}` : null,
        storeListLength: this.trainingStore.list.length,
        storeListLoading: this.trainingStore.listLoading,
      });

      if (cached) {
        this.trainingStore.list = cached;
        this.trainingStore.listLoading = false;
        this._hideLoading("训练计划列表", "loadTrainingListWithCache");

        for (const item of cached) {
          if (
            item.id &&
            !this.trainingStore.planDaysData[item.id] &&
            !this.trainingStore.planDaysLoading[item.id]
          ) {
            this.trainingStore.fetchPlanDays(item.id, false).then(() => {
              console.log(
                "[我的训练] 缓存恢复后补拉 planDays - planId:",
                item.id,
              );
            });
          }
        }

        cacheStore
          .silentRefresh(cacheKey, async () => {
            const result = await this.trainingStore.fetchMyTraining(
              false,
              true,
            );
            if (result && this.trainingStore.list.length > 0) {
              return this.trainingStore.list;
            }
            return null;
          })
          .then(() => {});
        return;
      }

      await this.loadTrainingList(true);
      if (this.trainingStore.list.length > 0) {
        cacheStore.setCache(cacheKey, this.trainingStore.list);
        console.log("[我的训练] 首次加载完成，缓存已写入");
      }
    },

    async loadCustomPlansWithCache() {
      const cacheStore = usePageCacheStore();
      const cacheKey = "customPlans";
      let cached = cacheStore.getCached(cacheKey);

      if (!cached) {
        try {
          let raw = uni.getStorageSync("pageCache");
          if (typeof raw === "string") raw = JSON.parse(raw);
          if (
            raw &&
            typeof raw === "object" &&
            raw.cacheData &&
            raw.cacheData[cacheKey]
          ) {
            const ts = raw.cacheTimestamps && raw.cacheTimestamps[cacheKey];
            if (ts && Date.now() - ts < 300000) {
              cached = raw.cacheData[cacheKey];
              cacheStore.setCache(cacheKey, cached);
              console.log("[自定义计划] 从原始存储恢复缓存 (persist 未生效)");
            }
          }
        } catch (e) {
          console.error("[自定义计划] 读取原始存储失败:", e);
        }
      }

      if (cached) {
        this.customPlans = cached;
        this.customPlanLoading = false;

        cacheStore
          .silentRefresh(cacheKey, async () => {
            const data = await getTrainingPlanList();
            const allPlans = Array.isArray(data) ? data : [];
            return allPlans.filter((p) => p.planType === 0);
          })
          .then((fresh) => {
            if (fresh) {
              this.customPlans = fresh;
            }
          });
        return;
      }

      this.customPlanLoading = true;
      try {
        const data = await getTrainingPlanList();
        const allPlans = Array.isArray(data) ? data : [];
        this.customPlans = allPlans.filter((p) => p.planType === 0);
        cacheStore.setCache(cacheKey, this.customPlans);
      } catch {
        try {
          const plans = uni.getStorageSync("custom_training_plans") || [];
          this.customPlans = Array.isArray(plans) ? plans : [];
        } catch {
          this.customPlans = [];
        }
      } finally {
        this.customPlanLoading = false;
      }
    },

    async refreshMyTraining() {
      await this.loadTrainingList(true);
      const cacheStore = usePageCacheStore();
      if (this.trainingStore && this.trainingStore.list.length > 0) {
        cacheStore.setCache("myTraining", this.trainingStore.list);
      }
    },

    refreshCustomPlans() {
      const cacheStore = usePageCacheStore();
      cacheStore.clearCache("customPlans");
      this.loadCustomPlansWithCache();
    },

    async onTrainingStaleClick() {
      try {
        await this.refreshMyTraining();
        this.$refs.resultModal.show({
          type: "success",
          theme: "plan",
          title: "已刷新",
          desc: "训练列表已更新",
          autoClose: 1500,
        });
      } catch (e) {
        this.$refs.resultModal.show({
          type: "error",
          theme: "plan",
          title: "刷新失败",
          desc: e.message || "训练列表刷新失败，请稍后重试",
          autoClose: 2000,
        });
      }
    },

    async onCustomStaleClick() {
      try {
        await this.refreshCustomPlans();
        this.$refs.resultModal.show({
          type: "success",
          theme: "plan",
          title: "已刷新",
          desc: "自定义计划已更新",
          autoClose: 1500,
        });
      } catch (e) {
        this.$refs.resultModal.show({
          type: "error",
          theme: "plan",
          title: "刷新失败",
          desc: e.message || "自定义计划刷新失败，请稍后重试",
          autoClose: 2000,
        });
      }
    },

    scrollToPresetSection() {
      this.$nextTick(() => {
        uni
          .createSelectorQuery()
          .in(this)
          .select(".preset-section")
          .boundingClientRect((rect) => {
            if (rect) {
              uni.pageScrollTo({
                scrollTop: rect.top - 100,
                duration: 400,
              });
            } else {
              uni.pageScrollTo({
                scrollTop: 800,
                duration: 400,
              });
            }
          })
          .exec();
      });
    },

    goBack() {
      try {
        const pages = getCurrentPages();
        if (pages.length > 1) {
          uni.navigateBack({
            delta: 1,
            fail: () => {
              uni.switchTab({ url: "/pages/knowledge/knowledge" });
            },
          });
        } else {
          uni.switchTab({ url: "/pages/knowledge/knowledge" });
        }
      } catch (e) {
        uni.switchTab({ url: "/pages/knowledge/knowledge" });
      }
    },

    showMoreOptions() {
      uni.showActionSheet({
        itemList: ["刷新列表", "排序方式"],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.loadPresetPlans();
            this.loadCustomPlansWithCache();
            this.$refs.resultModal.show({
              type: "success",
              theme: "plan",
              title: "已刷新",
              desc: "计划列表已更新",
              autoClose: 1500,
            });
          }
        },
      });
    },

    openPlanDetail(plan) {
      const source = plan.planType === 1 ? "preset" : "custom";
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
      return getPlanIconClass(type);
    },

    getPlanIcon(type) {
      return getPlanIcon(type);
    },
  },
};
</script>

<style lang="scss" scoped>
.list-page {
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
    rgba(138, 92, 255, 0.12) 0%,
    rgba(124, 92, 255, 0.06) 50%,
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

.glass-card {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1rpx solid rgba(255, 255, 255, 0.45);
  box-shadow:
    0 8rpx 24rpx rgba(0, 0, 0, 0.04),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.4);
}

.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 32rpx;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px) saturate(1.8);
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.5);
  position: sticky;
  top: 0;
  z-index: 100;

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
}

.content-scroll {
  height: calc(100vh - 100rpx);
  padding: 24rpx 28rpx;
  box-sizing: border-box;
  width: 100%;
  position: relative;
  z-index: 1;
}

.hero-banner {
  border-radius: 28rpx;
  padding: 36rpx 32rpx;
  margin-bottom: 32rpx;
  position: relative;
  overflow: hidden;
  animation: heroFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.hero-banner-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(47, 107, 255, 0.08) 0%,
    rgba(138, 92, 255, 0.06) 50%,
    rgba(47, 107, 255, 0.04) 100%
  );
  z-index: 0;
}

.hero-banner-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hero-text-group {
  display: flex;
  flex-direction: column;
}

.hero-greeting {
  font-size: 26rpx;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 4rpx;
}

.hero-highlight {
  font-size: 42rpx;
  font-weight: 800;
  color: #1a1d29;
  letter-spacing: -0.5rpx;
  background: linear-gradient(135deg, #2f6bff, #8a5cff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 20rpx;
  padding: 16rpx 24rpx;
  box-shadow:
    0 4rpx 12rpx rgba(0, 0, 0, 0.04),
    inset 0 1rpx 2rpx rgba(255, 255, 255, 0.5);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 36rpx;
  font-weight: 800;
  color: #2f6bff;
  line-height: 1.2;
}

.stat-label {
  font-size: 20rpx;
  color: #9aa3af;
  font-weight: 500;
}

.stat-divider {
  width: 1rpx;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.08);
}

.hero-decor {
  position: absolute;
  top: -20rpx;
  right: -10rpx;
  z-index: 0;
}

.decor-ring {
  position: absolute;
  border-radius: 50%;
  border: 2rpx solid rgba(47, 107, 255, 0.12);
}

.decor-ring-1 {
  width: 120rpx;
  height: 120rpx;
  top: 0;
  right: 20rpx;
  animation: ringPulse 4s ease-in-out infinite;
}

.decor-ring-2 {
  width: 80rpx;
  height: 80rpx;
  top: 30rpx;
  right: 0;
  border-color: rgba(138, 92, 255, 0.1);
  animation: ringPulse 4s ease-in-out infinite 1s;
}

@keyframes ringPulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}

.store-section {
  margin-bottom: 28rpx;
}

.training-list {
  display: flex;
  flex-direction: column;
}

.empty-training-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 30rpx;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 20rpx;
  border: 2rpx dashed rgba(156, 163, 175, 0.3);
  gap: 16rpx;
}

.empty-icon-wrap {
  width: 120rpx;
  height: 120rpx;
  background: rgba(156, 163, 175, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10rpx;
}

.empty-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #374151;
}

.empty-desc {
  font-size: 25rpx;
  color: #9aa3af;
  text-align: center;
  line-height: 1.4;
  max-width: 400rpx;
}

.empty-action-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 18rpx 36rpx;
  background: linear-gradient(135deg, #2f6bff, #1e4fd9);
  border-radius: 14rpx;
  margin-top: 16rpx;
  box-shadow: 0 6rpx 16rpx rgba(47, 107, 255, 0.25);
}

.empty-action-btn:active {
  transform: scale(0.96);
  opacity: 0.9;
}

.empty-btn-text {
  font-size: 26rpx;
  color: #fff;
  font-weight: 500;
}

.section {
  margin-bottom: 32rpx;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18rpx;
    padding: 0 4rpx;
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

  .indicator-amber {
    background: linear-gradient(180deg, #f59e0b, #d97706);
  }

  .indicator-custom {
    background: linear-gradient(180deg, #ff8a3d, #ff6b1a);
  }

  .section-title {
    font-size: 30rpx;
    font-weight: 700;
    color: #1a1d29;
    letter-spacing: -0.3rpx;
  }

  .section-count {
    font-size: 22rpx;
    color: #9aa3af;
    font-weight: 500;
  }
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.plan-card {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 100%;
  border-radius: 24rpx;
  padding: 22rpx 22rpx;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateZ(0);

  &:active {
    transform: scale(0.97) !important;
    transition: all 0.15s ease;
  }

  &.custom {
    border-left: 4rpx solid #f59e0b;
  }
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
  z-index: 0;
}

.plan-card:active .card-glow {
  opacity: 1;
}

.glow-five-split {
  background: radial-gradient(circle, rgba(239, 68, 68, 0.06), transparent 60%);
}

.glow-three-split {
  background: radial-gradient(
    circle,
    rgba(59, 130, 246, 0.06),
    transparent 60%
  );
}

.glow-kai-three-split {
  background: radial-gradient(
    circle,
    rgba(167, 139, 250, 0.06),
    transparent 60%
  );
}

.glow-full-body {
  background: radial-gradient(
    circle,
    rgba(16, 185, 129, 0.06),
    transparent 60%
  );
}

.glow-custom {
  background: radial-gradient(
    circle,
    rgba(245, 158, 11, 0.06),
    transparent 60%
  );
}

.glow-add {
  background: radial-gradient(
    circle,
    rgba(139, 92, 246, 0.06),
    transparent 60%
  );
}

.card-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 18rpx;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  box-shadow:
    0 6rpx 16rpx rgba(0, 0, 0, 0.12),
    inset 0 1rpx 2rpx rgba(255, 255, 255, 0.25);

  &.icon-red {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    box-shadow:
      0 6rpx 16rpx rgba(239, 68, 68, 0.3),
      inset 0 1rpx 2rpx rgba(255, 255, 255, 0.25);
  }

  &.icon-blue {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    box-shadow:
      0 6rpx 16rpx rgba(59, 130, 246, 0.3),
      inset 0 1rpx 2rpx rgba(255, 255, 255, 0.25);
  }

  &.icon-purple {
    background: linear-gradient(135deg, #a78bfa, #7c3aed);
    box-shadow:
      0 6rpx 16rpx rgba(167, 139, 250, 0.3),
      inset 0 1rpx 2rpx rgba(255, 255, 255, 0.25);
  }

  &.icon-green {
    background: linear-gradient(135deg, #10b981, #059669);
    box-shadow:
      0 6rpx 16rpx rgba(16, 185, 129, 0.3),
      inset 0 1rpx 2rpx rgba(255, 255, 255, 0.25);
  }

  &.icon-custom {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    box-shadow:
      0 6rpx 16rpx rgba(245, 158, 11, 0.3),
      inset 0 1rpx 2rpx rgba(255, 255, 255, 0.25);
  }
}

.add-icon-circle {
  width: 72rpx;
  height: 72rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 18rpx;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  box-shadow:
    0 6rpx 16rpx rgba(139, 92, 246, 0.35),
    inset 0 1rpx 2rpx rgba(255, 255, 255, 0.25);
}

.card-content {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  position: relative;
  z-index: 1;

  .plan-name {
    display: block;
    font-size: 28rpx;
    font-weight: 700;
    color: #1a1d29;
    margin-bottom: 4rpx;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .plan-desc {
    display: block;
    font-size: 22rpx;
    color: #9aa3af;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 10rpx;
  }

  .tag-row {
    display: flex;
    align-items: center;
    gap: 8rpx;
    flex-wrap: nowrap;
    overflow: hidden;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    padding: 4rpx 14rpx;
    border-radius: 8rpx;
    font-size: 20rpx;
    font-weight: 600;
    line-height: 1.5;
    flex-shrink: 0;
  }

  .primary-tag {
    background: linear-gradient(135deg, #2f6bff, #8a5cff);
    color: #fff;
    box-shadow: 0 2rpx 8rpx rgba(47, 107, 255, 0.25);

    &.custom-type {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      box-shadow: 0 2rpx 8rpx rgba(245, 158, 11, 0.25);
    }
  }

  .diff-tag {
    &.beginner {
      background: linear-gradient(135deg, #d1fae5, #a7f3d0);
      color: #059669;
    }

    &.intermediate,
    &.advanced {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #d97706;
    }
  }

  .days-tag {
    background: rgba(241, 245, 249, 0.8);
    color: #64748b;
  }
}

.card-arrow {
  flex-shrink: 0;
  margin-left: 8rpx;
  position: relative;
  z-index: 1;
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.02);
  transition: all 0.25s ease;
}

.plan-card:active .card-arrow {
  background: rgba(47, 107, 255, 0.08);
  transform: translateX(4rpx);
}

.custom-add {
  border: 1rpx dashed rgba(139, 92, 246, 0.3);
  background:
    linear-gradient(
      135deg,
      rgba(139, 92, 246, 0.03) 0%,
      rgba(59, 130, 246, 0.02) 100%
    ),
    rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);

  &:active {
    background:
      linear-gradient(
        135deg,
        rgba(139, 92, 246, 0.06) 0%,
        rgba(59, 130, 246, 0.04) 100%
      ),
      rgba(255, 255, 255, 0.65);
  }
}

@keyframes heroFadeIn {
  from {
    opacity: 0;
    transform: translateY(20rpx) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
