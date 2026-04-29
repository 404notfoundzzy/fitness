<template>
  <view class="container">
    <!-- 标题 -->
    <view class="header">
      <text class="title">健身知识库</text>
      <text class="subtitle">建立你的科学健身观</text>
    </view>

    <!-- 搜索框 -->
    <view class="search-box">
      <uni-icons type="search" size="20" color="#94A3B8"></uni-icons>
      <input
        type="text"
        v-model="searchQuery"
        @input="onSearch"
        placeholder="搜索健身动作..."
        placeholder-style="color: #94A3B8"
      />
    </view>

    <!-- 1. 分类网格展示 (默认视图) -->
    <view v-if="viewState === 'grid'">
      <view class="tool-card plan-tool-card" @click="goTrainingPlanList">
        <view class="gradient-flow"></view>
        <view class="card-content-wrap">
          <view class="tool-icon-wrap plan-icon-bg">
            <uni-icons type="list" size="28" color="#fff"></uni-icons>
          </view>
          <view class="tool-info">
            <text class="tool-title plan-title">训练计划</text>
            <text class="tool-desc plan-desc"
              >五分化 / 三分化 / 全身训练 · 科学规划你的训练</text
            >
          </view>
          <uni-icons type="chevron-right" size="20" color="#94A3B8"></uni-icons>
        </view>
      </view>

      <view class="tool-card calorie-tool-card" @click="goCalorieGuide">
        <view class="gradient-flow-orange"></view>
        <view class="card-content-wrap">
          <view class="tool-icon-wrap calorie-icon-bg">
            <uni-icons type="fire" size="32" color="#fff"></uni-icons>
          </view>
          <view class="tool-info">
            <text class="tool-title calorie-title">能量计算器</text>
            <text class="tool-desc calorie-desc"
              >BMR / TDEE / 运动消耗 · 科学计算每日热量</text
            >
          </view>
          <uni-icons type="chevron-right" size="20" color="#94A3B8"></uni-icons>
        </view>
      </view>

      <view class="category-grid">
        <view
          v-for="(cat, index) in categories"
          :key="index"
          class="card category-block"
          @click="selectCategory(cat)"
        >
          <view
            class="icon-circle"
            :style="{ backgroundColor: getCategoryColor(cat) }"
          >
            <image
              :src="getCategoryImage(cat)"
              class="category-icon-image"
              mode="aspectFit"
            ></image>
          </view>
          <text class="cat-label">{{ cat }}</text>
          <text class="cat-sub">{{ getExerciseCount(cat) }} 个动作</text>
        </view>
      </view>
    </view>

    <!-- 2. 动作列表展示 (点击大类后 或 搜索时) -->
    <view v-else class="list-view">
      <view class="list-header-enhanced">
        <view class="header-bg"></view>
        <view class="header-content">
          <view class="back-btn-circle" @click="resetView">
            <uni-icons type="left" size="22" color="#0EA5E9"></uni-icons>
          </view>
          <text class="current-cat">{{
            searchQuery ? "搜索结果" : currentCategory
          }}</text>
        </view>
      </view>

      <scroll-view scroll-y class="exercise-scroll">
        <view
          v-for="(item, index) in filteredExercises"
          :key="index"
          class="card exercise-item-enhanced"
          @click="openDetail(item)"
        >
          <view
            class="exercise-icon-wrapper"
            :style="{ background: getExerciseIconBg(item.category) }"
          >
            <uni-icons
              :type="getExerciseIconType(item.category)"
              size="26"
              :color="getExerciseIconColor(item.category)"
            ></uni-icons>
          </view>
          <view class="exercise-info-enhanced">
            <text class="exercise-name-enhanced">{{ item.name }}</text>
            <view class="exercise-meta-row">
              <text class="muscle-tag">{{ item.muscleGroup }}</text>
              <text v-if="item.equipment" class="equipment-tag">{{
                item.equipment
              }}</text>
            </view>
          </view>
          <view class="arrow-icon">
            <uni-icons type="right" size="18" color="#CBD5E1"></uni-icons>
          </view>
        </view>

        <view v-if="filteredExercises.length === 0" class="empty-state">
          <uni-icons type="info" size="48" color="#E2E8F0"></uni-icons>
          <text>该分类下暂无动作数据</text>
        </view>
      </scroll-view>
    </view>

    <!-- 详情弹窗 -->
    <uni-popup
      ref="exercisePopup"
      type="bottom"
      :safe-area-inset-bottom="false"
      :mask-click="true"
      @change="onExercisePopupChange"
    >
      <view class="popup-wrapper">
        <view class="modal-content" v-if="currentExercise">
          <view class="handle"></view>
          <text
            class="modal-title"
            @longpress="copyText(currentExercise.name, '动作名称')"
            >{{ currentExercise.name }}</text
          >
          <view class="tags">
            <view class="tag primary">{{ currentExercise.category }}</view>
            <view class="tag secondary">力量核心</view>
          </view>

          <scroll-view scroll-y="true" class="modal-scroll">
            <view class="section">
              <view class="section-header">
                <text class="section-title">动作要领</text>
                <view
                  class="copy-btn"
                  @longpress="copyText(currentExercise.description, '动作要领')"
                >
                  <uni-icons type="copy" size="14" color="#0EA5E9"></uni-icons>
                  <text>复制</text>
                </view>
              </view>
              <text class="section-text selectable">{{
                currentExercise.description
              }}</text>
            </view>
            <view class="section" v-if="currentExercise.professionalTips">
              <text class="section-title warning">专业注意事项</text>
              <view class="warning-box">
                <text class="warning-text selectable">{{
                  currentExercise.professionalTips
                }}</text>
              </view>
            </view>
          </scroll-view>

          <button class="btn-confirm" @click="closeDetail">我知道了</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import { getExercises, getDictData } from "@/api/index";
