# openGym 整合方案 —— 健身小助手

> 版本：v1.1（方案 B 已确认） ｜ 日期：2026-10-20 ｜ 状态：**已确认方案 B（能力移植），进入实施准备**
> 上游项目：<https://github.com/DuarteSantos8/openGym>（14.1k Star，AGPL-3.0）
> 专用分支：`feature/opengym-integration`（2026-10-20 从 master 拉出，整合后的项目在此分支开发并直接打包）

---

## 一、openGym 是什么（调研结论）

### 1.1 项目概况

| 项 | 结论 |
|---|---|
| 定位 | 自托管健身/体重追踪器：周计划、引导式训练、组级记录、肌肉疲劳/恢复/停训分析 |
| 技术栈 | 前端 React 19 + Vite + Zustand（PWA，可离线）；API 为原生 `node:http`（仅 2 个依赖：webauthn、web-push）；数据 = `./data` 下的 JSON 文件；nginx 反代 `/api`；Docker Compose 三件套部署 |
| 账号 | Passkey（WebAuthn）为主，可开密码登录 |
| 数据互通 | 导入 FitNotes / Strong / Hevy（CSV 或 API key）、Apple Health 体重导出；导出全量 JSON；计划可分享为文件/PDF |
| 同步 | 每 profile 一份文档 + 服务端版本号，冲突拒绝返回最新文档，设备端**字段级合并**后重试 |
| 规模 | 5,600+ 动作库（含动画演示）、19 种语言（含简体中文）、约两周一个 release |

### 1.2 可移植资产清单（按价值排序）

仓库 `frontend/src/lib/` 下是**纯函数 + 单测**，与 UI 框架无关，是整合的金矿：

| 文件 | 大小 | 内容 | 可移植性 |
|---|---|---|---|
| `exercises-data.js` | 888KB | 5,600+ 动作库数据（名称/肌肉/器械/类型等） | 直接转 TS 数据模块 |
| `progression.js` | 13.7KB | 渐进规则引擎：线性、Greyskull LP、双倍/三倍进阶、加时；含"为什么是这个数"解释、减载触发 | 纯函数，直接移植 |
| `onerm.js` | 3.7KB | 1RM 估算（多公式曲线） | 纯函数，直接移植 |
| `recovery.js` | 8.2KB | 肌肉疲劳/恢复/停训计算 | 纯函数，直接移植 |
| `muscles.js` | 7.2KB | 肌肉群定义与映射 | 纯函数 + 数据，直接移植 |
| `history.js` | 17.7KB | 训练历史回读逻辑（容量、PR、系列） | 纯函数，移植需适配数据结构 |
| `effort.js` | 5.9KB | RIR/RPE 努力度分级与文案 | 纯函数，直接移植 |
| `import-csv.js` | 25.8KB | FitNotes/Strong/Hevy CSV 导入器 | 纯函数，直接移植 |
| `plan-share.js` | 13KB | 计划分享文件格式（导入导出） | 纯函数，直接移植 |
| `body-paths.js` | 94KB | 人体肌肉图 SVG 几何路径（前/后） | 数据 + 组件，可移植 |
| `instr/zh.js` | 481KB | 中文动作教学文本 | 数据，可移植（注意版权见下） |
| 组件参考 | — | `RestTimer.jsx` `Heatmap.jsx` `BodyMap.jsx` `LineChart.jsx` `Stepper.jsx` | React 组件，**需用 Vue 重写**（逻辑可参考） |
| `api/server.js` | 26KB | 同步/合并/权限服务端 | 仅参考设计，Java 后端不需要 |

### 1.3 许可证合规（重要，先读）

1. **代码 = AGPL-3.0**。移植代码进你的 App 后：
   - 若 App 仅**自用/内网**：无额外义务，但建议保留 NOTICE。
   - 若 App **对外提供网络服务**（公网部署他人可用）：必须向使用者提供**完整对应源码**（AGPL §13）。
   - 若**分发 App 本身**（如微信小程序上架、APK 分发）：随分发提供 LICENSE 与源码获取说明。
   - 结论：**技术上可整合，但你的 App 整体会被传染为 AGPL**。需确认接受（见第八节决策点）。
