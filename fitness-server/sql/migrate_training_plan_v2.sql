-- ========================================
-- 训练计划模块 V2.0 升级脚本
-- 版本: v2.0.0
-- 创建时间: 2026-05-06
-- 说明: 用户激活计划、训练进度追踪、自定义计划管理
-- ========================================

-- =============================================
-- 1. 为 training_plan 表添加 plan_type 字段
-- =============================================
ALTER TABLE `training_plan`
ADD COLUMN `plan_type` TINYINT(1) NOT NULL DEFAULT 0
    COMMENT '计划类型(0用户创建 1系统预置)'
AFTER `source`;

-- 迁移现有数据：根据 is_preset 字段设置 plan_type（如果字段存在）
-- UPDATE `training_plan` SET `plan_type` = 1 WHERE `is_preset` = 1;
-- UPDATE `training_plan` SET `plan_type` = 0 WHERE `is_preset` = 0 OR `is_preset` IS NULL;

-- 删除已废弃的 is_preset 字段（已被 plan_type 替代）
-- ALTER TABLE `training_plan` DROP INDEX `idx_is_preset`, DROP COLUMN `is_preset`;

-- =============================================
-- 2. 创建 user_active_plan 表（用户激活计划）
-- =============================================
DROP TABLE IF EXISTS `user_active_plan`;
CREATE TABLE `user_active_plan` (
    `id`                  BIGINT(20)   NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    `user_id`             BIGINT(20)   NOT NULL                     COMMENT '用户ID',
    `plan_id`             BIGINT(20)   NOT NULL                     COMMENT '关联的训练计划ID',
    `status`              VARCHAR(20)  NOT NULL DEFAULT 'active'    COMMENT '状态(active活跃/paused暂停/completed已完成)',
    `start_date`          DATE         NOT NULL                     COMMENT '计划开始日期',
    `end_date`            DATE         DEFAULT NULL                 COMMENT '预计/实际结束日期',
    `current_day`         INT(11)      DEFAULT 1                    COMMENT '当前进行到第几天',
    `total_progress`      DECIMAL(5,2) DEFAULT 0.00                 COMMENT '整体完成进度(0-100)',
    `completed_days`      JSON         DEFAULT NULL                 COMMENT '已完成的训练日(JSON数组)',
    `notes`               VARCHAR(500) DEFAULT NULL                 COMMENT '用户备注',
    `create_by`           VARCHAR(64)  DEFAULT ''                   COMMENT '创建者',
    `create_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP    COMMENT '创建时间',
    `update_by`           VARCHAR(64)  DEFAULT ''                   COMMENT '更新者',
    `update_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_active` (`user_id`, `status`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_plan_id` (`plan_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户激活计划表';

-- =============================================
-- 3. 创建 workout_exercise_detail 表（动作执行详情）
-- =============================================
DROP TABLE IF EXISTS `workout_exercise_detail`;
CREATE TABLE `workout_exercise_detail` (
    `id`                  BIGINT(20)   NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    `workout_record_id`   BIGINT(20)   NOT NULL                     COMMENT '关联的workout_record ID',
    `plan_exercise_id`    BIGINT(20)   DEFAULT NULL                 COMMENT '关联的计划动作ID(可为空)',
    `exercise_name`       VARCHAR(100) NOT NULL                     COMMENT '动作名称',
    `set_number`          INT(11)      NOT NULL                     COMMENT '第几组',
    `target_reps`         VARCHAR(20)  DEFAULT NULL                 COMMENT '目标次数',
    `actual_reps`         INT(11)      DEFAULT NULL                 COMMENT '实际完成次数',
    `weight_kg`           DECIMAL(6,2) DEFAULT NULL                 COMMENT '使用的重量(kg)',
    `is_completed`        TINYINT(1)   DEFAULT 0                    COMMENT '是否完成(0否 1是)',
    `rest_seconds`        INT(11)      DEFAULT 60                   COMMENT '休息时间(秒)',
    `notes`               VARCHAR(300) DEFAULT NULL                 COMMENT '备注/技巧提示',
    `sort_order`          INT(11)      DEFAULT 0                    COMMENT '排序号',
    `create_by`           VARCHAR(64)  DEFAULT ''                   COMMENT '创建者',
    `create_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP    COMMENT '创建时间',
    `update_by`           VARCHAR(64)  DEFAULT ''                   COMMENT '更新者',
    `update_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_workout_record_id` (`workout_record_id`),
    INDEX `idx_plan_exercise_id` (`plan_exercise_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='训练动作执行详情表';

-- =============================================
-- 4. 改造 workout_record 表（添加新字段）
-- =============================================
ALTER TABLE `workout_record` 
ADD COLUMN `plan_id`             BIGINT(20)   DEFAULT NULL COMMENT '关联的训练计划ID' AFTER `status`,
ADD COLUMN `plan_day_id`         BIGINT(20)   DEFAULT NULL COMMENT '关联的训练日ID' AFTER `plan_id`,
ADD COLUMN `day_number`          INT(11)      DEFAULT NULL COMMENT '第几天(1-7)' AFTER `plan_day_id`,
ADD COLUMN `training_type`       VARCHAR(20)  DEFAULT 'free' COMMENT '训练类型(plan按计划/free自由训练)' AFTER `day_number`,
ADD INDEX `idx_plan_id` (`plan_id`),
ADD INDEX `idx_plan_day_id` (`plan_day_id`),
ADD INDEX `idx_training_type` (`training_type`);

-- =============================================
-- 5. 添加字典数据
-- =============================================

-- 5.1 训练计划类型字典
INSERT INTO `sys_dict_type` (`dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) 
VALUES 
('训练计划类型', 'training_plan_type', '0', 'admin', NOW(), 'admin', NOW(), '区分系统预置和用户自定义计划')
ON DUPLICATE KEY UPDATE `update_time` = NOW();

INSERT INTO `sys_dict_data` (`dict_sort`, `dict_label`, `dict_value`, `dict_type`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`) 
VALUES 
(1, '用户创建', '0', 'training_plan_type', 'Y', '0', 'admin', NOW(), 'admin', NOW()),
(2, '系统预置', '1', 'training_plan_type', 'N', '0', 'admin', NOW(), 'admin', NOW())
ON DUPLICATE KEY UPDATE `update_time` = NOW();

-- 5.2 激活计划状态字典
INSERT INTO `sys_dict_type` (`dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) 
VALUES 
('激活计划状态', 'active_plan_status', '0', 'admin', NOW(), 'admin', NOW(), '用户激活的计划状态')
ON DUPLICATE KEY UPDATE `update_time` = NOW();

INSERT INTO `sys_dict_data` (`dict_sort`, `dict_label`, `dict_value`, `dict_type`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`) 
VALUES 
(1, '活跃', 'active', 'active_plan_status', 'Y', '0', 'admin', NOW(), 'admin', NOW()),
(2, '暂停', 'paused', 'active_plan_status', 'N', '0', 'admin', NOW(), 'admin', NOW()),
(3, '已完成', 'completed', 'active_plan_status', 'N', '0', 'admin', NOW(), 'admin', NOW())
ON DUPLICATE KEY UPDATE `update_time` = NOW();

-- 5.3 训练类型字典
INSERT INTO `sys_dict_type` (`dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) 
VALUES 
('训练类型', 'workout_training_type', '0', 'admin', NOW(), 'admin', NOW(), '区分按计划训练和自由训练')
ON DUPLICATE KEY UPDATE `update_time` = NOW();

INSERT INTO `sys_dict_data` (`dict_sort`, `dict_label`, `dict_value`, `dict_type`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`) 
VALUES 
(1, '按计划训练', 'plan', 'workout_training_type', 'Y', '0', 'admin', NOW(), 'admin', NOW()),
(2, '自由训练', 'free', 'workout_training_type', 'N', '0', 'admin', NOW(), 'admin', NOW())
ON DUPLICATE KEY UPDATE `update_time` = NOW();

-- 5.4 训练记录状态字典
INSERT INTO `sys_dict_type` (`dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) 
VALUES 
('训练记录状态', 'workout_status', '0', 'admin', NOW(), 'admin', NOW(), '训练记录的状态')
ON DUPLICATE KEY UPDATE `update_time` = NOW();

INSERT INTO `sys_dict_data` (`dict_sort`, `dict_label`, `dict_value`, `dict_type`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`) 
VALUES 
(1, '进行中', 'in_progress', 'workout_status', 'Y', '0', 'admin', NOW(), 'admin', NOW()),
(2, '已完成', 'completed', 'workout_status', 'N', '0', 'admin', NOW(), 'admin', NOW'),
(3, '已跳过', 'skipped', 'workout_status', 'N', '0', 'admin', NOW(), 'admin', NOW())
ON DUPLICATE KEY UPDATE `update_time` = NOW();
