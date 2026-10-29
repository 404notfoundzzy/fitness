package com.zzy.fitnessserver.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zzy.fitnessserver.common.BaseContext;
import com.zzy.fitnessserver.common.CommonResult;
import com.zzy.fitnessserver.entity.Exercise;
import com.zzy.fitnessserver.service.ExerciseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exercises")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ExerciseController {
    private final ExerciseService exerciseService;

    @GetMapping
    public CommonResult<List<Exercise>> list(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String categoryType,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) String muscle,
            @RequestParam(required = false) String equipment) {
        Long userId = BaseContext.getCurrentId();
        return CommonResult.success(
                exerciseService.listVisibleExercisesFiltered(userId, query, categoryType, source, muscle, equipment));
    }

    /**
     * 动作库分页检索（阶段 4）：导入 5600+ 条上游动作后，列表页必须分页拉取。
     * 与 GET /api/exercises 的筛选语义一致，另外返回 total/pages 供无限滚动。
     */
    @GetMapping("/search")
    public CommonResult<Page<Exercise>> search(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) String muscle,
            @RequestParam(required = false) String equipment,
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer size) {
        Long userId = BaseContext.getCurrentId();
        return CommonResult.success(
                exerciseService.searchExercisesPage(userId, query, source, muscle, equipment, current, size));
    }

    @GetMapping("/page")
    public CommonResult<Page<Exercise>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String name) {
        Page<Exercise> page = new Page<>(current, size);
        return CommonResult.success(exerciseService.page(page, new LambdaQueryWrapper<Exercise>()
                .eq(Exercise::getDelFlag, "0")
                .like(name != null, Exercise::getName, name)));
    }

    @GetMapping("/{id}")
    public CommonResult<Exercise> getById(@PathVariable Long id) {
        Exercise exercise = exerciseService.getById(id);
        if (exercise == null || "2".equals(exercise.getDelFlag())) {
            return CommonResult.error("动作不存在或已删除");
        }
        return CommonResult.success(exercise);
    }

    @PostMapping("/custom")
    public CommonResult<Exercise> createCustomExercise(@RequestBody Exercise exercise) {
        try {
            Long userId = BaseContext.getCurrentId();
            Exercise created = exerciseService.createCustomExercise(exercise, userId);
            return CommonResult.success(created, "自定义动作创建成功");
        } catch (RuntimeException e) {
            return CommonResult.error(e.getMessage());
        }
    }

    @PutMapping("/custom/{id}")
    public CommonResult<Exercise> updateCustomExercise(
            @PathVariable Long id,
            @RequestBody Exercise exercise) {
        try {
            Long userId = BaseContext.getCurrentId();
            Exercise updated = exerciseService.updateCustomExercise(id, exercise, userId);
            return CommonResult.success(updated, "更新成功");
        } catch (RuntimeException e) {
            return CommonResult.error(e.getMessage());
        }
    }

    @DeleteMapping("/custom/{id}")
    public CommonResult<Map<String, Object>> softDeleteExercise(@PathVariable Long id) {
        try {
            Long userId = BaseContext.getCurrentId();
            Map<String, Object> result = exerciseService.softDeleteExercise(id, userId);
            return CommonResult.success(result, "删除成功");
        } catch (RuntimeException e) {
            return CommonResult.error(e.getMessage());
        }
    }

    @GetMapping("/{id}/reference")
    public CommonResult<Map<String, Object>> checkReference(@PathVariable Long id) {
        return CommonResult.success(exerciseService.checkExerciseReference(id));
    }

    @PostMapping
    public CommonResult<Boolean> save(@RequestBody Exercise exercise) {
        return CommonResult.success(exerciseService.save(exercise));
    }

    @PutMapping("/{id}")
    public CommonResult<Boolean> update(@PathVariable Long id, @RequestBody Exercise exercise) {
        exercise.setId(id);
        return CommonResult.success(exerciseService.updateById(exercise));
    }

    @DeleteMapping("/{id}")
    public CommonResult<Boolean> delete(@PathVariable Long id) {
        return CommonResult.success(exerciseService.removeById(id));
    }
}
