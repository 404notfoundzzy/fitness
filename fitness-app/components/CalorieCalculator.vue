<template>
  <view class="calorie-calc">
    <view class="hero-banner">
      <view class="hero-glow hero-glow-1"></view>
      <view class="hero-glow hero-glow-2"></view>
      <view class="hero-glow hero-glow-3"></view>
      <view class="hero-content">
        <text class="hero-title">科学计算每日热量</text>
        <view class="hero-stats">
          <view class="hero-stat">
            <text class="stat-value" :class="{ 'has-data': bmrResult }">{{ bmrResult || '--' }}</text>
            <text class="stat-label">BMR</text>
            <text class="stat-unit">kcal/天</text>
          </view>
          <view class="hero-divider"></view>
          <view class="hero-stat">
            <text class="stat-value" :class="{ 'has-data': tdeeResult }">{{ tdeeResult || '--' }}</text>
            <text class="stat-label">TDEE</text>
            <text class="stat-unit">kcal/天</text>
          </view>
          <view class="hero-divider"></view>
          <view class="hero-stat">
            <text class="stat-value" :class="{ 'has-data': targetResult }">{{ targetResult ? targetResult.targetCalories : '--' }}</text>
            <text class="stat-label">目标</text>
            <text class="stat-unit">kcal/天</text>
          </view>
        </view>
      </view>
    </view>

    <view class="demo-btn-row">
      <view class="demo-btn" @click="fillDemoData">
        <uni-icons type="spinner" size="16" color="#0EA5E9"></uni-icons>
        <text>试用示例数据</text>
      </view>
    </view>

    <view class="tab-nav">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <text class="tab-icon">{{ tab.icon }}</text>
        <text class="tab-label">{{ tab.label }}</text>
      </view>
    </view>

    <view class="tab-content" v-show="activeTab === 'calc'">
      <view class="calc-card" :class="{ pending: !bmrResult, ready: bmrResult }">
        <view class="card-header">
          <view class="card-icon bmr-icon">
            <uni-icons type="fire" size="24" color="#fff"></uni-icons>
          </view>
          <view class="card-title-group">
            <text class="card-title">BMR 基础代谢率</text>
            <text class="card-subtitle">Mifflin-St Jeor 公式</text>
          </view>
        </view>
        <view class="card-body">
          <view class="form-grid">
            <view class="field">
              <text class="field-label">身高 (cm)</text>
              <input type="digit" v-model="form.height" placeholder="170" class="field-input" @input="onFieldChange" />
            </view>
            <view class="field">
              <text class="field-label">体重 (kg)</text>
              <input type="digit" v-model="form.weight" placeholder="65" class="field-input" @input="onFieldChange" />
            </view>
            <view class="field">
              <text class="field-label">年龄</text>
              <input type="number" v-model="form.age" placeholder="25" class="field-input" @input="onFieldChange" />
            </view>
            <view class="field">
              <text class="field-label">性别</text>
              <view class="gender-toggle">
                <view class="gender-option" :class="{ active: form.gender === '男' }" @click="form.gender = '男'">男</view>
                <view class="gender-option" :class="{ active: form.gender === '女' }" @click="form.gender = '女'">女</view>
              </view>
            </view>
          </view>
          <view class="result-display" :class="{ placeholder: !bmrResult }">
            <text class="result-number">{{ bmrResult ? bmrResult : '--' }}</text>
            <text class="result-unit">kcal/天</text>
            <text class="result-desc" v-if="bmrResult">维持生命最低能量消耗</text>
            <text class="result-desc placeholder-hint" v-else>输入身高、体重、年龄即可计算</text>
          </view>
        </view>
      </view>

      <view class="calc-card" :class="{ pending: !tdeeResult, ready: tdeeResult }">
        <view class="card-header">
          <view class="card-icon tdee-icon">
            <uni-icons type="loop" size="24" color="#fff"></uni-icons>
          </view>
          <view class="card-title-group">
            <text class="card-title">TDEE 每日总消耗</text>
            <text class="card-subtitle">TDEE = BMR × 活动系数</text>
          </view>
        </view>
        <view class="card-body">
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
          <view class="result-display tdee-result" :class="{ placeholder: !tdeeResult }">
            <text class="result-number">{{ tdeeResult ? tdeeResult : '--' }}</text>
            <text class="result-unit">kcal/天</text>
            <text class="result-desc" v-if="tdeeResult">每日总能量消耗</text>
            <text class="result-desc placeholder-hint" v-else>先计算BMR，再选择活动水平</text>
          </view>
        </view>
      </view>

      <view class="calc-card" :class="{ pending: !targetResult, ready: targetResult }">
        <view class="card-header">
          <view class="card-icon goal-icon">
            <uni-icons type="star" size="24" color="#fff"></uni-icons>
          </view>
          <view class="card-title-group">
            <text class="card-title">目标热量设定</text>
            <text class="card-subtitle">根据目标调整每日摄入</text>
          </view>
        </view>
        <view class="card-body">
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
              <text class="goal-adjustment" :class="getAdjustmentClass(goal.adjustment)">
                {{ goal.adjustment > 0 ? '+' : '' }}{{ goal.adjustment }}
              </text>
            </view>
          </view>
          <view class="result-display goal-result" :class="{ placeholder: !targetResult }">
            <text class="result-number">{{ targetResult ? targetResult.targetCalories : '--' }}</text>
            <text class="result-unit">kcal/天</text>
            <text class="result-desc" v-if="targetResult">
              建议每日摄入 | 预计周变化：{{ targetResult.weeklyEstimate }}
            </text>
            <text class="result-desc placeholder-hint" v-else>计算TDEE后即可设定目标</text>
          </view>
          <view class="macro-section" v-if="macrosResult">
            <text class="macro-title">宏量营养素分配</text>
            <view class="macro-bars">
              <view class="macro-bar-item">
                <view class="macro-bar-label">
                  <text>蛋白质</text>
                  <text>{{ macrosResult.protein.percentage }}%</text>
                </view>
                <view class="macro-bar-track">
                  <view class="macro-bar-fill protein-fill" :style="{ width: macrosResult.protein.percentage + '%' }"></view>
                </view>
              </view>
              <view class="macro-bar-item">
                <view class="macro-bar-label">
                  <text>碳水</text>
                  <text>{{ macrosResult.carbs.percentage }}%</text>
                </view>
                <view class="macro-bar-track">
                  <view class="macro-bar-fill carbs-fill" :style="{ width: macrosResult.carbs.percentage + '%' }"></view>
                </view>
              </view>
              <view class="macro-bar-item">
                <view class="macro-bar-label">
                  <text>脂肪</text>
                  <text>{{ macrosResult.fat.percentage }}%</text>
                </view>
                <view class="macro-bar-track">
                  <view class="macro-bar-fill fat-fill" :style="{ width: macrosResult.fat.percentage + '%' }"></view>
                </view>
              </view>
            </view>
            <view class="macro-details">
              <view class="macro-detail">
                <text class="macro-detail-val">{{ macrosResult.protein.grams }}g</text>
                <text class="macro-detail-lbl">蛋白质</text>
              </view>
              <view class="macro-detail-divider"></view>
              <view class="macro-detail">
                <text class="macro-detail-val">{{ macrosResult.carbs.grams }}g</text>
                <text class="macro-detail-lbl">碳水</text>
              </view>
              <view class="macro-detail-divider"></view>
              <view class="macro-detail">
                <text class="macro-detail-val">{{ macrosResult.fat.grams }}g</text>
                <text class="macro-detail-lbl">脂肪</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="tab-content" v-show="activeTab === 'today'">
      <view class="calc-card" :class="{ pending: exerciseList.length === 0, ready: exerciseList.length > 0 }">
        <view class="card-header">
          <view class="card-icon exercise-icon">
            <uni-icons type="flag" size="24" color="#fff"></uni-icons>
          </view>
          <view class="card-title-group">
            <text class="card-title">运动热量消耗</text>
            <text class="card-subtitle">MET 代谢当量法</text>
          </view>
        </view>
        <view class="card-body">
          <view class="exercise-add-row">
            <picker mode="selector" :range="exerciseNames" @change="onExercisePick">
              <view class="exercise-picker">
                <text :class="{ 'picker-placeholder': !pendingExercise }">{{ pendingExercise || '选择运动类型' }}</text>
                <uni-icons type="bottom" size="14" color="#94A3B8"></uni-icons>
              </view>
            </picker>
            <view class="duration-input-wrap">
              <text class="duration-label">时长</text>
              <input type="number" v-model="pendingDuration" placeholder="分钟" class="duration-input" />
            </view>
            <view class="add-exercise-btn" @click="addExercise">
              <uni-icons type="plus" size="20" color="#fff"></uni-icons>
              <text>添加</text>
            </view>
          </view>
          <view class="quick-duration-row">
            <view
              v-for="d in [15, 30, 45, 60, 90]"
              :key="d"
              class="quick-duration"
              :class="{ active: pendingDuration == d }"
              @click="pendingDuration = d"
            >
              {{ d }}分钟
            </view>
          </view>
          <view class="exercise-list-container" v-if="exerciseList.length > 0">
            <view
              v-for="(item, idx) in exerciseList"
              :key="idx"
              class="exercise-list-item"
              :class="{ removing: removingIdx === idx }"
            >
              <view class="eli-info">
                <text class="eli-name">{{ item.name }}</text>
                <text class="eli-meta">MET {{ item.metValue }} · {{ item.duration }}分钟</text>
              </view>
              <view class="eli-right">
                <text class="eli-calories" :class="{ 'cal-strikethrough': removingIdx === idx }">{{ item.calories }} kcal</text>
                <view class="eli-delete" @click="removeExercise(idx)">
                  <uni-icons type="trash" size="16" :color="removingIdx === idx ? '#EF4444' : '#94A3B8'"></uni-icons>
                </view>
              </view>
            </view>
          </view>
          <view class="exercise-placeholder" v-else>
            <text class="placeholder-icon">🏋️</text>
            <text class="placeholder-text">添加运动动作开始计算</text>
          </view>
          <view class="exercise-summary" v-if="exerciseList.length > 0">
            <view class="summary-left">
              <text class="summary-total">{{ totalExerciseCalories }} kcal</text>
              <text class="summary-meta">总时长 {{ totalExerciseMinutes }}分钟</text>
            </view>
            <view class="clear-all-btn" @click="clearAllExercises">
              <uni-icons type="trash" size="16" color="#EF4444"></uni-icons>
              <text>清空</text>
            </view>
          </view>
        </view>
      </view>

      <view class="calc-card">
        <view class="card-header">
          <view class="card-icon diet-icon">
            <uni-icons type="cart" size="24" color="#fff"></uni-icons>
          </view>
          <view class="card-title-group">
            <text class="card-title">今日饮食记录</text>
            <text class="card-subtitle">记录每日摄入热量</text>
          </view>
        </view>
        <view class="card-body">
          <view class="diet-add-row">
            <view class="diet-input-wrap diet-name-wrap">
              <input type="text" v-model="newDiet.name" placeholder="食物名称" class="diet-input" />
            </view>
            <view class="diet-input-wrap diet-cal-wrap">
              <input type="number" v-model="newDiet.calories" placeholder="kcal" class="diet-input" />
            </view>
            <view class="add-diet-btn" @click="addDietItem">
              <uni-icons type="plus" size="20" color="#fff"></uni-icons>
            </view>
          </view>
          <view class="diet-list" v-if="dietList.length > 0">
            <view v-for="(item, idx) in dietList" :key="idx" class="diet-item">
              <text class="diet-name">{{ item.name }}</text>
              <view class="diet-right">
                <text class="diet-cal">{{ item.calories }} kcal</text>
                <view class="diet-delete" @click="dietList.splice(idx, 1)">
                  <uni-icons type="closeempty" size="14" color="#94A3B8"></uni-icons>
                </view>
              </view>
            </view>
          </view>
          <view class="diet-placeholder" v-else>
            <text class="placeholder-text">记录今日饮食，追踪热量摄入</text>
          </view>
          <view class="diet-summary" v-if="dietList.length > 0">
            <text class="summary-total">{{ totalDietCalories }} kcal</text>
            <text class="summary-meta">今日摄入总计</text>
          </view>
        </view>
      </view>

      <view class="calc-card" v-if="tdeeResult">
        <view class="card-header">
          <view class="card-icon balance-icon">
            <uni-icons type="bars" size="24" color="#fff"></uni-icons>
          </view>
          <view class="card-title-group">
            <text class="card-title">今日能量收支</text>
            <text class="card-subtitle">摄入 vs 消耗对比</text>
          </view>
        </view>
        <view class="card-body">
          <view class="balance-row">
            <view class="balance-side intake-side">
              <text class="balance-label">摄入</text>
              <text class="balance-value">{{ totalDietCalories || targetResult.targetCalories }}</text>
              <text class="balance-unit">kcal</text>
            </view>
            <view class="balance-vs">VS</view>
            <view class="balance-side expend-side">
              <text class="balance-label">消耗</text>
              <text class="balance-value">{{ tdeeResult + totalExerciseCalories }}</text>
              <text class="balance-unit">kcal</text>
            </view>
          </view>
          <view class="balance-bar">
            <view class="balance-bar-inner" :style="{ width: balancePercent + '%' }" :class="balanceClass"></view>
          </view>
          <view class="balance-status" :class="balanceClass">
            <text>{{ balanceLabel }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="tab-content" v-show="activeTab === 'insight'">
      <view class="calc-card" :class="{ pending: !bmiValue, ready: bmiValue }">
        <view class="card-header">
          <view class="card-icon bmi-card-icon">
            <uni-icons type="person" size="24" color="#fff"></uni-icons>
          </view>
          <view class="card-title-group">
            <text class="card-title">BMI 身体质量指数</text>
            <text class="card-subtitle">体重(kg) / 身高(m)²</text>
          </view>
        </view>
        <view class="card-body">
          <view class="result-display bmi-result" :class="{ placeholder: !bmiValue }">
            <text class="result-number">{{ bmiValue ? bmiValue : '--' }}</text>
            <text class="result-unit">kg/m²</text>
            <text class="result-desc" v-if="bmiValue">{{ bmiCategory }}</text>
            <text class="result-desc placeholder-hint" v-else>输入身高体重即可计算</text>
          </view>
          <view class="bmi-scale" v-if="bmiValue">
            <view class="bmi-scale-track">
              <view class="bmi-scale-zone underweight"></view>
              <view class="bmi-scale-zone normal"></view>
              <view class="bmi-scale-zone overweight"></view>
              <view class="bmi-scale-zone obese"></view>
            </view>
            <view class="bmi-scale-labels">
              <text>偏瘦</text>
              <text>正常</text>
              <text>超重</text>
              <text>肥胖</text>
            </view>
            <view class="bmi-pointer" :style="{ left: bmiPointerLeft + '%' }">▼</view>
          </view>
          <view class="bmi-tip" v-if="bmiValue">
            <text>理想体重范围：{{ idealWeightRange }} kg</text>
          </view>
        </view>
      </view>

      <view class="calc-card" :class="{ pending: !waterIntake, ready: waterIntake }">
        <view class="card-header">
          <view class="card-icon water-icon">
            <uni-icons type="refresh" size="24" color="#fff"></uni-icons>
          </view>
          <view class="card-title-group">
            <text class="card-title">饮水建议</text>
            <text class="card-subtitle">基于体重和运动量推荐</text>
          </view>
        </view>
        <view class="card-body">
          <view class="water-display" v-if="waterIntake">
            <view class="water-cup">
              <view class="water-fill" :style="{ height: waterFillPercent + '%' }">
                <view class="water-wave"></view>
              </view>
            </view>
            <view class="water-info">
              <text class="water-value">{{ waterIntake }} ml</text>
              <text class="water-desc">建议每日饮水量</text>
            </view>
          </view>
          <view class="result-display water-result placeholder" v-else>
            <text class="result-number">--</text>
            <text class="result-unit">ml</text>
            <text class="result-desc placeholder-hint">输入体重即可计算</text>
          </view>
          <view class="water-detail" v-if="waterIntake">
            <view class="water-detail-item">
              <text class="wd-label">基础需水</text>
              <text class="wd-value">{{ waterBase }} ml</text>
            </view>
            <view class="water-detail-divider"></view>
            <view class="water-detail-item">
              <text class="wd-label">运动补水</text>
              <text class="wd-value">{{ waterExercise }} ml</text>
            </view>
            <view class="water-detail-divider"></view>
            <view class="water-detail-item">
              <text class="wd-label">建议总量</text>
              <text class="wd-value total">{{ waterIntake }} ml</text>
            </view>
          </view>
        </view>
      </view>

      <view class="calc-card">
        <view class="card-header">
          <view class="card-icon formula-icon">
            <uni-icons type="info" size="24" color="#fff"></uni-icons>
          </view>
          <view class="card-title-group">
            <text class="card-title">计算原理说明</text>
            <text class="card-subtitle">了解公式背后的科学</text>
          </view>
        </view>
        <view class="card-body">
          <view class="formula-list">
            <view class="formula-item">
              <text class="formula-name">BMR · Mifflin-St Jeor</text>
              <text class="formula-code">BMR = 10×体重 + 6.25×身高 - 5×年龄 + 常数</text>
              <text class="formula-note">男性常数 +5，女性常数 -161</text>
            </view>
            <view class="formula-item">
              <text class="formula-name">TDEE · 每日总消耗</text>
              <text class="formula-code">TDEE = BMR × 活动系数</text>
              <text class="formula-note">活动系数根据运动频率在 1.15~1.60 之间</text>
            </view>
            <view class="formula-item">
              <text class="formula-name">运动消耗 · MET 法</text>
              <text class="formula-code">热量 = MET × 体重(kg) × 时长(小时)</text>
              <text class="formula-note">MET = 代谢当量，不同活动对应不同数值</text>
            </view>
          </view>
        </view>
      </view>

      <view class="calc-card">
        <view class="card-header">
          <view class="card-icon tip-icon">
            <uni-icons type="star" size="24" color="#fff"></uni-icons>
          </view>
          <view class="card-title-group">
            <text class="card-title">使用建议</text>
            <text class="card-subtitle">科学健身小贴士</text>
          </view>
        </view>
        <view class="card-body">
          <view class="tip-list">
            <view class="tip-item">
              <text class="tip-num">1</text>
              <text class="tip-text">减脂期建议制造 300~500 kcal/天 的热量缺口</text>
            </view>
            <view class="tip-item">
              <text class="tip-num">2</text>
              <text class="tip-text">增肌期建议保持 200~400 kcal/天 的热量盈余</text>
            </view>
            <view class="tip-item">
              <text class="tip-num">3</text>
              <text class="tip-text">蛋白质摄入建议：1.6~2.2 g / kg 体重 / 天</text>
            </view>
            <view class="tip-item">
              <text class="tip-num">4</text>
              <text class="tip-text">建议每 4-6 周重新评估并调整目标摄入量</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="sync-section">
      <view class="sync-trigger" @click="showSyncPanel = !showSyncPanel">
        <uni-icons type="refresh" size="18" color="#0EA5E9"></uni-icons>
        <text>一键同步健身数据</text>
        <uni-icons :type="showSyncPanel ? 'top' : 'bottom'" size="14" color="#94A3B8"></uni-icons>
      </view>
      <view class="sync-panel" v-if="showSyncPanel">
        <text class="sync-panel-title">模拟同步场景</text>
        <view class="sync-scenarios">
          <view
            v-for="scenario in syncScenarios"
            :key="scenario.key"
            class="sync-scenario"
            @click="applySyncScenario(scenario)"
          >
            <text class="scenario-name">{{ scenario.label }}</text>
            <text class="scenario-desc">{{ scenario.desc }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="toast" v-if="toastMsg" :class="toastType">
      <text>{{ toastMsg }}</text>
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
      activeTab: "calc",
      showSyncPanel: false,
      form: {
        height: "",
        weight: "",
        age: "",
        gender: "男",
        activityLevel: "light",
        goal: "maintain",
      },
      exerciseList: [],
      pendingExercise: "",
      pendingExerciseKey: "",
      pendingDuration: 30,
      removingIdx: -1,
      dietList: [],
      newDiet: { name: "", calories: "" },
      toastMsg: "",
      toastType: "success",
      toastTimer: null,
      tabs: [
        { key: "calc", label: "计算", icon: "📊" },
        { key: "today", label: "今日", icon: "📋" },
        { key: "insight", label: "洞察", icon: "💡" },
      ],
      syncScenarios: [
        { key: "cut", label: "🏋️ 减脂期男性", desc: "175cm/82kg/28岁 · 力量+慢跑 · 健康餐", data: { height: 175, weight: 82, age: 28, gender: "男", exercises: [{ key: "strength_training", duration: 45 }, { key: "jogging", duration: 30 }], diets: [{ name: "水煮鸡胸", calories: 280 }, { name: "糙米饭", calories: 220 }, { name: "蛋白粉", calories: 120 }, { name: "蔬菜沙拉", calories: 80 }] } },
        { key: "bulk", label: "🏋️‍♀️ 增肌期女性", desc: "162cm/55kg/24岁 · HIIT+力量 · 高蛋白餐", data: { height: 162, weight: 55, age: 24, gender: "女", exercises: [{ key: "hiit", duration: 20 }, { key: "strength_training", duration: 60 }], diets: [{ name: "全麦吐司", calories: 180 }, { name: "牛肉饭", calories: 550 }, { name: "酸奶", calories: 150 }, { name: "香蕉", calories: 105 }] } },
        { key: "office", label: "💻 久坐办公族", desc: "170cm/68kg/32岁 · 快走 · 普通饮食", data: { height: 170, weight: 68, age: 32, gender: "男", exercises: [{ key: "walking_fast", duration: 30 }], diets: [{ name: "包子", calories: 350 }, { name: "外卖炒饭", calories: 680 }, { name: "奶茶", calories: 320 }] } },
      ],
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
    totalExerciseCalories() {
      return this.exerciseList.reduce((sum, item) => sum + item.calories, 0);
    },
    totalExerciseMinutes() {
      return this.exerciseList.reduce((sum, item) => sum + item.duration, 0);
    },
    totalDietCalories() {
      return this.dietList.reduce((sum, item) => sum + Number(item.calories), 0);
    },
    balancePercent() {
      const intake = this.totalDietCalories || (this.targetResult ? this.targetResult.targetCalories : 0);
      const expend = (this.tdeeResult || 0) + this.totalExerciseCalories;
      if (!expend) return 50;
      const pct = Math.min(100, Math.round((intake / expend) * 100));
      return pct;
    },
    balanceClass() {
      const diff = (this.totalDietCalories || (this.targetResult ? this.targetResult.targetCalories : 0)) - ((this.tdeeResult || 0) + this.totalExerciseCalories);
      if (Math.abs(diff) < 50) return "balanced";
      return diff > 0 ? "surplus" : "deficit";
    },
    balanceLabel() {
      if (this.balanceClass === "balanced") return "热量平衡";
      if (this.balanceClass === "surplus") return "热量盈余";
      return "热量缺口";
    },
    bmiValue() {
      const h = Number(this.form.height),
        w = Number(this.form.weight);
      if (!h || !w) return null;
      return (w / ((h / 100) * (h / 100))).toFixed(1);
    },
    bmiCategory() {
      const v = parseFloat(this.bmiValue);
      if (!v) return "";
      if (v < 18.5) return "偏瘦";
      if (v < 24) return "正常";
      if (v < 28) return "超重";
      return "肥胖";
    },
    bmiPointerLeft() {
      const v = parseFloat(this.bmiValue);
      if (!v) return 0;
      return Math.max(2, Math.min(98, ((v - 14) / (32 - 14)) * 100));
    },
    idealWeightRange() {
      const h = Number(this.form.height);
      if (!h) return "--";
      const hM = h / 100;
      const low = (18.5 * hM * hM).toFixed(1);
      const high = (24 * hM * hM).toFixed(1);
      return `${low} ~ ${high}`;
    },
    waterIntake() {
      const w = Number(this.form.weight);
      if (!w) return null;
      const base = w * 35;
      const exercise = Math.floor(this.totalExerciseMinutes / 30) * 200;
      return Math.round(base + exercise);
    },
    waterBase() {
      const w = Number(this.form.weight);
      return w ? Math.round(w * 35) : 0;
    },
    waterExercise() {
      return Math.floor(this.totalExerciseMinutes / 30) * 200;
    },
    waterFillPercent() {
      const intake = this.waterIntake;
      if (!intake) return 0;
      return Math.min(100, (intake / 3500) * 100);
    },
  },
  methods: {
    onFieldChange() {
      this.$forceUpdate();
    },
    getAdjustmentClass(val) {
      if (val > 0) return "surplus";
      if (val < 0) return "deficit";
      return "neutral";
    },
    onExercisePick(e) {
      const keys = Object.keys(EXERCISE_MET_DB);
      const idx = e.detail.value;
      if (idx >= 0 && idx < keys.length) {
        this.pendingExerciseKey = keys[idx];
        this.pendingExercise = EXERCISE_MET_DB[keys[idx]].name;
      }
    },
    addExercise() {
      if (!this.pendingExerciseKey) {
        this.showToast("请先选择运动类型", "warning");
        return;
      }
      if (!this.form.weight) {
        this.showToast("请先输入体重", "warning");
        return;
      }
      const result = calculateExerciseCalories(
        this.pendingExerciseKey,
        this.pendingDuration,
        Number(this.form.weight),
      );
      if (!result) return;
      this.exerciseList.push({
        key: this.pendingExerciseKey,
        name: this.pendingExercise,
        duration: this.pendingDuration,
        metValue: result.metValue,
        calories: result.caloriesBurned,
      });
      this.pendingExercise = "";
      this.pendingExerciseKey = "";
      this.pendingDuration = 30;
      this.showToast(`已添加 ${result.exercise} · ${result.caloriesBurned} kcal`);
    },
    removeExercise(idx) {
      if (this.removingIdx !== -1) return;
      const item = this.exerciseList[idx];
      this.removingIdx = idx;
      setTimeout(() => {
        this.exerciseList.splice(idx, 1);
        this.removingIdx = -1;
        this.showToast(`已删除 · ${item.name} (${item.calories} kcal)`);
      }, 350);
    },
    clearAllExercises() {
      if (this.exerciseList.length === 0) return;
      const count = this.exerciseList.length;
      this.exerciseList = [];
      this.showToast(`已清空全部 ${count} 项运动记录`);
    },
    addDietItem() {
      if (!this.newDiet.name.trim()) {
        this.showToast("请输入食物名称", "warning");
        return;
      }
      if (!this.newDiet.calories || Number(this.newDiet.calories) <= 0) {
        this.showToast("请输入有效热量值", "warning");
        return;
      }
      this.dietList.push({
        name: this.newDiet.name.trim(),
        calories: Number(this.newDiet.calories),
      });
      this.newDiet = { name: "", calories: "" };
      this.showToast("饮食记录已添加");
    },
    fillDemoData() {
      this.form.height = 175;
      this.form.weight = 72;
      this.form.age = 26;
      this.form.gender = "男";
      this.form.activityLevel = "moderate";
      this.form.goal = "cut";
      this.showToast("已填入示例数据");
    },
    applySyncScenario(scenario) {
      const d = scenario.data;
      this.form.height = d.height;
      this.form.weight = d.weight;
      this.form.age = d.age;
      this.form.gender = d.gender;
      this.form.activityLevel = "moderate";
      this.form.goal = scenario.key === "bulk" ? "bulk" : "cut";
      this.exerciseList = [];
      this.dietList = [];
      this.$nextTick(() => {
        if (d.exercises) {
          d.exercises.forEach((ex) => {
            const result = calculateExerciseCalories(ex.key, ex.duration, d.weight);
            if (result) {
              this.exerciseList.push({
                key: ex.key,
                name: result.exercise,
                duration: ex.duration,
                metValue: result.metValue,
                calories: result.caloriesBurned,
              });
            }
          });
        }
        if (d.diets) {
          d.diets.forEach((di) => {
            this.dietList.push({ name: di.name, calories: di.calories });
          });
        }
      });
      this.showSyncPanel = false;
      this.showToast(`已同步：${scenario.label}`);
    },
    showToast(msg, type = "success") {
      this.toastMsg = msg;
      this.toastType = type;
      if (this.toastTimer) clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        this.toastMsg = "";
      }, 2000);
    },
  },
};
</script>

