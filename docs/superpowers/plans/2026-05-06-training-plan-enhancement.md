# 训练计划增强功能实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 实现训练计划的完整生命周期管理 - 自定义计划栏目、用户激活计划、训练进度追踪、差异化卡片交互

**架构：**
- 数据库层：新建2张表 + 改造1张现有表 + 添加plan_type字段 + 字典数据
- 后端API：Spring Boot RESTful接口，支持用户激活计划和训练记录管理
- 前端页面：uni-app Vue3组件，三栏布局 + 单页展开交互 + 进度同步

**技术栈：** MySQL 8.0 | Spring Boot 2.x | MyBatis-Plus | uni-app (Vue3) | Pinia状态管理

---

## 文件结构总览

### 新建文件：
```
fitness-server/
├── sql/
│   └── migrate_training_plan_v2.sql          # 数据库迁移脚本
├── src/main/java/com/zzy/fitnessserver/
│   ├── entity/
│   │   ├── UserActivePlan.java               # 用户激活计划实体
│   │   └── WorkoutExerciseDetail.java         # 动作执行详情实体
│   ├── mapper/
│   │   ├── UserActivePlanMapper.java
│   │   └── WorkoutExerciseDetailMapper.java
│   ├── service/
│   │   ├── UserActivePlanService.java
│   │   ├── impl/UserActivePlanServiceImpl.java
│   │   ├── WorkoutExerciseDetailService.java
│   │   └── impl/WorkoutExerciseDetailServiceImpl.java
│   └── controller/
│       └── UserActivePlanController.java      # 用户计划管理API

fitness-app/
├── components/
│   └── TrainingCardExpandable.vue            # 可展开的训练卡片组件（新建）
└── pages/knowledge/
    └── training-plan-list.vue                # 改造：添加自定义计划栏目
```

### 修改文件：
```
fitness-server/
├── entity/
│   └── TrainingPlan.java                     # 添加planType字段
│   └── WorkoutRecord.java                    # 添加4个新字段
├── mapper/
│   └── WorkoutRecordMapper.java              # 无需修改（MyBatis-Plus自动映射）

fitness-app/
├── components/
│   ├── TrainingCard.vue                      # 改造：支持单页展开交互
│   └── DayCard.vue                           # 优化：移除进度环显示
├── pages/knowledge/
│   └── training-plan-detail.vue              # 优化：卡片点击展开逻辑
└── stores/
    └── training.js                           # 添加用户激活计划状态管理
```

---

## 任务分解

### 任务 1：创建数据库迁移脚本

**文件：**
- 创建：`fitness-server/sql/migrate_training_plan_v2.sql`

- [ ] **步骤 1：编写完整的SQL迁移脚本**

