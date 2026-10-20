<template>
  <page-meta page-style="overflow:hidden"></page-meta>
  <view class="page-container">
    <NavHeader
      title="健身知识库"
      subtitle="建立你的科学健身观"
      :showBack="false"
      bgColor="rgba(240,249,255,0.72)"
    />
    <scroll-view
      scroll-y
      class="page-body"
      :style="{ height: scrollHeight + 'px' }"
      :enhanced="scrollBounceProps.enhanced"
      :bounces="scrollBounceProps.bounces"
      :show-scrollbar="scrollBounceProps.showScrollbar"
      @scrolltolower="onScrollToLower"
    >
      <view class="page-body-inner">
        <!-- 搜索框 -->
        <view class="search-box">
          <uni-icons type="search" size="20" color="#94A3B8"></uni-icons>
          <input
            type="text"
            v-model="searchQuery"
            @input="onSearch"
            placeholder="搜索健身动作..."
            placeholder-style="color: #94A3B8"
          />
        </view>

        <view v-if="viewState === 'grid'">
          <view class="tool-card plan-tool-card" @click="goTrainingPlanList">
            <view class="gradient-flow"></view>
            <view class="card-content-wrap">
              <view class="tool-icon-wrap plan-icon-bg">
                <uni-icons type="list" size="28" color="#fff"></uni-icons>
              </view>
              <view class="tool-info">
                <text class="tool-title plan-title">训练计划</text>
                <text class="tool-desc plan-desc"
                  >五分化 / 三分化 / 全身训练 · 科学规划你的训练</text
                >
              </view>
              <uni-icons
                type="chevron-right"
                size="20"
                color="#94A3B8"
              ></uni-icons>
            </view>
          </view>

          <view class="tool-card calorie-tool-card" @click="goCalorieGuide">
            <view class="gradient-flow-orange"></view>
            <view class="card-content-wrap">
              <view class="tool-icon-wrap calorie-icon-bg">
                <uni-icons type="fire" size="32" color="#fff"></uni-icons>
              </view>
              <view class="tool-info">
                <text class="tool-title calorie-title">能量计算器</text>
                <text class="tool-desc calorie-desc"
                  >BMR / TDEE / 运动消耗 · 科学计算每日热量</text
                >
              </view>
              <uni-icons
                type="chevron-right"
                size="20"
                color="#94A3B8"
              ></uni-icons>
            </view>
          </view>

          <SectionLoader
            ref="exercisesLoader"
            :loading="exercisesLoading"
            mode="skeleton"
            min-height="500rpx"
          >
            <template #skeleton>
              <view class="category-skeleton-grid">
                <view v-for="i in 6" :key="i" class="category-skeleton-card">
                  <view class="category-skeleton-icon skeleton-shimmer"></view>
                  <view class="category-skeleton-title skeleton-shimmer"></view>
                  <view class="category-skeleton-sub skeleton-shimmer"></view>
                </view>
              </view>
            </template>
            <view v-if="!exercisesLoading" class="category-grid">
              <view
                v-for="(cat, index) in categories"
                :key="index"
                class="card category-block"
                @click="selectCategory(cat)"
              >
                <view
                  class="icon-circle"
                  :style="{ backgroundColor: getCategoryColor(cat) }"
                >
                  <image
                    :src="getCategoryImage(cat)"
                    class="category-icon-image"
                    mode="aspectFit"
                  ></image>
                </view>
                <text class="cat-label">{{ cat }}</text>
                <text class="cat-sub">{{ getExerciseCount(cat) }} 个动作</text>
              </view>
            </view>
          </SectionLoader>
        </view>

        <!-- 2. 动作列表展示 (点击大类后 或 搜索时) -->
        <view v-else class="list-view">
          <view class="list-header-enhanced">
            <view class="header-bg"></view>
            <view class="header-content">
              <view class="back-btn-circle" @click="resetView">
                <uni-icons type="left" size="22" color="#0EA5E9"></uni-icons>
              </view>
              <text class="current-cat">{{
                searchQuery ? "搜索结果" : currentCategory
              }}</text>
            </view>
          </view>

          <view class="exercise-list">
            <view
              v-for="(item, index) in filteredExercises"
              :key="index"
              class="card exercise-item-enhanced"
              @click="openDetail(item)"
            >
              <view
                class="exercise-icon-wrapper"
                :style="{ background: getExerciseIconBg(item.category) }"
              >
                <uni-icons
                  :type="getExerciseIconType(item.category)"
                  size="26"
                  :color="getExerciseIconColor(item.category)"
                ></uni-icons>
              </view>
              <view class="exercise-info-enhanced">
                <text class="exercise-name-enhanced">{{ item.name }}</text>
                <view class="exercise-meta-row">
                  <text class="muscle-tag">{{ item.muscleGroup }}</text>
                  <text v-if="item.equipment" class="equipment-tag">{{
                    item.equipment
                  }}</text>
                  <text v-if="item.isSystem === 0" class="custom-tag"
                    >自定义</text
                  >
                </view>
              </view>
              <view
                v-if="item.isSystem === 0"
                class="exercise-actions"
                @click.stop
              >
                <view
                  class="action-btn edit-btn"
                  @click="openEditExercise(item)"
                >
                  <uni-icons
                    type="compose"
                    size="18"
                    color="#0EA5E9"
                  ></uni-icons>
                </view>
                <view
                  class="action-btn delete-btn"
                  @click="confirmDeleteExercise(item)"
                >
                  <uni-icons type="trash" size="18" color="#EF4444"></uni-icons>
                </view>
              </view>
              <view v-else class="arrow-icon">
                <uni-icons type="right" size="18" color="#CBD5E1"></uni-icons>
              </view>
            </view>

            <view v-if="filteredExercises.length === 0" class="empty-state">
              <uni-icons type="info" size="48" color="#E2E8F0"></uni-icons>
              <text>该分类下暂无动作数据</text>
            </view>

            <view class="add-custom-exercise-btn" @click="openAddExercise">
              <uni-icons type="plus" size="20" color="#0EA5E9"></uni-icons>
              <text>添加自定义动作</text>
            </view>
          </view>
        </view>

        <!-- 详情弹窗 -->
        <uni-popup
          ref="exercisePopup"
          type="bottom"
          :safe-area-inset-bottom="false"
          :mask-click="true"
          @change="onExercisePopupChange"
        >
          <view class="popup-wrapper">
            <view class="modal-content" v-if="currentExercise">
              <view class="handle"></view>
              <text
                class="modal-title"
                @longpress="copyText(currentExercise.name, '动作名称')"
                >{{ currentExercise.name }}</text
              >
              <view class="tags">
                <view class="tag primary">{{ currentExercise.category }}</view>
                <view class="tag secondary">力量核心</view>
              </view>

              <scroll-view scroll-y="true" class="modal-scroll">
                <view class="section">
                  <view class="section-header">
                    <text class="section-title">动作要领</text>
                    <view
                      class="copy-btn"
                      @longpress="
                        copyText(currentExercise.description, '动作要领')
                      "
                    >
                      <uni-icons
                        type="copy"
                        size="14"
                        color="#0EA5E9"
                      ></uni-icons>
                      <text>复制</text>
                    </view>
                  </view>
                  <text class="section-text selectable">{{
                    currentExercise.description
                  }}</text>
                </view>
                <view class="section" v-if="currentExercise.professionalTips">
                  <text class="section-title warning">专业注意事项</text>
                  <view class="warning-box">
                    <text class="warning-text selectable">{{
                      currentExercise.professionalTips
                    }}</text>
                  </view>
                </view>
              </scroll-view>

              <button class="btn-confirm" @click="closeDetail">我知道了</button>
            </view>
          </view>
        </uni-popup>

        <!-- 自定义动作表单弹窗 -->
        <uni-popup
          ref="exerciseFormPopup"
          type="bottom"
          :safe-area-inset-bottom="true"
          :mask-click="false"
          @change="onFormPopupChange"
        >
          <view class="exercise-form-wrapper">
            <view class="form-handle"></view>
            <view class="form-header">
              <text class="form-title">{{
                isEditExercise ? "编辑动作" : "添加自定义动作"
              }}</text>
              <view class="form-close" @click="closeExerciseForm">
                <uni-icons
                  type="closeempty"
                  size="20"
                  color="#94A3B8"
                ></uni-icons>
              </view>
            </view>

            <scroll-view scroll-y class="form-scroll-area">
              <view class="form-field">
                <text class="field-label required">动作名称</text>
                <input
                  v-model="exerciseForm.name"
                  class="field-input"
                  placeholder="例如：帕洛夫推压"
                  placeholder-class="field-placeholder"
                  maxlength="30"
                />
              </view>

              <view class="form-field">
                <text class="field-label required">动作分类</text>
                <picker
                  mode="selector"
                  :range="categories"
                  @change="onCategoryPick"
                >
                  <view
                    class="field-picker"
                    :class="{ active: exerciseForm.category }"
                  >
                    <text
                      :class="{ 'placeholder-text': !exerciseForm.category }"
                    >
                      {{ exerciseForm.category || "请选择分类" }}
                    </text>
                    <uni-icons
                      type="bottom"
                      size="14"
                      color="#94A3B8"
                    ></uni-icons>
                  </view>
                </picker>
              </view>

              <view class="form-field">
                <text class="field-label required">目标肌群</text>
                <input
                  v-model="exerciseForm.muscleGroup"
                  class="field-input"
                  placeholder="例如：核心、腹横肌"
                  placeholder-class="field-placeholder"
                  maxlength="20"
                />
              </view>

              <view class="form-field">
                <text class="field-label">器械</text>
                <input
                  v-model="exerciseForm.equipment"
                  class="field-input"
                  placeholder="例如：弹力带、哑铃（选填）"
                  placeholder-class="field-placeholder"
                  maxlength="20"
                />
              </view>

              <view class="form-field">
                <text class="field-label">动作描述</text>
                <textarea
                  v-model="exerciseForm.description"
                  class="field-textarea"
                  placeholder="描述动作要领和注意事项..."
                  placeholder-class="field-placeholder"
                  :maxlength="500"
                  auto-height
                />
              </view>
            </scroll-view>

            <view class="form-actions">
              <view class="form-btn cancel-btn" @click="closeExerciseForm"
                >取消</view
              >
              <view class="form-btn submit-btn" @click="submitExerciseForm">
                {{ isEditExercise ? "保存修改" : "添加动作" }}
              </view>
            </view>
          </view>
        </uni-popup>

        <ResultModal ref="resultModal" />
        <DeleteConfirm
          v-model:visible="showDeleteExerciseConfirm"
          type="workout"
          :itemName="deleteExerciseName"
          :customDesc="deleteExerciseDesc"
          @confirm="confirmDeleteExerciseAction"
          @cancel="showDeleteExerciseConfirm = false"
        />
      </view>
    </scroll-view>
  </view>