2. **动作媒体素材 = 不可移植**。`assets/` 与前端里的动作动画/静图 © Aliaksandr Makatserchyk（gymvisual.com），**仅授权 openGym 使用**。你的 App **禁止拷贝**这些图片/GIF。可用替代：纯文字教学、自己的配图、或后续自制动画。
3. **动作文本**（`instr/`、catalogue 文本）属 openGym 作品，AGPL 下可移植但同样受传染。

---

## 二、你的健身小助手现状

### 2.1 架构

```
fitness-app/     uni-app（Vue3 + Pinia + uCharts + Lottie）
                 页面：首页/知识库/记录(体重·饮水·饮食·运动·身高+历史)/
                       训练计划(列表·详情·编辑)/登录/我的
fitness-server/  Java Spring Boot + MyBatis-Plus + MySQL
                 模块：User/Exercise/TrainingPlan(→Day→Exercise)/
                       WorkoutRecord(→WorkoutExerciseDetail)/
                       Weight/Water/Diet/Height/DailyStats/SysDict
```

### 2.2 与 openGym 能力差距（差距 = 整合价值）

| 能力 | 你的 App 现状 | openGym |
|---|---|---|
| 动作库 | `exercise` 表：名称/分类/肌肉群/难度/描述/建议（缺器械、次要肌肉、别名、时序类型等） | 5,600+ 动作，字段完备 |
| 训练记录 | `workout.vue` 为**表单式**（类型/时长/消耗），`workout_exercise_detail` 有 setNumber/actualReps/weightKg/restSeconds 但 UI 未用引导式日志 | 引导式：逐组记录、预填上次重量、休息计时器、PR 检测、滑动手势 |
| 渐进规则 | 无 | linear / Greyskull LP / 双倍 / 三倍 / 加时，含解释与减载 |
| 1RM | 无 | 有（多公式） |
| 疲劳分析 | 无 | 肌肉图三模式：训练量分布/恢复中/已停训 |
| 努力度 | 无 | RIR/RPE 分级 + 文案 |
| 数据导入 | 无 | FitNotes/Strong/Hevy CSV、Apple Health |
| 组类型 | 无 | 热身组/正式组/递减组/暂停休息、超级组、计时动作、单侧次数 |
| 离线/同步 | 无（纯在线） | 离线 PWA + 字段级合并同步 |

**结论：你的 App 强在"日常健康记录全家桶 + 账号体系 + 服务端数据"，openGym 强在"训练科学内核 + 组级引导日志 + 数据分析"。整合 = 把 openGym 的内核搬进你的架构，而不是反过来被它替换。**

---

## 三、整合策略对比

| 方案 | 做法 | 优点 | 缺点 |
|---|---|---|---|
| **A. 整体旁路** | Docker 跑完整 openGym，nginx 按 `/opengym` 反代；App 内 web-view 嵌入；做登录态/数据桥接 | 零重写、可整体跟随上游升级；功能立即可用 | 双账号体系、双数据孤岛（数据在它 JSON 里不在你 MySQL）、UI 风格割裂、AGPL 网络服务源码义务、微信内 web-view 体验差 |
| **B. 能力移植（推荐）** | 移植 lib 纯函数 + 动作库数据 → 扩展后端表结构 → Vue 重写关键页面 → 打通导入导出 | 统一 UX/账号/数据；完全融入现有架构；可持续增量交付 | 工作量集中在前端重写与数据建模；上游升级需手动同步 |
| **C. 混合分阶段** | 先 B 拿核心价值（算法+动作库+引导记录），后可选 A 作为"专业模式"旁挂 | 风险低、每一步都可独立验收 | 周期较长 |

**推荐：C，但以 B 为主体，A 列为可选最终态。** 理由：你的 App 是 uni-app 移动端 + 自有后端，用户数据必须留在 MySQL；openGym 真正的差异化价值（渐进引擎、疲劳分析、1RM、导入器）恰好都是**框架无关的纯函数**，移植成本低收益高；而它重复造的部分（登录、计划管理、记录 CRUD）你已有更合适的实现。

> **已确认（2026-10-20）：采用方案 B（能力移植）**，不做旁路完整实例；后续如需"专业模式"再评估 A。

### 3.1 分支与工作流

