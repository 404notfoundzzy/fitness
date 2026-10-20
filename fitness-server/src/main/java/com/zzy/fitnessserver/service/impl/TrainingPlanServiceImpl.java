package com.zzy.fitnessserver.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zzy.fitnessserver.entity.Exercise;
import com.zzy.fitnessserver.entity.TrainingPlan;
import com.zzy.fitnessserver.entity.TrainingPlanDay;
import com.zzy.fitnessserver.entity.TrainingPlanExercise;
import com.zzy.fitnessserver.mapper.TrainingPlanDayMapper;
import com.zzy.fitnessserver.mapper.TrainingPlanExerciseMapper;
import com.zzy.fitnessserver.mapper.TrainingPlanMapper;
import com.zzy.fitnessserver.service.ExerciseService;
import com.zzy.fitnessserver.service.TrainingPlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TrainingPlanServiceImpl extends ServiceImpl<TrainingPlanMapper, TrainingPlan> implements TrainingPlanService {

    @Autowired
    private TrainingPlanExerciseMapper exerciseMapper;

    @Autowired
    private TrainingPlanDayMapper trainingPlanDayMapper;

    @Autowired
    private ExerciseService exerciseService;

    @Override
    public List<TrainingPlanExercise> getExercisesByPlanId(Long planId) {
        return exerciseMapper.selectExercisesByPlanId(planId);
    }

    @Override
    public List<TrainingPlan> getAllPlans() {
        return this.list();
    }

    @Override
    public TrainingPlan getPlanById(Long planId) {
        return this.getById(planId);
    }

    @Override
    @Transactional
    public TrainingPlan createCustomPlan(TrainingPlan plan, Long userId) {
        plan.setUserId(userId);
        plan.setSource("user");
        plan.setPlanType(0);
        if (plan.getStatus() == null) {
            plan.setStatus(TrainingPlan.STATUS_NOT_STARTED);
        }
        if (plan.getProgress() == null) {
            plan.setProgress(0);
        }
        this.save(plan);

        if (plan.getDays() != null) {
            for (TrainingPlanDay dayData : plan.getDays()) {
                TrainingPlanDay day = TrainingPlanDay.builder()
                        .planId(plan.getId())
                        .dayNumber(dayData.getDayNumber())
                        .dayName(dayData.getDayName())
                        .focus(dayData.getFocus())
                        .sortOrder(dayData.getSortOrder() != null ? dayData.getSortOrder() : dayData.getDayNumber())
                        .build();
                trainingPlanDayMapper.insert(day);

                if (dayData.getExercises() != null) {
                    List<TrainingPlanExercise> exercises = new ArrayList<>();
                    int sortOrder = 1;
                    for (TrainingPlanExercise exData : dayData.getExercises()) {
                        TrainingPlanExercise planExercise = buildPlanExercise(day.getId(), exData, userId, sortOrder++);
                        exerciseMapper.insert(planExercise);
                        exercises.add(planExercise);
                    }
                    day.setExercises(exercises);
                }
            }
        }

        return plan;
    }

    @Override
    @Transactional
    public TrainingPlanExercise addExerciseToPlan(Long planDayId, TrainingPlanExercise planExercise, Long userId) {
        TrainingPlanDay day = trainingPlanDayMapper.selectById(planDayId);
        if (day == null) {
            throw new RuntimeException("训练日不存在");
        }

        LambdaQueryWrapper<TrainingPlanExercise> countWrapper = new LambdaQueryWrapper<TrainingPlanExercise>()
                .eq(TrainingPlanExercise::getPlanDayId, planDayId);
        long currentCount = exerciseMapper.selectCount(countWrapper);

        TrainingPlanExercise result = buildPlanExercise(planDayId, planExercise, userId, (int) (currentCount + 1));
        exerciseMapper.insert(result);
        return result;
    }

    @Override
    @Transactional
    public List<TrainingPlanExercise> batchAddExercises(Long planDayId, List<TrainingPlanExercise> exercises, Long userId) {
        TrainingPlanDay day = trainingPlanDayMapper.selectById(planDayId);
        if (day == null) {
            throw new RuntimeException("训练日不存在");
        }

        LambdaQueryWrapper<TrainingPlanExercise> countWrapper = new LambdaQueryWrapper<TrainingPlanExercise>()
                .eq(TrainingPlanExercise::getPlanDayId, planDayId);
        long currentCount = exerciseMapper.selectCount(countWrapper);

        List<TrainingPlanExercise> results = new ArrayList<>();
        int sortOrder = (int) (currentCount + 1);
        for (TrainingPlanExercise exData : exercises) {
            TrainingPlanExercise planExercise = buildPlanExercise(planDayId, exData, userId, sortOrder++);
            exerciseMapper.insert(planExercise);
            results.add(planExercise);
        }
        return results;
    }

    @Override
    public boolean removeExerciseFromPlan(Long planExerciseId, Long userId) {
        TrainingPlanExercise existing = exerciseMapper.selectById(planExerciseId);
        if (existing == null) {
            throw new RuntimeException("计划动作不存在");
        }
        return exerciseMapper.deleteById(planExerciseId) > 0;
    }

    @Override
    public Map<String, Object> checkExerciseReference(Long exerciseId) {
        int refCount = exerciseMapper.countByExerciseId(exerciseId);
        Map<String, Object> result = new HashMap<>();
        result.put("exerciseId", exerciseId);
        result.put("referenceCount", refCount);
        result.put("hasReference", refCount > 0);
        return result;
    }

    private TrainingPlanExercise buildPlanExercise(Long planDayId, TrainingPlanExercise exData, Long userId, int sortOrder) {
        Long exerciseId = exData.getExerciseId();
        String exerciseName = exData.getExerciseName();

        if (exerciseId != null) {
            Exercise exercise = exerciseService.getById(exerciseId);
            if (exercise == null || "2".equals(exercise.getDelFlag())) {
                throw new RuntimeException("关联的动作不存在或已删除: exerciseId=" + exerciseId);
            }
            exerciseName = exercise.getName();
        } else if (exerciseName != null && !exerciseName.isEmpty()) {
            Exercise exercise = exerciseService.getOrCreateExercise(exerciseName, userId);
            exerciseId = exercise.getId();
            exerciseName = exercise.getName();
        } else {
            throw new RuntimeException("必须提供 exerciseId 或 exerciseName");
        }

        return TrainingPlanExercise.builder()
                .planDayId(planDayId)
                .exerciseId(exerciseId)
                .exerciseName(exerciseName)
                .sets(exData.getSets() != null ? exData.getSets() : 3)
                .reps(exData.getReps() != null ? exData.getReps() : "8-12")
                .restSeconds(exData.getRestSeconds() != null ? exData.getRestSeconds() : 60)
                .notes(exData.getNotes())
                .sortOrder(sortOrder)
                .build();
    }
}
