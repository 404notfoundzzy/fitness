-- ============================================================
-- 自定义训练计划完善 - 数据库迁移脚本 (V3.0)
-- 时间: 2026-05-28
-- 说明: exercise表支持用户自定义动作 + training_plan_exercise改用exercise_id强关联
-- 核心变更:
--   1. exercise表新增 user_id / del_flag / del_time 字段，支持用户自定义动作和软删除
--   2. training_plan_exercise 新增 exercise_id 列，所有动作必须关联exercise表
--   3. 数据迁移：将现有exercise_name匹配到exercise_id，无法匹配的创建自定义exercise记录
--   4. 新增字典数据：删除标志(del_flag)、动作来源(exercise_source)
--   5. 移除旧唯一约束uk_name，改为复合索引
-- 注意: 每个ALTER操作都有存在性检查，可重复执行
-- ============================================================

USE `fitness`;

-- ==================== 步骤0: 备份 ====================

CREATE TABLE IF NOT EXISTS `exercise_backup_v3_20260528` AS SELECT * FROM `exercise`;
CREATE TABLE IF NOT EXISTS `training_plan_exercise_backup_v3_20260528` AS SELECT * FROM `training_plan_exercise`;

SELECT 'backup_done' AS status,
       (SELECT COUNT(*) FROM `exercise_backup_v3_20260528`) AS exercise_count,
       (SELECT COUNT(*) FROM `training_plan_exercise_backup_v3_20260528`) AS plan_exercise_count;

-- ==================== 步骤1: exercise表新增字段 ====================

-- 1.1 新增 user_id
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'fitness' AND TABLE_NAME = 'exercise' AND COLUMN_NAME = 'user_id';

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `exercise` ADD COLUMN `user_id` BIGINT(20) DEFAULT NULL COMMENT ''user_id'' AFTER `id`',
    'SELECT ''skip_user_id'' AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.2 新增 del_flag
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'fitness' AND TABLE_NAME = 'exercise' AND COLUMN_NAME = 'del_flag';

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `exercise` ADD COLUMN `del_flag` CHAR(1) DEFAULT ''0'' COMMENT ''del_flag'' AFTER `difficulty_level`',
    'SELECT ''skip_del_flag'' AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.3 新增 del_time
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'fitness' AND TABLE_NAME = 'exercise' AND COLUMN_NAME = 'del_time';

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `exercise` ADD COLUMN `del_time` DATETIME DEFAULT NULL COMMENT ''del_time'' AFTER `del_flag`',
    'SELECT ''skip_del_time'' AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.4 更新现有系统预置动作标记
UPDATE `exercise`
SET `is_system` = 1, `user_id` = NULL
WHERE `is_system` IS NULL OR `is_system` = 0;

SELECT CONCAT('step1_done: ', ROW_COUNT(), ' system exercises marked') AS status;

-- 1.5 新增索引 idx_user_id
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'fitness' AND TABLE_NAME = 'exercise' AND INDEX_NAME = 'idx_user_id';

SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE `exercise` ADD INDEX `idx_user_id` (`user_id`)',
    'SELECT ''skip_idx_user_id'' AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.6 新增索引 idx_del_flag
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'fitness' AND TABLE_NAME = 'exercise' AND INDEX_NAME = 'idx_del_flag';

SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE `exercise` ADD INDEX `idx_del_flag` (`del_flag`)',
    'SELECT ''skip_idx_del_flag'' AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.7 新增复合索引 idx_user_name_del (自定义动作查重)
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'fitness' AND TABLE_NAME = 'exercise' AND INDEX_NAME = 'idx_user_name_del';

SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE `exercise` ADD INDEX `idx_user_name_del` (`user_id`, `name`, `del_flag`)',
    'SELECT ''skip_idx_user_name_del'' AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.8 新增复合索引 idx_del_system_user (搜索可见动作)
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'fitness' AND TABLE_NAME = 'exercise' AND INDEX_NAME = 'idx_del_system_user';

SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE `exercise` ADD INDEX `idx_del_system_user` (`del_flag`, `is_system`, `user_id`)',
    'SELECT ''skip_idx_del_system_user'' AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.9 移除唯一约束 uk_name
