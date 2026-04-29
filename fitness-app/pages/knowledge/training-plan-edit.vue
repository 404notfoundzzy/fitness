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
              <view class="add-exercise-btn" @click="addExercise(dayIndex)">
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

    <!-- 保存确认弹窗 -->
    <uni-popup ref="savePopup" type="dialog">
      <uni-popup-dialog
        type="success"
        title="保存成功"
        content="训练计划已保存！"
        :duration="1500"
        @confirm="afterSave"
      ></uni-popup-dialog>
    </uni-popup>
  </view>
</template>

<script>
import { getSplitTypeLabel, getDifficultyLabel } from "@/data/training-plans";

export default {
  data() {
    return {
      isEdit: false,
      editId: null,

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
        uni.showToast({
          title: "至少保留一个训练日",
          icon: "none",
        });
        return;
      }

      uni.showModal({
        title: "提示",
        content: "确定删除该训练日吗？",
        success: (res) => {
          if (res.confirm) {
            this.formData.schedule.splice(index, 1);
            this.renumberDays();
          }
        },
      });
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

    removeExercise(dayIndex, exerciseIndex) {
      this.formData.schedule[dayIndex].exercises.splice(exerciseIndex, 1);
    },

    addTag() {
      if (!this.newTag.trim()) return;

      if (this.formData.tags.includes(this.newTag.trim())) {
        uni.showToast({ title: "标签已存在", icon: "none" });
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
        uni.showToast({ title: "请输入计划名称", icon: "none" });
        return false;
      }

      if (!this.formData.type) {
        uni.showToast({ title: "请选择分化类型", icon: "none" });
        return false;
      }

      if (this.formData.schedule.length === 0) {
        uni.showToast({ title: "请至少添加一个训练日", icon: "none" });
        return false;
      }

      for (let i = 0; i < this.formData.schedule.length; i++) {
        const day = this.formData.schedule[i];
        if (!day.dayName.trim()) {
          uni.showToast({
            title: `第${i + 1}天缺少名称`,
            icon: "none",
          });
          return false;
        }

        if (day.exercises.length === 0) {
          uni.showToast({
            title: `第${i + 1}天(${day.dayName})需要至少一个动作`,
            icon: "none",
          });
          return false;
        }

        for (let j = 0; j < day.exercises.length; j++) {
          const ex = day.exercises[j];
          if (!ex.name.trim()) {
            uni.showToast({
              title: `${day.dayName}第${j + 1}个动作缺少名称`,
              icon: "none",
            });
            return false;
          }
        }
      }

      return true;
    },

    savePlan() {
      if (!this.validateForm()) return;

      const planData = {
        id: this.editId || Date.now().toString(),
        name: this.formData.name.trim(),
        description: this.formData.description.trim(),
        type: this.formData.type,
        daysPerWeek: this.formData.daysPerWeek,
        difficulty: this.formData.difficulty,
        targetAudience: this.formData.targetAudience.trim(),
        tags: [...this.formData.tags],
        isPreset: false,
        source: "user",
        schedule: JSON.parse(JSON.stringify(this.formData.schedule)),
        createTime: this.isEdit ? undefined : new Date().toISOString(),
        updateTime: new Date().toISOString(),
      };

      let customPlans = uni.getStorageSync("custom_training_plans") || [];

      if (this.isEdit && this.editId) {
        const idx = customPlans.findIndex((p) => p.id === this.editId);
        if (idx !== -1) {
          customPlans[idx] = { ...customPlans[idx], ...planData };
        }
      } else {
        customPlans.push(planData);
      }

      uni.setStorageSync("custom_training_plans", customPlans);

      this.$refs.savePopup.open();

      // TODO: 后续对接后端API时调用接口保存
    },

    afterSave() {
      setTimeout(() => {
        uni.navigateBack();
      }, 500);
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
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 60rpx 32rpx 24rpx;
  background: white;
  box-shadow:
    0 2rpx 12rpx rgba(0, 0, 0, 0.04),
    0 1rpx 3rpx rgba(0, 0, 0, 0.02);
  position: relative;
  z-index: 100;

  .back-btn {
    width: 72rpx;
    height: 72rpx;
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
  height: calc(100vh - 164rpx);
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
</style>
