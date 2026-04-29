package com.zzy.fitnessserver.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zzy.fitnessserver.common.BaseContext;
import com.zzy.fitnessserver.common.CommonResult;
import com.zzy.fitnessserver.entity.WorkoutRecord;
import com.zzy.fitnessserver.service.WorkoutRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 训练记录控制器
 */
@RestController
@RequestMapping("/api/workouts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WorkoutRecordController {
    private final WorkoutRecordService workoutRecordService;

    /**
     * 获取最近一天的训练记录
     */
    @GetMapping("/recent")
    public CommonResult<Page<WorkoutRecord>> getRecentWorkouts(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size) {
        return CommonResult
                .success(workoutRecordService.getLatestDayWorkouts(BaseContext.getCurrentId(), current, size));
    }

    /**
     * 获取某日运动记录列表
     */
    @GetMapping("/list")
    public CommonResult<java.util.List<WorkoutRecord>> listByDate(@RequestParam String date) {
        java.time.LocalDate queryDate = java.time.LocalDate.parse(date);
        java.time.LocalDateTime startOfDay = queryDate.atStartOfDay();
        java.time.LocalDateTime endOfDay = queryDate.atTime(23, 59, 59);

        return CommonResult.success(workoutRecordService.list(new LambdaQueryWrapper<WorkoutRecord>()
                .eq(WorkoutRecord::getUserId, BaseContext.getCurrentId())
                .and(w -> w.between(WorkoutRecord::getStartTime,
                                java.sql.Timestamp.valueOf(startOfDay),
                                java.sql.Timestamp.valueOf(endOfDay))
                        .or(inner -> inner.isNull(WorkoutRecord::getStartTime)
                                .between(WorkoutRecord::getCreateTime,
                                        java.sql.Timestamp.valueOf(startOfDay),
                                        java.sql.Timestamp.valueOf(endOfDay))))
                .orderByDesc(WorkoutRecord::getCreateTime)));
    }

    /**
     * 分页获取训练记录
     */
    @GetMapping("/page")
    public CommonResult<Page<WorkoutRecord>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size) {
        Page<WorkoutRecord> page = new Page<>(current, size);
        return CommonResult.success(workoutRecordService.page(page, new LambdaQueryWrapper<WorkoutRecord>()
                .eq(WorkoutRecord::getUserId, BaseContext.getCurrentId())
                .orderByDesc(WorkoutRecord::getStartTime)));
    }

    /**
     * 获取某一个运动记录
     */
    @GetMapping("/{id}")
    public CommonResult<WorkoutRecord> getById(@PathVariable Long id) {
        return CommonResult.success(workoutRecordService.getById(id));
    }

    /**
     * 开始一项新的训练
     */
    @PostMapping("/start")
    public CommonResult<WorkoutRecord> startWorkout(@RequestParam String name) {
        return CommonResult.success(workoutRecordService.startWorkout(BaseContext.getCurrentId(), name));
    }

    /**
     * 保存训练记录
     */
    @PostMapping("/record")
    public CommonResult<WorkoutRecord> recordWorkout(@RequestBody WorkoutRecord record) {
        return CommonResult.success(workoutRecordService.saveWorkoutRecord(BaseContext.getCurrentId(), record));
    }

    /**
     * 编辑运动记录
     */
    @PutMapping("/{id}")
    public CommonResult<Boolean> update(@PathVariable Long id, @RequestBody WorkoutRecord record) {
        record.setId(id);
        record.setUserId(BaseContext.getCurrentId());
        return CommonResult.success(workoutRecordService.updateByIdWithNull(id, record));
    }

    /**
     * 删除运动记录
     */
    @DeleteMapping("/{id}")
    public CommonResult<Boolean> delete(@PathVariable Long id) {
        return CommonResult.success(workoutRecordService.removeById(id));
    }
}
