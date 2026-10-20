-- ========================================
-- 训练计划模块 - 数据库表设计
-- 版本: v1.0.0
-- 创建时间: 2026-04-24
-- 说明: 支持预置计划和用户自定义计划
-- ========================================

-- =============================================
-- 1. 训练计划主表 (training_plan)
-- 存储计划的基本信息
-- =============================================
DROP TABLE IF EXISTS `training_plan`;
CREATE TABLE `training_plan` (
    `id`                  BIGINT(20)   NOT NULL AUTO_INCREMENT COMMENT '计划ID',
    `user_id`             BIGINT(20)   DEFAULT NULL                COMMENT '用户ID(NULL表示系统预置)',
    `name`                VARCHAR(100) NOT NULL                     COMMENT '计划名称',
    `type`                VARCHAR(50)  NOT NULL DEFAULT 'custom'    COMMENT '分化类型(five-split/three-split/kai-three-split/full-body/custom)',
    `description`         VARCHAR(500) DEFAULT NULL                 COMMENT '计划描述',
    `days_per_week`       INT(11)      NOT NULL DEFAULT 1           COMMENT '每周训练天数',
    `difficulty`          VARCHAR(20)  DEFAULT NULL                 COMMENT '难度等级(beginner/intermediate/advanced)',
    `target_audience`     VARCHAR(200) DEFAULT NULL                 COMMENT '适用人群',
    `tags`                VARCHAR(500) DEFAULT NULL                 COMMENT '标签(JSON数组格式)',
    `source`              VARCHAR(20)  DEFAULT 'user'               COMMENT '来源(system/user)',
    `plan_type`           TINYINT(1)   NOT NULL DEFAULT 0           COMMENT '计划类型(0用户创建 1系统预置)',
    `status`              CHAR(1)      DEFAULT '0'                  COMMENT '状态(0正常 1停用)',
    `progress`            INT(11)      DEFAULT 0                    COMMENT '训练进度（0-100）',
    `create_by`           VARCHAR(64)  DEFAULT ''                   COMMENT '创建者',
    `create_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP    COMMENT '创建时间',
    `update_by`           VARCHAR(64)  DEFAULT ''                   COMMENT '更新者',
    `update_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_type` (`type`),
    INDEX `idx_source` (`source`),
    INDEX `idx_plan_type` (`plan_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='训练计划主表';

-- =============================================
-- 2. 训练日安排表 (training_plan_day)
-- 存储每天的训练安排
-- =============================================
DROP TABLE IF EXISTS `training_plan_day`;
CREATE TABLE `training_plan_day` (
    `id`                  BIGINT(20)   NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    `plan_id`             BIGINT(20)   NOT NULL                     COMMENT '关联的计划ID',
    `day_number`          INT(11)      NOT NULL                     COMMENT '第几天(1-7)',
    `day_name`            VARCHAR(100) NOT NULL                     COMMENT '训练日名称(如:胸部训练)',
    `focus`               VARCHAR(200) DEFAULT NULL                 COMMENT '重点肌群',
    `sort_order`          INT(11)      DEFAULT 0                    COMMENT '排序号',
    `create_by`           VARCHAR(64)  DEFAULT ''                   COMMENT '创建者',
    `create_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP    COMMENT '创建时间',
    `update_by`           VARCHAR(64)  DEFAULT ''                   COMMENT '更新者',
    `update_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_plan_id` (`plan_id`),
    UNIQUE KEY `uk_plan_day` (`plan_id`, `day_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='训练日安排表';

-- =============================================
-- 3. 计划动作详情表 (training_plan_exercise)
-- 存储每个动作的详细参数
-- =============================================
DROP TABLE IF EXISTS `training_plan_exercise`;
CREATE TABLE `training_plan_exercise` (
    `id`                  BIGINT(20)   NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    `plan_day_id`         BIGINT(20)   NOT NULL                     COMMENT '关联的训练日ID',
    `exercise_name`       VARCHAR(100) NOT NULL                     COMMENT '动作名称',
    `sets`                INT(11)      NOT NULL DEFAULT 3           COMMENT '组数',
    `reps`                VARCHAR(20)  DEFAULT '8-12'              COMMENT '次数(支持范围如"8-12")',
    `rest_seconds`        INT(11)      DEFAULT 60                   COMMENT '休息时间(秒)',
    `notes`               VARCHAR(300) DEFAULT NULL                 COMMENT '技巧提示/备注',
    `sort_order`          INT(11)      DEFAULT 0                    COMMENT '排序号',
    `create_by`           VARCHAR(64)  DEFAULT ''                   COMMENT '创建者',
    `create_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP    COMMENT '创建时间',
    `update_by`           VARCHAR(64)  DEFAULT ''                   COMMENT '更新者',
    `update_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_plan_day_id` (`plan_day_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='计划动作详情表';

-- =============================================
-- 4. 初始化字典数据 - 分化类型
-- =============================================
INSERT INTO `sys_dict_type` (`dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) 
VALUES 
('训练计划分化类型', 'training_split_type', '0', 'admin', NOW(), 'admin', NOW(), '训练计划的分化方式')
ON DUPLICATE KEY UPDATE `update_time` = NOW();

INSERT INTO `sys_dict_data` (`dict_sort`, `dict_label`, `dict_value`, `dict_type`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`) 
VALUES 
(1, '五分化', 'five-split', 'training_split_type', 'N', '0', 'admin', NOW(), 'admin', NOW()),
(2, '三分化(PPL)', 'three-split', 'training_split_type', 'N', '0', 'admin', NOW(), 'admin', NOW()),
(3, '改良三分化', 'kai-three-split', 'training_split_type', 'N', '0', 'admin', NOW(), 'admin', NOW()),
(4, '一分化(全身)', 'full-body', 'training_split_type', 'N', '0', 'admin', NOW(), 'admin', NOW()),
(5, '自定义', 'custom', 'training_split_type', 'Y', '0', 'admin', NOW(), 'admin', NOW())
ON DUPLICATE KEY UPDATE `update_time` = NOW();

-- =============================================
-- 5. 初始化字典数据 - 难度等级
-- =============================================
INSERT INTO `sys_dict_type` (`dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) 
VALUES 
('训练难度等级', 'training_difficulty', '0', 'admin', NOW(), 'admin', NOW(), '训练计划的难度分级')
ON DUPLICATE KEY UPDATE `update_time` = NOW();

INSERT INTO `sys_dict_data` (`dict_sort`, `dict_label`, `dict_value`, `dict_type`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`) 
VALUES 
(1, '初级', 'beginner', 'training_difficulty', 'N', '0', 'admin', NOW(), 'admin', NOW()),
(2, '中级', 'intermediate', 'training_difficulty', 'Y', '0', 'admin', NOW(), 'admin', NOW()),
(3, '进阶', 'advanced', 'training_difficulty', 'N', '0', 'admin', NOW(), 'admin', NOW())
ON DUPLICATE KEY UPDATE `update_time` = NOW();

-- =============================================
-- 6. 插入预置训练计划数据
-- =============================================

-- 6.1 经典五分化
INSERT INTO `training_plan` (`user_id`, `name`, `type`, `description`, `days_per_week`, `difficulty`, `target_audience`, `tags`, `source`, `plan_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`)
VALUES 
(NULL, '经典五分化', 'five-split', '经典的5天分化训练，每专注一个肌群，适合进阶训练者充分刺激各部位。', 5, 'advanced', '有3个月以上系统训练基础', '["增肌","力量","分化训练"]', 'system', 1, '0', 'admin', NOW(), 'admin', NOW());

SET @five_split_id = LAST_INSERT_ID();

-- 五分化 Day 1: 胸部训练
INSERT INTO `training_plan_day` (`plan_id`, `day_number`, `day_name`, `focus`, `sort_order`, `create_by`, `create_time`, `update_by`, `update_time`) 
VALUES 
(@five_split_id, 1, '胸部训练', '胸大肌/胸小肌/前锯肌', 1, 'admin', NOW(), 'admin', NOW());
SET @five_d1 = LAST_INSERT_ID();

INSERT INTO `training_plan_exercise` (`plan_day_id`, `exercise_name`, `sets`, `reps`, `rest_seconds`, `notes`, `sort_order`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
(@five_d1, '平板杠铃卧推', 4, '8-12', 90, '下放时感受胸肌拉伸', 1, 'admin', NOW(), 'admin', NOW()),
(@five_d1, '上斜杠铃卧推', 4, '10-12', 75, '角度30-45度', 2, 'admin', NOW(), 'admin', NOW()),
(@five_d1, '平板哑铃飞鸟', 3, '12-15', 60, '保持肘部微屈', 3, 'admin', NOW(), 'admin', NOW()),
(@five_d1, '绳索夹胸', 3, '15-20', 45, '充分挤压胸肌', 4, 'admin', NOW(), 'admin', NOW()),
(@five_d1, '双杠臂屈伸', 3, '力竭', 60, '身体前倾刺激下胸', 5, 'admin', NOW(), 'admin', NOW());

-- 五分化 Day 2: 背部训练
INSERT INTO `training_plan_day` (`plan_id`, `day_number`, `day_name`, `focus`, `sort_order`, `create_by`, `create_time`, `update_by`, `update_time`) 
VALUES 
(@five_split_id, 2, '背部训练', '背阔肌/菱形肌/斜方肌中下束', 2, 'admin', NOW(), 'admin', NOW());
SET @five_d2 = LAST_INSERT_ID();

INSERT INTO `training_plan_exercise` (`plan_day_id`, `exercise_name`, `sets`, `reps`, `rest_seconds`, `notes`, `sort_order`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
(@five_d2, '引体向上', 4, '力竭', 90, '全程控制，避免摆动', 1, 'admin', NOW(), 'admin', NOW()),
(@five_d2, '杠铃划船', 4, '8-10', 90, '收紧肩胛骨', 2, 'admin', NOW(), 'admin', NOW()),
(@five_d2, '单臂哑铃划船', 3, '10-12', 75, '充分拉伸背阔肌', 3, 'admin', NOW(), 'admin', NOW()),
(@five_d2, '坐姿绳索划船', 3, '12-15', 60, '手肘贴近身体', 4, 'admin', NOW(), 'admin', NOW()),
(@five_d2, '直臂下压', 3, '15-20', 45, '固定大臂位置', 5, 'admin', NOW(), 'admin', NOW());

-- 五分化 Day 3: 腿部训练
INSERT INTO `training_plan_day` (`plan_id`, `day_number`, `day_name`, `focus`, `sort_order`, `create_by`, `create_time`, `update_by`, `update_time`) 
VALUES 
(@five_split_id, 3, '腿部训练', '股四头肌/腘绳肌/臀部/小腿', 3, 'admin', NOW(), 'admin', NOW());
SET @five_d3 = LAST_INSERT_ID();

INSERT INTO `training_plan_exercise` (`plan_day_id`, `exercise_name`, `sets`, `reps`, `rest_seconds`, `notes`, `sort_order`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
(@five_d3, '杠铃深蹲', 4, '6-10', 120, '核心收紧，膝盖方向朝脚尖', 1, 'admin', NOW(), 'admin', NOW()),
(@five_d3, '腿举', 4, '10-12', 90, '不要锁死膝关节', 2, 'admin', NOW(), 'admin', NOW()),
(@five_d3, '罗马尼亚硬拉', 4, '8-10', 90, '感受腘绳肌拉伸', 3, 'admin', NOW(), 'admin', NOW()),
(@five_d3, '腿弯举', 3, '12-15', 60, '缓慢离心', 4, 'admin', NOW(), 'admin', NOW()),
(@five_d3, '提踵', 4, '15-20', 45, '顶峰收缩1秒', 5, 'admin', NOW(), 'admin', NOW());

-- 五分化 Day 4: 肩部训练
INSERT INTO `training_plan_day` (`plan_id`, `day_number`, `day_name`, `focus`, `sort_order`, `create_by`, `create_time`, `update_by`, `update_time`) 
VALUES 
(@five_split_id, 4, '肩部训练', '三角肌前束/中束/后束', 4, 'admin', NOW(), 'admin', NOW());
SET @five_d4 = LAST_INSERT_ID();

INSERT INTO `training_plan_exercise` (`plan_day_id`, `exercise_name`, `sets`, `reps`, `rest_seconds`, `notes`, `sort_order`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
(@five_d4, '坐姿哑铃推举', 4, '8-12', 90, '手肘微向前', 1, 'admin', NOW(), 'admin', NOW()),
(@five_d4, '侧平举', 4, '12-15', 60, '手肘高于手腕', 2, 'admin', NOW(), 'admin', NOW()),
(@five_d4, '俯身飞鸟', 3, '12-15', 60, '重点刺激后束', 3, 'admin', NOW(), 'admin', NOW()),
(@five_d4, '阿诺德推举', 3, '10-12', 75, '旋转时控制重量', 4, 'admin', NOW(), 'admin', NOW()),
(@five_d4, '绳索面拉', 3, '15-20', 45, '后缩肩胛骨', 5, 'admin', NOW(), 'admin', NOW());

-- 五分化 Day 5: 手臂训练
INSERT INTO `training_plan_day` (`plan_id`, `day_number`, `day_name`, `focus`, `sort_order`, `create_by`, `create_time`, `update_by`, `update_time`) 
VALUES 
(@five_split_id, 5, '手臂训练', '肱二头肌/肱三头肌', 5, 'admin', NOW(), 'admin', NOW());
SET @five_d5 = LAST_INSERT_ID();

INSERT INTO `training_plan_exercise` (`plan_day_id`, `exercise_name`, `sets`, `reps`, `rest_seconds`, `notes`, `sort_order`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
(@five_d5, '杠铃弯举', 4, '8-12', 60, '大臂贴紧身体', 1, 'admin', NOW(), 'admin', NOW()),
(@five_d5, '锤式弯举', 3, '10-12', 60, '刺激肱肌', 2, 'admin', NOW(), 'admin', NOW()),
(@five_d5, '绳索弯举', 3, '12-15', 45, '顶峰收缩', 3, 'admin', NOW(), 'admin', NOW()),
(@five_d5, '窄距卧推', 4, '8-10', 75, '双手间距与肩同宽', 4, 'admin', NOW(), 'admin', NOW()),
(@five_d5, '绳索下压', 3, '12-15', 45, '大臂固定不动', 5, 'admin', NOW(), 'admin', NOW()),
(@five_d5, '过头臂屈伸', 3, '10-12', 60, '长头刺激', 6, 'admin', NOW(), 'admin', NOW());


-- 6.2 传统三分化
INSERT INTO `training_plan` (`user_id`, `name`, `type`, `description`, `days_per_week`, `difficulty`, `target_audience`, `tags`, `source`, `plan_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`)
VALUES
(NULL, '传统三分化', 'three-split', '推/拉/腿经典三分化，每周每个部位训练2次，频率高，适合中级训练者。', 3, 'intermediate', '有1-3个月训练基础，希望提高训练频率', '["增肌","高频","均衡发展"]', 'system', 1, '0', 'admin', NOW(), 'admin', NOW());

SET @three_split_id = LAST_INSERT_ID();

-- 三分化 Day 1: 推类训练
INSERT INTO `training_plan_day` (`plan_id`, `day_number`, `day_name`, `focus`, `sort_order`, `create_by`, `create_time`, `update_by`, `update_time`)
VALUES
(@three_split_id, 1, '推类训练', '胸/肩前中束/肱三头肌', 1, 'admin', NOW(), 'admin', NOW());
SET @three_d1 = LAST_INSERT_ID();

INSERT INTO `training_plan_exercise` (`plan_day_id`, `exercise_name`, `sets`, `reps`, `rest_seconds`, `notes`, `sort_order`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
(@three_d1, '平板杠铃卧推', 4, '6-10', 120, '复合动作优先', 1, 'admin', NOW(), 'admin', NOW()),
(@three_d1, '上斜哑铃卧推', 3, '8-12', 90, '上胸重点', 2, 'admin', NOW(), 'admin', NOW()),
(@three_d1, '坐姿哑铃推举', 3, '8-12', 90, '肩部复合动作', 3, 'admin', NOW(), 'admin', NOW()),
(@three_d1, '侧平举', 3, '12-15', 60, '中束孤立', 4, 'admin', NOW(), 'admin', NOW()),
(@three_d1, '绳索下压', 3, '12-15', 45, '三头收尾', 5, 'admin', NOW(), 'admin', NOW());

-- 三分化 Day 2: 拉类训练
INSERT INTO `training_plan_day` (`plan_id`, `day_number`, `day_name`, `focus`, `sort_order`, `create_by`, `create_time`, `update_by`, `update_time`)
VALUES
(@three_split_id, 2, '拉类训练', '背/肩后束/肱二头肌', 2, 'admin', NOW(), 'admin', NOW());
SET @three_d2 = LAST_INSERT_ID();

INSERT INTO `training_plan_exercise` (`plan_day_id`, `exercise_name`, `sets`, `reps`, `rest_seconds`, `notes`, `sort_order`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
(@three_d2, '引体向上', 4, '力竭', 120, '背部王牌动作', 1, 'admin', NOW(), 'admin', NOW()),
(@three_d2, '杠铃划船', 4, '6-10', 90, '厚度训练', 2, 'admin', NOW(), 'admin', NOW()),
(@three_d2, '单臂哑铃划船', 3, '10-12', 75, '背阔肌宽度', 3, 'admin', NOW(), 'admin', NOW()),
(@three_d2, '面拉', 3, '15-20', 60, '后束+菱形肌', 4, 'admin', NOW(), 'admin', NOW()),
(@three_d2, '杠铃弯举', 3, '8-12', 60, '二头复合', 5, 'admin', NOW(), 'admin', NOW());

-- 三分化 Day 3: 腿部训练
INSERT INTO `training_plan_day` (`plan_id`, `day_number`, `day_name`, `focus`, `sort_order`, `create_by`, `create_time`, `update_by`, `update_time`)
VALUES
(@three_split_id, 3, '腿部训练', '股四头/腘绳肌/臀/小腿', 3, 'admin', NOW(), 'admin', NOW());
SET @three_d3 = LAST_INSERT_ID();

INSERT INTO `training_plan_exercise` (`plan_day_id`, `exercise_name`, `sets`, `reps`, `rest_seconds`, `notes`, `sort_order`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
(@three_d3, '杠铃深蹲', 4, '6-8', 150, '腿部基石动作', 1, 'admin', NOW(), 'admin', NOW()),
(@three_d3, '罗马尼亚硬拉', 4, '8-10', 90, '链后侧', 2, 'admin', NOW(), 'admin', NOW()),
(@three_d3, '腿举', 3, '10-12', 90, '高容量补充', 3, 'admin', NOW(), 'admin', NOW()),
(@three_d3, '腿弯举', 3, '12-15', 60, '腘绳孤立', 4, 'admin', NOW(), 'admin', NOW()),
(@three_d3, '提踵', 4, '15-20', 45, '小腿专项', 5, 'admin', NOW(), 'admin', NOW());


-- 6.3 凯圣王谭成义三分化
INSERT INTO `training_plan` (`user_id`, `name`, `type`, `description`, `days_per_week`, `difficulty`, `target_audience`, `tags`, `source`, `plan_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`)
VALUES
(NULL, '凯圣王谭成义三分化', 'kai-three-split', '改良版PPL分化，优化了肌群搭配和训练容量分配，兼顾力量与肌肥大。', 3, 'intermediate', '有一定基础，希望优化训练效率的中级训练者', '["增肌","力量","均衡","高效"]', 'system', 1, '0', 'admin', NOW(), 'admin', NOW());

SET @kai_split_id = LAST_INSERT_ID();

-- 凯圣王三分化 Day 1: 胸+三头+前肩
INSERT INTO `training_plan_day` (`plan_id`, `day_number`, `day_name`, `focus`, `sort_order`, `create_by`, `create_time`, `update_by`, `update_time`)
VALUES
(@kai_split_id, 1, '胸+三头+前肩', '胸大肌/肱三头肌/三角肌前束', 1, 'admin', NOW(), 'admin', NOW());
SET @kai_d1 = LAST_INSERT_ID();

INSERT INTO `training_plan_exercise` (`plan_day_id`, `exercise_name`, `sets`, `reps`, `rest_seconds`, `notes`, `sort_order`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
(@kai_d1, '平板杠铃卧推', 4, '5-8', 150, '大重量建立力量基础', 1, 'admin', NOW(), 'admin', NOW()),
(@kai_d1, '上斜哑铃卧推', 3, '8-12', 90, '中等重量肌肥大', 2, 'admin', NOW(), 'admin', NOW()),
(@kai_d1, '双杠臂屈伸', 3, '10-15', 60, '自重/负重均可', 3, 'admin', NOW(), 'admin', NOW()),
(@kai_d1, '绳索下压', 4, '10-15', 45, '三头多角度刺激', 4, 'admin', NOW(), 'admin', NOW()),
(@kai_d1, '过头臂屈伸', 3, '10-12', 60, '长头重点', 5, 'admin', NOW(), 'admin', NOW()),
(@kai_d1, '哑铃前平举', 3, '12-15', 45, '前束收尾', 6, 'admin', NOW(), 'admin', NOW());

-- 凯圣王三分化 Day 2: 背+二头+后肩
INSERT INTO `training_plan_day` (`plan_id`, `day_number`, `day_name`, `focus`, `sort_order`, `create_by`, `create_time`, `update_by`, `update_time`)
VALUES
(@kai_split_id, 2, '背+二头+后肩', '背阔肌/肱二头肌/三角肌后束', 2, 'admin', NOW(), 'admin', NOW());
SET @kai_d2 = LAST_INSERT_ID();

INSERT INTO `training_plan_exercise` (`plan_day_id`, `exercise_name`, `sets`, `reps`, `rest_seconds`, `notes`, `sort_order`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
(@kai_d2, '负重引体向上', 4, '5-8', 150, '力量优先', 1, 'admin', NOW(), 'admin', NOW()),
(@kai_d2, '杠铃划船', 4, '6-10', 90, '背部厚度', 2, 'admin', NOW(), 'admin', NOW()),
(@kai_d2, '直臂下压', 3, '12-15', 60, '背阔肌孤立', 3, 'admin', NOW(), 'admin', NOW()),
(@kai_d2, '杠铃弯举', 3, '6-10', 75, '二头力量', 4, 'admin', NOW(), 'admin', NOW()),
(@kai_d2, '锤式弯举', 3, '10-12', 60, '肱肌发展', 5, 'admin', NOW(), 'admin', NOW()),
(@kai_d2, '俯身飞鸟', 3, '12-15', 45, '后束塑形', 6, 'admin', NOW(), 'admin', NOW());

-- 凯圣王三分化 Day 3: 腿+中肩+核心
INSERT INTO `training_plan_day` (`plan_id`, `day_number`, `day_name`, `focus`, `sort_order`, `create_by`, `create_time`, `update_by`, `update_time`)
VALUES
(@kai_split_id, 3, '腿+中肩+核心', '下肢整体/三角肌中束/核心肌群', 3, 'admin', NOW(), 'admin', NOW());
SET @kai_d3 = LAST_INSERT_ID();

INSERT INTO `training_plan_exercise` (`plan_day_id`, `exercise_name`, `sets`, `reps`, `rest_seconds`, `notes`, `sort_order`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
(@kai_d3, '杠铃深蹲', 4, '5-8', 180, '腿部力量基石', 1, 'admin', NOW(), 'admin', NOW()),
(@kai_d3, '腿举', 3, '10-12', 90, '高容量刺激', 2, 'admin', NOW(), 'admin', NOW()),
(@kai_d3, '罗马尼亚硬拉', 3, '8-10', 90, '后链强化', 3, 'admin', NOW(), 'admin', NOW()),
(@kai_d3, '侧平举', 4, '12-15', 45, '中肩大量量', 4, 'admin', NOW(), 'admin', NOW()),
(@kai_d3, '悬垂举腿', 3, '12-15', 60, '下腹重点', 5, 'admin', NOW(), 'admin', NOW()),
(@kai_d3, '平板支撑', 3, '45-60秒', 45, '核心稳定', 6, 'admin', NOW(), 'admin', NOW());


-- 6.4 全身训练一分化
INSERT INTO `training_plan` (`user_id`, `name`, `type`, `description`, `days_per_week`, `difficulty`, `target_audience`, `tags`, `source`, `plan_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`)
VALUES
(NULL, '全身训练（一分化）', 'full-body', '每次训练覆盖全身主要肌群，适合初学者建立基础，或时间有限的训练者。建议每周2-3次。', 1, 'beginner', '健身新手或时间有限者', '["新手友好","全身","高效","基础建设"]', 'system', 1, '0', 'admin', NOW(), 'admin', NOW());

SET @full_body_id = LAST_INSERT_ID();

-- 一分化 Day 1: 全身综合训练
INSERT INTO `training_plan_day` (`plan_id`, `day_number`, `day_name`, `focus`, `sort_order`, `create_by`, `create_time`, `update_by`, `update_time`)
VALUES
(@full_body_id, 1, '全身综合训练', '全身主要肌群', 1, 'admin', NOW(), 'admin', NOW());
SET @full_d1 = LAST_INSERT_ID();

INSERT INTO `training_plan_exercise` (`plan_day_id`, `exercise_name`, `sets`, `reps`, `rest_seconds`, `notes`, `sort_order`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
(@full_d1, '杠铃深蹲', 3, '8-12', 120, '下肢复合动作之王', 1, 'admin', NOW(), 'admin', NOW()),
(@full_d1, '平板杠铃卧推', 3, '8-12', 90, '上肢推类基础', 2, 'admin', NOW(), 'admin', NOW()),
(@full_d1, '引体向上（辅助）', 3, '8-10', 90, '可用弹带辅助', 3, 'admin', NOW(), 'admin', NOW()),
(@full_d1, '坐姿哑铃推举', 3, '10-12', 75, '肩部全面发展', 4, 'admin', NOW(), 'admin', NOW()),
(@full_d1, '杠铃划船', 3, '8-12', 90, '背部厚度', 5, 'admin', NOW(), 'admin', NOW()),
(@full_d1, '杠铃硬拉', 2, '6-8', 150, '后链力量', 6, 'admin', NOW(), 'admin', NOW()),
(@full_d1, '平板支撑', 3, '30-45秒', 45, '核心稳定', 7, 'admin', NOW(), 'admin', NOW());


-- =============================================
-- 完成
-- =============================================
SELECT 'Training plan module initialized!' AS message;
SELECT COUNT(*) AS total_plans FROM training_plan WHERE plan_type = 1;
