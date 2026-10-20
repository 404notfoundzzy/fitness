# 训练计划页视觉增强 — 设计规格

> 日期：2026-05-02
> 目标：将详情页和列表页视觉效果与效果图对齐 + 集成新组件

---

## 一、问题分析

### 当前 vs 效果图对比

| 元素 | 当前实现 | 效果图 | 差距 |
|------|---------|--------|------|
| DayCard 图标 | 数字圆圈 (DAY 1-5) | 彩色渐变数字圆圈 | 样式需增强 |
| DayCard 进度环 | Canvas 版 ProgressRing | 简洁圆形进度 | 已有 CSS 版本未应用 |
| 详情页背景 | 基础渐变 | 浅色 + 光晕 | 缺少 `.bg-glow` |
| 列表页卡片 | plan-card | TrainingCard 样式 | 未集成 Store |
| Lottie 文件 | 无 | - | 需创建 |

---

## 二、改造范围

### 模块 A：DayCard 视觉增强

**文件：** `components/DayCard.vue`

**改造点：**

1. **day-badge 增强**
   - 尺寸：84rpx → 88rpx
   - 添加内部光泽效果（`::before` 伪元素）
   - 完成状态显示 ✓ 徽章
   - 保持数字样式（DAY + 数字）

2. **添加部位图标**
   - 在 day-badge 下方或右侧添加小尺寸 SVG 图标
   - 图标来源：`/static/icons/{chest,back,leg,shoulder,arm}.svg`
   - 根据 dayNumber 映射到对应部位

3. **进度环升级**
   - 使用新的 CSS 版本 ProgressRing（已重写完成）
   - 移除旧的 Canvas 依赖

**部位映射表：**
```
Day 1 → chest.svg (胸部)
Day 2 → back.svg (背部)
Day 3 → leg.svg (腿部)
Day 4 → shoulder.svg (肩部)
Day 5 → arm.svg (手臂)
```

---

### 模块 B：详情页背景系统

**文件：** `pages/knowledge/training-plan-detail.vue`

**改造点：**

1. **确认 `.bg-glow` 存在并可见**
   ```html
   <view class="bg-glow"></view>
   ```
   
2. **样式确认**
   ```css
   .bg-glow {
     position: absolute;
     width: 600rpx;
     height: 600rpx;
     background: radial-gradient(circle, rgba(108,99,255,0.22), transparent 70%);
     top: -200rpx;
     right: -200rpx;
     pointer-events: none;
     z-index: 0;
   }
   ```

3. **Hero 区域 visual-bg 增强**
   - 确认渐变色正确
   - 添加微妙的动画效果

---

### 模块 C：列表页 Store 集成

**文件：** `pages/knowledge/training-plan-list.vue`

**改造点：**

1. **导入 Pinia Store 和 TrainingCard**
   ```js
   import { useTrainingStore } from '@/stores/training'
   import TrainingCard from '@/components/TrainingCard.vue'
   ```

2. **注册组件**
   ```js
   components: { TrainingCard }
   ```

3. **初始化 Store**
   ```js
   const store = useTrainingStore()
   ```

4. **在模板中使用 TrainingCard**
   ```html
   <TrainingCard
     v-for="(item, index) in store.list"
     :key="item.id"
     :item="item"
     :index="index"
   />
   ```

5. **保留原有 plan-card 作为备选展示区域**

---

### 模块 D：Lottie 简化版文件

**目录：** `static/lottie/`

**文件清单：**

1. **chest.json** - 胸部图标呼吸动画
   - 简单的 scale(1→1.1→1) 循环
   - 时长：2s
   - loop: true

2. **fire.json** - CTA 火焰闪烁
   - opacity(0.7→1→0.7) + 轻微位移
   - 时长：1s
   - loop: true

3. **progress.json** - 进度环旋转
   - 360° 旋转
   - 时长：3s
   - loop: true

**JSON 结构示例（简化版）：**
```json
{
  "v": "5.7.4",
  "fr": 30,
  "ip": 0,
  "op": 60,
  "w": 80,
  "h": 80,
  "nm": "icon-breathe",
  "layers": [...]
}
```

---

### 模块 E：页面级过渡动画

**文件：** `pages.json` 或全局样式

**改造点：**

1. **配置页面转场动画**
   ```json
   {
     "path": "pages/knowledge/training-plan-detail",
     "style": {
       "app-plus": {
         "titleNView": false,
         "animationType": "slide-in-right",
         "animationDuration": 300
       },
       "h5": {}
     }
   }
   ```

2. **或使用 CSS 全局过渡**
   ```css
   /* 页面进入动画 */
   page-enter-active {
     transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
   }
   ```

---

## 三、依赖关系

```
A (DayCard 增强) ← 独立
B (详情页背景)  ← 独立
C (列表页集成)  ← 依赖 Store（已完成）
D (Lottie 文件) ← 独立
E (页面过渡)    ← 独立
```

所有模块可并行执行。

---

## 四、验收标准

1. ✅ DayCard 显示部位图标（非纯数字）
2. ✅ 详情页顶部紫色光晕可见
3. ✅ 列表页使用 TrainingCard + Pinia Store 数据
4. ✅ Lottie JSON 文件可正常加载
5. ✅ 页面切换有过渡动画效果
6. ✅ 全局诊断零错误

---

## 五、风险与缓解

| 风险 | 概率 | 缓解措施 |
|------|------|---------|
| Lottie JSON 格式错误 | 中 | 使用极简结构 + 测试验证 |
| DayCard 图标映射混乱 | 低 | 明确的 dayNumber→部位映射表 |
| Store 集成影响现有功能 | 低 | 保留原有代码作为 fallback |
