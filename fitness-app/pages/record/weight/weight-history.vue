<template>
  <view class="container">
    <view class="header">
      <view class="nav-left" @click="goBack">
        <uni-icons type="left" size="24" color="#0EA5E9"></uni-icons>
      </view>
      <text class="title">历史体重记录</text>
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
        >
          <view
            class="swipe-item"
            :style="{ transform: `translateX(${item._offset || 0}px)` }"
            @touchstart="onTouchStart($event, item)"
            @touchmove="onTouchMove($event, item)"
            @touchend="onTouchEnd(item)"
            @touchcancel="onTouchEnd(item)"
          >
            <view class="item-main">
              <view class="weight-icon">
                <uni-icons type="loop" size="22" color="#FFFFFF"></uni-icons>
              </view>
              <view class="info">
                <text class="weight-name">{{ item.weight }} kg</text>
                <view class="meta-row">
                  <text class="meta-tag period" :class="item.timePeriod">{{
                    item.timePeriod === "morning" ? "晨重" : "晚重"
                  }}</text>
                  <text
                    v-if="formatDateShort(item.recordDate)"
                    class="meta-tag date"
                    >📅 {{ formatDateShort(item.recordDate) }}</text
                  >
                  <text v-if="formatTime(item.recordTime)" class="meta-tag time"
                    >🕐 {{ formatTime(item.recordTime) }}</text
                  >
                </view>
                <text v-if="item.remark" class="remark-text">{{
                  item.remark
                }}</text>
              </view>
            </view>
          </view>
          <view class="swipe-actions">
            <view class="swipe-btn edit" @click.stop="openEditPopup(item)">
              <uni-icons type="compose" size="22" color="#fff"></uni-icons>
            </view>
            <view class="swipe-btn delete" @click.stop="handleDelete(item)">
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

    <view
      class="popup-mask"
      v-if="showEditPopup"
      @click="closeEditPopup"
    ></view>
    <view class="popup-bottom" :class="{ show: showEditPopup }">
      <view class="popup-header">
        <text class="popup-title">更新体重记录</text>
        <view class="popup-close" @click="closeEditPopup">
          <uni-icons type="closeempty" size="20" color="#94A3B8"></uni-icons>
        </view>
      </view>

      <scroll-view scroll-y class="popup-content">
        <view class="popup-form">
          <view class="form-section">
            <view class="section-title">
              <view
                class="section-icon"
                style="background: linear-gradient(135deg, #0ea5e9, #0284c7)"
              >
                <uni-icons type="loop" size="14" color="#fff"></uni-icons>
              </view>
              <text>体重数据</text>
            </view>

            <view class="form-group">
              <text class="popup-label">体重 (kg)</text>
              <view class="input-with-unit">
                <input
                  type="digit"
                  v-model="editForm.weight"
                  placeholder="00.0"
                  class="popup-input weight-input"
                />
                <view class="unit-suffix">
                  <text class="unit-icon">⚖️</text>
                  <text class="unit-text">kg</text>
                </view>
              </view>
            </view>

            <view class="form-group">
              <text class="popup-label">时段</text>
              <view class="period-picker-row">
                <view
                  class="period-option"
                  :class="{ active: editForm.timePeriod === 'morning' }"
                  @click="editForm.timePeriod = 'morning'"
                >
                  <text>☀️ 晨重</text>
                </view>
                <view
                  class="period-option"
                  :class="{ active: editForm.timePeriod === 'evening' }"
                  @click="editForm.timePeriod = 'evening'"
                >
                  <text>🌙 晚重</text>
                </view>
              </view>
            </view>

            <view class="form-row-popup">
              <view class="form-group half">
                <text class="popup-label">日期</text>
                <picker
                  mode="date"
                  :value="editForm.recordDate"
                  @change="onEditDateChange"
                >
                  <view class="popup-picker compact">
                    <view class="picker-text-centered">
                      <uni-icons
                        type="calendar"
                        size="16"
                        color="#94A3B8"
                      ></uni-icons>
                      <text class="picker-value">{{
                        editForm.recordDate
                      }}</text>
                    </view>
                  </view>
                </picker>
              </view>
              <view class="form-group half">
                <text class="popup-label">时间 (选填)</text>
                <picker
                  mode="time"
                  :value="editForm.recordTime"
                  @change="onEditTimeChange"
                >
                  <view
                    class="popup-picker compact has-clear"
                    :class="{ 'time-placeholder': !editForm.recordTime }"
                  >
                    <view
                      class="picker-text-centered"
                      :class="{ 'placeholder-text': !editForm.recordTime }"
                    >
                      <uni-icons
                        type="clock"
                        size="16"
                        :color="editForm.recordTime ? '#94A3B8' : '#CBD5E1'"
                      ></uni-icons>
                      <text class="picker-value">{{
                        editForm.recordTime || "请选择开始时间"
                      }}</text>
                      <view
                        v-if="editForm.recordTime"
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
  getWeightHistory,
  updateWeightRecord,
  deleteWeightRecord,
} from "@/api/health";