import { checkLogin } from "@/utils/auth";

export default {
  data() {
    return {
      searchQuery: "",
      exercises: [],
      currentExercise: null,
      categories: [
        "胸部肌群",
        "背部肌群",
        "下肢肌群",
        "肩部肌群",
        "手臂肌群",
        "核心训练",
        "全身有氧",
      ],
      currentCategory: "胸部肌群",
      viewState: "grid", // 'grid' or 'list'
    };
  },
  computed: {
    filteredExercises() {
      let list = this.exercises;
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        list = list.filter(
          (ex) =>
            ex.name.toLowerCase().includes(query) ||
            ex.muscleGroup.toLowerCase().includes(query) ||
            ex.category.toLowerCase().includes(query),
        );
      } else if (this.currentCategory) {
        list = list.filter((ex) => ex.category === this.currentCategory);
      }
      return list;
    },
  },
  onShow() {
    if (checkLogin()) {
      this.fetchExercises();
      this.fetchCategories();
    }
  },
  methods: {
    goCalorieGuide() {
      uni.navigateTo({ url: "/pages/knowledge/calorie-guide" });
    },

    goTrainingPlanList() {
      uni.navigateTo({ url: "/pages/knowledge/training-plan-list" });
    },
    getExerciseCount(cat) {
      return this.exercises.filter((ex) => ex.category === cat).length;
    },
    getCategoryImage(cat) {
      if (cat.includes("胸")) return "/static/chest.svg";
      if (cat.includes("背")) return "/static/back.svg";
      if (cat.includes("下肢") || cat.includes("腿")) return "/static/legs.svg";
      if (cat.includes("肩")) return "/static/shoulders.svg";
      if (cat.includes("手臂") || cat.includes("臂")) return "/static/arms.svg";
      if (cat.includes("核心") || cat.includes("腹")) return "/static/abs.svg";
      if (cat.includes("有氧")) return "/static/cardio.svg";
      return "/static/fitness-6.svg";
    },
    getCategoryColor(cat) {
      const colors = {
        胸部肌群: "#E0F2FE", // light blue
        背部肌群: "#FFE4E6", // light rose
        下肢肌群: "#D1FAE5", // light emerald
        肩部肌群: "#FEF3C7", // light amber
        手臂肌群: "#EDE9FE", // light violet
        核心训练: "#FCE7F3", // light pink
        全身有氧: "#FFEDD5", // light orange
      };
      return colors[cat] || "#F1F5F9";
    },
    getExerciseIconBg(category) {
      const bgs = {
        胸部肌群: "linear-gradient(135deg, #E0F2FE, #BAE6FD)",
        背部肌群: "linear-gradient(135deg, #FFE4E6, #FECDD3)",
        下肢肌群: "linear-gradient(135deg, #D1FAE5, #A7F3D0)",
        肩部肌群: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
        手臂肌群: "linear-gradient(135deg, #EDE9FE, #DDD6FE)",
        核心训练: "linear-gradient(135deg, #FCE7F3, #FBCFE8)",
        全身有氧: "linear-gradient(135deg, #FFEDD5, #FED7AA)",
      };
      return bgs[category] || "linear-gradient(135deg, #F1F5F9, #E2E8F0)";
    },
    getExerciseIconType(category) {
      const icons = {
        胸部肌群: "heart",
        背部肌群: "loop",
        下肢肌群: "flag",
        肩部肌群: "star",
        手臂肌群: "star-filled",
        核心训练: "fire",
        全身有氧: "paperplane",
      };
      return icons[category] || "flag";
    },
    getExerciseIconColor(category) {
      const colors = {
        胸部肌群: "#0369A1",
        背部肌群: "#BE123C",
        下肢肌群: "#047857",
        肩部肌群: "#B45309",
        手臂肌群: "#6D28D9",
        核心训练: "#DB2777",
        全身有氧: "#C2410C",
      };
      return colors[category] || "#475569";
    },

    async fetchCategories() {
      try {
        const data = await getDictData("exercise_category");
        if (data && Array.isArray(data)) {
          if (data.length > 0) {
            this.categories = data.map((item) => item.dictLabel);
          }
        }
      } catch (e) {
        console.error("Failed to fetch categories", e);
      }
    },
    async fetchExercises() {
      try {
        const data = await getExercises(this.searchQuery);
        this.exercises = Array.isArray(data) ? data : [];
      } catch (e) {
        console.error("Failed to fetch exercises", e);
        this.exercises = [];
      }
    },
    selectCategory(cat) {
      this.currentCategory = cat;
      this.searchQuery = ""; // 清除搜索词
      this.viewState = "list";
    },
    resetView() {
      this.viewState = "grid";
      this.searchQuery = "";
    },
    onSearch() {
      if (this.searchQuery) {
        this.viewState = "list";
      } else {
        this.viewState = "grid";
      }
      // 简单的防抖处理
      if (this.searchTimer) clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        this.fetchExercises();
      }, 500);
    },
    openDetail(item) {
      this.currentExercise = item;
      uni.hideTabBar({ animation: true });
      this.$nextTick(() => {
        setTimeout(() => {
          uni.hideTabBar({ animation: true });
        }, 50);
      });
      this.$nextTick(() => {
        if (
          this.$refs.exercisePopup &&
          typeof this.$refs.exercisePopup.open === "function"
        ) {
          this.$refs.exercisePopup.open();
        } else {
          console.error(
            "详情弹窗 (uni-popup) 未正确加载，请检查 uni_modules 是否安装",
          );
          uni.showToast({
            title: "详情弹窗加载失败，请检查 uni-ui 组件库",
            icon: "none",
          });
        }
      });
    },
    closeDetail() {
      if (
        this.$refs.exercisePopup &&
        typeof this.$refs.exercisePopup.close === "function"
      ) {
        this.$refs.exercisePopup.close();
      }
    },
    onExercisePopupChange(e) {
      if (!e.show) {
        setTimeout(() => {
          uni.showTabBar({ animation: true });
        }, 280);
      }
    },
    copyText(text, label) {
      if (!text) return;
      uni.setClipboardData({
        data: text,
        success: () => {
          uni.showToast({
            title: `${label}已复制`,
            icon: "success",
            duration: 1200,
          });
        },
        fail: () => {
          uni.showToast({ title: "复制失败", icon: "none" });
        },
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
  margin-bottom: 60rpx;
  .title {
    display: block;
    font-size: 56rpx;
    font-weight: 800;
    color: $text-main;
    margin-bottom: 10rpx;
  }
  .subtitle {
    font-size: 28rpx;
    color: $text-muted;
    font-weight: 500;
  }
}

.plan-tool-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #e0f2fe, #ede9fe) !important;
  border-radius: 24rpx;
  padding: 28rpx 32rpx;
  margin-bottom: 28rpx;
  box-shadow:
    0 4rpx 20rpx rgba(59, 130, 246, 0.12),
    0 2rpx 8rpx rgba(167, 139, 250, 0.08) !important;
  border: 1rpx solid rgba(167, 139, 250, 0.15) !important;

  .gradient-flow {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent,
      rgba(96, 165, 250, 0.25),
      transparent,
      rgba(196, 181, 253, 0.25),
      transparent
    );
    animation: gradientFlow 4s ease-in-out infinite;

    @keyframes gradientFlow {
      0% {
        transform: translate(-30%, -30%) rotate(0deg);
      }

      50% {
        transform: translate(10%, 10%) rotate(180deg);
      }

      100% {
        transform: translate(-30%, -30%) rotate(360deg);
      }
    }
  }

  .card-content-wrap {
    display: flex;
    align-items: center;
    position: relative;
    z-index: 1;
  }

  .plan-icon-bg {
    background: linear-gradient(135deg, #3b82f6, #8b5cf6) !important;
    box-shadow: 0 4rpx 16rpx rgba(99, 102, 241, 0.35);
  }

  .plan-title {
    color: #1e293b;
    font-weight: 700;
  }

  .plan-desc {
    color: #475569;
  }

  &:active {
    transform: scale(0.98);

    .gradient-flow {
      animation-duration: 2s;
    }
  }
}

.calorie-tool-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #fff7ed, #ffedd5) !important;
  border-radius: 24rpx;
  padding: 28rpx 32rpx;
  margin-bottom: 28rpx;
  box-shadow:
    0 4rpx 20rpx rgba(251, 146, 60, 0.12),
    0 2rpx 8rpx rgba(245, 158, 11, 0.08) !important;
  border: 1rpx solid rgba(251, 146, 60, 0.15) !important;

  .gradient-flow-orange {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent,
      rgba(251, 146, 60, 0.25),
      transparent,
      rgba(253, 186, 116, 0.25),
      transparent
    );
    animation: gradientFlowOrange 4s ease-in-out infinite;

    @keyframes gradientFlowOrange {
      0% {
        transform: translate(-30%, -30%) rotate(0deg);
      }

      50% {
        transform: translate(10%, 10%) rotate(180deg);
      }

      100% {
        transform: translate(-30%, -30%) rotate(360deg);
      }
    }
  }

  .card-content-wrap {
    display: flex;
    align-items: center;
    position: relative;
    z-index: 1;
  }

  .calorie-icon-bg {
    background: linear-gradient(135deg, #f97316, #ea580c) !important;
    box-shadow: 0 4rpx 20rpx rgba(234, 88, 12, 0.4);
  }

  .calorie-title {
    color: #1e293b;
    font-weight: 700;
  }

  .calorie-desc {
    color: #475569;
  }

  &:active {
    transform: scale(0.98);

    .gradient-flow-orange {
      animation-duration: 2s;
    }
  }
}

