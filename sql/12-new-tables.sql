-- ============================================================
-- openGym 整合 D6：新表 exercise_pr / plan_progression_state
-- 生成：docs/openGym整合方案.md 第 4.4 节（阶段 3）
-- 变更：两张新表（无存量数据影响）
-- 备份：无需（新表）；执行前仍建议全量备份（方案 4.0 第 1 步）
-- 回滚：
--   DROP TABLE IF EXISTS exercise_pr;
--   DROP TABLE IF EXISTS plan_progression_state;
-- ============================================================

-- 个人纪录：保存训练时按动作检测 1RM 估算/最大次数/最大单组容量三类
CREATE TABLE IF NOT EXISTS exercise_pr (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id     BIGINT NOT NULL,
  exercise_id BIGINT NOT NULL,
  type        VARCHAR(16)  COMMENT '1rm/max_reps/max_volume',
  value       DECIMAL(10,2),
  achieved_at DATE,
  workout_record_id BIGINT,
  INDEX idx_pr_user_ex (user_id, exercise_id)
) COMMENT '个人纪录';

-- 渐进状态机：每计划每动作持久化当前重量/次数/阶段/减载计数
-- （算法本身为纯函数推导，此表为可选缓存；删除后由历史重新推导）
CREATE TABLE IF NOT EXISTS plan_progression_state (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id       BIGINT NOT NULL,
  plan_id       BIGINT NOT NULL,
  exercise_id   BIGINT NOT NULL,
  current_weight DECIMAL(8,2),
  current_reps  INT,
  stage         INT DEFAULT 0 COMMENT '双倍/三倍进阶阶段',
  deload_count  INT DEFAULT 0,
  updated_at    DATETIME,
  UNIQUE KEY uk_state (user_id, plan_id, exercise_id)
) COMMENT '渐进状态机（每计划每动作）';
