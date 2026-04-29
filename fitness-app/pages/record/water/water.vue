<template>
  <view class="container">
    <!-- 顶部标题 -->
    <view class="header">
      <view class="nav-left" @click="goBack">
        <uni-icons type="left" size="24" color="#38BDF8"></uni-icons>
      </view>
      <text class="title">记录饮水</text>
      <view class="header-right">
        <view class="today-total" v-if="dailyTotal > 0">
          <text class="total-label">今日</text>
          <text class="total-value">{{ dailyTotal }}</text>
          <text class="total-unit">ml</text>
        </view>
      </view>
      <view class="history-btn" @click="goToHistory">
        <image
          src="/static/history.svg"
          mode="aspectFit"
          class="history-icon"
        ></image>
      </view>
    </view>

    <!-- 快速记录卡片 -->
    <view class="quick-record-card">
      <view class="form-section">
        <view class="section-title">
          <view
            class="section-icon"
            style="background: linear-gradient(135deg, #38bdf8, #0ea5e9)"
          >
            <uni-icons type="color" size="14" color="#fff"></uni-icons>
          </view>
          <text>记录喝水</text>
        </view>

        <view class="form-group">
          <text class="popup-label">饮水量 (ml)</text>
          <view class="input-with-unit">
            <input
              type="number"
              v-model="form.amountMl"
              placeholder="0"
              class="popup-input water-input"
            />
            <view class="unit-suffix">
              <text class="unit-icon">💧</text>
              <text class="unit-text">ml</text>
            </view>
          </view>
        </view>

        <view class="form-group">
          <text class="popup-label">饮水类型</text>
          <picker
            mode="selector"
            :range="drinkTypes"
            range-key="label"
            :value="typeIndex"
            @change="onTypeChange"
          >
            <view class="popup-picker">
              <view class="picker-text">
                <uni-icons type="color" size="16" color="#38BDF8"></uni-icons>
                <text class="picker-value">{{
                  drinkTypes[typeIndex]?.label || "选择类型"
                }}</text>
              </view>
              <uni-icons type="right" size="14" color="#CBD5E1"></uni-icons>
            </view>
          </picker>
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

    <!-- 今日记录列表 -->
    <view class="list-section">
      <view class="section-header">
        <text class="section-label">今日记录</text>
        <text class="sub-total"
          >{{ todayListTotal }}ml / {{ dailyTotal }}ml</text
        >
      </view>
      <scroll-view scroll-y class="record-list">
        <view
          v-for="(item, index) in todayRecords"
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
              <view class="water-icon">
                <uni-icons type="color" size="24" color="#FFFFFF"></uni-icons>
              </view>
              <view class="info">
                <text class="amount-name">{{ item.amountMl }} ml</text>
                <view class="meta-row">
                  <text class="meta-tag type">{{
                    getTypeLabel(item.drinkType)
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
        <view v-if="todayRecords.length === 0" class="empty-state">
          <text>今天还没有喝水记录哦 💧</text>
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
        <text class="popup-title">更新饮水记录</text>
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
                style="background: linear-gradient(135deg, #38bdf8, #0ea5e9)"
              >
                <uni-icons type="color" size="14" color="#fff"></uni-icons>
              </view>
              <text>饮水数据</text>
            </view>

            <view class="form-group">
              <text class="popup-label">饮水量 (ml)</text>
              <view class="input-with-unit">
                <input
                  type="number"
                  v-model="editForm.amountMl"
                  placeholder="0"
                  class="popup-input water-input"
                />
                <view class="unit-suffix">
                  <text class="unit-icon">💧</text>
                  <text class="unit-text">ml</text>
                </view>
              </view>
            </view>

            <view class="form-group">
              <text class="popup-label">饮水类型</text>
              <picker
                mode="selector"
                :range="drinkTypes"
                range-key="label"
                :value="editTypeIndex"
                @change="onEditTypeChange"
              >
                <view class="popup-picker">
                  <view class="picker-text">
                    <uni-icons
                      type="color"
                      size="16"
                      color="#38BDF8"
                    ></uni-icons>
                    <text class="picker-value">{{
                      drinkTypes[editTypeIndex]?.label || "选择类型"
                    }}</text>
                  </view>
                  <uni-icons type="right" size="14" color="#CBD5E1"></uni-icons>
                </view>
              </picker>
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

    <!-- 一周统计 -->
    <view class="week-section">
      <text class="section-label">近7天统计</text>
      <view class="week-bars">
        <view v-for="(day, idx) in weekData" :key="idx" class="bar-col">
          <view class="bar-wrapper">
            <view
              class="bar-fill"
              :style="{ height: getBarHeight(day.value) + '%' }"
            ></view>
          </view>
          <text class="bar-label">{{ day.label }}</text>
          <text class="bar-value">{{ day.value }}ml</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import {
  getWaterListByDate,
  addWaterRecord,
  updateWaterRecord,
  deleteWaterRecord,
  getDailyWaterTotal,
  getWeeklyWaterSummary,
} from "@/api/health";

export default {
  data() {
    const today = this.formatDate(new Date());
    return {
      form: {
        amountMl: 250,
        drinkType: "water",
        remark: "",
      },
      showCustomInput: false,
      quickAmounts: [150, 200, 250, 300, 400, 500],
      drinkTypes: [
        { label: "💧 水", value: "water" },
        { label: "🍵 茶", value: "tea" },
        { label: "☕ 咖啡", value: "coffee" },
        { label: "🧃 果汁", value: "juice" },
        { label: "📦 其他", value: "other" },
      ],
      typeIndex: 0,
      dailyTotal: 0,
      todayRecords: [],
      weekData: [],
      touchStartX: 0,
      touchStartY: 0,
      touchCurrentX: 0,
      swipeThreshold: 80,
      maxSwipeOffset: 160,
      activeItem: null,
      showEditPopup: false,
      editForm: {
        id: null,
        amountMl: null,
        drinkType: "water",
        remark: "",
      },
      editTypeIndex: 0,
    };
  },

  computed: {
    todayListTotal() {
      return this.todayRecords.reduce((sum, r) => sum + (r.amountMl || 0), 0);
    },
  },

  onShow() {
    this.loadTodayData();
    this.loadWeeklyData();
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
      uni.navigateTo({ url: "/pages/record/water/water-history" });
    },
    async loadTodayData() {
      const today = this.formatDate(new Date());
      try {
        const list = await getWaterListByDate(today);
        this.todayRecords = Array.isArray(list) ? list : [];
        const total = await getDailyWaterTotal(today);
        this.dailyTotal = total || 0;
      } catch (e) {
        console.error("Failed to load water data", e);
        this.todayRecords = [];
        this.dailyTotal = 0;
      }
    },

    async loadWeeklyData() {
      try {
        const data = await getWeeklyWaterSummary();
        if (data && typeof data === "object") {
          this.weekData = Object.entries(data).map(([date, val]) => ({
            date,
            value: val || 0,
            label: date.substring(5),
          }));
        }
      } catch (e) {
        console.error("Failed to load weekly data", e);
      }
    },

    async handleSubmit() {
      if (!this.form.amountMl) {
        uni.showToast({ title: "请输入饮水量", icon: "none" });
        return;
      }

      const payload = {
        amountMl: parseInt(this.form.amountMl),
        drinkType: this.drinkTypes[this.typeIndex]?.value || "water",
        recordTime: `${this.formatDate(new Date())} ${this.formatTimeShort(
          new Date(),
        )}:00`,
        remark: this.form.remark || null,
      };

      try {
        await addWaterRecord(payload);
        uni.showToast({ title: "记录成功 💧", icon: "success" });
        this.resetForm();
        this.loadTodayData();
        this.loadWeeklyData();
      } catch (e) {
        console.error("Failed to save water record", e);
      }
    },

    onTouchStart(e, item) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.touchCurrentX = this.touchStartX;
      if (this.activeItem && this.activeItem !== item) {
        this.activeItem._offset = 0;
      }
      this.activeItem = item;
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

    openEditPopup(item) {
      this.editForm = {
        id: item.id,
        amountMl: item.amountMl,
        drinkType: item.drinkType || "water",
        remark: item.remark || "",
      };
      this.editTypeIndex = this.drinkTypes.findIndex(
        (t) => t.value === item.drinkType,
      );
      if (this.editTypeIndex < 0) this.editTypeIndex = 0;
      this.showEditPopup = true;
      if (this.activeItem) {
        this.activeItem._offset = 0;
        this.activeItem = null;
      }
    },

    closeEditPopup() {
      this.showEditPopup = false;
      this.editForm = {
        id: null,
        amountMl: null,
        drinkType: "water",
        remark: "",
      };
      this.editTypeIndex = 0;
    },

    onEditTypeChange(e) {
      this.editTypeIndex = parseInt(e.detail.value);
    },

    async handleUpdate() {
      if (!this.editForm.amountMl) {
        uni.showToast({ title: "请输入饮水量", icon: "none" });
        return;
      }

      const payload = {
        amountMl: parseInt(this.editForm.amountMl),
        drinkType: this.drinkTypes[this.editTypeIndex]?.value || "water",
        remark: this.editForm.remark || null,
      };

      try {
        await updateWaterRecord(this.editForm.id, payload);
        uni.showToast({ title: "更新成功", icon: "success" });
        this.closeEditPopup();
        this.loadTodayData();
        this.loadWeeklyData();
      } catch (e) {
        console.error("Failed to update water record", e);
      }
    },

    confirmDelete(item) {
      uni.showModal({
        title: "确认删除",
        content: `确定删除该条饮水记录？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              await deleteWaterRecord(item.id);
              uni.showToast({ title: "已删除", icon: "success" });
              if (this.activeItem) {
                this.activeItem._offset = 0;
                this.activeItem = null;
              }
              this.loadTodayData();
              this.loadWeeklyData();
            } catch (e) {
              console.error("Failed to delete", e);
            }
          }
        },
      });
    },

    resetForm() {
      this.showCustomInput = false;
      this.form = { amountMl: 250, drinkType: "water", remark: "" };
      this.typeIndex = 0;
    },

    onTypeChange(e) {
      this.typeIndex = parseInt(e.detail.value);
    },

    getTypeLabel(type) {
      const found = this.drinkTypes.find((t) => t.value === type);
      return found ? found.label.replace(/^[^\s]+\s/, "") : type;
    },

    getBarHeight(value) {
      if (!this.weekData.length) return 0;
      const maxVal = Math.max(...this.weekData.map((d) => d.value), 500);
      return Math.min(Math.round((value / maxVal) * 100), 100);
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
  margin-bottom: 30rpx;

  .nav-left {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #e0f2fe;
    border-radius: 50%;

    &:active {
      opacity: 0.7;
      transform: scale(0.95);
    }
  }

  .title {
    font-size: 44rpx;
    font-weight: 800;
    color: #1e293b;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12rpx;

    .today-total {
      flex-shrink: 0;
    }
  }

  .today-total {
    display: flex;
    align-items: baseline;
    gap: 6rpx;
    background-color: #e0f2fe;
    padding: 12rpx 24rpx;
    border-radius: 100rpx;

    .total-label {
      font-size: 22rpx;
      color: #0369a1;
      font-weight: 600;
    }
    .total-value {
      font-size: 32rpx;
      font-weight: 800;
      color: #0369a1;
    }
    .total-unit {
      font-size: 20rpx;
      color: #0369a1;
      font-weight: 600;
    }
  }

  .history-btn {
    width: 64rpx;
    height: 64rpx;
    margin-left: auto;
    background-color: #e0f2fe;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

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

    .popup-label {
      display: block;
      font-size: 22rpx;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 10rpx;
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
      border-color: #38bdf8;
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

      &.water-input {
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
          rgba(56, 189, 248, 0.08) 100%
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
    justify-content: space-between;
    padding: 0 24rpx;
    height: 84rpx;
    background-color: #fff;
    border-radius: 16rpx;
    border: 2rpx solid #e8ecf0;

    .picker-text {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12rpx;
      flex: 1;

      uni-icons {
        flex-shrink: 0;
      }

      .picker-value {
        font-size: 28rpx;
        font-weight: 600;
        color: #1e293b;
      }
    }
  }

  .submit-btn {
    width: 100%;
    height: 96rpx;
    background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%);
    color: #fff;
    font-size: 30rpx;
    font-weight: 700;
    border-radius: 44rpx;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 20rpx;
    box-shadow: 0 4rpx 16rpx rgba(56, 189, 248, 0.3);

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
  margin-bottom: 30rpx;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
  }

  .section-label {
    font-size: 22rpx;
    font-weight: 800;
    color: #94a3b8;
    letter-spacing: 3rpx;
  }

  .sub-total {
    font-size: 22rpx;
    font-weight: 700;
    color: #0369a1;
  }
}

.record-list {
  max-height: 50vh;
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

  .water-icon {
    width: 80rpx;
    height: 80rpx;
    background-color: #38bdf8;
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

    .amount-name {
      display: block;
      font-size: 32rpx;
      font-weight: bold;
      color: #0369a1;
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

      &.type {
        background-color: #e0f2fe;
        color: #0369a1;
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

.week-section {
  .section-label {
    display: block;
    font-size: 22rpx;
    font-weight: 800;
    color: #94a3b8;
    letter-spacing: 3rpx;
    margin-bottom: 20rpx;
    padding-left: 10rpx;
  }
}

.week-bars {
  background-color: #fff;
  border-radius: 28rpx;
  padding: 32rpx 20rpx;
  display: flex;
  justify-content: space-around;

  .bar-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;

    .bar-wrapper {
      width: 48rpx;
      height: 180rpx;
      background-color: #f1f5f9;
      border-radius: 12rpx;
      display: flex;
      align-items: flex-end;
      overflow: hidden;

      .bar-fill {
        width: 100%;
        background-color: #38bdf8;
        border-radius: 10rpx 10rpx 0 0;
        min-height: 8rpx;
        transition: height 0.3s ease;
      }
    }

    .bar-label {
      font-size: 18rpx;
      color: #94a3b8;
      font-weight: 700;
    }
    .bar-value {
      font-size: 18rpx;
      color: #0369a1;
      font-weight: 700;
    }
  }
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

  .popup-header {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    padding: 32rpx 32rpx 28rpx;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-bottom: 1rpx solid #bae6fd;

    .popup-title {
      font-size: 34rpx;
      font-weight: 800;
      color: #0369a1;
      text-align: center;
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

      .popup-label {
        display: block;
        font-size: 22rpx;
        font-weight: 700;
        color: #64748b;
        margin-bottom: 10rpx;
      }
    }

    .popup-label {
      display: block;
      font-size: 22rpx;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 10rpx;
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
        border-color: #38bdf8;
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

        &.water-input {
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
            rgba(56, 189, 248, 0.08) 100%
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
      justify-content: space-between;
      box-sizing: border-box;

      .picker-text {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12rpx;
        flex: 1;

        uni-icons {
          flex-shrink: 0;
        }

        .picker-value {
          font-size: 28rpx;
          font-weight: 600;
          color: #1e293b;
        }
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
      background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%);
      color: #fff;
      box-shadow: 0 4rpx 16rpx rgba(56, 189, 248, 0.3);
    }
  }

  .popup-header {
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    padding: 32rpx 30rpx 28rpx;
    background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
    border-bottom: 1px solid #7dd3fc;

    .popup-title {
      font-size: 34rpx;
      font-weight: 800;
      color: #0369a1;
      display: flex;
      align-items: center;

      &::before {
        content: "💧";
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
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);

      &:active {
        opacity: 0.7;
        transform: scale(0.95);
      }
    }
  }

  .popup-content {
    flex: 1;
    height: 0;
    overflow-y: auto;

    scroll-view {
      width: 100%;
      height: 100%;
    }
  }

  .popup-form {
    padding: 24rpx 30rpx;

    .form-section {
      background: #fafbfc;
      border-radius: 24rpx;
      padding: 28rpx;
      margin-bottom: 20rpx;
    }

    .section-title {
      display: flex;
      align-items: center;
      margin-bottom: 20rpx;
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

      .popup-label {
        display: block;
        font-size: 22rpx;
        font-weight: 700;
        color: #64748b;
        margin-bottom: 10rpx;
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
        border-color: #38bdf8;
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

        &.water-input {
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
            rgba(56, 189, 248, 0.08) 100%
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
      justify-content: space-between;
      padding: 0 24rpx;
      height: 84rpx;
      background-color: #fff;
      border-radius: 16rpx;
      border: 2rpx solid #e8ecf0;

      .picker-text {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12rpx;
        flex: 1;

        uni-icons {
          flex-shrink: 0;
        }

        .picker-value {
          font-size: 28rpx;
          font-weight: 600;
          color: #1e293b;
        }
      }
    }
  }

  .popup-footer {
    flex-shrink: 0;
    padding: 20rpx 30rpx 40rpx;
    display: flex;
    gap: 20rpx;

    button {
      flex: 1;
      height: 96rpx;
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
      background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%);
      color: #fff;
      box-shadow: 0 4rpx 16rpx rgba(56, 189, 248, 0.3);
    }
  }
}
</style>
