<template>
  <view class="container">
    <view class="header">
      <view class="nav-left" @click="goBack">
        <uni-icons type="left" size="24" color="#F97316"></uni-icons>
      </view>
      <text class="title">历史运动记录</text>
      <view class="nav-placeholder"></view>
    </view>

    <scroll-view scroll-y class="history-scroll" @scrolltolower="loadMore">
      <view class="section-header">
        <text class="section-label">全部记录</text>
        <text class="record-count" v-if="records.length > 0"
          >{{ records.length }} 条</text
        >
      </view>

      <view class="record-list">
        <view
          v-for="(item, index) in records"
          :key="item.id"
          class="swipe-wrapper"
          style="position: relative; border-radius: 32rpx; margin-bottom: 20rpx"
        >
          <view
            class="swipe-item"
            :style="{
              transform: `translateX(${item._offset || 0}px)`,
              position: 'relative',
              zIndex: 2,
              backgroundColor: '#ffffff',
              padding: '28rpx 24rpx',
              transition: 'transform 0.25s ease',
              borderRadius: '32rpx',
            }"
            @touchstart="onTouchStart($event, item)"
            @touchmove="onTouchMove($event, item)"
            @touchend="onTouchEnd(item)"
            @touchcancel="onTouchEnd(item)"
          >
            <view class="item-main" style="display: flex; align-items: center">
              <view
                class="workout-icon"
                style="
                  width: 80rpx;
                  height: 80rpx;
                  background-color: #f97316;
                  border-radius: 24rpx;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                  margin-right: 20rpx;
                "
              >
                <uni-icons type="star" size="22" color="#FFFFFF"></uni-icons>
              </view>
              <view class="info" style="flex: 1; min-width: 0">
                <text
                  class="workout-name"
                  style="
                    display: block;
                    font-size: 32rpx;
                    font-weight: bold;
                    color: #1e293b;
                    margin-bottom: 10rpx;
                  "
                  >{{ item.name }}</text
                >
                <view
                  class="meta-row"
                  style="
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 10rpx;
                  "
                >
                  <text
                    class="meta-tag duration"
                    style="
                      padding: 4rpx 14rpx;
                      border-radius: 10rpx;
                      font-size: 20rpx;
                      font-weight: bold;
                      background-color: #ffedd5;
                      color: #c2410c;
                    "
                    >{{ item.durationMinutes || 0 }}min</text
                  >
                  <text
                    class="meta-tag"
                    style="
                      padding: 4rpx 14rpx;
                      border-radius: 10rpx;
                      font-size: 20rpx;
                      font-weight: bold;
                      background-color: #f1f5f9;
                      color: #64748b;
                    "
                    >{{ item.exerciseCount || 0 }}动作</text
                  >
                  <text
                    class="meta-tag volume"
                    style="
                      padding: 4rpx 14rpx;
                      border-radius: 10rpx;
                      font-size: 20rpx;
                      font-weight: bold;
                      background-color: #fef3c7;
                      color: #d97706;
                    "
                    >{{ formatVolume(item.volume) }}kg</text
                  >
                  <text
                    v-if="formatDateShort(item.startTime)"
                    class="meta-tag date"
                    style="
                      padding: 4rpx 14rpx;
                      border-radius: 10rpx;
                      font-size: 20rpx;
                      font-weight: bold;
                      background-color: #fce7f3;
                      color: #be185d;
                    "
                    >📅 {{ formatDateShort(item.startTime) }}</text
                  >
                  <text
                    v-if="formatTime(item.startTime)"
                    class="meta-tag time"
                    style="
                      padding: 4rpx 14rpx;
                      border-radius: 10rpx;
                      font-size: 20rpx;
                      font-weight: bold;
                      background-color: #e0f2fe;
                      color: #0369a1;
                    "
                    >🕐 {{ formatTime(item.startTime) }}</text
                  >
                </view>
              </view>
            </view>
          </view>
          <view
            class="swipe-actions"
            style="
              position: absolute;
              right: 0;
              top: 50%;
              transform: translateY(-50%);
              display: flex;
              align-items: center;
              z-index: 1;
              pointer-events: none;
            "
          >
            <view
              class="swipe-btn edit"
              style="
                width: 100rpx;
                height: 100rpx;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: #3b82f6;
                box-shadow: 0 4rpx 12rpx rgba(59, 130, 246, 0.3);
                pointer-events: auto;
              "
              @click.stop="openEditPopup(item)"
            >
              <uni-icons type="compose" size="22" color="#fff"></uni-icons>
            </view>
            <view
              class="swipe-btn delete"
              style="
                width: 100rpx;
                height: 100rpx;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: #ef4444;
                box-shadow: 0 4rpx 12rpx rgba(239, 68, 68, 0.3);
                margin-left: 20rpx;
                pointer-events: auto;
              "
              @click.stop="handleDelete(item)"
            >
              <uni-icons type="trash" size="22" color="#fff"></uni-icons>
            </view>
          </view>
        </view>

        <view v-if="loading && records.length > 0" class="load-status">
          <text>加载中...</text>
        </view>
        <view v-if="noMore && records.length > 0" class="load-status">
          <text>没有更多记录了</text>
        </view>
        <view v-if="records.length === 0 && !loading" class="empty-state">
          <text>暂无历史记录 📋</text>
        </view>
      </view>
    </scroll-view>

    <!-- 编辑弹窗 -->
    <view
      class="popup-mask"
      v-if="showEditPopup"
      @click="closeEditPopup"
    ></view>
    <view class="popup-bottom" :class="{ show: showEditPopup }">
      <view class="popup-header">
        <text class="popup-title">更新运动记录</text>
        <view class="popup-close" @click="closeEditPopup">
          <uni-icons type="closeempty" size="20" color="#94A3B8"></uni-icons>
        </view>
      </view>

      <scroll-view
        scroll-y
        class="popup-content"
        style="flex: 1; height: 0; overflow: hidden"
      >
        <view
          class="popup-form"
          style="padding: 24rpx 32rpx; min-height: 0; overflow: hidden"
        >
          <view
            class="form-section"
            style="
              background: #fafbfc;
              border-radius: 24rpx;
              padding: 28rpx;
              margin-bottom: 20rpx;
              overflow: hidden;
            "
          >
            <view class="section-title">
              <view
                class="section-icon"
                style="background: linear-gradient(135deg, #f97316, #ea580c)"
              >
                <uni-icons type="star" size="14" color="#fff"></uni-icons>
              </view>
              <text>运动详情</text>
            </view>

            <view class="form-group">
              <text class="popup-label">运动类型</text>
              <picker
                mode="selector"
                :range="workoutTypes"
                range-key="dictLabel"
                :value="editForm.typeIndex"
                @change="onEditTypeChange"
              >
                <view class="popup-picker">
                  <view class="picker-text">
                    <uni-icons
                      type="flag"
                      size="16"
                      color="#F97316"
                    ></uni-icons>
                    <text class="picker-value">{{
                      workoutTypes[editForm.typeIndex]?.dictLabel ||
                      "选择运动类型"
                    }}</text>
                    <uni-icons
                      type="right"
                      size="14"
                      color="#CBD5E1"
                    ></uni-icons>
                  </view>
                </view>
              </picker>
              <input
                v-if="editForm.isCustomType"
                type="text"
                v-model="editForm.name"
                placeholder="输入自定义名称"
                class="popup-input"
                style="width: 100%; box-sizing: border-box"
                placeholder-style="color: #CBD5E1; font-weight: 400; font-size: 26rpx;"
              />
            </view>

            <view class="form-row">
              <view class="form-group third">
                <text class="popup-label">时长</text>
                <view class="input-with-unit">
                  <input
                    type="number"
                    v-model="editForm.durationMinutes"
                    placeholder=""
                    class="popup-input workout-input"
                  />
                  <view class="unit-suffix unit-time">
                    <text class="unit-text">min</text>
                  </view>
                </view>
              </view>
              <view class="form-group third">
                <text class="popup-label">动作数</text>
                <view class="input-with-unit">
                  <input
                    type="number"
                    v-model="editForm.exerciseCount"
                    placeholder=""
                    class="popup-input workout-input"
                  />
                  <view class="unit-suffix unit-count">
                    <text class="unit-text">个</text>
                  </view>
                </view>
              </view>
              <view class="form-group third">
                <text class="popup-label">容量</text>
                <view class="input-with-unit">
                  <input
                    type="digit"
                    v-model="editForm.volume"
                    placeholder=""
                    class="popup-input workout-input"
                  />
                  <view class="unit-suffix unit-weight">
                    <text class="unit-text">kg</text>
                  </view>
                </view>
              </view>
            </view>

            <view class="form-row">
              <view class="form-group half">
                <text class="popup-label">日期</text>
                <picker
                  mode="date"
                  :value="editForm.workoutDate"
                  @change="onEditDateChange"
                >
                  <view class="popup-picker compact">
                    <view class="picker-text">
                      <uni-icons
                        type="calendar"
                        size="16"
                        color="#94A3B8"
                      ></uni-icons>
                      <text class="picker-value">{{
                        editForm.workoutDate
                      }}</text>
                    </view>
                  </view>
                </picker>
              </view>
              <view class="form-group half">
                <text class="popup-label">时间 (选填)</text>
                <picker
                  mode="time"
                  :value="editForm.workoutTime"
                  @change="onEditTimeChange"
                >
                  <view
                    class="popup-picker compact has-clear"
                    :class="{ 'time-placeholder': !editForm.workoutTime }"
                  >
                    <view
                      class="picker-text"
                      :class="{ 'placeholder-text': !editForm.workoutTime }"
                    >
                      <uni-icons
                        type="clock"
                        size="16"
                        :color="editForm.workoutTime ? '#94A3B8' : '#CBD5E1'"
                      ></uni-icons>
                      <text class="picker-value">{{
                        editForm.workoutTime || "请选择开始时间"
                      }}</text>
                      <view
                        v-if="editForm.workoutTime"
                        class="clear-btn"
                        @click.stop="clearEditTime"
                      >
                        <uni-icons
                          type="closeempty"
                          size="14"
                          color="#CBD5E1"
                        ></uni-icons>
                      </view>
                    </view>
                  </view>
                </picker>
              </view>
            </view>

            <view class="form-group" style="width: 100%">
              <text class="popup-label">备注 (选填)</text>
              <input
                type="text"
                v-model="editForm.remark"
                placeholder="添加备注（选填）"
                class="popup-input remark-input"
                style="width: 100%; box-sizing: border-box; font-weight: 400"
                placeholder-style="font-weight: 400; color: #CBD5E1; font-size: 26rpx;"
              />
            </view>
          </view>
        </view>
      </scroll-view>

      <view class="popup-footer">
        <button class="popup-cancel" @click="closeEditPopup">取消</button>
        <button class="popup-submit" @click="handleUpdateRecord">更新</button>
      </view>
    </view>
  </view>
