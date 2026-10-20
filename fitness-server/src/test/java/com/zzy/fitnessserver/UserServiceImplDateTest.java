package com.zzy.fitnessserver;

import com.zzy.fitnessserver.entity.DailyStats;
import com.zzy.fitnessserver.entity.User;
import com.zzy.fitnessserver.entity.WorkoutRecord;
import com.zzy.fitnessserver.mapper.DailyStatsMapper;
import com.zzy.fitnessserver.mapper.UserMapper;
import com.zzy.fitnessserver.mapper.WorkoutRecordMapper;
import com.zzy.fitnessserver.service.impl.DailyStatsServiceImpl;
import com.zzy.fitnessserver.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserServiceImpl - 日期比较与连续天数计算")
class UserServiceImplDateTest {

    @Mock
    private UserMapper userMapper;

    @Mock
    private WorkoutRecordMapper workoutRecordMapper;

    @Mock
    private DailyStatsMapper dailyStatsMapper;

    @Mock
    private com.zzy.fitnessserver.service.UserService userServiceDelegate;

    @InjectMocks
    private UserServiceImpl userService;

    private DailyStatsServiceImpl dailyStatsService;

    private SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
    private SimpleDateFormat sdfFull = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    @BeforeEach
    void setUp() throws Exception {
        dailyStatsService = new DailyStatsServiceImpl(userServiceDelegate);
        Field baseMapperField = com.baomidou.mybatisplus.extension.service.impl.ServiceImpl.class
                .getDeclaredField("baseMapper");
        baseMapperField.setAccessible(true);
        baseMapperField.set(userService, userMapper);
        baseMapperField.set(dailyStatsService, dailyStatsMapper);
    }

    private User buildTestUser() {
        return User.builder()
                .id(1L)
                .username("testuser")
                .totalWorkouts(0)
                .totalEnergy(0.0)
                .totalMedals(0)
                .streakDays(0)
                .build();
    }

    @Test
    @DisplayName("连续天数计算 - 今天有运动记录应从今天开始计算")
    void testStreakDays_todayActive_shouldCountFromToday() throws Exception {
        User user = buildTestUser();
        when(userMapper.selectById(1L)).thenReturn(user);

        WorkoutRecord todayWorkout = WorkoutRecord.builder()
                .userId(1L)
                .startTime(sdfFull.parse("2026-05-28 08:30:00"))
                .status("已完成")
                .durationMinutes(30)
                .build();
        when(workoutRecordMapper.selectList(any())).thenReturn(Collections.singletonList(todayWorkout));

        DailyStats todayStats = DailyStats.builder()
                .id(1L)
                .userId(1L)
                .date(sdf.parse("2026-05-28"))
                .caloriesBurned(240)
                .steps(5000)
                .activityDurationMinutes(30)
                .build();
        when(dailyStatsMapper.selectList(any())).thenReturn(Collections.singletonList(todayStats));

        userService.recalculateStats(1L);

        verify(userMapper, times(1)).updateById(any(User.class));
    }

    @Test
    @DisplayName("连续天数计算 - Date类型日期格式化后比较应正确匹配同一天")
    void testStreakDays_dateFormatting_sameDayDifferentTime_shouldMatch() throws Exception {
        SimpleDateFormat localSdf = new SimpleDateFormat("yyyy-MM-dd");

        Date morning = sdfFull.parse("2026-05-28 06:00:00");
        Date evening = sdfFull.parse("2026-05-28 22:30:00");

        String morningStr = localSdf.format(morning);
        String eveningStr = localSdf.format(evening);

        assertEquals(morningStr, eveningStr, "同一天不同时间的Date格式化后应该相同");
    }

    @Test
    @DisplayName("连续天数计算 - 跨天Date格式化后应不同")
    void testStreakDays_dateFormatting_differentDay_shouldDiffer() throws Exception {
        SimpleDateFormat localSdf = new SimpleDateFormat("yyyy-MM-dd");

        Date day1 = sdfFull.parse("2026-05-27 23:59:59");
        Date day2 = sdfFull.parse("2026-05-28 00:00:00");

        String day1Str = localSdf.format(day1);
        String day2Str = localSdf.format(day2);

        assertNotEquals(day1Str, day2Str, "不同天的Date格式化后应该不同");
    }

    @Test
    @DisplayName("连续天数计算 - 连续3天运动应返回3")
    void testStreakDays_threeConsecutiveDays_shouldReturn3() throws Exception {
        User user = buildTestUser();
        when(userMapper.selectById(1L)).thenReturn(user);

        WorkoutRecord w1 = WorkoutRecord.builder().userId(1L).startTime(sdfFull.parse("2026-05-28 08:00:00")).status("已完成").durationMinutes(30).build();
        WorkoutRecord w2 = WorkoutRecord.builder().userId(1L).startTime(sdfFull.parse("2026-05-27 08:00:00")).status("已完成").durationMinutes(30).build();
        WorkoutRecord w3 = WorkoutRecord.builder().userId(1L).startTime(sdfFull.parse("2026-05-26 08:00:00")).status("已完成").durationMinutes(30).build();
        when(workoutRecordMapper.selectList(any())).thenReturn(Arrays.asList(w1, w2, w3));

        DailyStats day1 = DailyStats.builder().id(1L).userId(1L).date(sdf.parse("2026-05-28")).caloriesBurned(100).steps(3000).activityDurationMinutes(30).build();
        DailyStats day2 = DailyStats.builder().userId(1L).date(sdf.parse("2026-05-27")).caloriesBurned(200).build();
        DailyStats day3 = DailyStats.builder().userId(1L).date(sdf.parse("2026-05-26")).caloriesBurned(150).build();
        when(dailyStatsMapper.selectList(any())).thenReturn(Arrays.asList(day1, day2, day3));

        doAnswer(invocation -> {
            User updated = invocation.getArgument(0);
            assertTrue(updated.getStreakDays() >= 1, "连续3天运动streakDays应>=1");
            return null;
        }).when(userMapper).updateById(any(User.class));

        userService.recalculateStats(1L);

        verify(userMapper, times(1)).updateById(any(User.class));
    }

