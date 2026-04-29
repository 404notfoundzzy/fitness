package com.zzy.fitnessserver.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zzy.fitnessserver.common.BaseContext;
import com.zzy.fitnessserver.common.CommonResult;
import com.zzy.fitnessserver.entity.DietRecord;
import com.zzy.fitnessserver.service.DietRecordService;
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
@RequestMapping("/api/diet")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class DietRecordController {
    private final DietRecordService dietRecordService;

    private static final Set<String> VALID_MEAL_TYPES = Collections.unmodifiableSet(
            new HashSet<>(Arrays.asList("breakfast", "lunch", "dinner", "snack")));
    private static final Set<String> VALID_UNITS = Collections.unmodifiableSet(
            new HashSet<>(Arrays.asList("fen", "wan", "ge", "bei", "pian", "ke", "shao")));

    private boolean isValidMealType(String type) {
        return StringUtils.hasText(type) && VALID_MEAL_TYPES.contains(type.toLowerCase());
    }

    private boolean isValidUnit(String unit) {
        return StringUtils.hasText(unit) && VALID_UNITS.contains(unit.toLowerCase());
    }

    @GetMapping("/list")
    public CommonResult<List<DietRecord>> listByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date.isAfter(LocalDate.now())) {
            return CommonResult.error("日期不能晚于今天");
        }
        try {
            List<DietRecord> records = dietRecordService.getRecordsByDate(BaseContext.getCurrentId(), date);
            return CommonResult.success(records);
        } catch (Exception e) {
            log.error("Failed to fetch diet records by date: {}", date, e);
            return CommonResult.error("获取饮食记录失败");
        }
    }

    @GetMapping("/page")
    public CommonResult<Page<DietRecord>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size) {
        try {
            Page<DietRecord> page = new Page<>(current, size);
            Page<DietRecord> result = dietRecordService.page(page, new LambdaQueryWrapper<DietRecord>()
                    .eq(DietRecord::getUserId, BaseContext.getCurrentId())
                    .orderByDesc(DietRecord::getDietDate)
                    .orderByAsc(DietRecord::getMealType));
            return CommonResult.success(result);
        } catch (Exception e) {
            log.error("Failed to fetch diet records page", e);
            return CommonResult.error("获取饮食记录失败");
        }
    }

    @PostMapping
    public CommonResult<DietRecord> add(@RequestBody DietRecord record) {
        if (!StringUtils.hasText(record.getFoodName())) {
            return CommonResult.error("食物名称不能为空");
        }
        if (!isValidMealType(record.getMealType())) {
            return CommonResult.error("无效的餐次类型");
        }
        if (record.getAmount() != null && record.getAmount().doubleValue() <= 0) {
            return CommonResult.error("份量必须大于0");
        }
        if (StringUtils.hasText(record.getUnit()) && !isValidUnit(record.getUnit())) {
            return CommonResult.error("无效的单位类型");
        }
        try {
            record.setUserId(BaseContext.getCurrentId());
            if (record.getDietDate() == null) {
                record.setDietDate(LocalDate.now());
            }
            dietRecordService.save(record);
            log.info("Diet record added: id={}, userId={}, food={}",
                    record.getId(), record.getUserId(), record.getFoodName());
            return CommonResult.success(record);
        } catch (Exception e) {
            log.error("Failed to add diet record", e);
            return CommonResult.error("保存饮食记录失败");
        }
    }

    @PutMapping("/{id}")
    public CommonResult<Boolean> update(@PathVariable Long id, @RequestBody DietRecord record) {
        if (StringUtils.hasText(record.getFoodName()) && record.getFoodName().trim().isEmpty()) {
            return CommonResult.error("食物名称不能为空");
        }
        if (StringUtils.hasText(record.getMealType()) && !isValidMealType(record.getMealType())) {
            return CommonResult.error("无效的餐次类型");
        }
        if (record.getAmount() != null && record.getAmount().doubleValue() <= 0) {
            return CommonResult.error("份量必须大于0");
        }
        try {
            record.setId(id);
            record.setUserId(BaseContext.getCurrentId());
            boolean success = dietRecordService.updateById(record);
            if (success) {
                log.info("Diet record updated: id={}", id);
                return CommonResult.success(true);
            }
            return CommonResult.error("更新失败，记录可能不存在");
        } catch (Exception e) {
            log.error("Failed to update diet record: {}", id, e);
            return CommonResult.error("更新饮食记录失败");
        }
    }

    @DeleteMapping("/{id}")
    public CommonResult<Boolean> delete(@PathVariable Long id) {
        try {
            boolean success = dietRecordService.removeById(id);
            if (success) {
                log.info("Diet record deleted: id={}", id);
                return CommonResult.success(true);
            }
            return CommonResult.error("删除失败，记录可能不存在");
        } catch (Exception e) {
            log.error("Failed to delete diet record: {}", id, e);
            return CommonResult.error("删除饮食记录失败");
        }
    }

    @GetMapping("/nutrition-summary")
    public CommonResult<Map<String, Object>> getNutritionSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            Map<String, Object> summary = dietRecordService.getDailyNutritionSummary(BaseContext.getCurrentId(), date);
            return CommonResult.success(summary);
        } catch (Exception e) {
            log.error("Failed to get nutrition summary: {}", date, e);
            return CommonResult.error("获取营养汇总失败");
        }
    }
}
