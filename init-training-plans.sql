-- ============================================================
-- 系统推荐训练计划初始化SQL（中文版）
-- 作者：AI助手
-- 时间：2026-05-08
-- 说明：创建4个完整的系统推荐训练计划（计划1已存在）
-- ============================================================

-- 计划2：全身基础训练的训练日和动作
INSERT INTO training_plan_day (plan_id, day_name, day_number, sort_order) VALUES (2, '全身训练A', 1, 1);
INSERT INTO training_plan_day (plan_id, day_name, day_number, sort_order) VALUES (2, '全身训练B', 2, 2);
INSERT INTO training_plan_day (plan_id, day_name, day_number, sort_order) VALUES (2, '全身训练C', 3, 3);

-- 全身训练A的动作
INSERT INTO training_plan_exercise (plan_day_id, exercise_name, sets, reps, rest_seconds, notes, sort_order) VALUES
(6, '深蹲', 3, '10-12', 90, '保持背部挺直，膝盖不超过脚尖', 1),
(6, '俯卧撑', 3, '8-15', 60, '身体呈一条直线，胸部贴近地面', 2),
(6, '哑铃划船', 3, '10-12', 75, '收紧肩胛骨，感受背部发力', 3),
(6, '坐姿推举', 3, '10-12', 75, '核心收紧，避免过度反弓腰部', 4),
(6, '平板支撑', 3, '30-45秒', 45, '保持身体稳定，不要塌腰', 5);

-- 全身训练B的动作
INSERT INTO training_plan_exercise (plan_day_id, exercise_name, sets, reps, rest_seconds, notes, sort_order) VALUES
(7, '硬拉', 3, '6-8', 120, '保持脊柱中立，臀部驱动起身', 1),
(7, '引体向上', 3, 'Failure', 90, '如果无法完成可使用弹力带辅助', 2),
(7, '哑铃卧推', 3, '10-12', 75, '控制下放速度，感受胸肌拉伸', 3),
(7, '哑铃箭步蹲', 3, '每侧10-12', 60, '前脚掌着地，后膝接近地面', 4),
(7, '俄罗斯转体', 3, '20次', 45, '双脚离地，左右转动躯干', 5);

-- 全身训练C的动作
INSERT INTO training_plan_exercise (plan_day_id, exercise_name, sets, reps, rest_seconds, notes, sort_order) VALUES
(8, '罗马尼亚硬拉', 3, '10-12', 75, '微屈膝，感受大腿后侧拉伸', 1),
(8, '杠铃划船', 3, '8-10', 90, '肘部夹紧身体，避免借力', 2),
(8, '肩上推举', 3, '10-12', 75, '核心稳定，避免弓背', 3),
(8, '三头臂屈伸', 3, '10-15', 60, '大臂贴紧身体，只动前臂', 4),
(8, '卷腹', 3, '15-20', 45, '缓慢卷起，感受腹肌收缩', 5);


-- 计划3：上下肢分化进阶
INSERT INTO training_plan (user_id, name, type, description, days_per_week, difficulty, target_audience, tags, source, plan_type, status) 
VALUES (NULL, '上下肢分化进阶', 'upper-lower-split', '每周4天的上下肢分化训练，上肢专注推拉动作，下肢强化腿部力量，适合有一定基础的训练者。', 4, 'intermediate', '有3-6个月训练经验者', '分化,进阶,增肌,力量', 'system', 1, '1');

SET @plan3 = LAST_INSERT_ID();

INSERT INTO training_plan_day (plan_id, day_name, day_number, sort_order) VALUES (@plan3, '上肢推训练', 1, 1);
INSERT INTO training_plan_day (plan_id, day_name, day_number, sort_order) VALUES (@plan3, '下肢力量训练', 2, 2);
INSERT INTO training_plan_day (plan_id, day_name, day_number, sort_order) VALUES (@plan3, '上肢拉训练', 3, 3);
INSERT INTO training_plan_day (plan_id, day_name, day_number, sort_order) VALUES (@plan3, '下肢强化与核心', 4, 4);

SET @d3_1 = @plan3 * 10 + 1;
SET @d3_2 = @plan3 * 10 + 2;
SET @d3_3 = @plan3 * 10 + 3;
SET @d3_4 = @plan3 * 10 + 4;