- 专用分支：`feature/opengym-integration`（已创建），master 保持原开发基线不动。
- 整合完成后的打包（H5/小程序/App）均从该分支产出；稳定后合回 master 或打 tag。
- 提交规范：沿用现有风格（`feat(frontend):` / `feat(server):` / `docs:`），涉及移植的提交注明来源，如 `feat(frontend): 移植 openGym progression 渐进引擎(utils/training)`。
- **注意**：当前工作区有大量未提交改动，且根目录存在未忽略的敏感文件 `token.txt`，建议整合开工前先做一次基线提交（并确认 `token.txt` 已加入 `.gitignore`），避免与整合改动混杂。

---

## 四、整合架构设计（目标态）

```
┌─────────────────────────── fitness-app (uni-app) ───────────────────────────┐
│ 新增/改造页面                                                                 │
│  • 训练台（引导式）  预填上次重量 · 组类型 · RIR/RPE · 休息计时 · PR 提示      │
│  • 肌肉疲劳图        移植 body-paths + recovery，三模式热力图（uCharts/SVG）   │
│  • 进度规则设置      progression 规则选择 + "为什么是这个数"解释               │
│  • 数据导入          FitNotes/Strong/Hevy CSV（移植 import-csv）              │
│  • 1RM/统计          onerm + history 驱动的图表                               │
├─────────────────────────── 纯逻辑层 utils/training/*.ts ──────────────────────┤
│  progression.ts  onerm.ts  recovery.ts  muscles.ts  effort.ts                │
│  history.ts  import-csv.ts  plan-share.ts  exercises-data.ts（截取/裁剪）     │
│  全部配 vitest 单测（openGym 自带测试用例一并移植，作为验收基线）              │
├─────────────────────────── fitness-server (Spring Boot) ──────────────────────┤
│  现有表扩展 + 新表（见 5.2）                                                   │
│  新 API：1RM、疲劳分析、进度建议、CSV 导入、计划分享文件、PR 记录              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**设计原则**
1. **纯逻辑与 UI 框架解耦**：所有算法以 TS 纯函数落在 `fitness-app/utils/training/`，单测覆盖；后端 Java 侧只做需要全量数据聚合的计算（疲劳分析可前端算则前端算，减轻服务端）。
2. **数据不进 openGym 的 JSON 同步体系**：继续用 MySQL + 现有 REST 约定；openGym 的 sync/merge 设计仅作参考，不实现。
3. **媒体素材零拷贝**：动作配图一律不用上游动画；动作库只取**文本与结构数据**。
4. **上游可追踪**：以 git subtree/remote 方式引入源码于 `integrations/openGym/`（或仅记录 commit hash），每季度评估同步一次。

---

## 五、数据模型与 API 变更设计

### 5.1 `exercise` 表扩展（对齐 openGym 动作库字段）

```sql
ALTER TABLE exercise
  ADD COLUMN name_zh        VARCHAR(128)  COMMENT '中文名（现有 name 保留为主名）',
  ADD COLUMN aliases        VARCHAR(512)  COMMENT '别名/英文别名 JSON',
  ADD COLUMN equipment      VARCHAR(64)   COMMENT '器械：barbell/dumbbell/machine/bodyweight...',
  ADD COLUMN force          VARCHAR(32)   COMMENT '用力类型：push/pull/static',
  ADD COLUMN mechanic       VARCHAR(32)   COMMENT 'compound/isolation',
  ADD COLUMN secondary_muscles VARCHAR(256) COMMENT '次要肌肉 JSON',
  ADD COLUMN is_timed       TINYINT DEFAULT 0 COMMENT '计时动作（平板支撑等）',
  ADD COLUMN per_side       TINYINT DEFAULT 0 COMMENT '单侧计次（弓步等）',
  ADD COLUMN is_custom_media TINYINT DEFAULT 0 COMMENT '用户自传媒体标记（合规）';
