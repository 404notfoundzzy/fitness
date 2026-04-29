package com.zzy.fitnessserver.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zzy.fitnessserver.entity.HeightRecord;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Date;
import java.util.List;

public interface HeightRecordService extends IService<HeightRecord> {
    List<HeightRecord> getHeightHistory(Long userId);

    HeightRecord recordHeight(Long userId, BigDecimal height, LocalDate recordDate, Date recordTime, String remark);

    boolean existsByDate(Long userId, LocalDate date);

    boolean updateByIdWithNull(Long id, HeightRecord record);
}
