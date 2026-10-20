package com.zzy.fitnessserver.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zzy.fitnessserver.entity.WeightRecord;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

public interface WeightRecordService extends IService<WeightRecord> {
    List<WeightRecord> getWeightHistory(Long userId);

    List<WeightRecord> getWeightHistoryByPeriod(Long userId, String timePeriod);

    List<WeightRecord> getRecordsByDate(Long userId, Date date);

    List<WeightRecord> getRecordsByDateAndPeriod(Long userId, Date date, String timePeriod);

    WeightRecord recordWeight(Long userId, BigDecimal weight, Date recordDate, String timePeriod, Date recordTime);

    boolean existsByDateAndPeriod(Long userId, Date date, String timePeriod);

    boolean existsByDate(Long userId, Date date);

    boolean updateByIdWithNull(Long id, WeightRecord record);
}
