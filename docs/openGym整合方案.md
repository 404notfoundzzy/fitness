# openGym 整合完整方案 —— 健身小助手

> 版本：v2.4（完整蓝图；阶段 3 全部完成，阶段 4 训练台待建） ｜ 日期：2026-10-21 ｜ 状态：**方案 B 实施中**
> 上游项目：<https://github.com/DuarteSantos8/openGym>（AGPL-3.0，commit `e348fc1`）
> 专用分支：`feature/opengym-integration`（整合后的项目在此分支开发并直接打包）
> 本文档是整合工作的**唯一权威蓝图**：功能、数据、API、页面、步骤、备份、回滚全部在此登记；实施中每完成一项即在"进度看板"勾销。

---

## 一、目标与范围

### 1.1 整合目标

把 openGym 的**训练科学内核**移植进健身小助手，获得以下用户价值：

1. **动作库从 33 条扩充到 5600+ 条**，且每条带结构化肌肉/器械元数据
2. **训练计划带渐进规则**：线性/Greyskull LP/双倍/三倍/加时，每次训练给出"建议重量 + 为什么是这个数"
3. **引导式训练台**：预填上次重量、组级记录（正式/热身/递减/失败）、RIR/RPE、休息计时器、PR 即时提示
4. **肌肉疲劳/恢复/停训热力图**：人体图三模式，回答"该练什么、什么还在恢复、什么荒废了"
5. **1RM 估算与统计**：每动作 1RM 曲线、PR 时间线、周容量趋势
6. **数据互通**：导入 FitNotes/Strong/Hevy CSV；导出计划分享文件与全量 JSON

### 1.2 范围边界（明确不做）

| 不做 | 原因 |
|---|---|
| openGym 完整实例旁路部署 | 双账号/双数据孤岛；方案 B 已确认 |
| openGym 的 Passkey 登录、多设备同步合并 | 现有账号体系已满足；数据在 MySQL |
| openGym 动作动画/静图素材 | **版权仅限 openGym 使用**，一律不导入 |
| AI 教练、MCP server、推送通知 | 可选增值，后续单独评估 |
| 离线 PWA + Service Worker | uni-app 自身有本地缓存策略，后续评估 |

### 1.3 设计原则

1. **算法与 UI 框架解耦**：所有上游逻辑以 TS 纯函数落在 `fitness-app/utils/training/`，单测覆盖；Vue 页面只做渲染与交互
2. **数据留在 MySQL**：不引入上游的 JSON 文档同步体系
3. **上游测试即验收基线**：上游 `*.test.js` 逐条移植为 `*.test.ts`，算法行为必须逐用例一致
4. **单一数据源**：肌肉/器械/中文规则收敛 `muscles-data.mjs`，App 与工具脚本共用
5. **可回滚**：所有数据库变更先备份、有回滚脚本、向后兼容（新列可空）

---

## 二、总体架构

```
fitness-app (uni-app / Vue3 + Pinia)
├── utils/training/            纯逻辑层（TS，vitest）
│   ├── model.ts               数据模型与日期助手（替代上游 workout-model/format）
│   ├── muscles-data.mjs       单一数据源（肌肉/器械/中文规则）
│   ├── muscles.ts             肌肉映射与训练量
│   ├── muscles-zh.ts          中文肌肉名规范化
│   ├── onerm.ts               1RM 估算            ✅ 已移植
│   ├── effort.ts              努力度 RIR/RPE      ✅ 已移植
│   ├── progression.ts         渐进建议引擎        ✅ 已移植（策略主体完整）
│   ├── recovery.ts            疲劳/恢复模型       ⏳ 本轮
│   ├── history.ts             历史回读 adapter    ✅ 已移植（20 测试）
│   ├── import-csv.ts          FitNotes/Strong/Hevy 导入 ⏳ 后续
│   └── plan-share.ts          计划分享文件        ⏳ 后续
├── pages/record/workout/guided-training.vue   引导式训练台   ⏳ 阶段 4
├── components/MuscleMap.vue / RecoveryHeatmap.vue / RestTimer.vue  ⏳ 阶段 5
└── stores/training.js（扩展：草稿、进行中训练）

fitness-server (Spring Boot + MyBatis-Plus + MySQL)
├── entity/workout_exercise_detail   +set_type/rir/rpe/superset_group/per_side/is_pr
├── entity/training_plan_exercise    +target_sets/target_reps/rest_seconds/target_rir/progression_rule/progression_params
├── entity/exercise                  +body_part/equipment/primary_muscle/secondary_muscle/secondary_muscles/category_en/source/source_id  ✅
├── 新表 exercise_pr / plan_progression_state
└── 新 API：suggestion / recovery / pr / import / plan-share
```

