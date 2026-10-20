package com.zzy.fitnessserver.service;

import com.zzy.fitnessserver.entity.UserActivePlan;

import java.util.List;

/**
 * 用户激活计划服务类接口
 */
public interface UserActivePlanService {
    
    /**
     * 激活训练计划（单计划模式）
     *
     * @param userId 用户ID
     * @param planId 计划ID
     * @return 激活的计划对象
     */
    UserActivePlan activatePlan(Long userId, Long planId);
    
    /**
     * 获取用户的活跃计划
     *
     * @param userId 用户ID
     * @return 活跃计划对象，如果没有则返回null
     */
    UserActivePlan getActivePlan(Long userId);
    
    /**
     * 暂停活跃计划
     *
     * @param userId 用户ID
     */
    void pausePlan(Long userId);
    
    /**
     * 完成计划
     *
     * @param userId 用户ID
     */
    void completePlan(Long userId);
    
    /**
     * 更新训练进度
     *
     * @param userId 用户ID
     * @param dayNumber 当前天数
     */
    void updateProgress(Long userId, Integer dayNumber);
    
    /**
     * 获取用户的所有计划历史
     *
     * @param userId 用户ID
     * @return 计划历史列表
     */
    List<UserActivePlan> getPlanHistory(Long userId);

    int countActivePlans(Long userId);
}
