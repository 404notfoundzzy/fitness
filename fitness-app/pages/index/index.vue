<template>
  <view class="container">
    <!-- 顶部问候语 -->
    <view class="header">
      <text class="greeting"
        >你好, {{ userInfo.nickname || userInfo.name || "新用户" }}</text
      >
      <text class="subtitle-line1">请再次震动那颗不服输的心脏</text>
      <text class="subtitle-line2">开启清爽运动的一天吧！</text>
    </view>

    <!-- 今日数据统计 -->
    <view class="stats-grid">
      <view class="card stat-card">
        <view class="icon-box bolt">
          <uni-icons type="fire" size="24" color="#0EA5E9"></uni-icons>
        </view>
        <view class="stat-value">{{ todayStats.caloriesBurned || 0 }}</view>
        <view class="stat-label">能量消耗 (kcal)</view>
      </view>
      <view class="card stat-card">
        <view class="icon-box runner">
          <image
            src="/static/steps.svg"
            class="stat-icon-image"
            mode="aspectFit"
          ></image>
        </view>
        <view class="stat-value stat-steps">{{ todayStats.steps || 0 }}</view>
        <view class="stat-label">今日步数</view>
      </view>
      <view class="card stat-card water-stat">
        <view class="icon-box water">
          <uni-icons type="color" size="24" color="#38BDF8"></uni-icons>
        </view>
        <view class="water-info">
          <view class="water-value-row">
            <text class="stat-value water-val">{{ dailyWaterTotal }}</text>
            <text class="water-unit">/ {{ waterGoal }}ml</text>
          </view>
          <view class="water-progress-wrap">
            <view class="water-progress-bar">
              <view
                class="water-progress-fill"
                :style="{ width: (dailyWaterTotal / waterGoal) * 100 + '%' }"
              ></view>
            </view>
            <view class="water-scale-row">
              <text
                v-for="(mark, idx) in waterScaleMarks"
                :key="idx"
                class="scale-mark"
                >{{ mark }}</text
              >
            </view>
          </view>
          <view class="stat-label">今日饮水</view>
        </view>
      </view>
    </view>

    <!-- 体重趋势分析 -->
    <view class="section-container">
      <view class="section-header-top">
        <view class="title-left">
          <view class="title-indicator"></view>
          <text class="card-title">体重趋势分析</text>
        </view>
      </view>
      <view class="card chart-card weight-card">
        <view class="card-header">
          <view class="weight-toolbar">
            <picker
              mode="selector"
              :range="weightPeriodOptions"
              :value="weightPeriodIndex"
              @change="onWeightPeriodChange"
            >
              <view class="filter-btn">
                <text>{{ weightPeriodLabel }}</text>
                <uni-icons type="bottom" size="12" color="#0EA5E9"></uni-icons>
              </view>
            </picker>

            <view class="toolbar-right">
              <view class="date-nav">
                <view class="nav-btn" @click="offsetWeek('weight', -1)">
                  <uni-icons type="left" size="11" color="#94A3B8"></uni-icons>
                </view>
                <picker
                  mode="date"
                  @change="onWeightDateChange"
                  :value="selectedWeightDate"
                >
                  <view class="date-trigger">
                    <text>{{ getWeekRangeText(selectedWeightDate) }}</text>
                    <uni-icons
                      type="calendar"
                      size="11"
                      color="#94A3B8"
                    ></uni-icons>
                  </view>
                </picker>
                <view class="nav-btn" @click="offsetWeek('weight', 1)">
                  <uni-icons type="right" size="11" color="#94A3B8"></uni-icons>
                </view>
              </view>

              <view
                class="change-badge"
                v-if="weightChange"
                :class="{
                  down: weightChange.startsWith('-'),
                  up:
                    weightChange.startsWith('+') &&
                    !weightChange.startsWith('-'),
                }"
              >
                <uni-icons
                  :type="weightChange.startsWith('-') ? 'bottom' : 'top'"
                  size="12"
                  :color="weightChange.startsWith('-') ? '#22c55e' : '#ef4444'"
                ></uni-icons>
                <text>{{ weightChange }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="chart-placeholder">
          <!-- 动态引导：如果没有数据点 -->
          <view v-if="!hasWeightData" class="empty-chart-state">
            <uni-icons type="info" size="24" color="#E2E8F0"></uni-icons>
            <text>本周暂无体重数据</text>
          </view>

          <!-- SVG 图表层 -->
          <view v-if="hasWeightData" class="chart-svg-container">
            <svg
              class="weight-chart-svg"
              viewBox="0 0 700 240"
              preserveAspectRatio="none"
            >
              <!-- 网格线 -->
              <g class="grid-lines">
                <line
                  v-for="(line, idx) in weightGridLines"
                  :key="'grid-' + idx"
                  :x1="line.x1"
                  :y1="line.y1"
                  :x2="line.x2"
                  :y2="line.y2"
                  stroke="#f1f5f9"
                  stroke-width="1"
                  stroke-dasharray="4,4"
                />
              </g>

              <!-- 渐变定义 -->
              <defs>
                <linearGradient
                  id="areaGradient"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    style="
                      stop-color: rgba(14, 165, 233, 0.25);
                      stop-opacity: 1;
                    "
                  />
                  <stop
                    offset="50%"
                    style="
                      stop-color: rgba(14, 165, 233, 0.08);
                      stop-opacity: 1;
                    "
                  />
                  <stop
                    offset="100%"
                    style="stop-color: rgba(14, 165, 233, 0); stop-opacity: 1"
                  />
                </linearGradient>
                <linearGradient
                  id="lineGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop
                    offset="0%"
                    style="stop-color: #0ea5e9; stop-opacity: 1"
                  />
                  <stop
                    offset="100%"
                    style="stop-color: #38bdf8; stop-opacity: 1"
                  />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <!-- 填充区域 -->
              <path
                v-if="weightSvgAreaPath"
                :d="weightSvgAreaPath"
                fill="url(#areaGradient)"
              />

              <!-- 曲线 -->
              <path
                v-if="weightSvgPath"
                :d="weightSvgPath"
                fill="none"
                stroke="url(#lineGradient)"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                filter="url(#glow)"
              />

              <!-- 数据点 -->
              <g
                v-for="(item, index) in weightTrendDisplay"
                :key="'dot-' + index"
              >
                <circle
                  v-if="item.weight > 0"
                  :cx="getSvgX(index)"
                  :cy="getSvgY(item.weight)"
                  :r="index === getLastDataIndex() ? 7 : 5"
                  :fill="index === getLastDataIndex() ? '#0EA5E9' : '#fff'"
                  :stroke="index === getLastDataIndex() ? '#fff' : '#0EA5E9'"
                  :stroke-width="index === getLastDataIndex() ? 3 : 2.5"
                  class="data-point"
                  :class="{ active: index === getLastDataIndex() }"
                />
              </g>
            </svg>

            <!-- 数据标签层 (简洁数值显示) -->
            <view class="data-labels-layer">
              <view
                v-for="(item, idx) in weightDataPoints"
                :key="'label-' + item.originalIndex"
                class="data-label-wrapper"
                :style="{
                  left: getLabelX(item.originalIndex) + '%',
                  top: getLabelTop(item.weight) + '%',
                }"
                :class="{
                  highlight: item.originalIndex === getLastDataIndex(),
                }"
              >
                <text
                  class="data-label-text"
                  :class="{
                    'text-highlight': item.originalIndex === getLastDataIndex(),
                  }"
                >
                  {{ item.weight }}
                </text>
              </view>
            </view>
          </view>
        </view>
        <view class="chart-labels">
          <text v-for="(item, index) in weightTrendDisplay" :key="index">{{
            formatWeightDate(item.recordDate)
          }}</text>
        </view>
      </view>
    </view>

    <!-- 运动时长统计 -->
    <view class="section-container">
      <view class="section-header-top">
        <view class="title-left">
          <view class="title-indicator"></view>
          <text class="card-title">运动时长统计 (min)</text>
        </view>
      </view>
      <view class="card chart-card duration-card">
        <view class="card-header">
          <view class="filter-controls">
            <view class="dimension-picker">
              <text
                v-for="d in dimensions"
                :key="d.value"
                class="dim-item"
                :class="{ active: currentDimension === d.value }"
                @click="changeDimension(d.value)"
                >{{ d.label }}</text
              >
            </view>
            <view v-if="currentDimension === 'week'" class="week-picker">
              <view class="nav-arrow" @click="offsetWeek('duration', -1)">
                <uni-icons type="left" size="12" color="#94A3B8"></uni-icons>
              </view>
              <picker
                mode="date"
                @change="onDurationDateChange"
                :value="selectedDurationDate"
              >
                <view class="time-selector small">
                  <text>{{ getWeekRangeText(selectedDurationDate) }}</text>
                  <uni-icons
                    type="calendar"
                    size="12"
                    color="#94A3B8"
                  ></uni-icons>
                </view>
              </picker>
              <view class="nav-arrow" @click="offsetWeek('duration', 1)">
                <uni-icons type="right" size="12" color="#94A3B8"></uni-icons>
              </view>
            </view>
            <view v-else class="time-selector small">
              <text>近6个月</text>
            </view>
          </view>
        </view>

        <view class="bar-chart">
          <view
            v-for="(item, index) in durationActivityDisplay"
            :key="index"
            class="bar-wrapper"
          >
            <text class="bar-value" v-if="item.value > 0">{{
              Math.round(item.value)
            }}</text>
            <view
              class="bar"
              :class="{ active: isToday(item.date), empty: item.value === 0 }"
              :style="{
                height:
                  item.value === 0
                    ? '8rpx'
                    : (item.value / maxDuration) * 100 + '%',
              }"
            >
            </view>
          </view>
        </view>
        <view class="bar-labels">
          <text v-for="(item, index) in durationActivityDisplay" :key="index">{{
            item.label
          }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import {
  getTodayStats,
  getWeightTrend,
  getWeeklyActivity,
  getUserProfile,
} from "@/api/index";
import { getDailyWaterTotal, getWeightHistory } from "@/api/health";
import { checkLogin } from "@/utils/auth";

export default {
  data() {
    return {
      userInfo: {},
      todayStats: {
        caloriesBurned: 0,
        steps: 0,
      },
      weightTrend: [],
      weeklyActivity: [],
      weightChange: "",

      // Weight Chart Range
      weightMin: 50,
      weightMax: 100,

      // Weight Trend Selectors
      selectedWeightDate: new Date().toISOString().split("T")[0],

      // Duration Selectors
      dimensions: [
        { label: "周", value: "week" },
        { label: "月", value: "month" },
      ],
      currentDimension: "week",
      selectedDurationDate: new Date().toISOString().split("T")[0],

      // Water Intake Data
      dailyWaterTotal: 0,
      waterGoal: 2000,

      // Weight Period Switching
      currentWeightPeriod: "",
    };
  },
  computed: {
    weightTrendDisplay() {
      const display = [];
      const baseDate = new Date(this.selectedWeightDate);
      // 获取所在周的周一
      const day = baseDate.getDay() || 7;
      const monday = new Date(baseDate);
      monday.setDate(baseDate.getDate() - day + 1);

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = d.toISOString().split("T")[0];

        const found = this.weightTrend.find((item) => {
          let recordDate = item.recordDate;
          if (Array.isArray(recordDate)) {
            const [year, month, day] = recordDate;
            recordDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          }
          return recordDate === dateStr;
        });

        display.push({
          recordDate: dateStr,
          weight: found ? found.weight : 0,
        });
      }
      return display;
    },
    hasWeightData() {
      return this.weightTrendDisplay.some((item) => item.weight > 0);
    },
    weightDataPoints() {
      return this.weightTrendDisplay
        .map((item, index) => ({ ...item, originalIndex: index }))
        .filter((item) => item.weight > 0);
    },
    weightPoints() {
      // 过滤出有体重的点并映射到 SVG 坐标 (0-100)
      return this.weightTrendDisplay
        .map((item, index) => ({
          x: index * (100 / 6),
          y: 100 - this.calculateWeightBottom(item.weight),
          hasData: item.weight > 0,
        }))
        .filter((p) => p.hasData);
    },
    weightLinePath() {
      const pts = this.weightPoints;
      if (pts.length < 2) return "";

      // 构建平滑曲线路径 (贝塞尔曲线)
      let d = `M ${pts[0].x} ${pts[0].y}`;

      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        // 控制点计算 (简单的中点偏移，实现平滑效果)
        const cp1x = p0.x + (p1.x - p0.x) / 2;
        d += ` C ${cp1x} ${p0.y}, ${cp1x} ${p1.y}, ${p1.x} ${p1.y}`;
      }
      return d;
    },
    weightAreaPath() {
      const linePath = this.weightLinePath;
      if (!linePath) return "";

      const pts = this.weightPoints;
      const first = pts[0];
      const last = pts[pts.length - 1];

      // 闭合路径以形成填充区域
      return `${linePath} L ${last.x} 100 L ${first.x} 100 Z`;
    },
    weightClipPath() {
      const display = this.weightTrendDisplay;
      const pts = display
        .map((item, index) => {
          if (item.weight <= 0) return null;
          return {
            x: index * (100 / 6),
            y: 100 - this.calculateWeightBottom(item.weight),
          };
        })
        .filter((p) => p !== null);

      if (pts.length < 2) return "polygon(0% 100%, 0% 100%, 100% 100%)";

      const first = pts[0];
      const last = pts[pts.length - 1];
      let path = `polygon(${first.x}% ${first.y}%`;

      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const cpX = (p0.x + p1.x) / 2;
        path += `, ${cpX}% ${p0.y}%, ${cpX}% ${p1.y}%`;
      }

      path += `, ${last.x}% ${last.y}%`;
      path += `, ${last.x} 100%, ${first.x} 100%)`;

      return path;
    },
    weightSvgPath() {
      const display = this.weightTrendDisplay;
      const svgWidth = 700;
      const svgHeight = 240;
      const padding = { left: 50, right: 50, top: 30, bottom: 30 };
      const chartWidth = svgWidth - padding.left - padding.right;
      const chartHeight = svgHeight - padding.top - padding.bottom;

      const pts = display
        .map((item, index) => {
          if (item.weight <= 0) return null;
          const x = padding.left + (index * chartWidth) / 6;
          const y =
            padding.top +
            chartHeight -
            (this.calculateWeightBottom(item.weight) * chartHeight) / 100;
          return { x, y, hasData: true };
        })
        .filter((p) => p !== null);

      if (pts.length < 2) return "";

      let d = `M ${pts[0].x} ${pts[0].y}`;

      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const cpX = (p0.x + p1.x) / 2;
        d += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
      }

      return d;
    },
    weightSvgAreaPath() {
      const linePath = this.weightSvgPath;
      if (!linePath) return "";

      const svgHeight = 240;
      const baseY = svgHeight - 20;

      const display = this.weightTrendDisplay;
      const firstIdx = display.findIndex((item) => item.weight > 0);
      const lastIdx = display
        .map((item, i) => (item.weight > 0 ? i : -1))
        .filter((i) => i >= 0)
        .pop();

      if (firstIdx === -1 || lastIdx === -1) return "";

      const svgWidth = 700;
      const padding = { left: 50, right: 50 };
      const chartWidth = svgWidth - padding.left - padding.right;
      const startX = padding.left + (firstIdx * chartWidth) / 6;
      const endX = padding.left + (lastIdx * chartWidth) / 6;

      return `${linePath} L ${endX} ${baseY} L ${startX} ${baseY} Z`;
    },
    weightGridLines() {
      const lines = [];
      const svgWidth = 700;
      const svgHeight = 240;
      const padding = { left: 50, right: 50, top: 30, bottom: 30 };

      for (let i = 0; i <= 4; i++) {
        const y =
          padding.top + (i * (svgHeight - padding.top - padding.bottom)) / 4;
        lines.push({
          x1: padding.left,
          y1: y,
          x2: svgWidth - padding.right,
          y2: y,
        });
      }
      return lines;
    },
    weightPeriodOptions() {
      return ["全部", "晨重", "晚重"];
    },
    weightPeriodIndex() {
      if (this.currentWeightPeriod === "morning") return 1;
      if (this.currentWeightPeriod === "evening") return 2;
      return 0;
    },
    weightPeriodLabel() {
      if (this.currentWeightPeriod === "morning") return "晨重";
      if (this.currentWeightPeriod === "evening") return "晚重";
      return "全部";
    },
    durationActivityDisplay() {
      const display = [];
      if (this.currentDimension === "week") {
        const baseDate = new Date(this.selectedDurationDate);
        const day = baseDate.getDay() || 7;
        const monday = new Date(baseDate);
        monday.setDate(baseDate.getDate() - day + 1);

        for (let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          const dateStr = d.toISOString().split("T")[0];

          const found = this.weeklyActivity.find((item) => {
            let recordDate = item.date;
            if (Array.isArray(recordDate)) {
              const [year, month, day] = recordDate;
              recordDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            }
            return recordDate === dateStr;
          });

          display.push({
            date: dateStr,
            value: found ? found.activityDurationMinutes : 0,
            label: this.formatDayName(dateStr),
          });
        }
      } else {
        // 月维度：展示近 6 个月
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const monthlyData = this.weeklyActivity
            .filter((item) => {
              let recordDate = item.date;
              if (Array.isArray(recordDate)) {
                const [year, month, day] = recordDate;
                recordDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              }
              return recordDate.startsWith(monthStr);
            })
            .reduce((acc, cur) => acc + cur.activityDurationMinutes, 0);

          display.push({
            date: monthStr,
            value: monthlyData,
            label: `${d.getMonth() + 1}月`,
          });
        }
      }
      return display;
    },
    maxDuration() {
      const max = Math.max(
        ...this.durationActivityDisplay.map((i) => i.value),
        60,
      );
      return max * 1.2;
    },
  },
  onShow() {
    if (checkLogin()) {
      this.fetchData();
    }
  },
  methods: {
    async fetchData() {
      try {
        const user = await getUserProfile();
        this.userInfo = user || {};

        // 拆分接口调用
        this.fetchTodayStats();
        this.fetchWeightTrend();
        this.fetchWeeklyActivity();
        this.fetchDailyWaterTotal();
      } catch (e) {
        console.error("Failed to fetch user profile", e);
      }
    },
    async fetchTodayStats() {
      try {
        const stats = await getTodayStats();
        this.todayStats = stats || { caloriesBurned: 0, steps: 0 };
      } catch (e) {
        console.error("Failed to fetch today stats", e);
      }
    },
    async fetchWeightTrend() {
      try {
        const weights = await getWeightHistory(
          this.currentWeightPeriod || undefined,
        );
        this.weightTrend = weights || [];
        this.calculateWeightChartRange();
        this.calculateWeightChange();
      } catch (e) {
        console.error("Failed to fetch weight trend", e);
      }
    },
    async fetchWeeklyActivity() {
      try {
        const activity = await getWeeklyActivity();
        this.weeklyActivity = activity || [];
      } catch (e) {
        console.error("Failed to fetch weekly activity", e);
      }
    },
    async fetchDailyWaterTotal() {
      try {
        const today = new Date().toISOString().split("T")[0];
        const total = await getDailyWaterTotal(today);
        this.dailyWaterTotal = total || 0;
      } catch (e) {
        console.error("Failed to fetch daily water total", e);
        this.dailyWaterTotal = 0;
      }
    },
    calculateWeightChartRange() {
      if (this.weightTrend.length > 0) {
        const weights = this.weightTrend.map((i) => i.weight);
        const min = Math.min(...weights);
        const max = Math.max(...weights);
        this.weightMin = Math.floor(min - 2);
        this.weightMax = Math.ceil(max + 2);
      } else {
        this.weightMin = 50;
        this.weightMax = 100;
      }
    },
    calculateWeightChange() {
      const weekData = this.weightTrendDisplay.filter((i) => i.weight > 0);
      if (weekData.length >= 2) {
        const first = weekData[0].weight;
        const last = weekData[weekData.length - 1].weight;
        const diff = (last - first).toFixed(1);
        this.weightChange = (diff > 0 ? "+" : "") + diff + "kg";
      } else {
        this.weightChange = "";
      }
    },
    onWeightDateChange(e) {
      this.selectedWeightDate = e.detail.value;
      this.fetchWeightTrend();
    },
    switchWeightPeriod(period) {
      this.currentWeightPeriod = period;
      this.fetchWeightTrend();
    },
    onWeightPeriodChange(e) {
      const index = e.detail.value;
      if (index === 0) this.currentWeightPeriod = "";
      else if (index === 1) this.currentWeightPeriod = "morning";
      else if (index === 2) this.currentWeightPeriod = "evening";
      this.fetchWeightTrend();
    },
    changeDimension(dim) {
      this.currentDimension = dim;
      this.fetchWeeklyActivity();
    },
    onDurationDateChange(e) {
      this.selectedDurationDate = e.detail.value;
      this.fetchWeeklyActivity();
    },
    offsetWeek(type, weeks) {
      const key =
        type === "weight" ? "selectedWeightDate" : "selectedDurationDate";
      const date = new Date(this[key]);
      date.setDate(date.getDate() + weeks * 7);
      this[key] = date.toISOString().split("T")[0];

      if (type === "weight") {
        this.fetchWeightTrend();
      } else {
        this.fetchWeeklyActivity();
      }
    },
    getWeekRangeText(dateStr) {
      const date = new Date(dateStr);
      const day = date.getDay() || 7;
      const monday = new Date(date);
      monday.setDate(date.getDate() - day + 1);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const f = (d) => `${d.getMonth() + 1}.${d.getDate()}`;
      return `${f(monday)} - ${f(sunday)}`;
    },
    calculateWeightBottom(weight) {
      if (!weight) return 0;
      const range = this.weightMax - this.weightMin;
      if (range <= 0) return 50; // 避免除以 0
      return ((weight - this.weightMin) / range) * 100;
    },
    formatWeightDate(dateStr) {
      const date = new Date(dateStr);
      const names = ["日", "一", "二", "三", "四", "五", "六"];
      return names[date.getDay()];
    },
    getSvgX(index) {
      const svgWidth = 700;
      const padding = { left: 50, right: 50 };
      const chartWidth = svgWidth - padding.left - padding.right;
      return padding.left + (index * chartWidth) / 6;
    },
    getLabelX(index) {
      return (index / 6) * 100;
    },
    getLabelTop(weight) {
      const bottomPercent = this.calculateWeightBottom(weight);
      return 100 - bottomPercent + 6;
    },
    getSvgY(weight) {
      const svgHeight = 240;
      const padding = { top: 30, bottom: 30 };
      const chartHeight = svgHeight - padding.top - padding.bottom;
      return (
        padding.top +
        chartHeight -
        (this.calculateWeightBottom(weight) * chartHeight) / 100
      );
    },
    getLastDataIndex() {
      const display = this.weightTrendDisplay;
      for (let i = display.length - 1; i >= 0; i--) {
        if (display[i].weight > 0) return i;
      }
      return -1;
    },
    formatDayName(dateStr) {
      const date = new Date(dateStr);
      const names = ["日", "一", "二", "三", "四", "五", "六"];
      return names[date.getDay()];
    },
    isToday(dateStr) {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      return dateStr === today || dateStr === currentMonth;
    },
    waterScaleMarks() {
      const step = this.waterGoal / 4;
      return [
        "0",
        `${step}`,
        `${step * 2}`,
        `${step * 3}`,
        `${this.waterGoal}`,
      ];
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: $bg-color;
  padding: 60rpx 40rpx 40rpx;
}

.header {
  margin-top: 40rpx;
  margin-bottom: 56rpx;
  position: relative;

  .greeting {
    display: block;
    font-size: 46rpx;
    font-weight: 600;
    padding-left: 8rpx;
    font-family:
      "STYuanti",
      "华文圆体",
      "圆体",
      "Rounded Mplus 1c",
      -apple-system,
      "PingFang SC",
      "Hiragino Sans GB",
      "Microsoft YaHei",
      sans-serif;
    background: linear-gradient(
      135deg,
      #8b5cf6 0%,
      #a78bfa 25%,
      #c084fc 50%,
      #e879f9 75%,
      #f472b6 100%
    );
    background-size: 200% 200%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: greetingFlow 6s ease infinite;
    margin-bottom: 18rpx;
    letter-spacing: 4rpx;
  }

  .subtitle-line1 {
    display: block;
    font-size: 40rpx;
    font-weight: 500;
    padding-left: 56rpx;
    font-family:
      "STXingkai",
      "华文行楷",
      "行楷",
      "Kaiti SC",
      "STKaiti",
      -apple-system,
      "PingFang SC",
      "Hiragino Sans GB",
      "Microsoft YaHei",
      sans-serif;
    background: linear-gradient(
      90deg,
      #f43f5e 0%,
      #fb7185 30%,
      #f97316 60%,
      #fbbf24 85%,
      #facc15 100%
    );
    background-size: 200% 200%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: subtitleLine1Flow 5s ease infinite;
    margin-bottom: 12rpx;
    letter-spacing: 2rpx;
  }

  .subtitle-line2 {
    display: block;
    font-size: 25rpx;
    font-weight: 500;
    padding-left: 20rpx;
    font-style: italic;
    font-family:
      -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
      sans-serif;
    background: linear-gradient(
      135deg,
      #06b6d4 0%,
      #22d3ee 28%,
      #34d399 55%,
      #10b981 78%,
      #059669 100%
    );
    background-size: 200% 200%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: subtitleLine2Flow 6s ease infinite;
    letter-spacing: 1rpx;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30rpx;
  margin-bottom: 40rpx;

  .water-stat {
    grid-column: span 2;
    display: flex;
    align-items: center;
    gap: 28rpx;
    padding: 30rpx 36rpx;

    .icon-box.water {
      width: 88rpx;
      height: 88rpx;
      border-radius: 24rpx;
      background: linear-gradient(
        135deg,
        #e0f2fe 0%,
        #bae6fd 50%,
        #7dd3fc 100%
      );
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 6rpx 20rpx rgba(14, 165, 233, 0.2);
      animation: iconFloat 3s ease-in-out infinite 1s;
    }

    .water-info {
      flex: 1;

      .water-value-row {
        display: flex;
        align-items: baseline;
        gap: 8rpx;
        margin-bottom: 12rpx;

        .stat-value.water-val {
          font-size: 48rpx;
          font-weight: 800;
          background: linear-gradient(
            135deg,
            #06b6d4 0%,
            #0ea5e9 35%,
            #38bdf8 65%,
            #7dd3fc 100%
          );
          background-size: 200% 200%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: gradientFlowBlue 3s ease infinite;
        }

        .water-unit {
          font-size: 24rpx;
          color: #94a3b8;
          font-weight: 500;
        }
      }

      .water-progress-wrap {
        margin-bottom: 6rpx;
      }

      .water-progress-bar {
        height: 18rpx;
        background: linear-gradient(90deg, #f0f9ff, #e0f2fe);
        border-radius: 100rpx;
        overflow: hidden;
        margin-bottom: 8rpx;

        .water-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #0ea5e9, #38bdf8, #7dd3fc);
          background-size: 200% 100%;
          border-radius: 100rpx;
          transition: width 0.5s ease;
          min-width: 0;
          animation: progressShimmer 2s ease infinite;
        }
      }

      .water-scale-row {
        display: flex;
        justify-content: space-between;

        .scale-mark {
          font-size: 18rpx;
          color: #cbd5e1;
          font-weight: 500;
        }
      }

      .stat-label {
        font-size: 22rpx;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 2rpx;
      }
    }
  }
}

.card {
  background-color: $card-bg;
  border-radius: 48rpx;
  padding: 40rpx;
  box-shadow: $card-shadow;
  border: 1px solid rgba(14, 165, 233, 0.05);
}

.stat-card {
  .icon-box {
    width: 88rpx;
    height: 88rpx;
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24rpx;

    &.bolt {
      background: linear-gradient(
        135deg,
        #fef3c7 0%,
        #fde68a 50%,
        #fcd34d 100%
      );
      box-shadow: 0 6rpx 20rpx rgba(251, 191, 36, 0.25);
      animation: iconFloat 3s ease-in-out infinite;
    }
    &.runner {
      background: linear-gradient(
        135deg,
        #ecfdf5 0%,
        #a7f3d0 50%,
        #6ee7b7 100%
      );
      box-shadow: 0 6rpx 20rpx rgba(16, 185, 129, 0.25);
      animation: iconFloat 3s ease-in-out infinite 0.5s;
    }

    .stat-icon-image {
      width: 56rpx;
      height: 56rpx;
    }
  }
  .stat-value {
    font-size: 48rpx;
    font-weight: 800;
    background: linear-gradient(
      135deg,
      #f59e0b 0%,
      #f97316 35%,
      #ef4444 65%,
      #dc2626 100%
    );
    background-size: 200% 200%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: gradientFlowFire 3s ease infinite;
    margin-bottom: 10rpx;

    &.stat-steps {
      background: linear-gradient(
        135deg,
        #10b981 0%,
        #059669 35%,
        #047857 65%,
        #065f46 100%
      );
      background-size: 200% 200%;
      -webkit-background-clip: text;
      background-clip: text;
      animation: gradientFlowGreen 3s ease infinite;
    }
  }
  .stat-label {
    font-size: 22rpx;
    font-weight: 700;
    color: $text-light;
    text-transform: uppercase;
    letter-spacing: 2rpx;
  }
}

.section-container {
  margin-bottom: 40rpx;

  .section-header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
    padding-left: 10rpx;

    .title-left {
      display: flex;
      align-items: center;
      gap: 16rpx;

      .title-indicator {
        width: 8rpx;
        height: 32rpx;
        background: linear-gradient(180deg, $primary-color, #38bdf8);
        border-radius: 4rpx;
      }

      .card-title {
        font-size: 34rpx;
        font-weight: 800;
        color: $text-main;
        letter-spacing: 1rpx;
      }
    }
  }
}

.card-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 16rpx;

  .weight-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 20rpx;
  }

  .period-switch {
    display: flex;
    background-color: #f1f5f9;
    padding: 5rpx;
    border-radius: 12rpx;
    gap: 3rpx;

    .p-tab {
      padding: 14rpx 28rpx;
      border-radius: 9rpx;
      font-size: 24rpx;
      color: #64748b;
      font-weight: 600;
      transition: all 0.25s ease;

      &.active {
        background: linear-gradient(135deg, $primary-color, #38bdf8);
        color: #fff;
        box-shadow: 0 4rpx 14rpx rgba(14, 165, 233, 0.28);
        transform: translateY(-1rpx);
      }

      &:not(.active):active {
        background-color: #e2e8f0;
      }
    }
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
    white-space: nowrap;

    text {
      font-size: 22rpx;
      font-weight: 600;
      color: #64748b;
      white-space: nowrap;
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

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 12rpx;
    flex-shrink: 0;
  }

  .change-badge {
    display: inline-flex;
    align-items: center;
    gap: 4rpx;
    padding: 8rpx 18rpx;
    border-radius: 100rpx;
    font-size: 23rpx;
    font-weight: 700;
    white-space: nowrap;
    transition: all 0.2s;
    line-height: 1;

    text {
      font-size: 23rpx;
      font-weight: 700;
    }

    &.down {
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      color: #16a34a;
      border: 1px solid #bbf7d0;
    }
    &.up {
      background: linear-gradient(135deg, #fef2f2, #fee2e2);
      color: #dc2626;
      border: 1px solid #fecaca;
    }
    &:not(.down):not(.up) {
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      color: $primary-color;
      border: 1px solid #bfdbfe;
    }
  }

  .date-nav {
    display: flex;
    align-items: center;
    gap: 4rpx;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    padding: 5rpx 8rpx 5rpx 5rpx;
    border-radius: 100rpx;
    border: 1.5px solid #e2e8f0;
    box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.02);

    .nav-btn {
      width: 46rpx;
      height: 42rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.15s ease;

      &:active {
        background-color: #e2e8f0;
        transform: scale(0.92);
      }
    }

    .date-trigger {
      display: flex;
      align-items: center;
      gap: 6rpx;
      padding: 5rpx 16rpx;

      text {
        font-size: 23rpx;
        color: #334155;
        font-weight: 600;
        white-space: nowrap;
        letter-spacing: 0.3rpx;
      }
    }
  }
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.dimension-picker {
  display: flex;
  background-color: #f1f5f9;
  padding: 4rpx;
  border-radius: 12rpx;

  .dim-item {
    padding: 8rpx 20rpx;
    font-size: 22rpx;
    color: $text-muted;
    font-weight: 700;
    border-radius: 8rpx;

    &.active {
      background-color: #fff;
      color: $primary-color;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
    }
  }
}

.week-picker {
  display: flex;
  align-items: center;
  gap: 10rpx;

  .nav-arrow {
    width: 44rpx;
    height: 44rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f8fafc;
    border-radius: 50%;
    transition: all 0.2s;

    &:active {
      background-color: #f1f5f9;
      transform: scale(0.9);
    }
  }
}

.time-selector {
  display: flex;
  align-items: center;
  background-color: #f8fafc;
  padding: 8rpx 24rpx;
  border-radius: 100rpx;
  gap: 8rpx;

  text {
    font-size: 26rpx;
    color: $text-main;
    font-weight: 600;
  }

  &.small {
    padding: 4rpx 20rpx;
    text {
      font-size: 22rpx;
    }
  }
}

.card-title {
  font-size: 34rpx;
  font-weight: 800;
  color: #0f172a;
}

.badge {
  padding: 8rpx 24rpx;
  background-color: $primary-light;
  color: $primary-color;
  border-radius: 100rpx;
  font-size: 22rpx;
  font-weight: 700;
}

.chart-placeholder {
  height: 280rpx;
  position: relative;
  margin: 30rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;

  .empty-chart-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16rpx;

    text {
      font-size: 24rpx;
      color: #94a3b8;
      font-weight: 500;
    }
  }

  .chart-svg-container {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;

    .weight-chart-svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .grid-lines {
      line {
        opacity: 0.6;
      }
    }

    .data-point {
      transition: all 0.3s ease;
      cursor: pointer;

      &.active {
        animation: pulse 2s infinite;
      }

      &:hover {
        r: 8;
      }
    }

    .data-labels-layer {
      position: absolute;
      width: calc(100% - 40rpx);
      left: 20rpx;
      top: 0;
      height: 100%;
      z-index: 10;
      pointer-events: none;

      .data-label-wrapper {
        position: absolute;
        transform: translateX(-50%);

        .data-label-text {
          font-size: 22rpx;
          font-weight: 700;
          color: #0369a1;
          line-height: 1.2;
          white-space: nowrap;
          text-shadow: 0 1rpx 4rpx rgba(255, 255, 255, 0.9);

          &.text-highlight {
            font-size: 26rpx;
            font-weight: 800;
            color: #0c4a6e;
          }
        }

        &.highlight {
          .data-label-text {
            animation: labelPulse 2s infinite;
          }
        }
      }
    }
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.15);
  }
}

.chart-labels,
.bar-labels {
  display: flex;
  justify-content: space-between;
  padding: 0 10rpx;
  text {
    font-size: 24rpx; /* 统一调大一点到 24rpx，更清晰 */
    color: $text-muted;
    font-weight: 600;
    width: 14.28%; /* 7天等分 */
    text-align: center;
  }
}

.duration-card {
  .bar-chart {
    height: 240rpx;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20rpx;
    margin-bottom: 20rpx;
    padding: 40rpx 10rpx 0;

    .bar-wrapper {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
      gap: 12rpx;

      .bar-value {
        font-size: 22rpx;
        color: $text-muted;
        font-weight: 700;
      }
    }

    .bar {
      width: 100%;
      background-color: $primary-light;
      border-radius: 16rpx 16rpx 0 0;
      transition: all 0.3s;

      &.active {
        background-color: $primary-color;
        box-shadow: 0 10rpx 20rpx rgba(14, 165, 233, 0.2);
      }

      &.empty {
        background-color: #f1f5f9;
        border-radius: 4rpx;
      }
    }
  }
}

@keyframes gradientFlowFire {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes gradientFlowBlue {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes gradientFlowGreen {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes greetingFlow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes subtitleLine1Flow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes subtitleLine2Flow {
  0% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 100% 100%;
  }
  100% {
    background-position: 0% 0%;
  }
}

@keyframes iconFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6rpx);
  }
}

@keyframes progressShimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