<style lang="scss" scoped>
.calorie-calc {
  padding: 0 20rpx 40rpx;
}

.hero-banner {
  position: relative;
  background: linear-gradient(135deg, #fff7ed, #ffedd5, #fed7aa);
  border-radius: 28rpx;
  padding: 36rpx 32rpx;
  margin-bottom: 16rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(249, 115, 22, 0.12);

  .hero-glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(60rpx);
    opacity: 0.35;

    &-1 {
      width: 200rpx;
      height: 200rpx;
      background: #f97316;
      top: -60rpx;
      right: -40rpx;
    }

    &-2 {
      width: 160rpx;
      height: 160rpx;
      background: #0ea5e9;
      bottom: -40rpx;
      left: -30rpx;
      opacity: 0.25;
    }

    &-3 {
      width: 120rpx;
      height: 120rpx;
      background: #a855f7;
      bottom: 20rpx;
      right: 40rpx;
      opacity: 0.2;
    }
  }

  .hero-content {
    position: relative;
    z-index: 1;
  }

  .hero-title {
    display: block;
    font-size: 30rpx;
    font-weight: 700;
    color: #9a3412;
    text-align: center;
    margin-bottom: 24rpx;
  }

  .hero-stats {
    display: flex;
    justify-content: space-around;
    align-items: center;
  }

  .hero-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rpx;

    .stat-value {
      font-size: 44rpx;
      font-weight: 800;
      color: #1e293b;
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      display: inline-block;

      &.has-data {
        color: #f97316;
      }
    }

    .stat-label {
      font-size: 22rpx;
      font-weight: 600;
      color: #9a3412;
      background: rgba(255, 255, 255, 0.5);
      padding: 2rpx 16rpx;
      border-radius: 8rpx;
    }

    .stat-unit {
      font-size: 20rpx;
      color: #78716c;
    }
  }

  .hero-divider {
    width: 2rpx;
    height: 60rpx;
    background: rgba(154, 52, 18, 0.15);
  }
}

