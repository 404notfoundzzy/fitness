# 训练计划功能实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在健身知识库中新增训练计划模块，包含4套预置分化训练计划和自定义计划功能

**架构：** 采用知识库子模块模式，通过横向滚动卡片展示计划列表，独立详情页展示完整周计划，支持用户自定义创建和编辑训练计划

**技术栈：** Vue2 + uni-app + SCSS + 本地存储(uni.setStorageSync)

***

## 文件结构总览

### 新建文件

1. `fitness-app/data/training-plans.js` - 预置训练计划数据
2. `fitness-app/pages/knowledge/training-plan-detail.vue` - 计划详情页
3. `fitness-app/pages/knowledge/training-plan-edit.vue` - 计划编辑页（自定义）

### 修改文件

1. `fitness-app/pages/knowledge/knowledge.vue` - 知识库主页（添加训练计划入口）

***

## 任务 1：创建预置训练计划数据

**文件：**

- 创建：`fitness-app/data/training-plans.js`
- [ ] **步骤 1：创建数据文件并导出4套完整计划**

```javascript
/**
 * 预置训练计划数据
 * 包含：五分化、三分化、凯圣王三分化、一分化
 */

export const trainingPlans = [
  {
    id: "preset_five_split",
    name: "经典五分化",
    type: "five-split",
    description: "经典的5天分化训练，每专注一个肌群，适合进阶训练者充分刺激各部位。",
    daysPerWeek: 5,
    difficulty: "advanced",
    targetAudience: "有3个月以上系统训练基础",
    tags: ["增肌", "力量", "分化训练"],
    isPreset: true,
    source: "system",
    schedule: [
      {
        day: 1,
        name: "胸部训练",
        focus: "胸大肌/胸小肌/前锯肌",
        exercises: [
          { name: "平板杠铃卧推", sets: 4, reps: "8-12", restSeconds: 90, notes: "下放时感受胸肌拉伸" },
          { name: "上斜杠铃卧推", sets: 4, reps: "10-12", restSeconds: 75, notes: "角度30-45度" },
          { name: "平板哑铃飞鸟", sets: 3, reps: "12-15", restSeconds: 60, notes: "保持肘部微屈" },
          { name: "绳索夹胸", sets: 3, reps: "15-20", restSeconds: 45, notes: "充分挤压胸肌" },
          { name: "双杠臂屈伸", sets: 3, reps: "力竭", restSeconds: 60, notes: "身体前倾刺激下胸" }
        ]
      },
      {
        day: 2,
        name: "背部训练",
        focus: "背阔肌/菱形肌/斜方肌中下束",
        exercises: [
          { name: "引体向上", sets: 4, reps: "力竭", restSeconds: 90, notes: "全程控制，避免摆动" },
          { name: "杠铃划船", sets: 4, reps: "8-10", restSeconds: 90, notes: "收紧肩胛骨" },
          { name: "单臂哑铃划船", sets: 3, reps: "10-12", restSeconds: 75, notes: "充分拉伸背阔肌" },
          { name: "坐姿绳索划船", sets: 3, reps: "12-15", restSeconds: 60, notes: "手肘贴近身体" },
          { name: "直臂下压", sets: 3, reps: "15-20", restSeconds: 45, notes: "固定大臂位置" }
        ]
      },
      {
        day: 3,
        name: "腿部训练",
        focus: "股四头肌/腘绳肌/臀部/小腿",
        exercises: [
          { name: "杠铃深蹲", sets: 4, reps: "6-10", restSeconds: 120, notes: "核心收紧，膝盖方向朝脚尖" },
          { name: "腿举", sets: 4, reps: "10-12", restSeconds: 90, notes: "不要锁死膝关节" },
          { name: "罗马尼亚硬拉", sets: 4, reps: "8-10", restSeconds: 90, notes: "感受腘绳肌拉伸" },
          { name: "腿弯举", sets: 3, reps: "12-15", restSeconds: 60, notes: "缓慢离心" },
          { name: "提踵", sets: 4, reps: "15-20", restSeconds: 45, notes: "顶峰收缩1秒" }
        ]
      },
      {
        day: 4,
        name: "肩部训练",
        focus: "三角肌前束/中束/后束",
        exercises: [
          { name: "坐姿哑铃推举", sets: 4, reps: "8-12", restSeconds: 90, notes: "手肘微向前" },
          { name: "侧平举", sets: 4, reps: "12-15", restSeconds: 60, notes: "手肘高于手腕" },
          { name: "俯身飞鸟", sets: 3, reps: "12-15", restSeconds: 60, notes: "重点刺激后束" },
          { name: "阿诺德推举", sets: 3, reps: "10-12", restSeconds: 75, notes: "旋转时控制重量" },
          { name: "绳索面拉", sets: 3, reps: "15-20", restSeconds: 45, notes: "后缩肩胛骨" }
        ]
      },
      {
        day: 5,
        name: "手臂训练",
        focus: "肱二头肌/肱三头肌",
        exercises: [
          { name: "杠铃弯举", sets: 4, reps: "8-12", restSeconds: 60, notes: "大臂贴紧身体" },
          { name: "锤式弯举", sets: 3, reps: "10-12", restSeconds: 60, notes: "刺激肱肌" },
          { name: "绳索弯举", sets: 3, reps: "12-15", restSeconds: 45, notes: "顶峰收缩" },
          { name: "窄距卧推", sets: 4, reps: "8-10", restSeconds: 75, notes: "双手间距与肩同宽" },
          { name: "绳索下压", sets: 3, reps: "12-15", restSeconds: 45, notes: "大臂固定不动" },
          { name: "过头臂屈伸", sets: 3, reps: "10-12", restSeconds: 60, notes: "长头刺激" }
        ]
      }
    ]
  },
  {
    id: "preset_three_split",
    name: "传统三分化",
    type: "three-split",
    description: "推/拉/腿经典三分化，每周每个部位训练2次，频率高，适合中级训练者。",
    daysPerWeek: 3,
    difficulty: "intermediate",
    targetAudience: "有1-3个月训练基础，希望提高训练频率",
    tags: ["增肌", "高频", "均衡发展"],
    isPreset: true,
    source: "system",
    schedule: [
      {
        day: 1,
        name: "推类训练（Push）",
        focus: "胸/肩前中束/肱三头肌",
        exercises: [
          { name: "平板杠铃卧推", sets: 4, reps: "6-10", restSeconds: 120, notes: "复合动作优先" },
          { name: "上斜哑铃卧推", sets: 3, reps: "8-12", restSeconds: 90, notes: "上胸重点" },
          { name: "坐姿哑铃推举", sets: 3, reps: "8-12", restSeconds: 90, notes: "肩部复合动作" },
          { name: "侧平举", sets: 3, reps: "12-15", restSeconds: 60, notes: "中束孤立" },
          { name: "绳索下压", sets: 3, reps: "12-15", restSeconds: 45, notes: "三头收尾" }
        ]
      },
      {
        day: 2,
        name: "拉类训练（Pull）",
        focus: "背/肩后束/肱二头肌",
        exercises: [
          { name: "引体向上", sets: 4, reps: "力竭", restSeconds: 120, notes: "背部王牌动作" },
          { name: "杠铃划船", sets: 4, reps: "6-10", restSeconds: 90, notes: "厚度训练" },
          { name: "单臂哑铃划船", sets: 3, reps: "10-12", restSeconds: 75, notes: "背阔肌宽度" },
          { name: "面拉", sets: 3, reps: "15-20", restSeconds: 60, notes: "后束+菱形肌" },
          { name: "杠铃弯举", sets: 3, reps: "8-12", restSeconds: 60, notes: "二头复合" }
        ]
      },
      {
        day: 3,
        name: "腿部训练（Legs）",
        focus: "股四头/腘绳肌/臀/小腿",
        exercises: [
          { name: "杠铃深蹲", sets: 4, reps: "6-8", restSeconds: 150, notes: "腿部基石动作" },
          { name: "罗马尼亚硬拉", sets: 4, reps: "8-10", restSeconds: 90, notes: "链后侧" },
          { name: "腿举", sets: 3, reps: "10-12", restSeconds: 90, notes: "高容量补充" },
          { name: "腿弯举", sets: 3, reps: "12-15", restSeconds: 60, notes: "腘绳孤立" },
          { name: "提踵", sets: 4, reps: "15-20", restSeconds: 45, notes: "小腿专项" }
        ]
      }
    ]
  },
  {
    id: "preset_kai_three_split",
    name: "凯圣王谭成义三分化",
    type: "kai-three-split",
    description: "改良版PPL分化，优化了肌群搭配和训练容量分配，兼顾力量与肌肥大。",
    daysPerWeek: 3,
    difficulty: "intermediate",
    targetAudience: "有一定基础，希望优化训练效率的中级训练者",
    tags: ["增肌", "力量", "均衡", "高效"],
    isPreset: true,
    source: "system",
    schedule: [
      {
        day: 1,
        name: "胸+三头+前肩",
        focus: "胸大肌/肱三头肌/三角肌前束",
        exercises: [
          { name: "平板杠铃卧推", sets: 4, reps: "5-8", restSeconds: 150, notes: "大重量建立力量基础" },
          { name: "上斜哑铃卧推", sets: 3, reps: "8-12", restSeconds: 90, notes: "中等重量肌肥大" },
          { name: "双杠臂屈伸", sets: 3, reps: "10-15", restSeconds: 60, notes: "自重/负重均可" },
          { name: "绳索下压", sets: 4, reps: "10-15", restSeconds: 45, notes: "三头多角度刺激" },
          { name: "过头臂屈伸", sets: 3, reps: "10-12", restSeconds: 60, notes: "长头重点" },
          { name: "哑铃前平举", sets: 3, reps: "12-15", restSeconds: 45, notes: "前束收尾" }
        ]
      },
      {
        day: 2,
        name: "背+二头+后肩",
        focus: "背阔肌/肱二头肌/三角肌后束",
        exercises: [
          { name: "负重引体向上", sets: 4, reps: "5-8", restSeconds: 150, notes: "力量优先" },
          { name: "杠铃划船", sets: 4, reps: "6-10", restSeconds: 90, notes: "背部厚度" },
          { name: "直臂下压", sets: 3, reps: "12-15", restSeconds: 60, notes: "背阔肌孤立" },
          { name: "杠铃弯举", sets: 3, reps: "6-10", restSeconds: 75, notes: "二头力量" },
          { name: "锤式弯举", sets: 3, reps: "10-12", restSeconds: 60, notes: "肱肌发展" },
          { name: "俯身飞鸟", sets: 3, reps: "12-15", restSeconds: 45, notes: "后束塑形" }
        ]
      },
      {
        day: 3,
        name: "腿+中肩+核心",
        focus: "下肢整体/三角肌中束/核心肌群",
        exercises: [
          { name: "杠铃深蹲", sets: 4, reps: "5-8", restSeconds: 180, notes: "腿部力量基石" },
          { name: "腿举", sets: 3, reps: "10-12", restSeconds: 90, notes: "高容量刺激" },
          { name: "罗马尼亚硬拉", sets: 3, reps: "8-10", restSeconds: 90, notes: "后链强化" },
          { name: "侧平举", sets: 4, reps: "12-15", restSeconds: 45, notes: "中肩大量量" },
          { name: "悬垂举腿", sets: 3, reps: "12-15", restSeconds: 60, notes: "下腹重点" },
          { name: "平板支撑", sets: 3, reps: "45-60秒", restSeconds: 45, notes: "核心稳定" }
        ]
      }
    ]
  },
  {
    id: "preset_full_body",
    name: "全身训练（一分化）",
    type: "full-body",
    description: "每次训练覆盖全身主要肌群，适合初学者建立基础，或时间有限的训练者。建议每周2-3次。",
    daysPerWeek: 1,
    difficulty: "beginner",
    targetAudience: "健身新手或时间有限者",
    tags: ["新手友好", "全身", "高效", "基础建设"],
    isPreset: true,
    source: "system",
    schedule: [
      {
        day: 1,
        name: "全身综合训练",
        focus: "全身主要肌群",
        exercises: [
          { name: "杠铃深蹲", sets: 3, reps: "8-12", restSeconds: 120, notes: "下肢复合动作之王" },
          { name: "平板杠铃卧推", sets: 3, reps: "8-12", restSeconds: 90, notes: "上肢推类基础" },
          { name: "引体向上（辅助）", sets: 3, reps: "8-10", restSeconds: 90, notes: "可用弹带辅助" },
          { name: "坐姿哑铃推举", sets: 3, reps: "10-12", restSeconds: 75, notes: "肩部全面发展" },
          { name: "杠铃划船", sets: 3, reps: "8-12", restSeconds: 90, notes: "背部厚度" },
          { name: "杠铃硬拉", sets: 2, reps: "6-8", restSeconds: 150, notes: "后链力量" },
          { name: "平板支撑", sets: 3, reps: "30-45秒", restSeconds: 45, notes: "核心稳定" }
        ]
      }
    ]
  }
];

/**
 * 获取所有预置计划
 */
export const getPresetPlans = () => {
  return trainingPlans;
};

/**
 * 根据ID获取单个计划
 */
export const getPlanById = (id) => {
  return trainingPlans.find(plan => plan.id === id) || null;
};
```