```sql
-- ========================================
-- 训练计划模块 V2.0 升级脚本
-- 版本: v2.0.0
-- 创建时间: 2026-05-06
-- 说明: 用户激活计划、训练进度追踪、自定义计划管理
-- ========================================

-- =============================================
-- 1. 为 training_plan 表添加 plan_type 字段
-- =============================================
ALTER TABLE `training_plan` 
ADD COLUMN `plan_type` TINYINT(1) NOT NULL DEFAULT 0 
    COMMENT '计划类型(0用户创建 1系统预置)' 
AFTER `source`;

-- 迁移现有数据：根据 is_preset 字段设置 plan_type
UPDATE `training_plan` SET `plan_type` = 1 WHERE `is_preset` = 1;
UPDATE `training_plan` SET `plan_type` = 0 WHERE `is_preset` = 0 OR `is_preset` IS NULL;

-- =============================================
-- 2. 创建 user_active_plan 表（用户激活计划）
-- =============================================
DROP TABLE IF EXISTS `user_active_plan`;
CREATE TABLE `user_active_plan` (
    `id`                  BIGINT(20)   NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    `user_id`             BIGINT(20)   NOT NULL                     COMMENT '用户ID',
    `plan_id`             BIGINT(20)   NOT NULL                     COMMENT '关联的训练计划ID',
    `status`              VARCHAR(20)  NOT NULL DEFAULT 'active'    COMMENT '状态(active活跃/paused暂停/completed已完成)',
    `start_date`          DATE         NOT NULL                     COMMENT '计划开始日期',
    `end_date`            DATE         DEFAULT NULL                 COMMENT '预计/实际结束日期',
    `current_day`         INT(11)      DEFAULT 1                    COMMENT '当前进行到第几天',
    `total_progress`      DECIMAL(5,2) DEFAULT 0.00                 COMMENT '整体完成进度(0-100)',
    `completed_days`      JSON         DEFAULT NULL                 COMMENT '已完成的训练日(JSON数组)',
    `notes`               VARCHAR(500) DEFAULT NULL                 COMMENT '用户备注',
    `create_by`           VARCHAR(64)  DEFAULT ''                   COMMENT '创建者',
    `create_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP    COMMENT '创建时间',
    `update_by`           VARCHAR(64)  DEFAULT ''                   COMMENT '更新者',
    `update_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_active` (`user_id`, `status`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_plan_id` (`plan_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户激活计划表';

-- =============================================
-- 3. 创建 workout_exercise_detail 表（动作执行详情）
-- =============================================
DROP TABLE IF EXISTS `workout_exercise_detail`;
CREATE TABLE `workout_exercise_detail` (
    `id`                  BIGINT(20)   NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    `workout_record_id`   BIGINT(20)   NOT NULL                     COMMENT '关联的workout_record ID',
    `plan_exercise_id`    BIGINT(20)   DEFAULT NULL                 COMMENT '关联的计划动作ID(可为空)',
    `exercise_name`       VARCHAR(100) NOT NULL                     COMMENT '动作名称',
    `set_number`          INT(11)      NOT NULL                     COMMENT '第几组',
    `target_reps`         VARCHAR(20)  DEFAULT NULL                 COMMENT '目标次数',
    `actual_reps`         INT(11)      DEFAULT NULL                 COMMENT '实际完成次数',
    `weight_kg`           DECIMAL(6,2) DEFAULT NULL                 COMMENT '使用的重量(kg)',
    `is_completed`        TINYINT(1)   DEFAULT 0                    COMMENT '是否完成(0否 1是)',
    `rest_seconds`        INT(11)      DEFAULT 60                   COMMENT '休息时间(秒)',
    `notes`               VARCHAR(300) DEFAULT NULL                 COMMENT '备注/技巧提示',
    `sort_order`          INT(11)      DEFAULT 0                    COMMENT '排序号',
    `create_by`           VARCHAR(64)  DEFAULT ''                   COMMENT '创建者',
    `create_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP    COMMENT '创建时间',
    `update_by`           VARCHAR(64)  DEFAULT ''                   COMMENT '更新者',
    `update_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_workout_record_id` (`workout_record_id`),
    INDEX `idx_plan_exercise_id` (`plan_exercise_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='训练动作执行详情表';

-- =============================================
-- 4. 改造 workout_record 表（添加新字段）
-- =============================================
ALTER TABLE `workout_record` 
ADD COLUMN `plan_id`             BIGINT(20)   DEFAULT NULL COMMENT '关联的训练计划ID' AFTER `status`,
ADD COLUMN `plan_day_id`         BIGINT(20)   DEFAULT NULL COMMENT '关联的训练日ID' AFTER `plan_id`,
ADD COLUMN `day_number`          INT(11)      DEFAULT NULL COMMENT '第几天(1-7)' AFTER `plan_day_id`,
ADD COLUMN `training_type`       VARCHAR(20)  DEFAULT 'free' COMMENT '训练类型(plan按计划/free自由训练)' AFTER `day_number`,
ADD INDEX `idx_plan_id` (`plan_id`),
ADD INDEX `idx_plan_day_id` (`plan_day_id`),
ADD INDEX `idx_training_type` (`training_type`);

-- =============================================
-- 5. 添加字典数据
-- =============================================

-- 5.1 训练计划类型字典
INSERT INTO `sys_dict_type` (`dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) 
VALUES 
('训练计划类型', 'training_plan_type', '0', 'admin', NOW(), 'admin', NOW(), '区分系统预置和用户自定义计划')
ON DUPLICATE KEY UPDATE `update_time` = NOW();

INSERT INTO `sys_dict_data` (`dict_sort`, `dict_label`, `dict_value`, `dict_type`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`) 
VALUES 
(1, '用户创建', '0', 'training_plan_type', 'Y', '0', 'admin', NOW(), 'admin', NOW()),
(2, '系统预置', '1', 'training_plan_type', 'N', '0', 'admin', NOW(), 'admin', NOW())
ON DUPLICATE KEY UPDATE `update_time` = NOW();

-- 5.2 激活计划状态字典
INSERT INTO `sys_dict_type` (`dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) 
VALUES 
('激活计划状态', 'active_plan_status', '0', 'admin', NOW(), 'admin', NOW(), '用户激活的计划状态')
ON DUPLICATE KEY UPDATE `update_time` = NOW();

INSERT INTO `sys_dict_data` (`dict_sort`, `dict_label`, `dict_value`, `dict_type`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`) 
VALUES 
(1, '活跃', 'active', 'active_plan_status', 'Y', '0', 'admin', NOW(), 'admin', NOW()),
(2, '暂停', 'paused', 'active_plan_status', 'N', '0', 'admin', NOW(), 'admin', NOW()),
(3, '已完成', 'completed', 'active_plan_status', 'N', '0', 'admin', NOW(), 'admin', NOW())
ON DUPLICATE KEY UPDATE `update_time` = NOW();

-- 5.3 训练类型字典
INSERT INTO `sys_dict_type` (`dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) 
VALUES 
('训练类型', 'workout_training_type', '0', 'admin', NOW(), 'admin', NOW(), '区分按计划训练和自由训练')
ON DUPLICATE KEY UPDATE `update_time` = NOW();

INSERT INTO `sys_dict_data` (`dict_sort`, `dict_label`, `dict_value`, `dict_type`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`) 
VALUES 
(1, '按计划训练', 'plan', 'workout_training_type', 'Y', '0', 'admin', NOW(), 'admin', NOW()),
(2, '自由训练', 'free', 'workout_training_type', 'N', '0', 'admin', NOW(), 'admin', NOW())
ON DUPLICATE KEY UPDATE `update_time` = NOW();

-- 5.4 训练记录状态字典
INSERT INTO `sys_dict_type` (`dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) 
VALUES 
('训练记录状态', 'workout_status', '0', 'admin', NOW(), 'admin', NOW(), '训练记录的状态')
ON DUPLICATE KEY UPDATE `update_time` = NOW();

INSERT INTO `sys_dict_data` (`dict_sort`, `dict_label`, `dict_value`, `dict_type`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`) 
VALUES 
(1, '进行中', 'in_progress', 'workout_status', 'Y', '0', 'admin', NOW(), 'admin', NOW()),
(2, '已完成', 'completed', 'workout_status', 'N', '0', 'admin', NOW(), 'admin', NOW()),
(3, '已跳过', 'skipped', 'workout_status', 'N', '0', 'admin', NOW(), 'admin', NOW())
ON DUPLICATE KEY UPDATE `update_time` = NOW();
```

- [ ] **步骤 2：验证SQL语法并测试执行**

运行：在MySQL客户端中执行此脚本
预期：所有表成功创建，字段添加成功，字典数据插入成功

- [ ] **步骤 3：Commit**

```bash
git add fitness-server/sql/migrate_training_plan_v2.sql
git commit -m "feat(db): 添加训练计划V2迁移脚本 - 用户激活计划+动作详情+字典数据"
```

---

### 任务 2：后端实体类开发

**文件：**
- 创建：`fitness-server/src/main/java/com/zzy/fitnessserver/entity/UserActivePlan.java`
- 创建：`fitness-server/src/main/java/com/zzy/fitnessserver/entity/WorkoutExerciseDetail.java`
- 修改：`fitness-server/src/main/java/com/zzy/fitnessserver/entity/TrainingPlan.java`
- 修改：`fitness-server/src/main/java/com/zzy/fitnessserver/entity/WorkoutRecord.java`

- [ ] **步骤 1：创建 UserActivePlan 实体类**

```java
package com.zzy.fitnessserver.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("user_active_plan")
public class UserActivePlan {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long userId;
    
    private Long planId;
    
    private String status; // active/paused/completed
    
    private LocalDate startDate;
    
    private LocalDate endDate;
    
    private Integer currentDay;
    
    private BigDecimal totalProgress;
    
    private String completedDays; // JSON格式存储
    
    private String notes;
    
    @TableField(fill = FieldFill.INSERT)
    private String createBy;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private String updateBy;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
```

- [ ] **步骤 2：创建 WorkoutExerciseDetail 实体类**

```java
package com.zzy.fitnessserver.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("workout_exercise_detail")
public class WorkoutExerciseDetail {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long workoutRecordId;
    
    private Long planExerciseId;
    
    private String exerciseName;
    
    private Integer setNumber;
    
    private String targetReps;
    
    private Integer actualReps;
    
    private BigDecimal weightKg;
    
    private Integer isCompleted; // 0或1
    
    private Integer restSeconds;
    
    private String notes;
    
    private Integer sortOrder;
    
    @TableField(fill = FieldFill.INSERT)
    private String createBy;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private String updateBy;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
```

- [ ] **步骤 3：修改 TrainingPlan 实体类 - 添加 planType 字段**

在 `TrainingPlan.java` 中添加：

```java
/**
 * 计划类型(0用户创建 1系统预置)
 */
private Integer planType;
```

- [ ] **步骤 4：修改 WorkoutRecord 实体类 - 添加4个新字段**

在 `WorkoutRecord.java` 中添加：

```java
/**
 * 关联的训练计划ID
 */
private Long planId;

/**
 * 关联的训练日ID
 */
private Long planDayId;

/**
 * 第几天(1-7)
 */
private Integer dayNumber;

/**
 * 训练类型(plan按计划/free自由训练)
 */
private String trainingType;
```

- [ ] **步骤 5：Commit**

```bash
git add fitness-server/src/main/java/com/zzy/fitnessserver/entity/
git commit -m "feat(entity): 添加用户激活计划和动作详情实体类"
```

---

### 任务 3：后端Mapper层开发

**文件：**
- 创建：`fitness-server/src/main/java/com/zzy/fitnessserver/mapper/UserActivePlanMapper.java`
- 创建：`fitness-server/src/main/java/com/zzy/fitnessserver/mapper/WorkoutExerciseDetailMapper.java`

- [ ] **步骤 1：创建 UserActivePlanMapper**

```java
package com.zzy.fitnessserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zzy.fitnessserver.entity.UserActivePlan;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface UserActivePlanMapper extends BaseMapper<UserActivePlan> {
    
    /**
     * 查询用户的活跃计划
     */
    @Select("SELECT * FROM user_active_plan WHERE user_id = #{userId} AND status = 'active'")
    UserActivePlan findActivePlanByUserId(Long userId);
    
    /**
     * 查询用户的所有计划历史
     */
    @Select("SELECT * FROM user_active_plan WHERE user_id = #{userId} ORDER BY create_time DESC")
    List<UserActivePlan> findAllByUserId(Long userId);
}
```

- [ ] **步骤 2：创建 WorkoutExerciseDetailMapper**

```java
package com.zzy.fitnessserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zzy.fitnessserver.entity.WorkoutExerciseDetail;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface WorkoutExerciseDetailMapper extends BaseMapper<WorkoutExerciseDetail> {
    
    /**
     * 根据训练记录ID查询所有动作详情
     */
    @Select("SELECT * FROM workout_exercise_detail WHERE workout_record_id = #{workoutRecordId} ORDER BY sort_order")
    List<WorkoutExerciseDetail> findByWorkoutRecordId(Long workoutRecordId);
}
```

- [ ] **步骤 3：Commit**

```bash
git add fitness-server/src/main/java/com/zzy/fitnessserver/mapper/
git commit -m "feat(mapper): 添加用户激活计划和动作详情Mapper"
```

---

### 任务 4：后端Service层开发

**文件：**
- 创建：`fitness-server/src/main/java/com/zzy/fitnessserver/service/UserActivePlanService.java`
- 创建：`fitness-server/src/main/java/com/zzy/fitnessserver/service/impl/UserActivePlanServiceImpl.java`
- 创建：`fitness-server/src/main/java/com/zzy/fitnessserver/service/WorkoutExerciseDetailService.java`
- 创建：`fitness-server/src/main/java/com/zzy/fitnessserver/service/impl/WorkoutExerciseDetailServiceImpl.java`

- [ ] **步骤 1：创建 UserActivePlanService 接口**

```java
package com.zzy.fitnessserver.service;

import com.zzy.fitnessserver.entity.UserActivePlan;

public interface UserActivePlanService {
    
    /**
     * 激活训练计划（单计划模式）
     */
    UserActivePlan activatePlan(Long userId, Long planId);
    
    /**
     * 获取用户的活跃计划
     */
    UserActivePlan getActivePlan(Long userId);
    
    /**
     * 暂停活跃计划
     */
    void pausePlan(Long userId);
    
    /**
     * 完成计划
     */
    void completePlan(Long userId);
    
    /**
     * 更新训练进度
     */
    void updateProgress(Long userId, Integer dayNumber);
    
    /**
     * 获取用户的所有计划历史
     */
    List<UserActivePlan> getPlanHistory(Long userId);
}
```

- [ ] **步骤 2：创建 UserActivePlanServiceImpl 实现类**

```java
package com.zzy.fitnessserver.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zzy.fitnessserver.common.BaseContext;
import com.zzy.fitnessserver.entity.UserActivePlan;
import com.zzy.fitnessserver.mapper.UserActivePlanMapper;
import com.zzy.fitnessserver.service.UserActivePlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserActivePlanServiceImpl implements UserActivePlanService {
    
    private final UserActivePlanMapper userActivePlanMapper;
    
    @Override
    @Transactional
    public UserActivePlan activatePlan(Long userId, Long planId) {
        // 1. 检查是否已有活跃计划
        UserActivePlan existingActive = userActivePlanMapper.findActivePlanByUserId(userId);
        
        if (existingActive != null) {
            // 暂停旧计划
            existingActive.setStatus("paused");
            userActivePlanMapper.updateById(existingActive);
        }
        
        // 2. 创建新的激活记录
        UserActivePlan activePlan = new UserActivePlan();
        activePlan.setUserId(userId);
        activePlan.setPlanId(planId);
        activePlan.setStatus("active");
        activePlan.setStartDate(LocalDate.now());
        activePlan.setCurrentDay(1);
        activePlan.setTotalProgress(new java.math.BigDecimal("0.00"));
        activePlan.setCreateBy(String.valueOf(userId));
        
        userActivePlanMapper.insert(activePlan);
        
        return activePlan;
    }
    
    @Override
    public UserActivePlan getActivePlan(Long userId) {
        return userActivePlanMapper.findActivePlanByUserId(userId);
    }
    
    @Override
    @Transactional
    public void pausePlan(Long userId) {
        UserActivePlan activePlan = userActivePlanMapper.findActivePlanByUserId(userId);
        if (activePlan != null) {
            activePlan.setStatus("paused");
            userActivePlanMapper.updateById(activePlan);
        }
    }
    
    @Override
    @Transactional
    public void completePlan(Long userId) {
        UserActivePlan activePlan = userActivePlanMapper.findActivePlanByUserId(userId);
        if (activePlan != null) {
            activePlan.setStatus("completed");
            activePlan.setTotalProgress(new java.math.BigDecimal("100.00"));
            activePlan.setEndDate(LocalDate.now());
            userActivePlanMapper.updateById(activePlan);
        }
    }
    
    @Override
    @Transactional
    public void updateProgress(Long userId, Integer dayNumber) {
        UserActivePlan activePlan = userActivePlanMapper.findActivePlanByUserId(userId);
        if (activePlan != null) {
            // TODO: 实现具体的进度计算逻辑
            activePlan.setCurrentDay(dayNumber);
            userActivePlanMapper.updateById(activePlan);
        }
    }
    
    @Override
    public List<UserActivePlan> getPlanHistory(Long userId) {
        return userActivePlanMapper.findAllByUserId(userId);
    }
}
```

- [ ] **步骤 3：创建 WorkoutExerciseDetailService 接口和实现类**

```java
// 接口
package com.zzy.fitnessserver.service;

import com.zzy.fitnessserver.entity.WorkoutExerciseDetail;
import java.util.List;

public interface WorkoutExerciseDetailService {
    
    void saveBatch(List<WorkoutExerciseDetail> details);
    
    List<WorkoutExerciseDetail> getByWorkoutRecordId(Long workoutRecordId);
}

// 实现类
package com.zzy.fitnessserver.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zzy.fitnessserver.entity.WorkoutExerciseDetail;
import com.zzy.fitnessserver.mapper.WorkoutExerciseDetailMapper;
import com.zzy.fitnessserver.service.WorkoutExerciseDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkoutExerciseDetailServiceImpl implements WorkoutExerciseDetailService {
    
    private final WorkoutExerciseDetailMapper workoutExerciseDetailMapper;
    
    @Override
    public void saveBatch(List<WorkoutExerciseDetail> details) {
        for (WorkoutExerciseDetail detail : details) {
            workoutExerciseDetailMapper.insert(detail);
        }
    }
    
    @Override
    public List<WorkoutExerciseDetail> getByWorkoutRecordId(Long workoutRecordId) {
        return workoutExerciseDetailMapper.findByWorkoutRecordId(workoutRecordId);
    }
}
```

- [ ] **步骤 4：Commit**

```bash
git add fitness-server/src/main/java/com/zzy/fitnessserver/service/
git commit -m "feat(service): 实现用户激活计划和动作详情业务逻辑"
```

---

### 任务 5：后端Controller层开发

**文件：**
- 创建：`fitness-server/src/main/java/com/zzy/fitnessserver/controller/UserActivePlanController.java`

- [ ] **步骤 1：创建 UserActivePlanController**

```java
package com.zzy.fitnessserver.controller;

import com.zzy.fitnessserver.common.CommonResult;
import com.zzy.fitnessserver.common.ResultCode;
import com.zzy.fitnessserver.entity.UserActivePlan;
import com.zzy.fitnessserver.service.UserActivePlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user-active-plan")
@RequiredArgsConstructor
public class UserActivePlanController {
    
    private final UserActivePlanService userActivePlanService;
    
    /**
     * 激活训练计划
     */
    @PostMapping("/activate/{planId}")
    public CommonResult<UserActivePlan> activatePlan(@PathVariable Long planId) {
        Long userId = BaseContext.getCurrentId();
        UserActivePlan result = userActivePlanService.activatePlan(userId, planId);
        return CommonResult.success(result);
    }
    
    /**
     * 获取当前活跃计划
     */
    @GetMapping("/active")
    public CommonResult<UserActivePlan> getActivePlan() {
        Long userId = BaseContext.getCurrentId();
        UserActivePlan activePlan = userActivePlanService.getActivePlan(userId);
        return CommonResult.success(activePlan);
    }
    
    /**
     * 暂停当前计划
     */
    @PutMapping("/pause")
    public CommonResult<String> pausePlan() {
        Long userId = BaseContext.getCurrentId();
        userActivePlanService.pausePlan(userId);
        return CommonResult.success("计划已暂停");
    }
    
    /**
     * 完成当前计划
     */
    @PutMapping("/complete")
    public CommonResult<String> completePlan() {
        Long userId = BaseContext.getCurrentId();
        userActivePlanService.completePlan(userId);
        return CommonResult.success("计划已完成");
    }
    
    /**
     * 获取计划历史列表
     */
    @GetMapping("/history")
    public CommonResult<List<UserActivePlan>> getHistory() {
        Long userId = BaseContext.getCurrentId();
        List<UserActivePlan> history = userActivePlanService.getPlanHistory(userId);
        return CommonResult.success(history);
    }
    
    /**
     * 更新训练进度
     */
    @PutMapping("/progress")
    public CommonResult<String> updateProgress(@RequestBody Map<String, Integer> body) {
        Long userId = BaseContext.getCurrentId();
        Integer dayNumber = body.get("dayNumber");
        userActivePlanService.updateProgress(userId, dayNumber);
        return CommonResult.success("进度已更新");
    }
}
```

- [ ] **步骤 2：Commit**

```bash
git add fitness-server/src/main/java/com/zzy/fitnessserver/controller/UserActivePlanController.java
git commit -m "feat(controller): 添加用户激活计划管理API接口"
```

---

### 任务 6：前端页面改造 - 添加自定义训练计划栏目

**文件：**
- 修改：`fitness-app/pages/knowledge/training-plan-list.vue`

- [ ] **步骤 1：重构页面结构 - 三栏布局**

在 `<scroll-view>` 内部，调整section顺序为：

```vue
<!-- 第一栏：我的训练 -->
<view v-if="store" class="section store-section">
  <!-- 保持原有代码不变 -->
</view>

<!-- 第二栏：自定义训练计划（新增） -->
<view class="section custom-section">
  <view class="section-header">
    <view class="section-title-wrap">
      <view class="section-indicator indicator-custom"></view>
      <text class="section-title">自定义训练计划</text>
    </view>
    <text class="section-count">{{ customPlans.length }} 个计划</text>
  </view>

  <view class="plan-list">
    <!-- 创建新计划按钮 -->
    <view class="plan-card glass-card custom-add" @click="createCustomPlan">
      <view class="card-glow glow-add"></view>
      <view class="add-icon-circle">
        <uni-icons type="compose" size="28" color="#fff"></uni-icons>
      </view>
      <view class="card-content">
        <text class="plan-name">创建新的训练计划</text>
        <text class="plan-desc">设计属于你自己的专属训练方案</text>
        <view class="tag-row">
          <text class="tag primary-tag custom-type">自定义</text>
          <text class="tag diff-tag beginner">灵活配置</text>
        </view>
      </view>
      <view class="card-arrow">
        <uni-icons type="right" size="16" color="#CBD5E1"></uni-icons>
      </view>
    </view>

    <!-- 已有的自定义计划列表 -->
    <view
      v-for="(plan, index) in customPlans"
      :key="'custom-' + index"
      class="plan-card glass-card custom"
      @click="openPlanDetail(plan)"
    >
      <view class="card-glow glow-custom"></view>
      <view class="card-icon icon-custom">
        <uni-icons type="person" size="24" color="#fff"></uni-icons>
      </view>
      <view class="card-content">
        <text class="plan-name">{{ plan.name }}</text>
        <text class="plan-desc">{{ plan.description || "自定义训练计划" }}</text>
        <view class="tag-row">
          <text class="tag primary-tag custom-type">{{ getSplitTypeLabel(plan.type) }}</text>
          <text class="tag days-tag">{{ plan.daysPerWeek || 3 }}天/周</text>
        </view>
      </view>
      <view class="card-arrow">
        <uni-icons type="right" size="16" color="#CBD5E1"></uni-icons>
      </view>
    </view>
  </view>
</view>

<!-- 第三栏：系统推荐（保持原有位置） -->
<view class="section">
  <!-- 保持原有代码不变 -->
</view>
```

- [ ] **步骤 2：添加自定义栏目样式**

```css
/* 自定义训练计划栏目样式 */
.indicator-custom {
  background: linear-gradient(135deg, #FF8A3D, #FF6B1A) !important;
}

.custom-section .section-title {
  color: #FF8A3D !important;
}

.custom-add {
  border: 2rpx dashed rgba(255, 138, 61, 0.3);
  background: linear-gradient(135deg, rgba(255, 138, 61, 0.05), rgba(255, 107, 26, 0.02)) !important;
}

.glow-add {
  background: radial-gradient(circle at center, rgba(255, 138, 61, 0.15), transparent 70%);
}

.add-icon-circle {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF8A3D, #FF6B1A);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(255, 138, 61, 0.3);
}
```

- [ ] **步骤 3：添加 createCustomPlan 方法**

```javascript
methods: {
  createCustomPlan() {
    uni.navigateTo({
      url: '/pages/knowledge/training-plan-create'
    });
  },
  
  // ... 其他方法保持不变
}
```

- [ ] **步骤 4：Commit**

```bash
git add fitness-app/pages/knowledge/training-plan-list.vue
git commit -m "feat(ui): 添加自定义训练计划独立栏目"
```

---

### 任务 7：TrainingCard 组件优化 - 单页展开交互

**文件：**
- 修改：`fitness-app/components/TrainingCard.vue`

- [ ] **步骤 1：改造模板 - 添加展开功能**

```vue
<template>
  <view
    class="training-card fade-up expandable"
    :class="{ expanded: isExpanded }"
    :style="{ animationDelay: delay }"
    @click="toggleExpand"
  >
    <view class="card-left">
      <view class="icon-ring">
        <ProgressRing
          :progress="item.progress"
          :size="88"
          :stroke-width="5"
          :colors="[item.color || '#2F6BFF', shiftColor(item.color)]"
          :show-text="false"
        >
          <Icon
            :src="item.icon || '/static/icons/chest.svg'"
            :size="40"
            :color="item.color || '#2F6BFF'"
            :breathe="false"
          />
        </ProgressRing>
      </view>

      <view class="card-info">
        <text class="card-title">{{ item.title }}</text>
        <text class="card-desc">{{ item.desc }}</text>
      </view>
    </view>

    <view class="card-right">
      <text class="action-count">{{ item.count }}个动作</text>
      <view :class="['status-badge', statusClass]">
        <text class="status-text">{{ statusText }}</text>
      </view>
      <uni-icons
        :type="isExpanded ? 'up' : 'down'"
        size="14"
        color="#9AA3AF"
        class="expand-icon"
      ></uni-icons>
    </view>

    <!-- 展开的动作列表区域 -->
    <view v-if="isExpanded && item.exercises && item.exercises.length > 0" class="expanded-content">
      <view class="exercise-list-expanded">
        <view
          v-for="(exercise, idx) in item.exercises"
          :key="idx"
          class="exercise-item-expanded"
          :style="{ animationDelay: idx * 0.06 + 's' }"
        >
          <view class="exercise-index-badge" :style="{ background: item.color || '#2F6BFF' }">
            {{ idx + 1 }}
          </view>
          
          <view class="exercise-detail-info">
            <text class="exercise-name-text">{{ exercise.name }}</text>
            <text class="exercise-specs-text">
              {{ exercise.sets }}组 × {{ exercise.reps }}
              <template v-if="exercise.restSeconds">| 休息{{ exercise.restSeconds }}秒</template>
            </text>
          </view>

          <view class="exercise-actions">
            <view class="action-btn start-btn" @click.stop="startTraining(exercise)">
              <uni-icons type="play-filled" size="14" color="#fff"></uni-icons>
              <text class="btn-text">开始</text>
            </view>
            
            <view 
              class="action-btn complete-btn" 
              :class="{ completed: exercise.isCompleted }"
              @click.stop="markComplete(exercise)"
            >
              <uni-icons 
                :type="exercise.isCompleted ? 'checkmarkempty' : 'checkbox'" 
                size="14" 
                :color="exercise.isCompleted ? '#fff' : '#10B981'"
              ></uni-icons>
              <text class="btn-text">{{ exercise.isCompleted ? '已完成' : '标记' }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <view class="tips-section-expand">
        <uni-icons type="info" size="14" color="#f59e0b"></uni-icons>
        <text class="tip-text-expand">点击"开始"进入详细训练模式，或快速标记完成</text>
      </view>
    </view>
  </view>
</template>
```

- [ ] **步骤 2：添加展开逻辑和数据方法**

```javascript
data() {
  return {
    isExpanded: false
  };
},

methods: {
  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    
    if (this.isExpanded && (!this.item.exercises || this.item.exercises.length === 0)) {
      this.loadExercises();
    }
  },
  
  async loadExercises() {
    try {
      const res = await uni.request({
        url: `${this.$baseUrl}/api/training-plan/${this.item.id}/exercises`,
        method: 'GET'
      });
      
      if (res.data.code === 200) {
        this.item.exercises = res.data.data.map(ex => ({
          ...ex,
          isCompleted: false
        }));
      }
    } catch (error) {
      console.error('加载动作列表失败:', error);
    }
  },
  
  startTraining(exercise) {
    // 跳转到详细训练页面或弹出训练模态框
    this.$emit('start-training', { 
      planId: this.item.id, 
      exercise 
    });
  },
  
  markComplete(exercise) {
    exercise.isCompleted = !exercise.isCompleted;
    
    this.$emit('mark-complete', {
      planId: this.item.id,
      exerciseId: exercise.id,
      isCompleted: exercise.isCompleted
    });
  }
}
```

- [ ] **步骤 3：添加展开样式**

```css
.training-card.expandable {
  cursor: pointer;
  transition: all 0.3s ease;
}

.training-card.expanded {
  flex-direction: column;
  align-items: stretch;
}

.expand-icon {
  margin-left: 12rpx;
}

.expanded-content {
  margin-top: 28rpx;
  padding-top: 28rpx;
  border-top: 2rpx solid rgba(47, 107, 255, 0.1);
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.exercise-list-expanded {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.exercise-item-expanded {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 16rpx;
  gap: 20rpx;
  transition: all 0.2s ease;
}

.exercise-item-expanded:active {
  background: rgba(47, 107, 255, 0.05);
  transform: scale(0.98);
}

.exercise-index-badge {
  width: 56rpx;
  height: 56rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 26rpx;
  font-weight: 600;
  flex-shrink: 0;
}

.exercise-detail-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.exercise-name-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #1F2937;
}

.exercise-specs-text {
  font-size: 24rpx;
  color: #6B7280;
}

.exercise-actions {
  display: flex;
  gap: 16rpx;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 14rpx 24rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
  transition: all 0.2s ease;
}

.start-btn {
  background: linear-gradient(135deg, #2F6BFF, #1E4FD9);
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(47, 107, 255, 0.3);
}

.start-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 6rpx rgba(47, 107, 255, 0.2);
}

.complete-btn {
  background: rgba(16, 185, 129, 0.1);
  border: 2rpx solid rgba(16, 185, 129, 0.3);
  color: #10B981;
}

.complete-btn.completed {
  background: #10B981;
  color: #fff;
  border-color: #10B981;
}

.btn-text {
  font-size: 24rpx;
  font-weight: 500;
}

.tips-section-expand {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 24rpx;
  padding: 18rpx 20rpx;
  background: rgba(245, 158, 11, 0.05);
  border-radius: 12rpx;
  border-left: 4rpx solid #f59e0b;
}

.tip-text-expand {
  font-size: 24rpx;
  color: #92400e;
  line-height: 1.4;
}
```

- [ ] **步骤 4：Commit**

```bash
git add fitness-app/components/TrainingCard.vue
git commit -m "feat(component): TrainingCard支持单页展开交互和动作操作按钮"
```

---

### 任务 8：DayCard 组件优化 - 移除进度环

**文件：**
- 修改：`fitness-app/components/DayCard.vue`

- [ ] **步骤 1：移除 ProgressRing 相关代码**

从模板中删除：

```vue
<!-- 删除这部分 -->
<view class="progress-wrap">
  <ProgressRing
    :progress="progress"
    :size="progress >= 100 ? 36 : 40"
    :stroke-width="progress >= 100 ? 3 : 4"
    :colors="[colorStart, colorEnd]"
    :show-text="!progress >= 100 ? true : false"
    :text-size="11"
    :label-size="8"
    text-color="#2F6BFF"
    :animated="true"
    :duration="800"
  />
  <view v-if="progress >= 100" class="completed-overlay">
    <text class="completed-check">&#10003;</text>
  </view>
</view>
```

- [ ] **步骤 2：简化 props - 移除 progress 相关属性**

```javascript
props: {
  // 移除以下属性:
  // progress: { type: Number, default: 0 },
  // colorStart: { type: String, default: '#2F6BFF' },
  // colorEnd: { type: String, default: '#8A5CFF' },
  
  // 保留其他属性不变
  dayNumber: { type: Number, required: true },
  dayName: { type: String, default: "" },
  focus: { type: String, default: "" },
  exercises: { type: Array, default: () => [] },
  // ...
}
```

- [ ] **步骤 3：移除相关 CSS 样式**

删除 `.progress-wrap`, `.completed-overlay`, `.completed-check` 等样式

- [ ] **步骤 4：Commit**

```bash
git add fitness-app/components/DayCard.vue
git commit -m "refactor(component): DayCard移除进度环，简化为纯展示组件"
```

---

### 任务 9：Pinia Store 扩展 - 用户激活计划状态管理

**文件：**
- 修改：`fitness-app/stores/training.js`

- [ ] **步骤 1：添加用户激活计划相关的 state 和 actions**

```javascript
// 在现有的 training store 中添加:

state: () => ({
  // ... 现有 state
  
  // 新增：用户激活计划
  activePlan: null,           // 当前激活的计划对象
  isLoadingActivePlan: false, // 加载状态
  planHistory: [],            // 计划历史列表
}),

getters: {
  // 新增 getters
  
  hasActivePlan(state) {
    return state.activePlan !== null && state.activePlan.status === 'active';
  },
  
  activePlanProgress(state) {
    return state.activePlan?.totalProgress || 0;
  },
  
  currentDay(state) {
    return state.activePlan?.currentDay || 1;
  }
},

actions: {
  // 新增 actions
  
  async fetchActivePlan() {
    this.isLoadingActivePlan = true;
    try {
      const res = await uni.request({
        url: `${baseUrl}/api/user-active-plan/active`,
        method: 'GET'
      });
      
      if (res.data.code === 200) {
        this.activePlan = res.data.data;
      } else {
        this.activePlan = null;
      }
    } catch (error) {
      console.error('获取活跃计划失败:', error);
      this.activePlan = null;
    } finally {
      this.isLoadingActivePlan = false;
    }
  },
  
  async activatePlan(planId) {
    try {
      const res = await uni.request({
        url: `${baseUrl}/api/user-active-plan/activate/${planId}`,
        method: 'POST'
      });
      
      if (res.data.code === 200) {
        this.activePlan = res.data.data;
        uni.showToast({
          title: '计划已激活',
          icon: 'success'
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('激活计划失败:', error);
      return false;
    }
  },
  
  async pauseCurrentPlan() {
    try {
      const res = await uni.request({
        url: `${baseUrl}/api/user-active-plan/pause`,
        method: 'PUT'
      });
      
      if (res.data.code === 200) {
        await this.fetchActivePlan(); // 刷新状态
        uni.showToast({ title: '计划已暂停', icon: 'success' });
        return true;
      }
      return false;
    } catch (error) {
      console.error('暂停计划失败:', error);
      return false;
    }
  },
  
  async markExerciseComplete({ planId, exerciseId, isCompleted }) {
    try {
      // 调用 API 更新训练记录
      const res = await uni.request({
        url: `${baseUrl}/api/workout-record/exercise-status`,
        method: 'PUT',
        data: { planId, exerciseId, isCompleted }
      });
      
      if (res.data.code === 200) {
        // 刷新当前计划进度
        await this.fetchActivePlan();
        return true;
      }
      return false;
    } catch (error) {
      console.error('标记完成失败:', error);
      return false;
    }
  }
}
```

- [ ] **步骤 2：Commit**

```bash
git add fitness-app/stores/training.js
git commit -m "feat(store): 添加用户激活计划状态管理"
```

---

### 任务 10：集成测试与联调

**文件：**
- 测试所有新增和修改的文件

- [ ] **步骤 1：后端单元测试**

运行 Spring Boot 应用，测试以下API：
- POST `/api/user-active-plan/activate/{planId}` - 激活计划
- GET `/api/user-active-plan/active` - 获取活跃计划
- PUT `/api/user-active-plan/pause` - 暂停计划
- GET `/api/user-active-plan/history` - 历史记录

验证点：
- 同一用户只能有1个活跃计划
- 激活新计划时自动暂停旧计划
- 数据正确写入数据库

- [ ] **步骤 2：前端功能测试**

启动 uni-app 开发服务器，测试：
1. 训练计划列表页是否正确显示三个栏目
2. 点击"我的训练"中的卡片是否能展开动作列表
3. 展开后是否显示"开始训练"和"标记完成"按钮
4. 点击按钮是否能正确触发事件
5. DayCard 是否不再显示进度环

- [ ] **步骤 3：端到端流程测试**

完整流程：
1. 用户浏览"系统推荐" → 选择一个计划
2. 点击"开始此计划" → 调用激活API
3. 返回列表页 → "我的训练"栏目出现该计划
4. 点击计划卡片 → 展开显示今日动作
5. 点击某个动作的"标记完成" → 状态变更
6. 进入"训练记录"页 → 能看到刚才的记录

- [ ] **步骤 4：最终 Commit**

```bash
git add .
git commit -m "feat(training-plan-v2): 完整实现训练计划增强功能 - 自定义栏目+激活计划+进度追踪+展开交互"
```

---

## 验收标准

### 功能完整性：
- ✅ 页面显示三个独立栏目：我的训练 / 自定义训练计划 / 系统推荐
- ✅ 用户可以激活/暂停/完成训练计划
- ✅ 同一时间只能有1个活跃计划
- ✅ TrainingCard 支持单页展开显示动作列表
- ✅ 每个动作可"开始训练"或"标记完成"
- ✅ DayCard 不再显示进度环（差异化设计）
- ✅ 所有训练数据持久化到数据库
- ✅ 训练记录可在历史记录中查询

### 技术规范：
- ✅ 所有新建表包含 create_by/update_by 字段
- ✅ 使用 plan_type 字段区分系统预置和用户创建
- ✅ 字典数据完整且规范
- ✅ API遵循RESTful设计原则
- ✅ 前端组件符合Vue3 Composition API规范
- ✅ 状态管理使用Pinia

### 性能要求：
- ✅ 展开/折叠动画流畅（< 300ms）
- ✅ API响应时间 < 500ms
- ✅ 列表滚动无卡顿

---

## 风险点和注意事项

1. **数据库迁移**：确保在生产环境执行前备份数据
2. **唯一约束**：`uk_user_active` 约束保证单计划模式，需处理并发场景
3. **JSON字段**：`completed_days` 使用MySQL JSON类型，需注意版本兼容性
4. **前端兼容性**：展开动画需在不同设备上测试流畅度
5. **数据一致性**：训练完成后需同时更新多个表（workout_record + user_active_plan），建议使用事务

---

**预计工作量：** 5个主要模块，约15个子任务
**建议执行顺序：** 任务1→2→3→4→5→6→7→8→9→10
