package com.zzy.fitnessserver.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zzy.fitnessserver.entity.DailyStats;
import com.zzy.fitnessserver.mapper.DailyStatsMapper;
import com.zzy.fitnessserver.service.DailyStatsService;
import com.zzy.fitnessserver.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.io.Serializable;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DailyStatsServiceImpl extends ServiceImpl<DailyStatsMapper, DailyStats> implements DailyStatsService {
    private final UserService userService;

    @Override
    public boolean save(DailyStats entity) {
        boolean result = super.save(entity);
        if (result) {
            userService.recalculateStats(entity.getUserId());
        }
        return result;
    }

    @Override
    public boolean updateById(DailyStats entity) {
        boolean result = super.updateById(entity);
        if (result) {
            userService.recalculateStats(entity.getUserId());
        }
        return result;
    }

    @Override
    public boolean removeById(Serializable id) {
        DailyStats entity = getById(id);
        boolean result = super.removeById(id);
        if (result && entity != null) {
            userService.recalculateStats(entity.getUserId());
        }
        return result;
    }

    @Override
    public Optional<DailyStats> getByUserIdAndDate(Long userId, Date date) {
        java.sql.Date sqlDate = date != null ? new java.sql.Date(date.getTime()) : null;
        return Optional.ofNullable(getOne(new LambdaQueryWrapper<DailyStats>()
                .eq(DailyStats::getUserId, userId)
                .eq(DailyStats::getDate, sqlDate)));
    }

    @Override
    public List<DailyStats> getByUserIdAndDateBetween(Long userId, Date startDate, Date endDate) {
        java.sql.Date sqlStartDate = startDate != null ? new java.sql.Date(startDate.getTime()) : null;
        java.sql.Date sqlEndDate = endDate != null ? new java.sql.Date(endDate.getTime()) : null;
        return list(new LambdaQueryWrapper<DailyStats>()
                .eq(DailyStats::getUserId, userId)
                .between(DailyStats::getDate, sqlStartDate, sqlEndDate)
                .orderByAsc(DailyStats::getDate));
    }
}
