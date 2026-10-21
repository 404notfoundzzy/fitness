package com.zzy.fitnessserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zzy.fitnessserver.entity.WorkoutExerciseDetail;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface WorkoutExerciseDetailMapper extends BaseMapper<WorkoutExerciseDetail> {
    
    @Select("SELECT * FROM workout_exercise_detail WHERE workout_record_id = #{workoutRecordId} ORDER BY sort_order")
    List<WorkoutExerciseDetail> findByWorkoutRecordId(Long workoutRecordId);

    @Select("SELECT * FROM workout_exercise_detail WHERE plan_exercise_id = #{planExerciseId} AND is_completed = 1 ORDER BY create_time DESC LIMIT 1")
    WorkoutExerciseDetail findCompletedByPlanExerciseId(@Param("planExerciseId") Long planExerciseId);

    @Update("UPDATE workout_exercise_detail SET is_completed = #{isCompleted}, update_time = NOW() WHERE plan_exercise_id = #{planExerciseId}")
    int updateCompletedByPlanExerciseId(@Param("planExerciseId") Long planExerciseId, @Param("isCompleted") Integer isCompleted);

    /**
     * 历史窗口查询（阶段 3.4）：用户近 N 天的全部组级记录，含训练日期与计划关联。
     * 供前端渐进引擎/疲劳模型回读（history adapter 的上游数据源）。
     * 显式别名保证 Map 键名为驼峰，不依赖全局驼峰配置。
     */
    @Select("SELECT " +
            "d.id AS id, d.workout_record_id AS workoutRecordId, d.plan_exercise_id AS planExerciseId, " +
            "d.exercise_name AS exerciseName, d.exercise_id AS exerciseId, d.set_number AS setNumber, " +
            "d.set_type AS setType, d.target_reps AS targetReps, d.actual_reps AS actualReps, " +
            "d.weight_kg AS weightKg, d.rir AS rir, d.rpe AS rpe, d.superset_group AS supersetGroup, " +
            "d.per_side AS perSide, d.is_completed AS isCompleted, d.is_pr AS isPr, " +
            "w.workout_date AS workoutDate, w.plan_id AS planId, w.day_number AS dayNumber, " +
            "w.training_type AS trainingType " +
            "FROM workout_exercise_detail d " +
            "JOIN workout_record w ON d.workout_record_id = w.id " +
            "WHERE w.user_id = #{userId} AND w.workout_date >= #{from} " +
            "ORDER BY w.workout_date ASC, w.id ASC, d.sort_order ASC, d.set_number ASC")
    List<java.util.Map<String, Object>> findWindowRows(@Param("userId") Long userId, @Param("from") java.util.Date from);
}
