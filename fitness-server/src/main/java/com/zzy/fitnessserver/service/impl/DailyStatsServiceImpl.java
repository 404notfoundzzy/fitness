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
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 每日统计服务实现类
 */
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

    /**
     * 根据用户ID和日期获取统计数据
     */
    @Override
    public Optional<DailyStats> getByUserIdAndDate(Long userId, LocalDate date) {
        return Optional.ofNullable(getOne(new LambdaQueryWrapper<DailyStats>()
                .eq(DailyStats::getUserId, userId)
                .eq(DailyStats::getDate, date)));
    }

    /**
     * 获取用户在指定日期范围内的统计数据
     */
    @Override
    public List<DailyStats> getByUserIdAndDateBetween(Long userId, LocalDate startDate, LocalDate endDate) {
        return list(new LambdaQueryWrapper<DailyStats>()
                .eq(DailyStats::getUserId, userId)
                .between(DailyStats::getDate, startDate, endDate)
                .orderByAsc(DailyStats::getDate));
    }
}
