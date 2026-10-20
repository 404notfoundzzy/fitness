# 健身 App 后端补全 + 知识库扩充 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 补全后端缺失代码（User新字段/HeightRecord/活动聚合API）+ 全面扩充运动肌群知识数据至 80+ 动作 + 同步更新 SQL 部署文件

**架构：** 在现有 Spring Boot + MyBatis-Plus 架构上扩展：User实体新增4字段+字典表新增2类型+HeightRecord全栈重建(被用户删除)+活动聚合API新建+Exercise种子数据从17条扩充至80+条

**技术栈：** Java 17 / Spring Boot 3 / MyBatis-Plus / MySQL 8 / uni-app (前端)

---

## 文件结构总览

### 新建文件
| 文件路径 | 职责 |
|----------|------|
| `fitness-server/.../entity/HeightRecord.java` | 身高记录实体 |
| `fitness-server/.../mapper/HeightRecordMapper.java` | 身高记录 Mapper |
| `fitness-server/.../service/HeightRecordService.java` | 身高记录 Service 接口 |
| `fitness-server/.../service/impl/HeightRecordServiceImpl.java` | 身高记录 Service 实现 |
| `fitness-server/.../controller/HeightRecordController.java` | 身高记录 Controller |
| `fitness-server/.../controller/ActivityController.java` | 最近动态聚合 Controller |
| `fitness-server/sql/migrate_v1.1.0.sql` | 数据库迁移脚本 |

### 修改文件
| 文件路径 | 修改内容 |
|----------|----------|
| `fitness-server/.../entity/User.java` | 新增 gender/age/fitnessGoal/bio 字段 |
| `fitness-server/.../config/DataInitializer.java` | 扩充 Exercise 种子数据 + 新增字典类型 |
| `fitness-server/sql/deploy_v1.0.0.sql` | 追加 User 新列 + 字典数据 + 身高表 DDL |

---

### 任务 1：数据库迁移脚本 (SQL)

**文件：**
- 创建：`d:\softWare\develop\app-myself\fitness\fitness-server\sql\migrate_v1.1.0.sql`
- 修改：`d:\softWare\develop\app-myself\fitness\fitness-server\sql\deploy_v1.0.0.sql`

- [ ] **步骤 1：创建迁移脚本 migrate_v1.1.0.sql**

包含以下 SQL 内容：
- ALTER TABLE user 添加 gender/age/fitness_goal/bio 四列
- CREATE TABLE height_record 完整 DDL
- INSERT sys_dict_type 和 sys_dict_data：性别(sys_gender)2条 + 健身目标(sys_fitness_goal)6条
- DELETE + REINSERT exercise 表完整 78 条动作数据

- [ ] **步骤 2：同步更新 deploy_v1.0.0.sql**

在 user 表 CREATE TABLE 的 phone 列后追加 4 列，在字典数据 INSERT 后追加性别和健身目标字典，末尾追加 height_record 表 DDL，替换 exercise 数据为完整 78 条。

---

### 任务 2：User 实体扩展 + 字典初始化

**文件：**
- 修改：`d:\softWare\develop\app-myself\fitness\fitness-server\src\main\java\com\zzy\fitnessserver\entity\User.java`
- 修改：`d:\softWare\develop\app-myself\fitness\fitness-server\src\main\java\com\zzy\fitnessserver\config\DataInitializer.java`

- [ ] **步骤 1：User.java 新增 4 个字段**

在 `private String phone;` 之后添加：
```java
private String gender;
private Integer age;
private String fitnessGoal;
private String bio;
```

- [ ] **步骤 2：DataInitializer.java 补充字典初始化**

在 initDictData() 方法中追加 sys_gender 和 sys_fitness_goal 字典类型的检查和初始化逻辑。补充 LambdaQueryWrapper import。

---

### 任务 3：运动肌群知识数据全面扩充 (17 → 78)

**文件：**
- 修改：`d:\softWare\develop\app-myself\fitness\fitness-server\src\main\java\com\zzy\fitnessserver\config\DataInitializer.java`

- [ ] **步骤 1：替换 DataInitializer 中 exerciseService.saveBatch() 数据**

