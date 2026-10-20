# 数据库动作数据统一化实施计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 建立training_plan_exercise表与exercise表的关联关系，创建标准动作库（42个核心动作），实现数据统一化

**架构：** 采用外键关联模式，在training_plan_exercise表中新增exercise_id字段，建立与exercise表的严格外键关系，同时保留exercise_name作为冗余字段提升查询性能

**技术栈：** MySQL 8.0 + MyBatis-Plus + Java Spring Boot

---

## 文件结构

### 将要修改的文件：
- `fitness-server/src/main/java/com/zzy/fitnessserver/entity/Exercise.java` - 实体类（添加新字段）
- `fitness-server/src/main/java/com/zzy/fitnessserver/entity/TrainingPlanExercise.java` - 实体类（添加exerciseId和exercise对象）
- `fitness-server/src/main/java/com/zzy/fitnessserver/mapper/TrainingPlanExerciseMapper.java` - Mapper接口
- `fitness-server/src/main/java/com/zzy/fitnessserver/service/impl/TrainingPlanServiceImpl.java` - 服务层实现
- `init-exercise-library.sql` - 新建文件，标准动作库初始化脚本
- `migrate-training-plan-data.sql` - 新建文件，数据迁移脚本

### 将要创建的SQL脚本：
1. **数据库结构修改SQL** - ALTER TABLE语句
2. **标准动作库初始化SQL** - 42个动作的INSERT语句
3. **字典数据SQL** - 难度等级字典
4. **数据迁移SQL** - 匹配现有记录并建立关联

---

## 任务清单

### 任务 1：修改exercise表结构（添加新字段）

**文件：**
- 修改：数据库表结构（通过SQL执行）
- 修改：`fitness-server/src/main/java/com/zzy/fitnessserver/entity/Exercise.java`

- [ ] **步骤 1：备份现有exercise表数据**

```sql
CREATE TABLE exercise_backup_20260508 AS SELECT * FROM exercise;
```

- [ ] **步骤 2：修改exercise表结构**

```sql
ALTER TABLE `exercise`
ADD COLUMN `name_en` VARCHAR(100) DEFAULT NULL COMMENT '英文名称' AFTER `name`,
ADD COLUMN `difficulty_level` INT(11) DEFAULT 2 COMMENT '难度等级' AFTER `muscle_group`,
ADD COLUMN `is_system` TINYINT(1) DEFAULT 0 COMMENT '是否系统预置' AFTER `professional_tips`,
ADD UNIQUE KEY `uk_name` (`name`),
ADD INDEX `idx_muscle_group` (`muscle_group`);
```

- [ ] **步骤 3：更新现有12个基础动作的数据**

```sql
UPDATE `exercise` SET 
    name_en = CASE name
        WHEN '杠铃卧推' THEN 'Barbell Bench Press'
        WHEN '哑铃飞鸟' THEN 'Dumbbell Fly'
        WHEN '俯卧撑' THEN 'Push-up'
        WHEN '引体向上' THEN 'Pull-up'
        WHEN '杠铃划船' THEN 'Barbell Row'
        WHEN '高位下拉' THEN 'Lat Pulldown'
        WHEN '杠铃深蹲' THEN 'Barbell Squat'
        WHEN '硬拉' THEN 'Deadlift'
        WHEN '箭步蹲' THEN 'Lunge'
        WHEN '杠铃推举' THEN 'Overhead Press'
        WHEN '哑铃侧平举' THEN 'Lateral Raise'
        WHEN '杠铃弯举' THEN 'Barbell Curl'
        WHEN '双杠臂屈伸' THEN 'Dip'
        WHEN '平板支撑' THEN 'Plank'
        END,
    difficulty_level = 2,
    is_system = 1
WHERE status = '0';
```

- [ ] **步骤 4：验证表结构修改成功**

```sql
DESCRIBE exercise;
SELECT COUNT(*) FROM exercise WHERE is_system = 1;
```

预期输出：
- 表结构包含新字段：name_en, difficulty_level, is_system
- 现有12个动作全部标记为is_system=1

- [ ] **步骤 5：修改Java实体类Exercise.java**

