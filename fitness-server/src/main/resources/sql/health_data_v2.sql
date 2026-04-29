-- ============================================================
-- 健康数据管理模块 - 数据库迁移脚本 (V2.0)
-- 执行时间: 2026-04-15
-- 说明: 改造weight_record + 新建water_record + diet_record + 字典数据
-- ============================================================

USE `fitness`;

-- ==================== 1. 改造 weight_record 表 ====================
-- 删除旧索引（如果存在）
-- ALTER TABLE `weight_record` DROP INDEX `uk_user_date`;
-- ALTER TABLE `weight_record` DROP INDEX `idx_user_id`;

-- 新增时段字段
ALTER TABLE `weight_record`
ADD COLUMN `time_period`  VARCHAR(10)  NOT NULL DEFAULT 'morning' COMMENT '称重时段: morning=晨重(起床后), evening=晚重(睡前)' AFTER `weight`,
ADD COLUMN `record_time`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '称重具体时间(精确到时分)' AFTER `time_period`,
ADD COLUMN `remark`       VARCHAR(255) DEFAULT NULL COMMENT '备注' AFTER `record_time`;

-- 新增软删除字段
ALTER TABLE `weight_record`
ADD COLUMN `del_flag`      CHAR(1)      DEFAULT '0'             COMMENT '删除标志(0存在 2删除)' AFTER `remark`,
ADD COLUMN `del_time`      DATETIME     DEFAULT NULL            COMMENT '删除时间' AFTER `del_flag`;

-- 唯一约束: 同一用户 + 同一天 + 同一时段 = 唯一一条记录
ALTER TABLE `weight_record`
ADD UNIQUE KEY `uk_user_date_period` (`user_id`, `record_date`, `time_period`);

-- 索引优化
ALTER TABLE `weight_record` ADD INDEX `idx_user_id`       (`user_id`);
ALTER TABLE `weight_record` ADD INDEX `idx_user_period`    (`user_id`, `time_period`);
ALTER TABLE `weight_record` ADD INDEX `idx_record_time`    (`record_time`);
ALTER TABLE `weight_record` ADD INDEX `idx_del_flag`       (`del_flag`);

-- 兼容历史数据: 将旧数据的 time_period 默认设为 morning，record_time 设为当天 08:00
UPDATE `weight_record` SET 
    `time_period` = 'morning', 
    `record_time` = CONCAT(`record_date`, ' 08:00:00') 
WHERE `time_period` IS NULL OR `time_period` = '';

