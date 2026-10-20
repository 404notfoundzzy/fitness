<template>
  <view class="edit-page">
    <!-- 顶部导航 -->
    <view class="nav-header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="24" color="#0EA5E9"></uni-icons>
      </view>
      <text class="nav-title">{{ isEdit ? "编辑计划" : "新建计划" }}</text>
      <view class="save-btn" @click="savePlan">
        <text>保存</text>
      </view>
    </view>

    <!-- 表单内容 -->
    <scroll-view scroll-y class="form-scroll">
      <view class="form-container">
        <!-- 基本信息区 -->
        <view class="section-card">
          <view class="section-header">
            <uni-icons type="info" size="20" color="#0EA5E9"></uni-icons>
            <text class="section-title">基本信息</text>
          </view>

          <view class="form-item">
            <text class="label required">计划名称</text>
            <input
              v-model="formData.name"
              type="text"
              placeholder="例如：我的增肌计划"
              placeholder-class="placeholder"
              maxlength="50"
            />
          </view>

          <view class="form-item">
            <text class="label">计划描述</text>
            <textarea
              v-model="formData.description"
              placeholder="简单描述这个计划的特点和目标..."
              placeholder-class="placeholder"
              :maxlength="200"
              auto-height
            />
          </view>

          <view class="form-row">
            <view class="form-item half">
              <text class="label required">分化类型</text>
              <picker
                mode="selector"
                :range="splitTypeOptions"
                range-key="label"
                @change="onSplitTypeChange"
              >
                <view class="picker-value" :class="{ active: formData.type }">
                  {{ getSplitLabel(formData.type) || "请选择" }}
                  <uni-icons
                    type="bottom"
                    size="14"
                    color="#94A3B8"
                  ></uni-icons>
                </view>
              </picker>
            </view>

            <view class="form-item half">
              <text class="label">每周天数</text>
              <picker
                mode="selector"
                :range="[1, 2, 3, 4, 5, 6, 7]"
                @change="onDaysChange"
              >
                <view class="picker-value active">
                  {{ formData.daysPerWeek }}天
                  <uni-icons
                    type="bottom"
                    size="14"
                    color="#94A3B8"
                  ></uni-icons>
                </view>
              </picker>
            </view>
          </view>

          <view class="form-row">
            <view class="form-item half">
              <text class="label">难度等级</text>
              <picker
                mode="selector"
                :range="difficultyOptions"
                range-key="label"
                @change="onDifficultyChange"
              >
                <view
                  class="picker-value"
                  :class="{ active: formData.difficulty }"
                >
                  {{ getDiffLabel(formData.difficulty) || "请选择" }}
                  <uni-icons
                    type="bottom"
                    size="14"
                    color="#94A3B8"
                  ></uni-icons>
                </view>
              </picker>
            </view>

            <view class="form-item half">
              <text class="label">适用人群</text>
              <input
                v-model="formData.targetAudience"
                type="text"
                placeholder="例如：新手/进阶"
                placeholder-class="placeholder"
              />
            </view>
          </view>
        </view>

        <!-- 训练日安排区 -->
        <view class="section-card">
          <view class="section-header">
            <uni-icons type="calendar" size="20" color="#F97316"></uni-icons>
            <text class="section-title">每日安排</text>
            <view class="add-day-btn" @click="addDay">
              <uni-icons type="plusempty" size="18" color="#0EA5E9"></uni-icons>
              <text>添加训练日</text>
            </view>
          </view>

          <view
            v-for="(day, dayIndex) in formData.schedule"
            :key="dayIndex"
            class="day-block"
          >
            <view class="day-header">
              <view class="day-badge">Day {{ day.dayNumber }}</view>
              <input
                v-model="day.dayName"
                class="day-name-input"
                placeholder="训练日名称（如：胸部训练）"
                placeholder-class="placeholder"
              />
              <view class="delete-day-btn" @click="removeDay(dayIndex)">
                <uni-icons
                  type="closeempty"
                  size="18"
                  color="#EF4444"
                ></uni-icons>
              </view>
            </view>

            <view class="focus-input-wrap">
              <input
                v-model="day.focus"
                class="focus-input"
                placeholder="重点肌群（如：胸大肌、三角肌前束）"
                placeholder-class="placeholder"
              />
            </view>

            <!-- 动作列表 -->
            <view class="exercises-area">
              <view
                v-for="(exercise, exIndex) in day.exercises"
                :key="exIndex"
                class="exercise-edit-row"
              >
                <view class="ex-drag-handle">
                  <uni-icons type="bars" size="16" color="#CBD5E1"></uni-icons>
                </view>

                <view class="ex-fields">
                  <input
                    v-model="exercise.name"
                    class="ex-name-field"
                    placeholder="动作名称"
                    placeholder-class="placeholder"
                  />

                  <view class="ex-params-row">
                    <input
                      v-model.number="exercise.sets"
                      type="number"
                      class="param-mini sets-field"
                      placeholder="组数"
                      placeholder-class="placeholder"
                    />
                    <text class="param-sep">×</text>
                    <input
                      v-model="exercise.reps"
                      class="param-mini reps-field"
                      placeholder="次数(如8-12)"
                      placeholder-class="placeholder"
                    />
                    <text class="param-label">休息</text>
                    <input
                      v-model.number="exercise.restSeconds"
                      type="number"
                      class="param-mini rest-field"
                      placeholder="秒"
                      placeholder-class="placeholder"
                    />
                  </view>
                </view>

                <view
                  class="remove-ex-btn"
                  @click="removeExercise(dayIndex, exIndex)"
                >
                  <uni-icons type="clear" size="18" color="#EF4444"></uni-icons>
                </view>
              </view>

              <!-- 添加动作按钮 -->
              <view
                class="add-exercise-btn"
                @click="openExercisePicker(dayIndex)"
              >
                <uni-icons type="plus" size="16" color="#0EA5E9"></uni-icons>
                <text>添加动作</text>
              </view>
            </view>
          </view>

          <!-- 空状态提示 -->
          <view v-if="formData.schedule.length === 0" class="empty-days-tip">
            <uni-icons type="info" size="40" color="#CBD5E1"></uni-icons>
            <text>点击上方按钮添加训练日</text>
          </view>
        </view>

        <!-- 标签区 -->
        <view class="section-card">
          <view class="section-header">
            <uni-icons type="tag" size="20" color="#10B981"></uni-icons>
            <text class="section-title">标签</text>
          </view>

          <view class="tags-input-area">
            <view
              v-for="(tag, tagIndex) in formData.tags"
              :key="tagIndex"
              class="tag-chip"
            >
              <text>{{ tag }}</text>
              <view class="remove-tag" @click="removeTag(tagIndex)">
                <uni-icons
                  type="closeempty"
                  size="12"
                  color="#64748B"
                ></uni-icons>
              </view>
            </view>

            <input
              v-if="!isAddingTag"
              v-model="newTag"
              class="tag-input"
              placeholder="+ 添加标签"
              placeholder-class="placeholder"
              @confirm="addTag"
              @focus="isAddingTag = true"
            />
          </view>

          <view class="quick-tags">
            <text
              v-for="qTag in quickTags"
              :key="qTag"
              class="quick-tag-pill"
              @click="addQuickTag(qTag)"
            >
              {{ qTag }}
            </text>
          </view>
        </view>

        <!-- 底部间距 -->
        <view style="height: 180rpx"></view>
      </view>
    </scroll-view>

    <!-- 动作选择器弹窗 -->
    <uni-popup
      ref="exercisePickerPopup"
      type="bottom"
      :safe-area-inset-bottom="true"
      :mask-click="true"
      @change="onPickerPopupChange"
    >
      <view class="picker-wrapper">
        <view class="picker-handle"></view>
        <view class="picker-header">
          <text class="picker-title">选择动作</text>
          <view class="picker-close" @click="closeExercisePicker">
            <uni-icons type="closeempty" size="20" color="#94A3B8"></uni-icons>
          </view>
        </view>

        <view class="picker-search">
          <uni-icons type="search" size="18" color="#94A3B8"></uni-icons>
          <input
            v-model="pickerSearchQuery"
            class="picker-search-input"
            placeholder="搜索动作名称或肌群..."
            placeholder-class="field-placeholder"
            @input="onPickerSearch"
          />
        </view>

        <scroll-view scroll-y class="picker-list">
          <view
            v-for="item in pickerFilteredExercises"
            :key="item.id"
            class="picker-item"
            @click="selectExerciseFromPicker(item)"
          >
            <view
              class="picker-item-icon"
              :style="{ background: getPickerIconBg(item.category) }"
            >
              <uni-icons
                :type="getPickerIconType(item.category)"
                size="20"
                :color="getPickerIconColor(item.category)"
              ></uni-icons>
            </view>
            <view class="picker-item-info">
              <text class="picker-item-name">{{ item.name }}</text>
              <view class="picker-item-meta">
                <text class="picker-muscle-tag">{{ item.muscleGroup }}</text>
                <text v-if="item.isSystem === 0" class="picker-custom-tag"
                  >自定义</text
                >
              </view>
            </view>
            <uni-icons type="plus-filled" size="22" color="#0EA5E9"></uni-icons>
          </view>

          <view
            v-if="pickerSearchQuery && pickerFilteredExercises.length === 0"
            class="picker-empty"
          >
            <text class="picker-empty-text"
              >未找到"{{ pickerSearchQuery }}"</text
            >
            <view class="picker-create-btn" @click="createExerciseFromPicker">
              <uni-icons type="plus" size="16" color="#fff"></uni-icons>
              <text>创建自定义动作"{{ pickerSearchQuery }}"</text>
            </view>
          </view>

          <view
            v-if="!pickerSearchQuery && pickerFilteredExercises.length === 0"
            class="picker-empty"
          >
            <text class="picker-empty-text">暂无动作数据</text>
          </view>
        </scroll-view>

        <view class="picker-footer">
          <view class="picker-manual-btn" @click="addExerciseManual">
            <uni-icons type="compose" size="18" color="#0EA5E9"></uni-icons>
            <text>手动输入</text>
          </view>
        </view>
      </view>
    </uni-popup>

    <!-- 自定义动作快速创建弹窗 -->
    <uni-popup
      ref="quickCreatePopup"
      type="bottom"
      :safe-area-inset-bottom="true"
      :mask-click="false"
    >
      <view class="quick-create-wrapper">
        <view class="picker-handle"></view>
        <view class="picker-header">
          <text class="picker-title">创建自定义动作</text>
          <view class="picker-close" @click="closeQuickCreate">
            <uni-icons type="closeempty" size="20" color="#94A3B8"></uni-icons>
          </view>
        </view>

        <view class="quick-create-form">
          <view class="form-field">
            <text class="field-label required">动作名称</text>
            <input
              v-model="quickCreateForm.name"
              class="field-input"
              placeholder="输入动作名称"
              placeholder-class="field-placeholder"
              maxlength="30"
            />
          </view>

          <view class="form-field">
            <text class="field-label required">动作分类</text>
            <picker
              mode="selector"
              :range="categoryOptions"
              @change="onQuickCategoryPick"
            >
              <view
                class="field-picker"
                :class="{ active: quickCreateForm.category }"
              >
                <text
                  :class="{ 'placeholder-text': !quickCreateForm.category }"
                >
                  {{ quickCreateForm.category || "请选择分类" }}
                </text>
                <uni-icons type="bottom" size="14" color="#94A3B8"></uni-icons>
              </view>
            </picker>
          </view>

          <view class="form-field">
            <text class="field-label required">目标肌群</text>
            <input
              v-model="quickCreateForm.muscleGroup"
              class="field-input"
              placeholder="例如：核心、腹横肌"
              placeholder-class="field-placeholder"
              maxlength="20"
            />
          </view>
        </view>

        <view class="quick-create-actions">
          <view class="form-btn cancel-btn" @click="closeQuickCreate"
            >取消</view
          >
          <view
            class="form-btn submit-btn"
            @click="submitQuickCreate"
            :class="{ disabled: quickCreateSubmitting }"
          >
            创建并添加
          </view>
        </view>
      </view>
    </uni-popup>

    <ResultModal ref="resultModal" />
    <DeleteConfirm
      v-model:visible="showDeleteDayConfirm"
      type="general"
      :itemName="deleteDayName"
      @confirm="confirmDeleteDay"
      @cancel="showDeleteDayConfirm = false"
    />
  </view>