</template>

<script>
import {
  getExercises,
  getDictData,
  createCustomExercise,
  updateCustomExercise,
  softDeleteExercise,
  checkExerciseReference,
} from "@/api/index";
import { checkLogin } from "@/utils/auth";
import {
  calcScrollHeight,
  getScrollDisableBounceProps,
} from "@/utils/navLayout";
import { listLoadingMixin } from "@/mixins/listLoadingMixin.js";
import { usePageCacheStore } from "@/stores/pageCache.js";
import ResultModal from "@/components/ResultModal.vue";
import DeleteConfirm from "@/components/DeleteConfirm.vue";
import NavHeader from "@/components/NavHeader/NavHeader.vue";

export default {
  mixins: [listLoadingMixin],
  components: {
    ResultModal,
    DeleteConfirm,
    NavHeader,
  },

  data() {
    return {
      scrollHeight: 0,
      scrollBounceProps: {},
      exercisesLoading: true,
      searchQuery: "",
      showDeleteExerciseConfirm: false,
      deleteExerciseName: "",
      deleteExerciseDesc: "",
      deleteExerciseId: null,
      exercises: [],
      currentExercise: null,
      categories: [
        "胸部肌群",
        "背部肌群",
        "下肢肌群",
        "肩部肌群",
        "手臂肌群",
        "核心训练",
        "全身有氧",
      ],
      currentCategory: "胸部肌群",
      viewState: "grid", // 'grid' or 'list'
      isEditExercise: false,
      editingExerciseId: null,
      exerciseForm: {
        name: "",
        category: "",
        muscleGroup: "",
        equipment: "",
        description: "",
      },
      exerciseFormSubmitting: false,
    };
  },
  computed: {
    filteredExercises() {
      let list = this.exercises;
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        list = list.filter(
          (ex) =>
            ex.name.toLowerCase().includes(query) ||
            ex.muscleGroup.toLowerCase().includes(query) ||
            ex.category.toLowerCase().includes(query),
        );
      } else if (this.currentCategory) {
        list = list.filter((ex) => ex.category === this.currentCategory);
      }
      return list;
    },
  },
  onShow() {
    if (checkLogin()) {
      this.fetchExercises();
      this.fetchCategories();
    }
    console.log("[knowledge] onShow, scrollHeight:", this.scrollHeight);
  },
  async onReady() {
    this.scrollHeight = await calcScrollHeight(this);
    this.scrollBounceProps = getScrollDisableBounceProps();
  },
  methods: {
    onScrollToLower() {
      console.log("[knowledge] scroll-view 触底 (scrolltolower)");
    },
    goCalorieGuide() {
      uni.navigateTo({ url: "/pages/knowledge/calorie-guide" });
    },

    goTrainingPlanList() {
      // uni.showToast({
      //   title: "程序员正在加班中...",
      //   icon: "none",
      //   duration: 2000,
      // });
      uni.navigateTo({ url: "/pages/knowledge/training-plan-list" });
    },
    getExerciseCount(cat) {
      return this.exercises.filter((ex) => ex.category === cat).length;
    },
    getCategoryImage(cat) {
      if (cat.includes("胸")) return "/static/chest.svg";
      if (cat.includes("背")) return "/static/back.svg";
      if (cat.includes("下肢") || cat.includes("腿")) return "/static/legs.svg";
      if (cat.includes("肩")) return "/static/shoulders.svg";
      if (cat.includes("手臂") || cat.includes("臂")) return "/static/arms.svg";
      if (cat.includes("核心") || cat.includes("腹")) return "/static/abs.svg";
      if (cat.includes("有氧")) return "/static/cardio.svg";
      return "/static/fitness-6.svg";
    },
    getCategoryColor(cat) {
      const colors = {
        胸部肌群: "#E0F2FE", // light blue
        背部肌群: "#FFE4E6", // light rose
        下肢肌群: "#D1FAE5", // light emerald
        肩部肌群: "#FEF3C7", // light amber
        手臂肌群: "#EDE9FE", // light violet
        核心训练: "#FCE7F3", // light pink
        全身有氧: "#FFEDD5", // light orange
      };
      return colors[cat] || "#F1F5F9";
    },
    getExerciseIconBg(category) {
      const bgs = {
        胸部肌群: "linear-gradient(135deg, #E0F2FE, #BAE6FD)",
        背部肌群: "linear-gradient(135deg, #FFE4E6, #FECDD3)",
        下肢肌群: "linear-gradient(135deg, #D1FAE5, #A7F3D0)",
        肩部肌群: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
        手臂肌群: "linear-gradient(135deg, #EDE9FE, #DDD6FE)",
        核心训练: "linear-gradient(135deg, #FCE7F3, #FBCFE8)",
        全身有氧: "linear-gradient(135deg, #FFEDD5, #FED7AA)",
      };
      return bgs[category] || "linear-gradient(135deg, #F1F5F9, #E2E8F0)";
    },
    getExerciseIconType(category) {
      const icons = {
        胸部肌群: "heart",
        背部肌群: "loop",
        下肢肌群: "flag",
        肩部肌群: "star",
        手臂肌群: "star-filled",
        核心训练: "fire",
        全身有氧: "paperplane",
      };
      return icons[category] || "flag";
    },
    getExerciseIconColor(category) {
      const colors = {
        胸部肌群: "#0369A1",
        背部肌群: "#BE123C",
        下肢肌群: "#047857",
        肩部肌群: "#B45309",
        手臂肌群: "#6D28D9",
        核心训练: "#DB2777",
        全身有氧: "#C2410C",
      };
      return colors[category] || "#475569";
    },

    async fetchCategories() {
      const cache = usePageCacheStore();
      const cached = cache.getCached("categories");
      if (cached) {
        if (cached.length > 0) this.categories = cached;
        cache
          .silentRefresh("categories", async () => {
            const data = await getDictData("exercise_category");
            if (data && Array.isArray(data) && data.length > 0) {
              this.categories = data.map((item) => item.dictLabel);
            }
            return this.categories;
          })
          .then(() => {});
        return;
      }

      try {
        const data = await getDictData("exercise_category");
        if (data && Array.isArray(data)) {
          if (data.length > 0) {
            this.categories = data.map((item) => item.dictLabel);
            cache.setCache("categories", this.categories);
          }
        }
      } catch (e) {
        console.error("Failed to fetch categories", e);
      }
    },
    async fetchExercises() {
      const cache = usePageCacheStore();
      const cached = cache.getCached("exercises");
      if (cached) {
        this.exercises = cached;
        this.exercisesLoading = false;
        cache
          .silentRefresh("exercises", async () => {
            const data = await getExercises(this.searchQuery);
            this.exercises = Array.isArray(data) ? data : [];
            return this.exercises;
          })
          .then(() => {});
        return;
      }

      this.exercisesLoading = true;
      try {
        const data = await getExercises(this.searchQuery);
        this.exercises = Array.isArray(data) ? data : [];
        cache.setCache("exercises", this.exercises);
      } catch (e) {
        console.error("Failed to fetch exercises", e);
        this.exercises = [];
      } finally {
        this.exercisesLoading = false;
      }
    },
    selectCategory(cat) {
      this.currentCategory = cat;
      this.searchQuery = ""; // 清除搜索词
      this.viewState = "list";
    },
    resetView() {
      this.viewState = "grid";
      this.searchQuery = "";
    },
    onSearch() {
      if (this.searchQuery) {
        this.viewState = "list";
      } else {
        this.viewState = "grid";
      }
      // 简单的防抖处理
      if (this.searchTimer) clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        this.fetchExercises();
      }, 500);
    },
    openDetail(item) {
      this.currentExercise = item;
      uni.hideTabBar({ animation: true });
      this.$nextTick(() => {
        setTimeout(() => {
          uni.hideTabBar({ animation: true });
        }, 50);
      });
      this.$nextTick(() => {
        if (
          this.$refs.exercisePopup &&
          typeof this.$refs.exercisePopup.open === "function"
        ) {
          this.$refs.exercisePopup.open();
        } else {
          console.error(
            "详情弹窗 (uni-popup) 未正确加载，请检查 uni_modules 是否安装",
          );
          this.$refs.resultModal.show({
            type: "error",
            title: "组件加载失败",
            desc: "详情弹窗未正确加载，请检查 uni-ui 组件库",
            autoClose: 3000,
          });
        }
      });
    },
    closeDetail() {
      if (
        this.$refs.exercisePopup &&
        typeof this.$refs.exercisePopup.close === "function"
      ) {
        this.$refs.exercisePopup.close();
      }
    },
    onExercisePopupChange(e) {
      if (!e.show) {
        setTimeout(() => {
          uni.showTabBar({ animation: true });
        }, 280);
      }
    },
    copyText(text, label) {
      if (!text) return;
      uni.setClipboardData({
        data: text,
        success: () => {
          this.$refs.resultModal.show({
            type: "success",
            title: "复制成功",
            desc: `${label}已复制到剪贴板`,
            autoClose: 1500,
          });
        },
        fail: () => {
          this.$refs.resultModal.show({
            type: "error",
            title: "复制失败",
            desc: "请稍后重试",
            autoClose: 2000,
          });
        },
      });
    },

    openAddExercise() {
      this.isEditExercise = false;
      this.editingExerciseId = null;
      this.exerciseForm = {
        name: "",
        category: this.currentCategory || "",
        muscleGroup: "",
        equipment: "",
        description: "",
      };
      this.$refs.exerciseFormPopup.open();
    },

    openEditExercise(item) {
      this.isEditExercise = true;
      this.editingExerciseId = item.id;
      this.exerciseForm = {
        name: item.name || "",
        category: item.category || "",
        muscleGroup: item.muscleGroup || "",
        equipment: item.equipment || "",
        description: item.description || "",
      };
      this.$refs.exerciseFormPopup.open();
    },

    closeExerciseForm() {
      this.$refs.exerciseFormPopup.close();
    },

    onFormPopupChange(e) {
      if (!e.show) {
        this.exerciseFormSubmitting = false;
      }
    },

    onCategoryPick(e) {
      this.exerciseForm.category = this.categories[e.detail.value];
    },

    validateExerciseForm() {
      if (!this.exerciseForm.name.trim()) {
        this.$refs.resultModal.show({
          type: "warning",
          theme: "workout",
          title: "请输入动作名称",
          desc: "动作名称不能为空，请填写后重试",
          autoClose: 1500,
        });
        return false;
      }
      if (!this.exerciseForm.category) {
        this.$refs.resultModal.show({
          type: "warning",
          theme: "workout",
          title: "请选择动作分类",
          desc: "动作分类不能为空，请选择后重试",
          autoClose: 1500,
        });
        return false;
      }
      if (!this.exerciseForm.muscleGroup.trim()) {
        this.$refs.resultModal.show({
          type: "warning",
          theme: "workout",
          title: "请输入目标肌群",
          desc: "目标肌群不能为空，请填写后重试",
          autoClose: 1500,
        });
        return false;
      }
      return true;
    },

    async submitExerciseForm() {
      if (!this.validateExerciseForm()) return;
      if (this.exerciseFormSubmitting) return;
      this.exerciseFormSubmitting = true;

      try {
        const payload = {
          name: this.exerciseForm.name.trim(),
          category: this.exerciseForm.category,
          muscleGroup: this.exerciseForm.muscleGroup.trim(),
          equipment: this.exerciseForm.equipment.trim() || null,
          description: this.exerciseForm.description.trim() || null,
        };

        if (this.isEditExercise && this.editingExerciseId) {
          await updateCustomExercise(this.editingExerciseId, payload);
          this.$refs.resultModal.show({
            type: "success",
            theme: "workout",
            title: "修改成功 ✏️",
            desc: "动作信息已更新，训练计划中的引用已同步",
            autoClose: 2000,
          });
        } else {
          await createCustomExercise(payload);
          this.$refs.resultModal.show({
            type: "success",
            theme: "workout",
            title: "添加成功 ✨",
            desc: "自定义动作已创建，可在训练计划中使用",
            autoClose: 2000,
          });
        }

        this.closeExerciseForm();
        const cache = usePageCacheStore();
        cache.clearCache("exercises");
        await this.fetchExercises();
      } catch (e) {
        this.$refs.resultModal.show({
          type: "error",
          theme: "workout",
          title: "操作失败",
          desc: e.message || "操作失败，请稍后重试",
          autoClose: 2000,
        });
      } finally {
        this.exerciseFormSubmitting = false;
      }
    },

    async confirmDeleteExercise(item) {
      try {
        const refData = await checkExerciseReference(item.id);
        const refCount = refData?.referenceCount || 0;

        this.deleteExerciseId = item.id;
        this.deleteExerciseName = item.name;
        if (refCount > 0) {
          this.deleteExerciseDesc = `该动作被 ${refCount} 个训练计划引用，删除后计划中将保留动作名称但无法关联详情。\n确定要删除"${item.name}"吗？`;
        } else {
          this.deleteExerciseDesc = `确定删除动作"${item.name}"吗？\n此操作无法撤销，请谨慎操作。`;
        }
        this.showDeleteExerciseConfirm = true;
      } catch (e) {
        this.deleteExerciseId = item.id;
        this.deleteExerciseName = item.name;
        this.deleteExerciseDesc = `确定删除动作"${item.name}"吗？\n此操作无法撤销，请谨慎操作。`;
        this.showDeleteExerciseConfirm = true;
      }
    },

    async confirmDeleteExerciseAction() {
      if (this.deleteExerciseId === null) {
        this.showDeleteExerciseConfirm = false;
        return;
      }
      this.showDeleteExerciseConfirm = false;
      try {
        await softDeleteExercise(this.deleteExerciseId);
        this.$refs.resultModal.show({
          type: "success",
          theme: "workout",
          title: "删除成功",
          desc: "动作已从列表中移除",
          autoClose: 2000,
        });
        const cache = usePageCacheStore();
        cache.clearCache("exercises");
        await this.fetchExercises();
      } catch (e) {
        this.$refs.resultModal.show({
          type: "error",
          theme: "workout",
          title: "删除失败",
          desc: e.message || "删除失败，请稍后重试",
          autoClose: 2000,
        });
      } finally {
        this.deleteExerciseId = null;
        this.deleteExerciseName = "";
        this.deleteExerciseDesc = "";
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: $bg-color;
  width: 100%;
  box-sizing: border-box;
  overscroll-behavior: none;
}

.page-body {
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  overscroll-behavior-y: none;
}

.page-body-inner {
  padding: 20rpx 40rpx 40rpx;
  box-sizing: border-box;
}

.search-box {
  background-color: #fff;
  height: 100rpx;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  padding: 0 40rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.02);

  input {
    flex: 1;
    margin-left: 20rpx;
    font-size: 28rpx;
    color: $text-main;
  }
}

