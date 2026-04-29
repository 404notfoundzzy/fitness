package com.zzy.fitnessserver.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zzy.fitnessserver.common.BaseContext;
import com.zzy.fitnessserver.common.CommonResult;
import com.zzy.fitnessserver.entity.WeightRecord;
import com.zzy.fitnessserver.service.WeightRecordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/weights")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class WeightRecordController {
    private final WeightRecordService weightRecordService;

    private static final Set<String> VALID_PERIODS = Collections.unmodifiableSet(
            new HashSet<>(Arrays.asList("morning", "evening")));

    private boolean isValidPeriod(String period) {
        return !StringUtils.hasText(period) || VALID_PERIODS.contains(period.toLowerCase());
    }

    @GetMapping("/history")
    public CommonResult<List<WeightRecord>> getWeightHistory() {
        try {
            List<WeightRecord> history = weightRecordService.getWeightHistory(BaseContext.getCurrentId());
            return CommonResult.success(history);
        } catch (Exception e) {
            log.error("Failed to fetch weight history", e);
            return CommonResult.error("获取体重历史失败");
        }
    }

    @GetMapping("/history-by-period")
    public CommonResult<List<WeightRecord>> getHistoryByPeriod(
            @RequestParam(required = false) String timePeriod) {
        if (!isValidPeriod(timePeriod)) {
            return CommonResult.error("无效的时段参数");
        }
        try {
            List<WeightRecord> history = weightRecordService.getWeightHistoryByPeriod(
                    BaseContext.getCurrentId(), timePeriod
            );
            return CommonResult.success(history);
        } catch (Exception e) {
            log.error("Failed to fetch weight history by period: {}", timePeriod, e);
            return CommonResult.error("获取体重历史失败");
        }
    }

    @GetMapping("/page")
    public CommonResult<Page<WeightRecord>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size) {
        try {
            Page<WeightRecord> page = new Page<>(current, size);
            Page<WeightRecord> result = weightRecordService.page(page, new LambdaQueryWrapper<WeightRecord>()
                    .eq(WeightRecord::getUserId, BaseContext.getCurrentId())
                    .orderByDesc(WeightRecord::getRecordDate));
            return CommonResult.success(result);
        } catch (Exception e) {
            log.error("Failed to fetch weight records page", e);
            return CommonResult.error("获取体重记录失败");
        }
    }

    @PostMapping
    public CommonResult<WeightRecord> recordWeight(@RequestBody WeightRecord record) {
        if (record.getWeight() == null || record.getWeight().compareTo(BigDecimal.ZERO) <= 0) {
            return CommonResult.error("体重必须大于0");
        }
        if (!isValidPeriod(record.getTimePeriod())) {
            return CommonResult.error("无效的时段参数");
        }
        if (record.getRecordDate() != null && record.getRecordDate().isAfter(LocalDate.now())) {
            return CommonResult.error("记录日期不能晚于今天");
        }
        try {
            record.setUserId(BaseContext.getCurrentId());
            WeightRecord result = weightRecordService.recordWeight(
                    BaseContext.getCurrentId(),
                    record.getWeight(),
                    record.getRecordDate(),
                    record.getTimePeriod(),
                    record.getRecordTime()
            );
            log.info("Weight recorded: id={}, userId={}, weight={}kg, period={}",
                    result.getId(), result.getUserId(), result.getWeight(), result.getTimePeriod());
            return CommonResult.success(result);
        } catch (Exception e) {
            log.error("Failed to record weight", e);
            return CommonResult.error("记录体重失败");
        }
    }

    @PutMapping("/{id}")
    public CommonResult<Boolean> update(@PathVariable Long id, @RequestBody WeightRecord record) {
        if (record.getWeight() != null && record.getWeight().compareTo(BigDecimal.ZERO) <= 0) {
            return CommonResult.error("体重必须大于0");
        }
        if (StringUtils.hasText(record.getTimePeriod()) && !isValidPeriod(record.getTimePeriod())) {
            return CommonResult.error("无效的时段参数");
        }
        try {
            record.setId(id);
            record.setUserId(BaseContext.getCurrentId());
            boolean success = weightRecordService.updateByIdWithNull(id, record);
            if (success) {
                log.info("Weight record updated: id={}", id);
                return CommonResult.success(true);
            }
            return CommonResult.error("更新失败，记录可能不存在");
        } catch (Exception e) {
            log.error("Failed to update weight record: {}", id, e);
            return CommonResult.error("更新体重记录失败");
        }
    }

    @DeleteMapping("/{id}")
    public CommonResult<Boolean> delete(@PathVariable Long id) {
        try {
            boolean success = weightRecordService.removeById(id);
            if (success) {
                log.info("Weight record deleted: id={}", id);
                return CommonResult.success(true);
            }
            return CommonResult.error("删除失败，记录可能不存在");
        } catch (Exception e) {
            log.error("Failed to delete weight record: {}", id, e);
            return CommonResult.error("删除体重记录失败");
        }
    }

    @GetMapping("/check")
    public CommonResult<Boolean> checkWeightRecorded(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            boolean exists = weightRecordService.existsByDate(BaseContext.getCurrentId(), date);
            return CommonResult.success(exists);
        } catch (Exception e) {
            log.error("Failed to check weight record for date: {}", date, e);
            return CommonResult.error("检查体重记录失败");
        }
    }

    @GetMapping("/check-period")
    public CommonResult<Boolean> checkWeightRecordedByPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam String timePeriod) {
        if (!isValidPeriod(timePeriod)) {
            return CommonResult.error("无效的时段参数");
        }
        try {
            boolean exists = weightRecordService.existsByDateAndPeriod(BaseContext.getCurrentId(), date, timePeriod);
            return CommonResult.success(exists);
        } catch (Exception e) {
            log.error("Failed to check weight record for date: {} and period: {}", date, timePeriod, e);
            return CommonResult.error("检查体重记录失败");
        }
    }
}