.tool-card {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #fff7ed, #ffedd5);
  border-radius: 24rpx;
  padding: 28rpx 32rpx;
  margin-bottom: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(249, 115, 22, 0.1);
  border: 1rpx solid rgba(249, 115, 22, 0.08);

  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }

  .tool-icon-wrap {
    width: 80rpx;
    height: 80rpx;
    background: linear-gradient(135deg, #f97316, #ea580c);
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20rpx;
    flex-shrink: 0;
  }

  .tool-info {
    flex: 1;

    .tool-title {
      display: block;
      font-size: 30rpx;
      font-weight: 700;
      color: #1e293b;
    }

    .tool-desc {
      display: block;
      font-size: 23rpx;
      color: #94a3b8;
      margin-top: 4rpx;
    }
  }
}

.search-box {
  background-color: #fff;
  height: 100rpx;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  padding: 0 40rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.02);

  input {
    flex: 1;
    margin-left: 20rpx;
    font-size: 28rpx;
    color: $text-main;
  }
}

.category-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30rpx;
  padding-bottom: 40rpx;
}

.category-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50rpx 30rpx;
  transition: transform 0.2s;

  &:active {
    transform: scale(0.95);
  }

  .icon-circle {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24rpx;
    box-shadow: 0 10rpx 20rpx rgba(0, 0, 0, 0.1);

    .category-icon-image {
      width: 68rpx;
      height: 68rpx;
    }
  }

  .cat-label {
    font-size: 30rpx;
    font-weight: 800;
    color: $text-main;
    margin-bottom: 8rpx;
  }

  .cat-sub {
    font-size: 20rpx;
    color: $text-light;
    font-weight: 600;
  }
}

