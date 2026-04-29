package com.zzy.fitnessserver.common;

import com.baomidou.mybatisplus.annotation.EnumValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 统一响应状态码枚举
 * 规范：遵循 HTTP 状态码语义，扩展业务自定义状态码（1000+）
 * 分类：2xx=成功，4xx=客户端错误，5xx=服务端错误，1000+=业务自定义错误
 *
 * @author 张师傅
 * @version 1.0
 * @since 2023/4/24
 */
@Getter
@AllArgsConstructor // 仅保留全参构造（枚举无需无参构造，避免非法实例化）
public enum ResultCode {

    // ========================== 1. 成功状态码（2xx） ==========================
    SUCCESS(200, "请求成功"),
    SUCCESS_NO_CONTENT(204, "请求成功，无返回内容"),
    SUCCESS_PARTIAL_CONTENT(206, "部分请求成功（如分片下载）"),

    // ========================== 2. 客户端错误（4xx） ==========================
    BAD_REQUEST(400, "请求参数错误"),
    UNAUTHORIZED(401, "未登录或登录已过期，请重新登录"),
    FORBIDDEN(403, "无权限执行此操作"),
    NOT_FOUND(404, "请求资源不存在"),
    METHOD_NOT_SUPPORTED(405, "当前请求方式不支持（如GET/POST不匹配）"),
    MEDIA_TYPE_NOT_ACCEPTABLE(415, "服务器无法处理请求的媒体格式（如仅支持JSON）"),

    // ========================== 3. 服务端错误（5xx） ==========================
    INTERNAL_SERVER_ERROR(500, "程序员跑路了~"),
    //    INTERNAL_SERVER_ERROR(500, "服务器异常，请稍后再试");
    SERVICE_UNAVAILABLE(503, "服务暂时不可用（如维护中）"),

    // ========================== 4. 业务自定义错误（1000+） ==========================
    PARAM_INVALID(1000, "参数无效（如格式错误、必填项缺失）"),
    PARAM_MISSING(1001, "缺少必填参数（如username、password）"),
    DATA_EXIST(1002, "数据已存在（如用户名、手机号已注册）"),
    DATA_NOT_EXIST(1003, "目标数据不存在（如用户、订单不存在）"),
    FTP_CONNECT_ERROR(1004, "FTP服务器连接失败（请检查地址/端口）"),
    FILE_UPLOAD_ERROR(1005, "文件上传失败（如大小超限、格式不支持）"),
    FILE_DOWNLOAD_ERROR(1006, "文件下载失败（如文件不存在、权限不足）");


    /**
     * 状态码值（MyBatis-Plus 枚举映射标识）
     */
    @EnumValue
    private final Integer code;

    /**
     * 状态码描述（前端/日志友好提示）
     */
    private final String message;


//            200 OK：请求已成功，并且服务器已返回请求的资源。
//            204 No Content：请求已成功处理，但没有内容返回。
//            206 Partial Content：服务器已经执行了部分GET请求。
//            301 Moved Permanently：请求的资源已被永久移动到新的URL。
//            302 Found：请求的资源临时移动到新的URL。
//            304 Not Modified：自上次请求后，请求的资源未修改过。
//            400 Bad Request：服务器无法处理请求，因为客户端的请求语法错误。
//            401 Unauthorized：请求需要用户验证。
//            403 Forbidden：服务器拒绝请求。
//            404 Not Found：服务器无法找到请求的资源。
//            500 Internal Server Error：服务器遇到了意料之外的情况，导致它无法完成请求。
//            503 Service Unavailable：服务器暂时无法处理请求，可能是因为超载或停机维护。


    // ========================== 工具方法：增强枚举实用性 ==========================

    /**
     * 根据状态码获取枚举实例（用于异常处理、日志解析）
     *
     * @param code 状态码
     * @return 对应的 ResultCode 枚举，无匹配时返回 INTERNAL_SERVER_ERROR
     */
    public static ResultCode getByCode(Integer code) {
        if (code == null) {
            return INTERNAL_SERVER_ERROR;
        }
        // 遍历枚举，匹配状态码
        for (ResultCode resultCode : values()) {
            if (resultCode.getCode().equals(code)) {
                return resultCode;
            }
        }
        // 无匹配时，默认返回服务端异常
        return INTERNAL_SERVER_ERROR;
    }

    /**
     * 判断当前状态码是否为成功状态（2xx 开头）
     *
     * @return true=成功，false=失败
     */
    public boolean isSuccess() {
        return this.code >= 200 && this.code < 300;
    }

    /**
     * 判断当前状态码是否为客户端错误（4xx 开头）
     *
     * @return true=客户端错误，false=其他
     */
    public boolean isClientError() {
        return this.code >= 400 && this.code < 500;
    }

    /**
     * 判断当前状态码是否为服务端错误（5xx 开头）
     *
     * @return true=服务端错误，false=其他
     */
    public boolean isServerError() {
        return this.code >= 500 && this.code < 600;
    }
}