---

## 三、功能设计详单（动作级）

### F1 动作库（已完成代码，待数据库执行）

| 动作 | 描述 |
|---|---|
| 浏览 | 列表按 `muscle_group` 中文分组；支持名称/别名搜索（服务端 LIKE）；`source` 可筛（system/opengym/user） |
| 详情 | 显示主肌肉、次要肌肉、器械、身体部位、难度、描述、专业建议；**媒体位预留**（后续自绘示意，不用上游动画） |
| 创建自定义 | 现有 `/api/exercises/custom` 不变，`source='user'`；可选填主/次要肌肉（规范 slug，前端肌肉选择器） |
| 结构化字段 | 回填脚本已生成（`sql/08`），匹配上的 24 条用上游权威数据，其余中文规则推导 |

### F2 训练计划增强（阶段 3+7）

| 动作 | 描述 |
|---|---|
| 计划结构 | 维持 计划→训练日→动作 三级；每个计划动作新增：目标组数、目标次数区间（如 8-12）、组间休息秒数、目标 RIR、渐进规则与参数 |
| 规则选择 | 每个动作可选：off / linear / greyskull / double / triple / time；计划级默认值；显示规则中文说明 |
| 解释文案 | 训练台与建议 API 返回"为什么是这个数"（上游 progression-copy 思路：如"上次全部达标 → 重量 +2.5kg"） |
| 轮换模式 | 后续可选：A/B/C 轮换（上游 queue 语义） |

### F3 组级训练记录（阶段 3）

`workout_exercise_detail` 扩展字段（见第四节）：

| 动作 | 描述 |
|---|---|
| 组类型 | 正式组/热身组/递减组/暂停休息/力竭组；热身组不计入容量统计与 1RM |
| RIR/RPE | 二选一记录（内部统一换算 RIR）；未记录为 null 而非 0 |
| 超级组 | `superset_group` 同号的动作连续记录，休息共享 |
| 单侧 | `per_side=1` 时记录左右两肢（sides JSON） |
| PR 标记 | `is_pr` 由后端在保存时按 1RM/最大次数/最大容量检测写入 |

### F4 引导式训练台（阶段 4，核心体验）

| # | 动作 | 详细描述 |
|---|---|---|
| A4.1 | 进入训练台 | 入口：首页"今日训练"卡片 / 计划详情"开始训练"。加载激活计划（`user_active_plan`）当日动作列表；无激活计划提示去选择 |
| A4.2 | 预填 | 每个动作每组预填上次同动作的重量与次数（调 `/api/workout/suggestion`）；用户可改；预填值标"上次"角标 |
| A4.3 | 建议浮条 | 动作卡片顶部显示渐进引擎建议：`建议 62.5kg × 8-12 ｜ 上次全部达标，线性 +2.5kg` |
| A4.4 | 记录一组 | 重量/次数步进器（步长=器械增量）；组类型切换；RIR 快捷选项（0/1/2/3/4+ 色带）；单侧动作分 L/R 两行 |
| A4.5 | 完成一组 | 点"完成"→ 组卡片置灰打勾 → 自动启动休息计时（该动作 `rest_seconds`）；到时震动 + 提示音 + 屏幕闪烁（嘈杂健身房） |
| A4.6 | 休息计时器 | 倒计时环（Lottie）；+30s、跳过、重置；后台/锁屏继续（uni-app 能力范围内） |
| A4.7 | PR 提示 | 完成的组若刷新个人纪录，卡片弹出 PR 徽标（金色）+"新纪录 1RM 121kg" |
| A4.8 | 删除一组 | 左滑组卡片 → 删除 + 5 秒内"撤销" toast |
| A4.9 | 复制一组 | 右滑组卡片 → 复制上一组数据为新组 |
| A4.10 | 完成训练 | 汇总页：总容量、总组数、时长、PR 列表、下一课建议摘要 → 确认保存（`workout_record` + 明细）；可补记"纸上训练" |
| A4.11 | 中途退出 | 自动存草稿（Pinia persisted），再次进入恢复"继续训练"；放弃需二次确认 |
| A4.12 | 屏幕常亮 | 训练中保持屏幕常亮（uni-app `setKeepScreenOn`） |

