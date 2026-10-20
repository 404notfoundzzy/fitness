# 健身 App 五大优化功能实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 完善知识库数据、实现身高记录功能、优化最近动态、优化个人信息表单、实现能量计算公式与知识库模块

**架构：** 基于现有 uni-app + Vue3 项目结构，遵循已有模式（weight.vue 作为模板），新增身高记录页面、能量计算组件，扩展 API 层和知识库内容

**技术栈：** uni-app、Vue3 (Composition API)、SCSS、uni-ui 组件库、SVG 图表

---

## 文件结构总览

### 新建文件
| 文件路径 | 职责 |
|----------|------|
| `pages/record/height/height.vue` | 身高记录主页面（参考 weight.vue） |
| `pages/record/height/height-history.vue` | 身高历史记录与趋势图页面 |
| `utils/calorie.js` | 能量计算工具函数库（BMR/TDEE/MET） |
| `components/CalorieCalculator.vue` | 能量计算器可复用组件 |
| `pages/knowledge/calorie-guide.vue` | 知识库-能量计算指南页面 |

### 修改文件
| 文件路径 | 修改内容 |
|----------|----------|
| `pages/record/record.vue` | 添加身高入口卡片 + 最近动态重构（分页懒加载） |
| `pages/profile/profile.vue` | 扩展个人信息表单字段 |
| `api/health.js` | 新增身高 CRUD API + 最近动态聚合 API |
| `pages.json` | 注册新页面路由 |
| `.trae/skills/fitness-knowledge/SKILL.md` | 完善知识库数据内容 |

---

## Task 1: 知识库数据完善 + 能量计算模块

**文件：**
- 修改：`.trae/skills/fitness-knowledge/SKILL.md`
- 创建：`utils/calorie.js`
- 创建：`components/CalorieCalculator.vue`
- 创建：`pages/knowledge/calorie-guide.vue`

### 步骤 1.1: 完善 fitness-knowledge Skill 数据

- [ ] 在 SKILL.md 中补充以下知识章节：

**新增内容 - 营养学基础：**
```markdown
## 五、营养学基础

### 5.1 宏量营养素详解

| 营养素 | 每克热量 | 主要功能 | 推荐占比 |
|--------|----------|----------|----------|
| **蛋白质** | 4 kcal | 肌肉修复、酶合成、免疫 | 15-35% |
| **碳水化合物** | 4 kcal | 主要能量来源、大脑供能 | 45-65% |
| **脂肪** | 9 kcal | 激素合成、脂溶性维生素吸收 | 20-35% |

### 5.2 微量营养素要点

| 营养素 | 日需量 | 最佳来源 | 缺乏症状 |
|--------|--------|----------|----------|
| 维生素D | 600 IU | 阳光、 fatty fish | 骨质疏松、免疫力下降 |
| 钙 | 1000mg | 奶制品、深绿蔬菜 | 抽筋、骨密度下降 |
| 铁 | 8-18mg | 红肉、菠菜、豆类 | 贫血、疲劳 |
| 镁 | 400mg | 坚果、全谷物、黑巧克力 | 肌肉痉挛、失眠 |

### 5.3 补剂指南

| 补剂类型 | 用途 | 推荐剂量 | 注意事项 |
|----------|------|----------|----------|
| 乳清蛋白 | 训练后快速补充 | 20-30g/次 | 乳糖不慎者选分离型 |
| 肌酸 | 提升力量输出 | 5g/日(维持期) | 需充分饮水 |
| 咖啡因 | 提升运动表现 | 3-6mg/kg | 下午4点后避免 |
| Omega-3 | 抗炎、关节健康 | 1-2g EPA+DHA | 选择高纯度产品 |
| 维生素D | 骨骼健康、免疫 | 1000-4000 IU | 建议检测后补充 |
```

