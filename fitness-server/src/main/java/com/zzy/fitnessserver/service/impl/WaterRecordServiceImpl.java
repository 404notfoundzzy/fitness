package com.zzy.fitnessserver.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zzy.fitnessserver.entity.WaterRecord;
import com.zzy.fitnessserver.mapper.WaterRecordMapper;
import com.zzy.fitnessserver.service.WaterRecordService;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class WaterRecordServiceImpl extends ServiceImpl<WaterRecordMapper, WaterRecord>
        implements WaterRecordService {

    @Override
    public List<WaterRecord> getRecordsByDate(Long userId, Date date) {
        return list(new LambdaQueryWrapper<WaterRecord>()
                .eq(WaterRecord::getUserId, userId)
                .and(w -> w.eq(WaterRecord::getRecordDate, date)
                        .or()
                        .apply("DATE(record_time) = {0}", new SimpleDateFormat("yyyy-MM-dd").format(date)))
                .orderByDesc(WaterRecord::getRecordDate)
                .orderByDesc(WaterRecord::getRecordTime));
    }

    @Override
    public Integer getDailyTotal(Long userId, Date date) {
        List<WaterRecord> records = getRecordsByDate(userId, date);
        return records.stream().mapToInt(WaterRecord::getAmountMl).sum();
    }

    @Override
    public Map<String, Integer> getWeeklySummary(Long userId, Date startDate) {
        Map<String, Integer> summary = new LinkedHashMap<>();
        Calendar cal = Calendar.getInstance();
        for (int i = 0; i < 7; i++) {
            cal.setTime(startDate);
            cal.add(Calendar.DAY_OF_MONTH, -(6 - i));
            Date day = cal.getTime();
            String dayStr = new SimpleDateFormat("yyyy-MM-dd").format(day);
            summary.put(dayStr, getDailyTotal(userId, day));
        }
        return summary;
    }

    @Override
    public boolean updateByIdWithNull(Long id, WaterRecord record) {
        com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper<WaterRecord> updateWrapper =
            new com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper<>();
        updateWrapper.eq("id", id);
        if (record.getRecordTime() == null) {
            updateWrapper.set("record_time", null);
        } else {
            updateWrapper.set("record_time", record.getRecordTime());
        }
        updateWrapper.set("amount_ml", record.getAmountMl());
        updateWrapper.set("drink_type", record.getDrinkType());
        updateWrapper.set("record_date", record.getRecordDate());
        updateWrapper.set("remark", record.getRemark());

        return super.update(updateWrapper);
    }
}
