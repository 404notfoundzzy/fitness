<template>
  <view
    class="day-card glass-card"
    :class="{ expanded: isExpanded }"
    @click="toggleExpand"
  >
    <view class="day-header">
      <view class="day-badge" :style="{ background: badgeGradient }">
        <text class="day-label">DAY</text>
        <text class="day-number">{{ dayNumber }}</text>
      </view>

      <view class="day-info">
        <text class="day-name">{{ dayName }}</text>
        <text class="day-focus">{{ focus }}</text>
      </view>

      <view class="muscle-icon">
        <view
          class="muscle-body"
          :style="{ background: muscleGradient }"
        ></view>
      </view>

      <view class="day-right">
        <view class="exercise-meta" v-if="exercises.length > 0">
          <text class="exercise-count">{{ exercises.length }}个动作</text>
          <uni-icons
            :type="isExpanded ? 'up' : 'down'"
            size="14"
            color="#9AA3AF"
          ></uni-icons>
        </view>

        <ProgressRing
          :progress="progress"
          :size="40"
          :stroke-width="4"
          :colors="[colorStart, colorEnd]"
          :show-text="true"
          :text-size="11"
          :label-size="8"
          text-color="#2F6BFF"
          :animated="true"
          :duration="800"
        />
      </view>
    </view>

    <view v-if="isExpanded && exercises.length > 0" class="exercises-content">
      <view class="exercise-list">
        <view
          v-for="(exercise, idx) in exercises"
          :key="idx"
          class="exercise-item"
        >
          <view class="exercise-index">{{ idx + 1 }}</view>
          <view class="exercise-detail">
            <text class="exercise-name">{{ exercise.name }}</text>
            <text class="exercise-specs">
              {{ exercise.sets }}组 × {{ exercise.reps }}
              <template v-if="exercise.restSeconds">
                | 休息{{ exercise.restSeconds }}秒</template
              >
            </text>
          </view>
        </view>
      </view>

      <view v-if="hasTips" class="tips-section">
        <uni-icons type="info" size="14" color="#f59e0b"></uni-icons>
        <text class="tip-text">注意动作规范，组间充分休息</text>
      </view>
    </view>
  </view>
</template>

<script>
import ProgressRing from "./ProgressRing.vue";

export default {
  name: "DayCard",
  components: {
    ProgressRing,
  },
  props: {
    dayNumber: {
      type: Number,
      required: true,
    },
    dayName: {
      type: String,
      default: "",
    },
    focus: {
      type: String,
      default: "",
    },
    exercises: {
      type: Array,
      default: () => [],
    },
    progress: {
      type: Number,
      default: 0,
    },
    defaultExpanded: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isExpanded: this.defaultExpanded,
    };
  },
  computed: {
    colorMap() {
      return [
        {
          start: "#5B8CFF",
          end: "#4C7DFF",
          muscle: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
        },
        {
          start: "#9B6BFF",
          end: "#7C5CFF",
          muscle: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
        },
        {
          start: "#FF9F4D",
          end: "#FF7F2D",
          muscle: "linear-gradient(135deg, #ffedd5, #fed7aa)",
        },
        {
          start: "#52C41A",
          end: "#3DA114",
          muscle: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
        },
        {
          start: "#4C7DFF",
          end: "#3A6DEE",
          muscle: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
        },
      ];
    },

    currentColors() {
      const index = (this.dayNumber - 1) % this.colorMap.length;
      return this.colorMap[index] || this.colorMap[0];
    },

    colorStart() {
      return this.currentColors.start;
    },

    colorEnd() {
      return this.currentColors.end;
    },

    badgeGradient() {
      return `linear-gradient(135deg, ${this.colorStart}, ${this.colorEnd})`;
    },

    muscleGradient() {
      return this.currentColors.muscle;
    },

    hasTips() {
      return this.exercises.some((e) => e.notes);
    },
  },
  methods: {
    toggleExpand() {
      this.isExpanded = !this.isExpanded;
      if (typeof uni !== "undefined" && uni.vibrateShort) {
        uni.vibrateShort({ type: "light" });
      }
      this.$emit("toggle", {
        dayNumber: this.dayNumber,
        expanded: this.isExpanded,
      });
    },
  },
};
</script>

<style scoped>
.day-card {
  padding: 24rpx 28rpx;
  margin-bottom: 20rpx;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateZ(0);
}

.day-card:hover {
  transform: translateY(-4rpx) scale(1.01);
  box-shadow:
    0 16rpx 48rpx rgba(47, 107, 255, 0.15),
    0 6rpx 20rpx rgba(138, 92, 255, 0.1),
    inset 0 2rpx 6rpx rgba(255, 255, 255, 0.5);
}

.day-card:active {
  transform: scale(0.97) !important;
  transition: all 0.15s ease;
  box-shadow:
    0 6rpx 20rpx rgba(0, 0, 0, 0.08),
    inset 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.day-card.expanded {
  box-shadow:
    0 20rpx 56rpx rgba(47, 107, 255, 0.14),
    0 8rpx 28rpx rgba(138, 92, 255, 0.1),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.4);
  border-color: rgba(47, 107, 255, 0.25);
}

