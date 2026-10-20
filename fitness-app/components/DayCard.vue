<template>
  <view
    class="day-card glass-card"
    :class="{
      expanded: isExpanded,
    }"
    @click="toggleExpand"
  >
    <view class="day-header">
      <view class="day-badge" :style="{ background: badgeGradient }">
        <text class="day-label">DAY</text>
        <text class="day-number">{{ dayNumber }}</text>
        <view v-if="progress >= 100" class="badge-check">
          <text class="check-mark">&#10003;</text>
        </view>
      </view>

      <view class="day-info">
        <text class="day-name">{{ dayName }}</text>
        <text class="day-focus">{{ focus }}</text>
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
      </view>
    </view>

    <view v-if="isExpanded && exercises.length > 0" class="exercises-content">
      <view class="exercise-list">
        <view
          v-for="(exercise, idx) in exercises"
          :key="idx"
          class="exercise-item"
          :style="{ animationDelay: idx * 0.06 + 's' }"
        >
          <view class="exercise-index" :style="{ background: indexGradient }">
            {{ idx + 1 }}
          </view>
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
        <view class="tip-icon-wrap">
          <uni-icons type="info" size="14" color="#f59e0b"></uni-icons>
        </view>
        <text class="tip-text">注意动作规范，组间充分休息</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: "DayCard",
  components: {},
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
  watch: {
    defaultExpanded(val) {
      this.isExpanded = val;
    },
  },
  computed: {
    partMap() {
      return {
        1: "/static/icons/chest.png",
        2: "/static/icons/back.png",
        3: "/static/icons/legs.png",
        4: "/static/icons/shoulders.png",
        5: "/static/icons/arms.png",
      };
    },

    bodyIcon() {
      return this.partMap[this.dayNumber] || "/static/icons/chest.png";
    },

    iconColor() {
      const colors = ["#5B8CFF", "#9B6BFF", "#FF9F4D", "#52C41A", "#4C7DFF"];
      return colors[(this.dayNumber - 1) % colors.length];
    },

    bodyIconStyle() {
      const glowColors = [
        { c1: "rgba(91, 140, 255, 0.2)", c2: "rgba(76, 125, 255, 0.1)" },
        { c1: "rgba(155, 107, 255, 0.2)", c2: "rgba(124, 92, 255, 0.1)" },
        { c1: "rgba(255, 159, 77, 0.2)", c2: "rgba(255, 127, 45, 0.1)" },
        { c1: "rgba(82, 196, 26, 0.2)", c2: "rgba(61, 161, 20, 0.1)" },
        { c1: "rgba(76, 125, 255, 0.2)", c2: "rgba(58, 109, 238, 0.1)" },
      ];
      const idx = (this.dayNumber - 1) % glowColors.length;
      const glow = glowColors[idx];
      return {
        "--icon-glow-color-1": glow.c1,
        "--icon-glow-color-2": glow.c2,
      };
    },

    colorMap() {
      return [
        {
          start: "#5B8CFF",
          end: "#4C7DFF",
        },
        {
          start: "#9B6BFF",
          end: "#7C5CFF",
        },
        {
          start: "#FF9F4D",
          end: "#FF7F2D",
        },
        {
          start: "#52C41A",
          end: "#3DA114",
        },
        {
          start: "#4C7DFF",
          end: "#3A6DEE",
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

    indexGradient() {
      return `linear-gradient(135deg, ${this.colorStart}, ${this.colorEnd})`;
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
.glass-card {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1rpx solid rgba(255, 255, 255, 0.45);
  box-shadow:
    0 8rpx 24rpx rgba(0, 0, 0, 0.04),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.4);
}

.day-card {
  padding: 26rpx 28rpx;
  margin-bottom: 18rpx;
  border-radius: 24rpx;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateZ(0);
  position: relative;
  overflow: hidden;
}

.day-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 4rpx;
  height: 100%;
  background: transparent;
  transition: background 0.3s ease;
  border-radius: 0 2rpx 2rpx 0;
}

.day-card:active {
  transform: scale(0.97) !important;
  transition: all 0.15s ease;
}

.day-card.expanded {
  box-shadow:
    0 16rpx 48rpx rgba(47, 107, 255, 0.1),
    0 6rpx 20rpx rgba(138, 92, 255, 0.08),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.4);
  border-color: rgba(47, 107, 255, 0.2);
}

.day-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.day-badge {
  width: 84rpx;
  height: 84rpx;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  box-shadow:
    0 10rpx 24rpx rgba(0, 0, 0, 0.18),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.35);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.day-card:active .day-badge {
  transform: scale(0.95);
}

.body-icon-wrap {
  flex-shrink: 0;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.9;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.body-icon-wrap::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.7),
    rgba(255, 255, 255, 0.3)
  );
  z-index: 0;
}

.body-icon-wrap::after {
  content: "";
  position: absolute;
  inset: -4rpx;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    var(--icon-glow-color-1, rgba(91, 140, 255, 0.15)),
    var(--icon-glow-color-2, rgba(76, 125, 255, 0.08))
  );
  z-index: -1;
  filter: blur(8rpx);
}

.day-card.expanded .body-icon-wrap {
  opacity: 1;
  transform: scale(1.05);
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
  font-size: 17rpx;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 700;
  letter-spacing: 2rpx;
  line-height: 1;
}

.day-number {
  font-size: 34rpx;
  color: white;
  font-weight: 800;
  line-height: 1.2;
  margin-top: 2rpx;
}

.badge-check {
  position: absolute;
  top: -2rpx;
  right: -2rpx;
  width: 24rpx;
  height: 24rpx;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.15);
}

.check-mark {
  font-size: 14rpx;
  color: #10b981;
  font-weight: 800;
}

.day-info {
  flex: 1;
  min-width: 0;
}

.day-name {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #1a1d29;
  margin-bottom: 6rpx;
  line-height: 1.3;
}

.day-focus {
  display: block;
  font-size: 24rpx;
  color: #9aa3af;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.day-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10rpx;
  flex-shrink: 0;
}

.exercise-meta {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.exercise-count {
  font-size: 24rpx;
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
  gap: 12rpx;
}

.exercise-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 14rpx 18rpx;
  background: linear-gradient(to right, rgba(47, 107, 255, 0.04), transparent);
  border-radius: 14rpx;
  border-left: 4rpx solid rgba(47, 107, 255, 0.2);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  transform: translateX(-16rpx);
  animation: slideInExercise 0.35s ease-out both;
}

.exercise-index {
  width: 38rpx;
  height: 38rpx;
  border-radius: 50%;
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
  background: linear-gradient(
    135deg,
    rgba(255, 251, 235, 0.8),
    rgba(254, 243, 199, 0.6)
  );
  border-radius: 14rpx;
  border-left: 4rpx solid #f59e0b;
}

.tip-icon-wrap {
  width: 28rpx;
  height: 28rpx;
  border-radius: 6rpx;
  background: rgba(245, 158, 11, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tip-text {
  flex: 1;
  font-size: 23rpx;
  color: #92400e;
  line-height: 1.5;
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