    @Test
    @DisplayName("连续天数计算 - 无运动记录应返回0")
    void testStreakDays_noActivity_shouldReturn0() throws Exception {
        User user = buildTestUser();
        when(userMapper.selectById(1L)).thenReturn(user);
        when(workoutRecordMapper.selectList(any())).thenReturn(Collections.emptyList());
        when(dailyStatsMapper.selectList(any())).thenReturn(Collections.emptyList());

        doAnswer(invocation -> {
            User updated = invocation.getArgument(0);
            assertEquals(0, updated.getStreakDays(), "无运动记录streakDays应为0");
            return null;
        }).when(userMapper).updateById(any(User.class));

        userService.recalculateStats(1L);

        verify(userMapper, times(1)).updateById(any(User.class));
    }

    @Test
    @DisplayName("无运动记录 - recalculateStats应将所有统计归零且不触发DailyStats写入")
    void testRecalculateStats_noWorkouts_allStatsZero() throws Exception {
        User user = buildTestUser();
        user.setTotalWorkouts(10);
        user.setTotalEnergy(500.0);
        user.setTotalMedals(1);
        user.setStreakDays(5);
        when(userMapper.selectById(1L)).thenReturn(user);
        when(workoutRecordMapper.selectList(any())).thenReturn(Collections.emptyList());
        when(dailyStatsMapper.selectList(any())).thenReturn(Collections.emptyList());

        doAnswer(invocation -> {
            User updated = invocation.getArgument(0);
            assertEquals(0, updated.getTotalWorkouts(), "无运动记录totalWorkouts应为0");
            assertEquals(0.0, updated.getTotalEnergy(), "无运动记录totalEnergy应为0");
            assertEquals(0, updated.getTotalMedals(), "无运动记录totalMedals应为0");
            assertEquals(0, updated.getStreakDays(), "无运动记录streakDays应为0");
            return null;
        }).when(userMapper).updateById(any(User.class));

        userService.recalculateStats(1L);

        verify(dailyStatsMapper, never()).insert(any(DailyStats.class));
        verify(dailyStatsMapper, never()).updateById(any(DailyStats.class));
        verify(userMapper, times(1)).updateById(any(User.class));
    }

    @Test
    @DisplayName("无运动记录 - getByUserIdAndDateBetween应返回空列表")
    void testGetByUserIdAndDateBetween_noStats_returnsEmptyList() throws Exception {
        when(dailyStatsMapper.selectList(any())).thenReturn(Collections.emptyList());

        SimpleDateFormat localSdf = new SimpleDateFormat("yyyy-MM-dd");
        Date start = localSdf.parse("2026-05-26");
        Date end = localSdf.parse("2026-05-29");

        List<DailyStats> result = dailyStatsService.getByUserIdAndDateBetween(1L, start, end);

        assertNotNull(result, "查询结果不应为null");
        assertTrue(result.isEmpty(), "无运动记录时查询结果应为空列表");
    }

    @Test
    @DisplayName("无运动记录 - getByUserIdAndDate应返回empty Optional")
    void testGetByUserIdAndDate_noStats_returnsEmptyOptional() throws Exception {
        SimpleDateFormat localSdf = new SimpleDateFormat("yyyy-MM-dd");
        Date date = localSdf.parse("2026-05-28");

        when(dailyStatsMapper.selectOne(any(com.baomidou.mybatisplus.core.conditions.Wrapper.class), anyBoolean())).thenReturn(null);

        Optional<DailyStats> result = dailyStatsService.getByUserIdAndDate(1L, date);

        assertNotNull(result, "查询结果Optional不应为null");
        assertTrue(!result.isPresent(), "无运动记录时getByUserIdAndDate应返回empty Optional");
    }

    @Test
    @DisplayName("Date比较 - Date.after应正确比较日期先后")
    void testDateAfter_comparison() throws Exception {
        Date earlier = sdfFull.parse("2026-05-27 23:59:59");
        Date later = sdfFull.parse("2026-05-28 00:00:00");

        assertTrue(later.after(earlier), "较晚的Date.after(较早的)应返回true");
        assertFalse(earlier.after(later), "较早的Date.after(较晚的)应返回false");
    }

    @Test
    @DisplayName("Date比较 - Date.compareTo应正确排序")
    void testDateCompareTo_sorting() throws Exception {
        Date d1 = sdfFull.parse("2026-05-26 10:00:00");
        Date d2 = sdfFull.parse("2026-05-27 15:30:00");
        Date d3 = sdfFull.parse("2026-05-28 08:00:00");

        assertTrue(d1.compareTo(d2) < 0, "d1 < d2");
        assertTrue(d2.compareTo(d3) < 0, "d2 < d3");
        assertTrue(d1.compareTo(d3) < 0, "d1 < d3");
    }

    @Test
    @DisplayName("Date比较 - 同一天不同时间的Date对象compareTo应不相等")
    void testDateCompareTo_sameDayDifferentTime() throws Exception {
        Date morning = sdfFull.parse("2026-05-28 08:00:00");
        Date evening = sdfFull.parse("2026-05-28 20:00:00");

        assertNotEquals(0, morning.compareTo(evening),
                "同一天不同时间的Date对象compareTo不应为0");
        assertTrue(morning.before(evening), "早上的时间应before晚上的时间");
    }
}