.day-header {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.day-badge {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  box-shadow:
    0 8rpx 20rpx rgba(0, 0, 0, 0.15),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.35);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.day-card:hover .day-badge {
  transform: scale(1.08) rotate(3deg);
  box-shadow:
    0 12rpx 28rpx rgba(0, 0, 0, 0.2),
    inset 0 2rpx 6rpx rgba(255, 255, 255, 0.45);
}

.day-card:active .day-badge {
  transform: scale(0.95) !important;
}

.day-badge::before {
  content: "";
  position: absolute;
  top: 10%;
  left: 15%;
  width: 40%;
  height: 25%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.45), transparent);
  border-radius: 50%;
}

.day-label {
  font-size: 16rpx;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
  letter-spacing: 2rpx;
  line-height: 1;
}

.day-number {
  font-size: 32rpx;
  color: white;
  font-weight: 700;
  line-height: 1.2;
  margin-top: 2rpx;
}

.day-info {
  flex: 1;
  min-width: 0;
}

.day-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #1a1d29;
  margin-bottom: 4rpx;
  line-height: 1.3;
}

.day-focus {
  display: block;
  font-size: 23rpx;
  color: #9aa3af;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.muscle-icon {
  width: 72rpx;
  height: 88rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.muscle-body {
  width: 64rpx;
  height: 80rpx;
  border-radius: 14rpx;
  opacity: 0.85;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 4rpx 12rpx rgba(0, 0, 0, 0.08),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.5);
  position: relative;
  overflow: hidden;
}

.muscle-body::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 24rpx;
  height: 32rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.day-card:hover .muscle-body {
  opacity: 1;
  transform: scale(1.06);
  box-shadow:
    0 6rpx 16rpx rgba(0, 0, 0, 0.12),
    inset 0 2rpx 6rpx rgba(255, 255, 255, 0.6);
}

.day-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
  flex-shrink: 0;
}

.exercise-meta {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.exercise-count {
  font-size: 22rpx;
  color: #9aa3af;
  font-weight: 500;
}

.exercises-content {
  margin-top: 22rpx;
  padding-top: 22rpx;
  border-top: 1rpx solid rgba(0, 0, 0, 0.05);
  animation: expandContent 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.exercise-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.exercise-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 14rpx 18rpx;
  background: linear-gradient(to right, rgba(47, 107, 255, 0.04), transparent);
  border-radius: 12rpx;
  border-left: 4rpx solid rgba(47, 107, 255, 0.2);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  transform: translateX(-16rpx);
  animation: slideInExercise 0.35s ease-out both;
}

.exercise-item:nth-child(1) {
  animation-delay: 0.05s;
}
.exercise-item:nth-child(2) {
  animation-delay: 0.12s;
}
.exercise-item:nth-child(3) {
  animation-delay: 0.19s;
}
.exercise-item:nth-child(4) {
  animation-delay: 0.26s;
}
.exercise-item:nth-child(5) {
  animation-delay: 0.33s;
}
.exercise-item:nth-child(6) {
  animation-delay: 0.4s;
}

.exercise-item:hover {
  background: linear-gradient(
    to right,
    rgba(47, 107, 255, 0.08),
    rgba(138, 92, 255, 0.04)
  );
  transform: translateX(6rpx);
  border-left-color: rgba(47, 107, 255, 0.45);
  box-shadow: 0 4rpx 14rpx rgba(47, 107, 255, 0.08);
}

.exercise-item:active {
  background: linear-gradient(
    to right,
    rgba(47, 107, 255, 0.1),
    rgba(138, 92, 255, 0.06)
  );
  transform: scale(0.98) translateX(3rpx);
}

.exercise-index {
  width: 38rpx;
  height: 38rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #2f6bff, #8a5cff);
  color: white;
  font-size: 20rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.exercise-detail {
  flex: 1;
  min-width: 0;
}

.exercise-name {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #374151;
  line-height: 1.3;
}

.exercise-specs {
  display: block;
  font-size: 22rpx;
  color: #9ca3af;
  margin-top: 2rpx;
}

.tips-section {
  display: flex;
  align-items: flex-start;
  gap: 10rpx;
  padding: 16rpx;
  margin-top: 12rpx;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  border-radius: 12rpx;
  border-left: 4rpx solid #f59e0b;
}

.tip-text {
  flex: 1;
  font-size: 23rpx;
  color: #92400e;
  line-height: 1.5;
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

@keyframes expandContent {
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-12rpx) scale(0.97);
  }
  to {
    opacity: 1;
    max-height: 600rpx;
    transform: translateY(0) scale(1);
  }
}

@keyframes slideInExercise {
  from {
    opacity: 0;
    transform: translateX(-16rpx) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}
</style>