-- 上肢推训练动作
INSERT INTO training_plan_exercise (plan_day_id, exercise_name, sets, reps, rest_seconds, notes, sort_order) VALUES
((SELECT id FROM training_plan_day WHERE plan_id = @plan3 AND day_number = 1), '杠铃卧推', 4, '6-8', 120, '握距略宽于肩，触胸后爆发推起', 1),
((SELECT id FROM training_plan_day WHERE plan_id = @plan3 AND day_number = 1), '上斜哑铃飞鸟', 3, '12-15', 60, '感受胸肌上部拉伸和收缩', 2),
((SELECT id FROM training_plan_day WHERE plan_id = @plan3 AND day_number = 1), '肩上推举', 4, '8-10', 90, '站姿或坐姿，全程控制', 3),
((SELECT id FROM training_plan_day WHERE plan_id = @plan3 AND day_number = 1), '侧平举', 3, '15-20', 45, '轻重量，注重肌肉感受', 4),
((SELECT id FROM training_plan_day WHERE plan_id = @plan3 AND day_number = 1), '三头绳索下压', 3, '12-15', 60, '大臂固定，只动前臂', 5);

-- 下肢力量训练动作
INSERT INTO training_plan_exercise (plan_day_id, exercise_name, sets, reps, rest_seconds, notes, sort_order) VALUES
((SELECT id FROM training_plan_day WHERE plan_id = @plan3 AND day_number = 2), '杠铃深蹲', 4, '6-8', 150, '蹲至大腿平行地面或更低', 1),
((SELECT id FROM training_plan_day WHERE plan_id = @plan3 AND day_number = 2), '罗马尼亚硬拉', 4, '8-10', 90, '重点刺激大腿后侧和臀部', 2),
((SELECT id FROM training_plan_day WHERE plan_id = @plan3 AND day_number = 2), '腿举', 3, '10-12', 75, '脚位高低可调整刺激部位', 3),
((SELECT id FROM training_plan_day WHERE plan_id = @plan3 AND day_number = 2), '腿弯举', 3, '12-15', 60, '孤立训练大腿后侧', 4),
((SELECT id FROM training_plan_day WHERE plan_id = @plan3 AND day_number = 2), '小腿提踵', 4, '15-20', 45, '顶峰收缩停留1-2秒', 5);

-- 上肢拉训练动作
INSERT INTO training_plan_exercise (plan_day_id, exercise_name, sets, reps, rest_seconds, notes, sort_order) VALUES
((SELECT id FROM training_plan_day WHERE plan_id = @plan3 AND day_number = 3), '引体向上', 4, 'Failure', 90, '宽握距，感受背阔肌发力', 1),
((SELECT id FROM training_plan_day WHERE plan_id = @plan3 AND day_number = 3), '杠铃划船', 4, '6-8', 120, '肘部夹紧，挤压背部肌肉', 2),
((SELECT id FROM training_plan_day WHERE plan_id = @plan3 AND day_number = 3), '单臂哑铃划船', 3, '10-12', 75, '每侧独立训练，纠正不平衡', 3),
((SELECT id FROM training_plan_day WHERE plan_id = @plan3 AND day_number = 3), '面拉', 3, '15-20', 60, '改善体态，强化后束和菱形肌', 4),
((SELECT id FROM training_plan_day WHERE plan_id = @plan3 AND day_number = 3), '二头弯举', 3, '10-12', 60, '避免晃动，顶峰收缩', 5);

-- 下肢强化与核心动作
INSERT INTO training_plan_exercise (plan_day_id, exercise_name, sets, reps, rest_seconds, notes, sort_order) VALUES
((SELECT id FROM training_plan_day WHERE plan_id = @plan3 AND day_number = 4), '前深蹲', 4, '8-10', 90, '杠铃置于前肩，核心压力更大', 1),
((SELECT id FROM training_plan_day WHERE plan_id = @plan3 AND day_number = 4), '臀桥', 3, '12-15', 60, '顶峰收缩2秒，激活臀大肌', 2),
((SELECT id FROM training_plan_day WHERE plan_id = @plan3 AND day_number = 4), '行走箭步蹲', 3, '每侧10步', 75, '连续行走，增强协调性', 3),
((SELECT id FROM training_plan_day WHERE plan_id = @plan3 AND day_number = 4), '悬垂举腿', 3, '10-15', 60, '控制摆动，专注下腹部', 4),
((SELECT id FROM training_plan_day WHERE plan_id = @plan3 AND day_number = 4), '平板支撑变式', 3, '30-45秒', 45, '可尝试侧支撑或转体', 5);


