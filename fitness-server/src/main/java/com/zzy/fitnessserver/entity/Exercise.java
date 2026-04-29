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
     * 练习名称
     */
    private String name;

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
     * 练习描述
     */
    private String description;

    /**
     * 专业建议
     */
    private String professionalTips;

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
