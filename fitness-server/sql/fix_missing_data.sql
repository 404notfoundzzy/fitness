-- ========================================
-- 修复脚本：补全缺失数据
-- 版本: v1.1.0-fix
-- ========================================

USE `fitness`;

-- 1. 性别字典数据（如果不存在则插入）
INSERT IGNORE INTO `sys_dict_data` (`dict_sort`, `dict_label`, `dict_value`, `dict_type`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
(1, '男', 'male', 'sys_gender', 'N', '0', 'admin', NOW(), 'admin', NOW()),
(2, '女', 'female', 'sys_gender', 'N', '0', 'admin', NOW(), 'admin', NOW());

-- 2. 健身目标字典类型（如果不存在则插入）
INSERT IGNORE INTO `sys_dict_type` (`dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`)
VALUES ('健身目标', 'sys_fitness_goal', '0', 'admin', NOW(), 'admin', NOW(), '用户健身目标选择');

-- 3. 健身目标字典数据（如果不存在则插入）
INSERT IGNORE INTO `sys_dict_data` (`dict_sort`, `dict_label`, `dict_value`, `dict_type`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
(1, '减脂塑形', 'lose_weight', 'sys_fitness_goal', 'N', '0', 'admin', NOW(), 'admin', NOW()),
(2, '增肌增重', 'gain_muscle', 'sys_fitness_goal', 'N', '0', 'admin', NOW(), 'admin', NOW()),
(3, '保持健康', 'maintain', 'sys_fitness_goal', 'Y', '0', 'admin', NOW(), 'admin', NOW()),
(4, '提升耐力', 'endurance', 'sys_fitness_goal', 'N', '0', 'admin', NOW(), 'admin', NOW()),
(5, '增强力量', 'strength', 'sys_fitness_goal', 'N', '0', 'admin', NOW(), 'admin', NOW()),
(6, '提升柔韧性', 'flexibility', 'sys_fitness_goal', 'N', '0', 'admin', NOW(), 'admin', NOW());
