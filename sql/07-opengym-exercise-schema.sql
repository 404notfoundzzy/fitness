-- ============================================================
-- openGym 整合：exercise 表结构扩展（阶段 2）
-- 生成：scripts/opengym-exercise-import.mjs（上游 commit e348fc1）
-- 说明：一次性迁移；如列已存在请忽略对应报错。
-- ============================================================
ALTER TABLE exercise
  ADD COLUMN body_part        VARCHAR(64)  NULL COMMENT '身体部位（上游 bp）',
  ADD COLUMN equipment        VARCHAR(64)  NULL COMMENT '器械（规范值）',
  ADD COLUMN primary_muscle   VARCHAR(64)  NULL COMMENT '主肌肉（规范 slug）',
  ADD COLUMN secondary_muscle VARCHAR(64)  NULL COMMENT '次要肌肉（规范 slug）',
  ADD COLUMN secondary_muscles VARCHAR(512) NULL COMMENT '次要肌肉列表 JSON',
  ADD COLUMN category_en      VARCHAR(64)  NULL COMMENT '英文分类（上游 cat）',
  ADD COLUMN source           VARCHAR(16)  NULL DEFAULT 'user' COMMENT '来源：system/opengym/user',
  ADD COLUMN source_id        VARCHAR(16)  NULL COMMENT '上游动作 id';

-- 按来源筛选（App 可选只显示 system/opengym 子集）
ALTER TABLE exercise ADD INDEX idx_exercise_source (source);
