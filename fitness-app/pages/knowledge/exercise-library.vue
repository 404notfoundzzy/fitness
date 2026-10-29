<template>
  <view class="lib-page">
    <view class="bg-orb bg-orb-1"></view>
    <view class="bg-orb bg-orb-2"></view>

    <view class="lib-nav">
      <view class="nav-back" @click="goBack">
        <AppIcon name="left" :size="44" active-color="#0F172A" :breathe="false" />
      </view>
      <view class="nav-title-wrap">
        <text class="nav-title">动作库</text>
        <text class="nav-sub">{{ total ? total + " 个动作" : "按肌肉 / 器械 / 来源筛选" }}</text>
      </view>
      <view class="nav-group-toggle" :class="{ on: groupByMuscle }" @click="toggleGroup">
        <text>{{ groupByMuscle ? "分组" : "列表" }}</text>
      </view>
    </view>

    <view class="lib-toolbar">
      <view class="search-box">
        <uni-icons type="search" size="18" color="#94A3B8"></uni-icons>
        <input
          type="text"
          v-model="query"
          confirm-type="search"
          placeholder="搜索动作名称 / 肌群..."
          placeholder-style="color:#94A3B8"
          @input="onSearchInput"
          @confirm="applyFilters"
        />
        <view class="search-clear" v-if="query" @click="clearQuery">
          <text>×</text>
        </view>
      </view>

      <scroll-view scroll-x class="chip-scroll" :show-scrollbar="false">
        <view class="chip-line">
          <view
            v-for="s in sources"
            :key="s.value"
            class="chip"
            :class="{ on: source === s.value }"
            @click="pickSource(s.value)"
          >
            <text>{{ s.label }}</text>
          </view>
          <view class="chip-divider"></view>
          <view
            v-for="m in muscles"
            :key="m.value"
            class="chip muscle"
            :class="{ on: muscle === m.value }"
            @click="pickMuscle(m.value)"
          >
            <text>{{ m.label }}</text>
          </view>
        </view>
      </scroll-view>

      <scroll-view scroll-x class="chip-scroll" :show-scrollbar="false">
        <view class="chip-line">
          <view
            v-for="e in equipments"
            :key="e.value"
            class="chip equipment"
            :class="{ on: equipment === e.value }"
            @click="pickEquipment(e.value)"
          >
            <text>{{ e.label }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <scroll-view
      scroll-y
      class="lib-body"
      :show-scrollbar="false"
      @scrolltolower="loadMore"
      :lower-threshold="120"
    >
      <view v-if="loading && !list.length" class="lib-skeleton">
        <view v-for="i in 6" :key="i" class="sk-item">
          <view class="sk-avatar skeleton-shimmer"></view>
          <view class="sk-lines">
            <view class="sk-line w60 skeleton-shimmer"></view>
            <view class="sk-line w40 skeleton-shimmer"></view>
          </view>
        </view>
      </view>

      <view v-else-if="!list.length" class="lib-empty">
        <view class="empty-icon">
          <uni-icons type="search" size="32" color="#94A3B8"></uni-icons>
        </view>
        <text class="empty-title">没有找到匹配的动作</text>
        <text class="empty-desc">{{ emptyHint }}</text>
        <view class="empty-btn" @click="resetFilters">
          <text>重置筛选</text>
        </view>
      </view>

      <view v-else class="lib-list">
        <template v-if="groupByMuscle">
          <view v-for="group in groups" :key="group.key" class="group">
            <view class="group-head">
              <text class="group-title">{{ group.label }}</text>
              <text class="group-count">{{ group.items.length }}</text>
            </view>
            <view
              v-for="item in group.items"
              :key="item.id"
              class="ex-item"
              @click="openDetail(item)"
            >
              <view class="ex-avatar" :class="'src-' + (item.source || 'system')">
                <text>{{ initials(item) }}</text>
              </view>
              <view class="ex-info">
                <view class="ex-name-row">
                  <text class="ex-name">{{ item.name }}</text>
                  <text class="ex-source" :class="'src-' + (item.source || 'system')">
                    {{ sourceLabel(item.source) }}
                  </text>
                </view>
                <text class="ex-sub">{{ subline(item) }}</text>
              </view>
              <uni-icons type="right" size="14" color="#CBD5E1"></uni-icons>
            </view>
          </view>
        </template>
        <template v-else>
          <view
            v-for="item in list"
            :key="item.id"
            class="ex-item"
            @click="openDetail(item)"
          >
            <view class="ex-avatar" :class="'src-' + (item.source || 'system')">
              <text>{{ initials(item) }}</text>
            </view>
            <view class="ex-info">
              <view class="ex-name-row">
                <text class="ex-name">{{ item.name }}</text>
                <text class="ex-source" :class="'src-' + (item.source || 'system')">
                  {{ sourceLabel(item.source) }}
                </text>
              </view>
              <text class="ex-sub">{{ subline(item) }}</text>
            </view>
            <uni-icons type="right" size="14" color="#CBD5E1"></uni-icons>
          </view>
        </template>

        <view class="load-foot">
          <text v-if="loading">加载中...</text>
          <text v-else-if="hasMore">上滑加载更多</text>
          <text v-else>已经到底了 · 共 {{ total }} 个动作</text>
        </view>
      </view>
    </scroll-view>

    <!-- 动作详情 -->
    <view class="sheet-mask" v-if="detail" @click="detail = null">
      <view class="sheet" @click.stop>
        <view class="sheet-handle"></view>
        <view class="detail-head">
          <view class="detail-avatar" :class="'src-' + (detail.source || 'system')">
            <text>{{ initials(detail) }}</text>
          </view>
          <view class="detail-head-info">
            <text class="detail-name">{{ detail.name }}</text>
            <text class="detail-en" v-if="detail.nameEn">{{ detail.nameEn }}</text>
            <view class="detail-badges">
              <text class="d-badge" :class="'src-' + (detail.source || 'system')">
                {{ sourceLabel(detail.source) }}
              </text>
              <text class="d-badge level">{{ difficultyLabel(detail.difficultyLevel) }}</text>
              <text class="d-badge" v-if="detail.equipment">{{ equipmentLabel(detail.equipment) }}</text>
            </view>
          </view>
        </view>

        <view class="media-slot">
          <text class="media-icon">🎬</text>
          <text class="media-text">动作示意（媒体位预留）</text>
        </view>

        <view class="meta-grid">
          <view class="meta-cell">
            <text class="meta-k">主肌肉</text>
            <text class="meta-v">{{ muscleText(detail.primaryMuscle) }}</text>
          </view>
          <view class="meta-cell">
            <text class="meta-k">次要肌肉</text>
            <text class="meta-v">{{ secondaryText(detail) }}</text>
          </view>
          <view class="meta-cell">
            <text class="meta-k">身体部位</text>
            <text class="meta-v">{{ bodyPartLabel(detail.bodyPart) || "—" }}</text>
          </view>
          <view class="meta-cell">
            <text class="meta-k">肌群</text>
            <text class="meta-v">{{ detail.muscleGroup || "—" }}</text>
          </view>
        </view>

        <view class="detail-section" v-if="detail.description">
          <text class="section-title">动作要领</text>
          <text class="section-text">{{ detail.description }}</text>
        </view>
        <view class="detail-section" v-if="detail.professionalTips">
          <text class="section-title">专业建议</text>
          <text class="section-text">{{ detail.professionalTips }}</text>
        </view>
        <view class="detail-section" v-else>
          <text class="section-title">专业建议</text>
          <text class="section-text muted">该动作还没有填写专业建议，可先在知识库中编辑补充。</text>
        </view>

        <view class="sheet-actions">
          <view class="btn-primary" @click="detail = null">
            <text>知道了</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import AppIcon from "@/components/AppIcon.vue";
import { searchExercises } from "@/api/index";
import { MUSCLE_NAME } from "@/utils/training/muscles-data.mjs";

const PAGE_SIZE = 20;

/** 动作库筛选项（与后端 primary_muscle / equipment 规范值一致） */
const MUSCLE_OPTIONS = [
  "chest", "upper-back", "deltoids", "biceps", "triceps", "abs",
  "quadriceps", "hamstring", "gluteal", "calves", "forearm", "trapezius",
  "lower-back", "obliques", "adductors", "hip-flexors", "serratus", "tibialis",
];

const EQUIPMENT_ZH = {
  barbell: "杠铃",
  "ez barbell": "EZ 杠铃",
  dumbbell: "哑铃",
  cable: "龙门/绳索",
  machine: "固定器械",
  smith: "史密斯机",
  "smith machine": "史密斯机",
  "body weight": "自重",
  bodyweight: "自重",
  kettlebell: "壶铃",
  bands: "弹力带",
  "resistance band": "弹力带",
  "medicine ball": "药球",
  "exercise ball": "瑞士球",
  "stability ball": "瑞士球",
  "bosu ball": "波速球",
  "trap bar": "六角杠",
  sled: "雪橇",
  "foam roll": "泡沫轴",
  "upper body ergometer": "上肢功率车",
  "stationary bike": "固定单车",
  treadmill: "跑步机",
  elliptical: "椭圆机",
  rowing: "划船机",
  "skierg machine": "滑雪机",
  "stepmill machine": "登阶机",
};

const BODY_PART_ZH = {
  chest: "胸部",
  back: "背部",
  shoulders: "肩部",
  "upper arms": "上臂",
  "lower arms": "前臂",
  waist: "腰腹",
  "upper legs": "大腿",
  "lower legs": "小腿",
  neck: "颈部",
  "full body": "全身",
  cardio: "有氧",
};

export default {
  components: { AppIcon },
  data() {
    return {
      query: "",
      source: "",
      muscle: "",
      equipment: "",
      sources: [
        { value: "", label: "全部来源" },
        { value: "system", label: "系统" },
        { value: "opengym", label: "扩充库" },
        { value: "user", label: "我的" },
      ],
      muscles: [
        { value: "", label: "全部肌肉" },
        ...MUSCLE_OPTIONS.map((slug) => ({ value: slug, label: MUSCLE_NAME[slug] || slug })),
      ],
      equipments: [
        { value: "", label: "全部器械" },
        ...[
          "barbell", "dumbbell", "cable", "machine", "body weight",
          "kettlebell", "bands", "smith machine", "medicine ball",
        ].map((value) => ({ value, label: EQUIPMENT_ZH[value] || value })),
      ],
      list: [],
      total: 0,
      current: 1,
      hasMore: true,
      loading: false,
      groupByMuscle: true,
      detail: null,
      searchTimer: null,
      requestId: 0,
    };
  },
  computed: {
    groups() {
      const map = new Map();
      for (const item of this.list) {
        const key = item.primaryMuscle || item.muscleGroup || "未分类";
        const label = MUSCLE_NAME[key] || item.muscleGroup || "未分类";
        if (!map.has(key)) map.set(key, { key, label, items: [] });
        map.get(key).items.push(item);
      }
      return Array.from(map.values());
    },
    emptyHint() {
      if (this.query) return `没有名称或肌群包含"${this.query}"的动作`;
      if (this.muscle) return "该肌肉下还没有结构化动作，试试清除肌肉筛选";
      if (this.source === "opengym") return "扩充动作库还没导入，先按文档执行 sql/09";
      return "换个筛选条件试试";
    },
  },
  onLoad() {
    this.fetch(true);
  },
  onUnload() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
  },
  methods: {
    onSearchInput() {
      if (this.searchTimer) clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => this.applyFilters(), 400);
    },

    applyFilters() {
      this.fetch(true);
    },

    pickSource(value) {
      this.source = value;
      this.fetch(true);
    },

    pickMuscle(value) {
      this.muscle = value;
      this.fetch(true);
    },

    pickEquipment(value) {
      this.equipment = value;
      this.fetch(true);
    },

    clearQuery() {
      this.query = "";
      this.fetch(true);
    },

    resetFilters() {
      this.query = "";
      this.source = "";
      this.muscle = "";
      this.equipment = "";
      this.fetch(true);
    },

    toggleGroup() {
      this.groupByMuscle = !this.groupByMuscle;
    },

    async fetch(reset = false) {
      if (this.loading && !reset) return;
      if (reset) {
        this.current = 1;
        this.hasMore = true;
      }
      if (!reset && !this.hasMore) return;

      const token = ++this.requestId;
      this.loading = true;
      try {
        const page = await searchExercises({
          query: this.query.trim(),
          muscle: this.muscle,
          equipment: this.equipment,
          source: this.source,
          current: this.current,
          size: PAGE_SIZE,
        });
        if (token !== this.requestId) return; // 旧请求的结果丢弃，避免筛选串台
        const records = (page && page.records) || [];
        this.list = reset ? records : [...this.list, ...records];
        this.total = (page && page.total) || this.list.length;
        this.hasMore = records.length >= PAGE_SIZE && this.list.length < this.total;
      } catch (error) {
        console.error("[ExerciseLibrary] 加载失败:", error);
        if (reset) this.list = [];
        this.hasMore = false;
      } finally {
        if (token === this.requestId) this.loading = false;
      }
    },

    loadMore() {
      if (this.loading || !this.hasMore) return;
      this.current += 1;
      this.fetch(false);
    },

    openDetail(item) {
      this.detail = item;
    },

    goBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) uni.navigateBack({ delta: 1 });
      else uni.switchTab({ url: "/pages/knowledge/knowledge" });
    },

    // ── 文案映射 ────────────────────────────────────────────────────────────
    sourceLabel(source) {
      return { system: "内置", opengym: "扩充库", user: "我的" }[source] || "内置";
    },

    difficultyLabel(level) {
      return { 1: "初级", 2: "中级", 3: "高级" }[level] || "未分级";
    },

    equipmentLabel(value) {
      if (!value) return "";
      return EQUIPMENT_ZH[String(value).toLowerCase()] || value;
    },

    bodyPartLabel(value) {
      if (!value) return "";
      return BODY_PART_ZH[String(value).toLowerCase()] || value;
    },

    muscleText(slug) {
      if (!slug) return "—";
      return String(slug)
        .split(",")
        .map((s) => MUSCLE_NAME[s.trim()] || s.trim())
        .join(" / ");
    },

    secondaryText(item) {
      if (item.secondaryMuscles) {
        try {
          const arr = JSON.parse(item.secondaryMuscles);
          if (Array.isArray(arr) && arr.length) {
            return arr.map((s) => MUSCLE_NAME[s] || s).join(" / ");
          }
        } catch (error) {
          // 非 JSON 就按逗号文本处理
        }
      }
      return item.secondaryMuscle ? this.muscleText(item.secondaryMuscle) : "—";
    },

    subline(item) {
      const parts = [];
      const muscle = item.primaryMuscle ? MUSCLE_NAME[item.primaryMuscle] : item.muscleGroup;
      if (muscle) parts.push(muscle);
      if (item.equipment) parts.push(this.equipmentLabel(item.equipment));
      if (item.bodyPart) parts.push(this.bodyPartLabel(item.bodyPart));
      return parts.join(" · ") || "暂无结构化信息";
    },

    initials(item) {
      const name = String(item.name || "?");
      return name.slice(0, 1);
    },
  },
};
</script>

