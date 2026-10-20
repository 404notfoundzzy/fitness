# 训练计划功能设计规格

**日期**: 2026-04-24
**状态**: 已批准
**版本**: v1.0

---

## 1. 功能概述

在健身知识库中新增**训练计划模块**，提供预置的分化训练计划模板和自定义计划创建功能。

### 1.1 核心目标

- 为用户提供科学的训练计划参考
- 支持主流分化训练模式（五分化、三分化等）
- 允许用户根据自身情况定制个性化计划
- 与现有知识库UI风格保持一致

### 1.2 目标用户

- 初学者：需要基础的全身训练计划
- 中级训练者：适合三分化等平衡方案
- 进阶训练者：需要五分化等针对性强化

---

## 2. 功能范围

### 2.1 包含功能

✅ **预置训练计划展示**
   - 经典五分化（5天/周）
   - 传统三分化（推/拉/腿）
   - 凯圣王谭成义三分化（改良版PPL）
   - 全身训练一分化（1天/周）

✅ **计划详情查看**
   - 完整周计划展示
   - 每日训练安排
   - 动作详细参数（组数/次数/休息时间/技巧提示）

✅ **自定义计划管理**
   - 从零创建新计划
   - 基于模板修改
   - 添加/删除训练日
   - 配置动作参数

✅ **搜索与筛选**
   - 按难度等级筛选
   - 按分化类型筛选
   - 关键词搜索

### 2.2 不包含功能

❌ 训练日志记录（已有独立运动记录功能）
❌ 计划进度追踪（后续迭代）
❌ AI智能推荐（后续迭代）
❌ 社交分享（后续迭代）

---

## 3. UI/UX 设计

### 3.1 入口位置

位于健身知识库页面，**能量计算器卡片上方**。

```
知识库页面层级结构：
├── 标题区域
├── 搜索框
├── 📋 训练计划模块（新增）← 本功能
│   ├── 标题栏："训练计划" + "查看全部"
│   └── 横向滚动卡片列表
├── 🔥 能量计算器（原有）
└── 分类网格（原有）
```

### 3.2 列表视图

#### 卡片组件样式

```scss
.plan-card {
  display: flex;
  flex-direction: column;
  min-width: 280rpx;
  padding: 28rpx;
  background: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  
  // 顶部标签
  .plan-badge {
    // 分化类型标签
    font-size: 20rpx;
    color: #0ea5e9;
    background: #e0f2fe;
    padding: 6rpx 16rpx;
    border-radius: 100rpx;
    align-self: flex-start;
  }
  
  // 计划名称
  .plan-name {
    font-size: 32rpx;
    font-weight: 700;
    color: #1e293b;
    margin-top: 16rpx;
  }
  
  // 元信息行
  .plan-meta {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-top: 12rpx;
    
    text {
      font-size: 22rpx;
      color: #64748b;
    }
  }
  
  // 描述文字
  .plan-desc {
    font-size: 24rpx;
    color: #94a3b8;
    margin-top: 12rpx;
    line-height: 1.4;
  }
}
```

#### 横向滚动容器

```html
<scroll-view scroll-x class="plan-scroll">
  <view class="plan-list">
    <view 
      v-for="plan in presetPlans" 
      :key="plan.id"
      class="card plan-card"
      @click="openPlanDetail(plan)"
    >
      <!-- 卡片内容 -->
    </view>
    
    <!-- 自定义添加按钮 -->
    <view class="card plan-card add-card" @click="createCustomPlan">
      <uni-icons type="plus" size="40" color="#cbd5e1"></uni-icons>
      <text>自定义计划</text>
    </view>
  </view>
</scroll-view>
```

### 3.3 详情页设计

#### 页面结构

