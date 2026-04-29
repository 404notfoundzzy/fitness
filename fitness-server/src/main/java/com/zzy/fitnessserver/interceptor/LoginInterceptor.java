package com.zzy.fitnessserver.interceptor;

import com.zzy.fitnessserver.common.BaseContext;
import com.zzy.fitnessserver.common.CommonResult;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * 登录校验拦截器
 */
@Component
public class LoginInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        // ！！！新增：如果是 OPTIONS 请求，直接放行，不进行登录拦截
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        // 1. 获取请求头中的 Token
        String token = request.getHeader("Authorization");

        // 2. 校验 Token 是否存在且符合 Mock 格式 (mock-jwt-token-id)
        if (token != null && token.startsWith("mock-jwt-token-")) {
            try {
                // 3. 提取用户 ID 并存入 ThreadLocal
                String idStr = token.substring("mock-jwt-token-".length());
                Long userId = Long.valueOf(idStr);
                BaseContext.setCurrentId(userId);
                return true;
            } catch (NumberFormatException e) {
                // Token 格式错误
            }
        }

        // 4. 未登录或 Token 无效，返回 401 状态码
        CommonResult.writeErrorResponse(HttpServletResponse.SC_UNAUTHORIZED, "未登录，请先登录", response);
        return false;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex)
            throws Exception {
        // 请求结束后移除用户 ID，防止内存泄漏
        BaseContext.removeCurrentId();
    }
}
