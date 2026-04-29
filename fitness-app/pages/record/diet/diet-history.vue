<template>
  <view class="container">
    <view class="header">
      <view class="nav-left" @click="goBack">
        <uni-icons type="left" size="24" color="#22C55E"></uni-icons>
      </view>
      <text class="title">历史饮食记录</text>
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
              <view class="diet-icon">
                <uni-icons type="shop" size="24" color="#FFFFFF"></uni-icons>
              </view>
              <view class="info">
                <text class="food-name">{{ item.foodName }}</text>
                <view class="meta-row">
                  <text class="meta-tag meal">{{
                    getMealLabel(item.mealType)
                  }}</text>
                  <text class="meta-tag amount"
                    >{{ item.amount }}{{ getUnitLabel(item.unit) }}</text
                  >
                  <text v-if="item.calories" class="meta-tag cal"
                    >{{ item.calories }}kcal</text
                  >
                  <text
                    v-if="formatDateShort(item.recordTime)"
                    class="meta-tag date"
                    >📅 {{ formatDateShort(item.recordTime) }}</text
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
          <text>暂无历史饮食记录 🍽️</text>
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
        <text class="popup-title">更新饮食记录</text>
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
                style="background: linear-gradient(135deg, #22c55e, #16a34a)"
              >
                <uni-icons type="shop" size="14" color="#fff"></uni-icons>
              </view>
              <text>饮食信息</text>
            </view>

            <view class="form-group">
              <text class="popup-label">餐次类型</text>
              <view class="meal-type-row-popup">
                <view
                  v-for="(meal, idx) in mealTypes"
                  :key="meal.value"
                  class="meal-tab-popup"
                  :class="{ active: editForm.mealType === meal.value }"
                  @click="editForm.mealType = meal.value"
                >
                  <text>{{ meal.icon }} {{ meal.label }}</text>
                </view>
              </view>
            </view>

            <view class="form-group">
              <text class="popup-label">食物名称</text>
              <input
                type="text"
                v-model="editForm.foodName"
                placeholder="例如：全麦面包、鸡胸肉"
                class="popup-input"
              />
            </view>

            <view class="form-row-popup">
              <view class="form-group half">
                <text class="popup-label">份量</text>
                <input
                  type="digit"
                  v-model="editForm.amount"
                  placeholder="1"
                  class="popup-input"
                />
              </view>
              <view class="form-group half">
                <text class="popup-label">单位</text>
                <picker
                  mode="selector"
                  :range="units"
                  :value="editUnitIndex"
                  @change="onEditUnitChange"
                >
                  <view class="popup-picker compact">
                    <view class="picker-text">
                      <text class="picker-value">{{
                        units[editUnitIndex]
                      }}</text>
                    </view>
                    <uni-icons
                      type="right"
                      size="14"
                      color="#CBD5E1"
                    ></uni-icons>
                  </view>
                </picker>
              </view>
            </view>

            <view class="nutrition-row-popup">
              <view class="nutri-item-popup">
                <text class="nutri-label-popup">热量(kcal)</text>
                <input
                  type="number"
                  v-model="editForm.calories"
                  placeholder="0"
                  class="nutri-input-popup"
                />
              </view>
              <view class="nutri-item-popup">
                <text class="nutri-label-popup">蛋白质(g)</text>
                <input
                  type="digit"
                  v-model="editForm.proteinG"
                  placeholder="0"
                  class="nutri-input-popup"
                />
              </view>
              <view class="nutri-item-popup">
                <text class="nutri-label-popup">碳水(g)</text>
                <input
                  type="digit"
                  v-model="editForm.carbsG"
                  placeholder="0"
                  class="nutri-input-popup"
                />
              </view>
              <view class="nutri-item-popup">
                <text class="nutri-label-popup">脂肪(g)</text>
                <input
                  type="digit"
                  v-model="editForm.fatG"
                  placeholder="0"
                  class="nutri-input-popup"
                />
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
        <button class="popup-submit" @click="handleUpdateRecord">更新</button>
      </view>
    </view>
  </view>
</template>

<script>
import { getDietPage, updateDietRecord, deleteDietRecord } from "@/api/health";

