<template>
  <view class="container">
    <view class="header">
      <view class="nav-left" @click="goBack">
        <uni-icons type="left" size="24" color="#F97316"></uni-icons>
      </view>
      <text class="title">记录运动</text>
      <view class="header-right">
        <view class="today-summary" v-if="todayStats.totalDuration > 0">
          <text class="stat-value">{{ todayStats.totalDuration }}</text>
          <text class="stat-unit">min</text>
        </view>
      </view>
      <view class="history-btn" @click="goToHistory">
        <image
          src="/static/history.svg"
          class="history-icon-image"
          mode="aspectFit"
        ></image>
      </view>
    </view>

    <view class="quick-record-card">
      <view class="record-header">
        <text class="card-title">记录运动</text>
      </view>

      <view
        class="form-section-main"
        style="
          background: #fafbfc;
          border-radius: 24rpx;
          padding: 28rpx;
          margin-bottom: 20rpx;
          overflow: hidden;
        "
      >
        <view class="form-group">
          <text class="popup-label">运动类型</text>
          <picker
            mode="selector"
            :range="workoutTypes"
            range-key="dictLabel"
            :value="typeIndex"
            @change="onTypeChange"
          >
            <view class="popup-picker">
              <view class="picker-text">
                <uni-icons type="flag" size="16" color="#F97316"></uni-icons>
                <text class="picker-value">{{
                  workoutTypes[typeIndex]?.dictLabel || "选择运动类型"
                }}</text>
                <uni-icons type="right" size="14" color="#CBD5E1"></uni-icons>
              </view>
            </view>
          </picker>
          <input
            v-if="isCustomType"
            type="text"
            v-model="form.name"
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
                v-model="form.durationMinutes"
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
                v-model="form.exerciseCount"
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
                v-model="form.volume"
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
              :value="form.workoutDate"
              @change="onDateChange"
            >
              <view class="popup-picker compact">
                <view class="picker-text">
                  <uni-icons
                    type="calendar"
                    size="16"
                    color="#94A3B8"
                  ></uni-icons>
                  <text class="picker-value">{{ form.workoutDate }}</text>
                </view>
              </view>
            </picker>
          </view>
          <view class="form-group half">
            <text class="popup-label">时间 (选填)</text>
            <picker
              mode="time"
              :value="form.workoutTime"
              @change="onTimeChange"
            >
              <view
                class="popup-picker compact has-clear"
                :class="{ 'time-placeholder': !form.workoutTime }"
              >
                <view
                  class="picker-text"
                  :class="{ 'placeholder-text': !form.workoutTime }"
                >
                  <uni-icons
                    type="clock"
                    size="16"
                    :color="form.workoutTime ? '#94A3B8' : '#CBD5E1'"
                  ></uni-icons>
                  <text class="picker-value">{{
                    form.workoutTime || "请选择开始时间"
                  }}</text>
                  <view
                    v-if="form.workoutTime"
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

        <view class="form-group" style="width: 100%">
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
      </view>

      <button class="submit-btn" @click="handleSubmit">保存记录</button>
    </view>

    <view class="list-section">
      <view class="section-header">
        <text class="section-label">今日运动</text>
        <text class="record-count">{{ todayRecords.length }} 条</text>
      </view>
      <scroll-view scroll-y class="record-list">
        <view
          v-for="(item, index) in todayRecords"
          :key="item.id"
          class="swipe-wrapper"
          style="
            position: relative;
            overflow: hidden;
            border-radius: 32rpx;
            margin-bottom: 20rpx;
          "
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
              <view class="info" style="flex: 1">
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
                    margin-bottom: 8rpx;
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
              right: 20rpx;
              top: 0;
              bottom: 0;
              display: flex;
              align-items: center;
              z-index: 1;
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
              "
              @click="openEditPopup(item)"
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
              "
              @click="confirmDelete(item)"
            >
              <uni-icons type="trash" size="22" color="#fff"></uni-icons>
            </view>
          </view>
        </view>
        <view v-if="todayRecords.length === 0" class="empty-state">
          <text>今天还没有运动记录 💪</text>
        </view>
      </scroll-view>
    </view>

    <view class="week-section" v-if="weekData.length > 0">
      <text class="section-label">近7天统计</text>
      <view class="week-bars">
        <view v-for="(day, idx) in weekData" :key="idx" class="bar-col">
          <view class="bar-wrapper">
            <view
              class="bar-fill"
              :style="{ height: getBarHeight(day.duration) + '%' }"
            ></view>
          </view>
          <text class="bar-label">{{ day.label }}</text>
          <text class="bar-value">{{ day.duration }}m</text>
        </view>
      </view>
    </view>

    <!-- 底部编辑弹窗 -->
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
  getWorkoutListByDate,
  addWorkoutRecord,
  updateWorkoutRecord,
  deleteWorkoutRecord,
} from "@/api/health";
import { getDictData } from "@/api/index";

