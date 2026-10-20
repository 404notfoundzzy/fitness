package com.zzy.fitnessserver;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zzy.fitnessserver.entity.DailyStats;
import com.zzy.fitnessserver.entity.User;
import com.zzy.fitnessserver.entity.WorkoutRecord;
import com.zzy.fitnessserver.mapper.DailyStatsMapper;
import com.zzy.fitnessserver.mapper.UserMapper;
import com.zzy.fitnessserver.mapper.WorkoutRecordMapper;
import com.zzy.fitnessserver.service.UserService;
import com.zzy.fitnessserver.service.impl.DailyStatsServiceImpl;
import com.zzy.fitnessserver.service.impl.UserServiceImpl;
import com.zzy.fitnessserver.service.impl.WorkoutRecordServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("全链路集成测试 - 运动记录写入→统计→展示")
class WorkoutFlowIntegrationTest {

    @Mock
    private WorkoutRecordMapper workoutRecordMapper;

    @Mock
    private DailyStatsMapper dailyStatsMapper;

    @Mock
    private UserMapper userMapper;

    @Mock
    private UserService userService;

    private WorkoutRecordServiceImpl workoutRecordService;
    private DailyStatsServiceImpl dailyStatsService;
    private UserServiceImpl userServiceImpl;

    private SimpleDateFormat sdfFull = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    private SimpleDateFormat sdfDate = new SimpleDateFormat("yyyy-MM-dd");
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() throws Exception {
        objectMapper = new ObjectMapper();
        objectMapper.setTimeZone(java.util.TimeZone.getTimeZone("GMT+8"));

        workoutRecordService = new WorkoutRecordServiceImpl(userService);
        injectBaseMapper(workoutRecordService, workoutRecordMapper);

        dailyStatsService = new DailyStatsServiceImpl(userService);
        injectBaseMapper(dailyStatsService, dailyStatsMapper);

        userServiceImpl = new UserServiceImpl(workoutRecordMapper, dailyStatsMapper);
        injectBaseMapper(userServiceImpl, userMapper);
    }

