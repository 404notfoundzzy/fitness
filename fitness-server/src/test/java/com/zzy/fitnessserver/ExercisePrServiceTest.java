package com.zzy.fitnessserver;

import com.zzy.fitnessserver.entity.ExercisePr;
import com.zzy.fitnessserver.entity.WorkoutExerciseDetail;
import com.zzy.fitnessserver.mapper.ExercisePrMapper;
import com.zzy.fitnessserver.mapper.WorkoutExerciseDetailMapper;
import com.zzy.fitnessserver.service.impl.ExercisePrServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ExercisePrService - Epley 1RM 与 PR 检测（与前端 onerm.ts 对齐）")
class ExercisePrServiceTest {

    @Mock
    private ExercisePrMapper exercisePrMapper;

    @Mock
    private WorkoutExerciseDetailMapper workoutExerciseDetailMapper;

    @InjectMocks
    private ExercisePrServiceImpl service;

    @BeforeEach
    void setUp() throws Exception {
        Field baseMapperField = com.baomidou.mybatisplus.extension.service.impl.ServiceImpl.class
                .getDeclaredField("baseMapper");
        baseMapperField.setAccessible(true);
        baseMapperField.set(service, exercisePrMapper);
    }

    // ── estimateEpley1RM：与前端 estimate1RM(epley) 逐位一致 ─────────────────

    @Test
    @DisplayName("100kg×5 → 116.7（Epley，round1 到 0.1）")
    void testEpley_100x5() {
        assertEquals(116.7, service.estimateEpley1RM(100.0, 5), 1e-9);
    }

    @Test
    @DisplayName("100kg×8 → 126.7")
    void testEpley_100x8() {
        assertEquals(126.7, service.estimateEpley1RM(100.0, 8), 1e-9);
    }

    @Test
    @DisplayName("单次为测量而非估计：100kg×1 → 100")
    void testEpley_singleRep() {
        assertEquals(100.0, service.estimateEpley1RM(100.0, 1), 1e-9);
    }

    @Test
    @DisplayName("REP_CAP=12：12 次可估，13 次拒绝")
    void testEpley_repCap() {
        assertEquals(140.0, service.estimateEpley1RM(100.0, 12), 1e-9);
        assertNull(service.estimateEpley1RM(100.0, 13));
    }

    @Test
    @DisplayName("非正重量/次数/缺失 → null")
    void testEpley_invalid() {
        assertNull(service.estimateEpley1RM(0.0, 5));
        assertNull(service.estimateEpley1RM(100.0, 0));
        assertNull(service.estimateEpley1RM(-5.0, 5));
        assertNull(service.estimateEpley1RM(null, 5));
        assertNull(service.estimateEpley1RM(100.0, null));
    }

    // ── detectAndSave ───────────────────────────────────────────────────────

    private WorkoutExerciseDetail set(Long id, Long exerciseId, double weight, int reps) {
        return WorkoutExerciseDetail.builder()
                .id(id)
                .exerciseId(exerciseId)
                .exerciseName("杠铃卧推")
                .weightKg(BigDecimal.valueOf(weight))
                .actualReps(reps)
                .setNumber(1)
                .build();
    }

    @Test
    @DisplayName("首次训练：三类纪录全部写入（1rm/max_reps/max_volume）")
    void testDetect_firstTime() {
        Long userId = 1L;
        Long recordId = 10L;
        Long exerciseId = 100L;
        List<WorkoutExerciseDetail> details = Arrays.asList(
                set(1L, exerciseId, 100, 5),   // e1RM 116.7，容量 500
                set(2L, exerciseId, 90, 8));   // e1RM 114.0，容量 720，次数 8

        when(exercisePrMapper.findBest(eq(userId), eq(exerciseId), anyString())).thenReturn(null);
        when(exercisePrMapper.insert(any(ExercisePr.class))).thenReturn(1);

        List<ExercisePr> prs = service.detectAndSave(userId, recordId, details);

        assertEquals(3, prs.size());
        verify(exercisePrMapper, times(3)).insert(any(ExercisePr.class));
        // 破纪录的两组都应标记 is_pr
        verify(workoutExerciseDetailMapper, times(3)).updateById(any(WorkoutExerciseDetail.class));
    }

    @Test
    @DisplayName("未破纪录：不写入")
    void testDetect_noBreak() {
        Long userId = 1L;
        Long exerciseId = 100L;
        List<WorkoutExerciseDetail> details = Collections.singletonList(set(1L, exerciseId, 100, 5));

        // 历史最佳均不低于本次
        when(exercisePrMapper.findBest(eq(userId), eq(exerciseId), eq("1rm")))
                .thenReturn(ExercisePr.builder().value(BigDecimal.valueOf(120)).build());
        when(exercisePrMapper.findBest(eq(userId), eq(exerciseId), eq("max_reps")))
                .thenReturn(ExercisePr.builder().value(BigDecimal.valueOf(5)).build());
        when(exercisePrMapper.findBest(eq(userId), eq(exerciseId), eq("max_volume")))
                .thenReturn(ExercisePr.builder().value(BigDecimal.valueOf(500)).build());

        List<ExercisePr> prs = service.detectAndSave(userId, 10L, details);

        assertTrue(prs.isEmpty());
        verify(exercisePrMapper, never()).insert(any(ExercisePr.class));
        verify(workoutExerciseDetailMapper, never()).updateById(any(WorkoutExerciseDetail.class));
    }

    @Test
    @DisplayName("部分破纪录：仅 1rm 超过历史最佳时只写 1rm")
    void testDetect_partial() {
        Long userId = 1L;
        Long exerciseId = 100L;
        List<WorkoutExerciseDetail> details = Collections.singletonList(set(1L, exerciseId, 100, 5));

        when(exercisePrMapper.findBest(eq(userId), eq(exerciseId), eq("1rm")))
                .thenReturn(ExercisePr.builder().value(BigDecimal.valueOf(110)).build()); // 116.7 > 110 → 破
        when(exercisePrMapper.findBest(eq(userId), eq(exerciseId), eq("max_reps")))
                .thenReturn(ExercisePr.builder().value(BigDecimal.valueOf(5)).build());   // 5 >= 5 → 不破
        when(exercisePrMapper.findBest(eq(userId), eq(exerciseId), eq("max_volume")))
                .thenReturn(ExercisePr.builder().value(BigDecimal.valueOf(600)).build()); // 500 < 600 → 不破
        when(exercisePrMapper.insert(any(ExercisePr.class))).thenReturn(1);

        List<ExercisePr> prs = service.detectAndSave(userId, 10L, details);

        assertEquals(1, prs.size());
        assertEquals("1rm", prs.get(0).getType());
    }

    @Test
    @DisplayName("无 exerciseId 或无负重的组不参与 PR 检测")
    void testDetect_skip() {
        List<WorkoutExerciseDetail> details = Arrays.asList(
                set(1L, null, 100, 5),      // 无动作关联
                set(2L, 100L, 0, 10));      // 无负重（如自重动作）
        assertTrue(service.detectAndSave(1L, 10L, details).isEmpty());
    }
}