.list-view {
  .list-header-enhanced {
    position: relative;
    margin-bottom: 40rpx;
    border-radius: 32rpx;
    overflow: hidden;

    .header-bg {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        135deg,
        #f0f9ff 0%,
        #e0f2fe 50%,
        #bae6fd 100%
      );
      opacity: 0.6;
    }

    .header-content {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      padding: 28rpx 32rpx;

      .back-btn-circle {
        width: 72rpx;
        height: 72rpx;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 24rpx;
        box-shadow: 0 4rpx 16rpx rgba(14, 165, 233, 0.15);
        transition: all 0.2s ease;

        &:active {
          transform: scale(0.92);
          box-shadow: 0 2rpx 8rpx rgba(14, 165, 233, 0.2);
        }
      }

      .current-cat {
        font-size: 38rpx;
        font-weight: 800;
        color: #0c4a6e;
        letter-spacing: 1rpx;
      }
    }
  }

  .list-header {
    display: flex;
    align-items: center;
    margin-bottom: 40rpx;

    .back-btn {
      display: flex;
      align-items: center;
      background-color: #fff;
      padding: 12rpx 24rpx;
      border-radius: 100rpx;
      margin-right: 30rpx;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);

      text {
        font-size: 24rpx;
        color: $primary-color;
        font-weight: 700;
        margin-left: 8rpx;
      }
    }

    .current-cat {
      font-size: 36rpx;
      font-weight: 800;
      color: $text-main;
    }
  }
}

