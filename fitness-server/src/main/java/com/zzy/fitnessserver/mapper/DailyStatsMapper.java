package com.zzy.fitnessserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zzy.fitnessserver.entity.DailyStats;
import org.apache.ibatis.annotations.Mapper;

/**
 * 每日统计数据层接口
 */
@Mapper
public interface DailyStatsMapper extends BaseMapper<DailyStats> {
}
