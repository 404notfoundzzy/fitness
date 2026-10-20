<template>
  <view
    class="training-card fade-up"
    :class="{ expanded: isExpanded }"
    :style="{ animationDelay: delay }"
  >
    <view class="card-main" @click="toggleExpand">
      <view class="card-left">
        <view class="icon-ring" :class="iconClass">
          <ProgressRing
            :progress="currentProgress"
            :size="88"
            :stroke-width="5"
            :colors="ringColors"
            :show-text="false"
            :transparent-center="true"
          >
            <view class="icon-badge" :class="iconClass">
              <uni-icons
                :type="item.icon || 'flag-filled'"
                size="20"
                color="#fff"
              ></uni-icons>
            </view>
          </ProgressRing>
        </view>

        <view class="card-info">
          <text class="card-title">{{ item.title }}</text>
          <text class="card-desc">{{ item.desc }}</text>
        </view>
      </view>

      <view class="card-right">
        <text class="action-count">{{ item.count }}个动作</text>
        <view :class="['status-badge', statusClass]">
          <text class="status-text">{{ statusText }}</text>
        </view>
      </view>

      <view class="expand-arrow" :class="{ rotated: isExpanded }">
        <text class="arrow-icon">›</text>
      </view>
    </view>

    <view v-if="isExpanded" class="expanded-content">
      <view class="divider-line"></view>

      <view v-if="daysLoading" class="loading-state">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载训练日...</text>
      </view>

      <view
        v-else-if="planDays && planDays.days && planDays.days.length > 0"
        class="days-list"
      >
        <view
          v-for="(day, dIdx) in planDays.days"
          :key="dIdx"
          class="day-group"
        >
          <view class="day-header" @click="toggleDay(dIdx)">
            <view
              class="day-number"
              :style="{ background: getDayColor(day.dayNumber) }"
            >
              {{ day.dayNumber }}
            </view>
            <view class="day-info">
              <text class="day-name">{{ day.dayName }}</text>
              <text class="day-focus">{{ day.focus }}</text>
            </view>
            <view class="day-meta">
              <text class="day-exercise-count"
                >{{ day.exerciseCount }}个动作</text
              >
              <view
                :class="[
                  'day-check',
                  day.isDayComplete ? 'complete' : 'incomplete',
                ]"
                >✓</view
              >
              <view class="day-toggle" :class="{ rotated: expandedDays[dIdx] }">
                <text class="toggle-icon">›</text>
              </view>
            </view>
          </view>

          <view v-if="expandedDays[dIdx]" class="day-exercises">
            <view
              v-for="(ex, eIdx) in day.exercises"
              :key="eIdx"
              class="exercise-item"
              :class="{ checked: ex.isCompleted }"
            >
              <view
                class="exercise-index"
                :style="
                  ex.isCompleted
                    ? {}
                    : { background: getDayColor(day.dayNumber) }
                "
              >
                {{ ex.isCompleted ? "✓" : eIdx + 1 }}
              </view>
              <view class="exercise-detail">
                <text class="exercise-name">{{ ex.exerciseName }}</text>
                <text class="exercise-specs">
                  {{ ex.sets }}组 × {{ ex.reps }}
                  <text v-if="ex.restSeconds">
                    · 休息{{ ex.restSeconds }}s</text
                  >
                </text>
              </view>
              <view class="exercise-actions">
                <view
                  :class="[
                    'btn-checkin',
                    ex.isCompleted ? 'checked' : '',
                    isLoading(ex.id) ? 'loading' : '',
                  ]"
                  @click.stop="onCheckIn(ex)"
                >
                  <text v-if="!isLoading(ex.id)" class="checkin-text">{{
                    ex.isCompleted ? "✓ 已打卡" : "打卡"
                  }}</text>
                  <view v-else class="spinner"></view>
                </view>
                <view class="btn-start" @click.stop="onStartTraining(ex)">
                  <text class="start-icon">▶</text>
                  <text class="start-text">训练</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-else class="empty-state">
        <text class="empty-text">暂无训练日数据</text>
      </view>
    </view>
  </view>
</template>

<script>
import ProgressRing from "./ProgressRing.vue";
import { useTrainingStore, getPlanIconClass } from "@/stores/training.js";

const COLOR_PAIRS = {
  "icon-red": ["#ef4444", "#dc2626"],
  "icon-blue": ["#3b82f6", "#2563eb"],
  "icon-purple": ["#a78bfa", "#7c3aed"],
  "icon-green": ["#10b981", "#059669"],
  "icon-custom": ["#f59e0b", "#d97706"],
};

