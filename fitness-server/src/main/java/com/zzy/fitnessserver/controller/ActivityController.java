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
    public CommonResult<Map<String, Object>> getRecentActivities(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer pageSize) {
        try {
            Long userId = BaseContext.getCurrentId();
            log.info("=== Fetching recent activities: userId={}, page={}, pageSize={} ===", userId, page, pageSize);

            List<ActivityItem> activities = new ArrayList<>();

            List<ActivityItem> workouts = getWorkoutActivities(userId, 10);
            log.info("Workout activities count: {}", workouts.size());
            activities.addAll(workouts);

            List<ActivityItem> weights = getWeightActivities(userId, 10);
            log.info("Weight activities count: {}", weights.size());
            activities.addAll(weights);

            List<ActivityItem> waters = getWaterActivities(userId, 10);
            log.info("Water activities count: {}", waters.size());
            activities.addAll(waters);

            List<ActivityItem> diets = getDietActivities(userId, 10);
            log.info("Diet activities count: {}", diets.size());
            activities.addAll(diets);

            List<ActivityItem> heights = getHeightActivities(userId, 5);
            log.info("Height activities count: {}", heights.size());
            activities.addAll(heights);

            log.info("Total activities before sort: {}", activities.size());

            activities.sort((a, b) -> {
                Date timeA = getCreateTime(a);
                Date timeB = getCreateTime(b);
                if (timeA == null && timeB == null) return 0;
                if (timeA == null) return 1;
                if (timeB == null) return -1;
                return timeB.compareTo(timeA);
            });

            int total = activities.size();
            int fromIndex = (page - 1) * pageSize;
            int toIndex = Math.min(fromIndex + pageSize, total);

            List<ActivityItem> records = fromIndex < total
                    ? activities.subList(fromIndex, toIndex)
                    : new ArrayList<>();

            log.info("Returning: total={}, fromIndex={}, toIndex={}, records.size={}", total, fromIndex, toIndex, records.size());

            Map<String, Object> result = new HashMap<>();
            result.put("records", records);
            result.put("total", total);

            return CommonResult.success(result);
        } catch (Exception e) {
            log.error("Failed to fetch recent activities", e);
            return CommonResult.error("获取最近动态失败");
        }
    }

    private Date getCreateTime(ActivityItem item) {
        if (item == null || item.getData() == null) {
            return item.getActivityTime();
        }

        Object data = item.getData();
        String type = item.getType();

        try {
            return extractCreateTime(data, type);
        } catch (Exception e) {
            log.warn("Failed to extract createTime for type: {}", type, e);
            return item.getActivityTime();
        }
    }

    private Date extractCreateTime(Object data, String type) {
        if ("workout".equals(type)) {
            return ((WorkoutRecord) data).getCreateTime();
        }
        if ("weight".equals(type)) {
            return ((WeightRecord) data).getCreateTime();
        }
        if ("water".equals(type)) {
            return ((WaterRecord) data).getCreateTime();
        }
        if ("diet".equals(type)) {
            return ((DietRecord) data).getCreateTime();
        }
        if ("height".equals(type)) {
            return ((HeightRecord) data).getCreateTime();
        }
        return null;
    }

    private List<ActivityItem> getWorkoutActivities(Long userId, int limit) {
        List<WorkoutRecord> records = workoutRecordService.list(
                new LambdaQueryWrapper<WorkoutRecord>()
                        .eq(WorkoutRecord::getUserId, userId)
                        .orderByDesc(WorkoutRecord::getCreateTime)
                        .last("LIMIT " + limit)
        );

        return records.stream().map(record -> ActivityItem.builder()
                .id(record.getId())
                .type("workout")
                .title(record.getName())
                .subtitle("时长: " + record.getDurationMinutes() + "分钟" +
                        (record.getVolume() != null ? " | 容量: " + record.getVolume() : ""))
                .activityTime(record.getStartTime())
                .createTime(record.getCreateTime())
                .data(record)
                .build()
        ).collect(Collectors.toList());
    }

    private List<ActivityItem> getWeightActivities(Long userId, int limit) {
        List<WeightRecord> records = weightRecordService.list(
                new LambdaQueryWrapper<WeightRecord>()
                        .eq(WeightRecord::getUserId, userId)
                        .orderByDesc(WeightRecord::getCreateTime)
                        .last("LIMIT " + limit)
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
                            record.getRecordDate())
                    .createTime(record.getCreateTime())
                    .data(record)
                    .build();
        }).collect(Collectors.toList());
    }

    private List<ActivityItem> getWaterActivities(Long userId, int limit) {
        List<WaterRecord> records = waterRecordService.list(
                new LambdaQueryWrapper<WaterRecord>()
                        .eq(WaterRecord::getUserId, userId)
                        .orderByDesc(WaterRecord::getCreateTime)
                        .last("LIMIT " + limit)
        );

        return records.stream().map(record -> ActivityItem.builder()
                .id(record.getId())
                .type("water")
                .title("饮水记录")
                .subtitle(record.getAmountMl() + "ml" +
                        (record.getDrinkType() != null ? " - " + record.getDrinkType() : ""))
                .activityTime(record.getRecordTime())
                .createTime(record.getCreateTime())
                .data(record)
                .build()
        ).collect(Collectors.toList());
    }

    private List<ActivityItem> getDietActivities(Long userId, int limit) {
        List<DietRecord> records = dietRecordService.list(
                new LambdaQueryWrapper<DietRecord>()
                        .eq(DietRecord::getUserId, userId)
                        .orderByDesc(DietRecord::getCreateTime)
                        .last("LIMIT " + limit)
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
                        record.getDietDate())
                .createTime(record.getCreateTime())
                .data(record)
                .build()
        ).collect(Collectors.toList());
    }

    private List<ActivityItem> getHeightActivities(Long userId, int limit) {
        List<HeightRecord> records = heightRecordService.list(
                new LambdaQueryWrapper<HeightRecord>()
                        .eq(HeightRecord::getUserId, userId)
                        .orderByDesc(HeightRecord::getCreateTime)
                        .last("LIMIT " + limit)
        );

        return records.stream().map(record -> ActivityItem.builder()
                .id(record.getId())
                .type("height")
                .title("身高记录")
                .subtitle(record.getHeight() + "cm")
                .activityTime(record.getRecordTime() != null ?
                        record.getRecordTime() :
                        record.getRecordDate())
                .createTime(record.getCreateTime())
                .data(record)
                .build()
        ).collect(Collectors.toList());
    }
}