</template>

<script>
import {
  getWorkoutsPage,
  getDictData,
  updateWorkout,
  deleteWorkout,
} from "@/api/index";

export default {
  data() {
    return {
      records: [],
      current: 1,
      size: 10,
      loading: false,
      noMore: false,
      touchStartX: 0,
      touchStartY: 0,
      swipeThreshold: 80,
      maxSwipeOffset: 160,
      showEditPopup: false,
      editingItem: null,
      workoutTypes: [],
      editForm: {
        id: null,
        type: "",
        durationMinutes: "",
        exerciseCount: "",
        volume: "",
        workoutDate: "",
        workoutTime: "",
        remark: "",
        typeIndex: -1,
        isCustomType: false,
      },
    };
  },

  onLoad() {
    this.loadWorkoutTypes();
    this.fetchRecords(true);
  },

  methods: {
    async loadWorkoutTypes() {
      try {
        const data = await getDictData("fitness_type");
        const list = Array.isArray(data) ? data : [];
        this.workoutTypes = [
          ...list,
          { dictLabel: "其他 (手动输入)", dictValue: "__custom__" },
        ];
      } catch (e) {
        console.error("Failed to load workout types", e);
        this.workoutTypes = [
          { dictLabel: "跑步", dictValue: "running" },
          { dictLabel: "力量训练", dictValue: "strength" },
          { dictLabel: "瑜伽", dictValue: "yoga" },
          { dictLabel: "其他 (手动输入)", dictValue: "__custom__" },
        ];
      }
    },
    async fetchRecords(reset = false) {
      if (reset) {
        this.current = 1;
        this.records = [];
        this.noMore = false;
      }
      this.loading = true;
      try {
        const res = await getWorkoutsPage(this.current, this.size);
        if (res && Array.isArray(res.records)) {
          const newRecords = res.records.map((item) => ({
            ...item,
            _offset: 0,
          }));
          this.records = [...this.records, ...newRecords];
          if (res.records.length < this.size) {
            this.noMore = true;
          } else {
            this.current++;
          }
        } else {
          this.noMore = true;
        }
      } catch (e) {
        console.error("Failed to fetch records", e);
      } finally {
        this.loading = false;
      }
    },

    loadMore() {
      if (!this.noMore && !this.loading) {
        this.fetchRecords();
      }
    },

    goBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        uni.navigateBack();
      } else {
        uni.switchTab({ url: "/pages/index/index" });
      }
    },

    onTouchStart(e, item) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.closeOtherSwipes(item);
    },

    onTouchMove(e, item) {
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = this.touchStartX - currentX;
      const diffY = Math.abs(this.touchStartY - currentY);

      if (diffY > Math.abs(diffX)) return;

      let offset = -diffX;
      if (offset > 0) offset = 0;
      if (offset < -this.maxSwipeOffset) offset = -this.maxSwipeOffset;

      this.$set(item, "_offset", offset);
    },

    onTouchEnd(item) {
      const offset = item._offset || 0;
      if (Math.abs(offset) > this.swipeThreshold) {
        this.$set(item, "_offset", -this.maxSwipeOffset);
      } else {
        this.$set(item, "_offset", 0);
      }
    },

    closeOtherSwipes(currentItem) {
      this.records.forEach((item) => {
        if (item.id !== currentItem.id && item._offset !== 0) {
          this.$set(item, "_offset", 0);
        }
      });
    },

    closeAllSwipes() {
      this.records.forEach((item) => {
        if (item._offset !== 0) {
          this.$set(item, "_offset", 0);
        }
      });
    },

    formatDateShort(dateStr) {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    },

    formatTime(timeStr) {
      if (!timeStr) return "";
      const time = timeStr.substring(11, 16);
      return time === "00:00" ? "" : time;
    },

    formatVolume(vol) {
      if (!vol) return "0";
      if (vol >= 1000) return (vol / 1000).toFixed(1) + "k";
      return String(vol);
    },

    formatDate(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    },

    openEditPopup(item) {
      this.closeAllSwipes();
      this.editingItem = item;
      this.editForm = {
        id: item.id,
        name: item.name,
        durationMinutes: String(item.durationMinutes || ""),
        exerciseCount: String(item.exerciseCount || ""),
        volume: String(item.volume || ""),
        workoutDate: item.startTime
          ? item.startTime.substring(0, 10)
          : this.formatDate(new Date()),
        workoutTime: item.startTime ? item.startTime.substring(11, 16) : "",
        remark: item.remark || "",
        typeIndex: -1,
        isCustomType: false,
      };
      const idx = this.workoutTypes.findIndex((t) => t.dictLabel === item.name);
      this.editForm.typeIndex = idx >= 0 ? idx : this.workoutTypes.length - 1;
      this.editForm.isCustomType = idx < 0;
      this.showEditPopup = true;
    },

    closeEditPopup() {
      this.showEditPopup = false;
      setTimeout(() => {
        this.editingItem = null;
      }, 300);
    },

    onEditTypeChange(e) {
      this.editForm.typeIndex = parseInt(e.detail.value);
      const selected = this.workoutTypes[this.editForm.typeIndex];
      if (selected) {
        if (selected.dictValue === "__custom__") {
          this.editForm.isCustomType = true;
          this.editForm.name = "";
        } else {
          this.editForm.isCustomType = false;
          this.editForm.name = selected.dictLabel;
        }
      }
    },

    onEditDateChange(e) {
      this.editForm.workoutDate = e.detail.value;
    },

    onEditTimeChange(e) {
      this.editForm.workoutTime = e.detail.value;
    },

    clearEditTime() {
      this.editForm.workoutTime = "";
    },

    async handleUpdateRecord() {
      if (!this.editingItem) return;
      if (!this.editForm.name.trim()) {
        uni.showToast({ title: "请选择或输入运动类型", icon: "none" });
        return;
      }
      if (
        !this.editForm.durationMinutes ||
        parseInt(this.editForm.durationMinutes) <= 0
      ) {
        uni.showToast({ title: "请输入运动时长", icon: "none" });
        return;
      }

      const payload = {
        name: this.editForm.name.trim(),
        durationMinutes: parseInt(this.editForm.durationMinutes) || 0,
        exerciseCount: parseInt(this.editForm.exerciseCount) || 0,
        volume: parseFloat(this.editForm.volume) || 0,
        startTime: this.editForm.workoutTime
          ? `${this.editForm.workoutDate} ${this.editForm.workoutTime}:00`
          : null,
        remark: this.editForm.remark || null,
      };

      try {
        await updateWorkout(this.editingItem.id, payload);
        uni.showToast({ title: "更新成功", icon: "success" });
        this.closeEditPopup();
        this.fetchRecords(true);
      } catch (e) {
        console.error("Failed to update", e);
      }
    },

    handleDelete(item) {
      uni.showModal({
        title: "确认删除",
        content: `确定删除「${item.name}」的记录？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              await deleteWorkout(item.id);
              uni.showToast({ title: "已删除", icon: "success" });
              this.fetchRecords(true);
            } catch (e) {
              console.error("Failed to delete", e);
            }
          }
        },
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #fff7ed;
  padding: 100rpx 30rpx 40rpx;
}

.header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 30rpx;

  .nav-left {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #ffedd5;
    border-radius: 50%;
    flex-shrink: 0;
    margin-right: 20rpx;

    &:active {
      opacity: 0.7;
      transform: scale(0.95);
    }
  }

  .title {
    font-size: 40rpx;
    font-weight: 800;
    color: #1e293b;
  }

  .nav-placeholder {
    width: 64rpx;
    margin-left: auto;
  }
}

.history-scroll {
  height: calc(100vh - 180rpx);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;

  .section-label {
    font-size: 28rpx;
    font-weight: 800;
    color: #334155;
  }

  .record-count {
    font-size: 22rpx;
    font-weight: 700;
    color: #f97316;
  }
}

.record-list {
  display: flex;
  flex-direction: column;
}

.swipe-wrapper {
  position: relative;
  border-radius: 32rpx;
  margin-bottom: 20rpx;
}

.load-status {
  text-align: center;
  padding: 32rpx 0;
  color: #94a3b8;
  font-size: 24rpx;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 120rpx 0;
  color: #cbd5e1;
  font-size: 28rpx;
  font-weight: 600;
}

.popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 998;
}

.popup-bottom {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #fff;
  border-radius: 48rpx 48rpx 0 0;
  z-index: 999;
  transform: translateY(100%);
  transition: transform 0.3s ease;
  max-height: 70vh;
  display: flex;
  flex-direction: column;

  &.show {
    transform: translateY(0);
  }
}

.popup-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 32rpx 32rpx 28rpx;
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  border-bottom: 1rpx solid #fed7aa;

  .popup-title {
    font-size: 34rpx;
    font-weight: 800;
    color: #c2410c;

    &::before {
      content: "💪";
      margin-right: 12rpx;
      font-size: 32rpx;
    }
  }

  .popup-close {
    position: absolute;
    right: 24rpx;
    top: 50%;
    transform: translateY(-50%);
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 50%;

    &:active {
      opacity: 0.7;
      transform: translateY(-50%) scale(0.95);
    }
  }
}

.popup-content {
  flex: 1;
  height: 0;
  overflow: hidden;
}

.popup-form {
  padding: 24rpx 32rpx;
  min-height: 0;
  overflow: hidden;

  .form-section {
    background: #fafbfc;
    border-radius: 24rpx;
    padding: 28rpx;
    margin-bottom: 20rpx;
    overflow: hidden;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 24rpx;
    padding-bottom: 16rpx;
    border-bottom: 1rpx solid #e2e8f0;
    font-size: 28rpx;
    font-weight: 700;
    color: #334155;

    .section-icon {
      width: 44rpx;
      height: 44rpx;
      border-radius: 12rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .form-group {
    margin-bottom: 20rpx;

    &:last-child {
      margin-bottom: 0;
    }

    &.half {
      flex: 1;
    }

    &.third {
      flex: 1;
    }
  }

  .form-row {
    display: flex;
    gap: 16rpx;
  }

  .popup-label {
    display: block;
    font-size: 22rpx;
    font-weight: 700;
    color: #64748b;
    margin-bottom: 12rpx;
  }

  .popup-input {
    width: 100%;
    height: 84rpx;
    background-color: #fff;
    border-radius: 16rpx;
    padding: 0 24rpx;
    font-size: 28rpx;
    border: 2rpx solid #e8ecf0;
    font-weight: 600;
    color: #1e293b;
    box-sizing: border-box;
  }

  .popup-picker {
    width: 100%;
    height: 84rpx;
    background-color: #fff;
    border-radius: 16rpx;
    padding: 0 24rpx;
    font-size: 28rpx;
    border: 2rpx solid #e8ecf0;
    font-weight: 600;
    color: #1e293b;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;

    &.compact {
      padding: 0 18rpx;
      height: 80rpx;
    }

    &.has-clear {
      padding-right: 8rpx;
    }

    .picker-text {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8rpx;
      width: 100%;

      .picker-value {
        font-size: 26rpx;
        font-weight: 600;
        color: #1e293b;
        white-space: nowrap;
      }

      &.placeholder-text {
        .picker-value {
          color: #cbd5e1;
          font-weight: 400;
        }
      }
    }

    .clear-btn {
      width: 40rpx;
      height: 40rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
  }

  .input-with-unit {
    display: flex;
    align-items: center;
    background-color: #fff;
    border: 2rpx solid #e8ecf0;
    border-radius: 16rpx;
    overflow: hidden;
    height: 80rpx;
    box-sizing: border-box;
    transition: border-color 0.2s;

    &:focus-within {
      border-color: #f97316;
    }

    .popup-input {
      flex: 1;
      height: 100%;
      padding: 0 16rpx;
      font-size: 32rpx;
      font-weight: 600;
      color: #1e293b;
      border: none;
      background: transparent;
      text-align: center;

      &.workout-input {
        font-weight: 700;
      }
    }

    .unit-suffix {
      padding: 0 18rpx;
      height: 80rpx;
      display: flex;
      align-items: center;
      gap: 8rpx;
      background: linear-gradient(
        135deg,
        #fff7ed 0%,
        #ffedd5 50%,
        #fffbeb 100%
      );
      border-left: 2rpx solid #fdba74;
      position: relative;
      overflow: hidden;

      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          135deg,
          transparent 0%,
          rgba(249, 115, 22, 0.08) 100%
        );
        pointer-events: none;
      }

      .unit-icon {
        font-size: 22rpx;
        line-height: 1;
        position: relative;
        z-index: 1;
      }

      .unit-text {
        font-size: 24rpx;
        font-weight: 700;
        color: #c2410c;
        letter-spacing: 1rpx;
        position: relative;
        z-index: 1;
      }
    }
  }

  .remark-input {
    font-weight: 400 !important;
  }
}

.popup-footer {
  flex-shrink: 0;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f1f5f9;

  button {
    flex: 1;
    height: 88rpx;
    border-radius: 44rpx;
    font-size: 30rpx;
    font-weight: 600;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;

    &::after {
      border: none;
    }

    &:active {
      opacity: 0.85;
      transform: scale(0.98);
    }
  }

  .popup-cancel {
    background-color: #f1f5f9;
    color: #64748b;
  }

  .popup-submit {
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    color: #fff;
    box-shadow: 0 4rpx 16rpx rgba(249, 115, 22, 0.3);
  }
}
</style>