.calorie-tool-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #fff7ed, #ffedd5) !important;
  border-radius: 24rpx;
  padding: 28rpx 32rpx;
  margin-bottom: 28rpx;
  box-shadow:
    0 4rpx 20rpx rgba(251, 146, 60, 0.12),
    0 2rpx 8rpx rgba(245, 158, 11, 0.08) !important;
  border: 1rpx solid rgba(251, 146, 60, 0.15) !important;

  .gradient-flow-orange {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent,
      rgba(251, 146, 60, 0.25),
      transparent,
      rgba(253, 186, 116, 0.25),
      transparent
    );
    animation: gradientFlowOrange 4s ease-in-out infinite;

    @keyframes gradientFlowOrange {
      0% {
        transform: translate(-30%, -30%) rotate(0deg);
      }

      50% {
        transform: translate(10%, 10%) rotate(180deg);
      }

      100% {
        transform: translate(-30%, -30%) rotate(360deg);
      }
    }
  }

  .card-content-wrap {
    display: flex;
    align-items: center;
    position: relative;
    z-index: 1;
  }

  .calorie-icon-bg {
    background: linear-gradient(135deg, #f97316, #ea580c) !important;
    box-shadow: 0 4rpx 20rpx rgba(234, 88, 12, 0.4);
  }

  .calorie-title {
    color: #1e293b;
    font-weight: 700;
  }

  .calorie-desc {
    color: #475569;
  }

  &:active {
    transform: scale(0.98);

    .gradient-flow-orange {
      animation-duration: 2s;
    }
  }
}

