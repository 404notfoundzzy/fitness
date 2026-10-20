package com.zzy.fitnessserver;

import com.zzy.fitnessserver.entity.DailyStats;
import com.zzy.fitnessserver.entity.UserActivePlan;
import com.zzy.fitnessserver.entity.WorkoutRecord;
import com.zzy.fitnessserver.mapper.UserActivePlanMapper;
import com.zzy.fitnessserver.service.impl.UserActivePlanServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.text.SimpleDateFormat;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserActivePlanServiceImpl - 日期逻辑")
class UserActivePlanServiceImplDateTest {

    @Mock
    private UserActivePlanMapper userActivePlanMapper;

    @InjectMocks
    private UserActivePlanServiceImpl userActivePlanService;

    private SimpleDateFormat sdfFull = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    private SimpleDateFormat sdfDate = new SimpleDateFormat("yyyy-MM-dd");

    @Test
    @DisplayName("activatePlan - startDate应为今天且时分秒归零")
    void testActivatePlan_startDateIsTodayNormalized() {
        when(userActivePlanMapper.findActivePlanByUserId(1L)).thenReturn(null);
        when(userActivePlanMapper.insert(any(UserActivePlan.class))).thenReturn(1);

        UserActivePlan result = userActivePlanService.activatePlan(1L, 100L);

        assertNotNull(result.getStartDate(), "startDate不应为null");
        assertEquals("00:00:00", new SimpleDateFormat("HH:mm:ss").format(result.getStartDate()),
                "startDate的时分秒应为00:00:00");
    }

    @Test
    @DisplayName("completePlan - endDate应为今天且时分秒归零")
    void testCompletePlan_endDateIsTodayNormalized() {
        UserActivePlan activePlan = UserActivePlan.builder()
                .id(1L)
                .userId(1L)
                .planId(100L)
                .status("active")
                .currentDay(5)
                .totalProgress(new java.math.BigDecimal("60.00"))
                .build();

        when(userActivePlanMapper.findActivePlanByUserId(1L)).thenReturn(activePlan);

        doAnswer(invocation -> {
            UserActivePlan updated = invocation.getArgument(0);
            assertNotNull(updated.getEndDate(), "endDate不应为null");
            assertEquals("00:00:00", new SimpleDateFormat("HH:mm:ss").format(updated.getEndDate()),
                    "endDate的时分秒应为00:00:00");
            return null;
        }).when(userActivePlanMapper).updateById(any(UserActivePlan.class));

        userActivePlanService.completePlan(1L);

        verify(userActivePlanMapper, times(1)).updateById(any(UserActivePlan.class));
    }

    @Test
    @DisplayName("Date类型 - @JsonFormat yyyy-MM-dd 格式化应只保留日期部分")
    void testJsonFormat_dateOnlyPattern() throws Exception {
        Date dateWithTime = sdfFull.parse("2026-05-28 14:35:22");
        String formatted = sdfDate.format(dateWithTime);

        assertEquals("2026-05-28", formatted,
                "yyyy-MM-dd格式化应只保留日期部分");
    }

    @Test
    @DisplayName("Date类型 - @JsonFormat yyyy-MM-dd HH:mm:ss 格式化应保留完整时间")
    void testJsonFormat_dateTimePattern() throws Exception {
        Date dateWithTime = sdfFull.parse("2026-05-28 14:35:22");
        String formatted = sdfFull.format(dateWithTime);

        assertEquals("2026-05-28 14:35:22", formatted,
                "yyyy-MM-dd HH:mm:ss格式化应保留完整时间");
    }

    @Test
    @DisplayName("DailyStats - date字段应为纯日期(时分秒归零)")
    void testDailyStats_dateFieldShouldBeDateOnly() throws Exception {
        Date dateOnly = sdfDate.parse("2026-05-28");

        DailyStats stats = DailyStats.builder()
                .userId(1L)
                .date(dateOnly)
                .caloriesBurned(300)
                .steps(8000)
                .activityDurationMinutes(45)
                .build();

        assertEquals("2026-05-28", sdfDate.format(stats.getDate()),
                "DailyStats.date应为纯日期");
        assertEquals("2026-05-28 00:00:00", sdfFull.format(stats.getDate()),
                "DailyStats.date的时分秒应为00:00:00");
    }

    @Test
    @DisplayName("WorkoutRecord - startTime应保留完整时分秒")
    void testWorkoutRecord_startTimePreservesTime() throws Exception {
        Date startTime = sdfFull.parse("2026-05-28 14:35:22");

        WorkoutRecord record = WorkoutRecord.builder()
                .userId(1L)
                .startTime(startTime)
                .name("测试训练")
                .build();

        assertEquals("2026-05-28 14:35:22", sdfFull.format(record.getStartTime()),
                "startTime应保留完整时分秒");
    }

    @Test
    @DisplayName("WorkoutRecord - workoutDate应只包含日期不含时间")
    void testWorkoutRecord_workoutDateOnlyDate() throws Exception {
        Date workoutDate = sdfDate.parse("2026-05-28");

        WorkoutRecord record = WorkoutRecord.builder()
                .userId(1L)
                .workoutDate(workoutDate)
                .name("测试训练")
                .build();

        assertEquals("2026-05-28 00:00:00", sdfFull.format(record.getWorkoutDate()),
                "workoutDate应只包含日期，时分秒为00:00:00");
    }
}
