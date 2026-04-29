package com.zzy.fitnessserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zzy.fitnessserver.entity.HeightRecord;
import org.apache.ibatis.annotations.Mapper;

/**
 * 身高记录数据层接口
 */
@Mapper
public interface HeightRecordMapper extends BaseMapper<HeightRecord> {
}