.plan-tool-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #e0f2fe, #ede9fe) !important;
  border-radius: 24rpx;
  padding: 28rpx 32rpx;
  margin-bottom: 28rpx;
  box-shadow:
    0 4rpx 20rpx rgba(59, 130, 246, 0.12),
    0 2rpx 8rpx rgba(167, 139, 250, 0.08) !important;
  border: 1rpx solid rgba(167, 139, 250, 0.15) !important;

  .gradient-flow {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent,
      rgba(96, 165, 250, 0.25),
      transparent,
      rgba(196, 181, 253, 0.25),
      transparent
    );
    animation: gradientFlow 4s ease-in-out infinite;

    @keyframes gradientFlow {
      0% {
        transform: translate(-30%, -30%) rotate(0deg);
      }
      50% {
        transform: translate(10%, 10%) rotate(180deg);
      }
      100% {
        transform: translate(-30%, -30%) rotate(360deg);
      }
    }
  }

  .card-content-wrap {
    display: flex;
    align-items: center;
    position: relative;
    z-index: 1;
  }

  .plan-icon-bg {
    background: linear-gradient(135deg, #3b82f6, #8b5cf6) !important;
    box-shadow: 0 4rpx 16rpx rgba(99, 102, 241, 0.35);
  }

  .plan-title {
    color: #1e293b;
    font-weight: 700;
  }

  .plan-desc {
    color: #475569;
  }

  &:active {
    transform: scale(0.98);

    .gradient-flow {
      animation-duration: 2s;
    }
  }
}

