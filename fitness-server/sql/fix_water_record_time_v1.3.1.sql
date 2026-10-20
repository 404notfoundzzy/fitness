-- =====================================================
-- 修复 water_record 表 record_time 字段约束问题
-- 版本: v1.3.1
-- 日期: 2026-05-08
-- 问题: Field 'record_time' doesn't have a default value
-- 解决方案: 允许 NULL 值，并在应用层处理默认值
-- =====================================================

USE fitness;

-- 修改 record_time 字段允许为 NULL
ALTER TABLE `water_record`
MODIFY COLUMN `record_time` DATETIME DEFAULT NULL COMMENT '记录时间（可选，NULL表示只记录了日期）';

-- 验证修改结果
SELECT
    COLUMN_NAME,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'fitness'
  AND TABLE_NAME = 'water_record'
  AND COLUMN_NAME IN ('record_time', 'record_date');

-- 显示修改成功信息
SELECT '✅ water_record 表 record_time 字段已修复：允许 NULL 值' AS result;
