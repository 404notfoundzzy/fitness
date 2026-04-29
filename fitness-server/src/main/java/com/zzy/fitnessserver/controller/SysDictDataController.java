package com.zzy.fitnessserver.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zzy.fitnessserver.common.CommonResult;
import com.zzy.fitnessserver.entity.SysDictData;
import com.zzy.fitnessserver.service.SysDictDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * 字典数据控制器
 */
@RestController
@RequestMapping("/api/dict")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SysDictDataController {
    private final SysDictDataService dictDataService;

    /**
     * 根据字典类型获取字典数据
     */
    @GetMapping("/type/{dictType}")
    public CommonResult<List<SysDictData>> getDictData(@PathVariable String dictType) {
        return CommonResult.success(dictDataService.selectDictDataByType(dictType));
    }

    /**
     * 分页获取字典数据
     */
    @GetMapping("/page")
    public CommonResult<Page<SysDictData>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String dictType) {
        Page<SysDictData> page = new Page<>(current, size);
        return CommonResult.success(dictDataService.page(page, new LambdaQueryWrapper<SysDictData>()
                .eq(dictType != null, SysDictData::getDictType, dictType)
                .orderByAsc(SysDictData::getDictSort)));
    }

    /**
     * 添加字典数据
     */
    @PostMapping
    public CommonResult<Boolean> save(@RequestBody SysDictData dictData) {
        return CommonResult.success(dictDataService.save(dictData));
    }

    /**
     * 修改字典数据
     */
    @PutMapping("/{id}")
    public CommonResult<Boolean> update(@PathVariable Long id, @RequestBody SysDictData dictData) {
        dictData.setId(id);
        return CommonResult.success(dictDataService.updateById(dictData));
    }

    /**
     * 删除字典数据
     */
    @DeleteMapping("/{id}")
    public CommonResult<Boolean> delete(@PathVariable Long id) {
        return CommonResult.success(dictDataService.removeById(id));
    }
}
