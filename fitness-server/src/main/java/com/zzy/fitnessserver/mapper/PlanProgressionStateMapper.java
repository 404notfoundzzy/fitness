package com.zzy.fitnessserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zzy.fitnessserver.entity.PlanProgressionState;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface PlanProgressionStateMapper extends BaseMapper<PlanProgressionState> {

    /**
     * 查询某计划的全部动作渐进状态
     */
    @Select("SELECT * FROM plan_progression_state WHERE user_id = #{userId} AND plan_id = #{planId}")
    List<PlanProgressionState> findByPlan(@Param("userId") Long userId, @Param("planId") Long planId);

    /**
     * 查询单个动作的渐进状态（无则返回 null）
     */
    @Select("SELECT * FROM plan_progression_state WHERE user_id = #{userId} AND plan_id = #{planId} AND exercise_id = #{exerciseId} LIMIT 1")
    PlanProgressionState findOne(@Param("userId") Long userId,
                                 @Param("planId") Long planId,
                                 @Param("exerciseId") Long exerciseId);
}