-- 计划4：高效推拉腿
INSERT INTO training_plan (user_id, name, type, description, days_per_week, difficulty, target_audience, tags, source, plan_type, status) 
VALUES (NULL, '高效推拉腿', 'push-pull-legs', '经典的推拉腿三分化训练，高效利用时间，每个部位每周训练一次，强度高、恢复充分。适合时间有限的进阶训练者。', 3, 'intermediate', '上班族、时间紧张者', '高效,分化,增肌,时间友好', 'system', 1, '1');

SET @plan4 = LAST_INSERT_ID();

INSERT INTO training_plan_day (plan_id, day_name, day_number, sort_order) VALUES (@plan4, '推训练日', 1, 1);
INSERT INTO training_plan_day (plan_id, day_name, day_number, sort_order) VALUES (@plan4, '拉训练日', 2, 2);
INSERT INTO training_plan_day (plan_id, day_name, day_number, sort_order) VALUES (@plan4, '腿部与核心', 3, 3);

-- 推训练日动作
INSERT INTO training_plan_exercise (plan_day_id, exercise_name, sets, reps, rest_seconds, notes, sort_order) VALUES
((SELECT id FROM training_plan_day WHERE plan_id = @plan4 AND day_number = 1), '杠铃卧推', 4, '5-8', 180, '大重量日，追求力量突破', 1),
((SELECT id FROM training_plan_day WHERE plan_id = @plan4 AND day_number = 1), '上斜哑铃卧推', 3, '10-12', 90, '调整角度至30度，刺激上胸', 2),
((SELECT id FROM training_plan_day WHERE plan_id = @plan4 AND day_number = 1), '哑铃侧平举', 4, '12-15', 45, '超级组，中间不休息', 3),
((SELECT id FROM training_plan_day WHERE plan_id = @plan4 AND day_number = 1), '绳索面拉', 3, '15-20', 60, '改善圆肩，强化后束', 4),
((SELECT id FROM training_plan_day WHERE plan_id = @plan4 AND day_number = 1), '双杠臂屈伸', 3, 'Failure', 90, '可负重增加难度', 5);

-- 拉训练日动作
INSERT INTO training_plan_exercise (plan_day_id, exercise_name, sets, reps, rest_seconds, notes, sort_order) VALUES
((SELECT id FROM training_plan_day WHERE plan_id = @plan4 AND day_number = 2), '硬拉', 4, '5-6', 180, '复合动作之王，注意技术规范', 1),
((SELECT id FROM training_plan_day WHERE plan_id = @plan4 AND day_number = 2), '宽握引体向上', 4, 'Failure', 120, '背部宽度训练的核心动作', 2),
((SELECT id FROM training_plan_day WHERE plan_id = @plan4 AND day_number = 2), '坐姿绳索划船', 3, '10-12', 75, '挤压背阔肌，顶峰收缩', 3),
((SELECT id FROM training_plan_day WHERE plan_id = @plan4 AND day_number = 2), '直臂下压', 3, '12-15', 60, '孤立背阔肌，减少手臂代偿', 4),
((SELECT id FROM training_plan_day WHERE plan_id = @plan4 AND day_number = 2), '锤式弯举', 3, '10-12', 60, '发展肱肌，增加手臂厚度', 5);

-- 腿部与核心动作
INSERT INTO training_plan_exercise (plan_day_id, exercise_name, sets, reps, rest_seconds, notes, sort_order) VALUES
((SELECT id FROM training_plan_day WHERE plan_id = @plan4 AND day_number = 3), '杠铃深蹲', 4, '5-8', 180, '腿部力量基石，全幅度训练', 1),
((SELECT id FROM training_plan_day WHERE plan_id = @plan4 AND day_number = 3), '保加利亚分腿蹲', 3, '每侧8-10', 90, '单腿稳定性训练，纠正不平衡', 2),
((SELECT id FROM training_plan_day WHERE plan_id = @plan4 AND day_number = 3), '腿举', 4, '10-12', 75, '大重量安全选择，冲击力竭', 3),
((SELECT id FROM training_plan_day WHERE plan_id = @plan4 AND day_number = 3), '罗马尼亚硬拉', 3, '10-12', 75, '大腿后侧链强化', 4),
((SELECT id FROM training_plan_day WHERE plan_id = @plan4 AND day_number = 3), '悬垂举腿+转体', 3, '12-15', 60, '核心综合性训练', 5);