<style lang="scss" scoped>
.lib-page {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(180deg, #f4f7ff 0%, #eef2ff 100%);
  overflow: hidden;
}

.bg-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(60rpx);
  opacity: 0.5;
  pointer-events: none;
  z-index: 0;
}

.bg-orb-1 {
  width: 400rpx;
  height: 400rpx;
  top: -140rpx;
  right: -120rpx;
  background: radial-gradient(circle, rgba(34, 197, 94, 0.24) 0%, rgba(34, 197, 94, 0) 70%);
}

.bg-orb-2 {
  width: 360rpx;
  height: 360rpx;
  bottom: 100rpx;
  left: -140rpx;
  background: radial-gradient(circle, rgba(47, 107, 255, 0.2) 0%, rgba(47, 107, 255, 0) 70%);
}

.lib-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: calc(var(--status-bar-height, 0px) + 16rpx) 24rpx 12rpx;
  background: rgba(244, 247, 255, 0.88);
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
}

.nav-sub {
  font-size: 20rpx;
  color: #64748b;
}

.nav-group-toggle {
  padding: 10rpx 20rpx;
  border-radius: 16rpx;
  border: 1rpx solid rgba(15, 23, 42, 0.08);

  text {
    font-size: 22rpx;
    color: #64748b;
  }

  &.on {
    border-color: rgba(47, 107, 255, 0.28);
    background: rgba(47, 107, 255, 0.08);

    text {
      color: #2f6bff;
      font-weight: 700;
    }
  }
}

