package com.zzy.fitnessserver.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zzy.fitnessserver.entity.WorkoutRecord;

/**
 * 训练记录服务类接口
 */
public interface WorkoutRecordService extends IService<WorkoutRecord> {
    /**
     * 获取用户最近一天的训练记录
     */
    Page<WorkoutRecord> getLatestDayWorkouts(Long userId, Integer current, Integer size);

    /**
     * 开始新的训练
     */
    WorkoutRecord startWorkout(Long userId, String name);

    /**
     * 保存训练记录
     */
    WorkoutRecord saveWorkoutRecord(Long userId, WorkoutRecord record);

    /**
     * 更新训练记录（支持 null 值更新）
     */
    boolean updateByIdWithNull(Long id, WorkoutRecord record);
}