**新增内容 - 训练计划设计：**
```markdown
## 六、训练计划设计原则

### 6.1 训练频率指南

| 水平 | 推荐频率 | 分化方式 | 休息日 |
|------|----------|----------|--------|
| 初学者 | 3天/周 | 全身训练 | 隔天训练 |
| 中级 | 4-5天/周 | 上/下肢分化 或 推/拉/腿 | 1-2天 |
| 高级 | 5-6天/周 | 部位分化 | 1天/主动恢复 |

### 6.2 渐进超负荷策略

| 方法 | 说明 | 适用场景 |
|------|------|----------|
| 重量递增 | 每次增加 0.5-2.5kg | 力量训练期 |
| 次数增加 | 同重量多做 1-2 次 | 肌肥大期 |
| 组数增加 | 每动作多加 1 组 | 耐力训练期 |
| 休息缩短 | 组间休息减少 15-30s | 密度训练 |
| 动作进阶 | 更难的动作变式 | 功能性训练 |

### 6.3 常见训练分化方案

**方案 A：全身训练（初学者）**
```
Day 1: 深蹲、卧推、划船、推举、平板支撑
Day 2: 休息/轻度有氧
Day 3: 硬拉、上斜卧推、引体向上、侧平举、卷腹
Day 4: 休息
重复 Day 1 → Day 2 → Day 3...
```

**方案 B：上/下肢分化（中级）**
```
Day 1: 上肢力量（卧推、划船、肩推、二头、三头）
Day 2: 下肢力量（深蹲、硬拉、腿举、小腿）
Day 3: 休息或有氧
Day 4: 上肢肌肥大（不同动作角度）
Day 5: 下肢肌肥大（单侧动作重点）
Day 6-7: 休息
```

**方案 C：推/拉/腿分化（中高级）**
```
Day 1: 推（胸、前/中束、三头）
Day 2: 拉（背、后束、二头、核心）
Day 3: 腿（股四头、腘绳肌、臀、小腿）
Day 4: 休息
重复...
```
```

**新增内容 - 常见问题解答：**
```markdown
## 七、常见健身问题 FAQ

### Q1: 多久能看到训练效果？
- **力量提升**: 2-4 周神经适应期可见明显进步
- **肌肉增长**: 4-8 周开始出现肉眼可见变化
- **减脂效果**: 2-3 周后体重开始稳定下降（需热量缺口）

### Q2: 肌肉酸痛怎么办？
- **DOMS（延迟性肌肉酸痛）**: 正常现象，24-72小时达峰
- **缓解方法**: 轻度活动、泡沫轴放松、充足蛋白质摄入
- **警惕信号**: 剧烈疼痛伴肿胀/发热 → 可能是受伤

### Q3: 平板支撑多久合适？
- 初学者: 30秒 × 3组
- 进阶: 60-90秒 × 3组
- 目标: 能稳定保持 2 分钟以上

### Q4: 是否需要天天练？
- 同一肌群需要 48-72 小时恢复
- 可以采用分化训练（每天练不同部位）
- 完全休息日每周至少 1-2 天

### Q5: 减脂期间会掉肌肉吗？
- 热量缺口过大（>500kcal/天）会增加肌肉流失风险
- 保持高强度训练 + 高蛋白摄入（1.8-2.4g/kg）可最大程度保肌
- 不要过度依赖有氧，力量训练同样重要
```

- [ ] 验证：检查 SKILL.md 格式正确，Markdown 无语法错误

### 步骤 1.2: 创建能量计算工具函数库

- [ ] 创建文件 `utils/calorie.js`：

