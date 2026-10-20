package com.zzy.fitnessserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zzy.fitnessserver.entity.UserActivePlan;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 用户激活计划数据层接口
 */
@Mapper
public interface UserActivePlanMapper extends BaseMapper<UserActivePlan> {
    
    /**
     * 查询用户的活跃计划
     */
    @Select("SELECT * FROM user_active_plan WHERE user_id = #{userId} AND status = 'active'")
    UserActivePlan findActivePlanByUserId(Long userId);
    
    /**
     * 查询用户的所有计划历史
     */
    @Select("SELECT * FROM user_active_plan WHERE user_id = #{userId} ORDER BY create_time DESC")
    List<UserActivePlan> findAllByUserId(Long userId);

    @Select("SELECT COUNT(*) FROM user_active_plan WHERE user_id = #{userId} AND status IN ('active', 'paused')")
    int countActivePlansByUserId(Long userId);
}
