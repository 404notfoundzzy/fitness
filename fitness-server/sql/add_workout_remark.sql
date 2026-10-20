USE fitness;

-- =============================================
-- 运动记录表添加备注字段
-- =============================================

ALTER TABLE workout_record 
ADD COLUMN `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注' 
AFTER `exercise_count`;

-- 验证字段是否添加成功
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'fitness' 
  AND TABLE_NAME = 'workout_record' 
  AND COLUMN_NAME = 'remark';
