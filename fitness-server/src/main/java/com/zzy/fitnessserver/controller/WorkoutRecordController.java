package com.zzy.fitnessserver.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zzy.fitnessserver.common.BaseContext;
import com.zzy.fitnessserver.common.CommonResult;
import com.zzy.fitnessserver.entity.WorkoutRecord;
import com.zzy.fitnessserver.service.WorkoutRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/workouts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WorkoutRecordController {
    private final WorkoutRecordService workoutRecordService;

    @GetMapping("/recent")
    public CommonResult<Page<WorkoutRecord>> getRecentWorkouts(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size) {
        return CommonResult
                .success(workoutRecordService.getLatestDayWorkouts(BaseContext.getCurrentId(), current, size));
    }

    @GetMapping("/list")
    public CommonResult<List<WorkoutRecord>> listByDate(@RequestParam String date) {
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            sdf.setLenient(false);
            java.util.Date parsedDate = sdf.parse(date);
            java.sql.Date queryDate = new java.sql.Date(parsedDate.getTime());

            Calendar cal = Calendar.getInstance();
            cal.setTime(parsedDate);
            cal.set(Calendar.HOUR_OF_DAY, 0);
            cal.set(Calendar.MINUTE, 0);
            cal.set(Calendar.SECOND, 0);
            cal.set(Calendar.MILLISECOND, 0);
            Date startOfDay = cal.getTime();

            cal.set(Calendar.HOUR_OF_DAY, 23);
            cal.set(Calendar.MINUTE, 59);
            cal.set(Calendar.SECOND, 59);
            cal.set(Calendar.MILLISECOND, 999);
            Date endOfDay = cal.getTime();

            return CommonResult.success(workoutRecordService.list(new LambdaQueryWrapper<WorkoutRecord>()
                    .eq(WorkoutRecord::getUserId, BaseContext.getCurrentId())
                    .and(w -> w.eq(WorkoutRecord::getWorkoutDate, queryDate)
                            .or(inner -> inner.between(WorkoutRecord::getStartTime,
                                            startOfDay, endOfDay)
                                    .or(last -> last.isNull(WorkoutRecord::getStartTime)
                                            .between(WorkoutRecord::getCreateTime,
                                                    startOfDay, endOfDay))))
                    .orderByDesc(WorkoutRecord::getCreateTime)));
        } catch (ParseException e) {
            return CommonResult.error("日期格式错误，请使用 yyyy-MM-dd 格式");
        }
    }

    @GetMapping("/page")
    public CommonResult<Page<WorkoutRecord>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size) {
        Page<WorkoutRecord> page = new Page<>(current, size);
        return CommonResult.success(workoutRecordService.page(page, new LambdaQueryWrapper<WorkoutRecord>()
                .eq(WorkoutRecord::getUserId, BaseContext.getCurrentId())
                .orderByDesc(WorkoutRecord::getCreateTime)));
    }

    @GetMapping("/{id}")
    public CommonResult<WorkoutRecord> getById(@PathVariable Long id) {
        return CommonResult.success(workoutRecordService.getById(id));
    }

    @PostMapping("/start")
    public CommonResult<WorkoutRecord> startWorkout(@RequestParam String name) {
        return CommonResult.success(workoutRecordService.startWorkout(BaseContext.getCurrentId(), name));
    }

    @PostMapping("/record")
    public CommonResult<WorkoutRecord> recordWorkout(@RequestBody WorkoutRecord record) {
        return CommonResult.success(workoutRecordService.saveWorkoutRecord(BaseContext.getCurrentId(), record));
    }

    @PutMapping("/{id}")
    public CommonResult<Boolean> update(@PathVariable Long id, @RequestBody WorkoutRecord record) {
        record.setId(id);
        record.setUserId(BaseContext.getCurrentId());
        return CommonResult.success(workoutRecordService.updateByIdWithNull(id, record));
    }

    @DeleteMapping("/{id}")
    public CommonResult<Boolean> delete(@PathVariable Long id) {
        return CommonResult.success(workoutRecordService.removeById(id));
    }
}