.lib-toolbar {
  position: fixed;
  top: calc(var(--status-bar-height, 0px) + 92rpx);
  left: 0;
  right: 0;
  z-index: 55;
  padding: 16rpx 0 12rpx;
  background: rgba(244, 247, 255, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.search-box {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin: 0 24rpx;
  padding: 0 20rpx;
  height: 76rpx;
  border-radius: 22rpx;
  background: #ffffff;
  box-shadow: 0 4rpx 16rpx rgba(15, 23, 42, 0.05);

  input {
    flex: 1;
    font-size: 26rpx;
    color: #0f172a;
  }
}

.search-clear {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;

  text {
    font-size: 26rpx;
    color: #64748b;
    line-height: 1;
  }
}

.chip-scroll {
  margin-top: 12rpx;
  white-space: nowrap;
}

.chip-line {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  padding: 0 24rpx;
}

.chip {
  flex-shrink: 0;
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.9);
  border: 1rpx solid rgba(15, 23, 42, 0.06);

  text {
    font-size: 22rpx;
    color: #475569;
  }

  &.on {
    background: linear-gradient(135deg, #2f6bff 0%, #8a5cff 100%);
    border-color: transparent;

    text {
      color: #ffffff;
      font-weight: 700;
    }
  }

  &.muscle.on {
    background: linear-gradient(135deg, #22c55e 0%, #0ea5e9 100%);
  }

  &.equipment.on {
    background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  }
}

.chip-divider {
  width: 2rpx;
  height: 28rpx;
  background: rgba(15, 23, 42, 0.08);
  margin: 0 6rpx;
  flex-shrink: 0;
}

.lib-body {
  position: relative;
  z-index: 1;
  height: 100vh;
  box-sizing: border-box;
  padding-top: calc(var(--status-bar-height, 0px) + 290rpx);
}

.lib-list {
  padding: 0 24rpx 40rpx;
}

.group {
  margin-bottom: 8rpx;
}

.group-head {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 16rpx 4rpx 10rpx;
}

.group-title {
  font-size: 24rpx;
  font-weight: 800;
  color: #334155;
}

.group-count {
  font-size: 18rpx;
  color: #64748b;
  background: rgba(15, 23, 42, 0.06);
  border-radius: 999rpx;
  padding: 2rpx 12rpx;
}

.ex-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 18rpx 20rpx;
  margin-bottom: 10rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.94);
  border: 1rpx solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 6rpx 18rpx rgba(15, 23, 42, 0.04);
}

.ex-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%);

  text {
    font-size: 30rpx;
    font-weight: 800;
    color: #2f6bff;
  }

  &.src-opengym {
    background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%);

    text {
      color: #16a34a;
    }
  }

  &.src-user {
    background: linear-gradient(135deg, #fef3c7 0%, #ffedd5 100%);

    text {
      color: #d97706;
    }
  }
}

