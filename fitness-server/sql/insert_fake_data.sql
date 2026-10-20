SET NAMES utf8mb4;

INSERT INTO `workout_record` (`user_id`, `name`, `start_time`, `end_time`, `duration_minutes`, `volume`, `exercise_count`, `status`, `create_by`, `create_time`, `update_by`, `update_time`) VALUES
(1, '跑步', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 6 DAY), INTERVAL 40 MINUTE), 40, 0, 1, 'completed', 'admin', NOW(), 'admin', NOW()),
(1, '力量训练', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 5 DAY), INTERVAL 60 MINUTE), 60, 3200.5, 6, 'completed', 'admin', NOW(), 'admin', NOW()),
(1, '高强度间歇训练', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 4 DAY), INTERVAL 90 MINUTE), 90, 0, 8, 'completed', 'admin', NOW(), 'admin', NOW()),
(1, '瑜伽', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 3 DAY), INTERVAL 50 MINUTE), 50, 0, 5, 'completed', 'admin', NOW(), 'admin', NOW()),
(1, '力量训练', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 2 DAY), INTERVAL 70 MINUTE), 70, 4500.0, 7, 'completed', 'admin', NOW(), 'admin', NOW()),
(1, '游泳', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 1 DAY), INTERVAL 30 MINUTE), 30, 0, 1, 'completed', 'admin', NOW(), 'admin', NOW()),
(1, '力量训练', NOW(), DATE_ADD(NOW(), INTERVAL 85 MINUTE), 85, 2100.0, 5, 'completed', 'admin', NOW(), 'admin', NOW()),
(1, '拉伸', DATE_SUB(NOW(), INTERVAL 5 HOUR), DATE_ADD(DATE_SUB(NOW(), INTERVAL 5 HOUR), INTERVAL 15 MINUTE), 15, 0, 4, 'completed', 'admin', NOW(), 'admin', NOW());

UPDATE `daily_stats` SET `activity_duration_minutes` = 40, `calories_burned` = 450, `steps` = 6000 WHERE `user_id` = 1 AND `date` = DATE(DATE_SUB(NOW(), INTERVAL 6 DAY));
UPDATE `daily_stats` SET `activity_duration_minutes` = 60, `calories_burned` = 600, `steps` = 8000 WHERE `user_id` = 1 AND `date` = DATE(DATE_SUB(NOW(), INTERVAL 5 DAY));
UPDATE `daily_stats` SET `activity_duration_minutes` = 90, `calories_burned` = 850, `steps` = 10000 WHERE `user_id` = 1 AND `date` = DATE(DATE_SUB(NOW(), INTERVAL 4 DAY));
UPDATE `daily_stats` SET `activity_duration_minutes` = 50, `calories_burned` = 300, `steps` = 5000 WHERE `user_id` = 1 AND `date` = DATE(DATE_SUB(NOW(), INTERVAL 3 DAY));
UPDATE `daily_stats` SET `activity_duration_minutes` = 70, `calories_burned` = 700, `steps` = 9000 WHERE `user_id` = 1 AND `date` = DATE(DATE_SUB(NOW(), INTERVAL 2 DAY));
UPDATE `daily_stats` SET `activity_duration_minutes` = 30, `calories_burned` = 400, `steps` = 4500 WHERE `user_id` = 1 AND `date` = DATE(DATE_SUB(NOW(), INTERVAL 1 DAY));
UPDATE `daily_stats` SET `activity_duration_minutes` = 100, `calories_burned` = 900, `steps` = 12000 WHERE `user_id` = 1 AND `date` = DATE(NOW());
