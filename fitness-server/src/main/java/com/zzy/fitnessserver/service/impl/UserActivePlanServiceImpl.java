package com.zzy.fitnessserver.service.impl;

import com.zzy.fitnessserver.entity.UserActivePlan;
import com.zzy.fitnessserver.mapper.UserActivePlanMapper;
import com.zzy.fitnessserver.service.UserActivePlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

/**
 * 用户激活计划服务实现类
 */
@Service
@RequiredArgsConstructor
public class UserActivePlanServiceImpl implements UserActivePlanService {
    
    private final UserActivePlanMapper userActivePlanMapper;
    
    @Override
    @Transactional
    public UserActivePlan activatePlan(Long userId, Long planId) {
        // 1. 检查是否已有活跃计划
        UserActivePlan existingActive = userActivePlanMapper.findActivePlanByUserId(userId);
        
        if (existingActive != null) {
            // 暂停旧计划
            existingActive.setStatus("paused");
            userActivePlanMapper.updateById(existingActive);
        }
        
        // 2. 创建新的激活记录
        UserActivePlan activePlan = UserActivePlan.builder()
                .userId(userId)
                .planId(planId)
                .status("active")
                .startDate(getToday())
                .currentDay(1)
                .totalProgress(BigDecimal.ZERO)
                .createBy(String.valueOf(userId))
                .build();
        
        userActivePlanMapper.insert(activePlan);
        
        return activePlan;
    }
    
    @Override
    public UserActivePlan getActivePlan(Long userId) {
        return userActivePlanMapper.findActivePlanByUserId(userId);
    }
    
    @Override
    @Transactional
    public void pausePlan(Long userId) {
        UserActivePlan activePlan = userActivePlanMapper.findActivePlanByUserId(userId);
        if (activePlan != null) {
            activePlan.setStatus("paused");
            userActivePlanMapper.updateById(activePlan);
        }
    }
    
    @Override
    @Transactional
    public void completePlan(Long userId) {
        UserActivePlan activePlan = userActivePlanMapper.findActivePlanByUserId(userId);
        if (activePlan != null) {
            activePlan.setStatus("completed");
            activePlan.setTotalProgress(new BigDecimal("100.00"));
            activePlan.setEndDate(getToday());
            userActivePlanMapper.updateById(activePlan);
        }
    }
    
    @Override
    @Transactional
    public void updateProgress(Long userId, Integer dayNumber) {
        UserActivePlan activePlan = userActivePlanMapper.findActivePlanByUserId(userId);
        if (activePlan != null) {
            activePlan.setCurrentDay(dayNumber);
            userActivePlanMapper.updateById(activePlan);
        }
    }
    
    @Override
    public List<UserActivePlan> getPlanHistory(Long userId) {
        return userActivePlanMapper.findAllByUserId(userId);
    }

    @Override
    public int countActivePlans(Long userId) {
        return userActivePlanMapper.countActivePlansByUserId(userId);
    }

    private Date getToday() {
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        return cal.getTime();
    }
}
