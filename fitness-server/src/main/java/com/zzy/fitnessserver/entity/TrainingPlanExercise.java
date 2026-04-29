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
     * 动作名称
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
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Date updateTime;
}
