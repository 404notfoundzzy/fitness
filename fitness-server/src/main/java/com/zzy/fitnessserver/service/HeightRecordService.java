package com.zzy.fitnessserver.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zzy.fitnessserver.entity.HeightRecord;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

public interface HeightRecordService extends IService<HeightRecord> {
    List<HeightRecord> getHeightHistory(Long userId);

    List<HeightRecord> getRecordsByDate(Long userId, Date date);

    HeightRecord recordHeight(Long userId, BigDecimal height, Date recordDate, Date recordTime, String remark);

    boolean existsByDate(Long userId, Date date);

    boolean updateByIdWithNull(Long id, HeightRecord record);
}
