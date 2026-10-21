package com.zzy.fitnessserver.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("workout_exercise_detail")
public class WorkoutExerciseDetail {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long workoutRecordId;

    private Long planExerciseId;

    /**
     * 规范动作ID（openGym 整合 D4 补充列，指向 exercise 表）
     */
    private Long exerciseId;

    private String exerciseName;

    private Integer setNumber;

    private String targetReps;

    private Integer actualReps;

    private BigDecimal weightKg;

    private Integer isCompleted;

    private Integer restSeconds;

    private String notes;

    private Integer sortOrder;

    /**
     * 组类型：normal/warmup/drop/rest-pause/failure（openGym 整合 D4）
     */
    private String setType;

    /**
     * 保留次数 RIR 0-10（与 rpe 二选一）
     */
    private Integer rir;

    /**
     * RPE 6-10
     */
    private java.math.BigDecimal rpe;

    /**
     * 超级组分组号（同号连续）
     */
    private Integer supersetGroup;

    /**
     * 单侧计次（左/右各一行）
     */
    private Integer perSide;

    /**
     * 是否个人纪录（后端保存时检测写入）
     */
    private Integer isPr;

    @TableField(fill = FieldFill.INSERT)
    private String createBy;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    @TableField(fill = FieldFill.INSERT)
    private Date createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private String updateBy;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Date updateTime;
}