.ex-info {
  flex: 1;
  min-width: 0;
}

.ex-name-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.ex-name {
  font-size: 26rpx;
  font-weight: 700;
  color: #0f172a;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 62vw;
}

.ex-source {
  font-size: 16rpx;
  color: #2f6bff;
  background: rgba(47, 107, 255, 0.08);
  border-radius: 8rpx;
  padding: 2rpx 8rpx;
  flex-shrink: 0;

  &.src-opengym {
    color: #16a34a;
    background: rgba(34, 197, 94, 0.1);
  }

  &.src-user {
    color: #d97706;
    background: rgba(245, 158, 11, 0.12);
  }
}

.ex-sub {
  display: block;
  font-size: 20rpx;
  color: #64748b;
  margin-top: 4rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.load-foot {
  text-align: center;
  padding: 24rpx 0 40rpx;

  text {
    font-size: 20rpx;
    color: #94a3b8;
  }
}

/* 空态 / 骨架 */
.lib-empty {
  padding: 120rpx 60rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14rpx;
}

.empty-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: rgba(47, 107, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-title {
  font-size: 28rpx;
  font-weight: 800;
  color: #0f172a;
}

.empty-desc {
  font-size: 22rpx;
  color: #64748b;
  text-align: center;
  line-height: 1.5;
}

.empty-btn {
  margin-top: 12rpx;
  padding: 14rpx 40rpx;
  border-radius: 20rpx;
  background: rgba(47, 107, 255, 0.08);

  text {
    font-size: 24rpx;
    color: #2f6bff;
    font-weight: 700;
  }
}

.lib-skeleton {
  padding: 8rpx 24rpx;
}

.sk-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx;
  margin-bottom: 12rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.8);
}

