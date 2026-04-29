package com.zzy.fitnessserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zzy.fitnessserver.entity.Exercise;
import org.apache.ibatis.annotations.Mapper;

/**
 * 练习项目数据层接口
 */
@Mapper
public interface ExerciseMapper extends BaseMapper<Exercise> {
}
