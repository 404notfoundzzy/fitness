package com.zzy.fitnessserver.common;

import com.alibaba.fastjson2.JSON;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.Serializable;

/**
 * 统一响应结果封装类（支持 B/S 端 HTTP 响应、C/S 端普通结果返回）
 * 状态码规范：200=成功，4xx=客户端错误，5xx=服务端错误（对齐 HTTP 状态码）
 *
 * @author 张师傅
 * @version 1.0
 * @since 2023/3/31
 */
@NoArgsConstructor
@AllArgsConstructor
@Data
@Accessors(chain = true)
@Builder(toBuilder = true) // 开启 Builder 链式修改（支持结果二次调整）
public class CommonResult<T> implements Serializable {
    private static final long serialVersionUID = 1L; // 序列化版本号（避免反序列化异常）

    /**
     * 执行结果标识：true=成功，false=失败
     */
    private boolean flag;
    /**
     * 状态码：200=成功，400=参数错误，401=未授权，403=无权限，500=服务异常
     */
    private Integer code;
    /**
     * 提示信息：前端页面/接口调用者的友好提示
     */
    private String message;
    /**
     * 响应数据：成功时返回业务数据，失败时可返回错误详情（如参数错误字段、异常上下文）
     */
    private T data;

    // ========================== 1. 静态工厂方法 ==========================

    public static <T> CommonResult<T> success() {
        // 默认提示“操作成功”，状态码200，复用已有逻辑减少重复
        return success(null, "操作成功");
    }

    /**
     * 成功结果（仅传入业务数据，默认提示“操作成功”）
     * 场景：快速返回带数据的成功结果，无需自定义提示（如列表查询、详情查询接口）
     *
     * @param data 业务数据（如列表、详情）
     * @return CommonResult<T>
     */
    public static <T> CommonResult<T> success(T data) {
        // 默认提示“操作成功”，状态码200，复用已有逻辑减少重复
        return success(data, "操作成功");
    }

    /**
     * 成功结果（无数据，仅返回提示）
     *
     * @param message 成功提示
     * @return CommonResult<T>
     */
    public static <T> CommonResult<T> success(String message) {
        return CommonResult.<T>builder()
                .flag(true)
                .code(HttpServletResponse.SC_OK) // 200：对齐 HTTP 成功状态码
                .message(message)
                .data(null)
                .build();
    }

    /**
     * 成功结果（带业务数据）
     *
     * @param data    业务数据（如列表、详情）
     * @param message 成功提示
     * @return CommonResult<T>
     */
    public static <T> CommonResult<T> success(T data, String message) {
        return CommonResult.<T>builder()
                .flag(true)
                .code(HttpServletResponse.SC_OK)
                .message(message)
                .data(data)
                .build();
    }

    /**
     * 成功结果（带业务数据）
     *
     * @param code    状态码（如 200=成功，201=创建成功）
     * @param data    业务数据（如列表、详情）
     * @param message 成功提示
     * @return CommonResult<T>
     */
    public static <T> CommonResult<T> success(Integer code, T data, String message) {
        return CommonResult.<T>builder()
                .flag(true)
                .code(code)
                .message(message)
                .data(data)
                .build();
    }

    /**
     * 客户端错误（无数据，简化版）
     *
     * @return CommonResult<T>
     */
    public static <T> CommonResult<T> error() {
        return error(ResultCode.INTERNAL_SERVER_ERROR.getMessage(), null); // 复用带数据方法，减少重复代码
    }

    /**
     * 客户端错误（无数据，简化版）
     *
     * @param message 错误提示
     * @return CommonResult<T>
     */
    public static <T> CommonResult<T> error(String message) {
        return error(message, null); // 复用带数据方法，减少重复代码
    }

    /**
     * 客户端错误（带错误详情数据，如参数校验错误字段）
     * 场景：参数格式错误、必填项缺失时，返回具体错误字段和原因
     *
     * @param message   错误提示（如 "参数校验失败"）
     * @param errorData 错误详情（建议用 Map<String, String> 存储 "字段名-错误原因"）
     * @return CommonResult<T>
     */
    public static <T> CommonResult<T> error(String message, T errorData) {
        return CommonResult.<T>builder()
                .flag(false)
                .code(HttpServletResponse.SC_BAD_REQUEST) // 400：HTTP 客户端错误码
                .message(message)
                .data(errorData) // 存储错误详情（如 { "username": "用户名已存在", "password": "密码长度不能小于6位" }）
                .build();
    }

    /**
     * 客户端错误（带错误详情数据，如参数校验错误字段）
     * 场景：参数格式错误、必填项缺失时，返回具体错误字段和原因
     *
     * @param code      状态码（如 400=参数错误，500=服务异常）
     * @param message   错误提示（如 "参数校验失败"）
     * @param errorData 错误详情（建议用 Map<String, String> 存储 "字段名-错误原因"）
     * @return CommonResult<T>
     */
    public static <T> CommonResult<T> error(Integer code, String message, T errorData) {
        return CommonResult.<T>builder()
                .flag(false)
                .code(code) // 使用传入的状态码
                .message(message)
                .data(errorData) // 存储错误详情（如 { "username": "用户名已存在", "password": "密码长度不能小于6位" }）
                .build();
    }