.sk-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  background: #e8eefc;
  flex-shrink: 0;
}

.sk-lines {
  flex: 1;
}

.sk-line {
  height: 22rpx;
  border-radius: 8rpx;
  background: #e8eefc;
  margin-bottom: 10rpx;

  &.w60 {
    width: 60%;
  }

  &.w40 {
    width: 40%;
  }
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

/* 详情 */
.sheet-mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: flex-end;
}

.sheet {
  width: 100%;
  max-height: 88vh;
  overflow-y: auto;
  border-radius: 40rpx 40rpx 0 0;
  background: #ffffff;
  padding: 16rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
}

.sheet-handle {
  width: 72rpx;
  height: 8rpx;
  border-radius: 8rpx;
  background: rgba(15, 23, 42, 0.12);
  margin: 0 auto 20rpx;
}

.detail-head {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.detail-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%);
  flex-shrink: 0;

  text {
    font-size: 40rpx;
    font-weight: 800;
    color: #2f6bff;
  }
}

.detail-head-info {
  flex: 1;
  min-width: 0;
}

.detail-name {
  font-size: 32rpx;
  font-weight: 800;
  color: #0f172a;
  display: block;
}

.detail-en {
  font-size: 20rpx;
  color: #94a3b8;
  display: block;
  margin-top: 2rpx;
}