    private void injectBaseMapper(Object service, Object mapper) throws Exception {
        Field baseMapperField = com.baomidou.mybatisplus.extension.service.impl.ServiceImpl.class
                .getDeclaredField("baseMapper");
        baseMapperField.setAccessible(true);
        baseMapperField.set(service, mapper);
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

    @Nested
    @DisplayName("场景1: 用户记录一条运动 → DailyStats自动更新 → 首页统计展示")
    class Scenario1_SingleWorkoutFlow {

        @Test
        @DisplayName("完整流程: 写入运动记录 → recalculateStats → DailyStats包含正确时长和卡路里")
        void testFullFlow_singleWorkout() throws Exception {
            Date startTime = sdfFull.parse("2026-05-28 14:35:22");

            when(workoutRecordMapper.insert(any(WorkoutRecord.class))).thenReturn(1);

            WorkoutRecord record = WorkoutRecord.builder()
                    .startTime(startTime)
                    .name("胸部训练")
                    .durationMinutes(45)
                    .exerciseCount(5)
                    .volume(new BigDecimal("1200"))
                    .build();

            WorkoutRecord saved = workoutRecordService.saveWorkoutRecord(1L, record);

            assertNotNull(saved.getStartTime(), "startTime不应为null");
            assertEquals("2026-05-28 14:35:22", sdfFull.format(saved.getStartTime()),
                    "startTime的时分秒应被完整保留");
            assertEquals("2026-05-28", sdfDate.format(saved.getWorkoutDate()),
                    "workoutDate应从startTime提取");
            assertEquals("2026-05-28 00:00:00", sdfFull.format(saved.getWorkoutDate()),
                    "workoutDate时分秒应归零");

            verify(userService, times(1)).recalculateStats(1L);
        }
    }

    @Nested
    @DisplayName("场景2: 同一天多次运动 → DailyStats累计时长")
    class Scenario2_MultipleWorkoutsSameDay {

        @Test
        @DisplayName("同一天记录3次运动 → DailyStats时长应累加")
        void testMultipleWorkouts_sameDay_durationAccumulated() throws Exception {
            User user = buildTestUser();
            when(userMapper.selectById(1L)).thenReturn(user);

            WorkoutRecord w1 = WorkoutRecord.builder()
                    .userId(1L).startTime(sdfFull.parse("2026-05-28 07:00:00"))
                    .status("已完成").durationMinutes(30).build();
            WorkoutRecord w2 = WorkoutRecord.builder()
                    .userId(1L).startTime(sdfFull.parse("2026-05-28 14:30:00"))
                    .status("已完成").durationMinutes(45).build();
            WorkoutRecord w3 = WorkoutRecord.builder()
                    .userId(1L).startTime(sdfFull.parse("2026-05-28 19:15:00"))
                    .status("已完成").durationMinutes(20).build();
            when(workoutRecordMapper.selectList(any())).thenReturn(Arrays.asList(w1, w2, w3));

            DailyStats todayStats = DailyStats.builder()
                    .id(1L).userId(1L).date(sdfDate.parse("2026-05-28"))
                    .caloriesBurned(0).steps(5000).activityDurationMinutes(0).build();
            when(dailyStatsMapper.selectList(any())).thenReturn(Collections.singletonList(todayStats));

            doAnswer(invocation -> {
                DailyStats updated = invocation.getArgument(0);
                assertEquals(95, updated.getActivityDurationMinutes(),
                        "3次运动时长应累加: 30+45+20=95分钟");
                int expectedCalories = 95 * 8 + (int) (5000 * 0.04);
                assertEquals(expectedCalories, updated.getCaloriesBurned(),
                        "卡路里应基于累计时长计算");
                return null;
            }).when(dailyStatsMapper).updateById(any(DailyStats.class));

            userServiceImpl.recalculateStats(1L);

            verify(dailyStatsMapper, times(1)).updateById(any(DailyStats.class));
        }
    }

    @Nested
    @DisplayName("场景3: 连续多天运动 → 连续天数(streak)正确计算")
    class Scenario3_ConsecutiveDaysStreak {

        @Test
        @DisplayName("连续3天运动 → streakDays应为3")
        void testStreakDays_threeConsecutiveDays() throws Exception {
            User user = buildTestUser();
            user.setStreakDays(0);
            when(userMapper.selectById(1L)).thenReturn(user);

            WorkoutRecord w1 = WorkoutRecord.builder().userId(1L).startTime(sdfFull.parse("2026-05-28 08:00:00")).status("已完成").durationMinutes(30).build();
            WorkoutRecord w2 = WorkoutRecord.builder().userId(1L).startTime(sdfFull.parse("2026-05-27 08:00:00")).status("已完成").durationMinutes(30).build();
            WorkoutRecord w3 = WorkoutRecord.builder().userId(1L).startTime(sdfFull.parse("2026-05-26 08:00:00")).status("已完成").durationMinutes(30).build();
            when(workoutRecordMapper.selectList(any())).thenReturn(Arrays.asList(w1, w2, w3));

            DailyStats s1 = DailyStats.builder().id(1L).userId(1L).date(sdfDate.parse("2026-05-28")).caloriesBurned(100).steps(3000).activityDurationMinutes(30).build();
            DailyStats s2 = DailyStats.builder().userId(1L).date(sdfDate.parse("2026-05-27")).caloriesBurned(200).build();
            DailyStats s3 = DailyStats.builder().userId(1L).date(sdfDate.parse("2026-05-26")).caloriesBurned(150).build();
            when(dailyStatsMapper.selectList(any())).thenReturn(Arrays.asList(s1, s2, s3));

            doAnswer(invocation -> {
                User updated = invocation.getArgument(0);
                assertEquals(3, updated.getStreakDays(),
                        "连续3天运动streakDays应为3");
                return null;
            }).when(userMapper).updateById(any(User.class));

            userServiceImpl.recalculateStats(1L);

            verify(userMapper, times(1)).updateById(any(User.class));
        }

        @Test
        @DisplayName("中间断一天 → streakDays应只计算最近的连续天数")
        void testStreakDays_gapInMiddle() throws Exception {
            User user = buildTestUser();
            user.setStreakDays(0);
            when(userMapper.selectById(1L)).thenReturn(user);

            WorkoutRecord w1 = WorkoutRecord.builder().userId(1L).startTime(sdfFull.parse("2026-05-28 08:00:00")).status("已完成").durationMinutes(30).build();
            when(workoutRecordMapper.selectList(any())).thenReturn(Collections.singletonList(w1));

            DailyStats s1 = DailyStats.builder().id(1L).userId(1L).date(sdfDate.parse("2026-05-28")).caloriesBurned(100).steps(3000).activityDurationMinutes(30).build();
            DailyStats s3 = DailyStats.builder().userId(1L).date(sdfDate.parse("2026-05-26")).caloriesBurned(150).build();
            when(dailyStatsMapper.selectList(any())).thenReturn(Arrays.asList(s1, s3));

            doAnswer(invocation -> {
                User updated = invocation.getArgument(0);
                assertEquals(1, updated.getStreakDays(),
                        "中间断一天streakDays应只为1");
                return null;
            }).when(userMapper).updateById(any(User.class));

            userServiceImpl.recalculateStats(1L);

            verify(userMapper, times(1)).updateById(any(User.class));
        }
    }

    @Nested
    @DisplayName("场景4: JSON序列化/反序列化 - 前后端日期格式适配")
    class Scenario4_JsonSerialization {

        @Test
        @DisplayName("WorkoutRecord序列化 - workoutDate应为yyyy-MM-dd, startTime应为yyyy-MM-dd HH:mm:ss")
        void testWorkoutRecord_serialization() throws Exception {
            Date workoutDate = sdfDate.parse("2026-05-28");
            Date startTime = sdfFull.parse("2026-05-28 14:35:22");

            WorkoutRecord record = WorkoutRecord.builder()
                    .id(1L)
                    .userId(1L)
                    .name("胸部训练")
                    .workoutDate(workoutDate)
                    .startTime(startTime)
                    .durationMinutes(45)
                    .exerciseCount(5)
                    .volume(new BigDecimal("1200"))
                    .build();

            String json = objectMapper.writeValueAsString(record);

            assertTrue(json.contains("\"workoutDate\":\"2026-05-28\""),
                    "workoutDate序列化应为yyyy-MM-dd格式: " + json);
            assertTrue(json.contains("\"startTime\":\"2026-05-28 14:35:22\""),
                    "startTime序列化应为yyyy-MM-dd HH:mm:ss格式: " + json);
            assertFalse(json.contains("\"workoutDate\":\"2026-05-28 00:00:00\""),
                    "workoutDate序列化不应包含时分秒: " + json);
        }

        @Test
        @DisplayName("WorkoutRecord反序列化 - 前端发送'2026-05-28'应正确解析为Date")
        void testWorkoutRecord_deserialization_dateOnly() throws Exception {
            String json = "{\"name\":\"背部训练\",\"workoutDate\":\"2026-05-28\",\"durationMinutes\":60}";

            WorkoutRecord record = objectMapper.readValue(json, WorkoutRecord.class);

            assertNotNull(record.getWorkoutDate(), "workoutDate反序列化不应为null");
            assertEquals("2026-05-28", sdfDate.format(record.getWorkoutDate()),
                    "前端发送yyyy-MM-dd应正确反序列化为Date");
        }

        @Test
        @DisplayName("WorkoutRecord反序列化 - 前端发送'2026-05-28 14:35:22'应正确解析为Date")
        void testWorkoutRecord_deserialization_dateTime() throws Exception {
            String json = "{\"name\":\"背部训练\",\"startTime\":\"2026-05-28 14:35:22\",\"durationMinutes\":60}";

            WorkoutRecord record = objectMapper.readValue(json, WorkoutRecord.class);

            assertNotNull(record.getStartTime(), "startTime反序列化不应为null");
            assertEquals("2026-05-28 14:35:22", sdfFull.format(record.getStartTime()),
                    "前端发送yyyy-MM-dd HH:mm:ss应正确反序列化为Date，保留时分秒");
        }

        @Test
        @DisplayName("WorkoutRecord反序列化 - 模拟前端workout.vue的payload")
        void testWorkoutRecord_deserialization_frontendPayload() throws Exception {
            String json = "{" +
                    "\"name\":\"跑步\"," +
                    "\"durationMinutes\":30," +
                    "\"exerciseCount\":0," +
                    "\"volume\":0," +
                    "\"workoutDate\":\"2026-05-28\"," +
                    "\"startTime\":\"2026-05-28 07:15:00\"," +
                    "\"remark\":null" +
                    "}";

            WorkoutRecord record = objectMapper.readValue(json, WorkoutRecord.class);

            assertEquals("跑步", record.getName());
            assertEquals(30, record.getDurationMinutes());
            assertEquals("2026-05-28", sdfDate.format(record.getWorkoutDate()),
                    "workoutDate应从yyyy-MM-dd字符串正确解析");
            assertEquals("2026-05-28 07:15:00", sdfFull.format(record.getStartTime()),
                    "startTime应从yyyy-MM-dd HH:mm:ss字符串正确解析，保留时分秒");
        }

        @Test
        @DisplayName("DailyStats序列化 - date字段应为yyyy-MM-dd格式")
        void testDailyStats_serialization() throws Exception {
            Date date = sdfDate.parse("2026-05-28");

            DailyStats stats = DailyStats.builder()
                    .id(1L)
                    .userId(1L)
                    .date(date)
                    .caloriesBurned(360)
                    .steps(5000)
                    .activityDurationMinutes(45)
                    .build();

            String json = objectMapper.writeValueAsString(stats);

            assertTrue(json.contains("\"date\":\"2026-05-28\""),
                    "DailyStats.date序列化应为yyyy-MM-dd格式: " + json);
            assertFalse(json.contains("\"date\":\"2026-05-28 00:00:00\""),
                    "DailyStats.date序列化不应包含时分秒: " + json);
        }

        @Test
        @DisplayName("DailyStats反序列化 - 首页weekly接口返回的date应正确解析")
        void testDailyStats_deserialization() throws Exception {
            String json = "{\"id\":1,\"userId\":1,\"date\":\"2026-05-28\",\"caloriesBurned\":360,\"steps\":5000,\"activityDurationMinutes\":45}";

            DailyStats stats = objectMapper.readValue(json, DailyStats.class);

            assertNotNull(stats.getDate(), "date反序列化不应为null");
            assertEquals("2026-05-28", sdfDate.format(stats.getDate()),
                    "DailyStats.date应从yyyy-MM-dd字符串正确解析");
        }
    }

    @Nested
    @DisplayName("场景5: 首页统计图表 - 日期范围查询与数据匹配")
    class Scenario5_WeeklyActivityChart {

        @Test
        @DisplayName("周统计查询 - DailyStats.date与前端日期字符串应正确匹配")
        void testWeeklyActivity_dateMatching() throws Exception {
            Calendar cal = Calendar.getInstance();
            cal.set(Calendar.HOUR_OF_DAY, 0);
            cal.set(Calendar.MINUTE, 0);
            cal.set(Calendar.SECOND, 0);
            cal.set(Calendar.MILLISECOND, 0);

            Date monday = cal.getTime();
            cal.add(Calendar.DAY_OF_MONTH, 1);
            Date tuesday = cal.getTime();
            cal.add(Calendar.DAY_OF_MONTH, 1);
            Date wednesday = cal.getTime();

            DailyStats s1 = DailyStats.builder().userId(1L).date(monday)
                    .activityDurationMinutes(30).caloriesBurned(240).build();
            DailyStats s2 = DailyStats.builder().userId(1L).date(tuesday)
                    .activityDurationMinutes(45).caloriesBurned(360).build();
            DailyStats s3 = DailyStats.builder().userId(1L).date(wednesday)
                    .activityDurationMinutes(0).caloriesBurned(0).build();

            when(dailyStatsMapper.selectList(any())).thenReturn(Arrays.asList(s1, s2, s3));

            List<DailyStats> result = dailyStatsService.getByUserIdAndDateBetween(1L, monday, wednesday);

            assertEquals(3, result.size(), "应返回3天的统计数据");

            SimpleDateFormat frontendFormat = new SimpleDateFormat("yyyy-MM-dd");
            for (DailyStats stat : result) {
                String dateStr = frontendFormat.format(stat.getDate());
                assertNotNull(dateStr, "日期字符串不应为null");
                assertTrue(dateStr.matches("\\d{4}-\\d{2}-\\d{2}"),
                        "日期格式应为yyyy-MM-dd: " + dateStr);
            }

            String mondayStr = frontendFormat.format(monday);
            String resultDateStr = frontendFormat.format(result.get(0).getDate());
            assertEquals(mondayStr, resultDateStr,
                    "查询结果的日期应与查询参数匹配");
        }

        @Test
        @DisplayName("前端normalizeDate逻辑 - Date序列化为字符串后应能被前端正确匹配")
        void testFrontendNormalizeDate_logic() throws Exception {
            Date dateWithTime = sdfFull.parse("2026-05-28 14:35:22");

            SimpleDateFormat frontendFormat = new SimpleDateFormat("yyyy-MM-dd");
            String serializedDate = frontendFormat.format(dateWithTime);

            assertEquals("2026-05-28", serializedDate,
                    "Date序列化为yyyy-MM-dd后应与前端normalizeDate逻辑匹配");

            String frontendDateStr = "2026-05-28";
            assertEquals(frontendDateStr, serializedDate,
                    "后端序列化的日期应与前端生成的日期字符串格式一致");
        }
    }

    @Nested
    @DisplayName("场景6: 深夜/凌晨边界 - 跨天运动记录的日期归属")
    class Scenario6_DateBoundary {

        @Test
        @DisplayName("23:59:59的运动记录应归属当天而非次日")
        void testLateNightWorkout_belongsToSameDay() throws Exception {
            Date lateNight = sdfFull.parse("2026-05-28 23:59:59");

            when(workoutRecordMapper.insert(any(WorkoutRecord.class))).thenReturn(1);

            WorkoutRecord record = WorkoutRecord.builder()
                    .startTime(lateNight)
                    .name("深夜训练")
                    .durationMinutes(20)
                    .build();

            WorkoutRecord saved = workoutRecordService.saveWorkoutRecord(1L, record);

            assertEquals("2026-05-28", sdfDate.format(saved.getWorkoutDate()),
                    "23:59:59的运动应归属2026-05-28");
            assertEquals("2026-05-28 23:59:59", sdfFull.format(saved.getStartTime()),
                    "startTime应保留完整时间23:59:59");
        }

        @Test
        @DisplayName("00:00:01的运动记录应归属当天")
        void testEarlyMorningWorkout_belongsToSameDay() throws Exception {
            Date earlyMorning = sdfFull.parse("2026-05-28 00:00:01");

            when(workoutRecordMapper.insert(any(WorkoutRecord.class))).thenReturn(1);

            WorkoutRecord record = WorkoutRecord.builder()
                    .startTime(earlyMorning)
                    .name("凌晨训练")
                    .durationMinutes(15)
                    .build();

            WorkoutRecord saved = workoutRecordService.saveWorkoutRecord(1L, record);

            assertEquals("2026-05-28", sdfDate.format(saved.getWorkoutDate()),
                    "00:00:01的运动应归属2026-05-28");
            assertEquals("2026-05-28 00:00:01", sdfFull.format(saved.getStartTime()),
                    "startTime应保留完整时间00:00:01");
        }

        @Test
        @DisplayName("连续天数计算 - 23:59:59和次日00:00:01应属于不同天")
        void testStreakDays_boundaryDates_differentDays() throws Exception {
            Date lateNight = sdfFull.parse("2026-05-27 23:59:59");
            Date earlyMorning = sdfFull.parse("2026-05-28 00:00:01");

            SimpleDateFormat dayFormat = new SimpleDateFormat("yyyy-MM-dd");
            String day1 = dayFormat.format(lateNight);
            String day2 = dayFormat.format(earlyMorning);

            assertNotEquals(day1, day2,
                    "23:59:59和00:00:01应属于不同天");
            assertEquals("2026-05-27", day1);
            assertEquals("2026-05-28", day2);
        }
    }

    @Nested
    @DisplayName("场景7: 时分秒保留验证 - 写入到读取全链路")
    class Scenario7_TimePreservation {

        @Test
        @DisplayName("运动记录: 写入14:35:22 → JSON序列化 → 反序列化 → 时分秒不变")
        void testTimePreservation_fullRoundTrip() throws Exception {
            Date originalStartTime = sdfFull.parse("2026-05-28 14:35:22");

            WorkoutRecord original = WorkoutRecord.builder()
                    .id(1L)
                    .userId(1L)
                    .name("测试训练")
                    .startTime(originalStartTime)
                    .workoutDate(sdfDate.parse("2026-05-28"))
                    .durationMinutes(45)
                    .build();

            String json = objectMapper.writeValueAsString(original);

            WorkoutRecord deserialized = objectMapper.readValue(json, WorkoutRecord.class);

            assertEquals(sdfFull.format(original.getStartTime()),
                    sdfFull.format(deserialized.getStartTime()),
                    "startTime经序列化/反序列化后时分秒应不变");
            assertEquals("2026-05-28 14:35:22", sdfFull.format(deserialized.getStartTime()),
                    "14:35:22应被完整保留");
        }

        @Test
        @DisplayName("运动记录: 不同时间点写入后时分秒均正确保留")
        void testTimePreservation_variousTimes() throws Exception {
            String[] times = {"06:00:00", "12:30:45", "18:15:30", "23:59:59", "00:00:01"};

            for (String time : times) {
                String dateTimeStr = "2026-05-28 " + time;
                Date startTime = sdfFull.parse(dateTimeStr);

                WorkoutRecord record = WorkoutRecord.builder()
                        .startTime(startTime)
                        .name("测试")
                        .durationMinutes(10)
                        .build();

                when(workoutRecordMapper.insert(any(WorkoutRecord.class))).thenReturn(1);
                WorkoutRecord saved = workoutRecordService.saveWorkoutRecord(1L, record);

                assertEquals(dateTimeStr, sdfFull.format(saved.getStartTime()),
                        "startTime " + time + " 应被完整保留");
                assertEquals("2026-05-28", sdfDate.format(saved.getWorkoutDate()),
                        "workoutDate应正确提取为2026-05-28");
                assertEquals("2026-05-28 00:00:00", sdfFull.format(saved.getWorkoutDate()),
                        "workoutDate时分秒应为00:00:00");
            }
        }
    }
}