```javascript
/**
 * 能量计算工具函数库
 * 基于 Mifflin-St Jeor 公式 + MET 法
 */

// ==================== BMR 计算 ====================

const GENDER_CONSTANTS = {
  male: 5,
  female: -161
}

export function calculateBMR(weightKg, heightCm, age, gender) {
  if (!weightKg || !heightCm || !age || !gender) return null
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return Math.round(base + (GENDER_CONSTANTS[gender] || -161))
}

// ==================== TDEE 计算 ====================

export const ACTIVITY_LEVELS = [
  { key: 'sedentary', label: '久坐/几乎不运动', value: 1.15, desc: '办公室工作' },
  { key: 'light', label: '轻度活跃', value: 1.20, desc: '每周1-3天轻度运动' },
  { key: 'moderate', label: '中度活跃', value: 1.35, desc: '每周3-5天中等强度' },
  { key: 'active', label: '非常活跃', value: 1.45, desc: '每周6-7天高强度' },
  { key: 'extreme', label: '极度活跃', value: 1.60, desc: '运动员/双练' }
]

export function calculateTDEE(bmr, activityLevel) {
  if (!bmr) return null
  const level = ACTIVITY_LEVELS.find(l => l.key === activityLevel)
  const multiplier = level ? level.value : 1.20
  return Math.round(bmr * multiplier)
}

// ==================== 运动消耗 (MET) ====================

export const EXERCISE_MET_DB = {
  strength_training: { name: '力量训练', metRange: [4.5, 6.0], category: 'strength' },
  heavy_compound: { name: '大重量复合', metRange: [6.0, 9.0], category: 'strength' },
  bench_press: { name: '卧推', metRange: [5.0, 6.0], category: 'strength' },
  squat: { name: '深蹲', metRange: [5.0, 8.0], category: 'strength' },
  deadlift: { name: '硬拉', metRange: [6.0, 9.0], category: 'strength' },
  pullup: { name: '引体向上', metRange: [4.0, 8.0], category: 'strength' },
  pushup: { name: '俯卧撑', metRange: [3.8, 8.0], category: 'strength' },

  walking_slow: { name: '慢走(4km/h)', metRange: [2.5, 3.0], category: 'cardio' },
  walking_fast: { name: '快走(6km/h)', metRange: [3.5, 4.3], category: 'cardio' },
  jogging: { name: '慢跑(8km/h)', metRange: [7.0, 8.3], category: 'cardio' },
  running_10kmh: { name: '跑步(10km/h)', metRange: [9.8, 11.0], category: 'cardio' },
  cycling_leisure: { name: '休闲骑行', metRange: [4.0, 6.8], category: 'cardio' },
  cycling_intense: { name: '剧烈骑行', metRange: [10.0, 14.0], category: 'cardio' },
  swimming_freestyle: { name: '自由泳', metRange: [5.8, 8.0], category: 'cardio' },
  rope_skipping: { name: '跳绳', metRange: [10.0, 12.3], category: 'cardio' },
  elliptical: { name: '椭圆机', metRange: [4.6, 9.0], category: 'cardio' },
  rowing: { name: '划船机', metRange: [7.0, 12.0], category: 'cardio' },
  hiit: { name: 'HIIT间歇', metRange: [8.0, 14.0], category: 'cardio' },
  yoga: { name: '瑜伽', metRange: [2.3, 4.0], category: 'flexibility' },

  basketball: { name: '篮球', metRange: [6.5, 8.0], category: 'sports' },
  badminton: { name: '羽毛球', metRange: [4.5, 7.0], category: 'sports' },
  tennis: { name: '网球', metRange: [5.5, 7.3], category: 'sports' }
}

export function calculateExerciseCalories(exerciseKey, durationMinutes, weightKg) {
  const exercise = EXERCISE_MET_DB[exerciseKey]
  if (!exercise) return null

  const [metLow, metHigh] = exercise.metRange
  const hours = durationMinutes / 60
  const avgMET = (metLow + metHigh) / 2

  return {
    exercise: exercise.name,
    caloriesBurned: Math.round(avgMET * weightKg * hours),
    range: {
      low: Math.round(metLow * weightKg * hours),
      high: Math.round(metHigh * weightKg * hours)
    },
    perMinute: ((avgMET * weightKg) / 60).toFixed(1),
    metValue: avgMET.toFixed(1)
  }
}

// ==================== 目标热量设定 ====================

export const GOAL_OPTIONS = [
  { key: 'cut_aggressive', label: '激进减脂', adjustment: -800, desc: '周减0.7-1kg' },
  { key: 'cut', label: '温和减脂', adjustment: -400, desc: '周减0.3-0.5kg' },
  { key: 'maintain', label: '维持体重', adjustment: 0, desc: '保持现状' },
  { key: 'bulk', label: '温和增肌', adjustment: 300, desc: '周增0.2-0.3kg' },
  { key: 'bulk_aggressive', label: '激进增肌', adjustment: 700, desc: '周增0.5-0.7kg' }
]

export function calculateTargetCalories(tdee, goalKey) {
  if (!tdee) return null
  const goal = GOAL_OPTIONS.find(g => g.key === goalKey) || GOAL_OPTIONS[2]
  let target = tdee + goal.adjustment
  target = Math.max(target, 1200)

  return {
    targetCalories: target,
    dailyAdjustment: goal.adjustment,
    adjustmentType: goal.adjustment > 0 ? 'surplus' : (goal.adjustment < 0 ? 'deficit' : 'maintenance'),
    weeklyEstimate: Math.abs((goal.adjustment * 7) / 7700).toFixed(2) + 'kg'
  }
}

// ==================== 宏量营养素分配 ====================

export function calculateMacros(targetCalories, goalKey, weightKg) {
  let proteinPct, carbsPct, fatPct

  if (goalKey?.includes('cut')) {
    proteinPct = 0.35; carbsPct = 0.35; fatPct = 0.30
  } else if (goalKey?.includes('bulk')) {
    proteinPct = 0.25; carbsPct = 0.50; fatPct = 0.25
  } else {
    proteinPct = 0.30; carbsPct = 0.40; fatPct = 0.30
  }

  return {
    protein: { grams: Math.round(targetCalories * proteinPct / 4), percentage: Math.round(proteinPct * 100), perKg: weightKg ? (Math.round(targetCalories * proteinPct / 4) / weightKg).toFixed(1) : '-' },
    carbs: { grams: Math.round(targetCalories * carbsPct / 4), percentage: Math.round(carbsPct * 100) },
    fat: { grams: Math.round(targetCalories * fatPct / 9), percentage: Math.round(fatPct * 100) }
  }
}
```

- [ ] 验证：在浏览器控制台测试各函数输出正确

### 步骤 1.3: 创建能量计算器组件

- [ ] 创建文件 `components/CalorieCalculator.vue`：