.tool-card {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #fff7ed, #ffedd5);
  border-radius: 24rpx;
  padding: 28rpx 32rpx;
  margin-bottom: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(249, 115, 22, 0.1);
  border: 1rpx solid rgba(249, 115, 22, 0.08);

  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }

  .tool-icon-wrap {
    width: 80rpx;
    height: 80rpx;
    background: linear-gradient(135deg, #f97316, #ea580c);
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20rpx;
    flex-shrink: 0;
  }

  .tool-info {
    flex: 1;

    .tool-title {
      display: block;
      font-size: 30rpx;
      font-weight: 700;
      color: #1e293b;
    }

    .tool-desc {
      display: block;
      font-size: 23rpx;
      color: #94a3b8;
      margin-top: 4rpx;
    }
  }
}

.skeleton-shimmer {
  position: relative;
  overflow: hidden;
}

.skeleton-shimmer::after {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.5) 50%,
    transparent 100%
  );
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

.category-skeleton-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30rpx;
}

.category-skeleton-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx;
  background: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.category-skeleton-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  background: #e2e8f0;
  margin-bottom: 24rpx;
}

.category-skeleton-title {
  width: 60%;
  height: 28rpx;
  border-radius: 8rpx;
  background: #e2e8f0;
  margin-bottom: 16rpx;
}

