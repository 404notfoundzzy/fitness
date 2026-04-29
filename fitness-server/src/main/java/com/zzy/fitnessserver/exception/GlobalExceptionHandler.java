package com.zzy.fitnessserver.exception;

import com.zzy.fitnessserver.common.CommonResult;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

/**
 * 全局异常处理器
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 处理文件上传大小超过限制的异常
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public CommonResult<String> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException e) {
        return CommonResult.error("上传的图片太大啦，请上传10MB以内的图片");
    }

    /**
     * 处理其他未知的运行时异常
     */
    @ExceptionHandler(Exception.class)
    public CommonResult<String> handleException(Exception e) {
        e.printStackTrace();
        return CommonResult.error("服务器开小差了，请稍后再试");
    }
}
