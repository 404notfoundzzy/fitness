-- ============================================================
-- 数据库动作数据统一化 - 结构修改脚本
-- 时间：2026-05-08
-- 说明：修改exercise和training_plan_exercise表结构
-- ============================================================

-- 步骤1：备份现有数据
CREATE TABLE IF NOT EXISTS exercise_backup_20260508 AS SELECT * FROM exercise;
CREATE TABLE IF NOT EXISTS training_plan_exercise_backup_20260508 AS SELECT * FROM training_plan_exercise;

SELECT '✓ 备份完成' AS 状态, 
       (SELECT COUNT(*) FROM exercise_backup_20260508) AS Exercise记录数,
       (SELECT COUNT(*) FROM training_plan_exercise_backup_20260508) AS PlanExercise记录数;

-- 步骤2：修改exercise表结构
ALTER TABLE `exercise`
ADD COLUMN `name_en` VARCHAR(100) DEFAULT NULL COMMENT '英文名称' AFTER `name`,
ADD COLUMN `difficulty_level` INT(11) DEFAULT 2 COMMENT '难度等级' AFTER `muscle_group`,
ADD COLUMN `is_system` TINYINT(1) DEFAULT 0 COMMENT '是否系统预置' AFTER `professional_tips`,
ADD UNIQUE KEY `uk_name` (`name`),
ADD INDEX `idx_muscle_group` (`muscle_group`);

SELECT '✓ Exercise表结构修改完成' AS 状态;

-- 步骤3：更新现有12个基础动作的数据
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

SELECT '✓ 现有数据更新完成' AS 状态, COUNT(*) AS 已更新记录数 FROM exercise WHERE is_system = 1;

-- 步骤4：插入难度等级字典数据
INSERT INTO `sys_dict_type` (`dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) 
VALUES ('难度等级', 'exercise_difficulty', '0', 'admin', NOW(), 'admin', NOW(), '动作难度等级分类')
ON DUPLICATE KEY UPDATE dict_name = VALUES(dict_name);

INSERT INTO `sys_dict_data` (`dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES 
(1, '初级', '1', 'exercise_difficulty', '', 'success', 'N', '0', 'admin', NOW(), 'admin', NOW(), '适合健身新手'),
(2, '中级', '2', 'exercise_difficulty', '', 'warning', 'N', '0', 'admin', NOW(), 'admin', NOW(), '有一定训练经验'),
(3, '高级', '3', 'exercise_difficulty', '', 'danger', 'N', '0', 'admin', NOW(), 'admin', NOW(), '需要较好力量基础')
ON DUPLICATE KEY UPDATE dict_label = VALUES(dict_label);

SELECT '✓ 字典数据插入完成' AS 状态;

-- 步骤5：修改training_plan_exercise表结构（添加外键）
ALTER TABLE `training_plan_exercise`
ADD COLUMN `exercise_id` BIGINT(20) DEFAULT NULL COMMENT '关联的标准动作ID' AFTER `plan_day_id`;

CREATE INDEX `idx_exercise_id` ON `training_plan_exercise`(`exercise_id`);

ALTER TABLE `training_plan_exercise`
ADD CONSTRAINT `fk_tpe_exercise`
FOREIGN KEY (`exercise_id`) REFERENCES `exercise`(`id`)
ON DELETE SET NULL
ON UPDATE CASCADE;

SELECT '✓ TrainingPlanExercise表结构修改完成' AS 状态;

-- 最终验证
SELECT '═══════════════════════════════════════' AS '';
SELECT '          数据库结构修改完成！          ' AS 结果;
SELECT '═══════════════════════════════════════' AS '';

SELECT 'Exercise表字段' AS 表名, COUNT(*) AS 字段数 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'fitness' AND TABLE_NAME = 'exercise'
UNION ALL
SELECT 'TrainingPlanExercise表字段' AS 表名, COUNT(*) AS 字段数 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'fitness' AND TABLE_NAME = 'training_plan_exercise';

SELECT '外键约束' AS 类型, CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME 
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'fitness' AND TABLE_NAME = 'training_plan_exercise' AND REFERENCED_TABLE_NAME IS NOT NULL;