export default {
  data() {
    return {
      records: [],
      loading: false,
      noMore: false,
      currentPage: 1,
      pageSize: 20,
      touchStartX: 0,
      touchStartY: 0,
      swipeThreshold: 80,
      maxSwipeOffset: 160,
      activeItem: null,
      showEditPopup: false,
      editingItem: null,
      editForm: {
        id: null,
        foodName: "",
        amount: 1,
        unit: "fen",
        calories: "",
        proteinG: "",
        carbsG: "",
        fatG: "",
        mealType: "breakfast",
        remark: "",
      },
      editUnitIndex: 5,
      units: ["份", "碗", "个", "杯", "片", "克(g)", "勺"],
      unitMap: {
        fen: "份",
        wan: "碗",
        ge: "个",
        bei: "杯",
        pian: "片",
        ke: "克(g)",
        shao: "勺",
      },
      mealTypes: [
        { label: "早餐", value: "breakfast", icon: "🌅" },
        { label: "午餐", value: "lunch", icon: "☀️" },
        { label: "晚餐", value: "dinner", icon: "🌙" },
        { label: "加餐", value: "snack", icon: "🍪" },
      ],
    };
  },

  onLoad() {
    this.fetchRecords(true);
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

    async fetchRecords(reset = false) {
      if (reset) {
        this.currentPage = 1;
        this.records = [];
        this.noMore = false;
      }
      this.loading = true;
      try {
        const data = await getDietPage(this.currentPage, this.pageSize);
        const list = Array.isArray(data?.records || data?.content || data)
          ? data.records || data.content || data
          : [];
        const newList = list.map((item) => ({ ...item, _offset: 0 }));
        if (reset) {
          this.records = newList;
        } else {
          this.records = [...this.records, ...newList];
        }
        if (newList.length < this.pageSize) {
          this.noMore = true;
        }
      } catch (e) {
        console.error("Failed to fetch diet records", e);
      } finally {
        this.loading = false;
      }
    },

    loadMore() {
      if (!this.noMore && !this.loading) {
        this.currentPage++;
        this.fetchRecords(false);
      }
    },

    onTouchStart(e, item) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
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
      this.editingItem = item;
      this.editForm = {
        id: item.id,
        foodName: item.foodName || "",
        amount: String(item.amount || 1),
        unit: item.unit || "fen",
        calories: item.calories ? String(item.calories) : "",
        proteinG: item.proteinG ? String(item.proteinG) : "",
        carbsG: item.carbsG ? String(item.carbsG) : "",
        fatG: item.fatG ? String(item.fatG) : "",
        mealType: item.mealType || "breakfast",
        remark: item.remark || "",
      };
      const uKey = this.unitMap[item.unit];
      this.editUnitIndex = this.units.indexOf(uKey);
      if (this.editUnitIndex < 0) this.editUnitIndex = 0;
      this.showEditPopup = true;
      if (this.activeItem) {
        this.activeItem._offset = 0;
        this.activeItem = null;
      }
    },

    closeEditPopup() {
      this.showEditPopup = false;
      this.editingItem = null;
      this.editForm = {
        id: null,
        foodName: "",
        amount: 1,
        unit: "fen",
        calories: "",
        proteinG: "",
        carbsG: "",
        fatG: "",
        mealType: "breakfast",
        remark: "",
      };
      this.editUnitIndex = 5;
    },

    onEditUnitChange(e) {
      this.editUnitIndex = parseInt(e.detail.value);
    },

    async handleUpdateRecord() {
      if (!this.editForm.foodName.trim()) {
        uni.showToast({ title: "请输入食物名称", icon: "none" });
        return;
      }

      const payload = {
        mealType: this.editForm.mealType,
        foodName: this.editForm.foodName.trim(),
        amount: parseFloat(this.editForm.amount) || 1,
        unit:
          this.units[this.editUnitIndex] === "克(g)"
            ? "ke"
            : Object.keys(this.unitMap).find(
                (k) => this.unitMap[k] === this.units[this.editUnitIndex],
              ) || "fen",
        calories: parseInt(this.editForm.calories) || 0,
        proteinG: parseFloat(this.editForm.proteinG) || 0,
        carbsG: parseFloat(this.editForm.carbsG) || 0,
        fatG: parseFloat(this.editForm.fatG) || 0,
        remark: this.editForm.remark || null,
      };

      try {
        await updateDietRecord(this.editForm.id, payload);
        uni.showToast({ title: "更新成功", icon: "success" });
        this.closeEditPopup();
        this.fetchRecords(true);
      } catch (e) {
        console.error("Failed to update diet record", e);
      }
    },

    handleDelete(item) {
      uni.showModal({
        title: "确认删除",
        content: `确定删除「${item.foodName}」？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              await deleteDietRecord(item.id);
              uni.showToast({ title: "已删除", icon: "success" });
              if (this.activeItem) {
                this.activeItem._offset = 0;
                this.activeItem = null;
              }
              this.fetchRecords(true);
            } catch (e) {
              console.error("Failed to delete", e);
            }
          }
        },
      });
    },

    getMealLabel(type) {
      const found = this.mealTypes.find((m) => m.value === type);
      return found ? found.label : type;
    },

    getUnitLabel(unit) {
      return this.unitMap[unit] || unit || "";
    },

    formatTime(timeStr) {
      if (!timeStr) return "";
      const time = timeStr.substring(11, 16);
      return time === "00:00" ? "" : time;
    },

    formatDateShort(timeStr) {
      if (!timeStr) return "";
      return timeStr.substring(0, 10);
    },
  },
};
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background-color: #f0fdf4;
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
    background-color: #dcfce7;
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
    color: #15803d;
  }
}

.record-list {
  min-height: 300rpx;
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

  .diet-icon {
    width: 80rpx;
    height: 80rpx;
    background: linear-gradient(135deg, #22c55e, #16a34a);
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

    .food-name {
      display: block;
      font-size: 30rpx;
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

      &.amount {
        background-color: #f1f5f9;
        color: #64748b;
      }

      &.meal {
        background-color: #dcfce7;
        color: #16a34a;
      }

      &.cal {
        background-color: #fff7ed;
        color: #ea580c;
      }

      &.date {
        background-color: #fef9c3;
        color: #a16207;
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
  padding: 40rpx 0;
  color: #94a3b8;
  font-size: 24rpx;
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
  border-radius: 36rpx 36rpx 0 0;
  transform: translateY(100%);
  transition: transform 0.3s ease-out;
  z-index: 999;
  max-height: 85vh;
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
    padding: 32rpx 30rpx 28rpx;
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border-bottom: 1px solid #bbf7d0;

    .popup-title {
      font-size: 34rpx;
      font-weight: 800;
      color: #166534;
      display: flex;
      align-items: center;

      &::before {
        content: "🍽️";
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

      .popup-input {
        width: 100%;
        height: 84rpx;
        background-color: #fff;
        border-radius: 16rpx;
        padding: 0 24rpx;
        font-size: 28rpx;
        text-align: center;
        border: 2rpx solid #e8ecf0;
        box-sizing: border-box;
        font-weight: 600;
        color: #1e293b;

        &.remark-input {
          height: 80rpx;
          text-align: left;
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

        text {
          flex: 1;
          font-size: 28rpx;
          font-weight: 600;
          color: #1e293b;
        }

        &.compact {
          padding: 0 18rpx;
          height: 80rpx;
        }

        .picker-text {
          display: flex;
          align-items: center;
          gap: 8rpx;
          flex: 1;

          .picker-value {
            font-size: 28rpx;
            font-weight: 600;
            color: #1e293b;
          }
        }
      }
    }

    .meal-type-row-popup {
      display: flex;
      gap: 12rpx;

      .meal-tab-popup {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6rpx;
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
          background-color: #f0fdf4;
          border-color: #86efac;

          text {
            color: #15803d;
          }
        }

        &:active {
          opacity: 0.85;
        }
      }
    }

    .form-row-popup {
      display: flex;
      gap: 16rpx;
    }

    .nutrition-row-popup {
      display: flex;
      gap: 8rpx;

      .nutri-item-popup {
        flex: 1;
        min-width: 0;

        .nutri-label-popup {
          display: block;
          font-size: 18rpx;
          font-weight: 700;
          color: #94a3b8;
          margin-bottom: 8rpx;
          text-align: center;
          white-space: nowrap;
        }

        .nutri-input-popup {
          width: 100%;
          height: 64rpx;
          background-color: #fff;
          border-radius: 12rpx;
          padding: 0 4rpx;
          font-size: 22rpx;
          text-align: center;
          border: 1.5rpx solid #e2e8f0;
          font-weight: 600;
          color: #1e293b;
          box-sizing: border-box;
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
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: #fff;
      box-shadow: 0 4rpx 16rpx rgba(34, 197, 94, 0.3);
    }
  }
}
</style>
