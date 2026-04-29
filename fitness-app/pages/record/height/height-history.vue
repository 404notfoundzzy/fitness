<template>
  <view class="container">
    <view class="header">
      <view class="nav-back" @click="goBack">
        <uni-icons type="left" size="20" color="#A855F7"></uni-icons>
      </view>
      <text class="title">身高趋势</text>
      <view class="header-right"></view>
    </view>

    <view class="stats-row">
      <view class="stat-card">
        <text class="stat-value">{{ latestHeight || "--" }}</text>
        <text class="stat-label">最新 (cm)</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ avgHeight || "--" }}</text>
        <text class="stat-label">平均 (cm)</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ recordCount }}</text>
        <text class="stat-label">记录数</text>
      </view>
    </view>

    <view class="chart-section" v-if="chartData.length > 0">
      <view class="chart-wrapper">
        <svg
          :width="chartWidth"
          :height="chartHeight"
          viewBox="0 0 700 360"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="heightGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stop-color="#A855F7" stop-opacity="0.28" />
              <stop offset="50%" stop-color="#C084FC" stop-opacity="0.10" />
              <stop offset="100%" stop-color="#DDD6FE" stop-opacity="0.02" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#9333EA" />
              <stop offset="50%" stop-color="#A855F7" />
              <stop offset="100%" stop-color="#C084FC" />
            </linearGradient>
            <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComponentTransfer in="blur" result="glow">
                <feFuncA type="linear" slope="0.5" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g v-for="(grid, i) in gridLines" :key="'grid-' + i">
            <line
              :x1="padding.left"
              :y1="grid.y"
              :x2="chartWidth - padding.right"
              :y2="grid.y"
              stroke="#f1f5f9"
              stroke-width="1"
              stroke-dasharray="4,4"
            />
          </g>

          <path v-if="pathD" :d="areaPathD" fill="url(#heightGradient)" />
          <path
            v-if="pathD"
            :d="pathD"
            fill="none"
            stroke="url(#lineGradient)"
            stroke-width="2.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            filter="url(#lineGlow)"
          />

          <circle
            v-for="(pt, i) in chartDataPoints"
            :key="'dot-' + i"
            :cx="pt.x"
            :cy="pt.y"
            r="5"
            fill="#fff"
            stroke="#9333EA"
            stroke-width="2.5"
            filter="url(#dotGlow)"
          />
        </svg>

        <view class="chart-overlay">
          <text
            v-for="(grid, i) in gridLines"
            :key="'ylbl-' + i"
            class="y-label"
            :style="{ top: (grid.y / chartHeight) * 100 + '%' }"
            >{{ grid.label }}</text
          >

          <view
            v-for="(label, i) in chartDataPoints"
            :key="'vlbl-' + i"
            class="value-badge"
            :style="{
              left: (label.x / chartWidth) * 100 + '%',
              top: ((label.y + 25) / chartHeight) * 100 + '%',
            }"
          >
            <text class="value-text">{{ label.value }}</text>
          </view>

          <text
            v-for="(tick, i) in xTicks"
            :key="'xtkl-' + i"
            class="x-label"
            :style="{ left: (tick.x / chartWidth) * 100 + '%' }"
            >{{ tick.label }}</text
          >
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="history-list" v-if="historyList.length > 0">
      <view
        v-for="(item, index) in historyList"
        :key="item.id || index"
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
              <uni-icons type="personadd" size="22" color="#FFFFFF"></uni-icons>
            </view>
            <view class="info">
              <text class="height-name">{{ item.height }} cm</text>
              <view class="meta-row">
                <text class="meta-tag date"
                  >{{ formatDateMain(item.recordDate) }}
                  {{ formatWeekday(item.recordDate) }}</text
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
          <view class="swipe-btn delete" @click.stop="confirmDelete(item)">
            <uni-icons type="trash" size="22" color="#fff"></uni-icons>
          </view>
        </view>
      </view>
    </scroll-view>

    <view v-if="historyList.length === 0 && !loading" class="empty-state">
      <uni-icons type="info" size="48" color="#cbd5e1"></uni-icons>
      <text>暂无身高记录</text>
      <text class="empty-hint">去记录页面添加你的第一条身高数据吧</text>
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
  getHeightHistory,
  updateHeightRecord,
  deleteHeightRecord,
} from "@/api/health";

