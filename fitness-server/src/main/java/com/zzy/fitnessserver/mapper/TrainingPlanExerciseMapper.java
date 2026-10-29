package com.zzy.fitnessserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zzy.fitnessserver.entity.TrainingPlanExercise;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface TrainingPlanExerciseMapper extends BaseMapper<TrainingPlanExercise> {

    @Select("SELECT tpe.*, e.name as exercise_name, e.muscle_group, e.description, " +
            "e.difficulty_level, e.name_en, e.category, e.category_type, e.is_system, " +
            "e.body_part, e.equipment, e.primary_muscle, e.source " +
            "FROM training_plan_exercise tpe " +
            "INNER JOIN exercise e ON tpe.exercise_id = e.id " +
            "INNER JOIN training_plan_day d ON tpe.plan_day_id = d.id " +
            "WHERE d.plan_id = #{planId} AND e.del_flag = '0' " +
            "ORDER BY d.day_number, tpe.sort_order")
    List<TrainingPlanExercise> selectExercisesByPlanId(@Param("planId") Long planId);

    @Select("SELECT COUNT(*) FROM training_plan_exercise WHERE exercise_id = #{exerciseId}")
    int countByExerciseId(@Param("exerciseId") Long exerciseId);
}
