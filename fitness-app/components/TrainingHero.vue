<template>
  <view class="training-hero glass-card">
    <view class="hero-left">
      <view class="badge-row">
        <view class="type-badge">{{ splitTypeLabel }}</view>
        <view :class="['diff-badge', difficulty]">{{ difficultyLabel }}</view>
      </view>

      <text class="plan-name">{{ name }}</text>
      <text class="plan-desc">{{ description }}</text>

      <view class="meta-row" v-if="daysPerWeek || targetAudience">
        <view class="meta-item" v-if="daysPerWeek">
          <uni-icons type="calendar" size="16" color="#2F6BFF"></uni-icons>
          <text>{{ daysPerWeek }}天/周</text>
        </view>
        <view class="meta-item" v-if="targetAudience">
          <uni-icons type="person" size="16" color="#8A5CFF"></uni-icons>
          <text>{{ targetAudience }}</text>
        </view>
      </view>

      <view class="tags-row" v-if="tags && tags.length > 0">
        <text v-for="(tag, index) in tags" :key="index" class="tag-pill">{{
          tag
        }}</text>
      </view>
    </view>

    <view class="hero-right">
      <view class="hero-image-container">
        <view class="fitness-person-icon">
          <uni-icons type="staff-filled" size="80" color="#4f72ff"></uni-icons>
        </view>
        <view class="image-overlay"></view>

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
</template>

<script>
import ProgressRing from "./ProgressRing.vue";

export default {
  name: "TrainingHero",
  components: {
    ProgressRing,
  },
  props: {
    name: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    splitType: {
      type: String,
      default: "",
    },
    difficulty: {
      type: String,
      default: "intermediate",
    },
    daysPerWeek: {
      type: [Number, String],
      default: null,
    },
    targetAudience: {
      type: String,
      default: "",
    },
    tags: {
      type: Array,
      default: () => [],
    },
    weeklyProgress: {
      type: Number,
      default: 0,
    },
    heroImage: {
      type: String,
      default: "",
    },
  },
  computed: {
    splitTypeLabel() {
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
      return map[this.splitType] || this.splitType || "训练计划";
    },

    difficultyLabel() {
      const map = {
        beginner: "入门",
        intermediate: "进阶",
        advanced: "进阶",
      };
      return map[this.difficulty] || this.difficulty;
    },
  },
};
</script>

<style scoped>
.training-hero {
  padding: 32rpx 28rpx;
  margin-bottom: 24rpx;
  display: flex;
  gap: 28rpx;
  align-items: stretch;
  position: relative;
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
  transition: all 0.25s ease;
}

.tag-pill:hover {
  background: linear-gradient(
    135deg,
    rgba(47, 107, 255, 0.15),
    rgba(138, 92, 255, 0.1)
  );
  transform: translateY(-2rpx);
  box-shadow: 0 4rpx 12rpx rgba(47, 107, 255, 0.15);
}

.hero-right {
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.hero-image-container {
  position: relative;
  width: 220rpx;
  height: 280rpx;
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
    0 12rpx 32rpx rgba(47, 107, 255, 0.18),
    0 6rpx 16rpx rgba(138, 92, 255, 0.12),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.4);
  transition: all 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}

.fitness-person-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  transition: transform 0.55s ease;
}

.training-hero:hover .hero-image-container {
  transform: translateY(-8rpx) scale(1.03);
  box-shadow:
    0 20rpx 48rpx rgba(47, 107, 255, 0.28),
    0 10rpx 28rpx rgba(138, 92, 255, 0.18),
    inset 0 2rpx 6rpx rgba(255, 255, 255, 0.5);
}

.training-hero:hover .fitness-person-icon {
  transform: scale(1.06);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    180deg,
    transparent 0%,
    transparent 60%,
    rgba(47, 107, 255, 0.05) 100%
  );
  pointer-events: none;
  z-index: 2;
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
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  animation: floatRing 3.5s ease-in-out infinite;
  z-index: 3;
}

.progress-ring-wrapper:hover {
  transform: scale(1.08) translateY(-4rpx);
  box-shadow:
    0 12rpx 32rpx rgba(0, 0, 0, 0.15),
    0 4rpx 12rpx rgba(47, 107, 255, 0.2),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.9);
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
</style>
