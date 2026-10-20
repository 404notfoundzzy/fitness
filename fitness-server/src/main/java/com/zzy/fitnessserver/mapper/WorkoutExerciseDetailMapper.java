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
}
