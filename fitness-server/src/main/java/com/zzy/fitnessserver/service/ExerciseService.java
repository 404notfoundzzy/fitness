package com.zzy.fitnessserver.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zzy.fitnessserver.entity.Exercise;

import java.util.List;
import java.util.Map;

public interface ExerciseService extends IService<Exercise> {

    List<Exercise> searchExercises(String query);

    List<Exercise> listVisibleExercises(Long userId, String query, String categoryType);

    Exercise createCustomExercise(Exercise exercise, Long userId);

    Exercise updateCustomExercise(Long exerciseId, Exercise exercise, Long userId);

    Map<String, Object> softDeleteExercise(Long exerciseId, Long userId);

    Exercise getOrCreateExercise(String exerciseName, Long userId);

    Map<String, Object> checkExerciseReference(Long exerciseId);
}