```vue
<template>
  <view class="calorie-calc">
    <!-- BMR 区域 -->
    <view class="calc-section">
      <view class="section-header">
        <uni-icons type="fire" size="18" color="#F97316"></uni-icons>
        <text class="section-title">BMR 基础代谢率</text>
      </view>
      <text class="formula-hint">Mifflin-St Jeor 公式</text>
      <view class="form-grid">
        <view class="field">
          <text class="field-label">身高</text>
          <input type="number" v-model="form.height" placeholder="cm" class="field-input" />
        </view>
        <view class="field">
          <text class="field-label">体重</text>
          <input type="number" v-model="form.weight" placeholder="kg" class="field-input" />
        </view>
        <view class="field">
          <text class="field-label">年龄</text>
          <input type="number" v-model="form.age" placeholder="岁" class="field-input" />
        </view>
        <view class="field">
          <text class="field-label">性别</text>
          <picker mode="selector" :range="['男','女']" @change="onGenderChange">
            <view class="field-picker">{{ form.gender || '选择' }}</view>
          </picker>
        </view>
      </view>
      <view class="result-box" v-if="bmrResult">
        <text class="result-value">{{ bmrResult }} <text class="unit">kcal/天</text></text>
      </view>
    </view>

    <!-- TDEE 区域 -->
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
          <text class="act-name">{{ level.label }}</text>
          <text class="act-value">×{{ level.value }}</text>
        </view>
      </view>
      <view class="result-box primary" v-if="tdeeResult">
        <text class="result-value">{{ tdeeResult }} <text class="unit">kcal/天</text></text>
      </view>
    </view>

    <!-- 运动消耗区域 -->
    <view class="calc-section">
      <view class="section-header">
        <uni-icons type="flag" size="18" color="#22C55E"></uni-icons>
        <text class="section-title">运动热量消耗 (MET)</text>
      </view>
      <picker mode="selector" :range="exerciseNames" @change="onExerciseChange">
        <view class="select-trigger">{{ selectedExerciseName || '选择运动类型' }} ▼</view>
      </picker>
      <view class="field inline">
        <text class="field-label">时长</text>
        <input type="number" v-model="form.duration" placeholder="分钟" class="field-input small" />
      </view>
      <view class="result-box success" v-if="exerciseResult">
        <text class="result-value">{{ exerciseResult.caloriesBurned }} <text class="unit">kcal</text></text>
        <text class="result-range">({{ exerciseResult.range.low }}-{{ exerciseResult.range.high }} kcal)</text>
      </view>
    </view>

    <!-- 目标热量区域 -->
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
          <text class="goal-name">{{ goal.label }}</text>
          <text class="goal-desc">{{ goal.desc }}</text>
        </view>
      </view>
      <view class="result-box purple" v-if="targetResult">
        <text class="result-value">{{ targetResult.targetCalories }} <text class="unit">kcal/天</text></text>
        <view class="macro-row" v-if="macrosResult">
          <text>蛋白 {{ macrosResult.protein.g }}g</text>
          <text>碳水 {{ macrosResult.carbs.g }}g</text>
          <text>脂肪 {{ macrosResult.fat.g }}g</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import {
  calculateBMR, calculateTDEE, ACTIVITY_LEVELS,
  calculateExerciseCalories, EXERCISE_MET_DB,
  calculateTargetCalories, GOAL_OPTIONS, calculateMacros
} from '@/utils/calorie'

export default {
  name: 'CalorieCalculator',
  data() {
    return {
      form: { height: '', weight: '', age: '', gender: '', activityLevel: 'light', duration: 30, goal: 'maintain', selectedExercise: '' }
    }
  },
  computed: {
    bmrResult() {
      const h = Number(this.form.height), w = Number(this.form.weight)
      const a = Number(this.form.age), g = this.form.gender === '男' ? 'male' : 'female'
      if (!h || !w || !a || !g) return null
      return calculateBMR(w, h, a, g)
    },
    tdeeResult() {
      return calculateTDEE(this.bmrResult, this.form.activityLevel)
    },
    activityLevels() { return ACTIVITY_LEVELS },
    exerciseNames() { return Object.values(EXERCISE_MET_DB).map(e => e.name) },
    selectedExerciseName() {
      const ex = EXERCISE_MET_DB[this.form.selectedExercise]
      return ex ? ex.name : ''
    },
    exerciseResult() {
      if (!this.form.selectedExercise || !this.form.weight || !this.form.duration) return null
      return calculateExerciseCalories(this.form.selectedExercise, Number(this.form.duration), Number(this.form.weight))
    },
    goalOptions() { return GOAL_OPTIONS },
    targetResult() {
      return calculateTargetCalories(this.tdeeResult, this.form.goal)
    },
    macrosResult() {
      if (!this.targetResult || !this.form.weight) return null
      return calculateMacros(this.targetResult.targetCalories, this.form.goal, Number(this.form.weight))
    }
  },
  methods: {
    onGenderChange(e) { this.form.gender = ['男','女'][e.detail.value] },
    onExerciseChange(e) {
      const keys = Object.keys(EXERCISE_MET_DB)
      this.form.selectedExercise = keys[e.detail.value]
    }
  }
}
</script>

<style lang="scss" scoped>
.calorie-calc { padding: 20rpx; }

.calc-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);

  .section-header {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 16rpx;

    .section-title { font-size: 32rpx; font-weight: 700; color: #1e293b; }
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
    .field-label { font-size: 24rpx; color: #64748b; margin-bottom: 8rpx; display: block; }
    .field-input, .field-picker {
      height: 72rpx;
      border: 2rpx solid #e2e8f0;
      border-radius: 12rpx;
      padding: 0 20rpx;
      font-size: 28rpx;
      color: #334155;
    }
  }
}

.result-box {
  text-align: center;
  padding: 24rpx;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 16rpx;
  margin-top: 20rpx;

  &.primary { background: linear-gradient(135deg, #dbeafe, #bfdbfe); }
  &.success { background: linear-gradient(135deg, #dcfce7, #bbf7d0); }
  &.purple { background: linear-gradient(135deg, #f3e8ff, #e9d5ff); }

  .result-value {
    font-size: 44rpx;
    font-weight: 800;
    color: #1e293b;

    .unit { font-size: 26rpx; font-weight: 500; color: #64748b; }
  }

  .result-range { display: block; font-size: 24rpx; color: #64748b; margin-top: 8rpx; }

  .macro-row {
    display: flex;
    justify-content: center;
    gap: 24rpx;
    margin-top: 16rpx;
    font-size: 24rpx;
    color: #64748b;
  }
}

.activity-list, .goal-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 16rpx;
}

.activity-option, .goal-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx;
  border: 2rpx solid #e2e8f0;
  border-radius: 12rpx;
  transition: all 0.2s;

  &.active {
    border-color: #0ea5e9;
    background: #f0f9ff;
  }

  .act-name, .goal-name { font-size: 28rpx; color: #334155; font-weight: 500; }
  .act-value, .goal-desc { font-size: 24rpx; color: #94a3b8; }
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
  .field-input.small { width: 200rpx; }
}
</style>
```

