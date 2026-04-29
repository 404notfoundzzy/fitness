package com.zzy.fitnessserver.config;

import com.zzy.fitnessserver.interceptor.LoginInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

/**
 * Web 配置类
 */
@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final LoginInterceptor loginInterceptor;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    // ！！！新增：全局跨域配置
    @Override
    public void addCorsMappings(org.springframework.web.servlet.config.annotation.CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 注册拦截器并排除白名单路径
        registry.addInterceptor(loginInterceptor)
                .addPathPatterns("/api/**") // 拦截所有以 /api 开头的请求
                .excludePathPatterns(
                        "/api/users/login", // 登录放行
                        "/api/users/register", // 注册放行
                        "/api/dict/**", // 字典放行 (包括类型和数据)
                        "/api/dashboard", // 如果仪表盘也需要放行的话可以添加
                        "/api/exercises/**" // 练习知识库也可能需要放行（用户查看）
                );
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String absoluteUploadPath = new File(uploadDir).getAbsolutePath().replace("\\", "/");
        if (!absoluteUploadPath.endsWith("/")) {
            absoluteUploadPath = absoluteUploadPath + "/";
        }
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + absoluteUploadPath);
    }
}