```
┌─────────────────────────────────────┐
│ 导航栏                              │
│ ← 返回        [计划名称]           │
├─────────────────────────────────────┤
│ 信息卡片                            │
│ ├ 图标 + 天数 + 难度标签            │
│ ├ 适用人群描述                      │
│ └ 标签列表（增肌/力量/...）         │
├─────────────────────────────────────┤
│ 训练日程（可折叠）                  │
│                                     │
│ ▼ Day 1 - [训练部位名称]          │
│ ┌─────────────────────────────┐    │
│ │ 动作名称                     │    │
│ │ 组数 × 次数 | 休息XX秒     │    │
│ │ 💡 技巧提示（可选）         │    │
│ ├─────────────────────────────┤    │
│ │ 下一个动作...               │    │
│ └─────────────────────────────┘    │
│                                     │
│ ▶ Day 2 - [训练部位名称] (折叠)    │
│ ...                                │
├─────────────────────────────────────┤
│ 底部操作栏                          │
│ [✏️ 编辑修改]  [📋 使用此计划]     │
└─────────────────────────────────────┘
```

#### 动作项组件

```scss
.exercise-item {
  padding: 24rpx;
  background: #f8fafc;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  
  .exercise-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .exercise-name {
      font-size: 28rpx;
      font-weight: 600;
      color: #334155;
    }
  }
  
  .exercise-params {
    display: flex;
    gap: 20rpx;
    margin-top: 12rpx;
    
    .param-item {
      font-size: 22rpx;
      color: #64748b;
      
      .param-value {
        color: #0ea5e9;
        font-weight: 600;
      }
    }
  }
  
  .exercise-tips {
    margin-top: 12rpx;
    padding: 16rpx;
    background: #fffbeb;
    border-radius: 12rpx;
    border-left: 4rpx solid #fbbf24;
    
    text {
      font-size: 22rpx;
      color: #92400e;
    }
  }
}
```

### 3.4 自定义计划表单

#### 表单字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| planName | 文本输入 | ✅ | 计划名称（最多20字） |
| splitType | 选择器 | ✅ | 分化类型 |
| daysPerWeek | 数字选择 | ✅ | 每周训练天数（1-7） |
| difficulty | 选择器 | ✅ | 难度等级 |
| description | 多行文本 | ❌ | 备注说明 |
| schedule | 动态数组 | ✅ | 训练日安排 |

#### 训练日结构

```javascript
{
  day: 1,
  name: "胸部训练",
  exercises: [
    {
      name: "平板杠铃卧推",       // 动作名称
      sets: 4,                     // 组数
      reps: "8-12",                // 次数范围
      restSeconds: 90,             // 休息时间（秒）
      notes: "控制下放速度"        // 技巧提示（可选）
    }
  ]
}
```

#### 表单交互流程

1. **基本信息填写**
   - 用户输入计划名称
   - 选择分化类型（自动建议天数）
   - 设置难度等级

2. **训练日配置**
   - 默认生成对应数量的空白训练日
   - 可添加/删除训练日
   - 每个训练日可命名（如"胸部训练"）

3. **动作配置**
   - 点击"添加动作"弹出选择器
   - 可从现有动作库选择或手动输入
   - 配置组数、次数、休息时间
   - 可选填写技巧提示

4. **保存与预览**
   - 表单验证（必填项检查）
   - 保存到本地存储
   - 跳转到详情页预览

---

## 4. 数据模型

### 4.1 训练计划 Schema

```javascript
const trainingPlanSchema = {
  // 基础信息
  id: String,                    // 唯一标识（预设: "split_xxx", 自定义: "custom_xxx"）
  name: String,                  // 计划名称
  type: String,                  // 分化类型: five-split/three-split/kai-three-split/full-body/custom
  description: String,           // 计划描述
  daysPerWeek: Number,           // 每周训练天数
  difficulty: String,            // 难度: beginner/intermediate/advanced
  targetAudience: String,        // 适用人群
  tags: Array<String>,           // 标签
  
  // 训练安排
  schedule: [
    {
      day: Number,               // 第几天（1-7）
      name: String,              // 训练日名称（如"胸部训练"）
      focus: String,              // 重点肌群
      exercises: [
        {
          name: String,          // 动作名称
          sets: Number,          // 组数
          reps: String,          // 次数（支持范围如"8-12"）
          restSeconds: Number,   // 休息时间（秒）
          notes: String          // 技巧提示（可选）
        }
      ]
    }
  ],
  
  // 元数据
  isPreset: Boolean,             // 是否为预设计划
  createdAt: String,             // 创建时间
  updatedAt: String,             // 更新时间
  source: String                 // 来源: system/user
};
```

