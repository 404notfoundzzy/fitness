-- ============================================================
-- openGym 整合 D4：workout_exercise_detail 组级记录扩展
-- 生成：docs/openGym整合方案.md 第 4.2 节（阶段 3）
-- 变更：+6 列（set_type/rir/rpe/superset_group/per_side/is_pr）
-- 备份：执行前按方案 4.0 规范——
--   CREATE TABLE workout_exercise_detail_bak_20261021 AS SELECT * FROM workout_exercise_detail;
--   SELECT COUNT(*) FROM workout_exercise_detail;  -- 记录迁移前计数
-- 回滚：
--   ALTER TABLE workout_exercise_detail
--     DROP COLUMN set_type, DROP COLUMN rir, DROP COLUMN rpe,
--     DROP COLUMN superset_group, DROP COLUMN per_side, DROP COLUMN is_pr;
--   -- 或从快照恢复：TRUNCATE workout_exercise_detail; INSERT INTO workout_exercise_detail SELECT * FROM workout_exercise_detail_bak_20261021;
-- 兼容：全部可空/有默认值，旧记录 set_type='normal'、is_pr=0，零迁移成本
-- ============================================================
ALTER TABLE workout_exercise_detail
  ADD COLUMN set_type        VARCHAR(16)  DEFAULT 'normal' COMMENT '组类型：normal/warmup/drop/rest-pause/failure',
  ADD COLUMN rir             TINYINT      NULL COMMENT '保留次数 RIR 0-10',
  ADD COLUMN rpe             DECIMAL(3,1) NULL COMMENT 'RPE 6-10（与 rir 二选一）',
  ADD COLUMN superset_group  INT          NULL COMMENT '超级组分组号（同号连续）',
  ADD COLUMN per_side        TINYINT      DEFAULT 0 COMMENT '单侧计次（左/右各一行）',
  ADD COLUMN is_pr           TINYINT      DEFAULT 0 COMMENT '是否个人纪录（后端保存时检测写入）';
