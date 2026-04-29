package com.zzy.fitnessserver.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zzy.fitnessserver.entity.DailyStats;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 每日统计服务类接口
 */
public interface DailyStatsService extends IService<DailyStats> {
    /**
     * 根据用户ID和日期获取统计数据
     */
    Optional<DailyStats> getByUserIdAndDate(Long userId, LocalDate date);

    /**
     * 获取用户在指定日期范围内的统计数据
     */
    List<DailyStats> getByUserIdAndDateBetween(Long userId, LocalDate startDate, LocalDate endDate);
}