.category-skeleton-sub {
  width: 40%;
  height: 24rpx;
  border-radius: 6rpx;
  background: #e2e8f0;
}

.category-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30rpx;
  padding-bottom: 40rpx;
}

.category-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50rpx 30rpx;
  transition: transform 0.2s;

  &:active {
    transform: scale(0.95);
  }

  .icon-circle {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24rpx;
    box-shadow: 0 10rpx 20rpx rgba(0, 0, 0, 0.1);

    .category-icon-image {
      width: 68rpx;
      height: 68rpx;
    }
  }

  .cat-label {
    font-size: 30rpx;
    font-weight: 800;
    color: $text-main;
    margin-bottom: 8rpx;
  }

  .cat-sub {
    font-size: 20rpx;
    color: $text-light;
    font-weight: 600;
  }
}

.list-view {
  .list-header-enhanced {
    position: relative;
    margin-bottom: 40rpx;
    border-radius: 32rpx;
    overflow: hidden;

    .header-bg {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        135deg,
        #f0f9ff 0%,
        #e0f2fe 50%,
        #bae6fd 100%
      );
      opacity: 0.6;
    }

    .header-content {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      padding: 28rpx 32rpx;

      .back-btn-circle {
        width: 72rpx;
        height: 72rpx;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 24rpx;
        box-shadow: 0 4rpx 16rpx rgba(14, 165, 233, 0.15);
        transition: all 0.2s ease;

        &:active {
          transform: scale(0.92);
          box-shadow: 0 2rpx 8rpx rgba(14, 165, 233, 0.2);
        }
      }

      .current-cat {
        font-size: 38rpx;
        font-weight: 800;
        color: #0c4a6e;
        letter-spacing: 1rpx;
      }
    }
  }

  .list-header {
    display: flex;
    align-items: center;
    margin-bottom: 40rpx;

    .back-btn {
      display: flex;
      align-items: center;
      background-color: #fff;
      padding: 12rpx 24rpx;
      border-radius: 100rpx;
      margin-right: 30rpx;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);

      text {
        font-size: 24rpx;
        color: $primary-color;
        font-weight: 700;
        margin-left: 8rpx;
      }
    }

    .current-cat {
      font-size: 36rpx;
      font-weight: 800;
      color: $text-main;
    }
  }
}