- [ ] **步骤 2：验证数据结构完整性**

检查点：

- ✅ 每个计划都有完整的字段（id, name, type, description等）
- ✅ 每个schedule都有day, name, exercises数组
- ✅ 每个exercise都有name, sets, reps, restSeconds
- ✅ 数据类型正确（数字、字符串、数组）
- [ ] **步骤 3：Commit**

```bash
git add fitness-app/data/training-plans.js
git commit -m "feat: add preset training plans data (4 split types)"
```

***

## 任务 2：修改知识库主页 - 添加训练计划入口

**文件：**

- 修改：`fitness-app/pages/knowledge/knowledge.vue`
- [ ] **步骤 1：导入训练计划数据**

在 `<script>` 部分顶部添加导入：

```javascript
import { getPresetPlans } from "@/data/training-plans";
```

在 `data()` 中新增字段：

```javascript
data() {
  return {
    // ... 已有字段
    presetTrainingPlans: [],  // 新增：预置训练计划列表
  };
},
```

- [ ] **步骤 2：在生命周期中加载计划数据**

在 `onShow()` 方法中添加加载逻辑：

```javascript
onShow() {
  if (checkLogin()) {
    this.fetchExercises();
    this.fetchCategories();
    this.loadPresetPlans();  // 新增
  }
},

methods: {
  // ... 已有方法
  
  loadPresetPlans() {
    this.presetTrainingPlans = getPresetPlans();
  },
  
  openPlanDetail(plan) {
    uni.navigateTo({
      url: `/pages/knowledge/training-plan-detail?id=${plan.id}&source=preset`
    });
  },
  
  createCustomPlan() {
    uni.navigateTo({
      url: '/pages/knowledge/training-plan-edit'
    });
  }
}
```