export default {
  data() {
    const now = new Date();
    return {
      form: {
        name: "",
        durationMinutes: "",
        exerciseCount: "",
        volume: "",
        workoutDate: this.formatDate(now),
        workoutTime: "",
        remark: "",
      },
      showTimePicker: false,
      workoutTypes: [],
      typeIndex: -1,
      isCustomType: false,
      todayRecords: [],
      weekData: [],
      todayStats: {
        totalDuration: 0,
        totalCount: 0,
      },
      touchStartX: 0,
      touchStartY: 0,
      swipeThreshold: 80,
      maxSwipeOffset: 160,
      showEditPopup: false,
      editingItem: null,
      editForm: {
        name: "",
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

  onShow() {
    this.loadWorkoutTypes();
    this.loadTodayData();
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
    async loadTodayData() {
      const today = this.formatDate(new Date());
      try {
        const list = await getWorkoutListByDate(today);
        this.todayRecords = (Array.isArray(list) ? list : []).map((item) => ({
          ...item,
          _offset: 0,
        }));
        let totalDur = 0;
        this.todayRecords.forEach((r) => {
          totalDur += r.durationMinutes || 0;
        });
        this.todayStats = {
          totalDuration: totalDur,
          totalCount: this.todayRecords.length,
        };
        this.buildWeekData();
      } catch (e) {
        console.error("Failed to load workout data", e);
        this.todayRecords = [];
      }
    },
    buildWeekData() {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = this.formatDate(d);
        const found = this.todayRecords.filter((r) => {
          if (r.startTime) return r.startTime.startsWith(dateStr);
          if (i === 0) return true;
          return false;
        });
        let dur = 0;
        found.forEach((r) => {
          dur += r.durationMinutes || 0;
        });
        days.push({
          date: dateStr,
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          duration: dur,
        });
      }
      this.weekData = days;
    },
    goToHistory() {
      uni.navigateTo({ url: "/pages/record/history/history" });
    },
    onTypeChange(e) {
      this.typeIndex = parseInt(e.detail.value);
      const selected = this.workoutTypes[this.typeIndex];
      if (selected) {
        if (selected.dictValue === "__custom__") {
          this.isCustomType = true;
          this.form.name = "";
        } else {
          this.isCustomType = false;
          this.form.name = selected.dictLabel;
        }
      }
    },
    async handleSubmit() {
      if (!this.form.name.trim()) {
        uni.showToast({ title: "请选择或输入运动类型", icon: "none" });
        return;
      }
      if (
        !this.form.durationMinutes ||
        parseInt(this.form.durationMinutes) <= 0
      ) {
        uni.showToast({ title: "请输入运动时长", icon: "none" });
        return;
      }

      const payload = {
        name: this.form.name.trim(),
        durationMinutes: parseInt(this.form.durationMinutes) || 0,
        exerciseCount: parseInt(this.form.exerciseCount) || 0,
        volume: parseFloat(this.form.volume) || 0,
        startTime: this.form.workoutTime
          ? `${this.form.workoutDate} ${this.form.workoutTime}:00`
          : null,
        remark: this.form.remark || null,
      };

      try {
        await addWorkoutRecord(payload);
        uni.showToast({ title: "记录成功 💪", icon: "success" });
        this.resetForm();
        this.loadTodayData();
      } catch (e) {
        console.error("Failed to save workout record", e);
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
      this.todayRecords.forEach((item) => {
        if (item.id !== currentItem.id && item._offset !== 0) {
          this.$set(item, "_offset", 0);
        }
      });
    },
    openEditPopup(item) {
      this.closeAllSwipes();
      this.editingItem = item;

      this.editForm = {
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
        await updateWorkoutRecord(this.editingItem.id, payload);
        uni.showToast({ title: "更新成功", icon: "success" });
        this.closeEditPopup();
        this.loadTodayData();
      } catch (e) {
        console.error("Failed to update workout record", e);
      }
    },
    confirmDelete(item) {
      this.closeAllSwipes();
      uni.showModal({
        title: "确认删除",
        content: `确定删除「${item.name}」的运动记录？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              await deleteWorkoutRecord(item.id);
              uni.showToast({ title: "已删除", icon: "success" });
              this.loadTodayData();
            } catch (e) {
              console.error("Failed to delete", e);
            }
          }
        },
      });
    },
    closeAllSwipes() {
      this.todayRecords.forEach((item) => {
        if (item._offset !== 0) {
          this.$set(item, "_offset", 0);
        }
      });
    },
    resetForm() {
      const now = new Date();
      this.form = {
        type: "",
        durationMinutes: "",
        exerciseCount: "",
        volume: "",
        workoutDate: this.formatDate(now),
        workoutTime: "",
        remark: "",
      };
      this.typeIndex = -1;
      this.isCustomType = false;
      this.showTimePicker = false;
    },
    onDateChange(e) {
      this.form.workoutDate = e.detail.value;
    },
    onTimeChange(e) {
      this.form.workoutTime = e.detail.value;
    },
    clearTime() {
      this.form.workoutTime = "";
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
    getBarHeight(value) {
      if (!this.weekData.length) return 0;
      const maxVal = Math.max(...this.weekData.map((d) => d.duration), 30);
      return Math.min(Math.round((value / maxVal) * 100), 100);
    },
  },
};
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background-color: #fff7ed;
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
    background-color: #ffedd5;
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

  .today-summary {
    display: flex;
    align-items: baseline;
    gap: 4rpx;
    background-color: #ffedd5;
    padding: 12rpx 24rpx;
    border-radius: 100rpx;

    .stat-value {
      font-size: 32rpx;
      font-weight: 800;
      color: #c2410c;
    }
    .stat-unit {
      font-size: 20rpx;
      font-weight: 600;
      color: #c2410c;
    }
  }
}

.quick-record-card {
  background-color: #fff;
  border-radius: 36rpx;
  padding: 36rpx;
  margin-bottom: 24rpx;

  .record-header {
    margin-bottom: 20rpx;
    .card-title {
      font-size: 30rpx;
      font-weight: 800;
      color: #1e293b;
    }
  }

  .form-section-main {
    background: #fafbfc;
    border-radius: 24rpx;
    padding: 28rpx;
    margin-bottom: 20rpx;
    overflow: hidden;

    .section-title {
      display: flex;
      align-items: center;
      margin-bottom: 20rpx;
      padding-bottom: 16rpx;
      border-bottom: 1rpx solid #f1f5f9;

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
  }

  .type-row {
    margin-bottom: 20rpx;

    .type-picker {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20rpx 24rpx;
      background-color: #f8fafc;
      border-radius: 20rpx;
      border: 1rpx solid #f1f5f9;

      text {
        font-size: 28rpx;
        font-weight: 700;
        color: #334155;
      }
    }

    .custom-type-input {
      width: 100%;
      height: 80rpx;
      background-color: #fff7ed;
      border-radius: 20rpx;
      padding: 0 24rpx;
      font-size: 28rpx;
      border: 2rpx solid #f97316;
      margin-top: 14rpx;
    }
  }

  .stats-row {
    display: flex;
    gap: 14rpx;
    margin-bottom: 20rpx;

    .stat-input-item {
      flex: 1;

      .field-label {
        display: block;
        font-size: 20rpx;
        font-weight: 700;
        color: #94a3b8;
        margin-bottom: 8rpx;
        text-align: center;
      }

      .stat-input {
        width: 100%;
        height: 80rpx;
        background-color: #f8fafc;
        border-radius: 18rpx;
        padding: 0 12rpx;
        font-size: 26rpx;
        text-align: center;
        border: 1rpx solid #f1f5f9;
        font-weight: 600;
      }
    }
  }

  .date-row {
    display: flex;
    justify-content: center;
    margin-bottom: 20rpx;

    .picker-trigger {
      display: flex;
      align-items: center;
      gap: 10rpx;
      padding: 16rpx 40rpx;
      background-color: #f8fafc;
      border-radius: 100rpx;
      border: 1rpx solid #f1f5f9;

      text {
        font-size: 28rpx;
        color: #64748b;
        font-weight: 600;
      }
    }
  }

  .time-optional-row {
    margin-bottom: 20rpx;

    .time-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8rpx;
      padding: 12rpx 0;

      .toggle-text {
        font-size: 24rpx;
        color: #94a3b8;
        font-weight: 600;
      }

      .time-preview {
        font-size: 22rpx;
        color: #f97316;
        font-weight: 700;
        background-color: #ffedd5;
        padding: 4rpx 16rpx;
        border-radius: 100rpx;
        margin-left: 8rpx;
      }

      &:active {
        opacity: 0.7;
      }
    }

    .time-picker-wrap {
      display: flex;
      justify-content: center;
      margin-top: 12rpx;

      .time-picker-trigger {
        display: flex;
        align-items: center;
        gap: 10rpx;
        padding: 16rpx 40rpx;
        background-color: #fff7ed;
        border-radius: 100rpx;
        border: 1rpx solid #fed7aa;

        text {
          font-size: 26rpx;
          color: #c2410c;
          font-weight: 600;
        }
      }
    }
  }

  .remark-input {
    margin-bottom: 24rpx;
    .remark-field {
      width: 100%;
      height: 72rpx;
      background-color: #f8fafc;
      border-radius: 20rpx;
      padding: 0 24rpx;
      font-size: 26rpx;
      border: 1rpx solid #f1f5f9;
    }
  }

  .submit-btn {
    width: 100%;
    height: 96rpx;
    background-color: #f97316;
    color: #fff;
    font-size: 30rpx;
    font-weight: 700;
    border-radius: 28rpx;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;

    &:active {
      opacity: 0.85;
      transform: scale(0.98);
    }
  }

  /* 表单通用样式 */
  .popup-label {
    display: block;
    font-size: 22rpx;
    font-weight: 700;
    color: #64748b;
    margin-bottom: 10rpx;
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
      gap: 6rpx;

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
    transition: all 0.2s;

    &.remark-input {
      height: 80rpx;
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

      &.unit-time,
      &.unit-count,
      &.unit-weight {
        background: linear-gradient(
          135deg,
          #fff7ed 0%,
          #ffedd5 50%,
          #fffbeb 100%
        );
        border-left: 2rpx solid #fdba74;

        &::before {
          background: linear-gradient(
            135deg,
            transparent 0%,
            rgba(249, 115, 22, 0.08) 100%
          );
        }
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

  .form-row {
    display: flex;
    gap: 16rpx;
    margin-bottom: 0;
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

  .form-divider {
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      #e2e8f0 20%,
      #e2e8f0 80%,
      transparent
    );
    margin: 24rpx 0;
  }

  .time-picker-wrap {
    width: 100%;
  }

  .time-placeholder {
    cursor: pointer;
  }
}

.list-section {
  margin-bottom: 24rpx;

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

  .record-count {
    font-size: 22rpx;
    font-weight: 700;
    color: #c2410c;
  }
}

.record-list {
  max-height: 55vh;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12rpx;

  .today-summary {
    flex-shrink: 0;
  }
}

.history-btn {
  width: 64rpx;
  height: 64rpx;
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffedd5;
  border-radius: 50%;

  &:active {
    opacity: 0.7;
    transform: scale(0.95);
  }

  .history-icon-image {
    width: 36rpx;
    height: 36rpx;
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
  border-radius: 24rpx;
  padding: 28rpx 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  flex: 1;
}

.bar-wrapper {
  width: 40rpx;
  height: 200rpx;
  background-color: #f1f5f9;
  border-radius: 20rpx 20rpx 4rpx 4rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.bar-fill {
  width: 100%;
  background-color: #f97316;
  border-radius: 20rpx 20rpx 4rpx 4rpx;
  transition: height 0.3s ease;
}

.bar-label {
  font-size: 18rpx;
  color: #94a3b8;
  font-weight: 600;
}

.bar-value {
  font-size: 18rpx;
  color: #c2410c;
  font-weight: 700;
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
  transition:
    transform 0.3s ease,
    border-radius 0.3s ease;
  max-height: 85vh;
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
    display: flex;
    align-items: center;

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
  overflow: hidden;

  scroll-view {
    width: 100%;
    height: 100%;
  }
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

  .form-divider {
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      #e2e8f0 20%,
      #e2e8f0 80%,
      transparent
    );
    margin: 24rpx 0;
  }

  .section-title {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
    padding-bottom: 16rpx;
    border-bottom: 1rpx solid #f1f5f9;

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

    &.third {
      flex: 1;
    }
  }

  .form-row {
    display: flex;
    gap: 16rpx;
    margin-bottom: 0;
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
    border: 2rpx solid #e8ecf0;
    font-weight: 600;
    color: #1e293b;
    transition: all 0.2s;

    &.remark-input {
      height: 80rpx;
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
      gap: 6rpx;

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

  .time-picker-wrap {
    width: 100%;
  }

  .time-placeholder {
    cursor: pointer;
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

  button:active {
    opacity: 0.85;
    transform: scale(0.98);
  }
}
</style>