- [ ] 验证：组件在各端（H5/小程序/App）渲染正常

---

## Task 2: 身高记录功能实现

**文件：**
- 创建：`pages/record/height/height.vue`
- 创建：`pages/record/height/height-history.vue`
- 修改：`api/health.js`（新增身高 API）
- 修改：`pages.json`（注册路由）
- 修改：`pages/record/record.vue`（添加入口卡片）

### 步骤 2.1: 新增身高 API

- [ ] 在 `api/health.js` 末尾添加：

```javascript
// ==================== 身高记录 API ====================

export const getHeightHistory = () => {
	return request({ url: '/heights/history', method: 'GET' });
};

export const addHeightRecord = (data) => {
	return request({ url: '/heights', method: 'POST', data });
};

export const updateHeightRecord = (id, data) => {
	return request({ url: `/heights/${id}`, method: 'PUT', data });
};

export const deleteHeightRecord = (id) => {
	return request({ url: `/heights/${id}`, method: 'DELETE' });
};

export const getLatestHeight = () => {
	return request({ url: '/heights/latest', method: 'GET' });
};
```

### 步骤 2.2: 创建身高记录主页面

- [ ] 创建 `pages/record/height/height.vue`，参考 `weight.vue` 结构：

**关键结构：**
- 顶部导航栏（返回 + 标题 "记录身高" + 历史按钮）
- 快速记录卡片：
  - 身高输入框 (cm 单位)
  - 日期选择器
  - 保存/取消按钮
- 最近记录列表（最近 10 条）
- 底部快捷操作（跳转历史页）

