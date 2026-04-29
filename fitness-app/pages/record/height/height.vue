<template>
  <view class="container">
    <view class="header">
      <view class="nav-back" @click="goBack">
        <uni-icons type="left" size="20" color="#A855F7"></uni-icons>
      </view>
      <text class="title">记录身高</text>
      <view class="header-right"></view>
      <view class="history-btn" @click="goToHistory">
        <image
          src="/static/history.svg"
          mode="aspectFit"
          class="history-icon"
        ></image>
      </view>
    </view>

    <view class="quick-record-card">
      <view class="form-section">
        <view class="section-title">
          <view
            class="section-icon"
            style="background: linear-gradient(135deg, #a855f7, #9333ea)"
          >
            <uni-icons type="personadd" size="14" color="#fff"></uni-icons>
          </view>
          <text>记录身高</text>
        </view>

        <view class="form-group">
          <text class="popup-label">身高 (cm)</text>
          <view class="input-with-unit">
            <input
              type="digit"
              v-model="form.height"
              placeholder="000.0"
              class="popup-input"
            />
            <view class="unit-suffix">
              <text class="unit-icon">📏</text>
              <text class="unit-text">cm</text>
            </view>
          </view>
        </view>

        <view class="form-row">
          <view class="form-group half">
            <text class="popup-label">日期</text>
            <picker mode="date" :value="form.recordDate" @change="onDateChange">
              <view class="popup-picker compact">
                <view class="picker-text">
                  <uni-icons
                    type="calendar"
                    size="16"
                    color="#94A3B8"
                  ></uni-icons>
                  <text class="picker-value">{{
                    form.recordDate || "选择日期"
                  }}</text>
                </view>
              </view>
            </picker>
          </view>
          <view class="form-group half">
            <text class="popup-label">时间 (选填)</text>
            <picker mode="time" :value="form.recordTime" @change="onTimeChange">
              <view
                class="popup-picker compact has-clear"
                :class="{ 'time-placeholder': !form.recordTime }"
              >
                <view
                  class="picker-text"
                  :class="{ 'placeholder-text': !form.recordTime }"
                >
                  <uni-icons
                    type="clock"
                    size="16"
                    :color="form.recordTime ? '#94A3B8' : '#CBD5E1'"
                  ></uni-icons>
                  <text class="picker-value">{{
                    form.recordTime || "请选择时间"
                  }}</text>
                  <view
                    v-if="form.recordTime"
                    class="clear-btn"
                    @click.stop="clearTime"
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

        <view class="form-group">
          <text class="popup-label">备注 (选填)</text>
          <input
            type="text"
            v-model="form.remark"
            placeholder="添加备注（选填）"
            class="popup-input remark-input"
            style="width: 100%; box-sizing: border-box; font-weight: 400"
            placeholder-style="font-weight: 400; color: #CBD5E1; font-size: 26rpx;"
          />
        </view>

        <button class="submit-btn" @click="handleSubmit">保存记录</button>
      </view>
    </view>

    <view class="list-section">
      <view class="section-header">
        <view class="section-header-left">
          <text class="section-label">今日记录</text>
        </view>
        <text class="record-count" v-if="recordList.length > 0"
          >{{ recordList.length }} 条</text
        >
      </view>

      <scroll-view scroll-y class="record-list">
        <view
          v-for="(item, index) in recordList"
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
              <view class="height-icon">
                <uni-icons
                  type="personadd"
                  size="22"
                  color="#FFFFFF"
                ></uni-icons>
              </view>
              <view class="info">
                <text class="height-name">{{ item.height }} cm</text>
                <view class="meta-row">
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
            <view class="swipe-btn delete" @click.stop="confirmDelete(item)">
              <uni-icons type="trash" size="22" color="#fff"></uni-icons>
            </view>
          </view>
        </view>
        <view v-if="recordList.length === 0" class="empty-state">
          <text>暂无身高记录</text>
        </view>
      </scroll-view>
    </view>

    <view
      class="popup-mask"
      v-if="showEditPopup"
      @click="closeEditPopup"
    ></view>
    <view class="popup-bottom" :class="{ show: showEditPopup }">
      <view class="popup-header">
        <text class="popup-title">更新身高记录</text>
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
                style="background: linear-gradient(135deg, #a855f7, #9333ea)"
              >
                <uni-icons type="personadd" size="14" color="#fff"></uni-icons>
              </view>
              <text>身高数据</text>
            </view>

            <view class="form-group">
              <text class="popup-label">身高 (cm)</text>
              <view class="input-with-unit">
                <input
                  type="digit"
                  v-model="editForm.height"
                  placeholder="000.0"
                  class="popup-input"
                />
                <view class="unit-suffix">
                  <text class="unit-icon">📏</text>
                  <text class="unit-text">cm</text>
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
                        editForm.recordTime || "请选择时间"
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

            <view class="form-group">
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
        <button class="popup-submit" @click="handleUpdate">更新</button>
      </view>
    </view>
  </view>
</template>

<script>
import {
  getHeightHistory,
  addHeightRecord,
  updateHeightRecord,
  deleteHeightRecord,
} from "@/api/health";

