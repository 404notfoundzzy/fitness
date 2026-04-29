package com.zzy.fitnessserver.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zzy.fitnessserver.entity.WaterRecord;
import com.zzy.fitnessserver.mapper.WaterRecordMapper;
import com.zzy.fitnessserver.service.WaterRecordService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class WaterRecordServiceImpl extends ServiceImpl<WaterRecordMapper, WaterRecord>
        implements WaterRecordService {

    @Override
    public List<WaterRecord> getRecordsByDate(Long userId, LocalDate date) {
        return list(new LambdaQueryWrapper<WaterRecord>()
                .eq(WaterRecord::getUserId, userId)
                .apply("DATE(record_time) = {0}", date)
                .orderByAsc(WaterRecord::getRecordTime));
    }

    @Override
    public Integer getDailyTotal(Long userId, LocalDate date) {
        List<WaterRecord> records = getRecordsByDate(userId, date);
        return records.stream().mapToInt(WaterRecord::getAmountMl).sum();
    }

    @Override
    public Map<LocalDate, Integer> getWeeklySummary(Long userId, LocalDate startDate) {
        Map<LocalDate, Integer> summary = new LinkedHashMap<>();
        for (int i = 0; i < 7; i++) {
            LocalDate day = startDate.minusDays(6 - i);
            summary.put(day, getDailyTotal(userId, day));
        }
        return summary;
    }
}