.exercise-list {
  width: 100%;
  box-sizing: border-box;
}

.card {
  background-color: $card-bg;
  border-radius: 40rpx;
  padding: 30rpx;
  box-shadow: $card-shadow;
  border: 1px solid rgba(14, 165, 233, 0.05);
}

.exercise-item {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;

  .icon-box {
    width: 88rpx;
    height: 88rpx;
    background-color: $primary-light;
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;
  }

  .exercise-info {
    flex: 1;
    .exercise-name {
      display: block;
      font-size: 30rpx;
      font-weight: 700;
      color: $text-main;
      margin-bottom: 4rpx;
    }
    .exercise-meta {
      font-size: 22rpx;
      color: $text-light;
      font-weight: 500;
    }
  }
}

.exercise-item-enhanced {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  padding: 28rpx 32rpx;
  transition: all 0.25s ease;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  }

  .exercise-icon-wrapper {
    width: 100rpx;
    height: 100rpx;
    border-radius: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;
    flex-shrink: 0;
    box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.08);
  }

  .exercise-info-enhanced {
    flex: 1;
    min-width: 0;

    .exercise-name-enhanced {
      display: block;
      font-size: 32rpx;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 8rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .exercise-meta-row {
      display: flex;
      gap: 12rpx;
      flex-wrap: wrap;

      .muscle-tag {
        font-size: 22rpx;
        font-weight: 600;
        color: #64748b;
        background: #f8fafc;
        padding: 4rpx 14rpx;
        border-radius: 10rpx;
      }

      .equipment-tag {
        font-size: 22rpx;
        font-weight: 600;
        color: #94a3b8;
        background: #f1f5f9;
        padding: 4rpx 14rpx;
        border-radius: 10rpx;
      }
    }
  }

  .arrow-icon {
    padding: 12rpx;
    margin-left: 12rpx;
    opacity: 0.5;
    transition: opacity 0.2s;
  }

  &:hover .arrow-icon,
  &:active .arrow-icon {
    opacity: 1;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 100rpx;

  text {
    margin-top: 20rpx;
    font-size: 24rpx;
    color: #94a3b8;
  }
}

.modal-content {
  background-color: #fff;
  border-radius: 72rpx 72rpx 0 0;
  padding: 40rpx 50rpx 80rpx;

  .handle {
    width: 120rpx;
    height: 12rpx;
    background-color: #f1f5f9;
    border-radius: 100rpx;
    margin: 0 auto 60rpx;
  }

  .modal-title {
    display: block;
    font-size: 48rpx;
    font-weight: 800;
    color: $text-main;
    margin-bottom: 20rpx;
  }

  .tags {
    display: flex;
    gap: 16rpx;
    margin-bottom: 60rpx;
    .tag {
      padding: 10rpx 24rpx;
      border-radius: 16rpx;
      font-size: 20rpx;
      font-weight: 700;
      text-transform: uppercase;

      &.primary {
        background-color: $primary-light;
        color: $primary-color;
      }
      &.secondary {
        background-color: #f1f5f9;
        color: $text-muted;
      }
    }
  }
}

.modal-scroll {
  max-height: 600rpx;
  margin-bottom: 60rpx;
}

.section {
  margin-bottom: 40rpx;
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;

    .copy-btn {
      display: flex;
      align-items: center;
      gap: 6rpx;
      padding: 8rpx 20rpx;
      background-color: #f0f9ff;
      border-radius: 16rpx;
      border: 1px solid #bae6fd;

      text {
        font-size: 20rpx;
        color: #0ea5e9;
        font-weight: 700;
      }

      &:active {
        background-color: #e0f2fe;
        transform: scale(0.96);
      }
    }
  }
  .section-title {
    display: block;
    font-size: 22rpx;
    font-weight: 800;
    color: $text-light;
    text-transform: uppercase;
    letter-spacing: 4rpx;
    margin-bottom: 20rpx;

    &.warning {
      color: $warning-color;
    }
  }
  .section-text {
    font-size: 28rpx;
    color: $text-muted;
    line-height: 1.6;
    font-weight: 500;

    &.selectable {
      user-select: text;
      -webkit-user-select: text;
    }
  }

  .warning-box {
    background-color: #fffbeb;
    border: 2rpx solid #fef3c7;
    padding: 30rpx;
    border-radius: 32rpx;
    .warning-text {
      font-size: 24rpx;
      color: #b45309;
      line-height: 1.6;
      font-weight: 600;

      &.selectable {
        user-select: text;
        -webkit-user-select: text;
      }
    }
  }
}

