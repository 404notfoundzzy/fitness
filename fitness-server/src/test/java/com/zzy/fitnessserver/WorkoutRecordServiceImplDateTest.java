package com.zzy.fitnessserver;

import com.zzy.fitnessserver.entity.WorkoutRecord;
import com.zzy.fitnessserver.mapper.WorkoutRecordMapper;
import com.zzy.fitnessserver.service.UserService;
import com.zzy.fitnessserver.service.impl.WorkoutRecordServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("WorkoutRecordServiceImpl - 日期+时间写入逻辑")
class WorkoutRecordServiceImplDateTest {

    @Mock
    private WorkoutRecordMapper workoutRecordMapper;

    @Mock
    private UserService userService;

    @InjectMocks
    private WorkoutRecordServiceImpl workoutRecordService;

    private SimpleDateFormat sdfFull = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    private SimpleDateFormat sdfDate = new SimpleDateFormat("yyyy-MM-dd");

    @BeforeEach
    void setUp() throws Exception {
        Field baseMapperField = com.baomidou.mybatisplus.extension.service.impl.ServiceImpl.class
                .getDeclaredField("baseMapper");
        baseMapperField.setAccessible(true);
        baseMapperField.set(workoutRecordService, workoutRecordMapper);
    }

    @Test
    @DisplayName("saveWorkoutRecord - startTime的时分秒应被保留到数据库")
    void testSaveWorkoutRecord_startTimePreserved() throws Exception {
        Date startTime = sdfFull.parse("2026-05-28 14:35:22");

        WorkoutRecord record = WorkoutRecord.builder()
                .startTime(startTime)
                .name("胸部训练")
                .durationMinutes(45)
                .build();

        when(workoutRecordMapper.insert(any(WorkoutRecord.class))).thenReturn(1);

        WorkoutRecord result = workoutRecordService.saveWorkoutRecord(1L, record);

        assertNotNull(result.getStartTime(), "startTime不应为null");
        assertEquals("2026-05-28 14:35:22", sdfFull.format(result.getStartTime()),
                "startTime的时分秒应被完整保留");
    }

    @Test
    @DisplayName("saveWorkoutRecord - workoutDate应从startTime提取并归零时分秒")
    void testSaveWorkoutRecord_workoutDateNormalizedFromStartTime() throws Exception {
        Date startTime = sdfFull.parse("2026-05-28 14:35:22");

        WorkoutRecord record = WorkoutRecord.builder()
                .startTime(startTime)
                .name("背部训练")
                .durationMinutes(60)
                .build();

        when(workoutRecordMapper.insert(any(WorkoutRecord.class))).thenReturn(1);

        WorkoutRecord result = workoutRecordService.saveWorkoutRecord(1L, record);

        assertNotNull(result.getWorkoutDate(), "workoutDate不应为null");
        assertEquals("2026-05-28", sdfDate.format(result.getWorkoutDate()),
                "workoutDate应为startTime对应的日期");
        assertEquals("2026-05-28 00:00:00", sdfFull.format(result.getWorkoutDate()),
                "workoutDate的时分秒应被归零");
    }

    @Test
    @DisplayName("saveWorkoutRecord - 无startTime时workoutDate应为今天且归零")
    void testSaveWorkoutRecord_noStartTime_workoutDateIsToday() throws Exception {
        WorkoutRecord record = WorkoutRecord.builder()
                .name("腿部训练")
                .durationMinutes(30)
                .build();

        when(workoutRecordMapper.insert(any(WorkoutRecord.class))).thenReturn(1);

        WorkoutRecord result = workoutRecordService.saveWorkoutRecord(1L, record);

        assertNotNull(result.getWorkoutDate(), "workoutDate不应为null");

        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        Date expectedToday = cal.getTime();

        assertEquals(sdfDate.format(expectedToday), sdfDate.format(result.getWorkoutDate()),
                "无startTime时workoutDate应为今天");
        assertEquals("00:00:00", new SimpleDateFormat("HH:mm:ss").format(result.getWorkoutDate()),
                "workoutDate时分秒应为00:00:00");
    }

    @Test
    @DisplayName("saveWorkoutRecord - 已有workoutDate时不应被覆盖")
    void testSaveWorkoutRecord_existingWorkoutDate_notOverwritten() throws Exception {
        Date existingWorkoutDate = sdfFull.parse("2026-05-20 00:00:00");
        Date startTime = sdfFull.parse("2026-05-28 14:35:22");

        WorkoutRecord record = WorkoutRecord.builder()
                .startTime(startTime)
                .workoutDate(existingWorkoutDate)
                .name("手臂训练")
                .durationMinutes(40)
                .build();

        when(workoutRecordMapper.insert(any(WorkoutRecord.class))).thenReturn(1);

        WorkoutRecord result = workoutRecordService.saveWorkoutRecord(1L, record);

        assertEquals("2026-05-20", sdfDate.format(result.getWorkoutDate()),
                "已有workoutDate不应被startTime覆盖");
    }

    @Test
    @DisplayName("startWorkout - startTime应为当前时间且包含时分秒")
    void testStartWorkout_startTimeHasTimeComponent() throws Exception {
        when(workoutRecordMapper.insert(any(WorkoutRecord.class))).thenReturn(1);

        WorkoutRecord result = workoutRecordService.startWorkout(1L, "晨跑");

        assertNotNull(result.getStartTime(), "startTime不应为null");

        String timeStr = new SimpleDateFormat("HH:mm:ss").format(result.getStartTime());
        assertFalse(timeStr.equals("00:00:00"),
                "startWorkout的startTime应包含实际时分秒，不应为00:00:00");
    }

    @Test
    @DisplayName("saveWorkoutRecord - 深夜23:59:59的startTime应正确提取workoutDate")
    void testSaveWorkoutRecord_lateNightStartTime() throws Exception {
        Date startTime = sdfFull.parse("2026-05-28 23:59:59");

        WorkoutRecord record = WorkoutRecord.builder()
                .startTime(startTime)
                .name("深夜训练")
                .durationMinutes(20)
                .build();

        when(workoutRecordMapper.insert(any(WorkoutRecord.class))).thenReturn(1);

        WorkoutRecord result = workoutRecordService.saveWorkoutRecord(1L, record);

        assertEquals("2026-05-28", sdfDate.format(result.getWorkoutDate()),
                "23:59:59的startTime应正确提取为同一天的workoutDate");
        assertEquals("2026-05-28 00:00:00", sdfFull.format(result.getWorkoutDate()),
                "workoutDate时分秒应归零");
    }

    @Test
    @DisplayName("saveWorkoutRecord - 凌晨00:00:01的startTime应正确提取workoutDate")
    void testSaveWorkoutRecord_earlyMorningStartTime() throws Exception {
        Date startTime = sdfFull.parse("2026-05-28 00:00:01");

        WorkoutRecord record = WorkoutRecord.builder()
                .startTime(startTime)
                .name("凌晨训练")
                .durationMinutes(15)
                .build();

        when(workoutRecordMapper.insert(any(WorkoutRecord.class))).thenReturn(1);

        WorkoutRecord result = workoutRecordService.saveWorkoutRecord(1L, record);

        assertEquals("2026-05-28", sdfDate.format(result.getWorkoutDate()),
                "00:00:01的startTime应正确提取为同一天的workoutDate");
    }
}