### F5 渐进建议引擎（阶段 3/7，progression.ts）

| 动作 | 描述 |
|---|---|
| 建议计算 | 输入：计划动作配置 + 该动作历史会话 → 输出：建议重量/次数/组数 + 策略名 + 解释 |
| 会话判读 | 达标（勾选且次数≥目标）/ 失误（勾选但次数少）/ 未做（未勾选）/ 缺组（组数不够）——失误会话永不加量 |
| 策略 | linear：全达标 +1 步长，连续 miss 触发减载；greyskull：末组力竭超目标 +2 倍步长，一次失败 -10%；double：次数到区间顶部才加量回底部；triple：先加次数、再加组数、最后加量；time：加秒数 |
| 减载 | `deloadFactor` 默认 0.9，可配 0.5-0.95；连续 miss 计数达 `DELOAD_AFTER` 触发 |
| 状态机 | `plan_progression_state` 表按 计划×动作 持久化当前重量/次数/阶段/减载计数 |

### F6 1RM 与统计（阶段 5）

| 动作 | 描述 |
|---|---|
| 1RM 曲线 | 每动作一条趋势线（`e1rmSeries`），标注 PR 点；公式可选（7 公式 + 加权集合） |
| 准确度 | 显示置信指数（次数越多置信越低；RIR 主观惩罚；加权集合公式分歧惩罚） |
| PR 时间线 | 全部 PR 按时间倒序，含来源组详情（"100×10 估的 142.5"） |
| 周容量 | 每周总容量（kg×reps）与努力度均值并排（量升+努力度升=疲劳积累） |

### F7 肌肉疲劳/恢复/停训热力图（阶段 5，recovery.ts）

| 动作 | 描述 |
|---|---|
| 三模式 | 训练量分布（本周末效组）/ 恢复中（半衰期模型剩余疲劳）/ 已停训（chronic 窗口无训练） |
| 人体图 | 前/后 SVG，18 肌肉着色 0-4 级；点击肌肉筛选相关动作 |
| 疲劳模型 | 半衰期衰减 + RIR 加权（强度越高疲劳越快）+ 急性/慢性窗口 + 新手周容量参考 |
| 强度锚点 | 未记录 RIR 时按 %1RM 估算（`estimateSetRir`），统计与疲劳图口径一致 |

### F8 数据导入导出（阶段 6）

| 动作 | 描述 |
|---|---|
| 导入 | 上传 FitNotes/Strong/Hevy CSV → 解析 → 名称匹配现有动作库（复用 muscles-zh 规范化 + 三级匹配）→ 预览匹配结果 → 确认写库 |
| 导出计划 | 计划分享文件（`plan-share` 格式，小文件）→ 他人导入 |
| 导出全量 | 全量 JSON 备份（含动作快照） |

### F9 PR 记录（阶段 3）

| 动作 | 描述 |
|---|---|
| 检测 | 保存训练时按动作检测 1RM 估算/最大次数/最大单组容量三类 PR，写 `exercise_pr` |
| 通知 | 训练台完成组即时提示（A4.7）；完成页汇总列表 |