export default {
  name: "TrainingCard",
  components: { ProgressRing },
  props: {
    item: {
      type: Object,
      required: true,
    },
    index: {
      type: Number,
      default: 0,
    },
  },
  inject: {
    showModal: {
      default: null,
    },
  },
  data() {
    return {
      isExpanded: false,
      expandedDays: {},
      daysLoading: false,
      localCheckInLock: {},
    };
  },
  computed: {
    delay() {
      return `${0.15 + this.index * 0.06}s`;
    },
    statusText() {
      if (this.currentProgress >= 100) return "已完成";
      if (this.currentProgress > 0) return "进行中";
      return "未开始";
    },
    statusClass() {
      if (this.currentProgress >= 100) return "done";
      if (this.currentProgress > 0) return "doing";
      return "pending";
    },
    store() {
      return useTrainingStore();
    },
    planDays() {
      return this.store.getPlanDays(this.item.id);
    },
    currentProgress() {
      if (this.planDays && this.planDays.summary) {
        return this.planDays.summary.progress || 0;
      }
      return this.item.progress || 0;
    },
    iconClass() {
      const cls = this.item.iconClass || getPlanIconClass(this.item.type);
      console.log("[TrainingCard] iconClass 计算:", {
        itemIconClass: this.item.iconClass,
        itemType: this.item.type,
        result: cls,
      });
      return cls;
    },
    ringColors() {
      const colors = COLOR_PAIRS[this.iconClass] || ["#3b82f6", "#2563eb"];
      console.log("[TrainingCard] ringColors 计算:", {
        iconClass: this.iconClass,
        colorPair: colors,
        hasPair: !!COLOR_PAIRS[this.iconClass],
      });
      return colors;
    },
  },
  methods: {
    async toggleExpand() {
      this.isExpanded = !this.isExpanded;

      if (this.isExpanded && !this.planDays) {
        this.daysLoading = true;
        await this.store.fetchPlanDays(this.item.id);
        this.daysLoading = false;

        if (
          this.planDays &&
          this.planDays.days &&
          this.planDays.days.length > 0
        ) {
          this.expandedDays = { ...this.expandedDays, 0: true };
        }
      }
    },

    toggleDay(idx) {
      this.expandedDays = {
        ...this.expandedDays,
        [idx]: !this.expandedDays[idx],
      };
    },

    isLoading(exerciseId) {
      return this.store.isExerciseLoading(this.item.id, exerciseId);
    },

    isInCooldown(exerciseId) {
      const key = `${this.item.id}_${exerciseId}`;
      return !!this.store.checkInCooldown[key];
    },

    emitModal(options) {
      if (typeof this.showModal === "function") {
        this.showModal(options);
      } else {
        uni.$emit("globalModal", options);
      }
    },

    async onCheckIn(exercise) {
      const lockKey = exercise.id;

      if (this.localCheckInLock[lockKey]) return;
      if (this.isLoading(exercise.id)) return;
      if (this.isInCooldown(exercise.id)) return;

      this.localCheckInLock[lockKey] = true;

      const safetyTimer = setTimeout(() => {
        if (this.localCheckInLock[lockKey]) {
          console.warn(`[组件兜底] 打卡操作超时，强制释放本地锁: ${lockKey}`);
          this.localCheckInLock[lockKey] = false;
        }
      }, 15000);

      try {
        const result = await this.store.toggleCheckIn(
          this.item.id,
          exercise.id,
          exercise.exerciseName,
        );

        if (result === "throttled") {
          return;
        }

        if (result === "error") {
          console.log("[TrainingCard] 打卡失败，准备显示 error 弹框");
          this.emitModal({
            type: "error",
            theme: "checkin",
            title: "操作失败",
            desc: "网络异常，请稍后重试",
            autoClose: 2000,
          });
          return;
        }

        if (result === true) {
          console.log("[TrainingCard] 打卡成功，准备显示 success 弹框");
          this.emitModal({
            type: "success",
            theme: "checkin",
            title: "打卡成功",
            desc: `「${exercise.exerciseName}」已完成，训练进度已同步更新`,
            autoClose: 2500,
          });

          const day = this.findDayByExercise(exercise.id);
          if (day && day.isDayComplete) {
            setTimeout(() => {
              this.emitModal({
                type: "success",
                theme: "checkin",
                title: "训练日完成 🎉",
                desc: `${day.dayName}所有动作已完成，太棒了！`,
                autoClose: 3000,
              });
            }, 2800);
          }
        } else if (result === false) {
          console.log("[TrainingCard] 取消打卡，准备显示 info 弹框");
          this.emitModal({
            type: "info",
            theme: "checkin",
            title: "已取消打卡",
            desc: `「${exercise.exerciseName}」打卡记录已取消，进度已同步更新`,
            autoClose: 2500,
          });
        }
      } finally {
        clearTimeout(safetyTimer);
        setTimeout(() => {
          this.localCheckInLock[lockKey] = false;
        }, 300);
      }
    },

    onStartTraining(exercise) {
      this.emitModal({
        type: "warning",
        theme: "checkin",
        title: "功能开发中",
        desc: `「${exercise.exerciseName}」训练模式正在开发中，敬请期待！`,
        autoClose: 0,
      });
    },

    findDayByExercise(exerciseId) {
      if (!this.planDays || !this.planDays.days) return null;
      return this.planDays.days.find(
        (day) =>
          day.exercises && day.exercises.some((ex) => ex.id === exerciseId),
      );
    },

    getDayColor(dayNumber) {
      const colors = [
        "linear-gradient(135deg, #5B8CFF, #4C7DFF)",
        "linear-gradient(135deg, #9B6BFF, #7C5CFF)",
        "linear-gradient(135deg, #FF9F4D, #FF7F2D)",
        "linear-gradient(135deg, #52C41A, #3DA114)",
        "linear-gradient(135deg, #4C7DFF, #3A6DEE)",
        "linear-gradient(135deg, #EC4899, #DB2777)",
        "linear-gradient(135deg, #F59E0B, #D97706)",
      ];
      return colors[(dayNumber - 1) % colors.length];
    },
  },
};
</script>

