package com.zzy.fitnessserver.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zzy.fitnessserver.entity.DietRecord;
import com.zzy.fitnessserver.mapper.DietRecordMapper;
import com.zzy.fitnessserver.service.DietRecordService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DietRecordServiceImpl extends ServiceImpl<DietRecordMapper, DietRecord>
        implements DietRecordService {

    @Override
    public List<DietRecord> getRecordsByDate(Long userId, LocalDate date) {
        return list(new LambdaQueryWrapper<DietRecord>()
                .eq(DietRecord::getUserId, userId)
                .eq(DietRecord::getDietDate, date)
                .orderByAsc(DietRecord::getMealType)
                .orderByAsc(DietRecord::getRecordTime));
    }

    @Override
    public Map<String, Object> getDailyNutritionSummary(Long userId, LocalDate date) {
        List<DietRecord> records = getRecordsByDate(userId, date);

        int totalCalories = 0;
        double totalProtein = 0.0;
        double totalCarbs = 0.0;
        double totalFat = 0.0;

        Map<String, Integer> mealCalories = new HashMap<>();

        for (DietRecord record : records) {
            if (record.getCalories() != null) {
                totalCalories += record.getCalories();
            }
            if (record.getProteinG() != null) {
                totalProtein += record.getProteinG().doubleValue();
            }
            if (record.getCarbsG() != null) {
                totalCarbs += record.getCarbsG().doubleValue();
            }
            if (record.getFatG() != null) {
                totalFat += record.getFatG().doubleValue();
            }

            String mealType = record.getMealType() != null ? record.getMealType() : "other";
            mealCalories.merge(mealType, record.getCalories() != null ? record.getCalories() : 0, Integer::sum);
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalCalories", totalCalories);
        summary.put("totalProtein", Math.round(totalProtein * 100.0) / 100.0);
        summary.put("totalCarbs", Math.round(totalCarbs * 100.0) / 100.0);
        summary.put("totalFat", Math.round(totalFat * 100.0) / 100.0);
        summary.put("mealCalories", mealCalories);
        summary.put("recordCount", records.size());

        return summary;
    }
}