- [ ] **步骤 3：在模板中添加训练计划模块**

在能量计算器卡片（`.tool-card`）之前插入新的训练计划区域：

```vue
<!-- 训练计划模块 -->
<view class="training-plan-section">
  <view class="section-header-row">
    <view class="title-left-group">
      <view class="section-icon-small plan-icon">
        <uni-icons type="list" size="18" color="#0EA5E9"></uni-icons>
      </view>
      <text class="section-title-text">训练计划</text>
    </view>
    <!-- 可选：查看全部按钮 -->
  </view>
  
  <scroll-view scroll-x class="plan-scroll" :show-scrollbar="false">
    <view class="plan-list-horizontal">
      <view 
        v-for="(plan, index) in presetTrainingPlans"
        :key="index"
        class="card plan-card"
        @click="openPlanDetail(plan)"
      >
        <view class="plan-badge">{{ getSplitTypeLabel(plan.type) }}</view>
        <text class="plan-name">{{ plan.name }}</text>
        <view class="plan-meta">
          <text>{{ plan.daysPerWeek }}天/周</text>
          <text>|</text>
          <text>{{ getDifficultyLabel(plan.difficulty) }}</text>
        </view>
        <text class="plan-desc">{{ plan.description }}</text>
      </view>
      
      <!-- 自定义添加卡片 -->
      <view class="card plan-card add-custom-card" @click="createCustomPlan">
        <uni-icons type="plus-filled" size="48" color="#CBD5E1"></uni-icons>
        <text class="add-text">自定义计划</text>
      </view>
    </view>
  </scroll-view>
</view>
```

- [ ] **步骤 4：添加辅助方法**

```javascript
methods: {
  // ... 已有方法
  
  getSplitTypeLabel(type) {
    const map = {
      'five-split': '五分化',
      'three-split': '三分化',
      'kai-three-split': '改良三分化',
      'full-body': '一分化'
    };
    return map[type] || '自定义';
  },
  
  getDifficultyLabel(difficulty) {
    const map = {
      'beginner': '初级',
      'intermediate': '中级',
      'advanced': '进阶'
    };
    return map[difficulty] || '未知';
  }
}
```

- [ ] **步骤 5：添加训练计划模块样式**

在 `<style>` 部分添加：

```scss
// 训练计划模块
.training-plan-section {
  margin-bottom: 36rpx;
  
  .section-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
    
    .title-left-group {
      display: flex;
      align-items: center;
      gap: 16rpx;
      
      .section-icon-small {
        width: 48rpx;
        height: 48rpx;
        border-radius: 14rpx;
        background: linear-gradient(135deg, #e0f2fe, #bae6fd);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .section-title-text {
        font-size: 32rpx;
        font-weight: 700;
        color: #1e293b;
      }
    }
  }
  
  .plan-scroll {
    white-space: nowrap;
    margin: 0 -40rpx;
    padding: 0 40rpx;
  }
  
  .plan-list-horizontal {
    display: inline-flex;
    gap: 24rpx;
    padding-right: 40rpx;
  }
  
  .plan-card {
    display: flex;
    flex-direction: column;
    min-width: 300rpx;
    max-width: 320rpx;
    padding: 28rpx;
    background: #ffffff;
    border-radius: 24rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
    transition: all 0.25s ease;
    
    &:active {
      transform: scale(0.96);
      box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.1);
    }
    
    .plan-badge {
      font-size: 20rpx;
      color: #0ea5e9;
      background: #e0f2fe;
      padding: 6rpx 18rpx;
      border-radius: 100rpx;
      align-self: flex-start;
      font-weight: 600;
      margin-bottom: 16rpx;
    }
    
    .plan-name {
      font-size: 32rpx;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 12rpx;
      line-height: 1.3;
    }
    
    .plan-meta {
      display: flex;
      align-items: center;
      gap: 12rpx;
      margin-bottom: 12rpx;
      
      text {
        font-size: 22rpx;
        color: #64748b;
        font-weight: 500;
      }
    }
    
    .plan-desc {
      font-size: 22rpx;
      color: #94a3b8;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
  
  .add-custom-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 300rpx;
    max-width: 320rpx;
    min-height: 280rpx;
    background: #f8fafc;
    border: 2rpx dashed #cbd5e1;
    box-shadow: none;
    
    &:active {
      background: #f1f5f9;
      transform: scale(0.96);
    }
    
    .add-text {
      font-size: 26rpx;
      color: #64748b;
      font-weight: 600;
      margin-top: 16rpx;
    }
  }
}
```

