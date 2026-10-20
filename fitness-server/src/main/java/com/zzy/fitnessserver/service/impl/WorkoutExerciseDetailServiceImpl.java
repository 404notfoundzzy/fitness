package com.zzy.fitnessserver.service.impl;

import com.zzy.fitnessserver.entity.WorkoutExerciseDetail;
import com.zzy.fitnessserver.mapper.WorkoutExerciseDetailMapper;
import com.zzy.fitnessserver.service.WorkoutExerciseDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkoutExerciseDetailServiceImpl implements WorkoutExerciseDetailService {
    
    private final WorkoutExerciseDetailMapper workoutExerciseDetailMapper;
    
    @Override
    public void saveBatch(List<WorkoutExerciseDetail> details) {
        for (WorkoutExerciseDetail detail : details) {
            workoutExerciseDetailMapper.insert(detail);
        }
    }
    
    @Override
    public List<WorkoutExerciseDetail> getByWorkoutRecordId(Long workoutRecordId) {
        return workoutExerciseDetailMapper.findByWorkoutRecordId(workoutRecordId);
    }

    @Override
    public WorkoutExerciseDetail findCompletedByPlanExerciseId(Long planExerciseId) {
        return workoutExerciseDetailMapper.findCompletedByPlanExerciseId(planExerciseId);
    }

    @Override
    public boolean markCompletedByPlanExerciseId(Long planExerciseId, boolean completed) {
        int rows = workoutExerciseDetailMapper.updateCompletedByPlanExerciseId(
                planExerciseId, completed ? 1 : 0);
        return rows > 0;
    }
}