```

动作库扩充：写一次性脚本把 `exercises-data.js` 的 5,600+ 条映射入库（**只取文本/结构字段**），与现有预置动作按 `name_zh`/别名去重合并；分批导入（建议先导常用的 800 条热门，全量作为后台任务）。

### 5.2 训练记录与计划增强

`workout_exercise_detail` 扩展：
```sql
ADD COLUMN set_type   VARCHAR(16) DEFAULT 'normal' COMMENT 'warmup/normal/drop/rest-pause/failure',
ADD COLUMN rir        TINYINT      COMMENT '保留次数(RIR)',
ADD COLUMN rpe        DECIMAL(3,1) COMMENT 'RPE',
ADD COLUMN superset_group INT      COMMENT '超级组分组号',
ADD COLUMN per_side   TINYINT DEFAULT 0,
ADD COLUMN is_pr      TINYINT DEFAULT 0 COMMENT '是否个人纪录';
```

`training_plan_exercise` 扩展（计划侧目标）：
```sql
ADD COLUMN target_sets   INT,
ADD COLUMN target_reps   VARCHAR(32)  COMMENT '8-12 或 5',
ADD COLUMN rest_seconds  INT,
ADD COLUMN target_rir    TINYINT,
ADD COLUMN progression_rule VARCHAR(32) COMMENT 'linear/greyskull/double/triple/time',
ADD COLUMN progression_params JSON      COMMENT '规则参数（增重步长、次数区间等）';
```

新表：
```sql
CREATE TABLE exercise_pr (            -- 个人纪录
  id BIGINT PRIMARY KEY, user_id BIGINT, exercise_id BIGINT,
  type VARCHAR(16)                   -- '1rm'/'max_reps'/'max_volume',
  value DECIMAL(10,2), achieved_at DATE, workout_record_id BIGINT
);
CREATE TABLE plan_progression_state ( -- 渐进状态机（每计划每动作）
  id BIGINT PRIMARY KEY, user_id BIGINT, plan_id BIGINT, exercise_id BIGINT,
  current_weight DECIMAL(8,2), current_reps INT, stage INT, deload_count INT,
  updated_at DATETIME
);
```

### 5.3 新增 API（挂到现有 Controller）

| API | 方法 | 说明 |
|---|---|---|
| `/api/exercise/onerm/{exerciseId}` | GET | 1RM 曲线与当前估值（后端聚合或前端算） |
| `/api/workout/suggestion` | POST | 传入计划动作 + 历史 → 返回本次建议重量/次数 + **解释文案**（progression 移植） |
| `/api/workout/recovery` | GET | 肌肉疲劳/恢复/停训三模式数据（recovery 移植） |
| `/api/workout/pr` | GET | PR 列表与检测 |
| `/api/import/fitnotes` `/strong` `/hevy` | POST | CSV 上传 → `import-csv.ts` 解析 → 映射为现有记录 API |
| `/api/plan/share/export` `/import` | GET/POST | 计划分享文件（plan-share 移植） |
| `/api/exercise/batch-import` | POST | 动作库批量导入（管理用） |

---

## 六、实施阶段与详细步骤

> 每阶段独立可验收；估时为单人天。所有改动只在 `feature/opengym-integration` 分支提交。

### 阶段 0：合规与准备（0.5 天）

1. 通读 openGym `LICENSE`/`NOTICE.md`/`SECURITY.md`，确认 AGPL 接受度（见决策点 D2）。
2. 克隆仓库：`git clone https://github.com/DuarteSantos8/openGym integrations/openGym`（或 subtree），记录 commit hash 到本文档附录。
3. 建立 `fitness-app/utils/training/` 目录与 vitest 配置（复用现有 `fitness-app/vitest.config.js`）。
4. **验收**：仓库可 clone；测试基线可跑（在 openGym 仓库内 `npx vitest run lib` 全绿）。

### 阶段 1：纯逻辑移植 + 测试基线（3 天）

1. 逐一移植并中文化注释：`progression.ts` `onerm.ts` `recovery.ts` `muscles.ts` `effort.ts` `history.ts`（JS→TS，补类型）。
2. 移植对应 `*.test.js` → `*.test.ts`，作为**行为不变性验收**（先跑通再改类型）。
3. 对 `history.ts` 做适配：它的输入是 openGym 的 workout 文档结构，写一层 adapter 把你的 `workout_record + workout_exercise_detail` 转成它的输入形状，验证输出一致。
4. 在 `fitness-app` 内新增 `npm run test:training` 脚本。
5. **验收**：移植测试全绿；`utils/training/` 无 UI/网络依赖。

### 阶段 2：动作库扩充（2 天）