<style scoped>
.training-card {
  margin-bottom: 20rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border: 1rpx solid rgba(255, 255, 255, 0.45);
  box-shadow:
    0 10rpx 30rpx rgba(0, 0, 0, 0.05),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.4);
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  opacity: 0;
  animation: fadeUp 0.55s forwards;
  overflow: hidden;
}

.training-card.expanded {
  box-shadow:
    0 16rpx 48rpx rgba(47, 107, 255, 0.1),
    0 6rpx 20rpx rgba(138, 92, 255, 0.08),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.4);
  border-color: rgba(47, 107, 255, 0.2);
}

.card-main {
  display: flex;
  align-items: center;
  padding: 26rpx 28rpx;
}

.card-main:active {
  opacity: 0.85;
}

.card-left {
  display: flex;
  align-items: center;
  gap: 18rpx;
  flex: 1;
  min-width: 0;
}

.icon-ring {
  flex-shrink: 0;
}

.icon-badge {
  width: 72rpx;
  height: 72rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  box-shadow:
    0 6rpx 16rpx rgba(0, 0, 0, 0.12),
    inset 0 1rpx 2rpx rgba(255, 255, 255, 0.25);
}

.icon-badge.icon-red {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  box-shadow:
    0 6rpx 16rpx rgba(239, 68, 68, 0.3),
    inset 0 1rpx 2rpx rgba(255, 255, 255, 0.25);
}

.icon-badge.icon-blue {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow:
    0 6rpx 16rpx rgba(59, 130, 246, 0.3),
    inset 0 1rpx 2rpx rgba(255, 255, 255, 0.25);
}

