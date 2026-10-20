package com.zzy.fitnessserver.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zzy.fitnessserver.entity.Exercise;
import com.zzy.fitnessserver.entity.TrainingPlanExercise;
import com.zzy.fitnessserver.mapper.ExerciseMapper;
import com.zzy.fitnessserver.mapper.TrainingPlanExerciseMapper;
import com.zzy.fitnessserver.service.ExerciseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ExerciseServiceImpl extends ServiceImpl<ExerciseMapper, Exercise> implements ExerciseService {

    private static final String DEL_FLAG_NORMAL = "0";
    private static final String DEL_FLAG_DELETED = "2";

    @Autowired
    private TrainingPlanExerciseMapper trainingPlanExerciseMapper;

    @Override
    public List<Exercise> searchExercises(String query) {
        if (query == null || query.isEmpty()) {
            return list(new LambdaQueryWrapper<Exercise>().eq(Exercise::getDelFlag, DEL_FLAG_NORMAL));
        }
        return list(new LambdaQueryWrapper<Exercise>()
                .eq(Exercise::getDelFlag, DEL_FLAG_NORMAL)
                .and(wrapper -> wrapper
                        .like(Exercise::getName, query)
                        .or()
                        .like(Exercise::getMuscleGroup, query)));
    }

    @Override
    public List<Exercise> listVisibleExercises(Long userId, String query, String categoryType) {
        LambdaQueryWrapper<Exercise> wrapper = new LambdaQueryWrapper<Exercise>()
                .eq(Exercise::getDelFlag, DEL_FLAG_NORMAL);

        if (userId != null) {
            wrapper.and(w -> w
                    .eq(Exercise::getIsSystem, 1)
                    .or()
                    .eq(Exercise::getUserId, userId));
        } else {
            wrapper.eq(Exercise::getIsSystem, 1);
        }

        if (query != null && !query.isEmpty()) {
            wrapper.and(w -> w
                    .like(Exercise::getName, query)
                    .or()
                    .like(Exercise::getMuscleGroup, query));
        }

        if (categoryType != null && !categoryType.isEmpty()) {
            wrapper.eq(Exercise::getCategoryType, categoryType);
        }

        wrapper.orderByDesc(Exercise::getIsSystem)
               .orderByAsc(Exercise::getName);

        return list(wrapper);
    }

    @Override
    @Transactional
    public Exercise createCustomExercise(Exercise exercise, Long userId) {
        if (exercise.getName() == null || exercise.getName().trim().isEmpty()) {
            throw new RuntimeException("动作名称不能为空");
        }

        LambdaQueryWrapper<Exercise> checkWrapper = new LambdaQueryWrapper<Exercise>()
                .eq(Exercise::getDelFlag, DEL_FLAG_NORMAL)
                .eq(Exercise::getName, exercise.getName().trim())
                .and(w -> w
                        .eq(Exercise::getIsSystem, 1)
                        .or()
                        .eq(Exercise::getUserId, userId));

        long count = count(checkWrapper);
        if (count > 0) {
            throw new RuntimeException("同名动作已存在：系统预置或您已创建过该动作");
        }

        exercise.setName(exercise.getName().trim());
        exercise.setUserId(userId);
        exercise.setIsSystem(0);
        exercise.setDelFlag(DEL_FLAG_NORMAL);
        save(exercise);
        return exercise;
    }

    @Override
    @Transactional
    public Exercise updateCustomExercise(Long exerciseId, Exercise exercise, Long userId) {
        Exercise existing = getById(exerciseId);
        if (existing == null || DEL_FLAG_DELETED.equals(existing.getDelFlag())) {
            throw new RuntimeException("动作不存在或已删除");
        }
        if (existing.getIsSystem() == 1) {
            throw new RuntimeException("系统预置动作不允许修改");
        }
        if (!isOwner(existing, userId)) {
            throw new RuntimeException("只能修改自己创建的动作");
        }

        if (exercise.getName() != null && !exercise.getName().trim().isEmpty()
                && !exercise.getName().trim().equals(existing.getName())) {
            LambdaQueryWrapper<Exercise> checkWrapper = new LambdaQueryWrapper<Exercise>()
                    .eq(Exercise::getDelFlag, DEL_FLAG_NORMAL)
                    .eq(Exercise::getName, exercise.getName().trim())
                    .and(w -> w
                            .eq(Exercise::getIsSystem, 1)
                            .or()
                            .eq(Exercise::getUserId, userId))
                    .ne(Exercise::getId, exerciseId);

            if (count(checkWrapper) > 0) {
                throw new RuntimeException("同名动作已存在");
            }
            existing.setName(exercise.getName().trim());
        }

        if (exercise.getNameEn() != null) existing.setNameEn(exercise.getNameEn());
        if (exercise.getCategory() != null) existing.setCategory(exercise.getCategory());
        if (exercise.getCategoryType() != null) existing.setCategoryType(exercise.getCategoryType());
        if (exercise.getMuscleGroup() != null) existing.setMuscleGroup(exercise.getMuscleGroup());
        if (exercise.getDifficultyLevel() != null) existing.setDifficultyLevel(exercise.getDifficultyLevel());
        if (exercise.getDescription() != null) existing.setDescription(exercise.getDescription());
        if (exercise.getProfessionalTips() != null) existing.setProfessionalTips(exercise.getProfessionalTips());

        updateById(existing);

        if (exercise.getName() != null) {
            syncExerciseNameToPlanExercises(exerciseId, existing.getName());
        }

        return existing;
    }

    @Override
    @Transactional
    public Map<String, Object> softDeleteExercise(Long exerciseId, Long userId) {
        Exercise existing = getById(exerciseId);
        if (existing == null || DEL_FLAG_DELETED.equals(existing.getDelFlag())) {
            throw new RuntimeException("动作不存在或已删除");
        }
        if (existing.getIsSystem() == 1) {
            throw new RuntimeException("系统预置动作不允许删除");
        }
        if (!isOwner(existing, userId)) {
            throw new RuntimeException("只能删除自己创建的动作");
        }

        int refCount = trainingPlanExerciseMapper.countByExerciseId(exerciseId);

        Map<String, Object> result = new HashMap<>();
        result.put("exerciseId", exerciseId);
        result.put("exerciseName", existing.getName());
        result.put("referenceCount", refCount);

        if (refCount > 0) {
            result.put("canDelete", true);
            result.put("warning", "该动作被 " + refCount + " 个训练计划引用，删除后计划中仍保留记录但动作详情将不可查看");
        }

        existing.setDelFlag(DEL_FLAG_DELETED);
        existing.setDelTime(new Date());
        updateById(existing);

        result.put("deleted", true);
        result.put("deletedAt", existing.getDelTime());
        return result;
    }

    @Override
    @Transactional
    public Exercise getOrCreateExercise(String exerciseName, Long userId) {
        if (exerciseName == null || exerciseName.trim().isEmpty()) {
            throw new RuntimeException("动作名称不能为空");
        }

        String trimmedName = exerciseName.trim();

        LambdaQueryWrapper<Exercise> wrapper = new LambdaQueryWrapper<Exercise>()
                .eq(Exercise::getDelFlag, DEL_FLAG_NORMAL)
                .eq(Exercise::getName, trimmedName);

        Exercise existing = getOne(wrapper, false);
        if (existing != null) {
            return existing;
        }

        Exercise newExercise = Exercise.builder()
                .userId(userId)
                .name(trimmedName)
                .isSystem(0)
                .delFlag(DEL_FLAG_NORMAL)
                .difficultyLevel(2)
                .build();
        save(newExercise);
        return newExercise;
    }

    @Override
    public Map<String, Object> checkExerciseReference(Long exerciseId) {
        int refCount = trainingPlanExerciseMapper.countByExerciseId(exerciseId);
        Map<String, Object> result = new HashMap<>();
        result.put("exerciseId", exerciseId);
        result.put("referenceCount", refCount);
        result.put("hasReference", refCount > 0);
        return result;
    }

    private boolean isOwner(Exercise exercise, Long userId) {
        if (exercise.getUserId() == null && userId == null) {
            return true;
        }
        if (exercise.getUserId() == null || userId == null) {
            return false;
        }
        return exercise.getUserId().equals(userId);
    }

    private void syncExerciseNameToPlanExercises(Long exerciseId, String newName) {
        LambdaQueryWrapper<TrainingPlanExercise> wrapper = new LambdaQueryWrapper<TrainingPlanExercise>()
                .eq(TrainingPlanExercise::getExerciseId, exerciseId);
        List<TrainingPlanExercise> planExercises = trainingPlanExerciseMapper.selectList(wrapper);
        for (TrainingPlanExercise pe : planExercises) {
            pe.setExerciseName(newName);
            trainingPlanExerciseMapper.updateById(pe);
        }
    }
}
