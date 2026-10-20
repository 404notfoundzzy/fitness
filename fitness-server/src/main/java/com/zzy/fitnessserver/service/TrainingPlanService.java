package com.zzy.fitnessserver.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zzy.fitnessserver.entity.TrainingPlan;
import com.zzy.fitnessserver.entity.TrainingPlanExercise;

import java.util.List;
import java.util.Map;

public interface TrainingPlanService extends IService<TrainingPlan> {

    List<TrainingPlanExercise> getExercisesByPlanId(Long planId);

    List<TrainingPlan> getAllPlans();

    TrainingPlan getPlanById(Long planId);

    TrainingPlan createCustomPlan(TrainingPlan plan, Long userId);

    TrainingPlanExercise addExerciseToPlan(Long planDayId, TrainingPlanExercise planExercise, Long userId);

    List<TrainingPlanExercise> batchAddExercises(Long planDayId, List<TrainingPlanExercise> exercises, Long userId);

    boolean removeExerciseFromPlan(Long planExerciseId, Long userId);

    Map<String, Object> checkExerciseReference(Long exerciseId);
}