---

## 四、数据库变更详单（含备份与回滚）

### 4.0 备份规范（每次变更前必须执行）

```bash
# 1) 全量备份（结构+数据），命名带日期
mysqldump -u root -p --default-character-set=utf8mb4 fitness_db > backup/fitness_full_20261021.sql

# 2) 变更表快照（以 exercise 为例，保留变更前原样）
CREATE TABLE exercise_bak_20261021 AS SELECT * FROM exercise;

# 3) 记录变更前计数（用于迁移后核对）
SELECT COUNT(*) FROM exercise;  -- 期望 33
```

**备份文件存放**：`backup/` 目录（已加入 .gitignore，不随仓库分发）。
**保留策略**：每次整合变更保留一份；确认稳定一周后可清理。

### 4.1 变更登记表

| # | 脚本 | 变更 | 备份对象 | 回滚方式 | 状态 |
|---|---|---|---|---|---|
| D1 | `sql/07-opengym-exercise-schema.sql` | `exercise` +8 列 + source 索引 | 无数据变更（纯加列，可空） | `ALTER TABLE exercise DROP COLUMN ...`（8 条） | ✅ 已生成 |
| D2 | `sql/08-opengym-exercise-backfill.sql` | 33 条存量回填 8 列 | `exercise_bak_20261021` 快照 | 从快照恢复 8 列为 NULL：`UPDATE exercise e JOIN exercise_bak_20261021 b ON e.id=b.id SET e.body_part=NULL,...` | ✅ 已生成 |
| D3 | `sql/09-opengym-exercise-data.sql` | 插入 5602 条上游动作（临时表去重） | 导入前 COUNT(*)=33 记录 | `DELETE FROM exercise WHERE source='opengym';` | ✅ 已生成 |
| D4 | `sql/10-workout-detail-extend.sql` | `workout_exercise_detail` +6 列 | 快照 `workout_exercise_detail_bak_日期` | DROP COLUMN ×6 | ✅ 已生成 |
| D5 | `sql/11-plan-exercise-extend.sql` | `training_plan_exercise` +6 列 | 快照 | DROP COLUMN ×6 | ✅ 已生成 |
| D6 | `sql/12-new-tables.sql` | 新表 `exercise_pr`、`plan_progression_state` | 无（新表） | `DROP TABLE` ×2 | ✅ 已生成 |
| D7 | `sql/13-exercise-media-placeholder.sql`（可选） | 动作媒体占位列（后续自绘素材） | — | — | ⏳ 可选 |

### 4.2 D4：`workout_exercise_detail` 扩展（组级记录）

```sql
ALTER TABLE workout_exercise_detail
  ADD COLUMN set_type        VARCHAR(16)  DEFAULT 'normal' COMMENT '组类型：normal/warmup/drop/rest-pause/failure',
  ADD COLUMN rir             TINYINT      NULL COMMENT '保留次数 RIR 0-10',
  ADD COLUMN rpe             DECIMAL(3,1) NULL COMMENT 'RPE 6-10（与 rir 二选一）',
  ADD COLUMN superset_group  INT          NULL COMMENT '超级组分组号（同号连续）',
  ADD COLUMN per_side        TINYINT      DEFAULT 0 COMMENT '单侧计次（左/右各一行）',
  ADD COLUMN is_pr           TINYINT      DEFAULT 0 COMMENT '是否个人纪录';
```
说明：全部可空/有默认值，旧记录 `set_type='normal'`、`is_pr=0`，**旧数据零迁移成本**。

### 4.3 D5：`training_plan_exercise` 扩展（计划侧目标）

