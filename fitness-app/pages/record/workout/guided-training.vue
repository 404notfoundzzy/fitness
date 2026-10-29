<template>
  <view class="gt-page">
    <view class="bg-orb bg-orb-1"></view>
    <view class="bg-orb bg-orb-2"></view>

    <!-- 顶部导航 -->
    <view class="gt-nav">
      <view class="nav-back" @click="onBack">
        <AppIcon name="left" :size="44" active-color="#0F172A" :breathe="false" />
      </view>
      <view class="nav-title-wrap">
        <text class="nav-title">{{ planName }}</text>
        <text class="nav-sub">{{ dayName || "训练日" }}{{ focus ? " · " + focus : "" }}</text>
      </view>
      <view class="nav-right">
        <view class="nav-clock">
          <text class="clock-value">{{ elapsedLabel }}</text>
        </view>
        <view class="nav-finish" @click="openSummary">
          <text>完成</text>
        </view>
      </view>
    </view>

    <!-- 训练进度条 -->
    <view class="gt-progress" v-if="session">
      <view class="progress-track">
        <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
      </view>
      <view class="progress-meta">
        <text class="pm-sets">{{ totals.doneSets }}/{{ totals.totalSets }} 组</text>
        <text class="pm-dot">·</text>
        <text class="pm-vol">{{ totals.volume }} kg</text>
        <text class="pm-hint" v-if="!profileReady">离线模式：暂无历史预填</text>
      </view>
    </view>

    <!-- 骨架 -->
    <view v-if="loading" class="gt-body">
      <view v-for="i in 3" :key="i" class="skeleton-card">
        <view class="sk-line sk-title skeleton-shimmer"></view>
        <view class="sk-line sk-sub skeleton-shimmer"></view>
        <view v-for="j in 3" :key="j" class="sk-row skeleton-shimmer"></view>
      </view>
    </view>

    <!-- 加载失败 -->
    <view v-else-if="loadError" class="gt-empty">
      <view class="empty-icon">!</view>
      <text class="empty-title">{{ loadError }}</text>
      <text class="empty-desc">检查网络后重试，或先去训练计划页激活一个计划</text>
      <view class="empty-actions">
        <view class="btn-ghost" @click="load">重试</view>
        <view class="btn-primary" @click="goPlanList">去选计划</view>
      </view>
    </view>

    <!-- 无激活动作 -->
    <view v-else-if="session && !session.exercises.length" class="gt-empty">
      <view class="empty-icon">?</view>
      <text class="empty-title">这个训练日还没有动作</text>
      <text class="empty-desc">去计划编辑页给当天添加动作后再来训练</text>
      <view class="empty-actions">
        <view class="btn-primary" @click="goPlanList">去选计划</view>
      </view>
    </view>

    <!-- 训练主体 -->
    <scroll-view v-else-if="session" scroll-y class="gt-body" :show-scrollbar="false">
      <view class="body-inner">
        <view class="resume-banner" v-if="resumed">
          <text class="resume-text">已恢复上次训练进度</text>
          <text class="resume-close" @click="resumed = false">知道了</text>
        </view>

        <view
          v-for="(ex, exIndex) in session.exercises"
          :key="ex.key"
          class="ex-card"
          :class="{ 'is-complete': isExerciseDone(ex) }"
        >
          <!-- 动作头 -->
          <view class="ex-head">
            <view class="ex-index" :class="{ done: isExerciseDone(ex) }">
              <text>{{ String(exIndex + 1).padStart(2, "0") }}</text>
            </view>
            <view class="ex-title-wrap">
              <text class="ex-name">{{ ex.name }}</text>
              <view class="ex-meta">
                <text class="meta-chip">{{ ex.targetSets }} 组 × {{ rangeLabel(ex) }}</text>
                <text class="meta-chip" v-if="ex.restSeconds">休息 {{ ex.restSeconds }}s</text>
                <text class="meta-chip muscle" v-if="ex.primaryMuscle">{{ muscleLabel(ex.primaryMuscle) }}</text>
              </view>
            </view>
            <view class="ex-side-toggle" :class="{ on: ex.perSide }" @click="togglePerSide(ex)">
              <text>单侧</text>
            </view>
          </view>

          <!-- 渐进建议浮条（A4.3） -->
          <view class="suggest-strip" :class="'kind-' + ex.prescription.kind">
            <view class="suggest-icon">
              <text>{{ suggestIcon(ex.prescription.kind) }}</text>
            </view>
            <view class="suggest-text">
              <text class="suggest-title">{{ ex.prescription.title }}</text>
              <text class="suggest-why">{{ ex.prescription.detail }}</text>
            </view>
          </view>

          <!-- 组列表 -->
          <view class="sets">
            <view
              v-for="row in ex.rows"
              :key="row.key"
              class="set-swipe-wrap"
            >
              <view class="swipe-bg swipe-bg-left">
                <text>复制</text>
              </view>
              <view class="swipe-bg swipe-bg-right">
                <text>删除</text>
              </view>

              <view
                class="set-row"
                :class="{ done: row.done, 'is-swiping': swipeKey === row.key }"
                :style="rowStyle(row)"
                @touchstart="onRowTouchStart($event, row)"
                @touchmove="onRowTouchMove($event, row)"
                @touchend="onRowTouchEnd($event, ex, row)"
                @touchcancel="cancelSwipe"
              >
                <view class="set-main">
                  <view class="set-flag" :class="'type-' + row.type" @click="toggleEditor(row)">
                    <text class="set-no">{{ row.setNumber }}</text>
                    <text class="set-type">{{ typeShort(row.type) }}</text>
                  </view>

                  <view class="field">
                    <view class="step-btn" @click="stepWeight(ex, row, -1)">
                      <text>−</text>
                    </view>
                    <input
                      class="step-input"
                      type="digit"
                      :value="formatWeight(row.weight)"
                      @blur="commitWeight(ex, row, $event)"
                      @confirm="commitWeight(ex, row, $event)"
                    />
                    <view class="step-btn" @click="stepWeight(ex, row, 1)">
                      <text>+</text>
                    </view>
                    <text class="field-unit">kg</text>
                  </view>

                  <view class="field reps">
                    <view class="step-btn" @click="stepReps(ex, row, -1)">
                      <text>−</text>
                    </view>
                    <input
                      class="step-input"
                      type="number"
                      :value="row.reps"
                      @blur="commitReps(ex, row, $event)"
                      @confirm="commitReps(ex, row, $event)"
                    />
                    <view class="step-btn" @click="stepReps(ex, row, 1)">
                      <text>+</text>
                    </view>
                    <text class="field-unit">次</text>
                  </view>

                  <view class="row-check" :class="{ on: row.done }" @click="toggleRow(ex, row)">
                    <text class="check-mark">✓</text>
                  </view>
                </view>

                <!-- 单侧：左右两行（A4.4） -->
                <view class="side-rows" v-if="row.sides">
                  <view class="side-row" v-for="sideKey in ['L', 'R']" :key="sideKey">
                    <text class="side-label">{{ sideKey === "L" ? "左" : "右" }}</text>
                    <view class="field slim">
                      <view class="step-btn tiny" @click="stepSide(ex, row, sideKey, 'weight', -1)">
                        <text>−</text>
                      </view>
                      <input
                        class="step-input"
                        type="digit"
                        :value="formatWeight(row.sides[sideKey].weight)"
                        @blur="commitSide(ex, row, sideKey, 'weight', $event)"
                        @confirm="commitSide(ex, row, sideKey, 'weight', $event)"
                      />
                      <view class="step-btn tiny" @click="stepSide(ex, row, sideKey, 'weight', 1)">
                        <text>+</text>
                      </view>
                      <text class="field-unit">kg</text>
                    </view>
                    <view class="field slim">
                      <view class="step-btn tiny" @click="stepSide(ex, row, sideKey, 'reps', -1)">
                        <text>−</text>
                      </view>
                      <input
                        class="step-input"
                        type="number"
                        :value="row.sides[sideKey].reps"
                        @blur="commitSide(ex, row, sideKey, 'reps', $event)"
                        @confirm="commitSide(ex, row, sideKey, 'reps', $event)"
                      />
                      <view class="step-btn tiny" @click="stepSide(ex, row, sideKey, 'reps', 1)">
                        <text>+</text>
                      </view>
                      <text class="field-unit">次</text>
                    </view>
                    <view
                      class="row-check small"
                      :class="{ on: row.sides[sideKey].done }"
                      @click="toggleSide(ex, row, sideKey)"
                    >
                      <text class="check-mark">✓</text>
                    </view>
                  </view>
                </view>

                <!-- 角标 -->
                <view class="badges" v-if="row.prefilled || row.rir != null || row.isPr">
                  <text class="badge last" v-if="row.prefilled">上次</text>
                  <text class="badge rir" v-if="row.rir != null">RIR {{ row.rir }}</text>
                  <text class="badge pr" v-if="row.isPr">PR {{ prLabel(row.prTypes) }}</text>
                </view>
              </view>

              <!-- 组类型 / RIR 编辑面板 -->
              <view class="row-editor" v-if="expandedRowKey === row.key">
                <view class="editor-block">
                  <text class="editor-label">组类型</text>
                  <view class="chip-row">
                    <view
                      v-for="t in setTypes"
                      :key="t.value"
                      class="chip"
                      :class="{ on: row.type === t.value }"
                      @click="pickType(ex, row, t.value)"
                    >
                      <text>{{ t.short }}</text>
                    </view>
                  </view>
                </view>
                <view class="editor-block">
                  <text class="editor-label">RIR（还能做几次）</text>
                  <view class="chip-row">
                    <view
                      v-for="r in rirOptions"
                      :key="r.value"
                      class="chip rir-chip"
                      :class="[{ on: row.rir === r.value }, 'rir-' + r.value]"
                      @click="pickRir(ex, row, r.value)"
                    >
                      <text>{{ r.label }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>

            <view class="add-set" @click="onAddSet(ex)">
              <text class="add-plus">+</text>
              <text>添加一组</text>
            </view>
          </view>

          <view class="ex-notes" v-if="ex.notes">
            <text class="notes-icon">💡</text>
            <text class="notes-text">{{ ex.notes }}</text>
          </view>
        </view>

        <view class="body-tip">
          <text>左滑删除一组 · 右滑复制一组 · 点组号设置热身/RIR</text>
        </view>
        <view class="body-pad"></view>
      </view>
    </scroll-view>

    <!-- 休息计时器（A4.5 / A4.6） -->
    <view class="rest-wrap">
      <RestTimer ref="restTimer" @finish="onRestFinish" @skip="activeSetLabel = ''" />
    </view>

    <!-- 底部操作条 -->
    <view class="bottom-bar" v-if="session && session.exercises.length">
      <view class="bb-info">
        <text class="bb-main">{{ totals.doneSets }}/{{ totals.totalSets }} 组</text>
        <text class="bb-sub">{{ totals.volume }} kg · {{ totals.doneExerciseCount }} 个动作</text>
      </view>
      <view class="bb-btn" :class="{ disabled: !canFinish }" @click="openSummary">
        <text>完成训练</text>
      </view>
    </view>

    <!-- PR 提示（A4.7） -->
    <view class="pr-toast" v-if="prToast" :key="prToast.id">
      <text class="pr-toast-icon">🏆</text>
      <text class="pr-toast-text">{{ prToast.text }}</text>
    </view>

    <!-- 撤销删除（A4.8） -->
    <view class="undo-bar" v-if="undo">
      <text class="undo-text">{{ undo.label }}</text>
      <view class="undo-btn" @click="doUndo">
        <text>撤销</text>
      </view>
    </view>

    <!-- 完成汇总（A4.10） -->
    <view class="sheet-mask" v-if="summaryVisible" @click="closeSummary">
      <view class="sheet" @click.stop>
        <view class="sheet-handle"></view>
        <text class="sheet-title">本次训练</text>
        <text class="sheet-sub">{{ planName }}{{ dayName ? " · " + dayName : "" }}</text>

        <view class="stat-grid">
          <view class="stat-card">
            <text class="stat-value">{{ summary.durationLabel }}</text>
            <text class="stat-label">训练时长</text>
          </view>
          <view class="stat-card">
            <text class="stat-value">{{ summary.volume }}</text>
            <text class="stat-label">总容量 kg</text>
          </view>
          <view class="stat-card">
            <text class="stat-value">{{ summary.doneSets }}</text>
            <text class="stat-label">完成组数</text>
          </view>
          <view class="stat-card">
            <text class="stat-value">{{ summary.doneExerciseCount }}</text>
            <text class="stat-label">动作数</text>
          </view>
        </view>

        <view class="sheet-section" v-if="summaryPrs.length">
          <view class="section-head">
            <text class="section-title">新纪录</text>
            <text class="section-count">{{ summaryPrs.length }}</text>
          </view>
          <view class="pr-item" v-for="(pr, i) in summaryPrs" :key="i">
            <text class="pr-name">{{ pr.exerciseName }}</text>
            <text class="pr-detail">
              第 {{ pr.setNumber }} 组 {{ formatWeight(pr.weight) }}kg × {{ pr.reps }}
            </text>
            <text class="pr-type">{{ prLabel(pr.types) }}</text>
          </view>
        </view>

        <view class="sheet-section" v-if="summaryNext.length">
          <view class="section-head">
            <text class="section-title">下一课建议</text>
          </view>
          <view class="next-item" v-for="(n, i) in summaryNext" :key="i">
            <text class="next-name">{{ n.name }}</text>
            <text class="next-text">{{ n.text }}</text>
          </view>
        </view>

        <view class="date-row">
          <text class="date-label">训练日期</text>
          <picker mode="date" :value="workoutDate" @change="onDateChange">
            <view class="date-value">
              <text>{{ workoutDate }}</text>
              <uni-icons type="calendar" size="16" color="#2F6BFF"></uni-icons>
            </view>
          </picker>
        </view>
        <text class="date-hint">补记"纸上训练"时把日期改到实际训练那天</text>

        <view class="sheet-actions">
          <view class="btn-primary" :class="{ disabled: saving }" @click="saveWorkout">
            <text>{{ saving ? "保存中..." : "保存训练" }}</text>
          </view>
          <view class="btn-ghost" @click="closeSummary">
            <text>继续训练</text>
          </view>
        </view>
        <text class="abandon-link" @click="confirmAbandon">放弃本次训练</text>
      </view>
    </view>
  </view>
</template>

<script>
import RestTimer from "@/components/RestTimer.vue";
import AppIcon from "@/components/AppIcon.vue";
import { FILE_BASE_URL } from "@/utils/request";
import { getTrainingPlanDays, getTrainingPlanDetail, recordWorkout, saveWorkoutDetails } from "@/api/index";
import { useTrainingStore } from "@/stores/training";
import { fetchHistoryProfile } from "@/utils/training/history";
import {
  buildSession,
  annotatePrs,
  sessionTotals,
  sessionPrs,
  toDetailRows,
  toRecordPayload,
  nextSuggestions,
  updateRow,
  updateSide,
  setRowDone,
  setSideDone,
  addRow,
  duplicateRow,
  removeRow,
  setPerSide,
  setRowType,
  stepOf,
  hasWork,
  findRow,
  formatWeight,
  SET_TYPES,
  PR_LABEL,
} from "@/utils/training/session";
import { MUSCLE_NAME } from "@/utils/training/muscles-data.mjs";

const DRAFT_DEBOUNCE = 600;

const authHeader = () => {
  const token = uni.getStorageSync("token") || "mock-jwt-token-1";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

/** 静默请求：历史窗口失败时不能让全局弹窗打断训练（ADR-1 的离线兜底） */
const silentRequest = (options) =>
  new Promise((resolve, reject) => {
    uni.request({
      ...options,
      success: resolve,
      fail: reject,
    });
  });

const pad2 = (n) => String(n).padStart(2, "0");

export default {
  components: { RestTimer, AppIcon },
  data() {
    return {
      planId: null,
      planName: "训练",
      dayNumber: null,
      dayName: "",
      focus: "",
      session: null,
      profile: null,
      profileReady: false,
      resumed: false,
      loading: true,
      loadError: "",
      optionDayNumber: null,

      nowTs: Date.now(),
      elapsed: 0,
      clockTimer: null,
      draftTimer: null,

      swipeKey: "",
      swipeOffset: 0,
      swipeAnimating: false,
      swipeStart: null,
      swipeAxis: "",

      expandedRowKey: "",
      setTypes: SET_TYPES,
      rirOptions: [
        { value: 0, label: "0" },
        { value: 1, label: "1" },
        { value: 2, label: "2" },
        { value: 3, label: "3" },
        { value: 4, label: "4+" },
      ],

      activeSetLabel: "",
      undo: null,
      prToast: null,

      summaryVisible: false,
      summaryPrList: [],
      summaryNextList: [],
      workoutDate: "",
      saving: false,
      /** 本会话是否写过草稿（决定"没进度时"要不要清） */
      draftSaved: false,
    };
  },
  computed: {
    totals() {
      return this.session
        ? sessionTotals(this.session)
        : { doneSets: 0, totalSets: 0, volume: 0, doneExerciseCount: 0, exerciseCount: 0 };
    },
    progressPercent() {
      if (!this.totals.totalSets) return 0;
      return Math.min(100, Math.round((this.totals.doneSets / this.totals.totalSets) * 100));
    },
    elapsedLabel() {
      const sec = Math.max(0, Math.floor(this.elapsed / 1000));
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = sec % 60;
      return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`;
    },
    canFinish() {
      return this.totals.doneSets > 0;
    },
    summary() {
      if (!this.session) {
        return { durationLabel: "0:00", volume: 0, doneSets: 0, doneExerciseCount: 0 };
      }
      const minutes = Math.max(1, Math.round(this.elapsed / 60000));
      return {
        durationLabel: `${minutes} 分钟`,
        volume: this.totals.volume,
        doneSets: this.totals.doneSets,
        doneExerciseCount: this.totals.doneExerciseCount,
      };
    },
    summaryPrs() {
      return this.summaryPrList;
    },
    summaryNext() {
      return this.summaryNextList;
    },
  },
  onLoad(options = {}) {
    this.optionDayNumber = options.dayNumber ? Number(options.dayNumber) : null;
    if (options.planId) this.planId = options.planId;
    this.workoutDate = this.todayISO();
    this.load();
    this.startClock();
    this.keepScreenOn(true);
  },
  onHide() {
    this.saveDraft(true);
  },
  onUnload() {
    this.stopClock();
    this.keepScreenOn(false);
    // 有进度则留下草稿，下次进入可恢复（A4.11）
    if (this.session && hasWork(this.session)) this.saveDraft(true);
    if (this.undo && this.undo.timer) clearTimeout(this.undo.timer);
    if (this.prToast && this.prToast.timer) clearTimeout(this.prToast.timer);
  },
  methods: {
    formatWeight,
    pad2,

    // ── 加载 ────────────────────────────────────────────────────────────────
    todayISO() {
      const d = new Date();
      return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    },

    async load() {
      this.loading = true;
      this.loadError = "";
      try {
        const active = await this.loadActivePlan();
        const planId = this.planId || (active && active.planId);
        if (!planId) {
          this.loading = false;
          this.loadError = "还没有激活的训练计划";
          return;
        }
        this.planId = planId;
        // 只有"这个计划"就是激活计划时，才用激活计划的信息（名称/进度日）
        const isActivePlan = !!active && String(active.planId) === String(planId);
        if (isActivePlan && active.plan) {
          this.planName = active.plan.name || this.planName;
        } else {
          await this.loadPlanName(planId);
        }

        const daysData = await getTrainingPlanDays(planId);
        const days = (daysData && daysData.days) || [];
        if (!days.length) {
          this.loading = false;
          this.loadError = "该计划还没有训练日";
          return;
        }
        const day = this.pickDay(days, isActivePlan ? active : null);
        this.dayNumber = day.dayNumber;
        this.dayName = day.dayName || `第 ${day.dayNumber} 天`;
        this.focus = day.focus || "";

        // 历史窗口：失败不阻塞训练（数据库迁移未执行/弱网都按冷启动处理）
        const profile = await this.loadProfile();
        this.profile = profile;
        this.profileReady = !!profile;

        // 草稿恢复（A4.11）
        const store = useTrainingStore();
        const draft = store.loadGuidedDraft();
        let restored = false;
        if (draft && String(draft.session.planId) === String(planId)) {
          const keep = await this.confirmResume(draft);
          if (keep) {
            this.session = annotatePrs(this.restoreSession(draft.session), this.profile);
            restored = true;
            this.resumed = true;
            this.draftSaved = true;
            this.workoutDate = this.todayISO();
            store.setGuidedSession(this.session);
          } else {
            store.clearGuidedDraft();
          }
        }

        if (!restored) {
          this.session = annotatePrs(
            buildSession({
              planId,
              planName: this.planName,
              dayNumber: this.dayNumber,
              dayName: this.dayName,
              focus: this.focus,
              exercises: day.exercises || [],
              profile,
              startedAt: Date.now(),
            }),
            profile
          );
          store.setGuidedSession(this.session);
        }
        this.startClock();
        this.loading = false;
      } catch (error) {
        console.error("[GuidedTraining] 加载失败:", error);
        this.loading = false;
        this.loadError = "训练数据加载失败";
      }
    },

    async loadActivePlan() {
      try {
        const res = await silentRequest({
          url: `${FILE_BASE_URL}/api/user-active-plan/active`,
          method: "GET",
          header: authHeader(),
          timeout: 8000,
        });
        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          return res.data.data || null;
        }
      } catch (error) {
        // 无激活计划或弱网：继续走 options.planId
      }
      return null;
    },

    async loadPlanName(planId) {
      try {
        const plan = await getTrainingPlanDetail(planId);
        if (plan && plan.name) this.planName = plan.name;
      } catch (error) {
        // 名称只是展示，失败不阻塞
      }
    },

    async loadProfile() {
      try {
        const profile = await fetchHistoryProfile(silentRequest, FILE_BASE_URL, 90, authHeader());
        return profile;
      } catch (error) {
        console.warn("[GuidedTraining] 历史窗口不可用，按冷启动处理:", error && error.message);
        return null;
      }
    },

    pickDay(days, active) {
      const wanted = Number(this.optionDayNumber || (active && active.currentDay) || 0);
      if (wanted) {
        const hit = days.find((d) => Number(d.dayNumber) === wanted);
        if (hit) return hit;
      }
      // 无进度信息时按"今天"取顺序训练日（周一 → 第 1 天）
      const idx = (new Date().getDay() + 6) % 7;
      return days[idx % days.length] || days[0];
    },

    confirmResume(draft) {
      return new Promise((resolve) => {
        const done = (draft.session.exercises || []).reduce(
          (sum, ex) => sum + (ex.rows || []).filter((r) => r.done).length,
          0
        );
        uni.showModal({
          title: "继续上次训练？",
          content: `上次训练还有 ${done} 组未保存的进度，可以接着练。`,
          confirmText: "继续",
          cancelText: "重新开始",
          success: (res) => resolve(!!res.confirm),
          fail: () => resolve(false),
        });
      });
    },

    /** 草稿恢复：不信任历史的 UI 瞬态字段，补齐必需结构 */
    restoreSession(raw) {
      const session = { ...raw };
      session.exercises = (session.exercises || []).map((ex) => ({
        ...ex,
        params: ex.params || {},
        rows: (ex.rows || []).map((row) => ({
          ...row,
          isPr: false,
          prTypes: [],
          sides: row.sides
            ? {
                L: { ...row.sides.L, done: !!row.sides.L.done },
                R: { ...row.sides.R, done: !!row.sides.R.done },
              }
            : null,
        })),
      }));
      return session;
    },

    // ── 时钟 ────────────────────────────────────────────────────────────────
    startClock() {
      this.stopClock();
      const tick = () => {
        this.nowTs = Date.now();
        if (this.session) this.elapsed = this.nowTs - (this.session.startedAt || this.nowTs);
      };
      tick();
      this.clockTimer = setInterval(tick, 1000);
    },

    stopClock() {
      if (this.clockTimer) {
        clearInterval(this.clockTimer);
        this.clockTimer = null;
      }
    },

    keepScreenOn(on) {
      try {
        uni.setKeepScreenOn({ keepScreenOn: !!on });
      } catch (error) {
        // 部分平台不支持，忽略
      }
    },

    // ── 会话变更 ────────────────────────────────────────────────────────────
    /**
     * 所有组操作都经这里落盘：
     * 1) PR 标记重新计算（A4.7）2) 写内存与草稿（A4.11）3) 判断是否需要弹 PR
     */
    apply(next, options = {}) {
      const before = this.session;
      // 没有任何完成组时不必跑 PR 判定（O(历史) 的重活）；
      // 但"刚取消完最后一组"要跑，否则取消的组还挂着 PR 角标
      const needPr = hasWork(next) || (before && hasWork(before));
      const annotated = needPr ? annotatePrs(next, this.profile) : next;
      this.session = annotated;
      useTrainingStore().setGuidedSession(annotated);
      this.scheduleDraft();

      if (options.prFrom) {
        const { ex, row } = options.prFrom;
        const now = findRow(annotated, ex.key, row.key);
        const before2 = before && findRow(before, ex.key, row.key);
        const wasPr = before2 && before2.prTypes && before2.prTypes.length;
        if (now && now.isPr && !wasPr) {
          this.showPrToast(now.prTypes, ex, now);
        }
      }
      return annotated;
    },

    toggleRow(ex, row) {
      const done = !row.done;
      const next = setRowDone(this.session, ex.key, row.key, done);
      this.apply(next, done ? { prFrom: { ex, row } } : {});
      if (done) this.afterRowDone(ex, row);
      else this.expandedRowKey = "";
    },

    toggleSide(ex, row, side) {
      const done = !row.sides[side].done;
      let next = setSideDone(this.session, ex.key, row.key, side, done);
      const rowAfter = findRow(next, ex.key, row.key);
      this.apply(next, rowAfter && rowAfter.done ? { prFrom: { ex, row: rowAfter } } : {});
      if (rowAfter && rowAfter.done) this.afterRowDone(ex, rowAfter);
    },

    /** 完成一组后的即时反馈：PR 已由 apply 处理，这里启动休息计时（A4.5） */
    afterRowDone(ex, row) {
      this.expandedRowKey = "";
      if (ex.restSeconds > 0) {
        this.activeSetLabel = `${ex.name} · 第 ${row.setNumber} 组`;
        this.$nextTick(() => {
          if (this.$refs.restTimer) {
            this.$refs.restTimer.start(ex.restSeconds, {
              title: `${ex.name} · 第 ${row.setNumber} 组`,
              sub: `建议休息 ${ex.restSeconds} 秒`,
            });
          }
        });
      }
      try {
        uni.vibrateShort({ type: "light" });
      } catch (error) {
        // 忽略
      }
    },

    onRestFinish() {
      try {
        uni.showToast({ title: "休息结束，开始下一组", icon: "none", duration: 1600 });
      } catch (error) {
        // 忽略
      }
    },

    stepWeight(ex, row, dir) {
      const step = stepOf(ex, this.session.unit);
      const weight = Math.max(0, Math.round((row.weight + dir * step) * 100) / 100);
      this.apply(updateRow(this.session, ex.key, row.key, { weight }));
    },

    stepReps(ex, row, dir) {
      this.apply(
        updateRow(this.session, ex.key, row.key, { reps: Math.max(0, row.reps + dir) })
      );
    },

    commitWeight(ex, row, e) {
      const value = Number(e.detail.value);
      if (!Number.isFinite(value)) return;
      this.apply(updateRow(this.session, ex.key, row.key, { weight: value }));
    },

    commitReps(ex, row, e) {
      const value = Number(e.detail.value);
      if (!Number.isFinite(value)) return;
      this.apply(updateRow(this.session, ex.key, row.key, { reps: value }));
    },

    stepSide(ex, row, side, field, dir) {
      const cur = row.sides[side][field];
      const step = field === "weight" ? stepOf(ex, this.session.unit) : 1;
      const value = Math.max(0, Math.round((Number(cur) + dir * step) * 100) / 100);
      this.apply(updateSide(this.session, ex.key, row.key, side, { [field]: value }));
    },

    commitSide(ex, row, side, field, e) {
      const value = Number(e.detail.value);
      if (!Number.isFinite(value)) return;
      this.apply(updateSide(this.session, ex.key, row.key, side, { [field]: value }));
    },

    toggleEditor(row) {
      this.expandedRowKey = this.expandedRowKey === row.key ? "" : row.key;
    },

    pickType(ex, row, type) {
      this.apply(setRowType(this.session, ex.key, row.key, type));
    },

    pickRir(ex, row, value) {
      const rir = row.rir === value ? null : value;
      this.apply(updateRow(this.session, ex.key, row.key, { rir }));
    },

    onAddSet(ex) {
      this.apply(addRow(this.session, ex.key));
    },

    togglePerSide(ex) {
      this.apply(setPerSide(this.session, ex.key, !ex.perSide));
    },

    // ── 滑动：左删右复制（A4.8 / A4.9）─────────────────────────────────────
    rowStyle(row) {
      if (this.swipeKey !== row.key) {
        return { transform: "translateX(0)", transition: "transform 0.18s ease" };
      }
      return {
        transform: `translateX(${this.swipeOffset}px)`,
        transition: this.swipeAnimating ? "transform 0.18s ease" : "none",
      };
    },

    onRowTouchStart(e, row) {
      const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
      if (!t) return;
      this.swipeKey = row.key;
      this.swipeOffset = 0;
      this.swipeAnimating = false;
      this.swipeStart = { x: t.clientX, y: t.clientY };
      this.swipeAxis = "";
    },

    onRowTouchMove(e, row) {
      if (this.swipeKey !== row.key || !this.swipeStart) return;
      const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
      if (!t) return;
      const dx = t.clientX - this.swipeStart.x;
      const dy = t.clientY - this.swipeStart.y;
      if (!this.swipeAxis) {
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
          // 纵向：让页面正常滚动，放弃本次滑动
          this.swipeAxis = "y";
          this.swipeKey = "";
          return;
        }
        if (Math.abs(dx) > 10) this.swipeAxis = "x";
      }
      if (this.swipeAxis !== "x") return;
      // 右滑复制上限小一些，左滑删除展示更宽
      this.swipeOffset = Math.max(-150, Math.min(110, dx));
    },

    onRowTouchEnd(e, ex, row) {
      if (this.swipeAxis !== "x") {
        this.cancelSwipe();
        return;
      }
      const offset = this.swipeOffset;
      this.swipeAnimating = true;
      this.swipeKey = "";
      this.swipeOffset = 0;
      if (offset <= -70) {
        this.deleteRow(ex, row);
      } else if (offset >= 70) {
        this.apply(duplicateRow(this.session, ex.key, row.key));
        this.toast("已复制一组");
      }
    },

    cancelSwipe() {
      this.swipeAnimating = true;
      this.swipeKey = "";
      this.swipeOffset = 0;
      this.swipeStart = null;
      this.swipeAxis = "";
    },

    deleteRow(ex, row) {
      const snapshot = this.session;
      const label = `已删除 ${ex.name} 第 ${row.setNumber} 组`;
      this.apply(removeRow(this.session, ex.key, row.key));
      if (this.undo && this.undo.timer) clearTimeout(this.undo.timer);
      this.undo = {
        snapshot,
        label,
        timer: setTimeout(() => {
          this.undo = null;
        }, 5000),
      };
    },

    doUndo() {
      if (!this.undo) return;
      clearTimeout(this.undo.timer);
      const snapshot = this.undo.snapshot;
      this.undo = null;
      this.session = annotatePrs(snapshot, this.profile);
      useTrainingStore().setGuidedSession(this.session);
      this.scheduleDraft();
    },

    // ── 提示 ────────────────────────────────────────────────────────────────
    showPrToast(prTypes, ex, row) {
      const labels = prTypes.map((t) => PR_LABEL[t] || t).join(" / ");
      const est = prTypes.includes("1rm") && row ? this.estimate(row) : 0;
      const suffix = est > 0 ? `（1RM 约 ${formatWeight(est)}kg）` : "";
      const text = `${ex.name} 新纪录 · ${labels}${suffix}`;
      this.prToast = { id: Date.now(), text, timer: null };
      this.prToast.timer = setTimeout(() => {
        this.prToast = null;
      }, 2600);
      try {
        uni.vibrateShort({ type: "medium" });
      } catch (error) {
        // 忽略
      }
    },

    estimate(row) {
      if (row.sides) {
        const one = (w, r) => (w && r ? w * (1 + r / 30) : 0);
        return Math.round(Math.max(
          one(Number(row.sides.L.weight), Number(row.sides.L.reps)),
          one(Number(row.sides.R.weight), Number(row.sides.R.reps))
        ) * 10) / 10;
      }
      const w = Number(row.weight) || 0;
      const r = Number(row.reps) || 0;
      if (!w || !r) return 0;
      return Math.round(w * (1 + r / 30) * 10) / 10;
    },

    toast(title) {
      try {
        uni.showToast({ title, icon: "none", duration: 1500 });
      } catch (error) {
        // 忽略
      }
    },

    // ── 展示工具 ────────────────────────────────────────────────────────────
    rangeLabel(ex) {
      return ex.repsMin === ex.repsMax ? String(ex.repsMax) : `${ex.repsMin}-${ex.repsMax}`;
    },

    typeShort(type) {
      const hit = SET_TYPES.find((t) => t.value === type);
      return hit ? hit.short : "正式";
    },

    prLabel(types) {
      if (!types || !types.length) return "PR";
      return types.map((t) => PR_LABEL[t] || t).join("/");
    },

    muscleLabel(slug) {
      return MUSCLE_NAME[slug] || slug;
    },

    suggestIcon(kind) {
      return { first: "📊", up: "📈", hold: "＝", deload: "🔻", off: "🔒" }[kind] || "📊";
    },

    isExerciseDone(ex) {
      return ex.rows.length > 0 && ex.rows.every((r) => r.done);
    },

    // ── 草稿 ────────────────────────────────────────────────────────────────
    scheduleDraft() {
      if (this.draftTimer) clearTimeout(this.draftTimer);
      this.draftTimer = setTimeout(() => this.saveDraft(), DRAFT_DEBOUNCE);
    },

    saveDraft(immediate = false) {
      if (!this.session) return;
      if (immediate && this.draftTimer) {
        clearTimeout(this.draftTimer);
        this.draftTimer = null;
      }
      const store = useTrainingStore();
      // 只保留有进度的草稿，避免"打开就退出"留下一堆空草稿；
      // 只有本会话确实写过草稿时才清，免得误删别的计划还没保存的进度
      if (hasWork(this.session)) {
        if (store.saveGuidedDraft(this.session)) this.draftSaved = true;
      } else if (this.draftSaved) {
        store.clearGuidedDraft();
        this.draftSaved = false;
      }
    },

    // ── 汇总与保存 ──────────────────────────────────────────────────────────
    openSummary() {
      if (!this.session) return;
      if (!this.canFinish) {
        this.toast("先完成至少一组再结束训练");
        return;
      }
      if (this.$refs.restTimer) this.$refs.restTimer.stop();
      // 汇总只算一次：完成页打开后每秒重渲染不应重复跑引擎
      this.summaryPrList = sessionPrs(this.session);
      this.summaryNextList = nextSuggestions(this.session, this.profile, 3);
      this.summaryVisible = true;
      this.workoutDate = this.todayISO();
    },

    closeSummary() {
      this.summaryVisible = false;
    },

    onDateChange(e) {
      this.workoutDate = e.detail.value;
    },

    async saveWorkout() {
      if (this.saving || !this.session) return;
      if (!this.totals.doneSets) {
        this.toast("还没有完成的组");
        return;
      }
      this.saving = true;
      const details = toDetailRows(this.session);
      const payload = toRecordPayload(this.session, { workoutDate: this.workoutDate });
      try {
        const record = await recordWorkout(payload);
        const recordId = record && record.id;
        let prs = [];
        if (recordId && details.length) {
          try {
            const res = await saveWorkoutDetails(recordId, details);
            prs = (res && res.prs) || [];
          } catch (error) {
            console.error("[GuidedTraining] 组级明细保存失败:", error);
            this.saving = false;
            this.summaryVisible = false;
            // 记录已落库，明细没同步上：清掉草稿与会话，避免 onUnload 又写回草稿
            this.session = null;
            useTrainingStore().resetGuidedSession();
            this.toast("训练已保存，组级明细同步失败");
            setTimeout(() => this.leave(), 1200);
            return;
          }
        }
        this.saving = false;
        this.summaryVisible = false;
        // 先清会话再离开：onUnload 不该再写回草稿
        this.session = null;
        const store = useTrainingStore();
        store.resetGuidedSession();
        // 组级明细里的 planExerciseId 会让后端把计划动作标记为已完成：
        // 主动刷新训练日进度，回到计划详情时打卡状态才是新的
        if (this.planId) store.fetchPlanDays(this.planId, true);
        this.toast(prs.length ? `训练已保存 · 刷新 ${prs.length} 项纪录` : "训练已保存");
        setTimeout(() => this.leave(), 900);
      } catch (error) {
        console.error("[GuidedTraining] 保存训练失败:", error);
        this.saving = false;
        this.saveDraft(true);
        this.toast("保存失败，进度已存为草稿");
      }
    },

    leave() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        uni.navigateBack({ delta: 1 });
      } else {
        uni.switchTab({ url: "/pages/record/record" });
      }
    },

    // ── 退出 ────────────────────────────────────────────────────────────────
    onBack() {
      if (!this.session || !hasWork(this.session)) {
        this.leave();
        return;
      }
      this.saveDraft(true);
      uni.showModal({
        title: "退出训练台？",
        content: "当前进度已自动保存，下次进入可以继续。",
        confirmText: "退出",
        cancelText: "继续训练",
        success: (res) => {
          if (res.confirm) this.leave();
        },
      });
    },

    confirmAbandon() {
      uni.showModal({
        title: "放弃本次训练？",
        content: "所有已完成的组都会被丢弃，且不会写入训练记录。",
        confirmText: "放弃",
        cancelText: "再想想",
        confirmColor: "#EF4444",
        success: (res) => {
          if (!res.confirm) return;
          useTrainingStore().resetGuidedSession();
          this.summaryVisible = false;
          this.session = null;
          this.leave();
        },
      });
    },

    goPlanList() {
      uni.navigateTo({ url: "/pages/knowledge/training-plan-list" });
    },
  },
};
</script>

<style scoped>
.gt-page {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(180deg, #f4f7ff 0%, #eef2ff 100%);
  overflow: hidden;
}

.bg-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(60rpx);
  opacity: 0.55;
  pointer-events: none;
  z-index: 0;
}

.bg-orb-1 {
  width: 420rpx;
  height: 420rpx;
  top: -120rpx;
  right: -120rpx;
  background: radial-gradient(circle, rgba(47, 107, 255, 0.28) 0%, rgba(47, 107, 255, 0) 70%);
}

.bg-orb-2 {
  width: 380rpx;
  height: 380rpx;
  bottom: 120rpx;
  left: -140rpx;
  background: radial-gradient(circle, rgba(138, 92, 255, 0.22) 0%, rgba(138, 92, 255, 0) 70%);
}

/* ── 导航 ─────────────────────────────────────────────────────────────── */
.gt-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: calc(var(--status-bar-height, 0px) + 16rpx) 24rpx 16rpx;
  background: rgba(244, 247, 255, 0.86);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  border-bottom: 1rpx solid rgba(47, 107, 255, 0.06);
}

.nav-back {
  width: 64rpx;
  height: 64rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 4rpx 12rpx rgba(15, 23, 42, 0.06);
}

.nav-title-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}

.nav-title {
  font-size: 30rpx;
  font-weight: 800;
  color: #0f172a;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.nav-sub {
  font-size: 20rpx;
  color: #64748b;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.nav-clock {
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
  background: rgba(47, 107, 255, 0.08);
}

.clock-value {
  font-size: 24rpx;
  font-weight: 700;
  color: #2f6bff;
  font-variant-numeric: tabular-nums;
}

.nav-finish {
  padding: 12rpx 24rpx;
  border-radius: 18rpx;
  background: linear-gradient(135deg, #2f6bff 0%, #8a5cff 100%);
  box-shadow: 0 8rpx 20rpx rgba(47, 107, 255, 0.28);
}

.nav-finish text {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
}

/* ── 进度 ─────────────────────────────────────────────────────────────── */
.gt-progress {
  position: fixed;
  top: calc(var(--status-bar-height, 0px) + 96rpx);
  left: 0;
  right: 0;
  z-index: 59;
  padding: 12rpx 32rpx 10rpx;
  background: rgba(244, 247, 255, 0.86);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.progress-track {
  height: 8rpx;
  border-radius: 8rpx;
  background: rgba(47, 107, 255, 0.1);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 8rpx;
  background: linear-gradient(90deg, #2f6bff 0%, #8a5cff 100%);
  transition: width 0.28s ease;
}

.progress-meta {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 8rpx;
}

.pm-sets {
  font-size: 20rpx;
  font-weight: 700;
  color: #2f6bff;
}

.pm-dot,
.pm-vol {
  font-size: 20rpx;
  color: #64748b;
}

.pm-hint {
  margin-left: auto;
  font-size: 18rpx;
  color: #f59e0b;
}

/* ── 主体 ─────────────────────────────────────────────────────────────── */
.gt-body {
  position: relative;
  z-index: 1;
  height: 100vh;
  box-sizing: border-box;
  padding-top: calc(var(--status-bar-height, 0px) + 168rpx);
}

.body-inner {
  padding: 8rpx 24rpx 0;
}

.resume-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 24rpx;
  margin-bottom: 16rpx;
  border-radius: 20rpx;
  background: rgba(34, 197, 94, 0.1);
  border: 1rpx solid rgba(34, 197, 94, 0.2);
}

.resume-text {
  font-size: 22rpx;
  color: #15803d;
  font-weight: 600;
}

.resume-close {
  font-size: 22rpx;
  color: #16a34a;
}

/* 动作卡 */
.ex-card {
  margin-bottom: 20rpx;
  padding: 24rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.92);
  border: 1rpx solid rgba(255, 255, 255, 0.7);
  box-shadow:
    0 12rpx 32rpx rgba(15, 23, 42, 0.06),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.8);
}

.ex-card.is-complete {
  background: rgba(240, 253, 244, 0.92);
  border-color: rgba(34, 197, 94, 0.2);
}

.ex-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.ex-index {
  width: 64rpx;
  height: 64rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(47, 107, 255, 0.12) 0%, rgba(138, 92, 255, 0.12) 100%);
}

.ex-index text {
  font-size: 24rpx;
  font-weight: 800;
  color: #2f6bff;
  font-variant-numeric: tabular-nums;
}

.ex-index.done {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.ex-index.done text {
  color: #ffffff;
}

.ex-title-wrap {
  flex: 1;
  min-width: 0;
}

.ex-name {
  font-size: 30rpx;
  font-weight: 800;
  color: #0f172a;
  display: block;
}

.ex-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 8rpx;
}

.meta-chip {
  font-size: 18rpx;
  color: #475569;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  background: rgba(15, 23, 42, 0.05);
}

.meta-chip.muscle {
  color: #7c3aed;
  background: rgba(124, 58, 237, 0.08);
}

.ex-side-toggle {
  padding: 8rpx 16rpx;
  border-radius: 14rpx;
  border: 1rpx solid rgba(15, 23, 42, 0.08);
}

.ex-side-toggle text {
  font-size: 20rpx;
  color: #94a3b8;
}

.ex-side-toggle.on {
  border-color: rgba(47, 107, 255, 0.3);
  background: rgba(47, 107, 255, 0.08);
}

.ex-side-toggle.on text {
  color: #2f6bff;
  font-weight: 700;
}

/* 建议浮条 */
.suggest-strip {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 18rpx;
  padding: 14rpx 18rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, rgba(47, 107, 255, 0.08) 0%, rgba(138, 92, 255, 0.08) 100%);
  border: 1rpx solid rgba(47, 107, 255, 0.12);
}

.suggest-strip.kind-up {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.06) 100%);
  border-color: rgba(34, 197, 94, 0.18);
}

.suggest-strip.kind-deload {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.06) 100%);
  border-color: rgba(245, 158, 11, 0.2);
}

.suggest-strip.kind-off {
  background: rgba(15, 23, 42, 0.04);
  border-color: rgba(15, 23, 42, 0.06);
}

.suggest-icon {
  width: 40rpx;
  height: 40rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
}

.suggest-icon text {
  font-size: 20rpx;
}

.suggest-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}

.suggest-title {
  font-size: 24rpx;
  font-weight: 800;
  color: #0f172a;
}

.suggest-why {
  font-size: 20rpx;
  color: #64748b;
  line-height: 1.35;
}

/* 组 */
.sets {
  margin-top: 16rpx;
}

.set-swipe-wrap {
  position: relative;
  margin-bottom: 12rpx;
  border-radius: 20rpx;
}

.swipe-bg {
  position: absolute;
  inset: 0;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  padding: 0 28rpx;
}

.swipe-bg text {
  font-size: 22rpx;
  font-weight: 700;
  color: #ffffff;
}

.swipe-bg-left {
  background: linear-gradient(90deg, #2f6bff 0%, #6d8dff 100%);
  justify-content: flex-start;
}

.swipe-bg-right {
  background: linear-gradient(90deg, #ff8a8a 0%, #ef4444 100%);
  justify-content: flex-end;
}

.set-row {
  position: relative;
  border-radius: 20rpx;
  background: #ffffff;
  border: 1rpx solid rgba(15, 23, 42, 0.06);
  padding: 14rpx 16rpx;
  touch-action: pan-y;
  z-index: 1;
}

.set-row.done {
  background: rgba(240, 253, 244, 0.9);
  border-color: rgba(34, 197, 94, 0.22);
}

.set-main {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.set-flag {
  width: 74rpx;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6rpx 0;
  border-radius: 14rpx;
  background: rgba(15, 23, 42, 0.04);
}

.set-no {
  font-size: 24rpx;
  font-weight: 800;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}

.set-type {
  font-size: 16rpx;
  color: #94a3b8;
}

.set-flag.type-warmup {
  background: rgba(245, 158, 11, 0.12);
}

.set-flag.type-warmup .set-no,
.set-flag.type-warmup .set-type {
  color: #b45309;
}

.set-flag.type-drop,
.set-flag.type-rest-pause,
.set-flag.type-failure {
  background: rgba(239, 68, 68, 0.1);
}

.set-flag.type-drop .set-no,
.set-flag.type-drop .set-type,
.set-flag.type-rest-pause .set-no,
.set-flag.type-rest-pause .set-type,
.set-flag.type-failure .set-no,
.set-flag.type-failure .set-type {
  color: #dc2626;
}

.field {
  display: flex;
  align-items: center;
  gap: 4rpx;
  flex: 1;
  min-width: 0;
}

.step-btn {
  width: 46rpx;
  height: 46rpx;
  border-radius: 14rpx;
  background: rgba(47, 107, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-btn text {
  font-size: 28rpx;
  font-weight: 700;
  color: #2f6bff;
  line-height: 1;
}

.step-btn.tiny {
  width: 40rpx;
  height: 40rpx;
}

.step-btn.tiny text {
  font-size: 24rpx;
}

.step-input {
  flex: 1;
  min-width: 40rpx;
  height: 46rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: 800;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}

.field-unit {
  font-size: 18rpx;
  color: #94a3b8;
  flex-shrink: 0;
}

.field.reps {
  flex: 0.85;
}

.row-check {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(15, 23, 42, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #ffffff;
}

.row-check.small {
  width: 48rpx;
  height: 48rpx;
}

.row-check .check-mark {
  font-size: 28rpx;
  color: transparent;
  font-weight: 800;
}

.row-check.on {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border-color: transparent;
}

.row-check.on .check-mark {
  color: #ffffff;
}

/* 单侧两行 */
.side-rows {
  margin-top: 10rpx;
  padding-top: 10rpx;
  border-top: 1rpx dashed rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.side-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.side-label {
  width: 40rpx;
  font-size: 22rpx;
  font-weight: 800;
  color: #64748b;
  text-align: center;
  flex-shrink: 0;
}

.field.slim {
  flex: 1;
}

/* 角标 */
.badges {
  display: flex;
  gap: 8rpx;
  margin-top: 10rpx;
  padding-left: 84rpx;
}

.badge {
  font-size: 18rpx;
  padding: 2rpx 10rpx;
  border-radius: 10rpx;
}

.badge.last {
  color: #2f6bff;
  background: rgba(47, 107, 255, 0.08);
}

.badge.rir {
  color: #7c3aed;
  background: rgba(124, 58, 237, 0.08);
}

.badge.pr {
  color: #b45309;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.24) 0%, rgba(245, 158, 11, 0.18) 100%);
  border: 1rpx solid rgba(245, 158, 11, 0.35);
  font-weight: 700;
}

/* 组编辑面板 */
.row-editor {
  margin-top: 8rpx;
  padding: 16rpx;
  border-radius: 20rpx;
  background: rgba(248, 250, 252, 0.96);
  border: 1rpx solid rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.editor-label {
  font-size: 20rpx;
  color: #64748b;
  margin-bottom: 8rpx;
  display: block;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}

.chip {
  padding: 8rpx 18rpx;
  border-radius: 14rpx;
  background: #ffffff;
  border: 1rpx solid rgba(15, 23, 42, 0.08);
}

.chip text {
  font-size: 22rpx;
  color: #475569;
}

.chip.on {
  background: linear-gradient(135deg, #2f6bff 0%, #8a5cff 100%);
  border-color: transparent;
  box-shadow: 0 6rpx 14rpx rgba(47, 107, 255, 0.24);
}

.chip.on text {
  color: #ffffff;
  font-weight: 700;
}

.rir-chip.on {
  background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
  box-shadow: 0 6rpx 14rpx rgba(245, 158, 11, 0.24);
}

.add-set {
  margin-top: 12rpx;
  height: 72rpx;
  border-radius: 18rpx;
  border: 2rpx dashed rgba(47, 107, 255, 0.24);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  background: rgba(47, 107, 255, 0.03);
}

.add-plus {
  font-size: 30rpx;
  color: #2f6bff;
  font-weight: 700;
}

.add-set text:last-child {
  font-size: 22rpx;
  color: #2f6bff;
}

.ex-notes {
  display: flex;
  gap: 8rpx;
  margin-top: 14rpx;
  padding: 12rpx 16rpx;
  border-radius: 16rpx;
  background: rgba(245, 158, 11, 0.08);
}

.notes-text {
  font-size: 20rpx;
  color: #92400e;
  line-height: 1.4;
}

.body-tip {
  text-align: center;
  padding: 20rpx 0 8rpx;
}

.body-tip text {
  font-size: 18rpx;
  color: #94a3b8;
}

.body-pad {
  height: 220rpx;
}

/* ── 休息计时器 / 底栏 ────────────────────────────────────────────────── */
.rest-wrap {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 132rpx;
  z-index: 70;
  pointer-events: none;
}

.rest-wrap :deep(.rest-timer) {
  pointer-events: auto;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 65;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  border-top: 1rpx solid rgba(15, 23, 42, 0.06);
}

.bb-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}

.bb-main {
  font-size: 26rpx;
  font-weight: 800;
  color: #0f172a;
}

.bb-sub {
  font-size: 20rpx;
  color: #64748b;
}

.bb-btn {
  padding: 20rpx 40rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #2f6bff 0%, #8a5cff 100%);
  box-shadow: 0 10rpx 26rpx rgba(47, 107, 255, 0.3);
}

.bb-btn text {
  font-size: 26rpx;
  font-weight: 800;
  color: #ffffff;
}

.bb-btn.disabled {
  background: rgba(148, 163, 184, 0.5);
  box-shadow: none;
}

/* ── PR / 撤销 浮层 ───────────────────────────────────────────────────── */
.pr-toast {
  position: fixed;
  top: calc(var(--status-bar-height, 0px) + 180rpx);
  left: 50%;
  transform: translateX(-50%);
  z-index: 90;
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 14rpx 28rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  box-shadow: 0 12rpx 32rpx rgba(245, 158, 11, 0.4);
  animation: pr-drop 0.32s cubic-bezier(0.22, 1, 0.36, 1);
  max-width: 88vw;
}

.pr-toast-icon {
  font-size: 26rpx;
}

.pr-toast-text {
  font-size: 24rpx;
  font-weight: 800;
  color: #ffffff;
}

@keyframes pr-drop {
  from {
    opacity: 0;
    transform: translate(-50%, -24rpx) scale(0.92);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
}

.undo-bar {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  bottom: 150rpx;
  z-index: 85;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18rpx 24rpx;
  border-radius: 20rpx;
  background: rgba(15, 23, 42, 0.92);
  box-shadow: 0 12rpx 32rpx rgba(15, 23, 42, 0.28);
}

.undo-text {
  font-size: 22rpx;
  color: #ffffff;
}

.undo-btn {
  padding: 8rpx 20rpx;
  border-radius: 14rpx;
  background: rgba(255, 255, 255, 0.16);
}

.undo-btn text {
  font-size: 22rpx;
  color: #ffffff;
  font-weight: 700;
}

/* ── 完成汇总 ─────────────────────────────────────────────────────────── */
.sheet-mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: flex-end;
  animation: mask-in 0.22s ease;
}

@keyframes mask-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.sheet {
  width: 100%;
  max-height: 86vh;
  overflow-y: auto;
  border-radius: 40rpx 40rpx 0 0;
  background: #ffffff;
  padding: 16rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
  animation: sheet-up 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes sheet-up {
  from {
    transform: translateY(40rpx);
    opacity: 0.6;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.sheet-handle {
  width: 72rpx;
  height: 8rpx;
  border-radius: 8rpx;
  background: rgba(15, 23, 42, 0.12);
  margin: 0 auto 20rpx;
}

.sheet-title {
  font-size: 36rpx;
  font-weight: 800;
  color: #0f172a;
  display: block;
  text-align: center;
}

.sheet-sub {
  font-size: 22rpx;
  color: #64748b;
  display: block;
  text-align: center;
  margin-top: 6rpx;
}

.stat-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 24rpx;
}

.stat-card {
  width: calc(50% - 6rpx);
  box-sizing: border-box;
  padding: 20rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, rgba(47, 107, 255, 0.07) 0%, rgba(138, 92, 255, 0.07) 100%);
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.stat-value {
  font-size: 34rpx;
  font-weight: 800;
  color: #2f6bff;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 20rpx;
  color: #64748b;
}

.sheet-section {
  margin-top: 24rpx;
}

.section-head {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 12rpx;
}

.section-title {
  font-size: 26rpx;
  font-weight: 800;
  color: #0f172a;
}

.section-count {
  font-size: 20rpx;
  color: #ffffff;
  background: #f59e0b;
  border-radius: 999rpx;
  padding: 2rpx 12rpx;
}

.pr-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 14rpx 18rpx;
  border-radius: 18rpx;
  background: rgba(251, 191, 36, 0.1);
  border: 1rpx solid rgba(245, 158, 11, 0.2);
  margin-bottom: 8rpx;
}

.pr-name {
  font-size: 24rpx;
  font-weight: 700;
  color: #92400e;
}

.pr-detail {
  font-size: 20rpx;
  color: #b45309;
}

.pr-type {
  margin-left: auto;
  font-size: 18rpx;
  font-weight: 700;
  color: #ffffff;
  background: #f59e0b;
  border-radius: 10rpx;
  padding: 2rpx 10rpx;
}

.next-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14rpx 18rpx;
  border-radius: 18rpx;
  background: rgba(15, 23, 42, 0.03);
  margin-bottom: 8rpx;
}

.next-name {
  font-size: 22rpx;
  color: #334155;
}

.next-text {
  font-size: 22rpx;
  font-weight: 700;
  color: #2f6bff;
}

.date-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24rpx;
  padding: 16rpx 20rpx;
  border-radius: 18rpx;
  background: rgba(15, 23, 42, 0.03);
}

.date-label {
  font-size: 22rpx;
  color: #475569;
}

.date-value {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.date-value text {
  font-size: 24rpx;
  font-weight: 700;
  color: #2f6bff;
}

.date-hint {
  font-size: 18rpx;
  color: #94a3b8;
  margin-top: 8rpx;
  display: block;
}

.sheet-actions {
  display: flex;
  gap: 12rpx;
  margin-top: 24rpx;
}

.btn-primary {
  flex: 1;
  height: 88rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2f6bff 0%, #8a5cff 100%);
  box-shadow: 0 10rpx 26rpx rgba(47, 107, 255, 0.28);
}

.btn-primary text {
  font-size: 28rpx;
  font-weight: 800;
  color: #ffffff;
}

.btn-primary.disabled {
  opacity: 0.6;
}

.btn-ghost {
  flex: 1;
  height: 88rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.05);
}

.btn-ghost text {
  font-size: 28rpx;
  font-weight: 700;
  color: #475569;
}

.abandon-link {
  display: block;
  text-align: center;
  margin-top: 20rpx;
  font-size: 22rpx;
  color: #ef4444;
}

/* ── 空态 / 骨架 ──────────────────────────────────────────────────────── */
.gt-empty {
  position: relative;
  z-index: 1;
  padding: 240rpx 60rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.empty-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: rgba(47, 107, 255, 0.08);
  color: #2f6bff;
  font-size: 40rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-title {
  font-size: 30rpx;
  font-weight: 800;
  color: #0f172a;
}

.empty-desc {
  font-size: 22rpx;
  color: #64748b;
  text-align: center;
  line-height: 1.5;
}

.empty-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
}

.empty-actions .btn-primary,
.empty-actions .btn-ghost {
  padding: 0 48rpx;
  height: 80rpx;
}

.skeleton-card {
  margin: 0 24rpx 20rpx;
  padding: 24rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.85);
}

.sk-line {
  height: 28rpx;
  border-radius: 10rpx;
  background: #e8eefc;
  margin-bottom: 14rpx;
}

.sk-title {
  width: 48%;
}

.sk-sub {
  width: 68%;
  height: 20rpx;
}

.sk-row {
  height: 76rpx;
  border-radius: 18rpx;
  background: #eef3ff;
  margin-top: 10rpx;
}

.skeleton-shimmer {
  background-image: linear-gradient(90deg, #e8eefc 0%, #f6f9ff 50%, #e8eefc 100%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite linear;
}

@keyframes shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}
</style>