### 4.2 预置数据定义

#### 经典五分化

```javascript
const fiveDaySplit = {
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
};
```

#### 传统三分化（PPL）

```javascript
const threeDaySplit = {
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
};
```

#### 凯圣王谭成义三分化

```javascript
const kaiThreeSplit = {
  id: "preset_kai_three_split",
  name: "凯圣王谭成义三分化",
  type: "kai-three-split",
  description: "改良版PPL分化，优化了肌群搭配和训练容量分配，兼顾力量与肌肥大，适合追求全面发展的训练者。",
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
};
```

#### 全身训练一分化

```javascript
const fullBodySplit = {
  id: "preset_full_body",
  name: "全身训练（一分化）",
  type: "full-body",
  description: "每次训练覆盖全身主要肌群，适合初学者建立基础，或时间有限的训练者。每周可进行2-3次。",
  daysPerWeek: 1,
  difficulty: "beginner",
  targetAudience: "健身新手或时间有限者，建议每周2-3次",
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
};
```

---

## 5. 技术实现要点

### 5.1 文件结构

```
fitness-app/
├── pages/knowledge/
│   ├── knowledge.vue              # 知识库主页（修改）
│   ├── training-plan-detail.vue   # 计划详情页（新增）
│   ├── training-plan-edit.vue     # 计划编辑页（新增）
│   └── calorie-guide.vue
│
├── data/
│   └── training-plans.js          # 预置计划数据（新增）
│
└── utils/
    └── storage.js                 # 本地存储工具（可能需扩展）
```

### 5.2 数据存储策略

- **预设计划**：静态数据文件（`training-plans.js`），打包时内置
- **自定义计划**：使用 `uni.setStorageSync` 存储到本地
- **存储键名规范**：
  - 预设计划收藏：`favorite_plans`
  - 自定义计划列表：`custom_training_plans`

### 5.3 关键技术点

#### 5.3.1 横向滚动实现

```vue
<scroll-view 
  scroll-x 
  class="plan-scroll" 
  :show-scrollbar="false"
>
  <view class="plan-list-horizontal">
    <!-- 计划卡片 -->
  </view>
</scroll-view>

<style lang="scss">
.plan-scroll {
  white-space: nowrap;
  margin: 0 -40rpx;  // 抵消页面padding
  
  .plan-list-horizontal {
    display: inline-flex;
    gap: 24rpx;
    padding: 0 40rpx;
  }
}
</style>
```

#### 5.3.2 动态表单处理

自定义计划表单需要处理动态数组：

```javascript
data() {
  return {
    form: {
      name: '',
      type: 'five-split',
      daysPerWeek: 5,
      difficulty: 'intermediate',
      description: '',
      schedule: []  // 动态训练日数组
    }
  }
},

methods: {
  addTrainingDay() {
    this.form.schedule.push({
      day: this.form.schedule.length + 1,
      name: '',
      exercises: []
    });
  },
  
  removeTrainingDay(index) {
    this.form.schedule.splice(index, 1);
    // 重新编号
    this.form.schedule.forEach((day, i) => {
      day.day = i + 1;
    });
  },
  
  addExercise(dayIndex) {
    this.form.schedule[dayIndex].exercises.push({
      name: '',
      sets: 3,
      reps: '8-12',
      restSeconds: 60,
      notes: ''
    });
  }
}
```

#### 5.3.3 数据验证

```javascript
validatePlan() {
  const { name, schedule } = this.form;
  
  if (!name.trim()) {
    uni.showToast({ title: '请输入计划名称', icon: 'none' });
    return false;
  }
  
  if (!schedule.length) {
    uni.showToast({ title: '请至少添加一个训练日', icon: 'none' });
    return false;
  }
  
  for (let day of schedule) {
    if (!day.name.trim()) {
      uni.showToast({ title: '请填写训练日名称', icon: 'none' });
      return false;
    }
    
    if (!day.exercises.length) {
      uni.showToast({ title: `${day.name} 需要添加动作`, icon: 'none' });
      return false;
    }
    
    for (let ex of day.exercises) {
      if (!ex.name.trim()) {
        uni.showToast({ title: '请填写动作名称', icon: 'none' });
        return false;
      }
    }
  }
  
  return true;
}
```

