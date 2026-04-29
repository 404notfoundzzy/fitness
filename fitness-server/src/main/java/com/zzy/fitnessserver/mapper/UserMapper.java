package com.zzy.fitnessserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zzy.fitnessserver.entity.User;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户数据层接口
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {
}