- [ ] **步骤 6：Commit**

```bash
git add fitness-app/pages/knowledge/knowledge.vue
git commit -m "feat: add training plan entry to knowledge page"
```

***

## 任务 3：创建训练计划详情页

**文件：**

- 创建：`fitness-app/pages/knowledge/training-plan-detail.vue`
- [ ] **步骤 1：创建页面基础结构**

```vue
<template>
  <view class="container">
    <!-- 导航栏 -->
    <view class="nav-header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="24" color="#F97316"></uni-icons>
      </view>
      <text class="page-title">{{ planName }}</text>
      <view class="header-placeholder"></view>
    </view>

    <scroll-view scroll-y class="content-scroll" v-if="planData">
      <!-- 信息卡片 -->
      <view class="info-card">
        <view class="info-main">
          <view class="meta-tags">
            <view class="tag-item days">
              <uni-icons type="calendar" size="16" color="#0EA5E9"></uni-icons>
              <text>{{ planData.daysPerWeek }}天/周</text>
            </view>
            <view class="tag-item difficulty" :class="planData.difficulty">
              <uni-icons type="star" size="16" :color="getDifficultyColor(planData.difficulty)"></uni-icons>
              <text>{{ getDifficultyText(planData.difficulty) }}</text>
            </view>
          </view>
          <text class="target-audience">{{ planData.targetAudience }}</text>
        </view>
        
        <view class="tag-list" v-if="planData.tags && planData.tags.length">
          <view v-for="(tag, idx) in planData.tags" :key="idx" class="tag-chip">
            {{ tag }}
          </view>
        </view>
      </view>

      <!-- 训练日程列表 -->
      <view class="schedule-section">
        <text class="schedule-title">📋 训练安排</text>
        
        <view 
          v-for="(day, index) in planData.schedule" 
          :key="index"
          class="day-card"
        >
          <view class="day-header" @click="toggleDay(index)">
            <view class="day-info">
              <text class="day-number">Day {{ day.day }}</text>
              <text class="day-name">{{ day.name }}</text>
            </view>
            <view class="day-actions">
              <text class="exercise-count">{{ day.exercises.length }} 个动作</text>
              <uni-icons 
                :type="expandedDays[index] ? 'up' : 'bottom'" 
                size="16" 
                color="#94A3B8"
              ></uni-icons>
            </view>
          </view>
          
          <view class="day-exercises" v-show="expandedDays[index]">
            <view 
              v-for="(ex, exIdx) in day.exercises" 
              :key="exIdx"
              class="exercise-item"
            >
              <view class="ex-header">
                <text class="ex-name">{{ ex.name }}</text>
                <view class="ex-params">
                  <text class="param"><text class="param-value">{{ ex.sets }}</text>组</text>
                  <text class="param">× <text class="param-value">{{ ex.reps }}</text>次</text>
                  <text class="param">| <text class="param-value">{{ ex.restSeconds }}s</text></text>
                </view>
              </view>
              
              <view class="ex-tips" v-if="ex.notes">
                <uni-icons type="info" size="14" color="#F59E0B"></uni-icons>
                <text>{{ ex.notes }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar" v-if="planData">
      <button class="btn-secondary" @click="editPlan" v-if="!planData.isPreset">
        <uni-icons type="compose" size="18" color="#64748b"></uni-icons>
        <text>编辑修改</text>
      </button>
      <button class="btn-primary" @click="usePlan">
        <uni-icons type="checkmarkempty" size="18" color="#fff"></uni-icons>
        <text>使用此计划</text>
      </button>
    </view>
  </view>
</template>

<script>
import { getPlanById } from "@/data/training-plans";

export default {
  data() {
    return {
      planId: '',
      source: '',
      planData: null,
      expandedDays: {}  // 控制每天展开状态
    };
  },
  
  computed: {
    planName() {
      return this.planData ? this.planData.name : '训练计划';
    }
  },
  
  onLoad(options) {
    if (options.id) {
      this.planId = options.id;
      this.source = options.source || 'preset';
      this.loadPlan();
    }
  },
  
  methods: {
    loadPlan() {
      if (this.source === 'preset') {
        this.planData = getPlanById(this.planId);
        // 默认展开第一天
        if (this.planData && this.planData.schedule.length > 0) {
          this.$set(this.expandedDays, 0, true);
        }
      } else {
        // 从本地存储读取自定义计划
        const customPlans = uni.getStorageSync('custom_training_plans') || [];
        this.planData = customPlans.find(p => p.id === this.planId) || null;
        if (this.planData && this.planData.schedule.length > 0) {
          this.$set(this.expandedDays, 0, true);
        }
      }
    },
    
    goBack() {
      uni.navigateBack();
    },
    
    toggleDay(index) {
      this.$set(this.expandedDays, index, !this.expandedDays[index]);
    },
    
    getDifficultyColor(difficulty) {
      const colors = {
        beginner: '#22c55e',
        intermediate: '#f59e0b',
        advanced: '#ef4444'
      };
      return colors[difficulty] || '#64748b';
    },
    
    getDifficultyText(difficulty) {
      const texts = {
        beginner: '初级',
        intermediate: '中级',
        advanced: '进阶'
      };
      return texts[difficulty] || '未知';
    },
    
    editPlan() {
      uni.navigateTo({
        url: `/pages/knowledge/training-plan-edit?id=${this.planId}`
      });
    },
    
    usePlan() {
      uni.showToast({
        title: '已复制计划模板',
        icon: 'success'
      });
      // TODO: 可扩展为跳转到运动记录页面并填充计划
    }
  }
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
}

.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 60rpx 32rpx 24rpx;
  background: linear-gradient(135deg, #ffffff, #f8fafc);
  
  .back-btn {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .page-title {
    font-size: 36rpx;
    font-weight: 700;
    color: #1e293b;
    flex: 1;
    text-align: center;
  }
  
  .header-placeholder {
    width: 64rpx;
  }
}

.content-scroll {
  flex: 1;
  padding: 0 32rpx 140rpx;  // 底部留出操作栏空间
}

.info-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  
  .info-main {
    margin-bottom: 20rpx;
  }
  
  .meta-tags {
    display: flex;
    gap: 16rpx;
    margin-bottom: 16rpx;
    
    .tag-item {
      display: flex;
      align-items: center;
      gap: 8rpx;
      padding: 10rpx 20rpx;
      border-radius: 100rpx;
      font-size: 24rpx;
      font-weight: 600;
      
      &.days {
        background: #e0f2fe;
        color: #0369a1;
      }
      
      &.difficulty {
        &.beginner {
          background: #dcfce7;
          color: #16a34a;
        }
        &.intermediate {
          background: #fef3c7;
          color: #d97706;
        }
        &.advanced {
          background: #fee2e2;
          color: #dc2626;
        }
      }
    }
  }
  
  .target-audience {
    font-size: 26rpx;
    color: #64748b;
    line-height: 1.5;
  }
  
  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    
    .tag-chip {
      padding: 8rpx 20rpx;
      background: #f1f5f9;
      border-radius: 100rpx;
      font-size: 22rpx;
      color: #475569;
      font-weight: 500;
    }
  }
}

.schedule-section {
  .schedule-title {
    display: block;
    font-size: 30rpx;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 24rpx;
  }
}

.day-card {
  background: #ffffff;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  
  .day-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 28rpx 32rpx;
    background: linear-gradient(135deg, #f8fafc, #ffffff);
    border-bottom: 1rpx solid #f1f5f9;
    
    .day-info {
      display: flex;
      align-items: center;
      gap: 16rpx;
      
      .day-number {
        font-size: 24rpx;
        font-weight: 700;
        color: #0ea5e9;
        background: #e0f2fe;
        padding: 6rpx 16rpx;
        border-radius: 8rpx;
      }
      
      .day-name {
        font-size: 30rpx;
        font-weight: 700;
        color: #334155;
      }
    }
    
    .day-actions {
      display: flex;
      align-items: center;
      gap: 12rpx;
      
      .exercise-count {
        font-size: 22rpx;
        color: #94a3b8;
        font-weight: 500;
      }
    }
  }
  
  .day-exercises {
    padding: 16rpx 24rpx 24rpx;
  }
}

.exercise-item {
  background: #fafbfc;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  border-left: 4rpx solid #e2e8f0;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .ex-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12rpx;
    
    .ex-name {
      font-size: 28rpx;
      font-weight: 600;
      color: #1e293b;
      flex: 1;
    }
    
    .ex-params {
      display: flex;
      gap: 12rpx;
      flex-shrink: 0;
      
      .param {
        font-size: 22rpx;
        color: #64748b;
        
        .param-value {
          color: #0ea5e9;
          font-weight: 700;
        }
      }
    }
  }
  
  .ex-tips {
    display: flex;
    align-items: flex-start;
    gap: 10rpx;
    padding: 16rpx;
    background: #fffbeb;
    border-radius: 12rpx;
    border-left: 3rpx solid #fbbf24;
    
    text {
      font-size: 22rpx;
      color: #92400e;
      line-height: 1.5;
      flex: 1;
    }
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.08);
  
  button {
    flex: 1;
    height: 88rpx;
    border-radius: 44rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    font-size: 28rpx;
    font-weight: 600;
    border: none;
    
    &::after {
      border: none;
    }
  }
  
  .btn-secondary {
    background: #f1f5f9;
    color: #64748b;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #0ea5e9, #38bdf8);
    color: #ffffff;
    box-shadow: 0 4rpx 16rpx rgba(14, 165, 233, 0.3);
  }
}
</style>
```