export default {
  data() {
    return {
      form: {
        height: "",
        recordDate: this.formatDate(new Date()),
        recordTime: "",
        remark: "",
      },
      recordList: [],
      touchStartX: 0,
      touchStartY: 0,
      swipeThreshold: 80,
      maxSwipeOffset: 160,
      showEditPopup: false,
      editingItem: null,
      editForm: {
        height: "",
        recordDate: "",
        recordTime: "",
        remark: "",
      },
    };
  },

  onShow() {
    this.loadRecords();
  },

  methods: {
    goBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        uni.navigateBack();
      } else {
        uni.switchTab({ url: "/pages/index/index" });
      }
    },
    goToHistory() {
      uni.navigateTo({ url: "/pages/record/height/height-history" });
    },

    async loadRecords() {
      try {
        const data = await getHeightHistory();
        this.recordList = (Array.isArray(data) ? data.reverse() : []).map(
          (item) => ({
            ...item,
            _offset: 0,
          }),
        );
      } catch (e) {
        console.error("Failed to load height records", e);
        this.recordList = [];
      }
    },

    async handleSubmit() {
      if (!this.form.height) {
        uni.showToast({ title: "请输入身高", icon: "none" });
        return;
      }

      const payload = {
        height: parseFloat(this.form.height),
        recordDate: this.form.recordDate,
        recordTime: this.form.recordTime
          ? `${this.form.recordDate} ${this.form.recordTime}:00`
          : null,
        remark: this.form.remark || null,
      };

      try {
        await addHeightRecord(payload);
        uni.showToast({ title: "记录成功", icon: "success" });
        this.resetForm();
        this.loadRecords();
      } catch (e) {
        console.error("Failed to save height record", e);
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
      this.recordList.forEach((item) => {
        if (item.id !== currentItem.id && item._offset !== 0) {
          this.$set(item, "_offset", 0);
        }
      });
    },

    openEditPopup(item) {
      this.closeAllSwipes();
      this.editingItem = item;

      this.editForm = {
        height: String(item.height),
        recordDate: item.recordDate,
        recordTime: item.recordTime ? item.recordTime.substring(11, 16) : "",
        remark: item.remark || "",
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

    async handleUpdate() {
      if (!this.editingItem) return;
      if (!this.editForm.height) {
        uni.showToast({ title: "请输入身高", icon: "none" });
        return;
      }

      const payload = {
        height: parseFloat(this.editForm.height),
        recordDate: this.editForm.recordDate,
        recordTime: this.editForm.recordTime
          ? `${this.editForm.recordDate} ${this.editForm.recordTime}:00`
          : null,
        remark: this.editForm.remark || null,
      };

      try {
        await updateHeightRecord(this.editingItem.id, payload);
        uni.showToast({ title: "更新成功", icon: "success" });
        this.closeEditPopup();
        this.loadRecords();
      } catch (e) {
        console.error("Failed to update height record", e);
      }
    },

    confirmDelete(item) {
      this.closeAllSwipes();
      uni.showModal({
        title: "确认删除",
        content: `确定删除 ${item.recordDate} 的身高记录？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              await deleteHeightRecord(item.id);
              uni.showToast({ title: "已删除", icon: "success" });
              this.loadRecords();
            } catch (e) {
              console.error("Failed to delete record", e);
            }
          }
        },
      });
    },

    closeAllSwipes() {
      this.recordList.forEach((item) => {
        if (item._offset !== 0) {
          this.$set(item, "_offset", 0);
        }
      });
    },

    resetForm() {
      this.form = {
        height: "",
        recordDate: this.formatDate(new Date()),
        recordTime: "",
        remark: "",
      };
    },

    onDateChange(e) {
      this.form.recordDate = e.detail.value;
    },

    onTimeChange(e) {
      this.form.recordTime = e.detail.value;
    },

    clearTime() {
      this.form.recordTime = "";
    },

    formatDate(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    },

    formatTime(timeStr) {
      if (!timeStr) return "";
      const time = timeStr.substring(11, 16);
      return time === "00:00" ? "" : time;
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #faf5ff;
  padding: 100rpx 30rpx 40rpx;
}

.header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 28rpx;
  padding: 0 4rpx;

  .nav-back {
    width: 68rpx;
    height: 68rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f3e8ff;
    border-radius: 20rpx;

    &:active {
      transform: scale(0.92);
      opacity: 0.8;
    }
  }

  .title {
    font-size: 40rpx;
    font-weight: 800;
    color: #1e293b;
    flex: 1;
  }

  .header-right {
    width: 68rpx;
  }

  .history-btn {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3e8ff;
    border-radius: 16rpx;

    &:active {
      transform: scale(0.92);
      opacity: 0.8;
    }

    .history-icon {
      width: 36rpx;
      height: 36rpx;
    }
  }
}

.quick-record-card {
  background: #fff;
  border-radius: 28rpx;
  padding: 32rpx;
  margin-bottom: 28rpx;
  box-shadow: 0 4rpx 20rpx rgba(168, 85, 247, 0.08);
}

.form-section {
  .section-title {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 28rpx;

    text {
      font-size: 30rpx;
      font-weight: 700;
      color: #1e293b;
    }

    .section-icon {
      width: 48rpx;
      height: 48rpx;
      border-radius: 14rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

.form-group {
  margin-bottom: 24rpx;

  &.half {
    width: 48%;
  }

  .popup-label {
    display: block;
    font-size: 26rpx;
    color: #64748b;
    margin-bottom: 10rpx;
    font-weight: 500;
  }
}

.input-with-unit {
  display: flex;
  align-items: center;
  border: 2rpx solid #e2e8f0;
  border-radius: 16rpx;
  overflow: hidden;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: #a855f7;
  }

  .popup-input {
    flex: 1;
    height: 88rpx;
    padding: 0 24rpx;
    font-size: 36rpx;
    font-weight: 600;
    color: #1e293b;
    border: none;
    background: transparent;
    text-align: center;
  }

  .unit-suffix {
    padding: 0 28rpx;
    height: 88rpx;
    display: flex;
    align-items: center;
    gap: 8rpx;
    background: linear-gradient(135deg, #f3e8ff 0%, #ede9fe 50%, #faf5ff 100%);
    border-left: 2rpx solid #e9d5ff;
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
        rgba(168, 85, 247, 0.05) 100%
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
      color: #7c3aed;
      letter-spacing: 1rpx;
      position: relative;
      z-index: 1;
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
  box-sizing: border-box;
  font-weight: 600;
  color: #1e293b;

  &.remark-input {
    height: 80rpx;
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

.popup-picker {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24rpx;
  height: 84rpx;
  background-color: #fff;
  border-radius: 16rpx;
  border: 2rpx solid #e8ecf0;

  &.compact {
    padding: 0 18rpx;
    height: 80rpx;
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

  &.time-placeholder {
    .placeholder-text .picker-value {
      color: #cbd5e1;
      font-weight: 400;
      font-size: 26rpx;
    }
  }

  .picker-text {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6rpx;

    .picker-value {
      font-size: 28rpx;
      font-weight: 600;
      color: #1e293b;
    }
  }

  .clear-btn {
    padding: 4rpx;
    margin-left: auto;
  }
}

.submit-btn {
  width: 100%;
  height: 92rpx;
  background: linear-gradient(135deg, #a855f7, #9333ea);
  color: #fff;
  font-size: 32rpx;
  font-weight: 700;
  border: none;
  border-radius: 20rpx;
  margin-top: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
}

.list-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;

    .section-header-left {
      display: flex;
      align-items: center;
      gap: 12rpx;

      .section-label {
        font-size: 30rpx;
        font-weight: 700;
        color: #1e293b;
      }
    }

    .record-count {
      font-size: 24rpx;
      color: #94a3b8;
      background: #f8fafc;
      padding: 6rpx 16rpx;
      border-radius: 20rpx;
    }
  }
}

.record-list {
  max-height: 60vh;
}

.swipe-wrapper {
  position: relative;
  overflow: hidden;
  margin-bottom: 20rpx;
  border-radius: 32rpx;
}

.swipe-item {
  background: #fff;
  border-radius: 32rpx;
  padding: 28rpx 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(168, 85, 247, 0.06);
  position: relative;
  z-index: 2;
  transition: transform 0.25s ease;
}

.item-main {
  display: flex;
  align-items: center;

  .height-icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 24rpx;
    background: linear-gradient(135deg, #a855f7, #9333ea);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-right: 20rpx;
  }

  .info {
    flex: 1;
    min-width: 0;

    .height-name {
      font-size: 32rpx;
      font-weight: bold;
      color: #1e293b;
      display: block;
      margin-bottom: 10rpx;
    }

    .meta-row {
      display: flex;
      gap: 10rpx;
      margin-bottom: 8rpx;
      flex-wrap: wrap;

      .meta-tag {
        font-size: 20rpx;
        padding: 4rpx 14rpx;
        border-radius: 10rpx;
        font-weight: bold;
        background: #f3e8ff;
        color: #7c3aed;
      }
    }

    .remark-text {
      font-size: 22rpx;
      color: #94a3b8;
      display: block;
    }
  }
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

.empty-state {
  text-align: center;
  padding: 80rpx 0;
  color: #94a3b8;
  font-size: 28rpx;
}

.popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 998;
}

.popup-bottom {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  z-index: 999;
  transform: translateY(100%);
  transition: transform 0.3s ease-out;
  max-height: 80vh;

  &.show {
    transform: translateY(0);
  }

  .popup-header {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    padding: 32rpx 32rpx 28rpx;
    background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
    border-bottom: 1rpx solid #ddd6fe;

    .popup-title {
      font-size: 34rpx;
      font-weight: 800;
      color: #7c3aed;

      &::before {
        content: "📏";
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
    max-height: 50vh;
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
      background: linear-gradient(135deg, #a855f7, #9333ea);
      color: #fff;
      box-shadow: 0 4rpx 16rpx rgba(168, 85, 247, 0.3);
    }
  }
}
</style>
