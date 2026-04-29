package com.zzy.fitnessserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zzy.fitnessserver.entity.WeightRecord;
import org.apache.ibatis.annotations.Mapper;

/**
 * 体重记录数据层接口
 */
@Mapper
public interface WeightRecordMapper extends BaseMapper<WeightRecord> {
}