.detail-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 10rpx;
}

.d-badge {
  font-size: 18rpx;
  padding: 3rpx 12rpx;
  border-radius: 10rpx;
  color: #2f6bff;
  background: rgba(47, 107, 255, 0.08);

  &.level {
    color: #7c3aed;
    background: rgba(124, 58, 237, 0.08);
  }

  &.src-opengym {
    color: #16a34a;
    background: rgba(34, 197, 94, 0.1);
  }

  &.src-user {
    color: #d97706;
    background: rgba(245, 158, 11, 0.12);
  }
}

.media-slot {
  margin-top: 20rpx;
  height: 160rpx;
  border-radius: 24rpx;
  border: 2rpx dashed rgba(47, 107, 255, 0.2);
  background: rgba(47, 107, 255, 0.03);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.media-icon {
  font-size: 36rpx;
}

.media-text {
  font-size: 20rpx;
  color: #94a3b8;
}

.meta-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 20rpx;
}

.meta-cell {
  width: calc(50% - 6rpx);
  box-sizing: border-box;
  padding: 16rpx 18rpx;
  border-radius: 20rpx;
  background: rgba(15, 23, 42, 0.03);
}

.meta-k {
  font-size: 18rpx;
  color: #94a3b8;
  display: block;
}

.meta-v {
  font-size: 24rpx;
  font-weight: 600;
  color: #0f172a;
  display: block;
  margin-top: 4rpx;
}

.detail-section {
  margin-top: 22rpx;
}

.section-title {
  font-size: 24rpx;
  font-weight: 800;
  color: #0f172a;
  display: block;
  margin-bottom: 8rpx;
}

.section-text {
  font-size: 23rpx;
  color: #475569;
  line-height: 1.6;
  display: block;

  &.muted {
    color: #94a3b8;
  }
}

.sheet-actions {
  margin-top: 28rpx;
}

.btn-primary {
  height: 88rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2f6bff 0%, #8a5cff 100%);

  text {
    font-size: 28rpx;
    font-weight: 800;
    color: #ffffff;
  }
}
</style>
