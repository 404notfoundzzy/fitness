package com.zzy.fitnessserver.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zzy.fitnessserver.common.BaseContext;
import com.zzy.fitnessserver.common.CommonResult;
import com.zzy.fitnessserver.dto.ActivityItem;
import com.zzy.fitnessserver.entity.*;
import com.zzy.fitnessserver.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ActivityController {
    private final WorkoutRecordService workoutRecordService;
    private final WeightRecordService weightRecordService;
    private final WaterRecordService waterRecordService;
    private final DietRecordService dietRecordService;
    private final HeightRecordService heightRecordService;

    @GetMapping("/recent")
    public CommonResult<List<ActivityItem>> getRecentActivities(
            @RequestParam(defaultValue = "20") Integer limit) {
        try {
            Long userId = BaseContext.getCurrentId();
            List<ActivityItem> activities = new ArrayList<>();

            activities.addAll(getWorkoutActivities(userId));
            activities.addAll(getWeightActivities(userId));
            activities.addAll(getWaterActivities(userId));
            activities.addAll(getDietActivities(userId));
            activities.addAll(getHeightActivities(userId));

            activities.sort((a, b) -> {
                Date timeA = getEffectiveTime(a);
                Date timeB = getEffectiveTime(b);
                if (timeA == null && timeB == null) return 0;
                if (timeA == null) return 1;
                if (timeB == null) return -1;
                return timeB.compareTo(timeA);
            });

            List<ActivityItem> result = activities.stream()
                    .limit(limit)
                    .collect(Collectors.toList());

            return CommonResult.success(result);
        } catch (Exception e) {
            log.error("Failed to fetch recent activities", e);
            return CommonResult.error("获取最近动态失败");
        }
    }

    private Date getEffectiveTime(ActivityItem item) {
        if (item == null || item.getData() == null) {
            return item.getActivityTime();
        }

        Object data = item.getData();
        String type = item.getType();

        try {
            if ("workout".equals(type)) {
                WorkoutRecord workout = (WorkoutRecord) data;
                return workout.getStartTime() != null ? workout.getStartTime() : item.getActivityTime();
            }

            if ("weight".equals(type)) {
                WeightRecord weight = (WeightRecord) data;
                if (weight.getRecordTime() != null && hasValidTime(weight.getRecordTime())) {
                    return weight.getRecordTime();
                }
                if (weight.getRecordDate() != null) {
                    return Date.from(weight.getRecordDate().atStartOfDay(ZoneId.systemDefault()).toInstant());
                }
                return item.getActivityTime();
            }

            if ("water".equals(type)) {
                WaterRecord water = (WaterRecord) data;
                return water.getRecordTime() != null ? water.getRecordTime() : item.getActivityTime();
            }

            if ("diet".equals(type)) {
                DietRecord diet = (DietRecord) data;
                if (diet.getRecordTime() != null && hasValidTime(diet.getRecordTime())) {
                    return diet.getRecordTime();
                }
                if (diet.getDietDate() != null) {
                    return Date.from(diet.getDietDate().atStartOfDay(ZoneId.systemDefault()).toInstant());
                }
                return item.getActivityTime();
            }

            if ("height".equals(type)) {
                HeightRecord height = (HeightRecord) data;
                if (height.getRecordTime() != null && hasValidTime(height.getRecordTime())) {
                    return height.getRecordTime();
                }
                if (height.getRecordDate() != null) {
                    return Date.from(height.getRecordDate().atStartOfDay(ZoneId.systemDefault()).toInstant());
                }
                return item.getActivityTime();
            }
        } catch (Exception e) {
            log.warn("Failed to extract effective time for type: {}", type, e);
        }

        return item.getActivityTime();
    }

    private boolean hasValidTime(Date date) {
        if (date == null) return false;
        java.util.Calendar cal = java.util.Calendar.getInstance();
        cal.setTime(date);
        int hour = cal.get(java.util.Calendar.HOUR_OF_DAY);
        int minute = cal.get(java.util.Calendar.MINUTE);
        int second = cal.get(java.util.Calendar.SECOND);
        return !(hour == 0 && minute == 0 && second == 0);
    }

    private List<ActivityItem> getWorkoutActivities(Long userId) {
        List<WorkoutRecord> records = workoutRecordService.list(
                new LambdaQueryWrapper<WorkoutRecord>()
                        .eq(WorkoutRecord::getUserId, userId)
                        .orderByDesc(WorkoutRecord::getStartTime)
                        .last("LIMIT 10")
        );

        return records.stream().map(record -> ActivityItem.builder()
                .id(record.getId())
                .type("workout")
                .title(record.getName())
                .subtitle("时长: " + record.getDurationMinutes() + "分钟" +
                        (record.getVolume() != null ? " | 容量: " + record.getVolume() : ""))
                .activityTime(record.getStartTime())
                .data(record)
                .build()
        ).collect(Collectors.toList());
    }

    private List<ActivityItem> getWeightActivities(Long userId) {
        List<WeightRecord> records = weightRecordService.list(
                new LambdaQueryWrapper<WeightRecord>()
                        .eq(WeightRecord::getUserId, userId)
                        .orderByDesc(WeightRecord::getRecordTime)
                        .last("LIMIT 10")
        );

        return records.stream().map(record -> {
            String periodLabel = "morning".equals(record.getTimePeriod()) ? "晨重" :
                    "evening".equals(record.getTimePeriod()) ? "晚重" : "";
            return ActivityItem.builder()
                    .id(record.getId())
                    .type("weight")
                    .title("体重记录")
                    .subtitle(record.getWeight() + "kg" + (periodLabel.isEmpty() ? "" : " (" + periodLabel + ")"))
                    .activityTime(record.getRecordTime() != null ?
                            record.getRecordTime() :
                            Date.from(record.getRecordDate().atStartOfDay(ZoneId.systemDefault()).toInstant()))
                    .data(record)
                    .build();
        }).collect(Collectors.toList());
    }

    private List<ActivityItem> getWaterActivities(Long userId) {
        List<WaterRecord> records = waterRecordService.list(
                new LambdaQueryWrapper<WaterRecord>()
                        .eq(WaterRecord::getUserId, userId)
                        .orderByDesc(WaterRecord::getRecordTime)
                        .last("LIMIT 10")
        );

        return records.stream().map(record -> ActivityItem.builder()
                .id(record.getId())
                .type("water")
                .title("饮水记录")
                .subtitle(record.getAmountMl() + "ml" +
                        (record.getDrinkType() != null ? " - " + record.getDrinkType() : ""))
                .activityTime(record.getRecordTime())
                .data(record)
                .build()
        ).collect(Collectors.toList());
    }

    private List<ActivityItem> getDietActivities(Long userId) {
        List<DietRecord> records = dietRecordService.list(
                new LambdaQueryWrapper<DietRecord>()
                        .eq(DietRecord::getUserId, userId)
                        .orderByDesc(DietRecord::getRecordTime)
                        .last("LIMIT 10")
        );

        return records.stream().map(record -> ActivityItem.builder()
                .id(record.getId())
                .type("diet")
                .title("饮食记录")
                .subtitle(record.getFoodName() +
                        (record.getCalories() != null ? " | " + record.getCalories() + "千卡" : "") +
                        (record.getMealType() != null ? " (" + record.getMealType() + ")" : ""))
                .activityTime(record.getRecordTime() != null ?
                        record.getRecordTime() :
                        Date.from(record.getDietDate().atStartOfDay(ZoneId.systemDefault()).toInstant()))
                .data(record)
                .build()
        ).collect(Collectors.toList());
    }

    private List<ActivityItem> getHeightActivities(Long userId) {
        List<HeightRecord> records = heightRecordService.list(
                new LambdaQueryWrapper<HeightRecord>()
                        .eq(HeightRecord::getUserId, userId)
                        .orderByDesc(HeightRecord::getRecordTime)
                        .last("LIMIT 5")
        );

        return records.stream().map(record -> ActivityItem.builder()
                .id(record.getId())
                .type("height")
                .title("身高记录")
                .subtitle(record.getHeight() + "cm")
                .activityTime(record.getRecordTime() != null ?
                        record.getRecordTime() :
                        Date.from(record.getRecordDate().atStartOfDay(ZoneId.systemDefault()).toInstant()))
                .data(record)
                .build()
        ).collect(Collectors.toList());
    }
}