.btn-confirm {
  width: 100%;
  height: 110rpx;
  background-color: $primary-color;
  color: #fff;
  border-radius: 36rpx;
  font-size: 32rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20rpx 40rpx rgba(14, 165, 233, 0.2);
  border: none;
}

.popup-wrapper {
  position: relative;
  z-index: 9999;
  background-color: #fff;
  padding-bottom: env(safe-area-inset-bottom);
}

:deep(.uni-popup) {
  z-index: 9999 !important;
}

:deep(.uni-popup__mask) {
  z-index: 9998 !important;
}

.custom-tag {
  font-size: 22rpx;
  font-weight: 600;
  color: #f97316;
  background: #fff7ed;
  padding: 4rpx 14rpx;
  border-radius: 10rpx;
  border: 1rpx solid #ffedd5;
}

.exercise-actions {
  display: flex;
  gap: 12rpx;
  margin-left: 12rpx;

  .action-btn {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;

    &:active {
      transform: scale(0.9);
    }
  }

  .edit-btn {
    background: #f0f9ff;
    border: 1rpx solid #e0f2fe;
  }

  .delete-btn {
    background: #fef2f2;
    border: 1rpx solid #fecaca;
  }
}

.add-custom-exercise-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  padding: 28rpx;
  margin-top: 20rpx;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border-radius: 24rpx;
  border: 2rpx dashed #bae6fd;
  transition: all 0.25s ease;

  text {
    font-size: 28rpx;
    font-weight: 600;
    color: #0ea5e9;
  }

  &:active {
    transform: scale(0.97);
    background: linear-gradient(135deg, #e0f2fe, #bae6fd);
  }
}

.exercise-form-wrapper {
  background: #fff;
  border-radius: 36rpx 36rpx 0 0;
  padding-bottom: env(safe-area-inset-bottom);
  max-height: 85vh;
  display: flex;
  flex-direction: column;

  .form-handle {
    width: 80rpx;
    height: 10rpx;
    background: #e2e8f0;
    border-radius: 10rpx;
    margin: 20rpx auto 0;
  }

  .form-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28rpx 36rpx 20rpx;

    .form-title {
      font-size: 34rpx;
      font-weight: 700;
      color: #1e293b;
    }

    .form-close {
      width: 56rpx;
      height: 56rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: #f1f5f9;

      &:active {
        background: #e2e8f0;
        transform: scale(0.92);
      }
    }
  }

  .form-scroll-area {
    flex: 1;
    padding: 0 36rpx;
    max-height: 55vh;
  }

  .form-field {
    margin-bottom: 28rpx;

    .field-label {
      display: block;
      font-size: 26rpx;
      font-weight: 600;
      color: #334155;
      margin-bottom: 12rpx;

      &.required::before {
        content: "*";
        color: #ef4444;
        margin-right: 6rpx;
      }
    }

    .field-input {
      width: 100%;
      height: 88rpx;
      padding: 0 24rpx;
      background: #f8fafc;
      border: 2rpx solid #e2e8f0;
      border-radius: 16rpx;
      font-size: 28rpx;
      color: #334155;
      box-sizing: border-box;
      transition: all 0.25s ease;

      &:focus {
        border-color: #0ea5e9;
        background: #fff;
        box-shadow: 0 0 0 4rpx rgba(14, 165, 233, 0.08);
      }
    }

    .field-textarea {
      width: 100%;
      min-height: 160rpx;
      padding: 20rpx 24rpx;
      background: #f8fafc;
      border: 2rpx solid #e2e8f0;
      border-radius: 16rpx;
      font-size: 28rpx;
      color: #334155;
      line-height: 1.6;
      box-sizing: border-box;
      transition: all 0.25s ease;

      &:focus {
        border-color: #0ea5e9;
        background: #fff;
        box-shadow: 0 0 0 4rpx rgba(14, 165, 233, 0.08);
      }
    }

    .field-picker {
      width: 100%;
      height: 88rpx;
      padding: 0 24rpx;
      background: #f8fafc;
      border: 2rpx solid #e2e8f0;
      border-radius: 16rpx;
      font-size: 28rpx;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-sizing: border-box;
      transition: all 0.25s ease;

      &.active {
        color: #334155;
        font-weight: 500;
      }

      .placeholder-text {
        color: #94a3b8;
      }
    }
  }

  .field-placeholder {
    color: #94a3b8;
  }

  .form-actions {
    display: flex;
    gap: 20rpx;
    padding: 24rpx 36rpx;
    border-top: 1rpx solid #f1f5f9;

    .form-btn {
      flex: 1;
      height: 88rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 24rpx;
      font-size: 30rpx;
      font-weight: 600;
      transition: all 0.2s ease;

      &:active {
        transform: scale(0.97);
      }
    }

    .cancel-btn {
      background: #f1f5f9;
      color: #64748b;
    }

    .submit-btn {
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      color: #fff;
      box-shadow: 0 4rpx 16rpx rgba(14, 165, 233, 0.25);
    }
  }
}
</style>
