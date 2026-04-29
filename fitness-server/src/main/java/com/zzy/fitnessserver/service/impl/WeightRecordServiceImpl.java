package com.zzy.fitnessserver.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zzy.fitnessserver.entity.WeightRecord;
import com.zzy.fitnessserver.mapper.WeightRecordMapper;
import com.zzy.fitnessserver.service.WeightRecordService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Date;
import java.util.List;

@Service
public class WeightRecordServiceImpl extends ServiceImpl<WeightRecordMapper, WeightRecord>
        implements WeightRecordService {

    @Override
    public List<WeightRecord> getWeightHistory(Long userId) {
        return list(new LambdaQueryWrapper<WeightRecord>()
                .eq(WeightRecord::getUserId, userId)
                .orderByAsc(WeightRecord::getRecordDate)
                .orderByAsc(WeightRecord::getTimePeriod));
    }

    @Override
    public List<WeightRecord> getWeightHistoryByPeriod(Long userId, String timePeriod) {
        LambdaQueryWrapper<WeightRecord> wrapper = new LambdaQueryWrapper<WeightRecord>()
                .eq(WeightRecord::getUserId, userId);
        if (timePeriod != null && !timePeriod.isEmpty()) {
            wrapper.eq(WeightRecord::getTimePeriod, timePeriod);
        }
        return list(wrapper.orderByAsc(WeightRecord::getRecordDate));
    }

    @Override
    public WeightRecord recordWeight(Long userId, BigDecimal weight, LocalDate recordDate,
                                     String timePeriod, Date recordTime) {
        if (recordDate == null) {
            recordDate = LocalDate.now();
        }

        WeightRecord existing = getOne(new LambdaQueryWrapper<WeightRecord>()
                .eq(WeightRecord::getUserId, userId)
                .eq(WeightRecord::getRecordDate, recordDate)
                .eq(WeightRecord::getTimePeriod, timePeriod));

        if (existing != null) {
            com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper<WeightRecord> updateWrapper =
                new com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper<>();
            updateWrapper.eq("id", existing.getId());
            updateWrapper.set("weight", weight);
            if (recordTime == null) {
                updateWrapper.set("record_time", null);
            } else {
                updateWrapper.set("record_time", recordTime);
            }
            super.update(updateWrapper);
            existing.setWeight(weight);
            existing.setRecordTime(recordTime);
            return existing;
        } else {
            WeightRecord record = WeightRecord.builder()
                    .userId(userId)
                    .weight(weight)
                    .recordDate(recordDate)
                    .timePeriod(timePeriod)
                    .recordTime(recordTime)
                    .build();
            save(record);
            return record;
        }
    }

    @Override
    public boolean existsByDateAndPeriod(Long userId, LocalDate date, String timePeriod) {
        return count(new LambdaQueryWrapper<WeightRecord>()
                .eq(WeightRecord::getUserId, userId)
                .eq(WeightRecord::getRecordDate, date)
                .eq(WeightRecord::getTimePeriod, timePeriod)) > 0;
    }

    @Override
    public boolean existsByDate(Long userId, LocalDate date) {
        return count(new LambdaQueryWrapper<WeightRecord>()
                .eq(WeightRecord::getUserId, userId)
                .eq(WeightRecord::getRecordDate, date)) > 0;
    }

    @Override
    public boolean updateByIdWithNull(Long id, WeightRecord record) {
        com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper<WeightRecord> updateWrapper =
            new com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper<>();
        updateWrapper.eq("id", id);
        if (record.getRecordTime() == null) {
            updateWrapper.set("record_time", null);
        } else {
            updateWrapper.set("record_time", record.getRecordTime());
        }
        updateWrapper.set("weight", record.getWeight());
        updateWrapper.set("record_date", record.getRecordDate());
        updateWrapper.set("time_period", record.getTimePeriod());
        updateWrapper.set("remark", record.getRemark());

        return super.update(updateWrapper);
    }
}
