-- ============================================================
-- 数据迁移脚本 - 处理剩余27条模糊匹配记录
-- 时间：2026-05-08
-- ============================================================

-- 手动映射剩余的27条记录
UPDATE training_plan_exercise SET exercise_id = 20 WHERE exercise_name = '杠铃卧推' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 20 WHERE exercise_name = '杠铃卧推（传统/宽握距）' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 23 WHERE exercise_name = '哑铃飞鸟' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 24 WHERE exercise_name = '俯卧撑（高/低变式）' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 25 WHERE exercise_name = '引体向上（高位下拉替代）' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 26 WHERE exercise_name = '硬拉（传统/直腿）' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 28 WHERE exercise_name = '双杠臂屈伸（三头集中重）' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 29 WHERE exercise_name = '引体向上' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 31 WHERE exercise_name = '反向引体向上' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 32 WHERE exercise_name = '杠铃划船' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 33 WHERE exercise_name = '单臂哑铃划船' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 34 WHERE exercise_name = '高位下拉' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 35 WHERE exercise_name = '坐姿绳索划船' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 36 WHERE exercise_name = '罗马尼亚硬拉（传统/直腿）' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 37 WHERE exercise_name = 'T杠划船' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 38 WHERE exercise_name = '直臂下压' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 39 WHERE exercise_name = '腿部推举/臀腿机' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 40 WHERE exercise_name = '杠铃/哑铃推举（坐姿/站姿）' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 41 WHERE exercise_name = '哑铃侧平举' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 42 WHERE exercise_name = '哑铃前平举' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 43 WHERE exercise_name = '面拉（Face Pull）' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 44 WHERE exercise_name = '健身飞鸟（绳索/器械）' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 45 WHERE exercise_name = '阿诺德推举' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 46 WHERE exercise_name = '杠铃/哑铃弯举（手臂/斜托机）' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 47 WHERE exercise_name = '杠铃/哑铃站立划船' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 48 WHERE exercise_name = '杠铃/哑铃举腿（站姿/坐姿）' AND exercise_id IS NULL;
UPDATE training_plan_exercise SET exercise_id = 49 WHERE exercise_name = '锤式弯举' AND exercise_id IS NULL;

SELECT CONCAT('✓ 模糊匹配完成') AS 状态;

-- 最终验证
SELECT 
    COUNT(*) AS 总记录数,
    SUM(CASE WHEN exercise_id IS NOT NULL THEN 1 ELSE 0 END) AS 已匹配数,
    SUM(CASE WHEN exercise_id IS NULL THEN 1 ELSE 0 END) AS 未匹配数
FROM training_plan_exercise;

-- 显示仍未匹配的记录
SELECT id, exercise_name 
FROM training_plan_exercise 
WHERE exercise_id IS NULL;