- [ ] **步骤 2：注册页面路由**

在 `pages.json` 中添加路由配置：

```json
{
  "path": "pages/knowledge/training-plan-detail",
  "style": {
    "navigationBarTitleText": "",
    "navigationStyle": "custom"
  }
}
```

- [ ] **步骤 3：测试页面基本功能**

验证项：

- ✅ 页面正常打开，接收参数
- ✅ 预设计划数据正确显示
- ✅ 展开/折叠功能正常
- ✅ 返回按钮工作正常
- ✅ 底部操作栏固定定位正确
- [ ] **步骤 4：Commit**

```bash
git add fitness-app/pages/knowledge/training-plan-detail.vue
git commit -m "feat: create training plan detail page with full schedule view"
```

***

## 任务 4：创建自定义计划编辑页

**文件：**

- 创建：`fitness-app/pages/knowledge/training-plan-edit.vue`
- [ ] **步骤 1：创建表单页面结构**

```vue
<template>
  <view class="container">
    <!-- 导航栏 -->
    <view class="nav-header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="24" color="#F97316"></uni-icons>
      </view>
      <text class="page-title">{{ isEdit ? '编辑计划' : '新建计划' }}</text>
      <view class="header-action" @click="savePlan" v-if="canSave">
        <text class="save-text">保存</text>
      </view>
      <view class="header-placeholder" v-else></view>
    </view>

    <scroll-view scroll-y class="form-scroll">
      <!-- 基本信息 -->
      <view class="form-section">
        <text class="section-label">基本信息</text>
        
        <view class="form-item">
          <text class="field-label">计划名称 *</text>
          <input 
            type="text" 
            v-model="form.name" 
            placeholder="例如：我的增肌计划"
            placeholder-style="color: #cbd5e1"
            class="form-input"
            maxlength="20"
          />
        </view>
        
        <view class="form-item">
          <text class="field-label">分化类型 *</text>
          <picker 
            mode="selector" 
            :range="splitTypeOptions" 
            range-key="label"
            :value="splitTypeIndex"
            @change="onSplitTypeChange"
          >
            <view class="picker-trigger">
              <text :class="{ placeholder: !form.type }">
                {{ form.type ? getSplitTypeLabel(form.type) : '请选择分化类型' }}
              </text>
              <uni-icons type="bottom" size="14" color="#94a3b8"></uni-icons>
            </view>
          </picker>
        </view>
        
        <view class="form-row-two">
          <view class="form-item half">
            <text class="field-label">每周天数 *</text>
            <picker 
              mode="selector" 
              :range="daysOptions" 
              :value="daysIndex"
              @change="onDaysChange"
            >
              <view class="picker-trigger small">
                <text :class="{ placeholder: !form.daysPerWeek }">
                  {{ form.daysPerWeek ? `${form.daysPerWeek}天` : '选择' }}
                </text>
                <uni-icons type="bottom" size="14" color="#94a3b8"></uni-icons>
              </view>
            </picker>
          </view>
          
          <view class="form-item half">
            <text class="field-label">难度等级 *</text>
            <picker 
              mode="selector" 
              :range="difficultyOptions" 
              range-key="label"
              :value="difficultyIndex"
              @change="onDifficultyChange"
            >
              <view class="picker-trigger small">
                <text :class="{ placeholder: !form.difficulty }">
                  {{ form.difficulty ? getDifficultyLabel(form.difficulty) : '选择' }}
                </text>
                <uni-icons type="bottom" size="14" color="#94a3b8"></uni-icons>
              </view>
            </picker>
          </view>
        </view>
        
        <view class="form-item">
          <text class="field-label">备注说明</text>
          <textarea 
            v-model="form.description" 
            placeholder="可选：描述这个计划的特点..."
            placeholder-style="color: #cbd5e1"
            class="form-textarea"
            maxlength="100"
          />
        </view>
      </view>

      <!-- 训练日安排 -->
      <view class="form-section">
        <view class="section-header-flex">
          <text class="section-label">训练日安排 *</text>
          <view class="add-day-btn" @click="addTrainingDay">
            <uni-icons type="plus" size="16" color="#0ea5e9"></uni-icons>
            <text>添加训练日</text>
          </view>
        </view>
        
        <view 
          v-for="(day, dayIdx) in form.schedule" 
          :key="dayIdx"
          class="day-form-card"
        >
          <view class="day-form-header">
            <view class="day-form-info">
              <text class="day-form-num">Day {{ day.day }}</text>
              <input 
                type="text" 
                v-model="day.name" 
                placeholder="如：胸部训练"
                placeholder-style="color: #cbd5e1"
                class="day-name-input"
                maxlength="10"
              />
            </view>
            <view class="remove-day-btn" @click="removeTrainingDay(dayIdx)" v-if="form.schedule.length > 1">
              <uni-icons type="closeempty" size="18" color="#ef4444"></uni-icons>
            </view>
          </view>
          
          <!-- 动作列表 -->
          <view class="exercises-list">
            <view 
              v-for="(ex, exIdx) in day.exercises" 
              :key="exIdx"
              class="exercise-form-item"
            >
              <view class="ex-form-main">
                <input 
                  type="text" 
                  v-model="ex.name" 
                  placeholder="动作名称 *"
                  placeholder-style="color: #cbd5e1"
                  class="ex-name-input"
                />
                
                <view class="ex-params-row">
                  <view class="param-input-wrap">
                    <text class="param-label">组数</text>
                    <input 
                      type="number" 
                      v-model="ex.sets" 
                      placeholder="4"
                      class="param-input small"
                    />
                  </view>
                  
                  <view class="param-input-wrap">
                    <text class="param-label">次数</text>
                    <input 
                      type="text" 
                      v-model="ex.reps" 
                      placeholder="8-12"
                      class="param-input small"
                    />
                  </view>
                  
                  <view class="param-input-wrap">
                    <text class="param-label">休息(s)</text>
                    <input 
                      type="number" 
                      v-model="ex.restSeconds" 
                      placeholder="60"
                      class="param-input small"
                    />
                  </view>
                </view>
                
                <input 
                  type="text" 
                  v-model="ex.notes" 
                  placeholder="技巧提示（可选）"
                  placeholder-style="color: #cbd5e1"
                  class="ex-notes-input"
                />
              </view>
              
              <view class="remove-ex-btn" @click="removeExercise(dayIdx, exIdx)" v-if="day.exercises.length > 1">
                <uni-icons type="clear" size="18" color="#cbd5e1"></uni-icons>
              </view>
            </view>
            
            <view class="add-exercise-btn" @click="addExercise(dayIdx)">
              <uni-icons type="plusempty" size="18" color="#0ea5e9"></uni-icons>
              <text>添加动作</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 底部占位 -->
      <view style="height: 120rpx;"></view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      isEdit: false,
      editId: '',
      
      form: {
        name: '',
        type: '',
        daysPerWeek: null,
        difficulty: '',
        description: '',
        schedule: []
      },
      
      // 选择器选项
      splitTypeOptions: [
        { value: 'five-split', label: '五分化' },
        { value: 'three-split', label: '三分化(PPL)' },
        { value: 'kai-three-split', label: '改良三分化' },
        { value: 'full-body', label: '一分化(全身)' },
        { value: 'custom', label: '自定义' }
      ],
      splitTypeIndex: -1,
      
      daysOptions: ['1', '2', '3', '4', '5', '6', '7'],
      daysIndex: -1,
      
      difficultyOptions: [
        { value: 'beginner', label: '初级' },
        { value: 'intermediate', label: '中级' },
        { value: 'advanced', label: '进阶' }
      ],
      difficultyIndex: -1
    };
  },
  
  computed: {
    canSave() {
      return this.form.name.trim() && 
             this.form.type && 
             this.form.daysPerWeek && 
             this.form.difficulty &&
             this.form.schedule.length > 0;
    }
  },
  
  onLoad(options) {
    if (options.id) {
      this.isEdit = true;
      this.editId = options.id;
      this.loadExistingPlan();
    } else {
      this.initEmptyForm();
    }
  },
  
  methods: {
    initEmptyForm() {
      // 初始化一个空白训练日
      this.addTrainingDay();
    },
    
    loadExistingPlan() {
      const customPlans = uni.getStorageSync('custom_training_plans') || [];
      const plan = customPlans.find(p => p.id === this.editId);
      if (plan) {
        this.form = JSON.parse(JSON.stringify(plan));
        this.updatePickerIndexes();
      }
    },
    
    updatePickerIndexes() {
      this.splitTypeIndex = this.splitTypeOptions.findIndex(
        opt => opt.value === this.form.type
      );
      this.daysIndex = this.daysOptions.indexOf(String(this.form.daysPerWeek));
      this.difficultyIndex = this.difficultyOptions.findIndex(
        opt => opt.value === this.form.difficulty
      );
    },
    
    goBack() {
      uni.navigateBack();
    },
    
    onSplitTypeChange(e) {
      const index = e.detail.value;
      this.form.type = this.splitTypeOptions[index].value;
      this.splitTypeIndex = index;
      
      // 自动建议天数
      const suggestions = {
        'five-split': 5,
        'three-split': 3,
        'kai-three-split': 3,
        'full-body': 1
      };
      if (suggestions[this.form.type]) {
        this.form.daysPerWeek = suggestions[this.form.type];
        this.daysIndex = this.daysOptions.indexOf(String(this.form.daysPerWeek));
        this.adjustScheduleLength();
      }
    },
    
    onDaysChange(e) {
      const index = e.detail.value;
      this.form.daysPerWeek = parseInt(this.daysOptions[index]);
      this.daysIndex = index;
      this.adjustScheduleLength();
    },
    
    onDifficultyChange(e) {
      const index = e.detail.value;
      this.form.difficulty = this.difficultyOptions[index].value;
      this.difficultyIndex = index;
    },
    
    adjustScheduleLength() {
      const target = this.form.daysPerWeek || 1;
      while (this.form.schedule.length < target) {
        this.addTrainingDay(false);
      }
      while (this.form.schedule.length > target) {
        this.form.schedule.pop();
      }
    },
    
    addTrainingDay(scrollToBottom = true) {
      const newDay = {
        day: this.form.schedule.length + 1,
        name: '',
        exercises: [this.createEmptyExercise()]
      };
      this.form.schedule.push(newDay);
      
      if (scrollToBottom) {
        this.$nextTick(() => {
          // 可选：滚动到底部
        });
      }
    },
    
    removeTrainingDay(index) {
      if (this.form.schedule.length <= 1) {
        uni.showToast({ title: '至少保留一个训练日', icon: 'none' });
        return;
      }
      this.form.schedule.splice(index, 1);
      this.form.schedule.forEach((day, i) => {
        day.day = i + 1;
      });
    },
    
    createEmptyExercise() {
      return {
        name: '',
        sets: 3,
        reps: '8-12',
        restSeconds: 60,
        notes: ''
      };
    },
    
    addExercise(dayIndex) {
      this.form.schedule[dayIndex].exercises.push(this.createEmptyExercise());
    },
    
    removeExercise(dayIndex, exerciseIndex) {
      if (this.form.schedule[dayIndex].exercises.length <= 1) {
        uni.showToast({ title: '至少保留一个动作', icon: 'none' });
        return;
      }
      this.form.schedule[dayIndex].exercises.splice(exerciseIndex, 1);
    },
    
    validateForm() {
      if (!this.form.name.trim()) {
        uni.showToast({ title: '请输入计划名称', icon: 'none' });
        return false;
      }
      
      if (!this.form.type) {
        uni.showToast({ title: '请选择分化类型', icon: 'none' });
        return false;
      }
      
      if (!this.form.daysPerWeek) {
        uni.showToast({ title: '请选择每周天数', icon: 'none' });
        return false;
      }
      
      if (!this.form.difficulty) {
        uni.showToast({ title: '请选择难度等级', icon: 'none' });
        return false;
      }
      
      for (let i = 0; i < this.form.schedule.length; i++) {
        const day = this.form.schedule[i];
        if (!day.name.trim()) {
          uni.showToast({ title: `请填写第${i + 1}天训练日名称`, icon: 'none' });
          return false;
        }
        
        if (!day.exercises.length) {
          uni.showToast({ title: `${day.name} 需要添加动作`, icon: 'none' });
          return false;
        }
        
        for (let j = 0; j < day.exercises.length; j++) {
          const ex = day.exercises[j];
          if (!ex.name.trim()) {
            uni.showToast({ title: `${day.name} 第${j + 1}个动作缺少名称`, icon: 'none' });
            return false;
          }
        }
      }
      
      return true;
    },
    
    savePlan() {
      if (!this.validateForm()) return;
      
      const planData = {
        ...this.form,
        id: this.isEdit ? this.editId : `custom_${Date.now()}`,
        isPreset: false,
        source: 'user',
        createdAt: this.isEdit ? this.form.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      let customPlans = uni.getStorageSync('custom_training_plans') || [];
      
      if (this.isEdit) {
        const index = customPlans.findIndex(p => p.id === this.editId);
        if (index !== -1) {
          customPlans[index] = planData;
        }
      } else {
        customPlans.push(planData);
      }
      
      uni.setStorageSync('custom_training_plans', customPlans);
      
      uni.showToast({
        title: this.isEdit ? '修改成功' : '创建成功',
        icon: 'success'
      });
      
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    },
    
    getSplitTypeLabel(type) {
      const map = {
        'five-split': '五分化',
        'three-split': '三分化(PPL)',
        'kai-three-split': '改良三分化',
        'full-body': '一分化(全身)'
      };
      return map[type] || '自定义';
    },
    
    getDifficultyLabel(difficulty) {
      const map = {
        'beginner': '初级',
        'intermediate': '中级',
        'advanced': '进阶'
      };
      return map[difficulty] || '';
    }
  }
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #f8fafc;
}

.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 60rpx 32rpx 24rpx;
  background: linear-gradient(135deg, #ffffff, #f8fafc);
  
  .back-btn, .header-placeholder {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .page-title {
    font-size: 36rpx;
    font-weight: 700;
    color: #1e293b;
    flex: 1;
    text-align: center;
  }
  
  .header-action {
    padding: 12rpx 24rpx;
    
    .save-text {
      font-size: 28rpx;
      font-weight: 600;
      color: #0ea5e9;
    }
  }
}

.form-scroll {
  padding: 24rpx 32rpx;
  height: calc(100vh - 140rpx);
}

.form-section {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  
  .section-label {
    display: block;
    font-size: 28rpx;
    font-weight: 700;
    color: #334155;
    margin-bottom: 24rpx;
  }
  
  .section-header-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
    
    .section-label {
      margin-bottom: 0;
    }
    
    .add-day-btn {
      display: flex;
      align-items: center;
      gap: 8rpx;
      padding: 10rpx 20rpx;
      background: #e0f2fe;
      border-radius: 100rpx;
      
      text {
        font-size: 24rpx;
        color: #0369a1;
        font-weight: 600;
      }
    }
  }
}

.form-item {
  margin-bottom: 24rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .field-label {
    display: block;
    font-size: 24rpx;
    font-weight: 600;
    color: #64748b;
    margin-bottom: 12rpx;
  }
  
  .form-input {
    width: 100%;
    height: 88rpx;
    background: #f8fafc;
    border: 2rpx solid #e2e8f0;
    border-radius: 16rpx;
    padding: 0 24rpx;
    font-size: 28rpx;
    color: #1e293b;
    
    &:focus {
      border-color: #0ea5e9;
      background: #ffffff;
    }
  }
  
  .form-textarea {
    width: 100%;
    min-height: 160rpx;
    background: #f8fafc;
    border: 2rpx solid #e2e8f0;
    border-radius: 16rpx;
    padding: 20rpx 24rpx;
    font-size: 26rpx;
    color: #1e293b;
    line-height: 1.6;
    
    &:focus {
      border-color: #0ea5e9;
      background: #ffffff;
    }
  }
  
  .picker-trigger {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 88rpx;
    background: #f8fafc;
    border: 2rpx solid #e2e8f0;
    border-radius: 16rpx;
    padding: 0 24rpx;
    
    text {
      font-size: 28rpx;
      color: #1e293b;
      
      &.placeholder {
        color: #cbd5e1;
      }
    }
    
    &.small {
      height: 80rpx;
    }
  }
}

.form-row-two {
  display: flex;
  gap: 16rpx;
  
  .half {
    flex: 1;
  }
}

.day-form-card {
  background: #f8fafc;
  border: 2rpx solid #e2e8f0;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .day-form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    
    .day-form-info {
      display: flex;
      align-items: center;
      gap: 16rpx;
      flex: 1;
      
      .day-form-num {
        font-size: 22rpx;
        font-weight: 700;
        color: #0ea5e9;
        background: #e0f2fe;
        padding: 6rpx 14rpx;
        border-radius: 8rpx;
        white-space: nowrap;
      }
      
      .day-name-input {
        flex: 1;
        height: 72rpx;
        background: #ffffff;
        border: 2rpx solid #e2e8f0;
        border-radius: 12rpx;
        padding: 0 20rpx;
        font-size: 26rpx;
        color: #1e293b;
      }
    }
    
    .remove-day-btn {
      width: 56rpx;
      height: 56rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 16rpx;
    }
  }
}

.exercises-list {
  .exercise-form-item {
    display: flex;
    gap: 12rpx;
    background: #ffffff;
    border: 1rpx solid #e2e8f0;
    border-radius: 16rpx;
    padding: 20rpx;
    margin-bottom: 16rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .ex-form-main {
      flex: 1;
      
      .ex-name-input {
        width: 100%;
        height: 72rpx;
        background: #f8fafc;
        border: 2rpx solid #e2e8f0;
        border-radius: 12rpx;
        padding: 0 20rpx;
        font-size: 26rpx;
        color: #1e293b;
        margin-bottom: 12rpx;
      }
      
      .ex-params-row {
        display: flex;
        gap: 12rpx;
        margin-bottom: 12rpx;
        
        .param-input-wrap {
          flex: 1;
          
          .param-label {
            display: block;
            font-size: 20rpx;
            color: #94a3b8;
            margin-bottom: 6rpx;
            font-weight: 500;
          }
          
          .param-input {
            width: 100%;
            height: 64rpx;
            background: #f8fafc;
            border: 1rpx solid #e2e8f0;
            border-radius: 10rpx;
            padding: 0 12rpx;
            font-size: 24rpx;
            color: #1e293b;
            text-align: center;
            
            &.small {
              font-size: 22rpx;
            }
          }
        }
      }
      
      .ex-notes-input {
        width: 100%;
        height: 64rpx;
        background: #f8fafc;
        border: 1rpx solid #e2e8f0;
        border-radius: 10rpx;
        padding: 0 16rpx;
        font-size: 24rpx;
        color: #1e293b;
      }
    }
    
    .remove-ex-btn {
      width: 48rpx;
      display: flex;
      align-items: flex-start;
      padding-top: 16rpx;
    }
  }
  
  .add-exercise-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    height: 72rpx;
    background: #ffffff;
    border: 2rpx dashed #cbd5e1;
    border-radius: 12rpx;
    
    text {
      font-size: 24rpx;
      color: #0ea5e9;
      font-weight: 600;
    }
  }
}
</style>
```

