package com.zzy.fitnessserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zzy.fitnessserver.entity.TrainingPlanDay;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface TrainingPlanDayMapper extends BaseMapper<TrainingPlanDay> {

    @Select("SELECT * FROM training_plan_day WHERE plan_id = #{planId} ORDER BY day_number, sort_order")
    List<TrainingPlanDay> selectByPlanId(@Param("planId") Long planId);
}
