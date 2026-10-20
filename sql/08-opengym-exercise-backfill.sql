-- ============================================================
-- openGym 整合：存量动作结构化字段回填
-- 生成：scripts/opengym-exercise-import.mjs（上游 commit e348fc1）
-- 共 33 条：与上游匹配的取其 bp/eq/tg/mg/sm；
-- 未匹配的按中文肌肉名（muscles-zh 规则）与动作名器械关键词推导。
-- ============================================================
UPDATE exercise SET body_part='chest', equipment='barbell', primary_muscle='chest', secondary_muscle='deltoids', secondary_muscles='["deltoids","triceps"]', source='system' WHERE name_en='Incline Barbell Bench Press' AND is_system=1;
UPDATE exercise SET body_part='chest', equipment='dumbbell', primary_muscle='chest', secondary_muscle='deltoids', secondary_muscles='["deltoids"]', source='system' WHERE name_en='Incline Dumbbell Fly' AND is_system=1;
UPDATE exercise SET body_part='chest', equipment='dumbbell', primary_muscle='chest', secondary_muscle=NULL, secondary_muscles='[]', source='system' WHERE name_en='Flat Dumbbell Fly' AND is_system=1;
UPDATE exercise SET body_part='chest', equipment='cable', primary_muscle='chest', secondary_muscle=NULL, secondary_muscles='[]', source='system' WHERE name_en='Cable Crossover' AND is_system=1;
UPDATE exercise SET body_part='back', equipment='dumbbell', primary_muscle='upper-back', secondary_muscle=NULL, secondary_muscles='[]', source='system' WHERE name_en='Single-Arm Dumbbell Row' AND is_system=1;
UPDATE exercise SET body_part='back', equipment='cable', primary_muscle='upper-back', secondary_muscle='biceps', secondary_muscles='["biceps","forearm"]', source='system' WHERE name_en='Seated Cable Row' AND is_system=1;
UPDATE exercise SET body_part='back', equipment='other', primary_muscle='upper-back', secondary_muscle=NULL, secondary_muscles='[]', source='system' WHERE name_en='Straight-Arm Pulldown' AND is_system=1;
UPDATE exercise SET body_part='upper legs', equipment='barbell', primary_muscle='gluteal', secondary_muscle='hamstring', secondary_muscles='["hamstring","lower-back"]', source='system' WHERE name_en='Romanian Deadlift' AND is_system=1;
UPDATE exercise SET body_part='shoulders', equipment='dumbbell', primary_muscle='deltoids', secondary_muscle='triceps', secondary_muscles='["triceps","upper-back"]', source='system' WHERE name_en='Seated Dumbbell Shoulder Press' AND is_system=1;
UPDATE exercise SET body_part='shoulders', equipment='dumbbell', primary_muscle='deltoids', secondary_muscle='biceps', secondary_muscles='["biceps","trapezius"]', source='system' WHERE name_en='Dumbbell Front Raise' AND is_system=1;
UPDATE exercise SET body_part='shoulders', equipment='dumbbell', primary_muscle='deltoids', secondary_muscle='deltoids', secondary_muscles='["upper-back"]', source='system' WHERE name_en='Rear Delt Fly' AND is_system=1;
UPDATE exercise SET body_part='shoulders', equipment='dumbbell', primary_muscle='deltoids', secondary_muscle='triceps', secondary_muscles='["triceps","chest"]', source='system' WHERE name_en='Arnold Press' AND is_system=1;
UPDATE exercise SET body_part='upper arms', equipment='band', primary_muscle='biceps', secondary_muscle='biceps', secondary_muscles='["forearm"]', source='system' WHERE name_en='Hammer Curl' AND is_system=1;
UPDATE exercise SET body_part='upper arms', equipment='band', primary_muscle='biceps', secondary_muscle='biceps', secondary_muscles='["forearm"]', source='system' WHERE name_en='Cable Bicep Curl' AND is_system=1;
UPDATE exercise SET body_part='upper arms', equipment='cable', primary_muscle='triceps', secondary_muscle=NULL, secondary_muscles='[]', source='system' WHERE name_en='Cable Tricep Pushdown' AND is_system=1;
UPDATE exercise SET body_part='upper arms', equipment='body weight', primary_muscle='triceps', secondary_muscle='chest', secondary_muscles='["chest","deltoids"]', source='system' WHERE name_en='Tricep Dip' AND is_system=1;
UPDATE exercise SET body_part='upper arms', equipment='band', primary_muscle='triceps', secondary_muscle='deltoids', secondary_muscles='["deltoids","abs"]', source='system' WHERE name_en='Overhead Tricep Extension' AND is_system=1;
UPDATE exercise SET body_part='upper arms', equipment='barbell', primary_muscle='triceps', secondary_muscle='chest', secondary_muscles='["chest","deltoids"]', source='system' WHERE name_en='Close-Grip Bench Press' AND is_system=1;
UPDATE exercise SET body_part='upper legs', equipment='barbell', primary_muscle='gluteal', secondary_muscle='quadriceps', secondary_muscles='["quadriceps","hamstring","calves","abs"]', source='system' WHERE name_en='Front Squat' AND is_system=1;
UPDATE exercise SET body_part='upper legs', equipment='machine', primary_muscle='quadriceps', secondary_muscle='gluteal', secondary_muscles='["gluteal","hamstring","calves"]', source='system' WHERE name_en='Leg Press' AND is_system=1;
UPDATE exercise SET body_part='upper legs', equipment='dumbbell', primary_muscle='gluteal', secondary_muscle='quadriceps', secondary_muscles='["quadriceps","hamstring","calves"]', source='system' WHERE name_en='Dumbbell Lunge' AND is_system=1;
UPDATE exercise SET body_part='upper legs', equipment='body weight', primary_muscle='quadriceps', secondary_muscle='gluteal', secondary_muscles='["gluteal","hamstring","adductors","abs"]', source='system' WHERE name_en='Bulgarian Split Squat' AND is_system=1;
UPDATE exercise SET body_part='upper legs', equipment='other', primary_muscle='hamstring', secondary_muscle=NULL, secondary_muscles='[]', source='system' WHERE name_en='Leg Curl' AND is_system=1;
UPDATE exercise SET body_part='lower legs', equipment='band', primary_muscle='calves', secondary_muscle='calves', secondary_muscles='[]', source='system' WHERE name_en='Calf Raise' AND is_system=1;
UPDATE exercise SET body_part='upper legs', equipment='body weight', primary_muscle='gluteal', secondary_muscle='quadriceps', secondary_muscles='["quadriceps","hamstring","calves"]', source='system' WHERE name_en='Walking Lunge' AND is_system=1;
UPDATE exercise SET body_part='upper legs', equipment='barbell', primary_muscle='gluteal', secondary_muscle='hamstring', secondary_muscles='["hamstring","lower-back"]', source='system' WHERE name_en='Glute Bridge' AND is_system=1;
UPDATE exercise SET body_part='waist', equipment='other', primary_muscle='abs', secondary_muscle=NULL, secondary_muscles='[]', source='system' WHERE name_en='Crunch' AND is_system=1;
UPDATE exercise SET body_part='waist', equipment='body weight', primary_muscle='abs', secondary_muscle='obliques', secondary_muscles='["obliques"]', source='system' WHERE name_en='Russian Twist' AND is_system=1;
UPDATE exercise SET body_part='waist', equipment='body weight', primary_muscle='abs', secondary_muscle='hip-flexors', secondary_muscles='["hip-flexors"]', source='system' WHERE name_en='Hanging Leg Raise' AND is_system=1;
UPDATE exercise SET body_part='waist', equipment='other', primary_muscle='abs', secondary_muscle=NULL, secondary_muscles='[]', source='system' WHERE name_en='Plank Variation' AND is_system=1;
UPDATE exercise SET body_part='shoulders', equipment='band', primary_muscle='deltoids', secondary_muscle='deltoids', secondary_muscles='["upper-back"]', source='system' WHERE name_en='Face Pull' AND is_system=1;
UPDATE exercise SET body_part='upper arms', equipment='band', primary_muscle='biceps', secondary_muscle='biceps', secondary_muscles='["forearm"]', source='system' WHERE name_en='Bicep Curl' AND is_system=1;
UPDATE exercise SET body_part='upper arms', equipment='rope', primary_muscle='triceps', secondary_muscle=NULL, secondary_muscles='[]', source='system' WHERE name_en='Tricep Rope Pushdown' AND is_system=1;