.demo-btn-row {
  display: flex;
  justify-content: center;
  margin-bottom: 16rpx;

  .demo-btn {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 12rpx 28rpx;
    background: #f0f9ff;
    border: 1rpx dashed #bae6fd;
    border-radius: 20rpx;
    font-size: 24rpx;
    color: #0ea5e9;
    font-weight: 600;

    &:active {
      background: #e0f2fe;
      transform: scale(0.97);
    }
  }
}

.tab-nav {
  display: flex;
  background: #fff;
  border-radius: 20rpx;
  padding: 6rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

  .tab-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6rpx;
    padding: 16rpx 0;
    border-radius: 16rpx;
    transition: all 0.25s ease;

    .tab-icon {
      font-size: 24rpx;
    }

    .tab-label {
      font-size: 26rpx;
      font-weight: 600;
      color: #94a3b8;
    }

    &.active {
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      box-shadow: 0 4rpx 16rpx rgba(14, 165, 233, 0.25);

      .tab-label {
        color: #fff;
      }
    }
  }
}

.calc-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx 28rpx 24rpx;
  margin-bottom: 20rpx;
  border: 2rpx solid #e2e8f0;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);
  transition: all 0.4s ease;

  &.pending {
    border-style: dashed;
    border-color: #e2e8f0;
    box-shadow: none;
  }

  &.ready {
    border-style: solid;
    border-color: rgba(14, 165, 233, 0.15);
    box-shadow: 0 4rpx 20rpx rgba(14, 165, 233, 0.06);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 20rpx;
  }

  .card-icon {
    width: 64rpx;
    height: 64rpx;
    border-radius: 18rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .bmr-icon { background: linear-gradient(135deg, #f97316, #ea580c); }
  .tdee-icon { background: linear-gradient(135deg, #0ea5e9, #0284c7); }
  .goal-icon { background: linear-gradient(135deg, #a855f7, #7c3aed); }
  .exercise-icon { background: linear-gradient(135deg, #22c55e, #16a34a); }
  .diet-icon { background: linear-gradient(135deg, #f59e0b, #d97706); }
  .balance-icon { background: linear-gradient(135deg, #ef4444, #dc2626); }
  .bmi-card-icon { background: linear-gradient(135deg, #ec4899, #db2777); }
  .water-icon { background: linear-gradient(135deg, #06b6d4, #0891b2); }
  .formula-icon { background: linear-gradient(135deg, #6366f1, #4f46e5); }
  .tip-icon { background: linear-gradient(135deg, #22c55e, #16a34a); }

  .card-title-group {
    flex: 1;
    min-width: 0;

    .card-title {
      display: block;
      font-size: 30rpx;
      font-weight: 700;
      color: #1e293b;
    }

    .card-subtitle {
      display: block;
      font-size: 22rpx;
      color: #94a3b8;
      margin-top: 2rpx;
    }
  }

  .card-body {
    border-top: 1rpx solid #f1f5f9;
    padding-top: 16rpx;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14rpx;
  margin-bottom: 16rpx;

  .field {
    .field-label {
      font-size: 23rpx;
      color: #64748b;
      margin-bottom: 6rpx;
      display: block;
      font-weight: 500;
    }

    .field-input {
      height: 68rpx;
      border: 2rpx solid #e2e8f0;
      border-radius: 12rpx;
      padding: 0 18rpx;
      font-size: 28rpx;
      color: #334155;
      background: #f8fafc;
      transition: all 0.25s ease;

      &:focus {
        border-color: #0ea5e9;
        background: #fff;
        box-shadow: 0 0 0 4rpx rgba(14, 165, 233, 0.06);
      }
    }
  }
}

.gender-toggle {
  display: flex;
  gap: 10rpx;
  height: 68rpx;

  .gender-option {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2rpx solid #e2e8f0;
    border-radius: 12rpx;
    font-size: 26rpx;
    color: #94a3b8;
    font-weight: 500;
    transition: all 0.25s ease;

    &.active {
      border-color: #f97316;
      background: #fff7ed;
      color: #f97316;
      font-weight: 700;
      box-shadow: 0 0 0 4rpx rgba(249, 115, 22, 0.1);
    }
  }
}

.result-display {
  text-align: center;
  padding: 24rpx;
  border-radius: 16rpx;
  transition: all 0.5s ease;

  .result-number {
    font-size: 48rpx;
    font-weight: 800;
    color: #1e293b;
    display: inline-block;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .result-unit {
    font-size: 26rpx;
    color: #64748b;
    margin-left: 4rpx;
  }

  .result-desc {
    display: block;
    font-size: 23rpx;
    color: #64748b;
    margin-top: 6rpx;
  }

  .placeholder-hint {
    color: #94a3b8;
    font-style: italic;
  }

  &.placeholder {
    background: #f8fafc;
    border: 2rpx dashed #e2e8f0;

    .result-number {
      color: #cbd5e1;
      animation: pulse 2s ease-in-out infinite;
    }
  }

  &.bmr-result:not(.placeholder) {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
  }

  &.tdee-result:not(.placeholder) {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  }

  &.goal-result:not(.placeholder) {
    background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
  }

  &.bmi-result:not(.placeholder) {
    background: linear-gradient(135deg, #fce7f3, #fbcfe8);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.activity-list,
.goal-list {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-bottom: 16rpx;
}

.activity-option,
.goal-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18rpx 20rpx;
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
    gap: 2rpx;
  }

  .act-name,
  .goal-name {
    font-size: 26rpx;
    color: #334155;
    font-weight: 500;
  }

  .act-desc,
  .goal-desc {
    font-size: 21rpx;
    color: #94a3b8;
  }

  .act-value {
    font-size: 24rpx;
    font-weight: 600;
    color: #0ea5e9;
    white-space: nowrap;
  }

  .goal-adjustment {
    font-size: 24rpx;
    font-weight: 600;
    white-space: nowrap;
    padding: 4rpx 14rpx;
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

.macro-section {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f1f5f9;

  .macro-title {
    display: block;
    font-size: 24rpx;
    font-weight: 600;
    color: #64748b;
    margin-bottom: 14rpx;
  }
}

.macro-bars {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-bottom: 16rpx;
}

.macro-bar-item {
  .macro-bar-label {
    display: flex;
    justify-content: space-between;
    font-size: 22rpx;
    color: #64748b;
    margin-bottom: 4rpx;
  }

  .macro-bar-track {
    height: 12rpx;
    background: #f1f5f9;
    border-radius: 6rpx;
    overflow: hidden;
  }

  .macro-bar-fill {
    height: 100%;
    border-radius: 6rpx;
    transition: width 0.5s ease;

    &.protein-fill { background: linear-gradient(90deg, #f97316, #fb923c); }
    &.carbs-fill { background: linear-gradient(90deg, #0ea5e9, #38bdf8); }
    &.fat-fill { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
  }
}

.macro-details {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24rpx;

  .macro-detail {
    display: flex;
    flex-direction: column;
    align-items: center;

    .macro-detail-val {
      font-size: 28rpx;
      font-weight: 700;
      color: #1e293b;
    }

    .macro-detail-lbl {
      font-size: 20rpx;
      color: #94a3b8;
    }
  }

  .macro-detail-divider {
    width: 1rpx;
    height: 36rpx;
    background: #e2e8f0;
  }
}

.exercise-add-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;

  .exercise-picker {
    flex: 1;
    height: 64rpx;
    padding: 0 16rpx;
    border: 2rpx solid #e2e8f0;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #f8fafc;
    font-size: 24rpx;
    color: #334155;

    .picker-placeholder {
      color: #94a3b8;
    }
  }

  .duration-input-wrap {
    display: flex;
    align-items: center;
    gap: 6rpx;

    .duration-label {
      font-size: 22rpx;
      color: #94a3b8;
      white-space: nowrap;
    }

    .duration-input {
      width: 100rpx;
      height: 64rpx;
      border: 2rpx solid #e2e8f0;
      border-radius: 12rpx;
      padding: 0 12rpx;
      font-size: 24rpx;
      color: #334155;
      background: #f8fafc;
    }
  }

  .add-exercise-btn {
    display: flex;
    align-items: center;
    gap: 4rpx;
    height: 64rpx;
    padding: 0 20rpx;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border-radius: 12rpx;
    font-size: 24rpx;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;

    &:active {
      transform: scale(0.95);
      opacity: 0.9;
    }
  }
}

.quick-duration-row {
  display: flex;
  gap: 10rpx;
  margin-bottom: 16rpx;
  flex-wrap: wrap;

  .quick-duration {
    padding: 8rpx 18rpx;
    background: #f1f5f9;
    border-radius: 10rpx;
    font-size: 22rpx;
    color: #64748b;
    transition: all 0.2s ease;

    &.active {
      background: #dcfce7;
      color: #16a34a;
      font-weight: 600;
    }
  }
}

.exercise-list-container {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-bottom: 16rpx;
}

.exercise-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 20rpx;
  background: #f8fafc;
  border-radius: 12rpx;
  border: 1rpx solid #e2e8f0;
  transition: all 0.35s ease;

  &.removing {
    opacity: 0;
    transform: translateX(80rpx) scale(0.9);
    max-height: 0;
    padding: 0 20rpx;
    margin: 0;
    border-color: #fecaca;
    background: #fef2f2;
    overflow: hidden;
  }

  .eli-info {
    display: flex;
    flex-direction: column;
    gap: 2rpx;

    .eli-name {
      font-size: 26rpx;
      font-weight: 600;
      color: #334155;
    }

    .eli-meta {
      font-size: 21rpx;
      color: #94a3b8;
    }
  }

  .eli-right {
    display: flex;
    align-items: center;
    gap: 12rpx;

    .eli-calories {
      font-size: 26rpx;
      font-weight: 700;
      color: #16a34a;
      transition: all 0.3s ease;

      &.cal-strikethrough {
        color: #ef4444;
        text-decoration: line-through;
      }
    }

    .eli-delete {
      width: 48rpx;
      height: 48rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: #f1f5f9;
      transition: all 0.3s ease;

      &:active {
        background: #fef2f2;
        transform: scale(0.9);
      }
    }
  }
}

.exercise-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  margin-bottom: 16rpx;
  background: #f8fafc;
  border: 2rpx dashed #e2e8f0;
  border-radius: 16rpx;

  .placeholder-icon {
    font-size: 48rpx;
    margin-bottom: 8rpx;
  }

  .placeholder-text {
    font-size: 24rpx;
    color: #94a3b8;
  }
}

.exercise-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 20rpx;
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  border-radius: 14rpx;

  .summary-left {
    display: flex;
    flex-direction: column;
    gap: 2rpx;
  }

  .summary-total {
    font-size: 32rpx;
    font-weight: 800;
    color: #16a34a;
  }

  .summary-meta {
    font-size: 21rpx;
    color: #64748b;
  }

  .clear-all-btn {
    display: flex;
    align-items: center;
    gap: 6rpx;
    padding: 10rpx 18rpx;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 10rpx;
    font-size: 22rpx;
    color: #ef4444;
    font-weight: 600;

    &:active {
      background: #fef2f2;
      transform: scale(0.95);
    }
  }
}

.diet-add-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 14rpx;

  .diet-input-wrap {
    .diet-input {
      height: 64rpx;
      border: 2rpx solid #e2e8f0;
      border-radius: 12rpx;
      padding: 0 14rpx;
      font-size: 24rpx;
      color: #334155;
      background: #f8fafc;
    }

    &.diet-name-wrap .diet-input {
      width: 200rpx;
    }

    &.diet-cal-wrap .diet-input {
      width: 110rpx;
    }
  }

  .add-diet-btn {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border-radius: 12rpx;

    &:active {
      transform: scale(0.92);
      opacity: 0.9;
    }
  }
}

.diet-list {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 14rpx;
}

.diet-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 16rpx;
  background: #f8fafc;
  border-radius: 10rpx;

  .diet-name {
    font-size: 24rpx;
    color: #334155;
    font-weight: 500;
  }

  .diet-right {
    display: flex;
    align-items: center;
    gap: 10rpx;

    .diet-cal {
      font-size: 24rpx;
      font-weight: 600;
      color: #f59e0b;
    }

    .diet-delete {
      width: 36rpx;
      height: 36rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;

      &:active {
        background: #fef2f2;
      }
    }
  }
}

.diet-placeholder {
  padding: 24rpx;
  text-align: center;
  background: #f8fafc;
  border: 2rpx dashed #e2e8f0;
  border-radius: 12rpx;
  margin-bottom: 14rpx;

  .placeholder-text {
    font-size: 24rpx;
    color: #94a3b8;
  }
}

.diet-summary {
  padding: 14rpx 18rpx;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 12rpx;
  text-align: center;

  .summary-total {
    font-size: 30rpx;
    font-weight: 800;
    color: #b45309;
    display: block;
  }

  .summary-meta {
    font-size: 21rpx;
    color: #78716c;
  }
}

.balance-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32rpx;
  margin-bottom: 16rpx;

  .balance-side {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rpx;

    .balance-label {
      font-size: 22rpx;
      color: #94a3b8;
    }

    .balance-value {
      font-size: 36rpx;
      font-weight: 800;
    }

    .balance-unit {
      font-size: 20rpx;
      color: #94a3b8;
    }

    &.intake-side .balance-value { color: #f59e0b; }
    &.expend-side .balance-value { color: #ef4444; }
  }

  .balance-vs {
    font-size: 24rpx;
    font-weight: 700;
    color: #cbd5e1;
  }
}

.balance-bar {
  height: 16rpx;
  background: #f1f5f9;
  border-radius: 8rpx;
  overflow: hidden;
  margin-bottom: 10rpx;

  .balance-bar-inner {
    height: 100%;
    border-radius: 8rpx;
    transition: width 0.5s ease;

    &.balanced { background: linear-gradient(90deg, #22c55e, #4ade80); }
    &.surplus { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    &.deficit { background: linear-gradient(90deg, #ef4444, #f87171); }
  }
}

.balance-status {
  text-align: center;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  font-weight: 600;

  &.balanced {
    background: #f0fdf4;
    color: #16a34a;
  }

  &.surplus {
    background: #fefce8;
    color: #ca8a04;
  }

  &.deficit {
    background: #fef2f2;
    color: #dc2626;
  }
}

.bmi-scale {
  margin-top: 16rpx;

  .bmi-scale-track {
    display: flex;
    height: 16rpx;
    border-radius: 8rpx;
    overflow: hidden;
    margin-bottom: 6rpx;
    position: relative;

    .bmi-scale-zone {
      &.underweight { flex: 2; background: #06b6d4; }
      &.normal { flex: 3; background: #22c55e; }
      &.overweight { flex: 2; background: #f59e0b; }
      &.obese { flex: 3; background: #ef4444; }
    }
  }

  .bmi-scale-labels {
    display: flex;
    justify-content: space-between;
    font-size: 18rpx;
    color: #94a3b8;
    padding: 0 2rpx;
  }

  .bmi-pointer {
    position: relative;
    font-size: 24rpx;
    color: #1e293b;
    margin-top: 4rpx;
    transition: left 0.5s ease;
    text-align: center;
    width: 0;
  }
}

.bmi-tip {
  margin-top: 12rpx;
  padding: 12rpx 16rpx;
  background: #f0fdf4;
  border: 1rpx solid #bbf7d0;
  border-radius: 10rpx;
  font-size: 23rpx;
  color: #16a34a;
  text-align: center;
}

.water-display {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 16rpx;

  .water-cup {
    width: 80rpx;
    height: 120rpx;
    border: 3rpx solid #06b6d4;
    border-radius: 0 0 20rpx 20rpx;
    border-top: none;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;

    .water-fill {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to top, #06b6d4, #22d3ee);
      transition: height 0.6s ease;
      border-radius: 0 0 16rpx 16rpx;

      .water-wave {
        position: absolute;
        top: -4rpx;
        left: 0;
        right: 0;
        height: 8rpx;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 50%;
        animation: waterWave 2s ease-in-out infinite;
      }
    }
  }

  .water-info {
    display: flex;
    flex-direction: column;
    gap: 4rpx;

    .water-value {
      font-size: 40rpx;
      font-weight: 800;
      background: linear-gradient(135deg, #06b6d4, #0891b2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .water-desc {
      font-size: 22rpx;
      color: #94a3b8;
    }
  }
}

@keyframes waterWave {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3rpx); }
}

.water-detail {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 16rpx;
  background: #f8fafc;
  border-radius: 12rpx;

  .water-detail-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rpx;

    .wd-label {
      font-size: 20rpx;
      color: #94a3b8;
    }

    .wd-value {
      font-size: 24rpx;
      font-weight: 600;
      color: #334155;

      &.total {
        color: #06b6d4;
        font-size: 26rpx;
      }
    }
  }

  .water-detail-divider {
    width: 1rpx;
    height: 40rpx;
    background: #e2e8f0;
  }
}

.formula-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.formula-item {
  padding: 16rpx;
  background: #f8fafc;
  border-radius: 12rpx;
  border: 1rpx solid #e2e8f0;
  transition: all 0.2s ease;

  &:active {
    background: #f0f9ff;
    border-color: #bae6fd;
  }

  .formula-name {
    display: block;
    font-size: 26rpx;
    font-weight: 600;
    color: #334155;
    margin-bottom: 6rpx;
  }

  .formula-code {
    display: block;
    font-size: 23rpx;
    color: #0ea5e9;
    font-family: monospace;
    background: rgba(14, 165, 233, 0.06);
    padding: 8rpx 12rpx;
    border-radius: 6rpx;
    margin-bottom: 4rpx;
  }

  .formula-note {
    display: block;
    font-size: 21rpx;
    color: #94a3b8;
  }
}

.tip-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  padding: 14rpx 16rpx;
  background: #f8fafc;
  border-radius: 12rpx;
  transition: all 0.2s ease;

  &:active {
    background: #f0fdf4;
  }

  .tip-num {
    width: 40rpx;
    height: 40rpx;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: #fff;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 23rpx;
    font-weight: 700;
    flex-shrink: 0;
  }

  .tip-text {
    font-size: 24rpx;
    color: #475569;
    line-height: 1.5;
    padding-top: 4rpx;
  }
}

.sync-section {
  margin-top: 8rpx;

  .sync-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10rpx;
    padding: 20rpx;
    background: #f0f9ff;
    border: 2rpx dashed #bae6fd;
    border-radius: 20rpx;
    font-size: 26rpx;
    font-weight: 600;
    color: #0ea5e9;
    transition: all 0.2s ease;

    &:active {
      background: #e0f2fe;
      transform: scale(0.98);
    }
  }

  .sync-panel {
    margin-top: 12rpx;
    padding: 20rpx;
    background: #fff;
    border-radius: 16rpx;
    border: 1rpx solid #e2e8f0;

    .sync-panel-title {
      display: block;
      font-size: 24rpx;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 12rpx;
    }
  }

  .sync-scenarios {
    display: flex;
    flex-direction: column;
    gap: 10rpx;
  }

  .sync-scenario {
    padding: 16rpx 20rpx;
    background: #f8fafc;
    border-radius: 12rpx;
    border: 1rpx solid #e2e8f0;
    transition: all 0.2s ease;

    &:active {
      background: #f0f9ff;
      border-color: #bae6fd;
      transform: scale(0.98);
    }

    .scenario-name {
      display: block;
      font-size: 26rpx;
      font-weight: 600;
      color: #334155;
      margin-bottom: 4rpx;
    }

    .scenario-desc {
      font-size: 22rpx;
      color: #94a3b8;
    }
  }
}

.toast {
  position: fixed;
  bottom: 200rpx;
  left: 50%;
  transform: translateX(-50%);
  padding: 16rpx 32rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 600;
  z-index: 999;
  animation: toastIn 0.3s ease;

  &.success {
    background: #1e293b;
    color: #fff;
  }

  &.warning {
    background: #fef3c7;
    color: #b45309;
    border: 1rpx solid #fde68a;
  }
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>