package com.zzy.fitnessserver.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zzy.fitnessserver.entity.ExercisePr;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ExercisePrMapper extends BaseMapper<ExercisePr> {

    /**
     * 查询用户 PR 列表（可按动作过滤），按类型与值降序
     */
    @Select("<script>" +
            "SELECT * FROM exercise_pr WHERE user_id = #{userId} " +
            "<if test='exerciseId != null'> AND exercise_id = #{exerciseId}</if> " +
            "ORDER BY exercise_id, type, value DESC" +
            "</script>")
    List<ExercisePr> findByUser(@Param("userId") Long userId, @Param("exerciseId") Long exerciseId);

    /**
     * 查询用户某动作某类型的历史最佳值（用于打破纪录判定）
     */
    @Select("SELECT * FROM exercise_pr WHERE user_id = #{userId} AND exercise_id = #{exerciseId} AND type = #{type} " +
            "ORDER BY value DESC LIMIT 1")
    ExercisePr findBest(@Param("userId") Long userId, @Param("exerciseId") Long exerciseId, @Param("type") String type);
}
