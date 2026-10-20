-- ========================================
-- Fitness App 数据库完整部署脚本
-- 版本: v1.0.0
-- 更新时间: 2026-04-16
-- 说明: 包含所有表结构、索引、初始数据
-- ========================================

CREATE DATABASE IF NOT EXISTS `fitness` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `fitness`;

-- =============================================
-- 1. 用户信息表
-- =============================================
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    `username` VARCHAR(50) NOT NULL COMMENT '登录账号',
    `password` VARCHAR(255) NOT NULL COMMENT '密码',
    `realname` VARCHAR(100) DEFAULT NULL COMMENT '真实姓名',
    `nickname` VARCHAR(100) DEFAULT NULL COMMENT '用户昵称',
    `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号码',
    `gender` VARCHAR(10) DEFAULT NULL COMMENT '性别(male/female)',
    `age` INT DEFAULT NULL COMMENT '年龄',
    `fitness_goal` VARCHAR(50) DEFAULT NULL COMMENT '健身目标',
    `bio` VARCHAR(500) DEFAULT NULL COMMENT '个人简介',
    `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像图标类名/URL',
    `status` CHAR(1) DEFAULT '0' COMMENT '帐号状态（0正常 1停用）',
    `membership_status` VARCHAR(50) DEFAULT NULL COMMENT '会员状态',
    `streak_days` INT DEFAULT 0 COMMENT '连续健身天数',
    `total_workouts` INT DEFAULT 0 COMMENT '总训练次数',
    `total_energy` DOUBLE DEFAULT 0.0 COMMENT '总消耗能量(kcal)',
    `total_medals` INT DEFAULT 0 COMMENT '获得勋章数',
    `last_login_time` DATETIME DEFAULT NULL COMMENT '最后登录时间',
    `password_update_time` DATETIME DEFAULT NULL COMMENT '密码修改时间',
    `del_flag` CHAR(1) DEFAULT '0' COMMENT '删除标志（0代表存在 2代表删除）',
    `del_time` DATETIME DEFAULT NULL COMMENT '删除时间',
    `create_by` VARCHAR(64) DEFAULT '' COMMENT '创建者',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` VARCHAR(64) DEFAULT '' COMMENT '更新者',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    INDEX `idx_realname` (`realname`),
    INDEX `idx_nickname` (`nickname`),
    INDEX `idx_phone` (`phone`),
    INDEX `idx_status` (`status`),
    INDEX `idx_del_flag` (`del_flag`),
    INDEX `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户信息表';