```sql
ALTER TABLE training_plan_exercise
  ADD COLUMN target_sets      INT          NULL COMMENT '目标组数',
  ADD COLUMN target_reps      VARCHAR(32)  NULL COMMENT '目标次数：8 或 8-12',
  ADD COLUMN rest_seconds     INT          NULL COMMENT '组间休息秒数',
  ADD COLUMN target_rir       TINYINT      NULL COMMENT '目标 RIR',
  ADD COLUMN progression_rule VARCHAR(32)  NULL COMMENT 'off/linear/greyskull/double/triple/time',
  ADD COLUMN progression_params JSON       COMMENT '规则参数：步长/次数区间/减载因子等';
```
说明：旧计划全部 NULL，读取时按默认（linear、步长取器械默认、休息 90s）兼容。

### 4.4 D6：新表

```sql
CREATE TABLE exercise_pr (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id     BIGINT NOT NULL,
  exercise_id BIGINT NOT NULL,
  type        VARCHAR(16)  COMMENT '1rm/max_reps/max_volume',
  value       DECIMAL(10,2),
  achieved_at DATE,
  workout_record_id BIGINT,
  INDEX idx_pr_user_ex (user_id, exercise_id)
) COMMENT '个人纪录';

CREATE TABLE plan_progression_state (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id       BIGINT NOT NULL,
  plan_id       BIGINT NOT NULL,
  exercise_id   BIGINT NOT NULL,
  current_weight DECIMAL(8,2),
  current_reps  INT,
  stage         INT DEFAULT 0 COMMENT '双倍/三倍进阶阶段',
  deload_count  INT DEFAULT 0,
  updated_at    DATETIME,
  UNIQUE KEY uk_state (user_id, plan_id, exercise_id)
) COMMENT '渐进状态机（每计划每动作）';
```

### 4.5 数据兼容说明

- 旧记录 `set_type` 默认 `normal`，容量统计与 1RM 逻辑对旧数据行为不变
- 旧计划 `progression_rule` 为空 → 按 `linear` + 默认步长处理（与移植前"全达标加重量"的手感一致）
- 导入动作 `source='opengym'`，App 可在设置里开关"显示扩充动作库"，默认开

---

## 五、API 变更详单

| API | 方法 | 请求 | 响应 | 阶段 |
|---|---|---|---|---|
| `/api/exercises` | GET | +`source`、`muscle`（规范 slug）、`equipment` 筛选 | 列表带新字段 | 3 |
| `/api/workout/suggestion` | — | 见下方架构决策 ADR-1：引擎在客户端运行，无此后端端点 | — | 3（改为客户端计算） |
| `/api/workout/recovery` | GET | `?days=7\|30\|0` | 三模式肌肉负荷 + 疲劳状态 + 停训列表 | 5 |
| `/api/workouts/pr` | GET | `?exerciseId=`（可空） | PR 列表 | ✅ 3（`2a3dec5`） |
| `/api/workouts/{id}/details` | POST | 组级明细数组（重量/次数/RIR/组类型/单侧等） | 保存数 + 新产生的 PR 列表（自动检测） | ✅ 3（`2a3dec5`） |
| `/api/workouts/history-window` | GET | `?days=90\|0` | 近 N 天组级数据（按训练分组，前端 history adapter 回读源） | ✅ 3（`2a3dec5`） |
| `/api/import/fitnotes` `/strong` `/hevy` | POST | multipart CSV | 匹配预览（未确认）→ 确认后写库 | 6 |
| `/api/plan/share/export` `/import` | GET/POST | planId / 文件 | 分享文件 | 6 |
| `/api/exercise/batch-import` | POST | 管理用 | 导入结果统计 | 2（已随脚本覆盖） |

### ADR-1：渐进引擎在客户端运行，后端只做数据（2026-10-22 决策）

**决策**：`nextPrescription`（渐进建议）、疲劳/恢复计算（recovery.ts）均在**前端** `utils/training/` 内执行；后端不提供 suggestion 计算端点，只提供数据落点与查询。

**理由**：
1. **健身房弱网是常态**：每组之间都要建议（+30s 休息、换动作），网络抖动会让训练台不可用；引擎为纯函数，本地计算零延迟且离线可用。
2. **零重复实现**：引擎已在客户端完整移植（progression 138 + recovery 49 项测试，与上游逐位一致）。Java 再移植一份意味着两份实现、两份测试、行为漂移风险。
3. **跨端一致**：同一份引擎同时驱动训练台、疲劳图、分享计划预览。

