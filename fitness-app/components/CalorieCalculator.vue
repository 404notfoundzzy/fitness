<template>
  <view class="calorie-calc">
    <view class="calc-section">
      <view class="section-header">
        <uni-icons type="fire" size="18" color="#F97316"></uni-icons>
        <text class="section-title">BMR 基础代谢率</text>
      </view>
      <text class="formula-hint">Mifflin-St Jeor 公式 (最准确)</text>
      <view class="form-grid">
        <view class="field">
          <text class="field-label">身高</text>
          <input
            type="number"
            v-model="form.height"
            placeholder="cm"
            class="field-input"
          />
        </view>
        <view class="field">
          <text class="field-label">体重</text>
          <input
            type="number"
            v-model="form.weight"
            placeholder="kg"
            class="field-input"
          />
        </view>
        <view class="field">
          <text class="field-label">年龄</text>
          <input
            type="number"
            v-model="form.age"
            placeholder="岁"
            class="field-input"
          />
        </view>
        <view class="field">
          <text class="field-label">性别</text>
          <picker
            mode="selector"
            :range="['男', '女']"
            @change="onGenderChange"
          >
            <view class="field-picker">{{ form.gender || "选择" }}</view>
          </picker>
        </view>
      </view>
      <view class="result-box" v-if="bmrResult">
        <text class="result-value"
          >{{ bmrResult }} <text class="unit">kcal/天</text></text
        >
        <text class="result-desc">维持生命最低能量消耗</text>
      </view>
    </view>

    <view class="calc-section">
      <view class="section-header">
        <uni-icons type="cycle" size="18" color="#0EA5E9"></uni-icons>
        <text class="section-title">TDEE 每日总消耗</text>
      </view>
      <text class="formula-hint">TDEE = BMR × 活动系数</text>
      <view class="activity-list">
        <view
          v-for="level in activityLevels"
          :key="level.key"
          class="activity-option"
          :class="{ active: form.activityLevel === level.key }"
          @click="form.activityLevel = level.key"
        >
          <view class="act-info">
            <text class="act-name">{{ level.label }}</text>
            <text class="act-desc">{{ level.desc }}</text>
          </view>
          <text class="act-value">×{{ level.value }}</text>
        </view>
      </view>
      <view class="result-box primary" v-if="tdeeResult">
        <text class="result-value"
          >{{ tdeeResult }} <text class="unit">kcal/天</text></text
        >
        <text class="result-desc">每日总能量消耗</text>
      </view>
    </view>

    <view class="calc-section">
      <view class="section-header">
        <uni-icons type="flag" size="18" color="#22C55E"></uni-icons>
        <text class="section-title">运动热量消耗 (MET)</text>
      </view>
      <picker mode="selector" :range="exerciseNames" @change="onExerciseChange">
        <view class="select-trigger"
          >{{ selectedExerciseName || "选择运动类型" }} ▼</view
        >
      </picker>
      <view class="field inline">
        <text class="field-label">时长</text>
        <input
          type="number"
          v-model="form.duration"
          placeholder="分钟"
          class="field-input small"
        />
      </view>
      <view class="result-box success" v-if="exerciseResult">
        <text class="result-value"
          >{{ exerciseResult.caloriesBurned }}
          <text class="unit">kcal</text></text
        >
        <text class="result-range"
          >范围：{{ exerciseResult.range.low }}-{{
            exerciseResult.range.high
          }}
          kcal</text
        >
        <text class="result-meta"
          >MET值：{{ exerciseResult.metValue }} |
          {{ exerciseResult.perMinute }} kcal/分</text
        >
      </view>
    </view>

    <view class="calc-section" v-if="tdeeResult">
      <view class="section-header">
        <uni-icons type="star" size="18" color="#A855F7"></uni-icons>
        <text class="section-title">目标热量设定</text>
      </view>
      <view class="goal-list">
        <view
          v-for="goal in goalOptions"
          :key="goal.key"
          class="goal-option"
          :class="{ active: form.goal === goal.key }"
          @click="form.goal = goal.key"
        >
          <view class="goal-info">
            <text class="goal-name">{{ goal.label }}</text>
            <text class="goal-desc">{{ goal.desc }}</text>
          </view>
          <text
            class="goal-adjustment"
            :class="getAdjustmentClass(goal.adjustment)"
          >
            {{ goal.adjustment > 0 ? "+" : "" }}{{ goal.adjustment }}
          </text>
        </view>
      </view>
      <view class="result-box purple" v-if="targetResult">
        <text class="result-value"
          >{{ targetResult.targetCalories }}
          <text class="unit">kcal/天</text></text
        >
        <text class="result-desc"
          >建议每日摄入 | 预计周变化：{{ targetResult.weeklyEstimate }}</text
        >
        <view class="macro-row" v-if="macrosResult">
          <view class="macro-item">
            <text class="macro-val">{{ macrosResult.protein.g }}g</text>
            <text class="macro-lbl">蛋白质</text>
          </view>
          <view class="macro-divider"></view>
          <view class="macro-item">
            <text class="macro-val">{{ macrosResult.carbs.g }}g</text>
            <text class="macro-lbl">碳水</text>
          </view>
          <view class="macro-divider"></view>
          <view class="macro-item">
            <text class="macro-val">{{ macrosResult.fat.g }}g</text>
            <text class="macro-lbl">脂肪</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import {
  calculateBMR,
  calculateTDEE,
  ACTIVITY_LEVELS,
  calculateExerciseCalories,
  EXERCISE_MET_DB,
  calculateTargetCalories,
  GOAL_OPTIONS,
  calculateMacros,
} from "@/utils/calorie";

