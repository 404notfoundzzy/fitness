package com.zzy.fitnessserver.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zzy.fitnessserver.common.BaseContext;
import com.zzy.fitnessserver.common.CommonResult;
import com.zzy.fitnessserver.entity.WaterRecord;
import com.zzy.fitnessserver.service.WaterRecordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/water")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class WaterRecordController {
    private final WaterRecordService waterRecordService;

    private static final Set<String> VALID_DRINK_TYPES = Collections.unmodifiableSet(
            new HashSet<>(Arrays.asList("water", "tea", "coffee", "juice", "other")));

    private boolean isValidDrinkType(String type) {
        return StringUtils.hasText(type) && VALID_DRINK_TYPES.contains(type.toLowerCase());
    }

    @GetMapping("/list")
    public CommonResult<List<WaterRecord>> listByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date.isAfter(LocalDate.now())) {
            return CommonResult.error("日期不能晚于今天");
        }
        try {
            List<WaterRecord> records = waterRecordService.getRecordsByDate(BaseContext.getCurrentId(), date);
            return CommonResult.success(records);
        } catch (Exception e) {
            log.error("Failed to fetch water records by date: {}", date, e);
            return CommonResult.error("获取饮水记录失败");
        }
    }

    @GetMapping("/page")
    public CommonResult<Page<WaterRecord>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size) {
        try {
            Page<WaterRecord> page = new Page<>(current, size);
            Page<WaterRecord> result = waterRecordService.page(page, new LambdaQueryWrapper<WaterRecord>()
                    .eq(WaterRecord::getUserId, BaseContext.getCurrentId())
                    .orderByDesc(WaterRecord::getRecordTime));
            return CommonResult.success(result);
        } catch (Exception e) {
            log.error("Failed to fetch water records page", e);
            return CommonResult.error("获取饮水记录失败");
        }
    }

    @PostMapping
    public CommonResult<WaterRecord> add(@RequestBody WaterRecord record) {
        if (record.getAmountMl() == null || record.getAmountMl() <= 0) {
            return CommonResult.error("饮水量必须大于0");
        }
        if (!isValidDrinkType(record.getDrinkType())) {
            return CommonResult.error("无效的饮水类型");
        }
        try {
            record.setUserId(BaseContext.getCurrentId());
            waterRecordService.save(record);
            log.info("Water record added: id={}, userId={}, amount={}ml",
                    record.getId(), record.getUserId(), record.getAmountMl());
            return CommonResult.success(record);
        } catch (Exception e) {
            log.error("Failed to add water record", e);
            return CommonResult.error("保存饮水记录失败");
        }
    }

    @PutMapping("/{id}")
    public CommonResult<Boolean> update(@PathVariable Long id, @RequestBody WaterRecord record) {
        if (record.getAmountMl() != null && record.getAmountMl() <= 0) {
            return CommonResult.error("饮水量必须大于0");
        }
        if (StringUtils.hasText(record.getDrinkType()) && !isValidDrinkType(record.getDrinkType())) {
            return CommonResult.error("无效的饮水类型");
        }
        try {
            record.setId(id);
            record.setUserId(BaseContext.getCurrentId());
            boolean success = waterRecordService.updateById(record);
            if (success) {
                log.info("Water record updated: id={}", id);
                return CommonResult.success(true);
            }
            return CommonResult.error("更新失败，记录可能不存在");
        } catch (Exception e) {
            log.error("Failed to update water record: {}", id, e);
            return CommonResult.error("更新饮水记录失败");
        }
    }

    @DeleteMapping("/{id}")
    public CommonResult<Boolean> delete(@PathVariable Long id) {
        try {
            boolean success = waterRecordService.removeById(id);
            if (success) {
                log.info("Water record deleted: id={}", id);
                return CommonResult.success(true);
            }
            return CommonResult.error("删除失败，记录可能不存在");
        } catch (Exception e) {
            log.error("Failed to delete water record: {}", id, e);
            return CommonResult.error("删除饮水记录失败");
        }
    }

    @GetMapping("/daily-total")
    public CommonResult<Integer> getDailyTotal(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            Integer total = waterRecordService.getDailyTotal(BaseContext.getCurrentId(), date);
            return CommonResult.success(total != null ? total : 0);
        } catch (Exception e) {
            log.error("Failed to get daily water total: {}", date, e);
            return CommonResult.error("获取每日饮水量失败");
        }
    }

    @GetMapping("/weekly-summary")
    public CommonResult<Map<LocalDate, Integer>> getWeeklySummary() {
        try {
            Map<LocalDate, Integer> summary = waterRecordService.getWeeklySummary(
                    BaseContext.getCurrentId(), LocalDate.now()
            );
            return CommonResult.success(summary);
        } catch (Exception e) {
            log.error("Failed to get weekly water summary", e);
            return CommonResult.error("获取每周饮水统计失败");
        }
    }
}