将现有 17 条 Exercise 替换为完整 78 条：
- 胸部肌群: 10个 (杠铃卧推/上斜卧推/下斜卧推/哑铃飞鸟/器械夹胸/绳索夹胸/俯卧撑/双杠臂屈伸胸侧/仰卧上拉/瑞士球卧推)
- 背部肌群: 10个 (引体向上/反手引体/杠铃划船/单臂划船/坐姿绳索划船/T杠划船/高位下拉/直臂下拉/山羊挺身/硬拉)
- 下肢肌群: 12个 (深蹲/前蹲/腿举/腿弯举/腿屈伸/箭步蹲/保加利亚分腿蹲/臀桥/RDL/哈克深蹲/提踵/相扑深蹲)
- 肩部肌群: 10个 (推举/侧平举/前平举/俯身飞鸟/阿诺德推举/面拉/耸肩/upright row/单臂侧平举/器械肩推)
- 手臂肌群: 10个 (弯举/锤式弯举/集中弯举/绳索弯举/仰卧臂屈伸/绳索下压/双杠臂屈伸三头侧/过顶臂屈伸/反握弯举/窄距卧推)
- 核心训练: 8个 (平板支撑/卷腹/俄罗斯转体/死虫/登山者/悬垂抬腿/反向卷腹/侧支撑)
- 全身有氧: 8个 (波比跳/开合跳/高抬腿/跳绳/战绳/拳击跳/爬坡走/登山机)

每条数据包含 name/category/categoryType/muscleGroup/description/professionalTips 完整字段。

---

### 任务 4：HeightRecord 后端重建（5个文件）

**文件：** 全部新建于 `d:\softWare\develop\app-myself\fitness\fitness-server\src\main\java\com\zzy\fitnessserver\`

- [ ] **步骤 1：entity/HeightRecord.java** - 完整实体类，含 id/userId/height(BigDecimal)/recordDate(LocalDate)/recordTime(LocalDateTime)/remark/delFlag/delTime/createBy/createTime/updateBy/updateTime
- [ ] **步骤 2：mapper/HeightRecordMapper.java** - extends BaseMapper<HeightRecord>
- [ ] **步骤 3：service/HeightRecordService.java** - extends IService<HeightRecord>
- [ ] **步骤 4：service/impl/HeightRecordServiceImpl.java** - extends ServiceImpl, @Service
- [ ] **步骤 5：controller/HeightRecordController.java** - 5个端点:
  - GET /api/heights/history → 查询当前用户所有身高记录(按日期时间倒序)
  - POST /api/heights → 新增记录
  - PUT /api/heights/{id} → 更新记录
  - DELETE /api/heights/{id} → 删除记录
  - GET /api/heights/latest → 获取最新一条记录

---

### 任务 5：最近动态聚合 API

**文件：**
- 创建：`d:\softWare\develop\app-myself\fitness\fitness-server\src\main\java\com\zzy\fitnessserver\controller\ActivityController.java`

- [ ] **步骤 1：创建 ActivityController.java**

注入 WorkoutRecordService/WeightRecordService/WaterRecordService/DietRecordService/HeightRecordService。
GET /api/activities/recent?page=&pageSize= 端点实现：
1. 分别查询各表的最新记录（按时间倒序、限制数量 = pageSize）
2. 将结果统一封装为 {type, id, ...各类型特有字段} 格式的列表
3. 按 recordDate/createdAt/time 统一排序后返回分页结果

返回的统一格式示例：
```json
[
  {"type": "workout", "id": 1, "workoutName": "力量训练：胸背", "exerciseCount": 5, "durationMinutes": 45, "createdAt": "2026-04-20T10:00:00"},
  {"type": "weight", "id": 1, "weight": 74.3, "timePeriod": "morning", "recordDate": "2026-04-20"},
  {"type": "water", "id": 1, "amount": 250, "recordTime": "2026-04-20T09:30:00"},
  {"type": "diet", "id": 1, "mealType": "早餐", "foodName": "燕麦粥", "calories": 350, "recordDate": "2026-04-20"},
  {"type": "height", "id": 1, "height": 175.0, "recordDate": "2026-04-19"}
]
```

---

## 自检清单

- [x] 规格覆盖度：任务A(数据扩充)→Task3 ✓ | 任务B(User后端)→Task2 ✓ | 任务C(后端检查)→Task4+Task5 ✓
- [x] 占位符扫描：每个步骤均包含具体代码或明确操作指令
- [x] 类型一致性：HeightRecord 使用 BigDecimal+LocalDate+LocalDateTime 与 weight_record 保持一致风格
- [x] SQL 同步：deploy_v1.0.0.sql 和 migrate_v1.1.0.sql 双重维护
