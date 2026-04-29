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
 * 训练日安排表实体类
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("training_plan_day")
public class TrainingPlanDay {
    
    /**
     * 记录ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;
    
    /**
     * 关联的计划ID
     */
    private Long planId;
    
    /**
     * 第几天（1-7）
     */
    private Integer dayNumber;
    
    /**
     * 训练日名称（如：胸部训练）
     */
    private String dayName;
    
    /**
     * 重点肌群
     */
    private String focus;
    
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
