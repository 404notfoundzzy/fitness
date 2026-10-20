/**
 * 能量计算工具函数库
 * 基于 Mifflin-St Jeor 公式 + MET 法
 * 来源：calorie-calculator skill
 */

const GENDER_CONSTANTS = {
  male: 5,
  female: -161
}

export function calculateBMR(weightKg, heightCm, age, gender) {
  if (!weightKg || !heightCm || !age || !gender) return null
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return Math.round(base + (GENDER_CONSTANTS[gender] || -161))
}

export const ACTIVITY_LEVELS = [
  { key: 'sedentary', label: '久坐/几乎不运动', value: 1.15, desc: '办公室工作，不额外运动' },
  { key: 'light', label: '轻度活跃', value: 1.20, desc: '每周1-3天轻度运动' },
  { key: 'moderate', label: '中度活跃', value: 1.35, desc: '每周3-5天中等强度训练' },
  { key: 'active', label: '非常活跃', value: 1.45, desc: '每周6-7天高强度训练' },
  { key: 'extreme', label: '极度活跃', value: 1.60, desc: '运动员/体力劳动者/双练' }
]

export function calculateTDEE(bmr, activityLevel) {
  if (!bmr) return null
  const level = ACTIVITY_LEVELS.find(l => l.key === activityLevel)
  const multiplier = level ? level.value : 1.20
  return Math.round(bmr * multiplier)
}

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

export const GOAL_OPTIONS = [
  { key: 'cut_aggressive', label: '激进减脂', adjustment: -800, desc: '周减0.7-1kg，大基数短期冲刺' },
  { key: 'cut', label: '温和减脂', adjustment: -400, desc: '周减0.3-0.5kg，标准减脂' },
  { key: 'maintain', label: '维持体重', adjustment: 0, desc: '保持当前体重' },
  { key: 'bulk', label: '温和增肌', adjustment: 300, desc: '周增0.2-0.3kg，干净增肌' },
  { key: 'bulk_aggressive', label: '激进增肌', adjustment: 700, desc: '周增0.5-0.7kg，瘦子增重' }
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
    protein: {
      grams: Math.round(targetCalories * proteinPct / 4),
      percentage: Math.round(proteinPct * 100),
      perKg: weightKg ? (Math.round(targetCalories * proteinPct / 4) / weightKg).toFixed(1) : '-'
    },
    carbs: {
      grams: Math.round(targetCalories * carbsPct / 4),
      percentage: Math.round(carbsPct)
    },
    fat: {
      grams: Math.round(targetCalories * fatPct / 9),
      percentage: Math.round(fatPct)
    }
  }
}
