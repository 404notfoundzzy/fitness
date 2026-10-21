package com.zzy.fitnessserver.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 个人纪录（openGym 整合 D6）
 * 保存训练时按动作检测：1rm（Epley 估算）/ max_reps / max_volume 三类
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("exercise_pr")
public class ExercisePr {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long exerciseId;

    /**
     * 纪录类型：1rm / max_reps / max_volume
     */
    private String type;

    /**
     * 纪录值：1rm 为估算最大重量(kg)，max_reps 为次数，max_volume 为单组容量(kg)
     */
    private BigDecimal value;

    @JsonFormat(pattern = "yyyy-MM-dd", timezone = "GMT+8")
    private Date achievedAt;

    private Long workoutRecordId;
}
