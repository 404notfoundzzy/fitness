package com.zzy.fitnessserver.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zzy.fitnessserver.entity.Exercise;
import java.util.List;

/**
 * 练习项目服务类接口
 */
public interface ExerciseService extends IService<Exercise> {
    /**
     * 搜索练习项目
     */
    List<Exercise> searchExercises(String query);
}
