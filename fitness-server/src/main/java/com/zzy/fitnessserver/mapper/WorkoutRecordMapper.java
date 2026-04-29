package com.zzy.fitnessserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zzy.fitnessserver.entity.WorkoutRecord;
import org.apache.ibatis.annotations.Mapper;

/**
 * 训练记录数据层接口
 */
@Mapper
public interface WorkoutRecordMapper extends BaseMapper<WorkoutRecord> {
}