    /**
     * 未授权错误（带错误详情数据，如登录过期原因）
     * 场景：登录令牌过期、令牌无效时，返回令牌失效原因或刷新令牌地址
     *
     * @param message   错误提示（如 "登录已过期"）
     * @param errorData 错误详情（如 { "expired": true, "refreshUrl": "/api/auth/refresh"
     *                  }）
     * @return CommonResult<T>
     */
    public static <T> CommonResult<T> unAuthErrorWithData(String message, T errorData) {
        return CommonResult.<T>builder()
                .flag(false)
                .code(HttpServletResponse.SC_UNAUTHORIZED) // 401：HTTP 未授权码
                .message(message)
                .data(errorData)
                .build();
    }

    /**
     * 无权限错误（带错误详情数据，如权限缺失列表）
     * 场景：用户无操作权限时，返回缺失的具体权限标识
     *
     * @param message   错误提示（如 "无权限执行此操作"）
     * @param errorData 错误详情（如 { "requiredPermissions": ["user:delete", "user:edit"]
     *                  }）
     * @return CommonResult<T>
     */
    public static <T> CommonResult<T> forbiddenErrorWithData(String message, T errorData) {
        return CommonResult.<T>builder()
                .flag(false)
                .code(HttpServletResponse.SC_FORBIDDEN) // 403：HTTP 无权限码
                .message(message)
                .data(errorData)
                .build();
    }

    /**
     * 服务端异常（带错误详情数据，如异常追踪ID）
     * 场景：服务端出错时，返回异常追踪ID（便于后端排查日志），不暴露具体异常信息
     *
     * @param message   友好提示（如 "服务繁忙，请稍后重试"）
     * @param errorData 错误详情（如 { "traceId": "8f9a7b6c-1d2e-3f4g-5h6i-7j8k9l0m1n2o"
     *                  }）
     * @return CommonResult<T>
     */
    public static <T> CommonResult<T> serverErrorWithData(String message, T errorData) {
        return CommonResult.<T>builder()
                .flag(false)
                .code(HttpServletResponse.SC_INTERNAL_SERVER_ERROR) // 500：HTTP 服务异常码
                .message(message)
                .data(errorData)
                .build();
    }

    /**
     * 未授权错误（无数据，简化版）
     *
     * @param message 错误提示
     * @return CommonResult<T>
     */
    public static <T> CommonResult<T> unAuthError(String message) {
        return unAuthErrorWithData(message, null);
    }

    /**
     * 无权限错误（无数据，简化版）
     *
     * @param message 错误提示
     * @return CommonResult<T>
     */
    public static <T> CommonResult<T> forbiddenError(String message) {
        return forbiddenErrorWithData(message, null);
    }

    /**
     * 服务端异常（无数据，简化版）
     *
     * @param message 错误提示
     * @return CommonResult<T>
     */
    public static <T> CommonResult<T> serverError(String message) {
        return serverErrorWithData(message, null);
    }

    /**
     * 自定义结果（灵活配置所有参数）
     *
     * @param flag    执行结果
     * @param code    状态码
     * @param message 提示信息
     * @param data    业务数据/错误详情
     * @return CommonResult<T>
     */
    public static <T> CommonResult<T> custom(boolean flag, Integer code, String message, T data) {
        return CommonResult.<T>builder()
                .flag(flag)
                .code(code)
                .message(message)
                .data(data)
                .build();
    }

    // ========================== 2. HTTP 响应工具方法（保持原有优化） ==========================

    /**
     * 直接向 HttpServletResponse 写入 JSON 响应（支持带错误数据的结果）
     *
     * @param result   统一响应结果（含成功/错误数据）
     * @param response HTTP 响应对象
     * @throws IOException 流写入异常
     */
    public static <T> void writeResponse(CommonResult<T> result, HttpServletResponse response) throws IOException {
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(result.getCode());

        // try-with-resources 自动关闭流，避免资源泄漏
        try (PrintWriter writer = response.getWriter()) {
            writer.write(JSON.toJSONString(result));
            writer.flush();
        }
    }

    /**
     * 重载：快速写入带错误数据的响应（无需先创建 CommonResult 对象）
     *
     * @param code      状态码
     * @param message   错误提示
     * @param errorData 错误详情数据
     * @param response  HTTP 响应对象
     * @throws IOException 流写入异常
     */
    public static <T> void writeErrorResponseWithData(Integer code, String message, T errorData,
            HttpServletResponse response) throws IOException {
        CommonResult<T> errorResult = CommonResult.<T>builder()
                .flag(false)
                .code(code)
                .message(message)
                .data(errorData)
                .build();
        writeResponse(errorResult, response);
    }

    /**
     * 重载：快速写入无数据的错误响应（兼容原有使用习惯）
     *
     * @param code     状态码
     * @param message  错误提示
     * @param response HTTP 响应对象
     * @throws IOException 流写入异常
     */
    public static <T> void writeErrorResponse(Integer code, String message, HttpServletResponse response)
            throws IOException {
        writeErrorResponseWithData(code, message, null, response);
    }
}