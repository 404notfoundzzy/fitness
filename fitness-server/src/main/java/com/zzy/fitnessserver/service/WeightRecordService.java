package com.zzy.fitnessserver.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zzy.fitnessserver.entity.WeightRecord;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Date;
import java.util.List;

public interface WeightRecordService extends IService<WeightRecord> {
    List<WeightRecord> getWeightHistory(Long userId);

    List<WeightRecord> getWeightHistoryByPeriod(Long userId, String timePeriod);

    WeightRecord recordWeight(Long userId, BigDecimal weight, LocalDate recordDate, String timePeriod, Date recordTime);

    boolean existsByDateAndPeriod(Long userId, LocalDate date, String timePeriod);

    boolean existsByDate(Long userId, LocalDate date);

    boolean updateByIdWithNull(Long id, WeightRecord record);
}
