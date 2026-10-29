package com.zzy.fitnessserver.controller;

import com.zzy.fitnessserver.common.CommonResult;
import com.zzy.fitnessserver.common.BaseContext;
import com.zzy.fitnessserver.entity.TrainingPlan;
import com.zzy.fitnessserver.entity.TrainingPlanDay;
import com.zzy.fitnessserver.entity.TrainingPlanExercise;
import com.zzy.fitnessserver.entity.WorkoutExerciseDetail;
import com.zzy.fitnessserver.entity.WorkoutRecord;
import com.zzy.fitnessserver.mapper.TrainingPlanDayMapper;
import com.zzy.fitnessserver.mapper.TrainingPlanExerciseMapper;
import com.zzy.fitnessserver.mapper.WorkoutExerciseDetailMapper;
import com.zzy.fitnessserver.service.TrainingPlanService;
import com.zzy.fitnessserver.service.WorkoutRecordService;
import com.zzy.fitnessserver.service.WorkoutExerciseDetailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/training-plan")
public class TrainingPlanController {

    @Autowired
    private TrainingPlanService trainingPlanService;

    @Autowired
    private WorkoutRecordService workoutRecordService;

    @Autowired
    private WorkoutExerciseDetailService workoutExerciseDetailService;

    @Autowired
    private TrainingPlanDayMapper trainingPlanDayMapper;

    @Autowired
    private TrainingPlanExerciseMapper trainingPlanExerciseMapper;

    @Autowired
    private WorkoutExerciseDetailMapper workoutExerciseDetailMapper;

    @GetMapping("/list")
    public CommonResult<List<TrainingPlan>> list() {
        List<TrainingPlan> plans = trainingPlanService.getAllPlans();
        return CommonResult.success(plans);
    }

    @GetMapping("/{id}")
    public CommonResult<TrainingPlan> getById(@PathVariable Long id) {
        TrainingPlan plan = trainingPlanService.getPlanById(id);
        if (plan == null) {
            return CommonResult.error("计划不存在");
        }
        return CommonResult.success(plan);
    }

