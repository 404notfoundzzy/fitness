package com.zzy.fitnessserver.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zzy.fitnessserver.common.CommonResult;
import com.zzy.fitnessserver.entity.SysDictType;
import com.zzy.fitnessserver.service.SysDictTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * 字典类型控制器
 */
@RestController
@RequestMapping("/api/dict/type")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SysDictTypeController {
    private final SysDictTypeService dictTypeService;

    /**
     * 获取所有字典类型列表
     */
    @GetMapping("/list")
    public CommonResult<List<SysDictType>> list() {
        return CommonResult.success(dictTypeService.list());
    }

    /**
     * 分页获取字典类型
     */
    @GetMapping("/page")
    public CommonResult<Page<SysDictType>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String dictName) {
        Page<SysDictType> page = new Page<>(current, size);
        return CommonResult.success(dictTypeService.page(page, new LambdaQueryWrapper<SysDictType>()
                .like(dictName != null, SysDictType::getDictName, dictName)
                .orderByDesc(SysDictType::getCreateTime)));
    }

    /**
     * 根据ID获取字典类型详情
     */
    @GetMapping("/info/{id}")
    public CommonResult<SysDictType> getById(@PathVariable Long id) {
        return CommonResult.success(dictTypeService.getById(id));
    }

    /**
     * 添加字典类型
     */
    @PostMapping
    public CommonResult<Boolean> save(@RequestBody SysDictType dictType) {
        return CommonResult.success(dictTypeService.save(dictType));
    }

    /**
     * 修改字典类型
     */
    @PutMapping("/edit/{id}")
    public CommonResult<Boolean> update(@PathVariable Long id, @RequestBody SysDictType dictType) {
        dictType.setId(id);
        return CommonResult.success(dictTypeService.updateById(dictType));
    }

    /**
     * 删除字典类型
     */
    @DeleteMapping("/remove/{id}")
    public CommonResult<Boolean> delete(@PathVariable Long id) {
        return CommonResult.success(dictTypeService.removeById(id));
    }
}
