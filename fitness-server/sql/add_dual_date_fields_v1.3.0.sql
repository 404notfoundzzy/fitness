-- 运动记录表添加训练日期字段
ALTER TABLE `workout_record`
ADD COLUMN `workout_date` DATE DEFAULT NULL COMMENT '训练日期' AFTER `name`;

-- 饮水记录表添加记录日期字段
ALTER TABLE `water_record`
ADD COLUMN `record_date` DATE DEFAULT NULL COMMENT '记录日期' AFTER `drink_type`;
