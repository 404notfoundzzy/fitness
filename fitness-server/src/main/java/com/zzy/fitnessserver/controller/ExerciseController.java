package com.zzy.fitnessserver.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zzy.fitnessserver.common.CommonResult;
import com.zzy.fitnessserver.entity.Exercise;
import com.zzy.fitnessserver.service.ExerciseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * 练习项目控制器
 */
@RestController
@RequestMapping("/api/exercises")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ExerciseController {
    private final ExerciseService exerciseService;

    /**
     * 获取练习项目列表 (支持根据关键字搜索)
     */
    @GetMapping
    public CommonResult<List<Exercise>> list(@RequestParam(required = false) String query) {
        return CommonResult.success(exerciseService.searchExercises(query));
    }

    /**
     * 分页获取练习项目
     */
    @GetMapping("/page")
    public CommonResult<Page<Exercise>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String name) {
        Page<Exercise> page = new Page<>(current, size);
        return CommonResult.success(exerciseService.page(page, new LambdaQueryWrapper<Exercise>()
                .like(name != null, Exercise::getName, name)));
    }

    /**
     * 根据ID获取练习项目详情
     */
    @GetMapping("/{id}")
    public CommonResult<Exercise> getById(@PathVariable Long id) {
        return CommonResult.success(exerciseService.getById(id));
    }

    /**
     * 添加新的练习项目
     */
    @PostMapping
    public CommonResult<Boolean> save(@RequestBody Exercise exercise) {
        return CommonResult.success(exerciseService.save(exercise));
    }

    /**
     * 修改练习项目
     */
    @PutMapping("/{id}")
    public CommonResult<Boolean> update(@PathVariable Long id, @RequestBody Exercise exercise) {
        exercise.setId(id);
        return CommonResult.success(exerciseService.updateById(exercise));
    }

    /**
     * 删除练习项目
     */
    @DeleteMapping("/{id}")
    public CommonResult<Boolean> delete(@PathVariable Long id) {
        return CommonResult.success(exerciseService.removeById(id));
    }
}