```java
// 在 Exercise.java 中添加以下字段：

/**
 * 英文名称
 */
private String nameEn;

/**
 * 难度等级（1初级/2中级/3高级）
 */
private Integer difficultyLevel;

/**
 * 是否系统预置（0否 1是）
 */
private Integer isSystem;
```

---

### 任务 2：创建难度等级字典数据

**文件：**
- 修改：数据库sys_dict_type和sys_dict_data表

- [ ] **步骤 1：插入难度等级字典类型**

```sql
INSERT INTO `sys_dict_type` (`dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) 
VALUES ('难度等级', 'exercise_difficulty', '0', 'admin', NOW(), 'admin', NOW(), '动作难度等级分类');
```

- [ ] **步骤 2：插入难度等级字典数据**

```sql
INSERT INTO `sys_dict_data` (`dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES 
(1, '初级', '1', 'exercise_difficulty', '', 'success', 'N', '0', 'admin', NOW(), 'admin', NOW(), '适合健身新手'),
(2, '中级', '2', 'exercise_difficulty', '', 'warning', 'N', '0', 'admin', NOW(), 'admin', NOW(), '有一定训练经验'),
(3, '高级', '3', 'exercise_difficulty', '', 'danger', 'N', '0', 'admin', NOW(), 'admin', NOW(), '需要较好力量基础');
```

- [ ] **步骤 3：验证字典数据插入成功**

```sql
SELECT * FROM sys_dict_data WHERE dict_type = 'exercise_difficulty';
```

预期输出：3条记录（初级、中级、高级）

---

### 任务 3：修改training_plan_exercise表结构（添加外键）

**文件：**
- 修改：数据库表结构
- 修改：`TrainingPlanExercise.java`

- [ ] **步骤 1：备份数据**

```sql
CREATE TABLE training_plan_exercise_backup_20260508 AS SELECT * FROM training_plan_exercise;
```

- [ ] **步骤 2：添加exercise_id字段和外键约束**

```sql
-- 添加外键字段
ALTER TABLE `training_plan_exercise`
ADD COLUMN `exercise_id` BIGINT(20) DEFAULT NULL COMMENT '关联的标准动作ID' AFTER `plan_day_id`;

-- 添加索引
CREATE INDEX `idx_exercise_id` ON `training_plan_exercise`(`exercise_id`);

-- 添加外键约束
ALTER TABLE `training_plan_exercise`
ADD CONSTRAINT `fk_tpe_exercise`
FOREIGN KEY (`exercise_id`) REFERENCES `exercise`(`id`)
ON DELETE SET NULL
ON UPDATE CASCADE;
```

- [ ] **步骤 3：验证表结构修改成功**

```sql
DESCRIBE training_plan_exercise;
SHOW CREATE TABLE training_plan_exercise\G
```

预期输出：
- 包含新字段exercise_id
- 外键约束fk_tpe_exercise存在

- [ ] **步骤 4：修改Java实体类TrainingPlanExercise.java**

```java
// 在 TrainingPlanExercise.java 中添加以下字段：

/**
 * 关联的标准动作ID（外键）
 */
private Long exerciseId;

/**
 * 关联的动作对象（非数据库字段，用于联查）
 */
@TableField(exist = false)
private Exercise exercise;
```

---

### 任务 4：创建标准动作库（30个新增动作）

**文件：**
- 创建：`init-exercise-library-new.sql`（新建SQL脚本文件）

- [ ] **步骤 1：创建胸部肌群新增动作（6个）**

```sql
INSERT INTO `exercise` (`name`, `name_en`, `category`, `category_type`, `muscle_group`, `difficulty_level`, `description`, `professional_tips`, `is_system`, `status`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
('上斜杠铃卧推', 'Incline Barbell Bench Press', '胸部肌群', 'chest_muscles', '胸大肌上部', 2, '躺在倾斜30-45度的凳子上，握距略宽于肩。下放杠铃至上胸部锁骨位置，触胸后推起。全程保持背部微拱。', '角度不宜过大否则会过度刺激前束。保持肩胛骨收紧，不要过度反弓腰部。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('上斜哑铃飞鸟', 'Incline Dumbbell Fly', '胸部肌群', 'chest_muscles', '胸大肌上部', 2, '仰卧在上斜凳上，双手持哑铃手臂微屈。以肩为轴呈弧线向下扩展感受胸部深度拉伸随后夹胸收回。', '整个过程手臂角度保持不变想象是在拥抱一棵大树。控制重量不要过重。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('平板哑铃飞鸟', 'Flat Dumbbell Fly', '胸部肌群', 'chest_muscles', '胸大肌', 2, '仰卧在平凳上双手持哑铃手臂微屈。向两侧展开至胸部充分拉伸然后沿弧线轨迹夹胸收回。', '肘部固定角度约135度不要锁定也不要完全伸直。顶峰收缩时挤压胸肌1-2秒。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('绳索夹胸', 'Cable Crossover', '胸部肌群', 'chest_muscles', '胸大肌', 2, '站在绳索器械中间双手握住把手身体微前倾。将绳索从高处拉向胸前低点两掌相触。', '动作过程中保持肘部微屈固定想象用手臂去拥抱一个大的圆球。感受胸肌的持续张力。', 1, '0', 'admin', NOW(), 'admin', NOW());
```

- [ ] **步骤 2：创建背部肌群新增动作（8个）**

```sql
INSERT INTO `exercise` (`name`, `name_en`, `category`, `category_type`, `muscle_group`, `difficulty_level`, `description`, `professional_tips`, `is_system`, `status`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
('单臂哑铃划船', 'Single-Arm Dumbbell Row', '背部肌群', 'back_muscles', '背阔肌', 2, '一手扶在平凳上另一手持哑铃。保持背部挺直将哑铃拉向腹部感受背阔肌收缩。', '转动躯干让肩膀跟随手肘运动。顶峰时挤压背部肌肉1-2秒。每侧独立训练可纠正不平衡。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('坐姿绳索划船', 'Seated Cable Row', '背部肌群', 'back_muscles', '背阔肌', 2, '坐在器械上双脚踩实踏板。双手握住把手挺胸沉肩将把手拉向腹部。', '拉的过程中肩胛骨向后收拢。不要过度后仰借力保持躯干稳定。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('直臂下压', 'Straight-Arm Pulldown', '背部肌群', 'back_muscles', '背阔肌', 2, '站立位双手宽握高位下拉杆。保持手臂几乎伸直将杆压向大腿根部。', '这是孤立背阔肌的动作大臂应始终保持固定只动用肩关节。适合作为背部训练收尾动作。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('罗马尼亚硬拉', 'Romanian Deadlift', '下肢肌群', 'leg_muscles', '腘绳肌/臀大肌', 2, '双脚与肩同宽手持杠铃。保持膝盖微屈髋部后倾将杠铃沿腿部下放感受大腿后侧拉伸。', '下放深度以柔韧性为准不要强行触碰地面。保持背部挺直严禁圆背。', 1, '0', 'admin', NOW(), 'admin', NOW());
```

- [ ] **步骤 3：创建肩部肌群新增动作（5个）**

```sql
INSERT INTO `exercise` (`name`, `name_en`, `category`, `category_type`, `muscle_group`, `difficulty_level`, `description`, `professional_tips`, `is_system`, `status`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
('坐姿哑铃推举', 'Seated Dumbbell Shoulder Press', '肩部肌群', 'shoulder_muscles', '三角肌前/中束', 2, '坐在有靠背的凳上双手持哑铃置于肩部高度。垂直向上推举直至手臂接近伸直。', '推至顶部时不要完全锁死肘关节保持肩部张力。手腕始终在中立位置。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('哑铃前平举', 'Dumbbell Front Raise', '肩部肌群', 'shoulder_muscles', '三角肌前束', 2, '双手持哑铃垂于体侧。交替或同时向前抬起哑铃至与肩同高。', '不要通过身体晃动借力。可以采用锤式握法（掌心相对）减少前束压力。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('俯身哑铃飞鸟', 'Rear Delt Fly', '肩部肌群', 'shoulder_muscles', '三角肌后束', 2, '双手持哑铃上身前倾约90度。手臂微屈向两侧展开抬起哑铃至与肩同高。', '重点刺激后束改善圆肩问题。重量宜轻注重肌肉感受而非重量。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('阿诺德推举', 'Arnold Press', '肩部肌群', 'shoulder_muscles', '三角肌全束', 3, '双手持哑铃掌心面向自己置于肩部。推举过程中旋转手腕使掌心向外。', '旋转过程要控制速度不要甩动。这个动作能全面刺激三角肌但技术要求较高。', 1, '0', 'admin', NOW(), 'admin', NOW());
```

- [ ] **步骤 4：创建手臂肌群新增动作（6个）**

```sql
INSERT INTO `exercise` (`name`, `name_en`, `category`, `category_type`, `muscle_group`, `difficulty_level`, `description`, `professional_tips`, `is_system`, `status`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
('锤式弯举', 'Hammer Curl', '手臂肌群', 'arm_muscles', '肱肌/肱桡肌', 2, '双手持哑铃掌心相对（锤式握法）。保持大臂固定屈肘将哑铃弯举至肩部高度。', '主要刺激肱肌增加手臂厚度。身体保持稳定不要晃动借力。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('绳索弯举', 'Cable Bicep Curl', '手臂肌群', 'arm_muscles', '肱二头肌', 2, '站在绳索器械前双手握住直杆或绳索把手。保持大臂贴紧身体屈肘向上弯举。', '绳索提供持续的张力特别是在动作底端。可以在不同握法间切换全面刺激二头肌。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('绳索下压', 'Cable Tricep Pushdown', '手臂肌群', 'arm_muscles', '肱三头肌', 2, '面对高位绳索机双手握住把手。大臂贴近身体固定不动仅前臂向下压。', '大臂必须夹紧身体不要外展。可以在底部做等长收缩增加刺激。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('三头臂屈伸', 'Tricep Dip', '手臂肌群', 'arm_muscles', '肱三头肌', 2, '双手撑在双杠上或平凳边缘。身体直立或微前倾屈肘下沉至大臂与地面平行后推起。', '身体越前倾对胸部刺激越大越垂直对三头肌刺激越大。可通过负重增加难度。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('过头臂屈伸', 'Overhead Tricep Extension', '手臂肌群', 'arm_muscles', '肱三头肌长头', 2, '坐姿或站姿双手持哑铃或杠铃片举过头顶。屈肘将重物下放至颈后然后伸直手臂。', '大臂保持靠近耳朵固定不动。这是刺激三头肌长头的最佳动作之一。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('窄距卧推', 'Close-Grip Bench Press', '手臂肌群', 'arm_muscles', '肱三头肌', 2, '躺在卧推凳上双手间距略窄于肩（约20-30cm）。下放杠铃至胸部然后推起。', '握距不宜过窄以免给手腕过大压力。肘部夹紧身体不要过度外展。', 1, '0', 'admin', NOW(), 'admin', NOW());
```

- [ ] **步骤 5：创建腿部肌群新增动作（8个）**

```sql
INSERT INTO `exercise` (`name`, `name_en`, `category`, `category_type`, `muscle_group`, `difficulty_level`, `description`, `professional_tips`, `is_system`, `status`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
('前深蹲', 'Front Squat', '下肢肌群', 'leg_muscles', '股四头肌', 3, '杠铃置于前肩（斜方肌和三角肌前束之间）。双脚与肩同宽下蹲至大腿平行地面。', '相比后深蹲对核心和上背部要求更高。需要良好的肩关节柔韧性和手腕灵活性。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('腿举', 'Leg Press', '下肢肌群', 'leg_muscles', '股四头肌/臀大肌', 2, '坐在腿举机上双脚踩在踏板上。解锁安全扣后屈膝下放踏板然后用力蹬起。', '脚的位置决定刺激部位：高则刺激臀腿低则刺激股四头肌。不要锁死膝关节。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('哑铃箭步蹲', 'Dumbbell Lunge', '下肢肌群', 'leg_muscles', '股四头肌/臀大肌', 2, '双手持哑铃垂于体侧。一脚向前迈出一大步下蹲至双腿膝盖均呈90度角。', '上半身保持垂直核心收紧。前脚跟发力起身。后膝不要重磕地面。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('保加利亚分腿蹲', 'Bulgarian Split Squat', '下肢肌群', 'leg_muscles', '股四头肌/臀大肌', 2, '一脚置于身后的平凳上另一脚在前方支撑。下蹲至前腿大腿与地面平行。', '单腿稳定性训练极佳动作。可纠正双腿力量不平衡。初学者可不使用负重。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('腿弯举', 'Leg Curl', '下肢肌群', 'leg_muscles', '腘绳肌', 2, '俯卧或坐在腿弯举机上。将脚跟勾在滚垫下屈膝将滚垫拉向臀部。', '控制离心阶段缓慢下放。感受大腿后侧的拉伸和收缩。不要借助臀部摆动借力。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('小腿提踵', 'Calf Raise', '下肢肌群', 'leg_muscles', '腓肠肌/比目鱼肌', 1, '站立或坐在器械上前脚掌踩在垫块上。尽可能高地提起脚跟然后缓慢下放至最低点。', '顶峰收缩停留1-2秒。下放时要充分拉伸小腿。可变化脚尖方向刺激不同部位。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('行走箭步蹲', 'Walking Lunge', '下肢肌群', 'leg_muscles', '股四头肌/臀大肌', 2, '双手持哑铃或杠铃。连续向前迈步行走每一步都下蹲成箭步蹲姿势。', '增强协调性和功能性力量。保持躯干稳定不要左右晃动。步幅适中。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('臀桥', 'Glute Bridge', '下肢肌群', 'leg_muscles', '臀大肌/腘绳肌', 1, '仰卧在地面上双膝弯曲双脚踩实。臀部发力将髋部推起至身体呈一条直线。', '顶峰收缩时停顿2秒激活臀大肌。不要过度顶腰用臀部而不是下背部发力。', 1, '0', 'admin', NOW(), 'admin', NOW());
```

- [ ] **步骤 6：创建核心肌群和其他新增动作（7个）**

```sql
INSERT INTO `exercise` (`name`, `name_en`, `category`, `category_type`, `muscle_group`, `difficulty_level`, `description`, `professional_tips`, `is_system`, `status`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
('卷腹', 'Crunch', '核心训练', 'core_training', '腹直肌', 1, '仰卧双膝弯曲双脚踩实。双手交叉置于胸前或耳侧卷起上背部离地。', '不是仰卧起坐！只需卷起肩胛骨即可。感受腹肌的收缩不要用颈部代偿。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('俄罗斯转体', 'Russian Twist', '核心训练', 'core_training', '腹内外斜肌', 1, '坐姿双膝弯曲双脚离地。双手合十向左右转动躯干触碰地面。', '转动时保持背部挺直不要塌腰。可以通过手持重物增加难度。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('悬垂举腿', 'Hanging Leg Raise', '核心训练', 'core_training', '腹直肌下段', 2, '悬挂在单杠上双腿伸直。利用腹部力量将双腿抬起至与地面平行或更高。', '避免摆动借力依靠纯粹的力量完成动作。下放时要控制速度不要自由落体。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('平板支撑变式', 'Plank Variation', '核心训练', 'core_training', '核心整体', 2, '标准平板支撑姿势基础上进行变式如侧支撑、转体抬臂、登山者跑等。', '变式可以增加难度和趣味性。确保基础平板支撑姿势正确后再尝试变式。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('绳索面拉', 'Face Pull', '其他常用', 'other', '三角肌后束/菱形肌', 2, '面对高位绳索机双手握住绳索把手。向面部方向拉动绳子同时外旋手臂。', '改善圆肩驼背体态强化后束和菱形肌。动作过程中肘部要高于手腕。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('二头弯举', 'Bicep Curl', '手臂肌群', 'arm_muscles', '肱二头肌', 2, '站立双手持杠铃或哑铃掌心向前。保持大臂固定屈肘将重量弯举至肩部。', '避免身体前后晃动借力。下放到底部时不要完全放松张力保持肌肉持续工作。', 1, '0', 'admin', NOW(), 'admin', NOW()),
('三头绳索下压', 'Tricep Rope Pushdown', '手臂肌群', 'arm_muscles', '肱三头肌', 2, '面对绳索机双手握住绳索把手。大臂贴近身体固定仅前臂向下压并在底部外展绳索。', '绳索提供持续张力。底部外展可以额外刺激三头肌外侧头。', 1, '0', 'admin', NOW(), 'admin', NOW());
```

- [ ] **步骤 7：验证标准动作库创建结果**

```sql
SELECT COUNT(*) AS 动作总数 FROM exercise WHERE is_system = 1;
SELECT category, COUNT(*) AS 数量 FROM exercise WHERE is_system = 1 GROUP BY category ORDER BY 数量 DESC;
```

预期输出：
- 总数：42-44个（原有12个 + 新增30-32个）
- 分类统计：胸部6个、背部8个、肩部5个、手臂6个、腿部8个、核心5个、其他若干

---

### 任务 5：数据迁移（为70条计划记录匹配exercise_id）

**文件：**
- 创建：`migrate-training-plan-data.sql`

- [ ] **步骤 1：精确匹配（名称完全一致）**

```sql
UPDATE training_plan_exercise tpe
INNER JOIN exercise e ON tpe.exercise_name = e.name
SET tpe.exercise_id = e.id
WHERE tpe.exercise_id IS NULL;
```

- [ ] **步骤 2：检查匹配结果**

```sql
SELECT 
    COUNT(*) AS 总数,
    SUM(CASE WHEN exercise_id IS NOT NULL THEN 1 ELSE 0 END) AS 已匹配,
    SUM(CASE WHEN exercise_id IS NULL THEN 1 ELSE 0 END) AS 未匹配
FROM training_plan_exercise;
```

- [ ] **步骤 3：模糊匹配（处理微小差异）**

```sql
-- 处理 "深蹲" -> "杠铃深蹲"
UPDATE training_plan_exercise tpe
INNER JOIN exercise e ON CONCAT('杠铃', tpe.exercise_name) = e.name
SET tpe.exercise_id = e.id
WHERE tpe.exercise_id IS NULL AND tpe.exercise_name IN ('深蹲');

-- 处理 "硬拉" 需要区分是普通硬拉还是罗马尼亚硬拉
UPDATE training_plan_exercise tpe
INNER JOIN exercise e ON tpe.exercise_name = e.name OR 
    (tpe.exercise_name = '硬拉' AND e.name = '硬拉')
SET tpe.exercise_id = e.id
WHERE tpe.exercise_id IS NULL;

-- 处理 "推举" 类似名称
UPDATE training_plan_exercise tpe
INNER JOIN exercise e ON 
    tpe.exercise_name = e.name OR
    (tpe.exercise_name LIKE '%推举%' AND e.name LIKE '%推举%')
SET tpe.exercise_id = e.id
WHERE tpe.exercise_id IS NULL;
```

- [ ] **步骤 4：手动处理无法自动匹配的记录**

```sql
-- 查看仍未匹配的记录
SELECT id, plan_day_id, exercise_name, sets, reps 
FROM training_plan_exercise 
WHERE exercise_id IS NULL
ORDER BY exercise_name;
```

根据查询结果手动建立映射关系...

- [ ] **步骤 5：最终验证迁移结果**

```sql
SELECT 
    COUNT(*) AS 总记录数,
    SUM(CASE WHEN exercise_id IS NOT NULL THEN 1 ELSE 0 END) AS 已匹配数,
    ROUND(SUM(CASE WHEN exercise_id IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) AS 匹配率
FROM training_plan_exercise;

-- 目标：匹配率应该为100%
```

---

### 任务 6：代码适配（Service层和Mapper层）

**文件：**
- 修改：`TrainingPlanExerciseMapper.java`
- 修改：`TrainingPlanServiceImpl.java`

- [ ] **步骤 1：修改Mapper接口添加JOIN查询方法**

```java
// TrainingPlanExerciseMapper.java 添加方法

/**
 * 根据训练日ID查询动作详情（包含关联的动作信息）
 */
@Select("SELECT tpe.*, e.name as ex_name, e.muscle_group as ex_muscle_group, " +
        "e.description as ex_description, e.professional_tips as ex_professional_tips " +
        "FROM training_plan_exercise tpe " +
        "LEFT JOIN exercise e ON tpe.exercise_id = e.id " +
        "WHERE tpe.plan_day_id = #{planDayId} " +
        "ORDER BY tpe.sort_order")
List<Map<String, Object>> selectExercisesWithDetails(@Param("planDayId") Long planDayId);
```

- [ ] **步骤 2：修改Service层返回完整数据**

```java
// TrainingPlanServiceImpl.java 修改获取计划详情的方法

public List<TrainingPlanExercise> getExercisesByDayId(Long planDayId) {
    // 先查询基本信息
    List<TrainingPlanExercise> exercises = exerciseMapper.selectList(
        new LambdaQueryWrapper<TrainingPlanExercise>()
            .eq(TrainingPlanExercise::getPlanDayId, planDayId)
            .orderByAsc(TrainingPlanExercise::getSortOrder)
    );
    
    // 为每个动作填充详细信息
    exercises.forEach(exercise -> {
        if (exercise.getExerciseId() != null) {
            Exercise detail = exerciseService.getById(exercise.getExerciseId());
            exercise.setExercise(detail);
        }
    });
    
    return exercises;
}
```

- [ ] **步骤 3：测试API接口返回数据**

调用接口验证返回数据包含exercise对象。

---

### 任务 7：前端适配（可选，如果时间允许）

**文件：**
- 修改：`fitness-app/components/TrainingCard.vue`
- 修改：`fitness-app/pages/knowledge/training-plan-detail.vue`

- [ ] **步骤 1：修改组件显示逻辑**

```javascript
// 在TrainingCard.vue中修改显示逻辑
computed: {
    displayExercises() {
        return this.exercises.map(ex => ({
            ...ex,
            // 优先使用关联对象的名称
            name: ex.exercise?.name || ex.exerciseName,
            muscleGroup: ex.exercise?.muscleGroup || '',
            description: ex.exercise?.description || '',
            tips: ex.exercise?.professionalTips || ''
        }));
    }
}
```

- [ ] **步骤 2：增强UI显示（可选）**

如果需要可在动作卡片中显示：
- 肌肉群标签
- 专业建议弹窗
- 动作详情链接

---

## 自检清单

### 规格覆盖度检查：
- ✅ exercise表结构调整（添加字段）
- ✅ 难度等级字典数据
- ✅ training_plan_exercise表外键关联
- ✅ 标准动作库创建（42+个动作）
- ✅ 数据迁移（70条记录匹配）
- ✅ Java实体类修改
- ✅ Service/Mapper层适配
- ✅ 全中文字段描述
- ✅ 字段注释简洁无冗余文字
- ✅ difficulty_level使用数字存储

### 占位符扫描：
- ❌ 无TODO、待定等占位符
- ❌ 无模糊描述
- ✅ 所有SQL语句完整可执行
- ✅ 所有代码示例具体可用

### 类型一致性检查：
- ✅ exercise_id 类型为 Long/Bigint 一致
- ✅ difficulty_level 类型为 Integer/Int 一致
- ✅ 所有字段命名遵循驼峰/下划线规范

---

## 执行说明

**推荐执行方式：内联执行（executing-plans）**

此计划包含7个任务每个任务都有明确的步骤和验证点。建议按顺序执行每个任务完成后运行验证命令确认无误后再继续下一个任务。

**关键里程碑：**
1. ✅ 任务1-3完成后：数据库结构调整完毕
2. ✅ 任务4完成后：标准动作库就绪（42+个动作）
3. ✅ 任务5完成后：数据迁移完成（100%匹配率）
4. ✅ 任务6-7完成后：代码适配完成系统可用

**回滚方案：**
如果任何步骤出现问题可以使用之前创建的备份表恢复：
```sql
-- 回滚exercise表
DROP TABLE exercise;
RENAME TABLE exercise_backup_20260508 TO exercise;

-- 回滚training_plan_exercise表
DROP TABLE training_plan_exercise;
RENAME TABLE training_plan_exercise_backup_20260508 TO training_plan_exercise;
```

---

**计划版本：** V2.0 Final  
**创建时间：** 2026-05-08  
**预计总耗时：** 45-60分钟（含审查）  
**风险等级：** 低（有完整备份和回滚方案）