SET @uk_exists = 0;
SELECT COUNT(*) INTO @uk_exists
FROM information_schema.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = 'fitness' AND TABLE_NAME = 'exercise' AND CONSTRAINT_NAME = 'uk_name' AND CONSTRAINT_TYPE = 'UNIQUE';

SET @sql = IF(@uk_exists > 0,
    'ALTER TABLE `exercise` DROP INDEX `uk_name`',
    'SELECT ''skip_uk_name'' AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'step1_complete: exercise table indexes adjusted' AS status;

-- ==================== 步骤2: training_plan_exercise 新增 exercise_id 列 ====================

-- 2.1 新增 exercise_id 列（先允许NULL，数据迁移后再改为NOT NULL）
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'fitness' AND TABLE_NAME = 'training_plan_exercise' AND COLUMN_NAME = 'exercise_id';

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `training_plan_exercise` ADD COLUMN `exercise_id` BIGINT(20) DEFAULT NULL COMMENT ''exercise_id'' AFTER `plan_day_id`',
    'SELECT ''skip_exercise_id'' AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2.2 新增 exercise_id 索引
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'fitness' AND TABLE_NAME = 'training_plan_exercise' AND INDEX_NAME = 'idx_exercise_id';

SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE `training_plan_exercise` ADD INDEX `idx_exercise_id` (`exercise_id`)',
    'SELECT ''skip_idx_exercise_id'' AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'step2_complete: exercise_id column added' AS status;

-- ==================== 步骤3: 数据迁移 - 填充 exercise_id ====================

-- 3.1 精确匹配：exercise_name -> exercise.id
UPDATE `training_plan_exercise` tpe
INNER JOIN `exercise` e ON tpe.exercise_name = e.name AND e.del_flag = '0'
SET tpe.exercise_id = e.id
WHERE tpe.exercise_id IS NULL;

SELECT CONCAT('step3.1_exact_match: ', ROW_COUNT(), ' rows updated') AS status;

-- 3.2 为未匹配的记录创建对应的 exercise 记录
INSERT INTO `exercise` (`user_id`, `name`, `category`, `category_type`, `muscle_group`, `description`, `professional_tips`, `difficulty_level`, `is_system`, `del_flag`, `create_by`, `create_time`, `update_by`, `update_time`)
SELECT
    NULL AS user_id,
    tpe.exercise_name AS name,
    'custom' AS category,
    NULL AS category_type,
    NULL AS muscle_group,
    CONCAT('auto-created: ', tpe.exercise_name) AS description,
    NULL AS professional_tips,
    2 AS difficulty_level,
    0 AS is_system,
    '0' AS del_flag,
    tpe.create_by,
    NOW() AS create_time,
    tpe.update_by,
    NOW() AS update_time
FROM `training_plan_exercise` tpe
LEFT JOIN `exercise` e ON tpe.exercise_name = e.name AND e.del_flag = '0'
WHERE tpe.exercise_id IS NULL
  AND e.id IS NULL
  AND tpe.exercise_name IS NOT NULL
  AND tpe.exercise_name != ''
  AND NOT EXISTS (
      SELECT 1 FROM `exercise` e2
      WHERE e2.name = tpe.exercise_name AND e2.del_flag = '0'
  );

SELECT CONCAT('step3.2_auto_create: ', ROW_COUNT(), ' exercise records created') AS status;

-- 3.3 二次匹配
UPDATE `training_plan_exercise` tpe
INNER JOIN `exercise` e ON tpe.exercise_name = e.name AND e.del_flag = '0'
SET tpe.exercise_id = e.id
WHERE tpe.exercise_id IS NULL;

SELECT CONCAT('step3.3_second_match: ', ROW_COUNT(), ' rows updated') AS status;

-- 3.4 最终检查
SELECT
    COUNT(*) AS unmatched_count
FROM `training_plan_exercise` tpe
WHERE tpe.exercise_id IS NULL;

-- ==================== 步骤4: exercise_id 改为 NOT NULL ====================

-- 4.1 移除旧外键约束（如果存在）
SET @fk_exists = 0;
SELECT COUNT(*) INTO @fk_exists
FROM information_schema.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = 'fitness' AND TABLE_NAME = 'training_plan_exercise'
  AND CONSTRAINT_NAME = 'fk_tpe_exercise' AND CONSTRAINT_TYPE = 'FOREIGN KEY';

SET @sql = IF(@fk_exists > 0,
    'ALTER TABLE `training_plan_exercise` DROP FOREIGN KEY `fk_tpe_exercise`',
    'SELECT ''skip_fk_tpe_exercise'' AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4.2 将 exercise_id 改为 NOT NULL
ALTER TABLE `training_plan_exercise`
MODIFY COLUMN `exercise_id` BIGINT(20) NOT NULL COMMENT 'exercise_id FK to exercise table';

SELECT 'step4_complete: exercise_id set to NOT NULL' AS status;

-- ==================== 步骤5: 字典数据补充 ====================

-- 5.1 删除标志字典
INSERT INTO `sys_dict_type` (`dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`)
VALUES ('del_flag', 'del_flag', '0', 'admin', NOW(), 'admin', NOW(), 'soft delete flag')
ON DUPLICATE KEY UPDATE `dict_name` = VALUES(`dict_name`), `remark` = VALUES(`remark`);

INSERT INTO `sys_dict_data` (`dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES
(1, 'normal', '0', 'del_flag', '', 'success', 'Y', '0', 'admin', NOW(), 'admin', NOW(), 'record exists'),
(2, 'deleted', '2', 'del_flag', '', 'danger', 'N', '0', 'admin', NOW(), 'admin', NOW(), 'record soft deleted')
ON DUPLICATE KEY UPDATE `dict_label` = VALUES(`dict_label`), `remark` = VALUES(`remark`);

SELECT 'step5.1_complete: del_flag dictionary' AS status;

-- 5.2 动作来源字典
INSERT INTO `sys_dict_type` (`dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`)
VALUES ('exercise_source', 'exercise_source', '0', 'admin', NOW(), 'admin', NOW(), 'exercise source type')
ON DUPLICATE KEY UPDATE `dict_name` = VALUES(`dict_name`), `remark` = VALUES(`remark`);

INSERT INTO `sys_dict_data` (`dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES
(1, 'system', 'system', 'exercise_source', '', 'primary', 'N', '0', 'admin', NOW(), 'admin', NOW(), 'system built-in exercise'),
(2, 'user', 'user', 'exercise_source', '', 'warning', 'N', '0', 'admin', NOW(), 'admin', NOW(), 'user custom exercise')
ON DUPLICATE KEY UPDATE `dict_label` = VALUES(`dict_label`), `remark` = VALUES(`remark`);

SELECT 'step5.2_complete: exercise_source dictionary' AS status;

-- ==================== 步骤6: 验证 ====================

SELECT 'exercise_table_columns' AS verify_item;
SELECT
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'fitness' AND TABLE_NAME = 'exercise'
ORDER BY ORDINAL_POSITION;

SELECT 'training_plan_exercise_columns' AS verify_item;
SELECT
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'fitness' AND TABLE_NAME = 'training_plan_exercise'
ORDER BY ORDINAL_POSITION;

SELECT 'data_integrity' AS verify_item;
SELECT
    (SELECT COUNT(*) FROM `exercise`) AS total_exercises,
    (SELECT COUNT(*) FROM `exercise` WHERE `is_system` = 1) AS system_exercises,
    (SELECT COUNT(*) FROM `exercise` WHERE `is_system` = 0) AS custom_exercises,
    (SELECT COUNT(*) FROM `exercise` WHERE `del_flag` = '2') AS soft_deleted,
    (SELECT COUNT(*) FROM `training_plan_exercise`) AS total_plan_exercises,
    (SELECT COUNT(*) FROM `training_plan_exercise` WHERE `exercise_id` IS NOT NULL) AS linked_count;

SELECT 'dictionary_data' AS verify_item;
SELECT
    dict_type,
    dict_label,
    dict_value,
    remark
FROM `sys_dict_data`
WHERE `dict_type` IN ('del_flag', 'exercise_source')
  AND `status` = '0'
ORDER BY `dict_type`, `dict_sort`;

SELECT 'MIGRATION_V3_COMPLETE' AS final_status;