export default {
  data() {
    return {
      records: [],
      loading: false,
      noMore: false,
      touchStartX: 0,
      touchStartY: 0,
      swipeThreshold: 80,
      maxSwipeOffset: 160,
      showEditPopup: false,
      editingItem: null,
      editForm: {
        id: null,
        weight: "",
        recordDate: "",
        recordTime: "",
        remark: "",
        timePeriod: "morning",
      },
    };
  },

  onLoad() {
    this.fetchRecords(true);
  },

  methods: {
    async fetchRecords(reset = false) {
      if (reset) {
        this.records = [];
        this.noMore = false;
      }
      this.loading = true;
      try {
        const data = await getWeightHistory();
        const list = Array.isArray(data) ? data : [];
        this.records = list.reverse().map((item) => ({ ...item, _offset: 0 }));
        this.noMore = true;
      } catch (e) {
        console.error("Failed to fetch weight records", e);
      } finally {
        this.loading = false;
      }
    },

    loadMore() {},

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
      return dateStr.substring(5);
    },

    formatTime(timeStr) {
      if (!timeStr) return "";
      const time = timeStr.substring(11, 16);
      return time === "00:00" ? "" : time;
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
        weight: String(item.weight),
        recordDate: item.recordDate,
        recordTime: item.recordTime ? item.recordTime.substring(11, 16) : "",
        remark: item.remark || "",
        timePeriod: item.timePeriod || "morning",
      };
      this.showEditPopup = true;
    },

    closeEditPopup() {
      this.showEditPopup = false;
      setTimeout(() => {
        this.editingItem = null;
      }, 300);
    },

    onEditDateChange(e) {
      this.editForm.recordDate = e.detail.value;
    },

    onEditTimeChange(e) {
      this.editForm.recordTime = e.detail.value;
    },

    clearEditTime() {
      this.editForm.recordTime = "";
    },

    async handleUpdateRecord() {
      if (!this.editingItem) return;

      if (!this.editForm.weight) {
        uni.showToast({ title: "请输入体重", icon: "none" });
        return;
      }

      const payload = {
        weight: parseFloat(this.editForm.weight),
        recordDate: this.editForm.recordDate,
        timePeriod: this.editForm.timePeriod,
        recordTime: this.editForm.recordTime
          ? `${this.editForm.recordDate} ${this.editForm.recordTime}:00`
          : null,
        remark: this.editForm.remark || null,
      };

      try {
        await updateWeightRecord(this.editingItem.id, payload);
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
        content: `确定删除 ${item.recordDate} 的${
          item.timePeriod === "morning" ? "晨重" : "晚重"
        }记录？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              await deleteWeightRecord(item.id);
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
  background-color: #f0f9ff;
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
    background-color: #dbeafe;
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
    color: #0ea5e9;
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

.swipe-item {
  position: relative;
  z-index: 2;
  background-color: #ffffff;
  padding: 28rpx 24rpx;
  transition: transform 0.25s ease;
  border-radius: 32rpx;
}

.swipe-actions {
  position: absolute;
  right: 20rpx;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  z-index: 1;
  pointer-events: none;

  .swipe-btn {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;

    &.edit {
      background-color: #3b82f6;
      box-shadow: 0 4rpx 12rpx rgba(59, 130, 246, 0.3);
    }

    &.delete {
      background-color: #ef4444;
      box-shadow: 0 4rpx 12rpx rgba(239, 68, 68, 0.3);
      margin-left: 20rpx;
    }
  }
}

.item-main {
  display: flex;
  align-items: center;

  .weight-icon {
    width: 80rpx;
    height: 80rpx;
    background-color: #0ea5e9;
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-right: 20rpx;
  }

  .info {
    flex: 1;
    min-width: 0;

    .weight-name {
      display: block;
      font-size: 32rpx;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 10rpx;
    }

    .meta-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10rpx;
      margin-bottom: 8rpx;
    }

    .meta-tag {
      padding: 4rpx 14rpx;
      border-radius: 10rpx;
      font-size: 20rpx;
      font-weight: bold;

      &.period {
        &.morning {
          background-color: #fef3c7;
          color: #d97706;
        }
        &.evening {
          background-color: #dbeafe;
          color: #2563eb;
        }
      }

      &.date {
        background-color: #fce7f3;
        color: #be185d;
      }

      &.time {
        background-color: #e0f2fe;
        color: #0369a1;
      }
    }

    .remark-text {
      font-size: 22rpx;
      color: #94a3b8;
    }
  }
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
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-bottom: 1px solid #dbeafe;

  .popup-title {
    font-size: 34rpx;
    font-weight: 800;
    color: #0369a1;
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
    font-size: 26rpx;
    font-weight: 700;
    color: #334155;

    .section-icon {
      width: 40rpx;
      height: 40rpx;
      border-radius: 10rpx;
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
  }

  .form-row {
    display: flex;
    gap: 16rpx;
  }

  .form-row-popup {
    display: flex;
    gap: 16rpx;

    .form-group.half {
      flex: 1;
    }
  }

  .popup-label {
    display: block;
    font-size: 22rpx;
    font-weight: 700;
    color: #64748b;
    margin-bottom: 12rpx;
  }

  .input-with-unit {
    display: flex;
    align-items: center;
    background-color: #fff;
    border: 2rpx solid #e8ecf0;
    border-radius: 16rpx;
    overflow: hidden;
    height: 88rpx;
    box-sizing: border-box;
    transition: border-color 0.2s;

    &:focus-within {
      border-color: #0ea5e9;
    }

    input {
      flex: 1;
      height: 100%;
      padding: 0 24rpx;
      font-size: 36rpx;
      font-weight: 600;
      color: #1e293b;
      border: none;
      background: transparent;
      text-align: center;

      &.weight-input {
        font-weight: 700;
      }
    }

    .unit-suffix {
      padding: 0 28rpx;
      height: 88rpx;
      display: flex;
      align-items: center;
      gap: 8rpx;
      background: linear-gradient(
        135deg,
        #e0f2fe 0%,
        #bae6fd 50%,
        #f0f9ff 100%
      );
      border-left: 2rpx solid #7dd3fc;
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
          rgba(14, 165, 233, 0.08) 100%
        );
        pointer-events: none;
      }

      .unit-icon {
        font-size: 28rpx;
        line-height: 1;
        position: relative;
        z-index: 1;
      }

      .unit-text {
        font-size: 30rpx;
        font-weight: 700;
        color: #0369a1;
        letter-spacing: 1rpx;
        position: relative;
        z-index: 1;
      }
    }
  }

  .period-picker-row {
    display: flex;
    gap: 16rpx;

    .period-option {
      flex: 1;
      padding: 22rpx 0;
      text-align: center;
      background-color: #fff;
      border-radius: 16rpx;
      border: 2rpx solid #e8ecf0;
      transition: all 0.2s ease;

      text {
        font-size: 26rpx;
        font-weight: 700;
        color: #64748b;
      }

      &.active {
        background-color: #eff6ff;
        border-color: #0ea5e9;

        text {
          color: #0ea5e9;
        }
      }

      &:active {
        opacity: 0.85;
      }
    }
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

    &.remark-input {
      font-weight: 400 !important;
    }
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

    .picker-text-centered {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10rpx;
      width: 100%;

      .picker-value {
        font-size: 28rpx;
        font-weight: 600;
        color: #1e293b;
      }

      &.placeholder-text .picker-value {
        color: #cbd5e1;
        font-weight: 400;
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
}

.popup-footer {
  flex-shrink: 0;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  border-top: 1px solid #f1f5f9;

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
    background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
    color: #fff;
    box-shadow: 0 4rpx 16rpx rgba(14, 165, 233, 0.3);
  }
}
</style>
