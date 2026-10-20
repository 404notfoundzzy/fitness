package com.zzy.fitnessserver.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zzy.fitnessserver.entity.DailyStats;
import com.zzy.fitnessserver.entity.User;
import com.zzy.fitnessserver.entity.WorkoutRecord;
import com.zzy.fitnessserver.mapper.DailyStatsMapper;
import com.zzy.fitnessserver.mapper.UserMapper;
import com.zzy.fitnessserver.mapper.WorkoutRecordMapper;
import com.zzy.fitnessserver.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.sql.Date;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {
    private final WorkoutRecordMapper workoutRecordMapper;
    private final DailyStatsMapper dailyStatsMapper;

    @Override
    public Optional<User> getByUsername(String username) {
        return Optional.ofNullable(this.getOne(new LambdaQueryWrapper<User>().eq(User::getUsername, username)));
    }

    @Override
    public void recalculateStats(Long userId) {
        User user = this.getById(userId);
        if (user == null) {
            return;
        }

        List<WorkoutRecord> allWorkouts = workoutRecordMapper.selectList(new LambdaQueryWrapper<WorkoutRecord>()
                .eq(WorkoutRecord::getUserId, userId)
                .and(w -> w.eq(WorkoutRecord::getStatus, "已完成")
                        .or().isNull(WorkoutRecord::getStatus)));

        user.setTotalWorkouts(allWorkouts.size());

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        Map<String, Integer> durationByDate = allWorkouts.stream()
                .filter(w -> w.getStartTime() != null)
                .collect(Collectors.groupingBy(
                        w -> sdf.format(w.getStartTime()),
                        Collectors.summingInt(w -> w.getDurationMinutes() != null ? w.getDurationMinutes() : 0)));

        List<DailyStats> existingStatsList = dailyStatsMapper.selectList(new LambdaQueryWrapper<DailyStats>()
                .eq(DailyStats::getUserId, userId));
        Map<String, DailyStats> existingStatsMap = existingStatsList.stream()
                .collect(Collectors.toMap(
                        s -> s.getDate() != null ? sdf.format(s.getDate()) : "",
                        s -> s,
                        (a, b) -> a));

        for (Map.Entry<String, Integer> entry : durationByDate.entrySet()) {
            try {
                java.util.Date parsedUtilDate = sdf.parse(entry.getKey());
                Date workoutDate = new Date(parsedUtilDate.getTime());
                int duration = entry.getValue();

                DailyStats stats = existingStatsMap.get(entry.getKey());

                if (stats == null) {
                    stats = DailyStats.builder()
                            .userId(userId)
                            .date(workoutDate)
                            .steps(0)
                            .build();
                }

                stats.setActivityDurationMinutes(duration);

                int steps = stats.getSteps() != null ? stats.getSteps() : 0;
                int caloriesFromWorkout = duration * 8;
                int caloriesFromSteps = (int) (steps * 0.04);
                stats.setCaloriesBurned(caloriesFromWorkout + caloriesFromSteps);

                if (stats.getId() == null) {
                    dailyStatsMapper.insert(stats);
                    existingStatsMap.put(entry.getKey(), stats);
                } else {
                    dailyStatsMapper.updateById(stats);
                }
            } catch (Exception e) {
                log.error("recalculateStats error for date={}: {}", entry.getKey(), e.getMessage());
            }
        }

        double totalEnergy = existingStatsList.stream()
                .mapToDouble(DailyStats::getCaloriesBurned)
                .sum();
        user.setTotalEnergy(totalEnergy);

        user.setTotalMedals((int) (totalEnergy / 500));

        user.setStreakDays(calculateStreakDays(userId, allWorkouts, existingStatsList));

        this.updateById(user);
    }

    private int calculateStreakDays(Long userId, List<WorkoutRecord> workouts, List<DailyStats> statsList) {
        Set<String> activeDateStrings = new HashSet<>();
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");

        activeDateStrings.addAll(statsList.stream()
                .filter(s -> s.getCaloriesBurned() != null && s.getCaloriesBurned() > 0)
                .map(s -> s.getDate() != null ? sdf.format(s.getDate()) : null)
                .filter(d -> d != null)
                .collect(Collectors.toSet()));

        activeDateStrings.addAll(workouts.stream()
                .filter(w -> w.getStartTime() != null)
                .map(w -> sdf.format(w.getStartTime()))
                .collect(Collectors.toSet()));

        if (activeDateStrings.isEmpty()) {
            return 0;
        }

        int streak = 0;
        Calendar cal = Calendar.getInstance();
        normalizeToStartOfDay(cal);

        String todayStr = sdf.format(cal.getTime());
        if (!activeDateStrings.contains(todayStr)) {
            cal.add(Calendar.DAY_OF_MONTH, -1);
        }

        while (activeDateStrings.contains(sdf.format(cal.getTime()))) {
            streak++;
            cal.add(Calendar.DAY_OF_MONTH, -1);
        }

        return streak;
    }

    private void normalizeToStartOfDay(Calendar cal) {
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
    }
}
