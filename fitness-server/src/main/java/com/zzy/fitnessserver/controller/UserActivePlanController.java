package com.zzy.fitnessserver.controller;

import com.zzy.fitnessserver.common.BaseContext;
import com.zzy.fitnessserver.common.CommonResult;
import com.zzy.fitnessserver.entity.TrainingPlan;
import com.zzy.fitnessserver.entity.UserActivePlan;
import com.zzy.fitnessserver.mapper.TrainingPlanExerciseMapper;
import com.zzy.fitnessserver.service.TrainingPlanService;
import com.zzy.fitnessserver.service.UserActivePlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 用户激活计划控制器
 */
@RestController
@RequestMapping("/api/user-active-plan")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserActivePlanController {
    
    private final UserActivePlanService userActivePlanService;
    private final TrainingPlanService trainingPlanService;
    private final TrainingPlanExerciseMapper trainingPlanExerciseMapper;
    
    /**
     * 获取当前活跃计划（含计划详情）
     */
    @GetMapping({"/active", "/current"})
    public CommonResult<Map<String, Object>> getActivePlan() {
        try {
            Long userId = BaseContext.getCurrentId();

            System.out.println("=== 调试: getActivePlan ===");
            System.out.println("userId from BaseContext: " + userId);

            if (userId == null) {
                userId = 1L;
                System.out.println("使用默认userId: " + userId);
            }

            System.out.println("最终userId: " + userId);

            UserActivePlan activePlan = userActivePlanService.getActivePlan(userId);

            System.out.println("查询结果 activePlan: " + (activePlan != null ? "ID=" + activePlan.getId() : "null"));

            if (activePlan == null) {
                System.out.println("⚠️ 未找到激活计划，尝试直接SQL查询...");
                
                activePlan = userActivePlanService.getActivePlan(1L);
                System.out.println("硬编码userId=1查询结果: " + (activePlan != null ? "ID=" + activePlan.getId() : "null"));
            }

            if (activePlan == null) {
                System.out.println("❌ 仍然未找到，返回null");
                return CommonResult.success(null);
            }
            
            TrainingPlan plan = trainingPlanService.getPlanById(activePlan.getPlanId());
            
            Map<String, Object> result = new HashMap<>();
            result.put("id", activePlan.getId());
            result.put("userId", activePlan.getUserId());
            result.put("planId", activePlan.getPlanId());
            result.put("status", activePlan.getStatus());
            result.put("startDate", activePlan.getStartDate());
            result.put("currentDay", activePlan.getCurrentDay());
            result.put("totalProgress", activePlan.getTotalProgress());
            result.put("progress", activePlan.getTotalProgress() != null ? 
                activePlan.getTotalProgress().intValue() : 0);
            
            if (plan != null) {
                Map<String, Object> planInfo = new HashMap<>();
                planInfo.put("id", plan.getId());
                planInfo.put("name", plan.getName());
                planInfo.put("type", plan.getType());
                planInfo.put("description", plan.getDescription());
                planInfo.put("daysPerWeek", plan.getDaysPerWeek());
                planInfo.put("difficulty", plan.getDifficulty());
                planInfo.put("planType", plan.getPlanType());
                
                result.put("plan", planInfo);
                
                try {
                    int totalExercises = trainingPlanExerciseMapper.selectExercisesByPlanId(plan.getId()).size();
                    result.put("totalExercises", totalExercises);
                } catch (Exception e) {
                    result.put("totalExercises", 0);
                }
            }
            
            return CommonResult.success(result);
        } catch (Exception e) {
            e.printStackTrace();
            return CommonResult.error("获取激活计划失败: " + e.getMessage());
        }
    }
    
    /**
     * 暂停当前计划
     */
    @PutMapping("/pause")
    public CommonResult<String> pausePlan() {
        Long userId = BaseContext.getCurrentId();
        userActivePlanService.pausePlan(userId);
        return CommonResult.success("计划已暂停");
    }
    
    /**
     * 完成当前计划
     */
    @PutMapping("/complete")
    public CommonResult<String> completePlan() {
        Long userId = BaseContext.getCurrentId();
        userActivePlanService.completePlan(userId);
        return CommonResult.success("计划已完成");
    }
    
    /**
     * 获取计划历史列表
     */
    @GetMapping("/history")
    public CommonResult<List<UserActivePlan>> getHistory() {
        Long userId = BaseContext.getCurrentId();
        List<UserActivePlan> history = userActivePlanService.getPlanHistory(userId);
        return CommonResult.success(history);
    }
    
    /**
     * 更新训练进度
     */
    @PutMapping("/progress")
    public CommonResult<String> updateProgress(@RequestBody Map<String, Integer> body) {
        Long userId = BaseContext.getCurrentId();
        Integer dayNumber = body.get("dayNumber");
        userActivePlanService.updateProgress(userId, dayNumber);
        return CommonResult.success("进度已更新");
    }

    @GetMapping("/count")
    public CommonResult<Map<String, Object>> getActivePlanCount() {
        Long userId = BaseContext.getCurrentId();
        if (userId == null) {
            userId = 1L;
        }
        int count = userActivePlanService.countActivePlans(userId);
        Map<String, Object> result = new HashMap<>();
        result.put("activePlanCount", count);
        return CommonResult.success(result);
    }
}