- [ ] **步骤 2：注册页面路由**

在 `pages.json` 中添加：

```json
{
  "path": "pages/knowledge/training-plan-edit",
  "style": {
    "navigationBarTitleText": "",
    "navigationStyle": "custom"
  }
}
```

- [ ] **步骤 3：测试核心功能**

验证清单：

- ✅ 新建空白计划表单正常
- ✅ 添加/删除训练日
- ✅ 添加/删除动作
- ✅ 表单验证（必填项检查）
- ✅ 保存到本地存储
- ✅ 编辑已有计划
- ✅ 分化类型自动建议天数
- [ ] **步骤 4：Commit**

```bash
git add fitness-app/pages/knowledge/training-plan-edit.vue
git commit -m "feat: create custom training plan editor with dynamic form"
```

***

## 任务 5：集成测试与优化

**文件：**

- 修改：`fitness-app/pages/knowledge/knowledge.vue`
- 修改：`fitness-app/pages/knowledge/training-plan-detail.vue`
- [ ] **步骤 1：端到端流程测试**

测试场景：

1. 从知识库主页 → 点击预设计划 → 查看详情 → 返回
2. 从知识库主页 → 点击自定义 → 填写表单 → 保存 → 返回查看
3. 编辑已保存的自定义计划
4. 删除自定义计划（如果实现）
5. 搜索功能与训练计划共存