-- ==================== 2. 新建 water_record 饮水记录表 ====================
CREATE TABLE IF NOT EXISTS `water_record` (
    `id`                  BIGINT(20)   NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    `user_id`             BIGINT(20)   NOT NULL                COMMENT '用户ID',
    `amount_ml`           INT(11)      NOT NULL                COMMENT '饮水量(ml), 单次上限2000ml',
    `drink_type`          VARCHAR(30)  DEFAULT 'water'         COMMENT '饮品类型: water/tea/coffee/juice/other',
    `record_time`         DATETIME     NOT NULL                COMMENT '记录时间(精确到分)',
    `remark`              VARCHAR(255) DEFAULT NULL            COMMENT '备注',
    -- 软删除字段
    `del_flag`            CHAR(1)      DEFAULT '0'             COMMENT '删除标志(0存在 2删除)',
    `del_time`            DATETIME     DEFAULT NULL            COMMENT '删除时间',
    -- 系统审计字段
    `create_by`           VARCHAR(64)  DEFAULT ''              COMMENT '创建者',
    `create_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间(首次记录)',
    `update_by`           VARCHAR(64)  DEFAULT ''              COMMENT '更新者(最后编辑人)',
    `update_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间(最后编辑时间)',
    PRIMARY KEY (`id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_user_date` (`user_id`, DATE(`record_time`)),
    INDEX `idx_record_time` (`record_time`),
    INDEX `idx_del_flag` (`del_flag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='饮水记录表';

-- ==================== 3. 新建 diet_record 饮食记录表 ====================
CREATE TABLE IF NOT EXISTS `diet_record` (
    `id`                  BIGINT(20)   NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    `user_id`             BIGINT(20)   NOT NULL                COMMENT '用户ID',
    `meal_type`           VARCHAR(20)  NOT NULL                COMMENT '餐次: breakfast/lunch/dinner/snack',
    `food_name`           VARCHAR(100) NOT NULL                COMMENT '食物名称',
    `amount`              DECIMAL(8,2) DEFAULT 1.0             COMMENT '食用数量',
    `unit`                VARCHAR(20)  DEFAULT '份'            COMMENT '单位: 份/个/杯/碗/g/ml',
    `calories`            INT(11)      DEFAULT 0               COMMENT '估算热量(kcal)',
    `protein_g`           DECIMAL(6,2) DEFAULT 0.0             COMMENT '蛋白质(g)',
    `carbs_g`             DECIMAL(6,2) DEFAULT 0.0             COMMENT '碳水化合物(g)',
    `fat_g`               DECIMAL(6,2) DEFAULT 0.0             COMMENT '脂肪(g)',
    `diet_date`           DATE         NOT NULL                COMMENT '饮食日期',
    `record_time`         DATETIME     NOT NULL                COMMENT '记录时间',
    `image_url`           VARCHAR(255) DEFAULT NULL            COMMENT '食物图片URL',
    `remark`              VARCHAR(255) DEFAULT NULL            COMMENT '备注',
    -- 软删除字段
    `del_flag`            CHAR(1)      DEFAULT '0'             COMMENT '删除标志(0存在 2删除)',
    `del_time`            DATETIME     DEFAULT NULL            COMMENT '删除时间',
    -- 系统审计字段
    `create_by`           VARCHAR(64)  DEFAULT ''              COMMENT '创建者',
    `create_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间(首次记录)',
    `update_by`           VARCHAR(64)  DEFAULT ''              COMMENT '更新者(最后编辑人)',
    `update_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间(最后编辑时间)',
    PRIMARY KEY (`id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_user_meal_date` (`user_id`, `diet_date`, `meal_type`),
    INDEX `idx_diet_date` (`diet_date`),
    INDEX `idx_del_flag` (`del_flag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='饮食记录表';

-- ==================== 4. 新增字典类型和数据 ====================

-- 饮品类型字典
INSERT INTO `sys_dict_type` (`dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) 
VALUES ('饮品类型', 'drink_type', '0', 'admin', NOW(), 'admin', NOW(), '饮水记录-饮品分类')
ON DUPLICATE KEY UPDATE `dict_name`=VALUES(`dict_name`);

INSERT INTO `sys_dict_data` (`dict_sort`, `dict_label`, `dict_value`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
(1, '水', 'water', 'drink_type', '0', 'admin', NOW(), 'admin', NOW()),
(2, '茶', 'tea', 'drink_type', '0', 'admin', NOW(), 'admin', NOW()),
(3, '咖啡', 'coffee', 'drink_type', '0', 'admin', NOW(), 'admin', NOW()),
(4, '果汁', 'juice', 'drink_type', '0', 'admin', NOW(), 'admin', NOW()),
(5, '其他', 'other', 'drink_type', '0', 'admin', NOW(), 'admin', NOW())
ON DUPLICATE KEY UPDATE `dict_label`=VALUES(`dict_label`);

-- 餐次类型字典
INSERT INTO `sys_dict_type` (`dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) 
VALUES ('餐次类型', 'meal_type', '0', 'admin', NOW(), 'admin', NOW(), '饮食记录-餐次分类')
ON DUPLICATE KEY UPDATE `dict_name`=VALUES(`dict_name`);

INSERT INTO `sys_dict_data` (`dict_sort`, `dict_label`, `dict_value`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
(1, '早餐', 'breakfast', 'meal_type', '0', 'admin', NOW(), 'admin', NOW()),
(2, '午餐', 'lunch', 'meal_type', '0', 'admin', NOW(), 'admin', NOW()),
(3, '晚餐', 'dinner', 'meal_type', '0', 'admin', NOW(), 'admin', NOW()),
(4, '加餐', 'snack', 'meal_type', '0', 'admin', NOW(), 'admin', NOW())
ON DUPLICATE KEY UPDATE `dict_label`=VALUES(`dict_label`);

-- 称重时段字典
INSERT INTO `sys_dict_type` (`dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) 
VALUES ('称重时段', 'time_period', '0', 'admin', NOW(), 'admin', NOW(), '体重记录-称重时段')
ON DUPLICATE KEY UPDATE `dict_name`=VALUES(`dict_name`);

INSERT INTO `sys_dict_data` (`dict_sort`, `dict_label`, `dict_value`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
(1, '晨重', 'morning', 'time_period', '0', 'admin', NOW(), 'admin', NOW()),
(2, '晚重', 'evening', 'time_period', '0', 'admin', NOW(), 'admin', NOW())
ON DUPLICATE KEY UPDATE `dict_label`=VALUES(`dict_label`);

-- ==================== 5. 插入测试数据 ====================

-- 更新现有体重数据（添加时段和时间）
UPDATE `weight_record` SET 
    `time_period` = IF(MOD(id, 2) = 1, 'morning', 'evening'),
    `record_time` = CONCAT(`record_date`, ' ', IF(MOD(id, 2) = 1, '07:30:00', '21:00:00'))
WHERE `time_period` IS NULL OR `time_period` = '';

-- 插入饮水测试数据
INSERT INTO `water_record` (`user_id`, `amount_ml`, `drink_type`, `record_time`, `create_by`) VALUES
(1, 250, 'water',  '2026-04-09 07:30:00', 'admin'),
(1, 300, 'water',  '2026-04-09 10:00:00', 'admin'),
(1, 200, 'tea',    '2026-04-09 14:30:00', 'admin'),
(1, 400, 'water',  '2026-04-10 07:15:00', 'admin'),
(1, 350, 'coffee', '2026-04-10 09:00:00', 'admin'),
(1, 250, 'water',  '2026-04-10 12:00:00', 'admin'),
(1, 300, 'juice',  '2026-04-10 16:00:00', 'admin'),
(1, 450, 'water',  '2026-04-11 07:45:00', 'admin'),
(1, 280, 'tea',    '2026-04-11 11:00:00', 'admin'),
(1, 500, 'water',  '2026-04-11 18:00:00', 'admin'),
(1, 220, 'other',  '2026-04-12 08:00:00', 'admin'),
(1, 380, 'water',  '2026-04-12 13:30:00', 'admin'),
(1, 260, 'coffee', '2026-04-13 07:30:00', 'admin'),
(1, 420, 'water',  '2026-04-13 15:00:00', 'admin'),
(1, 310, 'water',  '2026-04-14 08:00:00', 'admin'),
(1, 290, 'tea',    '2026-04-14 19:30:00', 'admin');

-- 插入饮食测试数据
INSERT INTO `diet_record` (`user_id`, `meal_type`, `food_name`, `amount`, `unit`, `calories`, `protein_g`, `carbs_g`, `fat_g`, `diet_date`, `record_time`, `create_by`) VALUES
(1, 'breakfast', '全麦面包', 2, '片', 160, 6, 30, 2, '2026-04-09', '2026-04-09 07:30:00', 'admin'),
(1, 'breakfast', '鸡蛋', 2, '个', 140, 12, 1, 10, '2026-04-09', '2026-04-09 07:35:00', 'admin'),
(1, 'breakfast', '牛奶', 1, '杯', 120, 8, 12, 4, '2026-04-09', '2026-04-09 07:40:00', 'admin'),
(1, 'lunch', '鸡胸肉沙拉', 1, '份', 350, 35, 15, 18, '2026-04-09', '2026-04-09 12:00:00', 'admin'),
(1, 'dinner', '清炒西兰花', 1, '份', 120, 4, 10, 6, '2026-04-09', '2026-04-09 18:30:00', 'admin'),
(1, 'dinner', '糙米饭', 1, '碗', 230, 5, 50, 1, '2026-04-09', '2026-04-09 18:35:00', 'admin'),
(1, 'breakfast', '燕麦粥', 1, '碗', 150, 5, 27, 3, '2026-04-10', '2026-04-10 07:20:00', 'admin'),
(1, 'breakfast', '香蕉', 1, '根', 90, 1, 23, 0, '2026-04-10', '2026-04-10 07:25:00', 'admin'),
(1, 'lunch', '牛肉面', 1, '碗', 520, 25, 65, 15, '2026-04-10', '2026-04-10 12:10:00', 'admin'),
(1, 'snack', '苹果', 1, '个', 52, 0, 14, 0, '2026-04-10', '2026-04-10 15:00:00', 'admin'),
(1, 'dinner', '蒸鱼', 1, '份', 180, 32, 0, 5, '2026-04-10', '2026-04-10 19:00:00', 'admin'),
(1, 'breakfast', '三明治', 1, '个', 280, 12, 28, 10, '2026-04-11', '2026-04-11 07:30:00', 'admin'),
(1, 'lunch', '日式便当', 1, '份', 480, 22, 55, 16, '2026-04-11', '2026-04-11 12:00:00', 'admin'),
(1, 'dinner', '番茄鸡蛋汤', 1, '碗', 85, 5, 6, 5, '2026-04-11', '2026-04-11 18:45:00', 'admin'),
(1, 'breakfast', '豆浆+油条', 1, '套', 400, 12, 50, 18, '2026-04-12', '2026-04-12 07:15:00', 'admin'),
(1, 'lunch', '麻辣香锅', 1, '份', 650, 18, 60, 38, '2026-04-12', '2026-04-12 12:30:00', 'admin'),
(1, 'snack', '酸奶', 1, '杯', 100, 3, 15, 3, '2026-04-12', '2026-04-12 15:30:00', 'admin'),
(1, 'dinner', '蔬菜汤', 1, '碗', 60, 2, 8, 1, '2026-04-12', '2026-04-12 19:00:00', 'admin'),
(1, 'breakfast', '紫菜包饭', 1, '个', 320, 8, 48, 9, '2026-04-13', '2026-04-13 07:45:00', 'admin'),
(1, 'lunch', '黄焖鸡米饭', 1, '份', 720, 42, 78, 26, '2026-04-13', '2026-04-13 12:15:00', 'admin'),
(1, 'dinner', '清蒸鲈鱼', 1, '份', 195, 36, 0, 6, '2026-04-13', '2026-04-13 19:00:00', 'admin'),
(1, 'breakfast', '小米粥', 1, '碗', 70, 2, 14, 1, '2026-04-14', '2026-04-14 07:30:00', 'admin'),
(1, 'breakfast', '煮鸡蛋', 2, '个', 140, 12, 1, 10, '2026-04-14', '2026-04-14 07:35:00', 'admin'),
(1, 'lunch', '宫保鸡丁盖浇饭', 1, '份', 680, 28, 82, 24, '2026-04-14', '2026-04-14 12:00:00', 'admin'),
(1, 'snack', '坚果混合包', 1, '袋', 180, 6, 12, 14, '2026-04-14', '2026-04-14 16:00:00', 'admin'),
(1, 'dinner', '凉拌黄瓜', 1, '份', 45, 1, 7, 2, '2026-04-14', '2026-04-14 19:00:00', 'admin');

-- ==================== 完成 ====================
SELECT '✅ 健康数据管理模块 V2.0 数据库迁移完成！' AS result;
SELECT COUNT(*) AS weight_count FROM `weight_record`;
SELECT COUNT(*) AS water_count FROM `water_record`;
SELECT COUNT(*) AS diet_count FROM `diet_record`;
