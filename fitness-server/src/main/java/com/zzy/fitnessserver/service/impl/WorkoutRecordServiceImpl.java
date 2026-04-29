package com.zzy.fitnessserver.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zzy.fitnessserver.entity.WorkoutRecord;
import com.zzy.fitnessserver.mapper.WorkoutRecordMapper;
import com.zzy.fitnessserver.service.UserService;
import com.zzy.fitnessserver.service.WorkoutRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.io.Serializable;
import java.util.Calendar;
import java.util.Date;

/**
 * 训练记录服务实现类
 */
@Service
@RequiredArgsConstructor
public class WorkoutRecordServiceImpl extends ServiceImpl<WorkoutRecordMapper, WorkoutRecord>
        implements WorkoutRecordService {
    private final UserService userService;

    @Override
    public boolean removeById(Serializable id) {
        WorkoutRecord record = getById(id);
        boolean result = super.removeById(id);
        if (result && record != null) {
            userService.recalculateStats(record.getUserId());
        }
        return result;
    }

    @Override
    public boolean updateById(WorkoutRecord entity) {
        boolean result = super.updateById(entity);
        if (result) {
            userService.recalculateStats(entity.getUserId());
        }
        return result;
    }

    /**
     * 获取用户最近一天的训练记录
     */
    @Override
    public Page<WorkoutRecord> getLatestDayWorkouts(Long userId, Integer current, Integer size) {
        WorkoutRecord lastRecord = this.getOne(new LambdaQueryWrapper<WorkoutRecord>()
                .eq(WorkoutRecord::getUserId, userId)
                .orderByDesc(WorkoutRecord::getCreateTime)
                .last("LIMIT 1"));

        Page<WorkoutRecord> page = new Page<>(current, size);
        if (lastRecord == null) {
            return page;
        }

        Date referenceDate = lastRecord.getStartTime() != null ? lastRecord.getStartTime() : lastRecord.getCreateTime();

        Calendar cal = Calendar.getInstance();
        cal.setTime(referenceDate);
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        Date startOfDay = cal.getTime();

        cal.set(Calendar.HOUR_OF_DAY, 23);
        cal.set(Calendar.MINUTE, 59);
        cal.set(Calendar.SECOND, 59);
        Date endOfDay = cal.getTime();

        return page(page, new LambdaQueryWrapper<WorkoutRecord>()
                .eq(WorkoutRecord::getUserId, userId)
                .and(w -> w.between(WorkoutRecord::getStartTime, startOfDay, endOfDay)
                        .or()
                        .between(WorkoutRecord::getCreateTime, startOfDay, endOfDay))
                .orderByDesc(WorkoutRecord::getCreateTime));
    }

    /**
     * 开始新的训练
     */
    @Override
    public WorkoutRecord startWorkout(Long userId, String name) {
        WorkoutRecord record = WorkoutRecord.builder()
                .userId(userId)
                .name(name)
                .startTime(new Date())
                .status("进行中")
                .build();
        save(record);
        return record;
    }

    @Override
    public WorkoutRecord saveWorkoutRecord(Long userId, WorkoutRecord record) {
        record.setUserId(userId);
        record.setStatus("已完成");
        save(record);

        // 重新计算用户统计数据
        userService.recalculateStats(userId);

        return record;
    }

    @Override
    public boolean updateByIdWithNull(Long id, WorkoutRecord record) {
        com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper<WorkoutRecord> updateWrapper =
            new com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper<>();
        updateWrapper.eq("id", id);
        if (record.getStartTime() == null) {
            updateWrapper.set("start_time", null);
        } else {
            updateWrapper.set("start_time", record.getStartTime());
        }
        updateWrapper.set("name", record.getName());
        updateWrapper.set("duration_minutes", record.getDurationMinutes());
        updateWrapper.set("exercise_count", record.getExerciseCount());
        updateWrapper.set("volume", record.getVolume());
        updateWrapper.set("remark", record.getRemark());

        boolean result = super.update(updateWrapper);
        if (result) {
            userService.recalculateStats(record.getUserId());
        }
        return result;
    }
}