**后端职责（已落地，`2a3dec5`）**：
- `POST /api/workouts/{id}/details`：组级记录落点 + PR 检测（Epley 与前端 onerm.ts 逐位一致）
- `GET /api/workouts/pr`：PR 跨端查询
- `GET /api/workouts/history-window`：近 N 天组级数据，前端 `history.ts` adapter 映射为引擎输入（冷启动/换设备场景）

**代价与缓解**：算法更新需发版前端（可接受——训练建议本就该随 App 更新）；后端不缓存计算结果（`plan_progression_state` 表为可选缓存，删除后由历史重新推导）。

---

## 六、前端变更详单

| 文件 | 变更 | 阶段 |
|---|---|---|
| `utils/training/progression.ts` | 渐进引擎移植 + 测试 | 3 |
| `utils/training/recovery.ts` | 疲劳模型移植 + 测试 | 3 |
| `utils/training/history.ts` | 历史回读 adapter（MySQL 结构 → 上游输入形状） | 3 |
| `utils/training/import-csv.ts` | 三格式导入器移植 + 测试 | 6 |
| `utils/training/plan-share.ts` | 分享文件格式移植 | 6 |
| `pages/record/workout/guided-training.vue` | 引导式训练台（F4 全部动作） | 4 |
| `components/RestTimer.vue` | 休息计时器（Lottie 环 + 震动 + 声音） | 4 |
| `components/MuscleMap.vue` | 人体 SVG（前/后，点击筛选） | 5 |
| `components/RecoveryHeatmap.vue` | 三模式热力图 | 5 |
| `pages/knowledge/training-plan-edit.vue` | 计划动作目标与规则编辑 | 7 |
| `pages/knowledge/exercise-library.vue` | 动作库浏览（肌肉筛选/来源筛选） | 4 |
| `stores/training.js` | 草稿、进行中训练、PR 提示队列 | 4 |
| `pages.json` | 注册新页面 | 各阶段 |

---

## 七、实施步骤（按序执行，每步可验收）

### 阶段 3：数据模型 + 后端 API + 引擎移植（当前）

- [ ] 3.1 移植 `progression.ts`（策略/减载/步长/会话判读）+ 上游测试基线
- [ ] 3.2 移植 `recovery.ts`（半衰期疲劳/强度锚点/三模式）+ 测试
- [ ] 3.3 执行 D4/D5/D6（先按 4.0 备份）
- [ ] 3.4 后端：Entity/Mapper/Service 扩展 + suggestion/recovery/pr API
- [ ] 3.5 `history.ts` adapter：`workout_record + workout_exercise_detail` → 算法输入
- [ ] 验收：Postman 覆盖新 API；单测全绿；旧数据读取正常

### 阶段 4：引导式训练台

- [ ] 4.1 RestTimer 组件
- [ ] 4.2 guided-training.vue（F4 全部 12 个动作）
- [ ] 4.3 stores/training.js 草稿与恢复
- [ ] 4.4 动作库浏览页（来源/肌肉筛选）
- [ ] 验收：完整跑一次 4 动作×4 组训练并保存；杀进程重进恢复草稿

### 阶段 5：疲劳图与统计

- [ ] 5.1 MuscleMap + RecoveryHeatmap
- [ ] 5.2 统计页：1RM 曲线、PR 时间线、周容量
- [ ] 验收：≥2 周历史账号三模式数值与手算抽样一致

### 阶段 6：导入导出

- [ ] 6.1 import-csv.ts + 导入页
- [ ] 6.2 plan-share 导入导出
- [ ] 验收：样例 CSV 导入，动作匹配率与数量正确

### 阶段 7：规则配置

- [ ] 7.1 计划编辑页目标与规则
- [ ] 7.2 设置项（周起始日、默认休息、努力度开关、公式选择）
- [ ] 验收：改规则后建议值即时变化

