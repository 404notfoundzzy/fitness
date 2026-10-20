/**
 * 预置训练计划数据
 * 包含：五分化、三分化、凯圣王三分化、一分化
 * 
 * 数据结构说明：
 * - 每个计划包含完整周安排（schedule数组）
 * - 每天包含多个动作（exercises数组）
 * - 每个动作包含：名称、组数、次数、休息时间、技巧提示
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
    planType: 1,
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
    planType: 1,
    source: "system",
    schedule: [
      {
        day: 1,
        name: "推类训练",
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
        name: "拉类训练",
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
        name: "腿部训练",
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
    planType: 1,
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
    planType: 1,
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
 * @returns {Array} 预置训练计划数组
 */
export const getPresetPlans = () => {
  return trainingPlans;
};

/**
 * 根据ID获取单个计划
 * @param {string} planId 计划ID
 * @returns {Object|null} 训练计划对象或null
 */
export const getPlanById = (planId) => {
  return trainingPlans.find(plan => plan.id === planId) || null;
};

/**
 * 根据类型获取计划
 * @param {string} type 分化类型
 * @returns {Array} 匹配的计划数组
 */
export const getPlansByType = (type) => {
  return trainingPlans.filter(plan => plan.type === type);
};

/**
 * 获取分化类型标签
 * @param {string} type 分化类型标识
 * @returns {string} 中文标签
 */
export const getSplitTypeLabel = (type) => {
  const labels = {
    'five-split': '五分化',
    'three-split': '三分化',
    'kai-three-split': '改良三分化',
    'full-body': '一分化'
  };
  return labels[type] || '自定义';
};

/**
 * 获取难度等级标签
 * @param {string} difficulty 难度标识
 * @returns {string} 中文标签
 */
export const getDifficultyLabel = (difficulty) => {
  const labels = {
    'beginner': '初级',
    'intermediate': '中级',
    'advanced': '进阶'
  };
  return labels[difficulty] || '未知';
};
