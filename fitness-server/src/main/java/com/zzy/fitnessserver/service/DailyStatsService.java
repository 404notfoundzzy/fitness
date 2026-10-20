package com.zzy.fitnessserver.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zzy.fitnessserver.entity.DailyStats;
import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface DailyStatsService extends IService<DailyStats> {
    Optional<DailyStats> getByUserIdAndDate(Long userId, Date date);

    List<DailyStats> getByUserIdAndDateBetween(Long userId, Date startDate, Date endDate);
}
