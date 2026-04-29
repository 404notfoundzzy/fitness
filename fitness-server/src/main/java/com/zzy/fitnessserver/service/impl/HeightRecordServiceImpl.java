package com.zzy.fitnessserver.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zzy.fitnessserver.entity.HeightRecord;
import com.zzy.fitnessserver.mapper.HeightRecordMapper;
import com.zzy.fitnessserver.service.HeightRecordService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Date;
import java.util.List;

@Service
public class HeightRecordServiceImpl extends ServiceImpl<HeightRecordMapper, HeightRecord>
        implements HeightRecordService {

    @Override
    public List<HeightRecord> getHeightHistory(Long userId) {
        return list(new LambdaQueryWrapper<HeightRecord>()
                .eq(HeightRecord::getUserId, userId)
                .orderByAsc(HeightRecord::getRecordDate));
    }

    @Override
    public HeightRecord recordHeight(Long userId, BigDecimal height, LocalDate recordDate,
                                      Date recordTime, String remark) {
        if (recordDate == null) {
            recordDate = LocalDate.now();
        }

        HeightRecord existing = getOne(new LambdaQueryWrapper<HeightRecord>()
                .eq(HeightRecord::getUserId, userId)
                .eq(HeightRecord::getRecordDate, recordDate));

        if (existing != null) {
            com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper<HeightRecord> updateWrapper =
                new com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper<>();
            updateWrapper.eq("id", existing.getId());
            updateWrapper.set("height", height);
            if (recordTime == null) {
                updateWrapper.set("record_time", null);
            } else {
                updateWrapper.set("record_time", recordTime);
            }
            if (remark == null) {
                updateWrapper.set("remark", null);
            } else {
                updateWrapper.set("remark", remark);
            }
            super.update(updateWrapper);
            existing.setHeight(height);
            existing.setRecordTime(recordTime);
            existing.setRemark(remark);
            return existing;
        } else {
            HeightRecord record = HeightRecord.builder()
                    .userId(userId)
                    .height(height)
                    .recordDate(recordDate)
                    .recordTime(recordTime)
                    .remark(remark)
                    .build();
            save(record);
            return record;
        }
    }

    @Override
    public boolean existsByDate(Long userId, LocalDate date) {
        return count(new LambdaQueryWrapper<HeightRecord>()
                .eq(HeightRecord::getUserId, userId)
                .eq(HeightRecord::getRecordDate, date)) > 0;
    }

    @Override
    public boolean updateByIdWithNull(Long id, HeightRecord record) {
        com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper<HeightRecord> updateWrapper =
            new com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper<>();
        updateWrapper.eq("id", id);
        if (record.getRecordTime() == null) {
            updateWrapper.set("record_time", null);
        } else {
            updateWrapper.set("record_time", record.getRecordTime());
        }
        updateWrapper.set("height", record.getHeight());
        updateWrapper.set("record_date", record.getRecordDate());
        updateWrapper.set("remark", record.getRemark());

        return super.update(updateWrapper);
    }
}
