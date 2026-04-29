package com.zzy.fitnessserver.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zzy.fitnessserver.entity.User;
import java.util.Optional;

/**
 * 用户服务类接口
 */
public interface UserService extends IService<User> {
    /**
     * 根据账号名获取用户
     */
    Optional<User> getByUsername(String username);

    /**
     * 重新计算并更新用户统计数据（训练次数、累计能量等）
     */
    void recalculateStats(Long userId);
}
