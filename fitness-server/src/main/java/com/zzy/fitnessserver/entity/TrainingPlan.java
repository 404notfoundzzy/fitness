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
import java.util.List;

/**
 * 训练计划主表实体类
 * 包含完整的状态管理系统（6种状态）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("training_plan")
public class TrainingPlan {

    /**
     * 计划状态常量定义
     */
    public static final String STATUS_NOT_STARTED = "0";
    public static final String STATUS_IN_PROGRESS = "1";
    public static final String STATUS_PAUSED = "2";
    public static final String STATUS_COMPLETED = "3";
    public static final String STATUS_ARCHIVED = "4";
    public static final String STATUS_EXPIRED = "5";

    /**
     * 状态显示名称映射
     */
    public static final String[] STATUS_LABELS = {
        "未开始",
        "训练中",
        "已暂停",
        "已完成",
        "已归档",
        "已过期"
    };

    /**
     * 状态对应的CSS样式类
     */
    public static final String[] STATUS_CSS_CLASSES = {
        "info",
        "warning",
        "danger",
        "success",
        "default",
        "danger"
    };

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
     * 来源（system/user）
     */
    private String source;
    
    /**
     * 计划类型(0用户创建 1系统预置)
     */
    private Integer planType;
    
    /**
     * 计划状态（0未开始/1训练中/2已暂停/3已完成/4已归档/5已过期）
     */
    private String status;

    /**
     * 训练进度（0-100）
     */
    private Integer progress;

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
     * 获取状态显示名称
     */
    public String getStatusLabel() {
        try {
            int index = Integer.parseInt(status);
            if (index >= 0 && index < STATUS_LABELS.length) {
                return STATUS_LABELS[index];
            }
        } catch (NumberFormatException e) {
            // 忽略异常
        }
        return "未知状态";
    }

    /**
     * 获取状态对应的CSS样式类
     */
    public String getStatusCssClass() {
        try {
            int index = Integer.parseInt(status);
            if (index >= 0 && index < STATUS_CSS_CLASSES.length) {
                return STATUS_CSS_CLASSES[index];
            }
        } catch (NumberFormatException e) {
            // 忽略异常
        }
        return "default";
    }

    /**
     * 判断是否可以开始训练（未开始或已暂停状态）
     */
    public boolean canStart() {
        return STATUS_NOT_STARTED.equals(status) || STATUS_PAUSED.equals(status);
    }

    /**
     * 判断是否正在训练中
     */
    public boolean isInProgress() {
        return STATUS_IN_PROGRESS.equals(status);
    }

    /**
     * 判断是否已完成
     */
    public boolean isCompleted() {
        return STATUS_COMPLETED.equals(status);
    }

    /**
     * 判断是否已结束（已完成、归档或过期）
     */
    public boolean isFinished() {
        return STATUS_COMPLETED.equals(status)
                || STATUS_ARCHIVED.equals(status)
                || STATUS_EXPIRED.equals(status);
    }

    /**
     * 根据进度自动计算并更新状态
     * 规则：
     * - progress == 0 → 未开始(0)
     * - 0 < progress < 100 → 训练中(1)
     * - progress >= 100 → 已完成(3)
     */
    public void updateStatusByProgress() {
        if (progress == null || progress <= 0) {
            this.status = STATUS_NOT_STARTED;
        } else if (progress >= 100) {
            this.status = STATUS_COMPLETED;
        } else {
            this.status = STATUS_IN_PROGRESS;
        }
    }

    /**
     * 手动暂停训练计划
     */
    public void pause() {
        if (STATUS_IN_PROGRESS.equals(status)) {
            this.status = STATUS_PAUSED;
        }
    }

    /**
     * 恢复已暂停的训练计划
     */
    public void resume() {
        if (STATUS_PAUSED.equals(status)) {
            this.status = STATUS_IN_PROGRESS;
        }
    }

    /**
     * 归档训练计划
     */
    public void archive() {
        if (!STATUS_ARCHIVED.equals(status)) {
            this.status = STATUS_ARCHIVED;
        }
    }

    /**
     * 计划包含的训练日列表（非数据库字段）
     */
    @TableField(exist = false)
    private List<TrainingPlanDay> days;
}