.icon-badge.icon-purple {
  background: linear-gradient(135deg, #a78bfa, #7c3aed);
  box-shadow:
    0 6rpx 16rpx rgba(167, 139, 250, 0.3),
    inset 0 1rpx 2rpx rgba(255, 255, 255, 0.25);
}

.icon-badge.icon-green {
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow:
    0 6rpx 16rpx rgba(16, 185, 129, 0.3),
    inset 0 1rpx 2rpx rgba(255, 255, 255, 0.25);
}

.icon-badge.icon-custom {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  box-shadow:
    0 6rpx 16rpx rgba(245, 158, 11, 0.3),
    inset 0 1rpx 2rpx rgba(255, 255, 255, 0.25);
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #1a1d29;
  line-height: 1.3;
}

.card-desc {
  display: block;
  font-size: 23rpx;
  color: #9aa3af;
  margin-top: 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10rpx;
  flex-shrink: 0;
  margin-right: 12rpx;
}

.action-count {
  font-size: 23rpx;
  color: #9aa3af;
  font-weight: 500;
}

.status-badge {
  padding: 5rpx 16rpx;
  border-radius: 12rpx;
}

.status-badge.done {
  background: rgba(16, 185, 129, 0.12);
}

.status-badge.doing {
  background: rgba(47, 107, 255, 0.12);
}

.status-badge.pending {
  background: rgba(156, 163, 175, 0.12);
}

.status-text {
  font-size: 21rpx;
  font-weight: 600;
}

.status-badge.done .status-text {
  color: #10b981;
}
.status-badge.doing .status-text {
  color: #2f6bff;
}
.status-badge.pending .status-text {
  color: #9aa3af;
}

.expand-arrow {
  flex-shrink: 0;
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.expand-arrow.rotated {
  transform: rotate(90deg);
}

.arrow-icon {
  font-size: 32rpx;
  color: #9aa3af;
  font-weight: 300;
}

.expanded-content {
  padding: 0 28rpx 24rpx;
  animation: slideDown 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.divider-line {
  height: 1rpx;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(47, 107, 255, 0.15),
    transparent
  );
  margin-bottom: 20rpx;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx 0;
  gap: 16rpx;
}

.loading-spinner {
  width: 32rpx;
  height: 32rpx;
  border: 3rpx solid rgba(47, 107, 255, 0.2);
  border-top-color: #2f6bff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.loading-text {
  font-size: 24rpx;
  color: #9aa3af;
}

.days-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.day-group {
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.5);
  border: 1rpx solid rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.day-header {
  display: flex;
  align-items: center;
  padding: 18rpx 20rpx;
  gap: 16rpx;
}

.day-header:active {
  opacity: 0.85;
}

.day-number {
  width: 56rpx;
  height: 56rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.12);
}

.day-info {
  flex: 1;
  min-width: 0;
}

.day-name {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #1a1d29;
  line-height: 1.3;
}

.day-focus {
  display: block;
  font-size: 21rpx;
  color: #9aa3af;
  margin-top: 2rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.day-meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-shrink: 0;
}

.day-exercise-count {
  font-size: 21rpx;
  color: #9aa3af;
  font-weight: 500;
}

.day-check {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18rpx;
  font-weight: 700;
  transition: all 0.25s ease;
}

.day-check.complete {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.day-check.incomplete {
  background: rgba(156, 163, 175, 0.1);
  color: #d1d5db;
}

.day-toggle {
  width: 28rpx;
  height: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.day-toggle.rotated {
  transform: rotate(90deg);
}

.toggle-icon {
  font-size: 24rpx;
  color: #9aa3af;
  font-weight: 300;
}

.day-exercises {
  padding: 0 20rpx 16rpx;
  animation: slideDown 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.exercise-item {
  display: flex;
  align-items: center;
  padding: 14rpx 0;
  gap: 14rpx;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.exercise-item:last-child {
  border-bottom: none;
}

.exercise-item.checked {
  opacity: 0.7;
}

.exercise-index {
  width: 40rpx;
  height: 40rpx;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.exercise-item.checked .exercise-index {
  background: rgba(16, 185, 129, 0.2) !important;
  color: #10b981;
}

.exercise-detail {
  flex: 1;
  min-width: 0;
}

.exercise-name {
  display: block;
  font-size: 24rpx;
  font-weight: 600;
  color: #1a1d29;
  line-height: 1.3;
}

.exercise-item.checked .exercise-name {
  color: #9aa3af;
}

.exercise-specs {
  display: block;
  font-size: 20rpx;
  color: #9aa3af;
  margin-top: 2rpx;
}

.exercise-actions {
  display: flex;
  align-items: center;
  gap: 10rpx;
  flex-shrink: 0;
}

.btn-checkin {
  padding: 8rpx 20rpx;
  border-radius: 16rpx;
  font-size: 22rpx;
  font-weight: 600;
  border: 2rpx solid rgba(47, 107, 255, 0.25);
  background: rgba(47, 107, 255, 0.06);
  color: #2f6bff;
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
  min-width: 88rpx;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 56rpx;
  box-sizing: border-box;
}

.btn-checkin:active {
  transform: scale(0.95);
}

.btn-checkin.checked {
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.25);
  color: #10b981;
}

.btn-checkin.loading {
  pointer-events: none;
  opacity: 0.7;
}

.checkin-text {
  font-size: 22rpx;
}

.spinner {
  width: 28rpx;
  height: 28rpx;
  border: 3rpx solid rgba(47, 107, 255, 0.2);
  border-top-color: #2f6bff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.btn-checkin.checked .spinner {
  border-color: rgba(16, 185, 129, 0.2);
  border-top-color: #10b981;
}

.btn-start {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  padding: 8rpx 18rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #2f6bff, #1e4fd9);
  box-shadow: 0 4rpx 12rpx rgba(47, 107, 255, 0.25);
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  height: 56rpx;
  box-sizing: border-box;
}

.btn-start:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 8rpx rgba(47, 107, 255, 0.2);
}

.start-icon {
  font-size: 18rpx;
  color: #fff;
}

.start-text {
  font-size: 22rpx;
  font-weight: 600;
  color: #fff;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx 0;
}

.empty-text {
  font-size: 24rpx;
  color: #9aa3af;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
