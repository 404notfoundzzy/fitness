<template>
  <view class="container">
    <!-- 顶部标题 -->
    <view class="header">
      <view class="nav-back" @click="goBack">
        <uni-icons type="left" size="20" color="#0EA5E9"></uni-icons>
      </view>
      <text class="title">记录体重</text>
      <view class="header-right"> </view>
      <view class="history-btn" @click="goToHistory">
        <image
          src="/static/history.svg"
          mode="aspectFit"
          class="history-icon"
        ></image>
      </view>
    </view>

    <!-- 快速记录卡片-->
    <view class="quick-record-card">
      <view class="form-section">
        <view class="section-title">
          <view
            class="section-icon"
            style="background: linear-gradient(135deg, #0ea5e9, #0284c7)"
          >
            <uni-icons type="loop" size="14" color="#fff"></uni-icons>
          </view>
          <text>记录{{ currentPeriodLabel }}</text>
        </view>

        <view class="form-group">
          <text class="popup-label">体重 (kg)</text>
          <view class="input-with-unit">
            <input
              type="digit"
              v-model="form.weight"
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
              :class="{ active: currentPeriod === 'morning' }"
              @click="switchPeriod('morning')"
            >
              <text>☀️ 晨重</text>
            </view>
            <view
              class="period-option"
              :class="{ active: currentPeriod === 'evening' }"
              @click="switchPeriod('evening')"
            >
              <text>🌙 晚重</text>
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

    <!-- 记录列表 -->
    <view class="list-section">
      <view class="section-header">
        <view class="section-header-left">
          <text class="section-label">今日记录</text>
          <picker
            mode="selector"
            :range="filterOptions"
            :value="filterIndex"
            @change="onFilterChange"
          >
            <view class="filter-btn" :class="{ active: listFilter !== '' }">
              <text>{{ filterLabel }}</text>
              <uni-icons type="bottom" size="12" color="#0EA5E9"></uni-icons>
            </view>
          </picker>
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
              <view class="weight-icon">
                <uni-icons type="loop" size="22" color="#FFFFFF"></uni-icons>
              </view>
              <view class="info">
                <text class="weight-name">{{ item.weight }} kg</text>
                <view class="meta-row">
                  <text class="meta-tag period" :class="item.timePeriod">{{
                    item.timePeriod === "morning" ? "晨重" : "晚重"
                  }}</text>
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
          <text>暂无体重记录</text>
        </view>
      </scroll-view>
    </view>

    <!-- 底部编辑弹窗 -->
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
  addWeightRecord,
  updateWeightRecord,
  deleteWeightRecord,
} from "@/api/health";

export default {
  data() {
    return {
      currentPeriod: "",
      listFilter: "",
      form: {
        weight: "",
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
        weight: "",
        recordDate: "",
        recordTime: "",
        remark: "",
        timePeriod: "morning",
      },
    };
  },

  computed: {
    currentPeriodLabel() {
      if (this.currentPeriod === "morning") return "晨重";
      if (this.currentPeriod === "evening") return "晚重";
      return "体重";
    },
    filterOptions() {
      return ["全部", "晨重", "晚重"];
    },
    filterIndex() {
      if (this.listFilter === "morning") return 1;
      if (this.listFilter === "evening") return 2;
      return 0;
    },
    filterLabel() {
      if (this.listFilter === "morning") return "晨重";
      if (this.listFilter === "evening") return "晚重";
      return "全部";
    },
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
      uni.navigateTo({ url: "/pages/record/weight/weight-history" });
    },
    switchPeriod(period) {
      this.currentPeriod = period;
      this.resetForm();
    },
    onFilterChange(e) {
      const index = e.detail.value;
      if (index === 0) this.listFilter = "";
      else if (index === 1) this.listFilter = "morning";
      else if (index === 2) this.listFilter = "evening";
      this.loadRecords();
    },

    async loadRecords() {
      try {
        const data = await getWeightHistory(this.listFilter || undefined);
        this.recordList = (Array.isArray(data) ? data.reverse() : []).map(
          (item) => ({
            ...item,
            _offset: 0,
          }),
        );
      } catch (e) {
        console.error("Failed to load weight records", e);
        this.recordList = [];
      }
    },

    async handleSubmit() {
      if (!this.form.weight) {
        uni.showToast({ title: "请输入体重", icon: "none" });
        return;
      }

      const payload = {
        weight: parseFloat(this.form.weight),
        recordDate: this.form.recordDate,
        timePeriod: this.currentPeriod || "morning",
        recordTime: this.form.recordTime
          ? `${this.form.recordDate} ${this.form.recordTime}:00`
          : null,
        remark: this.form.remark || null,
      };

      try {
        await addWeightRecord(payload);
        uni.showToast({ title: "记录成功", icon: "success" });
        this.resetForm();
        this.loadRecords();
      } catch (e) {
        console.error("Failed to save weight record", e);
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
        this.loadRecords();
      } catch (e) {
        console.error("Failed to update weight record", e);
      }
    },
    confirmDelete(item) {
      this.closeAllSwipes();
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
        weight: "",
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
    formatTimeShort(date) {
      const h = String(date.getHours()).padStart(2, "0");
      const m = String(date.getMinutes()).padStart(2, "0");
      return `${h}:${m}`;
    },
    formatTime(timeStr) {
      if (!timeStr) return "";
      const time = timeStr.substring(11, 16);
      return time === "00:00" ? "" : time;
    },
  },
};
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background-color: #f0f9ff;
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
    background-color: #dbeafe;
    border-radius: 20rpx;
    transition: all 0.2s ease;

    &:active {
      transform: scale(0.92);
      opacity: 0.8;
    }
  }

  .title {
    font-size: 42rpx;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.5rpx;
    flex-shrink: 0;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  .history-btn {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #dbeafe;
    border-radius: 50%;
    flex-shrink: 0;
    margin-left: auto;

    &:active {
      opacity: 0.7;
      transform: scale(0.95);
    }

    .history-icon {
      width: 36rpx;
      height: 36rpx;
    }
  }
}

