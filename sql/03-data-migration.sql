-- ============================================================
-- 数据迁移脚本 - 为70条计划记录匹配exercise_id
-- 时间：2026-05-08
-- 说明：通过名称匹配将training_plan_exercise与exercise关联
-- ============================================================

-- 步骤1：基于精确匹配更新大部分记录
UPDATE training_plan_exercise tpe
INNER JOIN exercise e ON tpe.exercise_name = e.name
SET tpe.exercise_id = e.id;

SELECT CONCAT('✓ 精确匹配完成，已更新 ', ROW_COUNT(), ' 条记录') AS 状态;

-- 步骤2：查看未匹配的记录（模糊匹配）
SELECT 
    tpe.id,
    tpe.exercise_name AS 计划动作名,
    e.name AS 最接近的标准动作名,
    e.id AS 建议的exercise_id
FROM training_plan_exercise tpe
LEFT JOIN exercise e ON tpe.exercise_name LIKE CONCAT('%', SUBSTRING_INDEX(tpe.exercise_name, '（', 1), '%')
WHERE tpe.exercise_id IS NULL
LIMIT 30;
