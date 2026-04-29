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
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 用户服务类实现
 */
@Service
@RequiredArgsConstructor
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

        // 1. 累计训练次数
        Long totalWorkouts = workoutRecordMapper.selectCount(new LambdaQueryWrapper<WorkoutRecord>()
                .eq(WorkoutRecord::getUserId, userId)
                .eq(WorkoutRecord::getStatus, "已完成"));
        user.setTotalWorkouts(totalWorkouts.intValue());

        // 2. 重新计算当天的运动时长、卡路里并更新 daily_stats
        // 找出用户今天所有已完成的运动记录
        LocalDate today = LocalDate.now();
        List<WorkoutRecord> todayWorkouts = workoutRecordMapper.selectList(new LambdaQueryWrapper<WorkoutRecord>()
                .eq(WorkoutRecord::getUserId, userId)
                .eq(WorkoutRecord::getStatus, "已完成")
                .ge(WorkoutRecord::getStartTime, today.atStartOfDay())
                .le(WorkoutRecord::getStartTime, today.atTime(23, 59, 59)));

        // 基础计算公式：
        // 1. 总时长 = 所有训练记录时长之和
        int todayDuration = todayWorkouts.stream()
                .mapToInt(w -> w.getDurationMinutes() != null ? w.getDurationMinutes() : 0)
                .sum();

        // 2. 总消耗(大卡) = 运动时长(分钟) * 运动强度系数(假设平均 8 kcal/min) + 步数消耗(假设每步 0.04 kcal)
        // 查找或初始化今日 stats
        DailyStats todayStats = dailyStatsMapper.selectOne(new LambdaQueryWrapper<DailyStats>()
                .eq(DailyStats::getUserId, userId)
                .eq(DailyStats::getDate, today));

        if (todayStats == null) {
            todayStats = DailyStats.builder()
                    .userId(userId)
                    .date(today)
                    .steps(0)
                    .build();
        }

        todayStats.setActivityDurationMinutes(todayDuration);

        // 计算当天卡路里 (训练消耗 + 步数消耗)
        int steps = todayStats.getSteps() != null ? todayStats.getSteps() : 0;
        int caloriesFromWorkout = todayDuration * 8; // 平均中等强度 8 kcal/min
        int caloriesFromSteps = (int) (steps * 0.04); // 平均步幅 0.04 kcal/步
        todayStats.setCaloriesBurned(caloriesFromWorkout + caloriesFromSteps);

        if (todayStats.getId() == null) {
            dailyStatsMapper.insert(todayStats);
        } else {
            dailyStatsMapper.updateById(todayStats);
        }

        // 3. 累计总消耗能量
        List<DailyStats> allStats = dailyStatsMapper.selectList(new LambdaQueryWrapper<DailyStats>()
                .eq(DailyStats::getUserId, userId));
        double totalEnergy = allStats.stream()
                .mapToDouble(DailyStats::getCaloriesBurned)
                .sum();
        user.setTotalEnergy(totalEnergy);

        // 4. 累计勋章数 (每 500 大卡奖励 1 个勋章)
        user.setTotalMedals((int) (totalEnergy / 500));

        // 5. 计算连续健身天数 (Streak Days)
        user.setStreakDays(calculateStreakDays(userId));

        this.updateById(user);
    }

    /**
     * 计算连续健身天数
     */
    private int calculateStreakDays(Long userId) {
        // 获取所有有活动的日期（包含训练记录或每日统计中有消耗的日期）
        Set<LocalDate> activeDates = new HashSet<>();

        // 从每日统计中获取有消耗的日期
        List<DailyStats> stats = dailyStatsMapper.selectList(new LambdaQueryWrapper<DailyStats>()
                .eq(DailyStats::getUserId, userId)
                .gt(DailyStats::getCaloriesBurned, 0));
        activeDates.addAll(stats.stream().map(DailyStats::getDate).collect(Collectors.toSet()));

        // 从训练记录中获取已完成的训练日期
        List<WorkoutRecord> workouts = workoutRecordMapper.selectList(new LambdaQueryWrapper<WorkoutRecord>()
                .eq(WorkoutRecord::getUserId, userId)
                .eq(WorkoutRecord::getStatus, "已完成"));
        activeDates.addAll(workouts.stream()
                .filter(w -> w.getStartTime() != null)
                .map(w -> w.getStartTime().toInstant().atZone(ZoneId.systemDefault()).toLocalDate())
                .collect(Collectors.toSet()));

        if (activeDates.isEmpty()) {
            return 0;
        }

        int streak = 0;
        LocalDate checkDate = LocalDate.now();

        // 如果今天没活动，从昨天开始算（允许断一天或者必须今天也有活动？）
        // 通常健身 App 如果今天还没打卡，会显示昨天的 streak，如果今天打了就加 1。
        // 如果昨天也没打，streak 就断了。
        if (!activeDates.contains(checkDate)) {
            checkDate = checkDate.minusDays(1);
        }

        while (activeDates.contains(checkDate)) {
            streak++;
            checkDate = checkDate.minusDays(1);
        }

        return streak;
    }
}