.quick-record-card {
  background-color: #fff;
  border-radius: 36rpx;
  padding: 36rpx;
  margin-bottom: 30rpx;

  .form-section {
    background: #fafbfc;
    border-radius: 24rpx;
    padding: 28rpx;
  }

  .section-title {
    display: flex;
    align-items: center;
    margin-bottom: 24rpx;
    padding-bottom: 16rpx;
    border-bottom: 1px solid #f1f5f9;

    .section-icon {
      width: 44rpx;
      height: 44rpx;
      border-radius: 12rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 14rpx;
    }

    text {
      font-size: 28rpx;
      font-weight: 800;
      color: #334155;
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

    .popup-label {
      display: block;
      font-size: 22rpx;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 10rpx;
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

    .popup-input {
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
        font-size: 36rpx;
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

    &.time-placeholder {
      .placeholder-text {
        .picker-value {
          color: #cbd5e1;
          font-weight: 400;
          font-size: 26rpx;
        }
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
      padding: 4rpx;
      margin-left: auto;
    }
  }

  .period-picker-row {
    display: flex;
    gap: 12rpx;

    .period-option {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18rpx 12rpx;
      border-radius: 16rpx;
      background-color: #fff;
      border: 2rpx solid #e8ecf0;
      transition: all 0.2s;

      text {
        font-size: 22rpx;
        font-weight: 700;
        color: #64748b;
      }

      &.active {
        background-color: #f0f9ff;
        border-color: #7dd3fc;

        text {
          color: #0369a1;
        }
      }

      &:active {
        opacity: 0.85;
      }
    }
  }

  .submit-btn {
    width: 100%;
    height: 96rpx;
    background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
    color: #fff;
    font-size: 30rpx;
    font-weight: 700;
    border-radius: 44rpx;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 20rpx;
    box-shadow: 0 4rpx 16rpx rgba(14, 165, 233, 0.3);

    &::after {
      border: none;
    }

    &:active {
      opacity: 0.85;
      transform: scale(0.98);
    }
  }
}

.list-section {
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;
  }

  .section-header-left {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

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

  .filter-btn {
    display: flex;
    align-items: center;
    gap: 6rpx;
    padding: 10rpx 20rpx;
    background-color: #f1f5f9;
    border-radius: 20rpx;
    border: 2rpx solid transparent;
    transition: all 0.2s ease;

    text {
      font-size: 24rpx;
      font-weight: 600;
      color: #64748b;
    }

    &.active {
      background-color: #e0f2fe;
      border-color: #0ea5e9;

      text {
        color: #0369a1;
      }
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

.record-list {
  max-height: 60vh;
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

.empty-state {
  text-align: center;
  padding: 80rpx 0;
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
  transition: opacity 0.3s ease;
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
    display: flex;
    align-items: center;

    &::before {
      content: "⚖️";
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

      &.placeholder-text .picker-value {
        color: #cbd5e1;
        font-weight: 400;
        font-size: 26rpx;
      }
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
