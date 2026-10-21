package com.zzy.fitnessserver.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zzy.fitnessserver.entity.ExercisePr;
import com.zzy.fitnessserver.entity.WorkoutExerciseDetail;
import com.zzy.fitnessserver.mapper.ExercisePrMapper;
import com.zzy.fitnessserver.mapper.WorkoutExerciseDetailMapper;
import com.zzy.fitnessserver.service.ExercisePrService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 个人纪录服务实现（openGym 整合阶段 3.4）
 */
@Service
@RequiredArgsConstructor
public class ExercisePrServiceImpl extends ServiceImpl<ExercisePrMapper, ExercisePr>
        implements ExercisePrService {

    /** 与前端 onerm.ts REP_CAP 一致：超过此次数拒绝估计 */
    private static final int REP_CAP = 12;

    /** 纪录类型 */
    private static final String TYPE_1RM = "1rm";
    private static final String TYPE_MAX_REPS = "max_reps";
    private static final String TYPE_MAX_VOLUME = "max_volume";

    private final WorkoutExerciseDetailMapper workoutExerciseDetailMapper;

    /**
     * Epley：w × (1 + r/30)。与前端 estimate1RM 行为对齐：
     * - 重量/次数非正 → null
     * - 次数 > REP_CAP → null（更多反映容量而非最大力量）
     * - 次数 == 1 → 测量值，round1 后原样返回
     * - 其余 → round1(公式估计)
     */
    @Override
    public Double estimateEpley1RM(Double weightKg, Integer reps) {
        if (weightKg == null || reps == null) return null;
        double w = weightKg;
        int r = reps;
        if (w <= 0 || r <= 0) return null;
        if (r == 1) return round1(w);
        if (r > REP_CAP) return null;
        double est = w * (1 + Math.round((double) r) / 30.0);
        if (!Double.isFinite(est) || est <= 0) return null;
        return round1(est);
    }

    @Override
    public List<ExercisePr> detectAndSave(Long userId, Long workoutRecordId, List<WorkoutExerciseDetail> details) {
        List<ExercisePr> created = new ArrayList<>();
        if (details == null || details.isEmpty()) return created;

        // 按动作聚合本次训练的每组指标（同一动作多行明细）
        Map<Long, List<WorkoutExerciseDetail>> byExercise = new LinkedHashMap<>();
        for (WorkoutExerciseDetail d : details) {
            if (d.getExerciseId() == null) continue;
            byExercise.computeIfAbsent(d.getExerciseId(), k -> new ArrayList<>()).add(d);
        }

        Date achievedAt = new Date();
        for (Map.Entry<Long, List<WorkoutExerciseDetail>> entry : byExercise.entrySet()) {
            Long exerciseId = entry.getKey();

            // 1) 1rm：本次训练该动作所有组里最大的 Epley 估计
            Double bestE1rm = null;
            WorkoutExerciseDetail bestE1rmRow = null;
            for (WorkoutExerciseDetail d : entry.getValue()) {
                Double est = estimateEpley1RM(
                        d.getWeightKg() == null ? null : d.getWeightKg().doubleValue(),
                        d.getActualReps());
                if (est != null && (bestE1rm == null || est > bestE1rm)) {
                    bestE1rm = est;
                    bestE1rmRow = d;
                }
            }

            // 2) max_reps：本次该动作单组最大次数（需有负重记录，避免空动作刷纪录）
            Integer bestReps = null;
            WorkoutExerciseDetail bestRepsRow = null;
            for (WorkoutExerciseDetail d : entry.getValue()) {
                Integer r = d.getActualReps();
                boolean hasLoad = d.getWeightKg() != null && d.getWeightKg().doubleValue() > 0;
                if (r != null && r > 0 && hasLoad && (bestReps == null || r > bestReps)) {
                    bestReps = r;
                    bestRepsRow = d;
                }
            }

            // 3) max_volume：本次该动作单组最大容量（重量×次数）
            BigDecimal bestVolume = null;
            WorkoutExerciseDetail bestVolumeRow = null;
            for (WorkoutExerciseDetail d : entry.getValue()) {
                if (d.getWeightKg() == null || d.getActualReps() == null) continue;
                BigDecimal vol = d.getWeightKg().multiply(BigDecimal.valueOf(d.getActualReps()));
                if (bestVolume == null || vol.compareTo(bestVolume) > 0) {
                    bestVolume = vol;
                    bestVolumeRow = d;
                }
            }

            // 与历史最佳比较，破纪录才写库
            consider(created, userId, exerciseId, workoutRecordId, TYPE_1RM,
                    bestE1rm == null ? null : BigDecimal.valueOf(bestE1rm), bestE1rmRow, achievedAt);
            consider(created, userId, exerciseId, workoutRecordId, TYPE_MAX_REPS,
                    bestReps == null ? null : BigDecimal.valueOf(bestReps), bestRepsRow, achievedAt);
            consider(created, userId, exerciseId, workoutRecordId, TYPE_MAX_VOLUME,
                    bestVolume, bestVolumeRow, achievedAt);
        }
        return created;
    }

    @Override
    public List<ExercisePr> listByUser(Long userId, Long exerciseId) {
        return baseMapper.findByUser(userId, exerciseId);
    }

    /**
     * 单项纪录判定：新值严格大于历史最佳才入库，并回写该组明细 is_pr=1。
     * 首次纪录（无历史）同样写入。
     */
    private void consider(List<ExercisePr> created,
                          Long userId,
                          Long exerciseId,
                          Long workoutRecordId,
                          String type,
                          BigDecimal newValue,
                          WorkoutExerciseDetail sourceRow,
                          Date achievedAt) {
        if (newValue == null || newValue.signum() <= 0) return;
        ExercisePr best = baseMapper.findBest(userId, exerciseId, type);
        if (best != null && best.getValue() != null && best.getValue().compareTo(newValue) >= 0) {
            return; // 未破纪录
        }
        ExercisePr pr = ExercisePr.builder()
                .userId(userId)
                .exerciseId(exerciseId)
                .type(type)
                .value(newValue)
                .achievedAt(achievedAt)
                .workoutRecordId(workoutRecordId)
                .build();
        baseMapper.insert(pr);
        created.add(pr);
        if (sourceRow != null && sourceRow.getId() != null) {
            sourceRow.setIsPr(1);
            workoutExerciseDetailMapper.updateById(sourceRow);
        }
    }

    /** round1：四舍五入到 0.1（与前端 Math.round(v*10)/10 对正值一致） */
    private static double round1(double v) {
        return BigDecimal.valueOf(v).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }
}
