package com.zzy.fitnessserver.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zzy.fitnessserver.entity.Exercise;
import com.zzy.fitnessserver.mapper.ExerciseMapper;
import com.zzy.fitnessserver.service.ExerciseService;
import org.springframework.stereotype.Service;
import java.util.List;

/**
 * 练习项目服务实现类
 */
@Service
public class ExerciseServiceImpl extends ServiceImpl<ExerciseMapper, Exercise> implements ExerciseService {
    /**
     * 搜索练习项目
     */
    @Override
    public List<Exercise> searchExercises(String query) {
        if (query == null || query.isEmpty()) {
            return list();
        }
        return list(new LambdaQueryWrapper<Exercise>()
                .like(Exercise::getName, query)
                .or()
                .like(Exercise::getMuscleGroup, query));
    }
}
