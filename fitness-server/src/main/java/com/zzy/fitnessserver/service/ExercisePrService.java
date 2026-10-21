package com.zzy.fitnessserver.service;

import com.zzy.fitnessserver.entity.ExercisePr;
import com.zzy.fitnessserver.entity.WorkoutExerciseDetail;

import java.util.List;

/**
 * 个人纪录服务（openGym 整合阶段 3.4）
 * 保存训练明细时按动作检测 1RM 估算/最大次数/最大单组容量三类纪录。
 * 1RM 估算公式与前端 utils/training/onerm.ts 逐位一致（Epley，REP_CAP=12，round1）。
 */
public interface ExercisePrService {

    /**
     * Epley 1RM 估算：w × (1 + r/30)，四舍五入到 0.1。
     * 无法诚实回答时返回 null：重量≤0、次数≤0、次数超过 REP_CAP(12)。
     * 单次为测量而非估计，原样返回（round1 后）。
     */
    Double estimateEpley1RM(Double weightKg, Integer reps);

    /**
     * 对一次训练保存的明细做 PR 检测：逐组计算三类指标，与历史最佳比较，
     * 破纪录则写入 exercise_pr 并回写明细 is_pr=1。
     *
     * @return 本次新产生的 PR 列表（可能为空）
     */
    List<ExercisePr> detectAndSave(Long userId, Long workoutRecordId, List<WorkoutExerciseDetail> details);

    /**
     * 查询用户 PR 列表（可按动作过滤）
     */
    List<ExercisePr> listByUser(Long userId, Long exerciseId);
}
