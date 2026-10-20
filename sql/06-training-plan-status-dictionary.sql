-- ============================================================
-- 训练计划状态字典初始化脚本
-- 时间：2026-05-11
-- 说明：为training_plan表建立标准化的状态管理系统
-- ============================================================

-- 步骤1：插入字典类型定义
INSERT INTO `sys_dict_type` (
    `dict_name`, 
    `dict_type`, 
    `status`, 
    `create_by`, 
    `create_time`, 
    `update_by`, 
    `update_time`, 
    `remark`
) VALUES (
    '训练计划状态', 
    'training_plan_status', 
    '0', 
    'admin', 
    NOW(), 
    'admin', 
    NOW(), 
    '管理训练计划的生命周期状态'
)
ON DUPLICATE KEY UPDATE dict_name = VALUES(dict_name), remark = VALUES(remark);

SELECT '✅ 字典类型创建完成' AS 状态;

-- 步骤2：插入状态字典数据（6个核心状态）
INSERT INTO `sys_dict_data` (
    `dict_sort`, 
    `dict_label`, 
    `dict_value`, 
    `dict_type`, 
    `css_class`, 
    `list_class`, 
    `is_default`, 
    `status`, 
    `create_by`, 
    `create_time`, 
    `update_by`, 
    `update_time`, 
    `remark`
) VALUES 

-- 状态1：未开始（默认状态）
(
    1, 
    '未开始', 
    '0', 
    'training_plan_status', 
    '', 
    'info', 
    'Y', 
    '0', 
    'admin', 
    NOW(), 
    'admin', 
    NOW(), 
    '计划已激活但尚未开始任何训练动作'
),

-- 状态2：进行中
(
    2, 
    '训练中', 
    '1', 
    'training_plan_status', 
    '', 
    'warning', 
    'N', 
    '0', 
    'admin', 
    NOW(), 
    'admin', 
    NOW(), 
    '正在执行训练，进度在0%-100%之间'
),

-- 状态3：已暂停
(
    3, 
    '已暂停', 
    '2', 
    'training_plan_status', 
    '', 
    'danger', 
    'N', 
    '0', 
    'admin', 
    NOW(), 
    'admin', 
    NOW(), 
    '用户主动暂停训练，保留当前进度'
),

-- 状态4：已完成
(
    4, 
    '已完成', 
    '3', 
    'training_plan_status', 
    '', 
    'success', 
    'N', 
    '0', 
    'admin', 
    NOW(), 
    'admin', 
    NOW(), 
    '所有训练动作均已完成，进度达到100%'
),

-- 状态5：已归档
(
    5, 
    '已归档', 
    '4', 
    'training_plan_status', 
    '', 
    'default', 
    'N', 
    '0', 
    'admin', 
    NOW(), 
    'admin', 
    NOW(), 
    '计划已结束归档，不再显示在活跃列表中'
),

-- 状态6：已过期
(
    6, 
    '已过期', 
    '5', 
    'training_plan_status', 
    '', 
    'danger', 
    'N', 
    '0', 
    'admin', 
    NOW(), 
    'admin', 
    NOW(), 
    '计划周期已过但未完成，需要重新激活'
)

ON DUPLICATE KEY UPDATE 
    dict_label = VALUES(dict_label),
    css_class = VALUES(css_class),
    list_class = VALUES(list_class),
    remark = VALUES(remark);

SELECT '✅ 状态字典数据插入完成（6个状态）' AS 状态;

-- 步骤3：验证字典数据
SELECT 
    dict_sort AS 序号,
    dict_label AS 状态名称,
    dict_value AS 状态值,
    list_class AS 样式类,
    is_default AS 默认,
    remark AS 说明
FROM sys_dict_data 
WHERE dict_type = 'training_plan_status' 
AND status = '0'
ORDER BY dict_sort;

-- 步骤4：更新现有数据的status字段注释
ALTER TABLE `training_plan` 
MODIFY COLUMN `status` CHAR(1) NOT NULL DEFAULT '0' 
COMMENT '计划状态（0未开始/1训练中/2已暂停/3已完成/4已归档/5已过期）';

SELECT '✅ training_plan表status字段注释已更新' AS 状态;

-- 步骤5：将现有的'0'和'1'统一映射到新状态体系
UPDATE training_plan SET status = '0' WHERE status IS NULL OR status = '';
UPDATE training_plan SET status = '1' WHERE status = '1' AND progress > 0 AND progress < 100;
UPDATE training_plan SET status = '3' WHERE status = '1' AND progress >= 100;

SELECT CONCAT('✅ 历史数据状态映射完成') AS 状态;

-- 最终统计
SELECT '═══════════════════════════════════════' AS '';
SELECT '       训练计划状态系统部署完成！          ' AS 结果;
SELECT '═══════════════════════════════════════' AS '';

SELECT 
    COUNT(*) AS 总计划数,
    SUM(CASE WHEN status = '0' THEN 1 ELSE 0 END) AS 未开始,
    SUM(CASE WHEN status = '1' THEN 1 ELSE 0 END) AS 训练中,
    SUM(CASE WHEN status = '2' THEN 1 ELSE 0 END) AS 已暂停,
    SUM(CASE WHEN status = '3' THEN 1 ELSE 0 END) AS 已完成,
    SUM(CASE WHEN status = '4' THEN 1 ELSE 0 END) AS 已归档,
    SUM(CASE WHEN status = '5' THEN 1 ELSE 0 END) AS 已过期
FROM training_plan;
