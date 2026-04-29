package com.zzy.fitnessserver.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zzy.fitnessserver.common.BaseContext;
import com.zzy.fitnessserver.common.CommonResult;
import com.zzy.fitnessserver.entity.HeightRecord;
import com.zzy.fitnessserver.service.HeightRecordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/heights")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class HeightRecordController {
    private final HeightRecordService heightRecordService;

    @GetMapping("/history")
    public CommonResult<List<HeightRecord>> getHeightHistory() {
        try {
            List<HeightRecord> history = heightRecordService.getHeightHistory(BaseContext.getCurrentId());
            return CommonResult.success(history);
        } catch (Exception e) {
            log.error("Failed to fetch height history", e);
            return CommonResult.error("获取身高历史失败");
        }
    }

    @GetMapping("/page")
    public CommonResult<Page<HeightRecord>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size) {
        try {
            Page<HeightRecord> page = new Page<>(current, size);
            Page<HeightRecord> result = heightRecordService.page(page, new LambdaQueryWrapper<HeightRecord>()
                    .eq(HeightRecord::getUserId, BaseContext.getCurrentId())
                    .orderByDesc(HeightRecord::getRecordDate));
            return CommonResult.success(result);
        } catch (Exception e) {
            log.error("Failed to fetch height records page", e);
            return CommonResult.error("获取身高记录失败");
        }
    }

    @PostMapping
    public CommonResult<HeightRecord> recordHeight(@RequestBody HeightRecord record) {
        if (record.getHeight() == null || record.getHeight().compareTo(BigDecimal.ZERO) <= 0 ||
                record.getHeight().compareTo(new BigDecimal("300")) > 0) {
            return CommonResult.error("身高必须在0-300cm之间");
        }
        if (record.getRecordDate() != null && record.getRecordDate().isAfter(LocalDate.now())) {
            return CommonResult.error("记录日期不能晚于今天");
        }
        try {
            record.setUserId(BaseContext.getCurrentId());
            HeightRecord result = heightRecordService.recordHeight(
                    BaseContext.getCurrentId(),
                    record.getHeight(),
                    record.getRecordDate(),
                    record.getRecordTime(),
                    record.getRemark()
            );
            log.info("Height recorded: id={}, userId={}, height={}cm",
                    result.getId(), result.getUserId(), result.getHeight());
            return CommonResult.success(result);
        } catch (Exception e) {
            log.error("Failed to record height", e);
            return CommonResult.error("记录身高失败");
        }
    }

    @PutMapping("/{id}")
    public CommonResult<Boolean> update(@PathVariable Long id, @RequestBody HeightRecord record) {
        if (record.getHeight() != null &&
                (record.getHeight().compareTo(BigDecimal.ZERO) <= 0 ||
                 record.getHeight().compareTo(new BigDecimal("300")) > 0)) {
            return CommonResult.error("身高必须在0-300cm之间");
        }
        try {
            record.setId(id);
            record.setUserId(BaseContext.getCurrentId());
            boolean success = heightRecordService.updateByIdWithNull(id, record);
            if (success) {
                log.info("Height record updated: id={}", id);
                return CommonResult.success(true);
            }
            return CommonResult.error("更新失败，记录可能不存在");
        } catch (Exception e) {
            log.error("Failed to update height record: {}", id, e);
            return CommonResult.error("更新身高记录失败");
        }
    }

    @DeleteMapping("/{id}")
    public CommonResult<Boolean> delete(@PathVariable Long id) {
        try {
            boolean success = heightRecordService.removeById(id);
            if (success) {
                log.info("Height record deleted: id={}", id);
                return CommonResult.success(true);
            }
            return CommonResult.error("删除失败，记录可能不存在");
        } catch (Exception e) {
            log.error("Failed to delete height record: {}", id, e);
            return CommonResult.error("删除身高记录失败");
        }
    }

    @GetMapping("/check")
    public CommonResult<Boolean> checkHeightRecorded(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            boolean exists = heightRecordService.existsByDate(BaseContext.getCurrentId(), date);
            return CommonResult.success(exists);
        } catch (Exception e) {
            log.error("Failed to check height record for date: {}", date, e);
            return CommonResult.error("检查身高记录失败");
        }
    }
}
