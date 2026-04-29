package com.zzy.fitnessserver.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zzy.fitnessserver.entity.WaterRecord;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface WaterRecordService extends IService<WaterRecord> {
    List<WaterRecord> getRecordsByDate(Long userId, LocalDate date);

    Integer getDailyTotal(Long userId, LocalDate date);

    Map<LocalDate, Integer> getWeeklySummary(Long userId, LocalDate startDate);
}
