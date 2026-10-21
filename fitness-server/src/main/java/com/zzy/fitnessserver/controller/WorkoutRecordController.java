package com.zzy.fitnessserver.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zzy.fitnessserver.common.BaseContext;
import com.zzy.fitnessserver.common.CommonResult;
import com.zzy.fitnessserver.entity.ExercisePr;
import com.zzy.fitnessserver.entity.WorkoutExerciseDetail;
import com.zzy.fitnessserver.entity.WorkoutRecord;
import com.zzy.fitnessserver.mapper.WorkoutExerciseDetailMapper;
import com.zzy.fitnessserver.service.ExercisePrService;
import com.zzy.fitnessserver.service.WorkoutRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workouts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WorkoutRecordController {
    private final WorkoutRecordService workoutRecordService;
    private final WorkoutExerciseDetailMapper workoutExerciseDetailMapper;
    private final ExercisePrService exercisePrService;

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

    // ── openGym 整合（阶段 3.4）：组级记录 + PR + 历史窗口 ──────────────────

    /**
     * 保存一次训练的组级明细（引导式训练台的数据落点）。
     * 保存后按动作检测个人纪录（1RM/最大次数/最大单组容量），破纪录写入 exercise_pr
     * 并回写该组 is_pr=1。
     */
    @PostMapping("/{id}/details")
    public CommonResult<Map<String, Object>> saveDetails(
            @PathVariable Long id,
            @RequestBody List<WorkoutExerciseDetail> details) {
        Long userId = BaseContext.getCurrentId();
        WorkoutRecord record = workoutRecordService.getById(id);
        if (record == null || !record.getUserId().equals(userId)) {
            return CommonResult.error("训练记录不存在");
        }
        if (details == null || details.isEmpty()) {
            return CommonResult.error("明细不能为空");
        }
        for (WorkoutExerciseDetail d : details) {
            d.setWorkoutRecordId(id);
            if (d.getSetType() == null || d.getSetType().isEmpty()) d.setSetType("normal");
            if (d.getPerSide() == null) d.setPerSide(0);
            if (d.getIsPr() == null) d.setIsPr(0);
        }
        for (WorkoutExerciseDetail d : details) {
            workoutExerciseDetailMapper.insert(d);
        }
        List<ExercisePr> prs = exercisePrService.detectAndSave(userId, id, details);

        Map<String, Object> result = new HashMap<>();
        result.put("saved", details.size());
        result.put("prs", prs);
        return CommonResult.success(result, prs.isEmpty() ? "保存成功" : "保存成功，刷新 " + prs.size() + " 项个人纪录");
    }

    /**
     * 查询个人纪录列表（可按动作过滤）
     */
    @GetMapping("/pr")
    public CommonResult<List<ExercisePr>> prList(@RequestParam(required = false) Long exerciseId) {
        Long userId = BaseContext.getCurrentId();
        return CommonResult.success(exercisePrService.listByUser(userId, exerciseId));
    }

    /**
     * 历史窗口查询：近 N 天（默认 90）的组级记录，按训练分组的原始数据。
     * 供前端渐进引擎/疲劳模型回读；days=0 表示全部历史。
     */
    @GetMapping("/history-window")
    public CommonResult<Map<String, Object>> historyWindow(
            @RequestParam(defaultValue = "90") Integer days) {
        Long userId = BaseContext.getCurrentId();
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        if (days != null && days > 0) {
            cal.add(Calendar.DAY_OF_YEAR, -days);
        } else {
            cal.set(1970 - 1900, Calendar.JANUARY, 1);
        }
        Date from = cal.getTime();

        List<Map<String, Object>> rows = workoutExerciseDetailMapper.findWindowRows(userId, from);

        // 按训练记录分组，组按动作聚合（前端 history adapter 再映射为引擎输入）
        Map<Long, Map<String, Object>> workouts = new LinkedHashMap<>();
        Map<String, Map<String, Object>> exerciseIdx = new HashMap<>();
        for (Map<String, Object> row : rows) {
            Long recordId = ((Number) row.get("workoutRecordId")).longValue();
            Map<String, Object> workout = workouts.computeIfAbsent(recordId, k -> {
                Map<String, Object> w = new LinkedHashMap<>();
                w.put("workoutRecordId", recordId);
                w.put("workoutDate", row.get("workoutDate"));
                w.put("planId", row.get("planId"));
                w.put("dayNumber", row.get("dayNumber"));
                w.put("trainingType", row.get("trainingType"));
                w.put("exercises", new ArrayList<Map<String, Object>>());
                return w;
            });
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> exercises = (List<Map<String, Object>>) workout.get("exercises");

            Object exIdObj = row.get("exerciseId");
            String exKey = exIdObj == null ? "name:" + row.get("exerciseName") : "id:" + exIdObj;
            Map<String, Object> exercise = exerciseIdx.get(recordId + "|" + exKey);
            if (exercise == null) {
                exercise = new LinkedHashMap<>();
                exercise.put("exerciseId", exIdObj);
                exercise.put("exerciseName", row.get("exerciseName"));
                exercise.put("sets", new ArrayList<Map<String, Object>>());
                exercises.add(exercise);
                exerciseIdx.put(recordId + "|" + exKey, exercise);
            }
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> sets = (List<Map<String, Object>>) exercise.get("sets");
            Map<String, Object> set = new LinkedHashMap<>();
            set.put("setNumber", row.get("setNumber"));
            set.put("setType", row.get("setType"));
            set.put("weightKg", row.get("weightKg"));
            set.put("actualReps", row.get("actualReps"));
            set.put("rir", row.get("rir"));
            set.put("rpe", row.get("rpe"));
            set.put("perSide", row.get("perSide"));
            set.put("isCompleted", row.get("isCompleted"));
            set.put("supersetGroup", row.get("supersetGroup"));
            sets.add(set);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("from", from);
        result.put("days", days);
        result.put("workoutCount", workouts.size());
        result.put("workouts", new ArrayList<>(workouts.values()));
        return CommonResult.success(result);
    }
}
