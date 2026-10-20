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
 * 练习/运动项目实体类
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("exercise")
public class Exercise {
    /**
     * ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 创建者用户ID（NULL表示系统预置）
     */
    private Long userId;

    /**
     * 练习名称
     */
    private String name;

    /**
     * 英文名称
     */
    private String nameEn;

    /**
     * 练习分类
     */
    private String category;

    /**
     * 健身动作类型 (对应字典 exercise_action_type)
     */
    private String categoryType;

    /**
     * 主要肌肉群
     */
    private String muscleGroup;

    /**
     * 难度等级（1初级/2中级/3高级）
     */
    private Integer difficultyLevel;

    /**
     * 删除标志（0存在 2删除）
     */
    private String delFlag;

    /**
     * 删除时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date delTime;

    /**
     * 练习描述
     */
    private String description;

    /**
     * 专业建议
     */
    private String professionalTips;

    /**
     * 是否系统预置（0否 1是）
     */
    private Integer isSystem;

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
}
