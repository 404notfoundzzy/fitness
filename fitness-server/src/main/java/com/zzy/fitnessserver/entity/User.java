package com.zzy.fitnessserver.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * 用户实体类
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("user")
public class User {
    /**
     * 用户ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 登录账号
     */
    private String username;

    /**
     * 密码
     */
    private String password;

    /**
     * 真实姓名
     */
    private String realname;

    /**
     * 用户昵称
     */
    private String nickname;

    /**
     * 手机号码
     */
    private String phone;

    /**
     * 性别
     */
    private String gender;

    /**
     * 年龄
     */
    private Integer age;

    /**
     * 健身目标
     */
    private String fitnessGoal;

    /**
     * 个人简介
     */
    private String bio;

    /**
     * 头像图标类名/URL
     */
    private String avatar;

    /**
     * 帐号状态（0正常 1停用）
     */
    private String status;

    /**
     * 会员状态
     */
    private String membershipStatus;

    /**
     * 连续健身天数
     */
    private Integer streakDays;

    /**
     * 累计锻炼次数
     */
    private Integer totalWorkouts;

    /**
     * 累计消耗能量 (千卡)
     */
    private Double totalEnergy;

    /**
     * 累计获得勋章数
     */
    private Integer totalMedals;

    /**
     * 最后登录时间
     */
    private Date lastLoginTime;

    /**
     * 密码修改时间
     */
    private Date passwordUpdateTime;

    /**
     * 删除标志（0代表存在 2代表删除）
     */
    @TableLogic
    private String delFlag;

    /**
     * 删除时间
     */
    private Date delTime;

    /**
     * 创建者
     */
    @TableField(fill = FieldFill.INSERT)
    private String createBy;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private Date createTime;

    /**
     * 更新者
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private String updateBy;

    /**
     * 更新时间
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Date updateTime;
}
