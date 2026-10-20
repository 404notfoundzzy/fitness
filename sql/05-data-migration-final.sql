-- ============================================================
-- 数据迁移最终脚本 - 基于ID精确映射
-- 时间：2026-05-08
-- ============================================================

-- 根据实际数据手动映射剩余27条记录
UPDATE training_plan_exercise SET exercise_id = 32 WHERE id IN (3, 8, 58);  -- 杠铃划船
UPDATE training_plan_exercise SET exercise_id = 46 WHERE id IN (4);          -- 锤式弯举
UPDATE training_plan_exercise SET exercise_id = 26 WHERE id IN (5, 11, 46, 61); -- 硬拉
UPDATE training_plan_exercise SET exercise_id = 23 WHERE id IN (6, 56);      -- 哑铃飞鸟
UPDATE training_plan_exercise SET exercise_id = 40 WHERE id IN (9, 59);      -- 推举
UPDATE training_plan_exercise SET exercise_id = 20 WHERE id IN (13, 63);     -- 杠铃卧推
UPDATE training_plan_exercise SET exercise_id = 48 WHERE id IN (14, 64);     -- 举腿
UPDATE training_plan_exercise SET exercise_id = 52 WHERE id IN (18, 23, 68); -- 肩上推举
UPDATE training_plan_exercise SET exercise_id = 55 WHERE id IN (19, 69);     -- 双杠臂屈伸
UPDATE training_plan_exercise SET exercise_id = 24 WHERE id IN (24);         -- 俯卧撑
UPDATE training_plan_exercise SET exercise_id = 43 WHERE id IN (34);         -- 面拉
UPDATE training_plan_exercise SET exercise_id = 21 WHERE id IN (42);        -- 上斜杠铃卧推
UPDATE training_plan_exercise SET exercise_id = 50 WHERE id IN (45);        -- 箭步蹲
UPDATE training_plan_exercise SET exercise_id = 29 WHERE id IN (47);        -- 引体向上
UPDATE training_plan_exercise SET exercise_id = 81 WHERE id IN (55);        -- 动态拉伸组合

SELECT '✓ 所有记录迁移完成' AS 状态;

-- 最终验证
SELECT 
    COUNT(*) AS 总记录数,
    SUM(CASE WHEN exercise_id IS NOT NULL THEN 1 ELSE 0 END) AS 已匹配数,
    CONCAT(ROUND(SUM(CASE WHEN exercise_id IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*) * 100, 1), '%') AS 匹配率
FROM training_plan_exercise;

-- 显示关联统计
SELECT 
    e.name AS 标准动作名,
    COUNT(tpe.id) AS 关联计划次数,
    GROUP_CONCAT(DISTINCT tpe.reps SEPARATOR '、') AS 组数示例
FROM exercise e
INNER JOIN training_plan_exercise tpe ON e.id = tpe.exercise_id
WHERE e.is_system = 1
GROUP BY e.name
ORDER BY 关联计划次数 DESC
LIMIT 15;