1. 脚本解析 `exercises-data.js`（888KB）→ 生成 CSV/JSON 中间产物（**剔除 media 字段**）。
2. 映射进 `exercise` 表新字段（5.1），按热度分两批导入；与现有预置去重（保留你的 `id` 不变，仅补字段）。
3. 导入 `instr/zh.js` 教学文本到 `exercise.description/professional_tips`（缺失才补）。
4. 后端加 `/api/exercise/batch-import`（管理员 token 保护）。
5. **验收**：库内动作数 ≥ 3000；随机抽 20 条字段完整率 100%；媒体字段为空。

### 阶段 3：数据模型与后端 API（4 天）

1. 执行 5.2 全部 DDL（`sql/` 下新增迁移脚本，纳入你的 SQL 管理目录）。
2. Entity/Mapper/Service/DTO 按现有 MyBatis-Plus 风格扩展（参考 `WorkoutExerciseDetail.java` 模式）。
3. 实现 5.3 API：建议重量（suggestion）、1RM、PR 检测、恢复分析、分享导入导出。
4. `history.ts` 适配层服务端化：PR/容量统计改由后端聚合返回，前端只渲染。
5. **验收**：Postman/`test-e2e-plan.ps1` 风格脚本覆盖新 API；旧记录迁移无损。

### 阶段 4：前端——引导式训练台（5 天，核心体验）

1. 新页面 `pages/record/workout/guided-training.vue`（注册进 `pages.json`）：
   - 进入自动加载今日计划动作；**预填上次重量**（调 suggestion API）。
   - 逐组卡片：重量/次数步进器（移植 `Stepper` 交互）、组类型切换、RIR/RPE 选择（effort 文案）、单侧开关。
   - **休息计时器**（移植 `RestTimer` 逻辑：到时震动+响铃，用 Lottie 做进度环）。
   - 完成组后即时显示 PR 徽标与"下次建议"（progression 解释文案）。
   - 滑动手势：左删（带撤销）右复制——移植其交互到 uni-app（`movable`/自绘）。
2. 训练中页面 `onPageHide` 保护 + 屏幕常亮（uni-app 对应 API）。
3. 保存走现有 `WorkoutRecordController`（扩展后的 detail 字段）。
4. **验收**：完整跑完一次 4 动作×4 组训练并保存；断网重进恢复草稿（本地 Pinia 持久化）。

### 阶段 5：前端——肌肉疲劳图与统计（3 天）

1. 移植 `body-paths.js` 人体 SVG 几何；写 Vue 组件 `MuscleMap.vue`（前/后、点击肌肉筛选动作）。
2. `RecoveryHeatmap.vue`：三模式（训练量/恢复中/停训）着色，数据来自 `/api/workout/recovery`。
3. 统计页增强：1RM 曲线（`LineChart` 逻辑参考 + uCharts 实现）、PR 时间线、周容量趋势。
4. **验收**：有 ≥2 周历史数据的账号，三模式热力图数值与手算抽样一致。

### 阶段 6：数据导入与计划分享（2 天）

1. 移植 `import-csv.ts`（FitNotes/Strong/Hevy 三格式 + 匹配现有动作库的名称匹配逻辑）。
2. 导入页 `pages/profile/data-import.vue`：上传 CSV → 预览匹配结果 → 确认写库（复用记录 API）。
3. 导出：计划分享文件（plan-share 移植）+ 训练历史 JSON 导出（你的数据格式，附 openGym 兼容说明）。
4. **验收**：用 openGym demo 数据/官网样例 CSV 各导 1 份，动作匹配率与数量正确。

### 阶段 7：渐进规则配置与文案（2 天）

1. 计划编辑页（`training-plan-edit.vue`）增加：每动作目标组数/次数区间/休息/RIR、渐进规则选择（linear/greyskull/double/triple/time）与参数。
2. 设置页增加：周起始日（周一/周日）、默认休息时长、努力度显示开关。
3. **验收**：新建计划带规则 → 训练台建议值符合规则推演；修改规则后建议即时变化。

### 阶段 8（可选）：旁路完整实例（2 天，需决策点 D1 确认）

1. `deploy/` 增加 docker-compose 片段：`ghcr.io/duartesantos8/opengym-{api,web}`，`/opengym` 路径由 nginx 反代。
2. App 内"专业模式"入口：web-view 打开 `/opengym`，做一次性 token 交换（若要做单点）。
3. 数据桥接：导出你的历史为 openGym JSON 导入格式（一次性脚本）。
4. **验收**：手机可打开并登录 openGym；历史数据可见。**注意 AGPL 网络服务源码义务与媒体素材合规（openGym 官方镜像自带媒体，仅限其自用许可范围内运行，不要提取素材）。**

