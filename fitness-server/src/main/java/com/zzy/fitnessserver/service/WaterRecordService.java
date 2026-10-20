package com.zzy.fitnessserver.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zzy.fitnessserver.entity.WaterRecord;

import java.util.Date;
import java.util.List;
import java.util.Map;

public interface WaterRecordService extends IService<WaterRecord> {
    List<WaterRecord> getRecordsByDate(Long userId, Date date);

    Integer getDailyTotal(Long userId, Date date);

    Map<String, Integer> getWeeklySummary(Long userId, Date startDate);

    boolean updateByIdWithNull(Long id, WaterRecord record);
}