### 阶段 8：收尾

- [ ] 8.1 中文教学文本补充（网络恢复后从上游 `instr/zh.js` 清洗导入）
- [ ] 8.2 AGPL 合规清单核对（源码获取说明、NOTICE）
- [ ] 8.3 全量回归 + 打包

---

## 八、测试计划

| 层 | 内容 | 基线 |
|---|---|---|
| 算法单测 | 上游测试逐条移植（行为不变性） | onerm 53 / muscles 31 / effort 24 / muscles-zh 14 / progression 138 / recovery 49 = 308；全量 459 |
| 集成 | 新 API 的 Postman/ps1 脚本（沿用 `fitness-server/test-e2e-plan.ps1` 风格） | 阶段 3 |
| 端到端 | 训练台全流程（计划→训练→保存→统计→疲劳图） | 阶段 4/5 |
| 回归 | `fitness-app` 全量 vitest（当前 272） | 每阶段 |

---

## 九、风险与回滚

| 风险 | 应对 |
|---|---|
| 数据库变更失败 | 4.0 备份先行；每个脚本独立事务；失败按登记表回滚 |
| 上游算法移植偏差 | 测试基线逐用例对齐；偏差必须显式记录理由 |
| 5602 条导入后列表性能 | 分页 + 服务端筛选 + source 索引；必要时本地索引 |
| AGPL 合规 | 若对外提供服务/分发：随分发提供源码获取说明与 NOTICE；媒体素材零使用 |
| 上游数据继续演进 | `integrations/openGym` 记录 hash；升级时只重评 lib 层并重跑导入脚本 |

---

## 十、进度看板

| 阶段 | 状态 | 说明 |
|---|---|---|
| 阶段 0 合规与准备 | ✅ 完成 | 上游稀疏检出 `integrations/openGym`（`e348fc1`）；vitest 基线 |
| 阶段 1 纯逻辑移植（部分） | ✅ 完成 | onerm / muscles / effort + 122 测试（提交 `764256e`） |
| 阶段 2 动作库 | ✅ 代码就绪 | D1-D3 已生成；`muscles-zh` + `muscles-data.mjs` + 导入脚本（提交 `a3006fa`）；**待数据库执行** |
| 阶段 2b 数据库执行 | ⏳ 待用户 | 按 4.0 备份后执行 07→08→09 |
| 阶段 3 引擎+数据+API | ✅ 完成 | progression 138 / recovery 49 / history 20 测试；D4-D6 迁移脚本（sql/10-12）；后端数据 API + PR 检测（`2a3dec5`）；history adapter 端到端接通引擎（`b8b3fe9`）。⏳ 仅剩数据库执行（需用户操作） |
| 阶段 4-8 | ⏳ 待办 | 训练台、疲劳图、导入、规则、收尾 |

---

## 附录 A：上游源码定位

- 算法：`frontend/src/lib/{progression,onerm,recovery,muscles,effort,history,import-csv,plan-share}.js`（同名 `.test.js` 为测试基线）
- 动作库数据：`frontend/src/lib/exercises-data.js`（EXDB 5632 条；`]\r\n` 结尾无分号）
- 中文教学：`frontend/src/instr/zh.js`（GitHub 直连超 50MB 限制，待网络）
- 组件参考（React，需 Vue 重写）：`frontend/src/components/{RestTimer,Heatmap,BodyMap,LineChart,Stepper}.jsx`
- 同步设计参考：README "HOW SYNC WORKS" + `api/server.js`

## 附录 B：本地关键文件

- `fitness-app/utils/training/*` — 算法层
- `fitness-app/scripts/opengym-exercise-import.mjs` — 动作库导入脚本（可重跑）
- `sql/07~09` — 动作库迁移三件套；`sql/10~13` — 后续迁移（按第四节登记表生成）
- `fitness-server/.../entity/{Exercise,WorkoutRecord,WorkoutExerciseDetail,TrainingPlan,TrainingPlanExercise}.java`