---

## 七、里程碑总览

| 里程碑 | 内容 | 估时 | 累计 |
|---|---|---|---|
| M0 | 合规确认 + 仓库引入 + 测试基线 | 0.5d | 0.5d |
| M1 | 纯逻辑移植（6 模块 + 测试） | 3d | 3.5d |
| M2 | 动作库 3000+ 入库 | 2d | 5.5d |
| M3 | 表结构 + 后端 API | 4d | 9.5d |
| M4 | 引导式训练台 | 5d | 14.5d |
| M5 | 肌肉疲劳图 + 统计 | 3d | 17.5d |
| M6 | CSV 导入 + 计划分享 | 2d | 19.5d |
| M7 | 渐进规则配置 | 2d | 21.5d |
| M8（可选） | 旁路实例 | 2d | 23.5d |

**核心价值最短路径：M0→M1→M3(suggestion/PR/恢复)→M4**，约 13.5 天可获得"引导式训练 + 渐进建议 + PR"完整体验；M2/M5/M6 可并行或后置。

---

## 八、风险与决策点

| # | 决策点 | 结论 | 影响 |
|---|---|---|---|
| D1 | 整合深度 | **已确认：方案 B（能力移植），不做旁路实例** | 后续如需"专业模式"再评估 A |
| D2 | **AGPL 接受度** | 待确认：App 是否/将要对外提供网络服务或分发（微信小程序上架、公网部署给他人用）？ | 若是，**整个 App 需以 AGPL 提供对应源码**；若仅自用/内网则基本无义务。这是唯一可能改变方案法务性质的点 |
| D3 | 动作媒体 | **已确认：不使用** openGym 动画素材（版权仅限 openGym），采用纯文字/自绘图标/后续自配图 | 动作详情页为文字教学 + 自绘肌肉示意 |
| D4 | 优先级 | 默认按最短路径：训练台+渐进+PR 优先（M0→M1→M3→M4），动作库全量与疲劳图后置 | 影响阶段顺序 |
| D5 | 上游追踪 | 建议：记录 commit hash 一次性移植 + `integrations/openGym` 子树备查，每季度评估同步 | 影响长期维护成本 |

**其他风险**
- openGym 约两周一版，接口/数据结构可能变 → 解耦原则 + 记录 hash，升级时只重新评估 lib 层。
- 5,600 条动作入库后列表性能 → 分页 + 本地索引 + 搜索走服务端（视数据量）。
- 移植代码带中英文注释混杂 → 统一中文化，保留原测试用例注释中的算法出处。
- `history.ts` 与你的记录结构差异最大，是阶段 1 的主要工作量，已用 adapter 方案隔离。

---

## 附录 A：上游源码定位（实施时直接取用）

- 动作库数据：`frontend/src/lib/exercises-data.js`
- 算法：`frontend/src/lib/{progression,onerm,recovery,muscles,effort,history}.js`（同名 `.test.js` 为测试）
- 导入器：`frontend/src/lib/import-csv.js`
- 人体图几何：`frontend/src/lib/body-paths.js`
- 组件参考（React，需 Vue 重写）：`frontend/src/components/{RestTimer,Heatmap,BodyMap,LineChart,Stepper}.jsx`
- 中文教学：`frontend/src/instr/zh.js`
- 同步设计参考：README "HOW SYNC WORKS" + `api/server.js`
- 部署参考：`docker-compose.yml`、`docs/SELF_HOSTING.md`、`docs/MOBILE.md`
- 记录引入时的 commit hash：`（实施阶段 0 填写）`

## 附录 B：本文档引用的本地文件

- `fitness-app/pages/record/workout/workout.vue`（现为表单式记录，将被引导式页面增强）
- `fitness-server/.../entity/{WorkoutRecord,WorkoutExerciseDetail,TrainingPlan,Exercise}.java`
- `fitness-app/pages.json`（新页面注册处）
- `fitness-server/src/main/resources/` 或根 `sql/`、`init-training-plans.sql`（DDL 迁移位置）