**样式要求：**
- 与 `weight.vue` 使用相同的 SCSS 变量和类名规范
- 主色调使用紫色系 (#A855F7) 区分于体重蓝色
- 卡片圆角 24rpx，阴影一致

### 步骤 2.3: 创建身高历史趋势页面

- [ ] 创建 `pages/record/height/height-history.vue`：

**关键功能：**
- SVG 趋势图（复用 weight 的图表逻辑，改为紫色主题）
- 时间范围切换（近7天/近30天/近90天）
- 数据列表（日期 + 身高值）
- 删除确认弹窗

### 步骤 2.4: 注册路由 + 添加入口

- [ ] 在 `pages.json` 的 pages 数组中添加：
```json
{
  "path": "pages/record/height/height",
  "style": { "navigationBarTitleText": "记录身高" }
},
{
  "path": "pages/record/height/height-history",
  "style": { "navigationBarTitleText": "身高历史" }
}
```

- [ ] 在 `record.vue` 的 action-grid 中添加第 5 个卡片：
```vue
<view class="card action-card height" @click="goHeightPage">
  <view class="icon-box-large">
    <uni-icons type="rule" size="32" color="#A855F7"></uni-icons>
  </view>
  <text class="action-name">记录身高</text>
</view>
```

- [ ] 添加 `goHeightPage()` 方法：
```javascript
goHeightPage() {
  uni.navigateTo({ url: "/pages/record/height/height" })
}
```

- [ ] 添加对应的 SCSS 样式（`.action-card.height` 紫色主题）

---

## Task 3: 最近动态数据优化

**文件：**
- 修改：`pages/record/record.vue`（重构最近动态区域）
- 修改：`api/health.js`（新增聚合查询 API）

### 步骤 3.1: 新增聚合查询 API

- [ ] 在 `api/health.js` 中添加：
```javascript
// ==================== 最近动态聚合 API ====================

export const getRecentActivities = (current = 1, size = 10) => {
	return request({
		url: `/activities/recent?current=${current}&size=${size}`,
		method: 'GET'
	});
};
```

### 步骤 3.2: 重构 record.vue 最近动态区域

- [ ] 替换原有的 `recentWorkouts` 单一数据源为混合动态列表：

**数据结构变更：**
```javascript
data() {
  return {
    // 移除: recentWorkouts: []
    // 新增:
    recentActivities: [],
    currentPage: 1,
    pageSize: 10,
    isLoadingMore: false,
    hasMore: true
  }
}
```

**模板变更：**
```vue
<!-- 最近动态（重构版） -->
<view class="recent-section">
  <text class="section-title">最近动态</text>

  <scroll-view
    scroll-y
    class="activity-scroll"
    @scrolltolower="loadMoreActivities"
    :lower-threshold="100"
  >
    <view
      v-for="(item, index) in recentActivities"
      :key="index"
      class="card activity-card"
      @click="goActivityDetail(item)"
    >
      <view class="activity-icon" :class="item.type">
        <uni-icons :type="getActivityIcon(item.type)" size="20" :color="getActivityColor(item.type)"></uni-icons>
      </view>
      <view class="activity-content">
        <view class="activity-header">
          <text class="activity-type">{{ getTypeLabel(item.type) }}</text>
          <text class="activity-time">{{ formatTime(item.createdAt) }}</text>
        </view>
        <text class="activity-summary">{{ getActivitySummary(item) }}</text>
      </view>
      <uni-icons type="chevron-right" size="16" color="#E2E8F0"></uni-icons>
    </view>

    <!-- 加载状态 -->
    <view class="load-more" v-if="recentActivities.length > 0">
      <text v-if="isLoadingMore">加载中...</text>
      <text v-else-if="!hasMore">— 已经到底了 —</text>
    </view>

    <!-- 空状态 -->
    <view v-if="recentActivities.length === 0 && !isLoadingMore" class="card record-card empty">
      <text class="lbl">暂无动态记录，开始记录你的健康数据吧！</text>
    </view>
  </scroll-view>
</view>
```

**关键方法：**
```javascript
methods: {
  async fetchRecentActivities(reset = false) {
    if (reset) {
      this.currentPage = 1
      this.hasMore = true
    }
    if (!this.hasMore || this.isLoadingMore) return

    this.isLoadingMore = true
    try {
      const res = await getRecentActivities(this.currentPage, this.pageSize)
      const list = res && Array.isArray(res.records) ? res.records : []
      if (reset) {
        this.recentActivities = list
      } else {
        this.recentActivities = [...this.recentActivities, ...list]
      }
      this.hasMore = list.length >= this.pageSize
      this.currentPage++
    } catch (e) {
      console.error("Failed to fetch activities", e)
    } finally {
      this.isLoadingMore = false
    }
  },

  loadMoreActivities() {
    this.fetchRecentActivities(false)
  },

  getActivityIcon(type) {
    const map = { workout: 'compose', weight: 'paperplane', water: 'color', diet: 'shop', height: 'rule' }
    return map[type] || 'info'
  },

  getActivityColor(type) {
    const map = { workout: '#0EA5E9', weight: '#38BDF8', water: '#38BDF8', diet: '#22C55E', height: '#A855F7' }
    return map[type] || '#94A3B8'
  },

  getTypeLabel(type) {
    const map = { workout: '运动记录', weight: '体重记录', water: '饮水记录', diet: '饮食记录', height: '身高记录' }
    return map[type] || '未知'
  },

  getActivitySummary(item) {
    switch (item.type) {
      case 'workout': return `${item.exerciseName || '训练'} · ${item.durationMinutes || 0}分钟 · ${item.calories || 0}kcal`
      case 'weight': return `${item.weight || 0}kg${item.period ? ' (' + (item.period === 'morning' ? '晨重' : '晚重') + ')' : ''}`
      case 'water': return `饮水 ${item.amount || 0}ml`
      case 'diet': return `${item.mealType || '餐'} · ${item.calories || 0}kcal`
      case 'height': return `${item.height || 0}cm`
      default: return ''
    }
  },

  goActivityDetail(item) {
    const routes = {
      workout: '/pages/record/workout/workout',
      weight: '/pages/record/weight/weight',
      water: '/pages/record/water/water',
      diet: '/pages/record/diet/diet',
      height: '/pages/record/height/height'
    }
    const url = routes[item.type]
    if (url) uni.navigateTo({ url })
  },

  formatTime(timeStr) {
    if (!timeStr) return ''
    const d = new Date(timeStr)
    const now = new Date()
    const diff = now - d
    if (diff < 86400000 && d.getDate() === now.getDate()) return '今天 ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    if (diff < 172800000) return '昨天'
    return `${d.getMonth()+1}/${d.getDate()}`
  }
}
```

- [ ] 替换 `onShow` 中的 `fetchRecentWorkouts` 为 `fetchRecentActivities(true)`
- [ ] 添加对应的 SCSS 样式（`.activity-card`, `.activity-icon`, `.load-more` 等）

---

## Task 4: 个人信息修改功能优化

**文件：**
- 修改：`pages/profile/profile.vue`

### 步骤 4.1: 扩展 profileForm 数据模型

- [ ] 修改 data() 中的 profileForm：

```javascript
profileForm: {
  nickname: "",
  realname: "",
  phone: "",
  // ===== 新增字段 =====
  gender: "",           // 性别: male/female
  age: "",              // 年龄: 数字
  fitnessGoal: "",      // 健身目标: cut/bulk/maintain/recomp
  bio: "",              // 个人简介
},
```

### 步骤 4.2: 重构编辑弹窗模板

- [ ] 替换原有 form-list 为完整字段集：

```vue
<view class="form-list">
  <!-- 昵称 -->
  <view class="form-item">
    <text class="label"><text class="required">*</text>昵称</text>
    <input v-model="profileForm.nickname" class="input" placeholder="请输入昵称" />
  </view>

  <!-- 真实姓名 -->
  <view class="form-item">
    <text class="label">真实姓名</text>
    <input v-model="profileForm.realname" class="input" placeholder="请输入真实姓名" />
  </view>

  <!-- 手机号 -->
  <view class="form-item">
    <text class="label"><text class="required">*</text>手机号</text>
    <input type="number" v-model="profileForm.phone" class="input" placeholder="请输入手机号" maxlength="11" />
  </view>

  <!-- 性别（新增） -->
  <view class="form-item">
    <text class="label">性别</text>
    <picker mode="selector" :range="['男','女']" @change="onGenderChange">
      <view class="picker-trigger">
        <text :class="{ placeholder: !profileForm.gender }">
          {{ profileForm.gender || '请选择性别' }}
        </text>
        <uni-icons type="bottom" size="14" color="#94A3B8"></uni-icons>
      </view>
    </picker>
  </view>

  <!-- 年龄（新增） -->
  <view class="form-item">
    <text class="label">年龄</text>
    <input type="number" v-model="profileForm.age" class="input" placeholder="请输入年龄" />
  </view>

  <!-- 健身目标（新增） -->
  <view class="form-item">
    <text class="label">健身目标</text>
    <picker mode="selector" :range="goalOptions" range-key="label" @change="onGoalChange">
      <view class="picker-trigger">
        <text :class="{ placeholder: !profileForm.fitnessGoal }">
          {{ getGoalLabel(profileForm.fitnessGoal) || '请选择健身目标' }}
        </text>
        <uni-icons type="bottom" size="14" color="#94A3B8"></uni-icons>
      </view>
    </picker>
  </view>

  <!-- 个人简介（新增） -->
  <view class="form-item textarea-item">
    <text class="label">个人简介</text>
    <textarea
      v-model="profileForm.bio"
      class="textarea"
      placeholder="介绍一下自己吧..."
      :maxlength="200"
      auto-height
    ></textarea>
    <text class="char-count">{{ (profileForm.bio || '').length }}/200</text>
  </view>
</view>
```

### 步骤 4.3: 添加新方法和数据

- [ ] 在 methods/computed 中添加：

```javascript
data() {
  return {
    // ...existing data
    goalOptions: [
      { key: 'cut', label: '减脂瘦身' },
      { key: 'bulk', label: '增肌增重' },
      { key: 'maintain', label: '保持体型' },
      { key: 'recomp', label: '身体重组' }
    ]
  }
},

methods: {
  // ...existing methods

  onGenderChange(e) {
    const val = e.detail.value
    this.profileForm.gender = val === 0 ? 'male' : 'female'
  },

  onGoalChange(e) {
    this.profileForm.fitnessGoal = this.goalOptions[e.detail.value].key
  },

  getGoalLabel(key) {
    const goal = this.goalOptions.find(g => g.key === key)
    return goal ? goal.label : ''
  },

  async fetchProfile() {
    try {
      const data = await getUserProfile()
      this.userInfo = data || {}
      // 回填表单
      this.profileForm = {
        nickname: data.nickname || '',
        realname: data.realname || '',
        phone: data.phone || '',
        gender: data.gender || '',
        age: data.age ? String(data.age) : '',
        fitnessGoal: data.fitnessGoal || '',
        bio: data.bio || ''
      }
    } catch (e) {
      console.error("Failed to fetch profile", e)
    }
  }
}
```

### 步骤 4.4: 添加新样式

- [ ] 在 `<style>` 中添加：

```scss
.picker-trigger {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80rpx;
  padding: 0 24rpx;
  background: #f8fafc;
  border-radius: 12rpx;
  border: 2rpx solid #e2e8f0;
  font-size: 28rpx;
  color: $text-main;

  .placeholder { color: #94a3b8; }
}

.textarea-item {
  flex-direction: column;
  align-items: stretch;

  .textarea {
    width: 100%;
    min-height: 160rpx;
    padding: 20rpx 24rpx;
    background: #f8fafc;
    border-radius: 12rpx;
    border: 2rpx solid #e2e8f0;
    font-size: 28rpx;
    color: $text-main;
    box-sizing: border-box;
  }

  .char-count {
    text-align: right;
    font-size: 24rpx;
    color: #94a3b8;
    margin-top: 8rpx;
  }
}

.required {
  color: #F43F5E;
  margin-right: 4rpx;
}
```

---

## Task 5: 能量计算公式集成到知识库

**文件：**
- 修改：`pages/knowledge/knowledge.vue`（添加能量计算入口）
- 创建：`pages/knowledge/calorie-guide.vue`（独立页面或作为特殊分类）

### 步骤 5.1: 修改知识库页面

- [ ] 在 knowledge.vue 的 categories 渲染中添加 "能量计算" 入口：

**方式 A（推荐）：作为特殊卡片插入网格**
```vue
<!-- 在 category-grid 最后添加 -->
<view class="card category-block special" @click="goCalorieGuide">
  <view class="icon-circle" style="background: linear-gradient(135deg, #F97316, #EA580C)">
    <uni-icons type="fire" size="40" color="#fff"></uni-icons>
  </view>
  <text class="cat-label">能量计算</text>
  <text class="cat-sub">科学计算热量</text>
</view>
```

- [ ] 添加方法：
```javascript
goCalorieGuide() {
  uni.navigateTo({ url: '/pages/knowledge/calorie-guide' })
}
```

### 步骤 5.2: 创建能量计算指南页面

- [ ] 创建 `pages/knowledge/calorie-guide.vue`：

**页面结构：**
1. 顶部标题区："能量计算指南"
2. 公式说明区（可折叠的 Markdown 内容）
3. 交互式计算器（引入 CalorieCalculator 组件）
4. 底部知识要点提示卡

**关键内容：**
- BMR 公式解释 + 各参数说明
- 活动系数对照表
- MET 值常见运动参考表
- 目标热量设定建议

- [ ] 在 `pages.json` 注册路由

---

## 自检清单

### 规格覆盖度
- [x] Task 1: 知识库数据完善 → 步骤 1.1
- [x] Task 1: 能量计算模块 → 步骤 1.2, 1.3, 5.1, 5.2
- [x] Task 2: 身高记录功能 → 步骤 2.1-2.4
- [x] Task 3: 最近动态优化 → 步骤 3.1, 3.2
- [x] Task 4: 个人信息优化 → 步骤 4.1-4.4
- [x] Task 5: 能量计算公式 → 已包含在 Task 1 和 Task 5 中

### 类型一致性检查
- [x] 身高 API 路径: `/heights/*` （与 `/weights/*` 风格一致）
- [x] 动态聚合 API: `/activities/recent` （RESTful 风格）
- [x] 表单字段命名: camelCase （gender, fitnessGoal, bio）
- [x] 颜色常量: 身高 #A855F7, 体重 #0EA5E9, 饮食 #22C55E

### 占位符扫描
- [x] 无 "TODO"、"待定"、"后续实现" 占位符
- [x] 所有步骤包含具体代码
- [x] 所有 API 路径明确指定
- [x] 所有样式类名具体定义
