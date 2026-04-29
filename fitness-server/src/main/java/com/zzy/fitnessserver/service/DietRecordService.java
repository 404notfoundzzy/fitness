package com.zzy.fitnessserver.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zzy.fitnessserver.entity.DietRecord;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface DietRecordService extends IService<DietRecord> {
    List<DietRecord> getRecordsByDate(Long userId, LocalDate date);

    Map<String, Object> getDailyNutritionSummary(Long userId, LocalDate date);
}
