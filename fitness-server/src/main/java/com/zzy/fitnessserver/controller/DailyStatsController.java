package com.zzy.fitnessserver.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zzy.fitnessserver.common.BaseContext;
import com.zzy.fitnessserver.common.CommonResult;
import com.zzy.fitnessserver.entity.DailyStats;
import com.zzy.fitnessserver.service.DailyStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 每日统计控制器
 */
@RestController
@RequestMapping("/api/daily-stats")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DailyStatsController {
    private final DailyStatsService dailyStatsService;

    /**
     * 获取今日统计数据
     */
    @GetMapping("/today")
    public CommonResult<DailyStats> getTodayStats() {
        return CommonResult.success(dailyStatsService.getByUserIdAndDate(BaseContext.getCurrentId(), LocalDate.now())
                .orElse(DailyStats.builder()
                        .userId(BaseContext.getCurrentId())
                        .date(LocalDate.now())
                        .caloriesBurned(0)
                        .steps(0)
                        .activityDurationMinutes(0)
                        .build()));
    }

    /**
     * 获取过去一周的活跃度统计
     */
    @GetMapping("/weekly")
    public CommonResult<List<DailyStats>> getWeeklyActivity() {
        LocalDate today = LocalDate.now();
        return CommonResult.success(
                dailyStatsService.getByUserIdAndDateBetween(BaseContext.getCurrentId(), today.minusDays(7), today));
    }

    /**
     * 分页获取每日统计
     */
    @GetMapping("/page")
    public CommonResult<Page<DailyStats>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size) {
        Page<DailyStats> page = new Page<>(current, size);
        return CommonResult.success(dailyStatsService.page(page, new LambdaQueryWrapper<DailyStats>()
                .eq(DailyStats::getUserId, BaseContext.getCurrentId())
                .orderByDesc(DailyStats::getDate)));
    }

    /**
     * 添加每日统计
     */
    @PostMapping
    public CommonResult<Boolean> save(@RequestBody DailyStats dailyStats) {
        dailyStats.setUserId(BaseContext.getCurrentId());
        return CommonResult.success(dailyStatsService.save(dailyStats));
    }

    /**
     * 修改每日统计
     */
    @PutMapping("/{id}")
    public CommonResult<Boolean> update(@PathVariable Long id, @RequestBody DailyStats dailyStats) {
        dailyStats.setId(id);
        dailyStats.setUserId(BaseContext.getCurrentId());
        return CommonResult.success(dailyStatsService.updateById(dailyStats));
    }

    /**
     * 删除每日统计
     */
    @DeleteMapping("/{id}")
    public CommonResult<Boolean> delete(@PathVariable Long id) {
        return CommonResult.success(dailyStatsService.removeById(id));
    }
}