### 5.4 性能优化

- **图片懒加载**：计划卡片图标使用懒加载
- **虚拟滚动**：如果计划内容过长，考虑虚拟列表
- **本地缓存**：预设计划数据缓存到内存，避免重复读取
- **按需加载**：详情页数据按需加载，不在列表页加载完整schedule

---

## 6. 交互细节

### 6.1 手势操作

| 操作 | 触发区域 | 效果 |
|------|---------|------|
| 左滑 | 计划卡片 | 显示删除按钮（仅自定义计划） |
| 长按 | 计划名称 | 复制到剪贴板 |
| 双击 | 动作项 | 快速编辑 |

### 6.2 动画效果

- **卡片点击**：scale(0.95) → 正常，时长200ms
- **页面转场**：从右侧滑入，时长300ms
- **展开/折叠**：高度动画，时长250ms
- **添加按钮**：脉冲动画吸引注意

### 6.3 反馈机制

- **保存成功**：Toast提示 + 返回上一页
- **验证失败**：对应字段红色边框 + 错误提示
- **网络错误**（如有）：错误提示 + 重试按钮
- **空状态**：友好的空状态插画 + 引导文案

---

## 7. 边界情况处理

### 7.1 异常场景

| 场景 | 处理方式 |
|------|---------|
| 自定义计划名称重复 | 允许重复，系统自动加后缀 |
| 删除正在使用的计划 | 二次确认弹窗 |
| 存储空间不足 | 清理旧数据或提示用户 |
| 表单中途退出 | 自动保存草稿（可选） |
| 大量自定义计划 | 分页显示或搜索筛选 |

### 7.2 兼容性

- **平台兼容**：确保H5/App/小程序表现一致
- **屏幕适配**：支持不同屏幕尺寸（375px - 414px）
- **字体回退**：使用系统字体栈，确保各平台正常显示

---

## 8. 成功标准

### 8.1 功能完整性

- ✅ 4套预设计划完整可用
- ✅ 自定义计划创建流程顺畅
- ✅ 详情页信息展示清晰
- ✅ 搜索筛选功能正常

### 8.2 用户体验

- ✅ 操作流程符合直觉（≤3步完成核心任务）
- ✅ 加载响应时间 < 500ms
- ✅ 无明显UI卡顿或闪烁
- ✅ 错误提示友好明确

### 8.3 代码质量

- ✅ 组件复用性良好
- ✅ 代码注释清晰
- ✅ 符合项目现有编码规范
- ✅ 无明显性能瓶颈

---

## 9. 后续迭代规划（可选）

### v1.1 增强功能
- 训练日志集成（快速记录当日完成情况）
- 计划进度可视化
- 智能推荐（基于历史数据）

### v1.2 社交功能
- 计划分享到社区
- 下载他人分享的计划
- 评论和评分

### v1.3 智能化
- AI生成个性化计划
- 根据恢复状态动态调整
- 周期化进阶计划（4周/8周/12周）

---

## 附录A：术语表

| 术语 | 定义 |
|------|------|
| 分化训练 | 将身体不同部位分配到不同训练日的训练方法 |
| 五分化 | 每周5练，每天专注1-2个肌群 |
| 三分化(PPL) | 推/拉/腿三分法，每周循环 |
| 组数(Sets) | 连续完成某个动作的轮数 |
| 次数(Reps) | 一组内完成的动作次数 |
| 休息时间 | 组间休息时长 |
| 肌肥大 | 肌纤维增大的过程（增肌） |

---

## 附录B：参考资料

- 《力量训练基础》- Mark Rippetoe
- 《施瓦辛格健身全书》- Arnold Schwarzenegger
- NSCA-CPT 训练指南
- ExRx.net 运动数据库

---

**文档结束**

*本规格说明书经用户批准，可作为开发实施依据。*