-- =============================================
-- 2. 健身练习知识库表
-- =============================================
DROP TABLE IF EXISTS `exercise`;
CREATE TABLE `exercise` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '练习ID',
    `name` VARCHAR(100) NOT NULL COMMENT '练习名称',
    `category` VARCHAR(100) DEFAULT NULL COMMENT '练习分类',
    `category_type` VARCHAR(100) DEFAULT NULL COMMENT '健身动作类型(对应字典)',
    `muscle_group` VARCHAR(100) DEFAULT NULL COMMENT '目标肌群',
    `description` TEXT COMMENT '动作描述',
    `professional_tips` TEXT COMMENT '专业建议',
    `create_by` VARCHAR(64) DEFAULT '' COMMENT '创建者',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` VARCHAR(64) DEFAULT '' COMMENT '更新者',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_name` (`name`),
    INDEX `idx_category_type` (`category_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='健身练习知识库表';

-- =============================================
-- 3. 运动记录表
-- =============================================
DROP TABLE IF EXISTS `workout_record`;
CREATE TABLE `workout_record` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `name` VARCHAR(100) DEFAULT NULL COMMENT '训练名称',
    `start_time` DATETIME DEFAULT NULL COMMENT '开始时间',
    `end_time` DATETIME DEFAULT NULL COMMENT '结束时间',
    `duration_minutes` INT DEFAULT NULL COMMENT '持续时长(分钟)',
    `volume` DECIMAL(10,2) DEFAULT NULL COMMENT '训练容量(累计重量kg)',
    `exercise_count` INT DEFAULT NULL COMMENT '动作数量',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `status` VARCHAR(50) DEFAULT NULL COMMENT '状态',
    `create_by` VARCHAR(64) DEFAULT '' COMMENT '创建者',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` VARCHAR(64) DEFAULT '' COMMENT '更新者',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_start_time` (`start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='运动记录表';

-- =============================================
-- 4. 体重记录表 (优化版)
-- =============================================
DROP TABLE IF EXISTS `weight_record`;
CREATE TABLE `weight_record` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `weight` DECIMAL(5,2) NOT NULL COMMENT '体重(kg)',
    `record_date` DATE NOT NULL COMMENT '记录日期',
    `time_period` VARCHAR(10) NOT NULL COMMENT '时段(晨重morning/晚重evening)',
    `record_time` DATETIME DEFAULT NULL COMMENT '记录时间',
    `remark` VARCHAR(255) DEFAULT NULL COMMENT '备注',
    `del_flag` CHAR(1) DEFAULT '0' COMMENT '删除标志(0正常 1已删除)',
    `del_time` DATETIME DEFAULT NULL COMMENT '删除时间',
    `create_by` VARCHAR(64) DEFAULT '' COMMENT '创建者',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` VARCHAR(64) DEFAULT '' COMMENT '更新者',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_date_period` (`user_id`, `record_date`, `time_period`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_record_date` (`record_date`),
    INDEX `idx_del_flag` (`del_flag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='体重记录表';

-- =============================================
-- 5. 饮水记录表
-- =============================================
DROP TABLE IF EXISTS `water_record`;
CREATE TABLE `water_record` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `amount_ml` INT NOT NULL COMMENT '饮水量(ml)',
    `drink_type` VARCHAR(30) DEFAULT 'water' COMMENT '饮水类型(水/茶/咖啡等)',
    `record_time` DATETIME NOT NULL COMMENT '记录时间',
    `remark` VARCHAR(255) DEFAULT NULL COMMENT '备注',
    `del_flag` CHAR(1) DEFAULT '0' COMMENT '删除标志(0正常 1已删除)',
    `del_time` DATETIME DEFAULT NULL COMMENT '删除时间',
    `create_by` VARCHAR(64) DEFAULT '' COMMENT '创建者',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` VARCHAR(64) DEFAULT '' COMMENT '更新者',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_record_time` (`record_time`),
    INDEX `idx_del_flag` (`del_flag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='饮水记录表';

-- =============================================
-- 6. 饮食记录表
-- =============================================
DROP TABLE IF EXISTS `diet_record`;
CREATE TABLE `diet_record` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `meal_type` VARCHAR(20) NOT NULL COMMENT '餐次(早餐/午餐/晚餐/加餐)',
    `food_name` VARCHAR(100) NOT NULL COMMENT '食物名称',
    `amount` DECIMAL(8,2) DEFAULT '1.00' COMMENT '食用量',
    `unit` VARCHAR(20) DEFAULT 'fen' COMMENT '单位(份/g/ml)',
    `calories` INT DEFAULT '0' COMMENT '热量(kcal)',
    `protein_g` DECIMAL(6,2) DEFAULT '0.00' COMMENT '蛋白质(g)',
    `carbs_g` DECIMAL(6,2) DEFAULT '0.00' COMMENT '碳水化合物(g)',
    `fat_g` DECIMAL(6,2) DEFAULT '0.00' COMMENT '脂肪(g)',
    `diet_date` DATE NOT NULL COMMENT '饮食日期',
    `record_time` DATETIME NOT NULL COMMENT '记录时间',
    `image_url` VARCHAR(255) DEFAULT NULL COMMENT '图片URL',
    `remark` VARCHAR(255) DEFAULT NULL COMMENT '备注',
    `del_flag` CHAR(1) DEFAULT '0' COMMENT '删除标志(0正常 1已删除)',
    `del_time` DATETIME DEFAULT NULL COMMENT '删除时间',
    `create_by` VARCHAR(64) DEFAULT '' COMMENT '创建者',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` VARCHAR(64) DEFAULT '' COMMENT '更新者',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_diet_date` (`diet_date`),
    INDEX `idx_del_flag` (`del_flag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='饮食记录表';

-- =============================================
-- 7. 每日统计数据表
-- =============================================
DROP TABLE IF EXISTS `daily_stats`;
CREATE TABLE `daily_stats` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `date` DATE NOT NULL COMMENT '日期',
    `calories_burned` INT DEFAULT 0 COMMENT '消耗卡路里',
    `steps` INT DEFAULT 0 COMMENT '步数',
    `activity_duration_minutes` INT DEFAULT 0 COMMENT '活跃时长(分钟)',
    `create_by` VARCHAR(64) DEFAULT '' COMMENT '创建者',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` VARCHAR(64) DEFAULT '' COMMENT '更新者',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_user_date` (`user_id`, `date`),
    INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='每日统计数据表';

-- =============================================
-- 8. 字典类型表
-- =============================================
DROP TABLE IF EXISTS `sys_dict_type`;
CREATE TABLE `sys_dict_type` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `dict_name` VARCHAR(100) NOT NULL COMMENT '字典名称',
    `dict_type` VARCHAR(100) NOT NULL COMMENT '字典类型',
    `status` CHAR(1) DEFAULT '0' COMMENT '状态（0正常 1停用）',
    `create_by` VARCHAR(64) DEFAULT '' COMMENT '创建者',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` VARCHAR(64) DEFAULT '' COMMENT '更新者',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    PRIMARY KEY (`id`),
    UNIQUE KEY `dict_type` (`dict_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='字典类型表';

-- =============================================
-- 9. 字典数据表
-- =============================================
DROP TABLE IF EXISTS `sys_dict_data`;
CREATE TABLE `sys_dict_data` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `dict_sort` INT DEFAULT 0 COMMENT '字典排序',
    `dict_label` VARCHAR(100) DEFAULT '' COMMENT '字典标签',
    `dict_value` VARCHAR(100) DEFAULT '' COMMENT '字典键值',
    `dict_type` VARCHAR(100) DEFAULT '' COMMENT '字典类型',
    `css_class` VARCHAR(100) DEFAULT NULL COMMENT '样式属性（其他样式扩展）',
    `list_class` VARCHAR(100) DEFAULT NULL COMMENT '表格回显样式',
    `is_default` CHAR(1) DEFAULT 'N' COMMENT '是否默认（Y是 N否）',
    `status` CHAR(1) DEFAULT '0' COMMENT '状态（0正常 1停用）',
    `create_by` VARCHAR(64) DEFAULT '' COMMENT '创建者',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` VARCHAR(64) DEFAULT '' COMMENT '更新者',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    PRIMARY KEY (`id`),
    INDEX `idx_dict_type` (`dict_type`),
    INDEX `idx_dict_value` (`dict_value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='字典数据表';


-- =============================================
-- 初始数据填充
-- =============================================

-- 初始化字典类型
INSERT INTO `sys_dict_type` (`dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) 
VALUES 
('健身类型', 'fitness_type', '0', 'admin', NOW(), 'admin', NOW(), '健身训练分类'),
('健身动作类型', 'exercise_action_type', '0', 'admin', NOW(), 'admin', NOW(), '健身动作部位分类');

-- 初始化字典数据
INSERT INTO `sys_dict_data` (`dict_sort`, `dict_label`, `dict_value`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`) 
VALUES 
(1, '跑步', 'running', 'fitness_type', '0', 'admin', NOW(), 'admin', NOW()),
(2, '力量训练', 'strength', 'fitness_type', '0', 'admin', NOW(), 'admin', NOW()),
(3, '瑜伽', 'yoga', 'fitness_type', '0', 'admin', NOW(), 'admin', NOW()),
(4, '骑行', 'cycling', 'fitness_type', '0', 'admin', NOW(), 'admin', NOW()),
(5, '游泳', 'swimming', 'fitness_type', '0', 'admin', NOW(), 'admin', NOW()),
(6, '跳绳', 'jump_rope', 'fitness_type', '0', 'admin', NOW(), 'admin', NOW()),
(7, 'HIIT', 'hiit', 'fitness_type', '0', 'admin', NOW(), 'admin', NOW()),
(8, '步行', 'walking', 'fitness_type', '0', 'admin', NOW(), 'admin', NOW()),
(9, '拉伸', 'stretching', 'fitness_type', '0', 'admin', NOW(), 'admin', NOW()),
(10, '椭圆机', 'elliptical', 'fitness_type', '0', 'admin', NOW(), 'admin', NOW()),
(1, '全身有氧', 'full_body_cardio', 'exercise_action_type', '0', 'admin', NOW(), 'admin', NOW()),
(2, '核心训练', 'core_training', 'exercise_action_type', '0', 'admin', NOW(), 'admin', NOW()),
(3, '手臂肌群', 'arm_muscles', 'exercise_action_type', '0', 'admin', NOW(), 'admin', NOW()),
(4, '肩部肌群', 'shoulder_muscles', 'exercise_action_type', '0', 'admin', NOW(), 'admin', NOW()),
(5, '下肢肌群', 'leg_muscles', 'exercise_action_type', '0', 'admin', NOW(), 'admin', NOW()),
(6, '背部肌群', 'back_muscles', 'exercise_action_type', '0', 'admin', NOW(), 'admin', NOW()),
(7, '胸部肌群', 'chest_muscles', 'exercise_action_type', '0', 'admin', NOW(), 'admin', NOW());

-- 性别字典
INSERT INTO `sys_dict_type` (`dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES
('性别', 'sys_gender', '0', 'admin', NOW(), 'admin', NOW(), '用户性别选择');
INSERT INTO `sys_dict_data` (`dict_sort`, `dict_label`, `dict_value`, `dict_type`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
(1, '男', 'male', 'sys_gender', 'N', '0', 'admin', NOW(), 'admin', NOW()),
(2, '女', 'female', 'sys_gender', 'N', '0', 'admin', NOW(), 'admin', NOW());

-- 健身目标字典
INSERT INTO `sys_dict_type` (`dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES
('健身目标', 'sys_fitness_goal', '0', 'admin', NOW(), 'admin', NOW(), '用户健身目标选择');
INSERT INTO `sys_dict_data` (`dict_sort`, `dict_label`, `dict_value`, `dict_type`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
(1, '减脂塑形', 'lose_weight', 'sys_fitness_goal', 'N', '0', 'admin', NOW(), 'admin', NOW()),
(2, '增肌增重', 'gain_muscle', 'sys_fitness_goal', 'N', '0', 'admin', NOW(), 'admin', NOW()),
(3, '保持健康', 'maintain', 'sys_fitness_goal', 'Y', '0', 'admin', NOW(), 'admin', NOW()),
(4, '提升耐力', 'endurance', 'sys_fitness_goal', 'N', '0', 'admin', NOW(), 'admin', NOW()),
(5, '增强力量', 'strength', 'sys_fitness_goal', 'N', '0', 'admin', NOW(), 'admin', NOW()),
(6, '提升柔韧性', 'flexibility', 'sys_fitness_goal', 'N', '0', 'admin', NOW(), 'admin', NOW());

-- 初始化练习知识库
INSERT INTO `exercise` (`name`, `category`, `category_type`, `muscle_group`, `description`, `professional_tips`, `create_by`, `create_time`, `update_by`, `update_time`) 
VALUES 
('杠铃卧推', '胸部肌群', 'chest_muscles', '胸大肌', '躺在平凳上，双脚分开踩实。握距略宽于肩，将杠铃控制下放至乳头位置，触胸后迅速推起，全程保持背部微拱。', '切忌借力弹胸，这会严重损害胸骨。保持手腕垂直，避免在大重量下出现翻手腕现象。', 'admin', NOW(), 'admin', NOW()),
('哑铃飞鸟', '胸部肌群', 'chest_muscles', '胸大肌', '仰卧在平凳上，双手持哑铃，手臂微屈。以肩为轴呈弧线向下扩展，感受胸部深度拉伸，随后夹胸收回。', '整个过程手臂角度保持不变，想象是在拥抱一棵大树。', 'admin', NOW(), 'admin', NOW()),
('俯卧撑', '胸部肌群', 'chest_muscles', '胸大肌/肱三头肌', '双手略宽于肩支撑地面，身体呈直线。核心收紧，缓慢下压至胸部接近地面，随后爆发力推起。', '不要塌腰或翘屁股，肘部与身体呈45度角为宜。', 'admin', NOW(), 'admin', NOW()),
('引体向上', '背部肌群', 'back_muscles', '背阔肌', '双手宽握单杠，身体悬垂。发力向上拉至下巴超过单杠，随后有控制地缓慢下放。', '想象用肘部去撞击身体两侧，而不是单纯用手臂拉。', 'admin', NOW(), 'admin', NOW()),
('杠铃划船', '背部肌群', 'back_muscles', '背阔肌/斜方肌', '双脚与肩同宽，膝盖微屈，身体前倾约45度，背部挺直。双手握杠铃拉向腹部，感受背部肌肉挤压。', '保持核心收紧以保护腰椎，动作过程中躯干不要剧烈晃动。', 'admin', NOW(), 'admin', NOW()),
('高位下拉', '背部肌群', 'back_muscles', '背阔肌', '坐在器械上，双手宽握横杆。挺胸沉肩，将横杆下拉至上胸部锁骨位置，控制回放。', '不要过度后仰借力，感受肩胛骨的收拢与展开。', 'admin', NOW(), 'admin', NOW()),
('杠铃深蹲', '下肢肌群', 'leg_muscles', '股四头肌/臀大肌', '双脚与肩同宽，杠铃置于斜方肌上。挺胸收腹，下蹲至大腿与地面平行或略低，保持核心收紧，背部挺直。', '膝盖不要过度内扣，重心始终保持在足中，脚跟不要离地。', 'admin', NOW(), 'admin', NOW()),
('硬拉', '下肢肌群', 'leg_muscles', '腘绳肌/竖脊肌', '双脚与肩同宽，杠铃贴近胫骨。背部挺直，挺胸抬头，利用腿部和背部力量将杠铃提起至身体直立。', '严禁圆背动作，这会极大增加腰椎风险。杠铃轨迹应尽可能贴近身体。', 'admin', NOW(), 'admin', NOW()),
('箭步蹲', '下肢肌群', 'leg_muscles', '股四头肌/臀大肌', '站立位，一脚向前迈出一大步，同时下蹲至双腿膝盖均呈约90度角。交替进行。', '上半身保持垂直，核心收紧，后脚膝盖不要重磕地面。', 'admin', NOW(), 'admin', NOW()),
('杠铃推举', '肩部肌群', 'shoulder_muscles', '三角肌前/中束', '站立或坐姿，双手略宽于肩。将杠铃从上胸部垂直推向头顶上方，直至手臂伸直。', '推至顶部时不要完全锁死肘关节，保持肩部张力。', 'admin', NOW(), 'admin', NOW()),
('哑铃侧平举', '肩部肌群', 'shoulder_muscles', '三角肌中束', '双手握哑铃垂于体侧，双臂微屈。向身体两侧抬起哑铃至与肩同高，小拇指端略微上翘。', '不要通过身体晃动借力，控制下放过程，感受肩部灼烧感。', 'admin', NOW(), 'admin', NOW()),
('杠铃弯举', '手臂肌群', 'arm_muscles', '肱二头肌', '站立，双手握杠铃，掌心向上。保持大臂固定在身体两侧，屈肘将杠铃弯举至胸前。', '避免身体前后摇晃借力，下放至底部时不要完全放松张力。', 'admin', NOW(), 'admin', NOW()),
('双杠臂屈伸', '手臂肌群', 'arm_muscles', '肱三头肌/胸大肌下缘', '双手撑在双杠上，身体略微前倾。屈肘下沉身体至上臂与地面平行，随后发力推起。', '身体越前倾对胸部刺激越大，越垂直对肱三头肌刺激越大。', 'admin', NOW(), 'admin', NOW()),
('平板支撑', '核心训练', 'core_training', '腹横肌/核心群', '双肘支撑地面，双脚并拢。身体呈一条直线，收腹、提臀、夹腿，保持静止。', '不要塌腰或抬头，保持均匀呼吸，不要憋气。', 'admin', NOW(), 'admin', NOW()),
('卷腹', '核心训练', 'core_training', '腹直肌', '仰卧，双腿弯曲踩实地面。利用腹部力量带动上半身抬起，背部中下部始终贴地，感受腹肌挤压。', '双手不要抱头生拉硬拽，可交叉置于胸前或贴于耳侧。', 'admin', NOW(), 'admin', NOW()),
('波比跳', '全身有氧', 'full_body_cardio', '全身肌群', '深蹲-俯卧撑-收腿-跳跃的连贯动作。极高强度的全身性训练动作。', '动作要连贯，保持节奏。初学者可去掉俯卧撑环节。', 'admin', NOW(), 'admin', NOW()),
('开合跳', '全身有氧', 'full_body_cardio', '全身肌群', '站立位跳跃，同时双手在头顶击掌，双脚分开。落地时再次跳跃恢复原状。', '落地要轻盈，利用前脚掌缓冲，膝盖保持微屈保护关节。', 'admin', NOW(), 'admin', NOW());

-- 插入测试体重记录
INSERT INTO `weight_record` (`user_id`, `weight`, `record_date`, `time_period`, `record_time`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
(1, 70.5, '2026-04-08', 'morning', NOW(), 'admin', NOW(), 'admin', NOW()),
(1, 70.0, '2026-04-09', 'morning', NOW(), 'admin', NOW(), 'admin', NOW()),
(1, 69.8, '2026-04-10', 'morning', NOW(), 'admin', NOW(), 'admin', NOW()),
(1, 69.5, '2026-04-11', 'morning', NOW(), 'admin', NOW(), 'admin', NOW()),
(1, 69.2, '2026-04-12', 'morning', NOW(), 'admin', NOW(), 'admin', NOW()),
(1, 69.0, '2026-04-13', 'morning', NOW(), 'admin', NOW(), 'admin', NOW()),
(1, 68.8, '2026-04-14', 'morning', NOW(), 'admin', NOW(), 'admin', NOW());

-- 完成
SELECT 'Database initialization completed!' AS message;
SELECT COUNT(*) AS table_count FROM information_schema.tables WHERE table_schema = 'fitness';

-- =============================================
-- 10. 身高记录表
-- =============================================
DROP TABLE IF EXISTS `height_record`;
CREATE TABLE `height_record` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `height` DECIMAL(5,1) NOT NULL COMMENT '身高(cm)',
    `record_date` DATE NOT NULL COMMENT '记录日期',
    `record_time` DATETIME DEFAULT NULL COMMENT '记录时间',
    `remark` VARCHAR(255) DEFAULT NULL COMMENT '备注',
    `del_flag` CHAR(1) DEFAULT '0' COMMENT '删除标志(0正常 1已删除)',
    `del_time` DATETIME DEFAULT NULL COMMENT '删除时间',
    `create_by` VARCHAR(64) DEFAULT '' COMMENT '创建者',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` VARCHAR(64) DEFAULT '' COMMENT '更新者',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_record_date` (`record_date`),
    INDEX `idx_del_flag` (`del_flag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='身高记录表';