export default {
  name: "CalorieCalculator",
  data() {
    return {
      form: {
        height: "",
        weight: "",
        age: "",
        gender: "",
        activityLevel: "light",
        duration: 30,
        goal: "maintain",
        selectedExercise: "",
      },
    };
  },
  computed: {
    bmrResult() {
      const h = Number(this.form.height),
        w = Number(this.form.weight);
      const a = Number(this.form.age),
        g = this.form.gender === "男" ? "male" : "female";
      if (!h || !w || !a || !g) return null;
      return calculateBMR(w, h, a, g);
    },
    tdeeResult() {
      return calculateTDEE(this.bmrResult, this.form.activityLevel);
    },
    activityLevels() {
      return ACTIVITY_LEVELS;
    },
    exerciseNames() {
      return Object.values(EXERCISE_MET_DB).map((e) => e.name);
    },
    selectedExerciseName() {
      const ex = EXERCISE_MET_DB[this.form.selectedExercise];
      return ex ? ex.name : "";
    },
    exerciseResult() {
      if (
        !this.form.selectedExercise ||
        !this.form.weight ||
        !this.form.duration
      )
        return null;
      return calculateExerciseCalories(
        this.form.selectedExercise,
        Number(this.form.duration),
        Number(this.form.weight),
      );
    },
    goalOptions() {
      return GOAL_OPTIONS;
    },
    targetResult() {
      return calculateTargetCalories(this.tdeeResult, this.form.goal);
    },
    macrosResult() {
      if (!this.targetResult || !this.form.weight) return null;
      return calculateMacros(
        this.targetResult.targetCalories,
        this.form.goal,
        Number(this.form.weight),
      );
    },
  },
  methods: {
    onGenderChange(e) {
      this.form.gender = ["男", "女"][e.detail.value];
    },
    onExerciseChange(e) {
      const keys = Object.keys(EXERCISE_MET_DB);
      this.form.selectedExercise = keys[e.detail.value];
    },
    getAdjustmentClass(val) {
      if (val > 0) return "surplus";
      if (val < 0) return "deficit";
      return "neutral";
    },
  },
};
</script>

<style lang="scss" scoped>
.calorie-calc {
  padding: 20rpx;
}

.calc-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);

  .section-header {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 16rpx;

    .section-title {
      font-size: 32rpx;
      font-weight: 700;
      color: #1e293b;
    }
  }

  .formula-hint {
    font-size: 24rpx;
    color: #94a3b8;
    background: #f8fafc;
    padding: 8rpx 16rpx;
    border-radius: 8rpx;
    display: inline-block;
    margin-bottom: 20rpx;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;

  .field {
    .field-label {
      font-size: 24rpx;
      color: #64748b;
      margin-bottom: 8rpx;
      display: block;
    }

    .field-input,
    .field-picker {
      height: 72rpx;
      border: 2rpx solid #e2e8f0;
      border-radius: 12rpx;
      padding: 0 20rpx;
      font-size: 28rpx;
      color: #334155;
      display: flex;
      align-items: center;
    }

    .field-picker {
      justify-content: center;
      color: #94a3b8;
    }
  }
}

.result-box {
  text-align: center;
  padding: 24rpx;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 16rpx;
  margin-top: 20rpx;

  &.primary {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  }

  &.success {
    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  }

  &.purple {
    background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
  }

  .result-value {
    font-size: 44rpx;
    font-weight: 800;
    color: #1e293b;

    .unit {
      font-size: 26rpx;
      font-weight: 500;
      color: #64748b;
    }
  }

  .result-desc,
  .result-range,
  .result-meta {
    display: block;
    font-size: 24rpx;
    color: #64748b;
    margin-top: 6rpx;
  }

  .result-meta {
    opacity: 0.7;
  }

  .macro-row {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20rpx;
    margin-top: 20rpx;
    padding-top: 16rpx;
    border-top: 1rpx solid rgba(255, 255, 255, 0.5);

    .macro-item {
      display: flex;
      flex-direction: column;
      align-items: center;

      .macro-val {
        font-size: 30rpx;
        font-weight: 700;
        color: #1e293b;
      }

      .macro-lbl {
        font-size: 22rpx;
        color: #64748b;
      }
    }

    .macro-divider {
      width: 1rpx;
      height: 40rpx;
      background: rgba(100, 116, 139, 0.2);
    }
  }
}

.activity-list,
.goal-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 16rpx;
}

.activity-option,
.goal-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx;
  border: 2rpx solid #e2e8f0;
  border-radius: 12rpx;
  transition: all 0.2s ease;

  &.active {
    border-color: #0ea5e9;
    background: #f0f9ff;
  }

  .act-info,
  .goal-info {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }

  .act-name,
  .goal-name {
    font-size: 28rpx;
    color: #334155;
    font-weight: 500;
  }

  .act-desc,
  .goal-desc {
    font-size: 23rpx;
    color: #94a3b8;
  }

  .act-value {
    font-size: 26rpx;
    font-weight: 600;
    color: #0ea5e9;
    white-space: nowrap;
  }

  .goal-adjustment {
    font-size: 26rpx;
    font-weight: 600;
    white-space: nowrap;
    padding: 6rpx 16rpx;
    border-radius: 8rpx;

    &.surplus {
      color: #16a34a;
      background: #f0fdf4;
    }

    &.deficit {
      color: #dc2626;
      background: #fef2f2;
    }

    &.neutral {
      color: #64748b;
      background: #f8fafc;
    }
  }
}

.select-trigger {
  padding: 20rpx 24rpx;
  border: 2rpx solid #e2e8f0;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #334155;
  margin-bottom: 16rpx;
}

.field.inline {
  display: flex;
  align-items: center;
  gap: 16rpx;

  .field-label {
    font-size: 26rpx;
    color: #64748b;
    white-space: nowrap;
  }

  .field-input.small {
    width: 200rpx;
  }
}
</style>
