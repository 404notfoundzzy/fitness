-- ========================================
-- 数据库注释修复脚本
-- 执行时间: 2026-04-16
-- 说明: 修复所有表的中文注释
-- ========================================

USE fitness;

-- =============================================
-- 1. diet_record 饮食记录表 - 添加表和字段注释
-- =============================================

ALTER TABLE diet_record COMMENT = '饮食记录表';

ALTER TABLE diet_record 
MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT COMMENT '记录ID';

ALTER TABLE diet_record 
MODIFY COLUMN user_id BIGINT NOT NULL COMMENT '用户ID';

ALTER TABLE diet_record 
MODIFY COLUMN meal_type VARCHAR(20) NOT NULL COMMENT '餐次(早餐/午餐/晚餐/加餐)';

ALTER TABLE diet_record 
MODIFY COLUMN food_name VARCHAR(100) NOT NULL COMMENT '食物名称';

ALTER TABLE diet_record 
MODIFY COLUMN amount DECIMAL(8,2) DEFAULT '1.00' COMMENT '食用量';

ALTER TABLE diet_record 
MODIFY COLUMN unit VARCHAR(20) DEFAULT 'fen' COMMENT '单位(份/g/ml)';

ALTER TABLE diet_record 
MODIFY COLUMN calories INT DEFAULT '0' COMMENT '热量(kcal)';

ALTER TABLE diet_record 
MODIFY COLUMN protein_g DECIMAL(6,2) DEFAULT '0.00' COMMENT '蛋白质(g)';

ALTER TABLE diet_record 
MODIFY COLUMN carbs_g DECIMAL(6,2) DEFAULT '0.00' COMMENT '碳水化合物(g)';

ALTER TABLE diet_record 
MODIFY COLUMN fat_g DECIMAL(6,2) DEFAULT '0.00' COMMENT '脂肪(g)';

ALTER TABLE diet_record 
MODIFY COLUMN diet_date DATE NOT NULL COMMENT '饮食日期';

ALTER TABLE diet_record 
MODIFY COLUMN record_time DATETIME NOT NULL COMMENT '记录时间';

ALTER TABLE diet_record 
MODIFY COLUMN image_url VARCHAR(255) DEFAULT NULL COMMENT '图片URL';

ALTER TABLE diet_record 
MODIFY COLUMN remark VARCHAR(255) DEFAULT NULL COMMENT '备注';

ALTER TABLE diet_record 
MODIFY COLUMN del_flag CHAR(1) DEFAULT '0' COMMENT '删除标志(0正常 1已删除)';

ALTER TABLE diet_record 
MODIFY COLUMN del_time DATETIME DEFAULT NULL COMMENT '删除时间';

ALTER TABLE diet_record 
MODIFY COLUMN create_by VARCHAR(64) DEFAULT '' COMMENT '创建者';

ALTER TABLE diet_record 
MODIFY COLUMN create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';

ALTER TABLE diet_record 
MODIFY COLUMN update_by VARCHAR(64) DEFAULT '' COMMENT '更新者';

ALTER TABLE diet_record 
MODIFY COLUMN update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间';


-- =============================================
-- 2. water_record 饮水记录表 - 添加表和字段注释
-- =============================================

ALTER TABLE water_record COMMENT = '饮水记录表';

ALTER TABLE water_record 
MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT COMMENT '记录ID';

ALTER TABLE water_record 
MODIFY COLUMN user_id BIGINT NOT NULL COMMENT '用户ID';

ALTER TABLE water_record 
MODIFY COLUMN amount_ml INT NOT NULL COMMENT '饮水量(ml)';

ALTER TABLE water_record 
MODIFY COLUMN drink_type VARCHAR(30) DEFAULT 'water' COMMENT '饮水类型(水/茶/咖啡等)';

ALTER TABLE water_record 
MODIFY COLUMN record_time DATETIME NOT NULL COMMENT '记录时间';

ALTER TABLE water_record 
MODIFY COLUMN remark VARCHAR(255) DEFAULT NULL COMMENT '备注';

ALTER TABLE water_record 
MODIFY COLUMN del_flag CHAR(1) DEFAULT '0' COMMENT '删除标志(0正常 1已删除)';

ALTER TABLE water_record 
MODIFY COLUMN del_time DATETIME DEFAULT NULL COMMENT '删除时间';

ALTER TABLE water_record 
MODIFY COLUMN create_by VARCHAR(64) DEFAULT '' COMMENT '创建者';

ALTER TABLE water_record 
MODIFY COLUMN create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';

ALTER TABLE water_record 
MODIFY COLUMN update_by VARCHAR(64) DEFAULT '' COMMENT '更新者';

ALTER TABLE water_record 
MODIFY COLUMN update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间';


-- =============================================
-- 3. workout_record 运动记录表 - 修复volume字段注释
-- =============================================

ALTER TABLE workout_record 
MODIFY COLUMN volume DECIMAL(10,2) DEFAULT NULL COMMENT '训练容量(累计重量kg)';


-- =============================================
-- 验证所有表注释
-- =============================================
SELECT 
    TABLE_NAME AS '表名',
    TABLE_COMMENT AS '表注释'
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'fitness'
ORDER BY TABLE_NAME;
