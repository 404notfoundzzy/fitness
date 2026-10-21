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
 * 渐进状态机（openGym 整合 D6）
 * 每计划每动作持久化当前重量/次数/阶段/减载计数。
 * 算法本身为纯函数推导（前端 utils/training/progression.ts），
 * 此表为可选缓存；删除后由历史重新推导。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("plan_progression_state")
public class PlanProgressionState {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long planId;

    private Long exerciseId;

    /**
     * 当前重量
     */
    private BigDecimal currentWeight;

    /**
     * 当前次数
     */
    private Integer currentReps;

    /**
     * 双倍/三倍进阶阶段
     */
    private Integer stage;

    /**
     * 减载计数
     */
    private Integer deloadCount;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date updatedAt;
}
