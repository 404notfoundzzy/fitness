package com.zzy.fitnessserver.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * 计划动作详情表实体类
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("training_plan_exercise")
public class TrainingPlanExercise {
    
    /**
     * 记录ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;
    
    /**
     * 关联的训练日ID
     */
    private Long planDayId;

    /**
     * 关联的动作ID（外键，指向exercise表，NOT NULL）
     */
    private Long exerciseId;

    /**
     * 动作名称（冗余字段，从exercise表同步）
     */
    private String exerciseName;
    
    /**
     * 组数
     */
    private Integer sets;
    
    /**
     * 次数（支持范围如"8-12"）
     */
    private String reps;
    
    /**
     * 休息时间（秒）
     */
    private Integer restSeconds;
    
    /**
     * 技巧提示/备注
     */
    private String notes;
    
    /**
     * 排序号
     */
    private Integer sortOrder;
    
    /**
     * 创建者
     */
    @TableField(fill = FieldFill.INSERT)
    private String createBy;
    
    /**
     * 创建时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    @TableField(fill = FieldFill.INSERT)
    private Date createTime;
    
    /**
     * 更新者
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private String updateBy;
    
    /**
     * 更新时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Date updateTime;

    /**
     * 关联的动作对象（非数据库字段，用于联查）
     */
    @TableField(exist = false)
    private Exercise exercise;
}