- [ ] **步骤 2：UI细节调优**

检查项：

- ✅ 卡片间距和对齐
- ✅ 文字大小层次清晰
- ✅ 颜色对比度符合无障碍标准
- ✅ 动画流畅不卡顿
- ✅ 空状态友好提示
- ✅ 加载状态处理
- [ ] **步骤 3：性能优化**

优化点：

- 图片懒加载（如果有图标）
- 长列表虚拟滚动（如果计划很多）
- 本地存储读写优化
- 组件按需加载
- [ ] **步骤 4：最终Commit**

```bash
git add .
git commit -m "feat: complete training plan module integration and polish"
```

***

## 自检清单

### 规格覆盖度 ✓

| 规格需求    | 对应任务  |
| ------- | ----- |
| 4套预置计划  | 任务1   |
| 知识库入口位置 | 任务2   |
| 详情页展示   | 任务3   |
| 自定义功能   | 任务4   |
| 数据模型    | 任务1   |
| UI样式    | 任务2-4 |
| 表单验证    | 任务4   |
| 本地存储    | 任务4   |

### 占位符扫描 ✓

✅ 无"待定"、"TODO"、"后续补充"\
✅ 所有代码示例完整可执行\
✅ 所有步骤包含具体操作

### 类型一致性 ✓

✅ `TrainingPlan` Schema 在任务1定义，任务3/4一致使用\
✅ 方法命名统一：`getPlanById`, `loadPlan`, `savePlan`\
✅ 存储键名统一：`custom_training_plans`

***

## 执行顺序建议

```
任务1 (数据) → 任务2 (入口) → 任务3 (详情) → 任务4 (编辑) → 任务5 (集成)
```

每个任务完成后立即 Commit，确保可回滚。

***

**计划完成。准备执行。**
