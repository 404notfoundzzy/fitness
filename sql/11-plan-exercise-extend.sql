-- ============================================================
-- openGym 整合 D5：training_plan_exercise 计划侧目标扩展
-- 生成：docs/openGym整合方案.md 第 4.3 节（阶段 3）
-- 变更：+6 列（target_sets/target_reps/rest_seconds/target_rir/progression_rule/progression_params）
-- 备份：执行前按方案 4.0 规范——
--   CREATE TABLE training_plan_exercise_bak_20261021 AS SELECT * FROM training_plan_exercise;
--   SELECT COUNT(*) FROM training_plan_exercise;
-- 回滚：
--   ALTER TABLE training_plan_exercise
--     DROP COLUMN target_sets, DROP COLUMN target_reps, DROP COLUMN rest_seconds,
--     DROP COLUMN target_rir, DROP COLUMN progression_rule, DROP COLUMN progression_params;
--   -- 或从快照恢复
-- 兼容：旧计划全 NULL，读取按默认（linear、步长取器械默认、休息 90s）
-- ============================================================
ALTER TABLE training_plan_exercise
  ADD COLUMN target_sets      INT          NULL COMMENT '目标组数',
  ADD COLUMN target_reps      VARCHAR(32)  NULL COMMENT '目标次数：8 或 8-12',
  ADD COLUMN rest_seconds     INT          NULL COMMENT '组间休息秒数',
  ADD COLUMN target_rir       TINYINT      NULL COMMENT '目标 RIR',
  ADD COLUMN progression_rule VARCHAR(32)  NULL COMMENT 'off/linear/greyskull/double/triple/time',
  ADD COLUMN progression_params JSON       COMMENT '规则参数：步长/次数区间/减载因子等';