</template>

<script>
import { getSplitTypeLabel, getDifficultyLabel } from "@/data/training-plans";
import {
  getExercises,
  createCustomExercise,
  createCustomPlan,
} from "@/api/index";
import { adaptPlanForApi } from "@/utils/planAdapter.js";
import ResultModal from "@/components/ResultModal.vue";
import DeleteConfirm from "@/components/DeleteConfirm.vue";

export default {
  components: {
    ResultModal,
    DeleteConfirm,
  },
  data() {
    return {
      isEdit: false,
      editId: null,
      showDeleteDayConfirm: false,
      deleteDayIndex: null,
      deleteDayName: "",

      splitTypeOptions: [
        { label: "五分化", value: "five-split" },
        { label: "三分化(PPL)", value: "three-split" },
        { label: "改良三分化", value: "kai-three-split" },
        { label: "一分化(全身)", value: "full-body" },
        { label: "自定义", value: "custom" },
      ],

      difficultyOptions: [
        { label: "初级", value: "beginner" },
        { label: "中级", value: "intermediate" },
        { label: "进阶", value: "advanced" },
      ],

      quickTags: ["增肌", "减脂", "力量", "耐力", "塑形", "康复"],

      newTag: "",
      isAddingTag: false,

      currentDayIndex: null,
      pickerSearchQuery: "",
      pickerExercises: [],
      pickerExercisesLoading: false,
      pickerSearchTimer: null,

      quickCreateForm: {
        name: "",
        category: "",
        muscleGroup: "",
      },
      quickCreateSubmitting: false,

      categoryOptions: [
        "胸部肌群",
        "背部肌群",
        "下肢肌群",
        "肩部肌群",
        "手臂肌群",
        "核心训练",
        "全身有氧",
      ],

      formData: {
        name: "",
        description: "",
        type: "",
        daysPerWeek: 3,
        difficulty: "intermediate",
        targetAudience: "",
        tags: [],
        schedule: [],
      },
    };
  },

  onLoad(options) {
    if (options.id) {
      this.isEdit = true;
      this.editId = options.id;
      this.loadExistingPlan(options.id);
    } else {
      this.initEmptyForm();
    }
  },

  computed: {
    pickerFilteredExercises() {
      if (!this.pickerSearchQuery) return this.pickerExercises;
      const q = this.pickerSearchQuery.toLowerCase();
      return this.pickerExercises.filter(
        (ex) =>
          ex.name.toLowerCase().includes(q) ||
          (ex.muscleGroup && ex.muscleGroup.toLowerCase().includes(q)),
      );
    },
  },

  methods: {
    initEmptyForm() {
      this.formData = {
        name: "",
        description: "",
        type: "",
        daysPerWeek: 3,
        difficulty: "intermediate",
        targetAudience: "",
        tags: [],
        schedule: [],
      };
    },

    loadExistingPlan(id) {
      // TODO: 从本地存储或后端加载已有计划
      const customPlans = uni.getStorageSync("custom_training_plans") || [];
      const plan = customPlans.find((p) => p.id === id);
      if (plan) {
        this.formData = JSON.parse(JSON.stringify(plan));
      }
    },

    goBack() {
      try {
        const pages = getCurrentPages();
        console.log("返回按钮点击 - 页面栈长度:", pages.length);

        if (pages.length > 1) {
          uni.navigateBack({
            delta: 1,
            success: () => {
              console.log("返回成功");
            },
            fail: (err) => {
              console.log("navigateBack失败，使用navigateTo:", err);
              uni.navigateTo({
                url: "/pages/knowledge/training-plan-list",
              });
            },
          });
        } else {
          console.log("页面栈只有当前页，直接跳转列表页");
          uni.navigateTo({
            url: "/pages/knowledge/training-plan-list",
          });
        }
      } catch (e) {
        console.error("返回出错:", e);
        uni.navigateTo({
          url: "/pages/knowledge/training-plan-list",
        });
      }
    },

    onSplitTypeChange(e) {
      const index = e.detail.value;
      this.formData.type = this.splitTypeOptions[index].value;

      // 自动设置每周天数
      const daysMap = {
        "five-split": 5,
        "three-split": 3,
        "kai-three-split": 3,
        "full-body": 1,
        custom: this.formData.daysPerWeek,
      };
      if (daysMap[this.formData.type]) {
        this.formData.daysPerWeek = daysMap[this.formData.type];
      }
    },

    onDaysChange(e) {
      this.formData.daysPerWeek = parseInt(e.detail.value) + 1;
    },

    onDifficultyChange(e) {
      const index = e.detail.value;
      this.formData.difficulty = this.difficultyOptions[index].value;
    },

    addDay() {
      const dayNumber = this.formData.schedule.length + 1;
      this.formData.schedule.push({
        dayNumber: dayNumber,
        dayName: "",
        focus: "",
        exercises: [],
      });
    },

    removeDay(index) {
      if (this.formData.schedule.length <= 1) {
        this.$refs.resultModal.show({
          type: "warning",
          theme: "plan",
          title: "无法删除",
          desc: "至少需要保留一个训练日",
          autoClose: 2000,
        });
        return;
      }

      this.deleteDayIndex = index;
      this.deleteDayName = this.formData.schedule[index]?.dayName || "训练日";
      this.showDeleteDayConfirm = true;
    },

    confirmDeleteDay() {
      this.showDeleteDayConfirm = false;
      if (this.deleteDayIndex !== null) {
        this.formData.schedule.splice(this.deleteDayIndex, 1);
        this.renumberDays();
        this.deleteDayIndex = null;
        this.deleteDayName = "";
      }
    },

    renumberDays() {
      this.formData.schedule.forEach((day, index) => {
        day.dayNumber = index + 1;
      });
    },

    addExercise(dayIndex) {
      this.formData.schedule[dayIndex].exercises.push({
        name: "",
        sets: 3,
        reps: "8-12",
        restSeconds: 60,
        notes: "",
      });
    },

    async openExercisePicker(dayIndex) {
      this.currentDayIndex = dayIndex;
      this.pickerSearchQuery = "";
      this.$refs.exercisePickerPopup.open();
      await this.fetchPickerExercises();
    },

    closeExercisePicker() {
      this.$refs.exercisePickerPopup.close();
    },

    onPickerPopupChange(e) {
      if (!e.show) {
        this.currentDayIndex = null;
      }
    },

    onPickerSearch() {
      if (this.pickerSearchTimer) clearTimeout(this.pickerSearchTimer);
      this.pickerSearchTimer = setTimeout(() => {
        this.fetchPickerExercises();
      }, 400);
    },

    async fetchPickerExercises() {
      this.pickerExercisesLoading = true;
      try {
        const data = await getExercises(this.pickerSearchQuery);
        this.pickerExercises = Array.isArray(data) ? data : [];
      } catch (e) {
        this.pickerExercises = [];
      } finally {
        this.pickerExercisesLoading = false;
      }
    },

    selectExerciseFromPicker(item) {
      if (this.currentDayIndex === null) return;
      this.formData.schedule[this.currentDayIndex].exercises.push({
        exerciseId: item.id,
        name: item.name,
        sets: 3,
        reps: "8-12",
        restSeconds: 60,
        notes: "",
      });
      this.$refs.resultModal.show({
        type: "success",
        theme: "plan",
        title: "已添加",
        desc: `${item.name}已添加到训练日，继续添加更多动作吧 💪`,
        autoClose: 1500,
      });
      this.closeExercisePicker();
    },

    addExerciseManual() {
      if (this.currentDayIndex === null) return;
      this.closeExercisePicker();
      this.addExercise(this.currentDayIndex);
    },

    createExerciseFromPicker() {
      this.quickCreateForm = {
        name: this.pickerSearchQuery,
        category: "",
        muscleGroup: "",
      };
      this.closeExercisePicker();
      this.$nextTick(() => {
        this.$refs.quickCreatePopup.open();
      });
    },

    closeQuickCreate() {
      this.$refs.quickCreatePopup.close();
    },

    onQuickCategoryPick(e) {
      this.quickCreateForm.category = this.categoryOptions[e.detail.value];
    },

    async submitQuickCreate() {
      if (!this.quickCreateForm.name.trim()) {
        this.$refs.resultModal.show({
          type: "warning",
          theme: "plan",
          title: "请输入动作名称",
          desc: "动作名称不能为空，请填写后重试",
          autoClose: 1500,
        });
        return;
      }
      if (!this.quickCreateForm.category) {
        this.$refs.resultModal.show({
          type: "warning",
          theme: "plan",
          title: "请选择动作分类",
          desc: "动作分类不能为空，请选择后重试",
          autoClose: 1500,
        });
        return;
      }
      if (!this.quickCreateForm.muscleGroup.trim()) {
        this.$refs.resultModal.show({
          type: "warning",
          theme: "plan",
          title: "请输入目标肌群",
          desc: "目标肌群不能为空，请填写后重试",
          autoClose: 1500,
        });
        return;
      }
      if (this.quickCreateSubmitting) return;
      this.quickCreateSubmitting = true;

      try {
        const created = await createCustomExercise({
          name: this.quickCreateForm.name.trim(),
          category: this.quickCreateForm.category,
          muscleGroup: this.quickCreateForm.muscleGroup.trim(),
        });

        if (this.currentDayIndex !== null) {
          this.formData.schedule[this.currentDayIndex].exercises.push({
            exerciseId: created.id,
            name: created.name || this.quickCreateForm.name.trim(),
            sets: 3,
            reps: "8-12",
            restSeconds: 60,
            notes: "",
          });
        }

        this.closeQuickCreate();
        this.$refs.resultModal.show({
          type: "success",
          theme: "plan",
          title: "创建成功 ✨",
          desc: "自定义动作已创建并添加到训练日",
          autoClose: 2000,
        });
      } catch (e) {
        this.$refs.resultModal.show({
          type: "error",
          theme: "plan",
          title: "创建失败",
          desc: e.message || "创建失败，请稍后重试",
          autoClose: 2000,
        });
      } finally {
        this.quickCreateSubmitting = false;
      }
    },

    getPickerIconBg(category) {
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

    getPickerIconType(category) {
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

    getPickerIconColor(category) {
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

    removeExercise(dayIndex, exerciseIndex) {
      this.formData.schedule[dayIndex].exercises.splice(exerciseIndex, 1);
    },

    addTag() {
      if (!this.newTag.trim()) return;

      if (this.formData.tags.includes(this.newTag.trim())) {
        this.$refs.resultModal.show({
          type: "warning",
          theme: "plan",
          title: "标签已存在",
          desc: "请输入不同的标签名称",
          autoClose: 2000,
        });
        return;
      }

      this.formData.tags.push(this.newTag.trim());
      this.newTag = "";
      this.isAddingTag = false;
    },

    addQuickTag(tag) {
      if (this.formData.tags.includes(tag)) return;
      this.formData.tags.push(tag);
    },

    removeTag(index) {
      this.formData.tags.splice(index, 1);
    },

    validateForm() {
      if (!this.formData.name.trim()) {
        this.$refs.resultModal.show({
          type: "warning",
          theme: "plan",
          title: "请输入计划名称",
          desc: "计划名称不能为空",
          autoClose: 2000,
        });
        return false;
      }

      if (!this.formData.type) {
        this.$refs.resultModal.show({
          type: "warning",
          theme: "plan",
          title: "请选择分化类型",
          desc: "分化类型是必选项",
          autoClose: 2000,
        });
        return false;
      }

      if (this.formData.schedule.length === 0) {
        this.$refs.resultModal.show({
          type: "warning",
          theme: "plan",
          title: "请添加训练日",
          desc: "至少需要一个训练日",
          autoClose: 2000,
        });
        return false;
      }

      for (let i = 0; i < this.formData.schedule.length; i++) {
        const day = this.formData.schedule[i];
        if (!day.dayName.trim()) {
          this.$refs.resultModal.show({
            type: "warning",
            theme: "plan",
            title: "缺少训练日名称",
            desc: `第${i + 1}天需要填写名称`,
            autoClose: 2000,
          });
          return false;
        }

        if (day.exercises.length === 0) {
          this.$refs.resultModal.show({
            type: "warning",
            theme: "plan",
            title: "缺少训练动作",
            desc: `第${i + 1}天(${day.dayName})需要至少一个动作`,
            autoClose: 2000,
          });
          return false;
        }

        for (let j = 0; j < day.exercises.length; j++) {
          const ex = day.exercises[j];
          if (!ex.name.trim()) {
            this.$refs.resultModal.show({
              type: "warning",
              theme: "plan",
              title: "缺少动作名称",
              desc: `${day.dayName}第${j + 1}个动作需要填写名称`,
              autoClose: 2000,
            });
            return false;
          }
        }
      }

      return true;
    },

    savePlan() {
      if (!this.validateForm()) return;

      const localPlan = {
        name: this.formData.name.trim(),
        description: this.formData.description.trim(),
        type: this.formData.type,
        daysPerWeek: this.formData.daysPerWeek,
        difficulty: this.formData.difficulty,
        targetAudience: this.formData.targetAudience.trim(),
        tags: this.formData.tags,
        planType: 0,
        schedule: this.formData.schedule.map((day) => ({
          day: day.dayNumber,
          name: day.dayName.trim(),
          focus: day.focus.trim(),
          exercises: day.exercises.map((ex) => ({
            id: ex.exerciseId || null,
            name: ex.name.trim(),
            sets: ex.sets,
            reps: ex.reps,
            restSeconds: ex.restSeconds,
            notes: ex.notes || "",
          })),
        })),
      };

      const planData = adaptPlanForApi(localPlan);

      if (this.isEdit && this.editId) {
        planData.id = this.editId;
      }

      this.savePlanToBackend(planData);
    },

    async savePlanToBackend(planData) {
      uni.showLoading({ title: "保存中..." });
      try {
        await createCustomPlan(planData);
        uni.hideLoading();
        this.$refs.resultModal.show({
          type: "success",
          theme: "plan",
          title: "保存成功 🎉",
          desc: "训练计划已保存，即将返回列表",
          autoClose: 1500,
        });
        this.afterSave();
      } catch (e) {
        uni.hideLoading();
        this.savePlanToLocal(planData);
      }
    },

    savePlanToLocal(planData) {
      const localData = {
        id: this.editId || Date.now().toString(),
        ...planData,
        source: "user",
        createTime: this.isEdit ? undefined : new Date().toISOString(),
        updateTime: new Date().toISOString(),
      };

      let customPlans = uni.getStorageSync("custom_training_plans") || [];

      if (this.isEdit && this.editId) {
        const idx = customPlans.findIndex((p) => p.id === this.editId);
        if (idx !== -1) {
          customPlans[idx] = { ...customPlans[idx], ...localData };
        }
      } else {
        customPlans.push(localData);
      }

      uni.setStorageSync("custom_training_plans", customPlans);
      this.$refs.resultModal.show({
        type: "success",
        theme: "plan",
        title: "已保存到本地 📱",
        desc: "网络异常，计划已保存到本地，同步后可上传",
        autoClose: 2000,
      });
      this.afterSave();
    },

    afterSave() {
      setTimeout(() => {
        uni.navigateBack();
      }, 1800);
    },

    getSplitLabel(type) {
      const option = this.splitTypeOptions.find((o) => o.value === type);
      return option ? option.label : "";
    },

    getDiffLabel(difficulty) {
      const option = this.difficultyOptions.find((o) => o.value === difficulty);
      return option ? option.label : "";
    },

    getSplitTypeLabel(type) {
      return getSplitTypeLabel(type);
    },

    getDifficultyLabel(difficulty) {
      return getDifficultyLabel(difficulty);
    },
  },
};
</script>

<style lang="scss" scoped>
.edit-page {
  min-height: 100vh;
  padding-top: 100rpx;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 32rpx;
  background: white;
  box-shadow:
    0 2rpx 12rpx rgba(0, 0, 0, 0.04),
    0 1rpx 3rpx rgba(0, 0, 0, 0.02);
  position: sticky;
  top: 0;
  z-index: 100;

  .back-btn {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s ease;
    position: relative;
    z-index: 101;
    cursor: pointer;

    &:active {
      background-color: rgba(14, 165, 233, 0.1);
    }
  }

  .nav-title {
    font-size: 36rpx;
    font-weight: 700;
    color: #1e293b;
    text-align: center;
  }

  .save-btn {
    padding: 14rpx 32rpx;
    background: linear-gradient(135deg, #0ea5e9, #0284c7);
    border-radius: 26rpx;
    box-shadow: 0 4rpx 12rpx rgba(14, 165, 233, 0.25);
    transition: all 0.25s ease;

    text {
      font-size: 28rpx;
      font-weight: 600;
      color: white;
      letter-spacing: 0.5rpx;
    }

    &:active {
      transform: scale(0.96);
      box-shadow: 0 2rpx 6rpx rgba(14, 165, 233, 0.2);
    }
  }
}

.form-scroll {
  height: calc(100vh - 100rpx - 96rpx);
  padding: 28rpx 30rpx;
  box-sizing: border-box;
}

.form-container {
}

.section-card {
  background: white;
  border-radius: 28rpx;
  padding: 34rpx 30rpx;
  margin-bottom: 26rpx;
  box-shadow:
    0 4rpx 20rpx rgba(0, 0, 0, 0.05),
    0 1rpx 3rpx rgba(0, 0, 0, 0.02);
  border: 1rpx solid rgba(226, 232, 240, 0.6);
  box-sizing: border-box;

  .section-header {
    display: flex;
    align-items: center;
    gap: 14rpx;
    margin-bottom: 30rpx;

    .section-title {
      flex: 1;
      font-size: 33rpx;
      font-weight: 700;
      color: #1e293b;
      letter-spacing: 0.3rpx;
    }

    .add-day-btn {
      display: flex;
      align-items: center;
      gap: 8rpx;
      padding: 10rpx 22rpx;
      background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
      border-radius: 22rpx;
      border: 1rpx solid rgba(14, 165, 233, 0.15);
      transition: all 0.2s ease;

      text {
        font-size: 25rpx;
        color: #0ea5e9;
        font-weight: 600;
      }

      &:active {
        transform: scale(0.97);
        background: linear-gradient(135deg, #dbeafe, #bfdbfe);
      }
    }
  }
}

.form-item {
  margin-bottom: 26rpx;

  .label {
    display: block;
    font-size: 27rpx;
    font-weight: 600;
    color: #334155;
    margin-bottom: 14rpx;
    letter-spacing: 0.3rpx;

    &.required::before {
      content: "*";
      color: #ef4444;
      margin-right: 7rpx;
      font-weight: 700;
    }
  }

  input,
  textarea {
    width: 100%;
    height: 92rpx;
    padding: 0 26rpx;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border: 2rpx solid #e2e8f0;
    border-radius: 18rpx;
    font-size: 28rpx;
    color: #334155;
    box-sizing: border-box;
    transition: all 0.25s ease;

    &:focus {
      border-color: #0ea5e9;
      background: white;
      box-shadow: 0 0 0 4rpx rgba(14, 165, 233, 0.08);
    }
  }

  textarea {
    height: auto;
    min-height: 130rpx;
    padding: 22rpx 26rpx;
    line-height: 1.55;
  }

  &.half {
    width: calc(50% - 13rpx);
    display: inline-block;
    vertical-align: top;
  }
}

.form-row {
  display: flex;
  gap: 26rpx;

  .form-item.half {
    width: calc(50% - 13rpx);
  }
}

.picker-value {
  width: 100%;
  height: 92rpx;
  line-height: 88rpx;
  padding: 0 26rpx;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 2rpx solid #e2e8f0;
  border-radius: 18rpx;
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
}

.placeholder {
  color: #94a3b8;
}

/* 训练日区块 */
.day-block {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 22rpx;
  padding: 26rpx;
  margin-bottom: 22rpx;
  border: 1rpx solid #e2e8f0;
  box-sizing: border-box;
  transition: all 0.25s ease;

  &:active {
    border-color: #cbd5e1;
  }

  .day-header {
    display: flex;
    align-items: center;
    gap: 18rpx;
    margin-bottom: 18rpx;
  }

  .day-badge {
    padding: 8rpx 18rpx;
    background: linear-gradient(135deg, #0ea5e9, #38bdf8);
    color: white;
    font-size: 23rpx;
    font-weight: 700;
    border-radius: 18rpx;
    flex-shrink: 0;
    letter-spacing: 0.5rpx;
    box-shadow: 0 2rpx 8rpx rgba(14, 165, 233, 0.2);
  }

  .day-name-input {
    flex: 1;
    height: 76rpx;
    padding: 0 22rpx;
    background: white;
    border: 2rpx solid #e2e8f0;
    border-radius: 14rpx;
    font-size: 28rpx;
    font-weight: 600;
    color: #1e293b;
    box-sizing: border-box;
    transition: all 0.25s ease;

    &:focus {
      border-color: #0ea5e9;
      box-shadow: 0 0 0 4rpx rgba(14, 165, 233, 0.08);
    }
  }

  .delete-day-btn {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 50%;
    transition: background-color 0.2s ease;

    &:active {
      background-color: rgba(239, 68, 68, 0.1);
    }
  }

  .focus-input-wrap {
    margin-bottom: 18rpx;
  }

  .focus-input {
    width: 100%;
    height: 68rpx;
    padding: 0 22rpx;
    background: white;
    border: 1rpx dashed #cbd5e1;
    border-radius: 14rpx;
    font-size: 25rpx;
    color: #64748b;
    box-sizing: border-box;
    transition: all 0.25s ease;

    &:focus {
      border-color: #94a3b8;
      border-style: solid;
      background: white;
    }
  }
}

.exercises-area {
  background: white;
  border-radius: 18rpx;
  padding: 18rpx;
  border: 1rpx solid #f1f5f9;
  box-sizing: border-box;
}

.exercise-edit-row {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #f8fafc;
  transition: background-color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background-color: #fafbfc;
    margin: 0 -10rpx;
    padding: 18rpx 10rpx;
    border-radius: 12rpx;
  }

  .ex-drag-handle {
    padding-top: 14rpx;
    flex-shrink: 0;
  }

  .ex-fields {
    flex: 1;
    min-width: 0;

    .ex-name-field {
      width: 100%;
      height: 72rpx;
      padding: 0 18rpx;
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      border: 1rpx solid #e2e8f0;
      border-radius: 12rpx;
      font-size: 27rpx;
      color: #334155;
      margin-bottom: 12rpx;
      box-sizing: border-box;
      transition: all 0.25s ease;

      &:focus {
        border-color: #0ea5e9;
        background: white;
        box-shadow: 0 0 0 3rpx rgba(14, 165, 233, 0.06);
      }
    }

    .ex-params-row {
      display: flex;
      align-items: center;
      gap: 10rpx;
      flex-wrap: wrap;
    }

    .param-mini {
      width: 106rpx;
      height: 60rpx;
      padding: 0 14rpx;
      background: white;
      border: 1rpx solid #e2e8f0;
      border-radius: 10rpx;
      font-size: 24rpx;
      color: #334155;
      text-align: center;
      box-sizing: border-box;
      font-weight: 500;
      transition: all 0.2s ease;

      &.sets-field {
        background: linear-gradient(135deg, #dbeafe, #bfdbfe);
        border-color: #93c5fd;
        color: #1d4ed8;
        font-weight: 600;
      }

      &.reps-field {
        flex: 1;
        min-width: 130rpx;
        background: linear-gradient(135deg, #dcfce7, #bbf7d0);
        border-color: #86efac;
        color: #15803d;
        font-weight: 600;
      }

      &.rest-field {
        width: 96rpx;
        background: linear-gradient(135deg, #fef3c7, #fde68a);
        border-color: #fcd34d;
        color: #b45309;
        font-weight: 600;
      }

      &:focus {
        outline: none;
        box-shadow: 0 0 0 3rpx rgba(14, 165, 233, 0.1);
      }
    }

    .param-sep {
      color: #94a3b8;
      font-size: 26rpx;
      font-weight: 600;
    }

    .param-label {
      font-size: 23rpx;
      color: #94a3b8;
      font-weight: 500;
    }
  }

  .remove-ex-btn {
    padding-top: 14rpx;
    flex-shrink: 0;
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s ease;

    &:active {
      background-color: rgba(239, 68, 68, 0.1);
    }
  }
}

.add-exercise-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  height: 76rpx;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border: 2rpx dashed #93c5fd;
  border-radius: 14rpx;
  margin-top: 14rpx;
  transition: all 0.25s ease;

  text {
    font-size: 25rpx;
    color: #0ea5e9;
    font-weight: 600;
  }

  &:active {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    transform: scale(0.99);
  }
}

.empty-days-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 70rpx 0;
  gap: 18rpx;

  text {
    font-size: 29rpx;
    color: #94a3b8;
    font-weight: 500;
  }
}

/* 标签区 */
.tags-input-area {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  align-items: center;
  min-height: 86rpx;
  padding: 18rpx;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 18rpx;
  border: 1rpx solid #e2e8f0;
  box-sizing: border-box;
  transition: all 0.25s ease;

  &:focus-within {
    border-color: #0ea5e9;
    box-shadow: 0 0 0 4rpx rgba(14, 165, 233, 0.06);
  }
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  padding: 10rpx 18rpx;
  background: linear-gradient(135deg, #e0f2fe, #bae6fd);
  color: #0369a1;
  border-radius: 18rpx;
  font-size: 25rpx;
  font-weight: 600;
  border: 1rpx solid rgba(14, 165, 233, 0.15);
  transition: all 0.2s ease;

  .remove-tag {
    width: 34rpx;
    height: 34rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s ease;

    &:active {
      background-color: rgba(14, 165, 233, 0.15);
    }
  }
}

.tag-input {
  flex: 1;
  min-width: 150rpx;
  height: 56rpx;
  font-size: 27rpx;
  color: #334155;
  background: transparent;
  font-weight: 500;
}

.quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 18rpx;
}

.quick-tag-pill {
  padding: 10rpx 22rpx;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  color: #64748b;
  border-radius: 18rpx;
  font-size: 25rpx;
  font-weight: 500;
  border: 1rpx solid transparent;
  transition: all 0.25s ease;

  &:active {
    background: linear-gradient(135deg, #e0f2fe, #bae6fd);
    color: #0ea5e9;
    border-color: rgba(14, 165, 233, 0.2);
    transform: scale(0.97);
  }
}

.picker-wrapper,
.quick-create-wrapper {
  background: #fff;
  border-radius: 36rpx 36rpx 0 0;
  padding-bottom: env(safe-area-inset-bottom);
  max-height: 80vh;
  display: flex;
  flex-direction: column;

  .picker-handle {
    width: 80rpx;
    height: 10rpx;
    background: #e2e8f0;
    border-radius: 10rpx;
    margin: 20rpx auto 0;
  }

  .picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28rpx 36rpx 20rpx;

    .picker-title {
      font-size: 34rpx;
      font-weight: 700;
      color: #1e293b;
    }

    .picker-close {
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
}

.picker-search {
  display: flex;
  align-items: center;
  margin: 0 36rpx 20rpx;
  padding: 0 24rpx;
  height: 80rpx;
  background: #f8fafc;
  border: 2rpx solid #e2e8f0;
  border-radius: 20rpx;
  transition: all 0.25s ease;

  &:focus-within {
    border-color: #0ea5e9;
    background: #fff;
    box-shadow: 0 0 0 4rpx rgba(14, 165, 233, 0.08);
  }

  .picker-search-input {
    flex: 1;
    margin-left: 14rpx;
    font-size: 28rpx;
    color: #334155;
  }
}

.picker-list {
  flex: 1;
  padding: 0 36rpx;
  max-height: 50vh;
}

.picker-item {
  display: flex;
  align-items: center;
  padding: 22rpx 0;
  border-bottom: 1rpx solid #f1f5f9;
  transition: all 0.2s ease;

  &:active {
    background: #f8fafc;
    transform: scale(0.99);
  }

  .picker-item-icon {
    width: 72rpx;
    height: 72rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20rpx;
    flex-shrink: 0;
  }

  .picker-item-info {
    flex: 1;
    min-width: 0;

    .picker-item-name {
      display: block;
      font-size: 29rpx;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 6rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .picker-item-meta {
      display: flex;
      gap: 10rpx;

      .picker-muscle-tag {
        font-size: 22rpx;
        color: #64748b;
        background: #f8fafc;
        padding: 2rpx 12rpx;
        border-radius: 8rpx;
      }

      .picker-custom-tag {
        font-size: 22rpx;
        color: #f97316;
        background: #fff7ed;
        padding: 2rpx 12rpx;
        border-radius: 8rpx;
        border: 1rpx solid #ffedd5;
      }
    }
  }
}

.picker-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
  gap: 24rpx;

  .picker-empty-text {
    font-size: 28rpx;
    color: #94a3b8;
  }

  .picker-create-btn {
    display: flex;
    align-items: center;
    gap: 10rpx;
    padding: 20rpx 36rpx;
    background: linear-gradient(135deg, #0ea5e9, #0284c7);
    border-radius: 24rpx;
    box-shadow: 0 4rpx 16rpx rgba(14, 165, 233, 0.25);

    text {
      font-size: 28rpx;
      font-weight: 600;
      color: #fff;
    }

    &:active {
      transform: scale(0.97);
    }
  }
}

.picker-footer {
  padding: 20rpx 36rpx;
  border-top: 1rpx solid #f1f5f9;

  .picker-manual-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10rpx;
    height: 80rpx;
    background: #f8fafc;
    border: 2rpx dashed #cbd5e1;
    border-radius: 20rpx;
    transition: all 0.2s ease;

    text {
      font-size: 28rpx;
      color: #0ea5e9;
      font-weight: 600;
    }

    &:active {
      background: #f0f9ff;
      transform: scale(0.98);
    }
  }
}

.quick-create-form {
  padding: 0 36rpx;

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
}

.quick-create-actions {
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

    &.disabled {
      opacity: 0.6;
      pointer-events: none;
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
</style>
