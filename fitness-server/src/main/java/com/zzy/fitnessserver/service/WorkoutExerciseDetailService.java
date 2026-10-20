package com.zzy.fitnessserver.service;

import com.zzy.fitnessserver.entity.WorkoutExerciseDetail;

import java.util.List;

public interface WorkoutExerciseDetailService {
    
    void saveBatch(List<WorkoutExerciseDetail> details);
    
    List<WorkoutExerciseDetail> getByWorkoutRecordId(Long workoutRecordId);

    WorkoutExerciseDetail findCompletedByPlanExerciseId(Long planExerciseId);

    boolean markCompletedByPlanExerciseId(Long planExerciseId, boolean completed);
}
