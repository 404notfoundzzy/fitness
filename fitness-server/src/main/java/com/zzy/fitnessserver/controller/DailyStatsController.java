package com.zzy.fitnessserver.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zzy.fitnessserver.common.BaseContext;
import com.zzy.fitnessserver.common.CommonResult;
import com.zzy.fitnessserver.entity.DailyStats;
import com.zzy.fitnessserver.service.DailyStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/daily-stats")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DailyStatsController {
    private final DailyStatsService dailyStatsService;

    @GetMapping("/today")
    public CommonResult<DailyStats> getTodayStats() {
        Date today = getToday();
        java.sql.Date sqlToday = new java.sql.Date(today.getTime());
        return CommonResult.success(dailyStatsService.getByUserIdAndDate(BaseContext.getCurrentId(), sqlToday)
                .orElse(DailyStats.builder()
                        .userId(BaseContext.getCurrentId())
                        .date(sqlToday)
                        .caloriesBurned(0)
                        .steps(0)
                        .activityDurationMinutes(0)
                        .build()));
    }

    @GetMapping("/weekly")
    public CommonResult<List<DailyStats>> getWeeklyActivity(
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        if (startDate == null || endDate == null) {
            Calendar cal = Calendar.getInstance();
            normalizeToStartOfDay(cal);
            endDate = cal.getTime();
            cal.add(Calendar.DAY_OF_MONTH, -6);
            startDate = cal.getTime();
        }
        return CommonResult.success(
                dailyStatsService.getByUserIdAndDateBetween(BaseContext.getCurrentId(), startDate, endDate));
    }

    @GetMapping("/page")
    public CommonResult<Page<DailyStats>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size) {
        Page<DailyStats> page = new Page<>(current, size);
        return CommonResult.success(dailyStatsService.page(page, new LambdaQueryWrapper<DailyStats>()
                .eq(DailyStats::getUserId, BaseContext.getCurrentId())
                .orderByDesc(DailyStats::getDate)));
    }

    @PostMapping
    public CommonResult<Boolean> save(@RequestBody DailyStats dailyStats) {
        dailyStats.setUserId(BaseContext.getCurrentId());
        return CommonResult.success(dailyStatsService.save(dailyStats));
    }

    @PutMapping("/{id}")
    public CommonResult<Boolean> update(@PathVariable Long id, @RequestBody DailyStats dailyStats) {
        dailyStats.setId(id);
        dailyStats.setUserId(BaseContext.getCurrentId());
        return CommonResult.success(dailyStatsService.updateById(dailyStats));
    }

    @DeleteMapping("/{id}")
    public CommonResult<Boolean> delete(@PathVariable Long id) {
        return CommonResult.success(dailyStatsService.removeById(id));
    }

    private Date getToday() {
        Calendar cal = Calendar.getInstance();
        normalizeToStartOfDay(cal);
        return cal.getTime();
    }

    private void normalizeToStartOfDay(Calendar cal) {
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
    }
}
