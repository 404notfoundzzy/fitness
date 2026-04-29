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
 * 训练计划主表实体类
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("training_plan")
public class TrainingPlan {
    
    /**
     * 计划ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;
    
    /**
     * 用户ID（NULL表示系统预置）
     */
    private Long userId;
    
    /**
     * 计划名称
     */
    private String name;
    
    /**
     * 分化类型（five-split/three-split/kai-three-split/full-body/custom）
     */
    private String type;
    
    /**
     * 计划描述
     */
    private String description;
    
    /**
     * 每周训练天数
     */
    private Integer daysPerWeek;
    
    /**
     * 难度等级（beginner/intermediate/advanced）
     */
    private String difficulty;
    
    /**
     * 适用人群
     */
    private String targetAudience;
    
    /**
     * 标签（JSON数组格式）
     */
    private String tags;
    
    /**
     * 是否预置计划（0否 1是）
     */
    private Integer isPreset;
    
    /**
     * 来源（system/user）
     */
    private String source;
    
    /**
     * 状态（0正常 1停用）
     */
    private String status;
    
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