.exercise-scroll {
  height: calc(100vh - 450rpx);
}

.card {
  background-color: $card-bg;
  border-radius: 40rpx;
  padding: 30rpx;
  box-shadow: $card-shadow;
  border: 1px solid rgba(14, 165, 233, 0.05);
}

.exercise-item {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;

  .icon-box {
    width: 88rpx;
    height: 88rpx;
    background-color: $primary-light;
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;
  }

  .exercise-info {
    flex: 1;
    .exercise-name {
      display: block;
      font-size: 30rpx;
      font-weight: 700;
      color: $text-main;
      margin-bottom: 4rpx;
    }
    .exercise-meta {
      font-size: 22rpx;
      color: $text-light;
      font-weight: 500;
    }
  }
}

.exercise-item-enhanced {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  padding: 28rpx 32rpx;
  transition: all 0.25s ease;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  }

  .exercise-icon-wrapper {
    width: 100rpx;
    height: 100rpx;
    border-radius: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;
    flex-shrink: 0;
    box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.08);
  }

  .exercise-info-enhanced {
    flex: 1;
    min-width: 0;

    .exercise-name-enhanced {
      display: block;
      font-size: 32rpx;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 8rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .exercise-meta-row {
      display: flex;
      gap: 12rpx;
      flex-wrap: wrap;

      .muscle-tag {
        font-size: 22rpx;
        font-weight: 600;
        color: #64748b;
        background: #f8fafc;
        padding: 4rpx 14rpx;
        border-radius: 10rpx;
      }

      .equipment-tag {
        font-size: 22rpx;
        font-weight: 600;
        color: #94a3b8;
        background: #f1f5f9;
        padding: 4rpx 14rpx;
        border-radius: 10rpx;
      }
    }
  }

  .arrow-icon {
    padding: 12rpx;
    margin-left: 12rpx;
    opacity: 0.5;
    transition: opacity 0.2s;
  }

  &:hover .arrow-icon,
  &:active .arrow-icon {
    opacity: 1;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 100rpx;

  text {
    margin-top: 20rpx;
    font-size: 24rpx;
    color: #94a3b8;
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
    font-size: 48rpx;
    font-weight: 800;
    color: $text-main;
    margin-bottom: 20rpx;
  }

  .tags {
    display: flex;
    gap: 16rpx;
    margin-bottom: 60rpx;
    .tag {
      padding: 10rpx 24rpx;
      border-radius: 16rpx;
      font-size: 20rpx;
      font-weight: 700;
      text-transform: uppercase;

      &.primary {
        background-color: $primary-light;
        color: $primary-color;
      }
      &.secondary {
        background-color: #f1f5f9;
        color: $text-muted;
      }
    }
  }
}

.modal-scroll {
  max-height: 600rpx;
  margin-bottom: 60rpx;
}

.section {
  margin-bottom: 40rpx;
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;

    .copy-btn {
      display: flex;
      align-items: center;
      gap: 6rpx;
      padding: 8rpx 20rpx;
      background-color: #f0f9ff;
      border-radius: 16rpx;
      border: 1px solid #bae6fd;

      text {
        font-size: 20rpx;
        color: #0ea5e9;
        font-weight: 700;
      }

      &:active {
        background-color: #e0f2fe;
        transform: scale(0.96);
      }
    }
  }
  .section-title {
    display: block;
    font-size: 22rpx;
    font-weight: 800;
    color: $text-light;
    text-transform: uppercase;
    letter-spacing: 4rpx;
    margin-bottom: 20rpx;

    &.warning {
      color: $warning-color;
    }
  }
  .section-text {
    font-size: 28rpx;
    color: $text-muted;
    line-height: 1.6;
    font-weight: 500;

    &.selectable {
      user-select: text;
      -webkit-user-select: text;
    }
  }

  .warning-box {
    background-color: #fffbeb;
    border: 2rpx solid #fef3c7;
    padding: 30rpx;
    border-radius: 32rpx;
    .warning-text {
      font-size: 24rpx;
      color: #b45309;
      line-height: 1.6;
      font-weight: 600;

      &.selectable {
        user-select: text;
        -webkit-user-select: text;
      }
    }
  }
}

.btn-confirm {
  width: 100%;
  height: 110rpx;
  background-color: $primary-color;
  color: #fff;
  border-radius: 36rpx;
  font-size: 32rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20rpx 40rpx rgba(14, 165, 233, 0.2);
  border: none;
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
</style>