    @GetMapping("/{id}/exercises")
    public CommonResult<List<TrainingPlanExercise>> getExercises(@PathVariable Long id) {
        try {
            List<TrainingPlanExercise> exercises = trainingPlanService.getExercisesByPlanId(id);
            if (exercises == null || exercises.isEmpty()) {
                return CommonResult.error("该计划暂无动作数据");
            }
            return CommonResult.success(exercises);
        } catch (Exception e) {
            e.printStackTrace();
            return CommonResult.error("获取动作列表失败: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/days")
    public CommonResult<Map<String, Object>> getDaysWithExercises(@PathVariable Long id) {
        try {
            List<TrainingPlanDay> days = trainingPlanDayMapper.selectByPlanId(id);
            if (days == null || days.isEmpty()) {
                return CommonResult.error("该计划暂无训练日数据");
            }

            List<TrainingPlanExercise> allExercises = trainingPlanExerciseMapper.selectExercisesByPlanId(id);

            Map<Long, List<TrainingPlanExercise>> exercisesByDayId = allExercises.stream()
                    .collect(Collectors.groupingBy(TrainingPlanExercise::getPlanDayId));

            List<Long> allExerciseIds = allExercises.stream()
                    .map(TrainingPlanExercise::getId)
                    .collect(Collectors.toList());

            Map<Long, Integer> completionMap = new HashMap<>();
            if (!allExerciseIds.isEmpty()) {
                List<WorkoutExerciseDetail> completedDetails = workoutExerciseDetailMapper.selectList(
                        new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<WorkoutExerciseDetail>()
                                .in(WorkoutExerciseDetail::getPlanExerciseId, allExerciseIds)
                                .eq(WorkoutExerciseDetail::getIsCompleted, 1)
                );
                for (WorkoutExerciseDetail detail : completedDetails) {
                    completionMap.put(detail.getPlanExerciseId(), 1);
                }
            }

            int totalExercises = allExercises.size();
            int completedExercises = completionMap.size();

            List<Map<String, Object>> result = new ArrayList<>();
            for (TrainingPlanDay day : days) {
                Map<String, Object> dayMap = new LinkedHashMap<>();
                dayMap.put("dayId", day.getId());
                dayMap.put("dayNumber", day.getDayNumber());
                dayMap.put("dayName", day.getDayName());
                dayMap.put("focus", day.getFocus());

                List<TrainingPlanExercise> dayExercises = exercisesByDayId.getOrDefault(day.getId(), Collections.emptyList());
                List<Map<String, Object>> exerciseList = new ArrayList<>();
                for (TrainingPlanExercise ex : dayExercises) {
                    Map<String, Object> exMap = new LinkedHashMap<>();
                    exMap.put("id", ex.getId());
                    exMap.put("exerciseId", ex.getExerciseId());
                    exMap.put("exerciseName", ex.getExerciseName());
                    exMap.put("sets", ex.getSets());
                    exMap.put("reps", ex.getReps());
                    exMap.put("restSeconds", ex.getRestSeconds());
                    exMap.put("notes", ex.getNotes());
                    exMap.put("sortOrder", ex.getSortOrder());
                    exMap.put("isCompleted", completionMap.containsKey(ex.getId()));
                    // openGym 整合 D5：目标组数/次数/RIR/渐进规则（训练台据此算处方）
                    exMap.put("targetSets", ex.getTargetSets());
                    exMap.put("targetReps", ex.getTargetReps());
                    exMap.put("targetRir", ex.getTargetRir());
                    exMap.put("progressionRule", ex.getProgressionRule());
                    exMap.put("progressionParams", ex.getProgressionParams());
                    // 动作库元数据（步长/自重/肌肉标签）
                    exMap.put("bodyPart", ex.getBodyPart());
                    exMap.put("equipment", ex.getEquipment());
                    exMap.put("primaryMuscle", ex.getPrimaryMuscle());
                    exMap.put("source", ex.getSource());
                    exerciseList.add(exMap);
                }

                long dayCompleted = exerciseList.stream().filter(e -> (boolean) e.get("isCompleted")).count();
                dayMap.put("exercises", exerciseList);
                dayMap.put("exerciseCount", exerciseList.size());
                dayMap.put("completedCount", dayCompleted);
                dayMap.put("isDayComplete", dayCompleted == exerciseList.size() && !exerciseList.isEmpty());

                result.add(dayMap);
            }

            Map<String, Object> summary = new HashMap<>();
            summary.put("totalExercises", totalExercises);
            summary.put("completedExercises", completedExercises);
            summary.put("progress", totalExercises > 0 ? Math.round((completedExercises * 100.0) / totalExercises) : 0);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("days", result);
            response.put("summary", summary);

            return CommonResult.success(response);
        } catch (Exception e) {
            e.printStackTrace();
            return CommonResult.error("获取训练日数据失败: " + e.getMessage());
        }
    }

    @PostMapping("/custom")
    public CommonResult<TrainingPlan> createCustomPlan(@RequestBody TrainingPlan plan) {
        try {
            Long userId = BaseContext.getCurrentId();
            TrainingPlan created = trainingPlanService.createCustomPlan(plan, userId);
            return CommonResult.success(created, "自定义计划创建成功");
        } catch (RuntimeException e) {
            return CommonResult.error(e.getMessage());
        }
    }

    @PostMapping
    public CommonResult<TrainingPlan> create(@RequestBody TrainingPlan plan) {
        boolean success = trainingPlanService.save(plan);
        if (success) {
            return CommonResult.success(plan, "创建成功");
        } else {
            return CommonResult.error("创建计划失败");
        }
    }

    @PutMapping("/{id}")
    public CommonResult<TrainingPlan> update(@PathVariable Long id, @RequestBody TrainingPlan plan) {
        plan.setId(id);
        boolean success = trainingPlanService.updateById(plan);
        if (success) {
            return CommonResult.success(plan, "更新成功");
        } else {
            return CommonResult.error("更新计划失败");
        }
    }

    @DeleteMapping("/{id}")
    public CommonResult<String> delete(@PathVariable Long id) {
        boolean success = trainingPlanService.removeById(id);
        if (success) {
            return CommonResult.success("删除成功");
        } else {
            return CommonResult.error("删除失败");
        }
    }

    @PostMapping("/days/{dayId}/exercises")
    public CommonResult<TrainingPlanExercise> addExerciseToDay(
            @PathVariable Long dayId,
            @RequestBody TrainingPlanExercise planExercise) {
        try {
            Long userId = BaseContext.getCurrentId();
            TrainingPlanExercise result = trainingPlanService.addExerciseToPlan(dayId, planExercise, userId);
            return CommonResult.success(result, "动作添加成功");
        } catch (RuntimeException e) {
            return CommonResult.error(e.getMessage());
        }
    }

    @PostMapping("/days/{dayId}/exercises/batch")
    public CommonResult<List<TrainingPlanExercise>> batchAddExercises(
            @PathVariable Long dayId,
            @RequestBody List<TrainingPlanExercise> exercises) {
        try {
            Long userId = BaseContext.getCurrentId();
            List<TrainingPlanExercise> results = trainingPlanService.batchAddExercises(dayId, exercises, userId);
            return CommonResult.success(results, "批量添加成功");
        } catch (RuntimeException e) {
            return CommonResult.error(e.getMessage());
        }
    }

    @DeleteMapping("/exercises/{planExerciseId}")
    public CommonResult<String> removeExerciseFromPlan(@PathVariable Long planExerciseId) {
        try {
            Long userId = BaseContext.getCurrentId();
            boolean success = trainingPlanService.removeExerciseFromPlan(planExerciseId, userId);
            if (success) {
                return CommonResult.success("动作移除成功");
            } else {
                return CommonResult.error("动作移除失败");
            }
        } catch (RuntimeException e) {
            return CommonResult.error(e.getMessage());
        }
    }

    @PutMapping("/{id}/progress")
    public CommonResult<Map<String, Object>> updateProgress(
            @PathVariable Long id,
            @RequestBody Map<String, Object> progressData) {
        try {
            Integer progress = (Integer) progressData.get("progress");
            Integer completedCount = (Integer) progressData.get("completedCount");
            Integer totalCount = (Integer) progressData.get("totalCount");

            TrainingPlan plan = trainingPlanService.getPlanById(id);
            if (plan == null) {
                return CommonResult.error("训练计划不存在");
            }

            plan.setProgress(progress);

            String oldStatus = plan.getStatus();
            plan.updateStatusByProgress();
            String newStatus = plan.getStatus();

            boolean updated = trainingPlanService.updateById(plan);

            if (updated) {
                Map<String, Object> result = new HashMap<>();
                result.put("planId", id);
                result.put("progress", progress);
                result.put("completedCount", completedCount);
                result.put("totalCount", totalCount);
                result.put("oldStatus", oldStatus);
                result.put("newStatus", newStatus);
                result.put("statusLabel", plan.getStatusLabel());
                result.put("updatedAt", new Date());
                result.put("message", "进度更新成功");

                System.out.println(String.format("plan[%d] status: %s -> %s (%d%%)",
                        id, oldStatus, newStatus, progress));

                return CommonResult.success(result);
            } else {
                return CommonResult.error("进度更新失败");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return CommonResult.error("更新进度时出错: " + e.getMessage());
        }
    }

    @PostMapping("/{planId}/exercises/{exerciseId}/complete")
    public CommonResult<Map<String, Object>> markExerciseComplete(
            @PathVariable Long planId,
            @PathVariable Long exerciseId,
            @RequestBody(required = false) Map<String, Object> recordData) {
        try {
            Long userId = BaseContext.getCurrentId();
            String exerciseName = recordData != null ? (String) recordData.get("exerciseName") : "训练动作";

            Calendar cal = Calendar.getInstance();
            cal.set(Calendar.HOUR_OF_DAY, 0);
            cal.set(Calendar.MINUTE, 0);
            cal.set(Calendar.SECOND, 0);
            cal.set(Calendar.MILLISECOND, 0);
            Date today = cal.getTime();

            WorkoutRecord record = WorkoutRecord.builder()
                    .userId(userId)
                    .name(exerciseName)
                    .workoutDate(today)
                    .startTime(new Date())
                    .endTime(new Date())
                    .durationMinutes(recordData != null && recordData.get("duration") != null ?
                            ((Number) recordData.get("duration")).intValue() / 60 : 5)
                    .exerciseCount(1)
                    .planId(planId)
                    .trainingType("plan")
                    .remark(String.format("planId: %d, exerciseId: %d", planId, exerciseId))
                    .build();

            boolean saved = workoutRecordService.save(record);
            if (!saved) {
                return CommonResult.error("训练记录保存失败");
            }

            boolean detailUpdated = workoutExerciseDetailService.markCompletedByPlanExerciseId(exerciseId, true);

            if (!detailUpdated) {
                // 关联规范动作ID（openGym 整合 D4）：计划动作 → exercise 外键，
                // 供 PR 检测/历史窗口/肌肉负荷按动作稳定聚合
                Long refExerciseId = null;
                TrainingPlanExercise planExercise = trainingPlanExerciseMapper.selectById(exerciseId);
                if (planExercise != null) {
                    refExerciseId = planExercise.getExerciseId();
                }
                WorkoutExerciseDetail newDetail = WorkoutExerciseDetail.builder()
                        .workoutRecordId(record.getId())
                        .planExerciseId(exerciseId)
                        .exerciseId(refExerciseId)
                        .exerciseName(exerciseName)
                        .isCompleted(1)
                        .setNumber(1)
                        .actualReps(0)
                        .setType("normal")
                        .perSide(0)
                        .isPr(0)
                        .sortOrder(0)
                        .build();
                workoutExerciseDetailService.saveBatch(Collections.singletonList(newDetail));
            }

            Map<String, Object> result = new HashMap<>();
            result.put("recordId", record.getId());
            result.put("planId", planId);
            result.put("exerciseId", exerciseId);
            result.put("exerciseName", exerciseName);
            result.put("isCompleted", true);
            result.put("completedAt", new Date());

            return CommonResult.success(result, "打卡成功");
        } catch (Exception e) {
            e.printStackTrace();
            return CommonResult.error("标记完成失败: " + e.getMessage());
        }
    }

    @DeleteMapping("/{planId}/exercises/{exerciseId}/complete")
    public CommonResult<Map<String, Object>> unmarkExerciseComplete(
            @PathVariable Long planId,
            @PathVariable Long exerciseId) {
        try {
            boolean detailUpdated = workoutExerciseDetailService.markCompletedByPlanExerciseId(exerciseId, false);

            if (!detailUpdated) {
                return CommonResult.error("未找到该动作的打卡记录");
            }

            Map<String, Object> result = new HashMap<>();
            result.put("planId", planId);
            result.put("exerciseId", exerciseId);
            result.put("isCompleted", false);
            result.put("uncompletedAt", new Date());

            return CommonResult.success(result, "取消打卡成功");
        } catch (Exception e) {
            e.printStackTrace();
            return CommonResult.error("取消打卡失败: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/pause")
    public CommonResult<Map<String, Object>> pausePlan(@PathVariable Long id) {
        try {
            TrainingPlan plan = trainingPlanService.getPlanById(id);
            if (plan == null) {
                return CommonResult.error("训练计划不存在");
            }

            String oldStatus = plan.getStatus();
            plan.pause();
            boolean updated = trainingPlanService.updateById(plan);

            if (updated) {
                Map<String, Object> result = new HashMap<>();
                result.put("planId", id);
                result.put("oldStatus", oldStatus);
                result.put("newStatus", plan.getStatus());
                result.put("message", "计划已暂停");
                return CommonResult.success(result);
            } else {
                return CommonResult.error("暂停失败");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return CommonResult.error("暂停操作失败: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/resume")
    public CommonResult<Map<String, Object>> resumePlan(@PathVariable Long id) {
        try {
            TrainingPlan plan = trainingPlanService.getPlanById(id);
            if (plan == null) {
                return CommonResult.error("训练计划不存在");
            }

            String oldStatus = plan.getStatus();
            plan.resume();
            boolean updated = trainingPlanService.updateById(plan);

            if (updated) {
                Map<String, Object> result = new HashMap<>();
                result.put("planId", id);
                result.put("oldStatus", oldStatus);
                result.put("newStatus", plan.getStatus());
                result.put("message", "计划已恢复");
                return CommonResult.success(result);
            } else {
                return CommonResult.error("恢复失败");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return CommonResult.error("恢复操作失败: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/archive")
    public CommonResult<Map<String, Object>> archivePlan(@PathVariable Long id) {
        try {
            TrainingPlan plan = trainingPlanService.getPlanById(id);
            if (plan == null) {
                return CommonResult.error("训练计划不存在");
            }

            String oldStatus = plan.getStatus();
            plan.archive();
            boolean updated = trainingPlanService.updateById(plan);

            if (updated) {
                Map<String, Object> result = new HashMap<>();
                result.put("planId", id);
                result.put("oldStatus", oldStatus);
                result.put("newStatus", plan.getStatus());
                result.put("message", "计划已归档");
                return CommonResult.success(result);
            } else {
                return CommonResult.error("归档失败");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return CommonResult.error("归档操作失败: " + e.getMessage());
        }
    }

    @GetMapping("/status-list")
    public CommonResult<List<Map<String, String>>> getStatusList() {
        List<Map<String, String>> statusList = new java.util.ArrayList<>();

        for (int i = 0; i < TrainingPlan.STATUS_LABELS.length; i++) {
            Map<String, String> statusItem = new HashMap<>();
            statusItem.put("value", String.valueOf(i));
            statusItem.put("label", TrainingPlan.STATUS_LABELS[i]);
            statusItem.put("cssClass", TrainingPlan.STATUS_CSS_CLASSES[i]);
            statusList.add(statusItem);
        }

        return CommonResult.success(statusList);
    }
}
