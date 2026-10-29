package com.zzy.fitnessserver.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zzy.fitnessserver.entity.Exercise;

import java.util.List;
import java.util.Map;

public interface ExerciseService extends IService<Exercise> {

    List<Exercise> searchExercises(String query);

    List<Exercise> listVisibleExercises(Long userId, String query, String categoryType);

    /**
     * 列表查询 + openGym 结构化筛选（阶段 3.4）
     *
     * @param source     来源：system/opengym/user（可空）
     * @param muscle     主肌肉规范 slug（primary_muscle，如 chest/quadriceps，可空）
     * @param equipment  器械规范值（barbell/dumbbell/cable/machine 等，可空）
     */
    List<Exercise> listVisibleExercisesFiltered(Long userId, String query, String categoryType,
                                                String source, String muscle, String equipment);

    /**
     * 动作库分页检索（阶段 4，动作库浏览页）：5600+ 条导入后不能一次全量下发。
     * 筛选语义与 {@link #listVisibleExercisesFiltered} 完全一致。
     */
    Page<Exercise> searchExercisesPage(Long userId, String query, String source, String muscle,
                                       String equipment, Integer current, Integer size);

    Exercise createCustomExercise(Exercise exercise, Long userId);

    Exercise updateCustomExercise(Long exerciseId, Exercise exercise, Long userId);

    Map<String, Object> softDeleteExercise(Long exerciseId, Long userId);

    Exercise getOrCreateExercise(String exerciseName, Long userId);

    Map<String, Object> checkExerciseReference(Long exerciseId);
}