export default {
  data() {
    return {
      loading: false,
      historyList: [],
      chartWidth: 700,
      chartHeight: 360,
      padding: { top: 30, right: 20, bottom: 60, left: 50 },
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

  computed: {
    sortedHistory() {
      return [...this.historyList].sort(
        (a, b) => new Date(a.recordDate) - new Date(b.recordDate),
      );
    },

    latestHeight() {
      if (!this.sortedHistory.length) return null;
      const last = this.sortedHistory[this.sortedHistory.length - 1];
      return last.height;
    },

    avgHeight() {
      if (!this.sortedHistory.length) return null;
      const sum = this.sortedHistory.reduce(
        (acc, item) => acc + Number(item.height),
        0,
      );
      return (sum / this.sortedHistory.length).toFixed(1);
    },

    recordCount() {
      return this.historyList.length;
    },

    chartData() {
      return this.sortedHistory;
    },

    heightRange() {
      if (!this.chartData.length) return { min: 150, max: 190 };
      const values = this.chartData.map((d) => Number(d.height));
      let min = Math.min(...values);
      let max = Math.max(...values);
      const padding = Math.max(2, (max - min) * 0.15);
      min = Math.floor(min - padding);
      max = Math.ceil(max + padding);
      return { min, max };
    },

    gridLines() {
      const { min, max } = this.heightRange;
      const step = Math.ceil((max - min) / 4);
      const lines = [];
      for (let v = min; v <= max; v += step) {
        const y =
          this.padding.top +
          ((max - v) / (max - min)) *
            (this.chartHeight - this.padding.top - this.padding.bottom);
        lines.push({ y, label: v });
      }
      return lines;
    },

    chartDataPoints() {
      const { min, max } = this.heightRange;
      const plotW = this.chartWidth - this.padding.left - this.padding.right;
      const plotH = this.chartHeight - this.padding.top - this.padding.bottom;

      return this.chartData.map((d, i) => ({
        x:
          this.padding.left +
          (i / Math.max(this.chartData.length - 1, 1)) * plotW,
        y: this.padding.top + ((max - Number(d.height)) / (max - min)) * plotH,
        value: d.height,
      }));
    },

    pathD() {
      if (this.chartDataPoints.length < 2) return null;
      const pts = this.chartDataPoints;
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1],
          curr = pts[i];
        const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
        const cpx2 = curr.x - (curr.x - prev.x) * 0.4;
        d += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
      }
      return d;
    },

    areaPathD() {
      if (!this.pathD) return null;
      const pts = this.chartDataPoints;
      const baseY = this.chartHeight - this.padding.bottom;
      return `${this.pathD} L ${pts[pts.length - 1].x} ${baseY} L ${pts[0].x} ${baseY} Z`;
    },

    xTicks() {
      const maxTicks = 6;
      const step = Math.max(1, Math.floor(this.chartData.length / maxTicks));
      const ticks = [];
      for (let i = 0; i < this.chartData.length; i += step) {
        ticks.push({
          x: this.chartDataPoints[i]?.x,
          label: this.formatDateShort(this.chartData[i].recordDate),
        });
      }
      if (
        ticks[ticks.length - 1]?.x !==
        this.chartDataPoints[this.chartDataPoints.length - 1]?.x
      ) {
        const last = this.chartData[this.chartData.length - 1];
        ticks.push({
          x: this.chartDataPoints[this.chartDataPoints.length - 1].x,
          label: this.formatDateShort(last.recordDate),
        });
      }
      return ticks;
    },
  },

  onShow() {
    this.loadHistory();
  },

  methods: {
    goBack() {
      const pages = getCurrentPages();
      pages.length > 1
        ? uni.navigateBack()
        : uni.switchTab({ url: "/pages/index/index" });
    },

    async loadHistory() {
      this.loading = true;
      try {
        const data = await getHeightHistory();
        this.historyList = (Array.isArray(data) ? data : []).map((item) => ({
          ...item,
          _offset: 0,
        }));
      } catch (e) {
        console.error("Failed to load height history", e);
        this.historyList = [];
      } finally {
        this.loading = false;
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
      this.historyList.forEach((item) => {
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

    async handleUpdateRecord() {
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
        this.loadHistory();
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
              this.loadHistory();
            } catch (e) {
              console.error("Failed to delete record", e);
            }
          }
        },
      });
    },

    closeAllSwipes() {
      this.historyList.forEach((item) => {
        if (item._offset !== 0) {
          this.$set(item, "_offset", 0);
        }
      });
    },

    formatDateMain(dateStr) {
      if (!dateStr) return "";
      const [y, m, d] = dateStr.split("-");
      return `${m}/${d}`;
    },

    formatWeekday(dateStr) {
      if (!dateStr) return "";
      const days = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      const day = new Date(dateStr).getDay();
      return days[day];
    },

    formatDateShort(dateStr) {
      if (!dateStr) return "";
      const parts = dateStr.split("-");
      return parts.slice(1).join("/");
    },

    formatTime(timeStr) {
      if (!timeStr) return "";
      const t = timeStr.substring(11, 16);
      return t === "00:00" ? "" : t;
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
}

.stats-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;

  .stat-card {
    flex: 1;
    background: linear-gradient(135deg, #fff, #faf5ff);
    border-radius: 20rpx;
    padding: 24rpx 16rpx;
    text-align: center;
    box-shadow: 0 4rpx 16rpx rgba(168, 85, 247, 0.08);

    .stat-value {
      display: block;
      font-size: 36rpx;
      font-weight: 800;
      color: #7c3aed;
      line-height: 1.2;
    }

    .stat-label {
      display: block;
      font-size: 22rpx;
      color: #94a3b8;
      margin-top: 4rpx;
    }
  }
}

.chart-section {
  background: linear-gradient(180deg, #faf5ff 0%, #fff 100%);
  border-radius: 24rpx;
  padding: 28rpx 20rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(147, 51, 234, 0.08);
  border: 1rpx solid #ede9fe;

  .chart-wrapper {
    position: relative;
    width: 100%;
  }

  svg {
    width: 100%;
    height: auto;
    display: block;
  }

  .chart-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;

    .y-label {
      position: absolute;
      left: 0;
      font-size: 20rpx;
      color: #94a3b8;
      transform: translateY(-50%);
    }

    .value-badge {
      position: absolute;
      transform: translate(-50%, -50%);

      .value-text {
        font-size: 22rpx;
        font-weight: 700;
        color: #7c3aed;
        white-space: nowrap;
      }
    }

    .x-label {
      position: absolute;
      bottom: 0;
      transform: translateX(-50%);
      font-size: 22rpx;
      font-weight: 600;
      color: #94a3b8;
    }
  }
}

.history-list {
  max-height: 50vh;
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

        &.date {
          background-color: #f3e8ff;
          color: #7c3aed;
        }

        &.time {
          background-color: #e0f2fe;
          color: #0369a1;
        }
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
  gap: 16rpx;

  text {
    font-size: 28rpx;
    color: #94a3b8;
  }

  .empty-hint {
    font-size: 24rpx;
    color: #cbd5e1;
  }
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
</style>
