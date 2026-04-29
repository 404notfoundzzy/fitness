package com.zzy.fitnessserver.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zzy.fitnessserver.common.BaseContext;
import com.zzy.fitnessserver.common.CommonResult;
import com.zzy.fitnessserver.entity.User;
import com.zzy.fitnessserver.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 用户管理控制器
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {
    private final UserService userService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    /**
     * 注册用户
     */
    @PostMapping("/register")
    public CommonResult<Boolean> register(@RequestBody User user) {
        // 检查账号名是否已存在
        if (userService.getByUsername(user.getUsername()).isPresent()) {
            return CommonResult.error("账号名已存在");
        }
        // 检查手机号是否已被注册
        if (user.getPhone() != null
                && userService.getOne(new LambdaQueryWrapper<User>().eq(User::getPhone, user.getPhone())) != null) {
            return CommonResult.error("手机号已被注册");
        }
        // 设置默认值
        user.setStatus("0");
        user.setDelFlag("0");
        return CommonResult.success(userService.save(user));
    }

    /**
     * 登录用户
     */
    @PostMapping("/login")
    public CommonResult<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        String loginKey = credentials.get("username"); // 可能是用户名也可能是手机号
        String password = credentials.get("password");

        // 优先按用户名查，查不到再按手机号查
        User user = userService.getByUsername(loginKey)
                .orElseGet(() -> userService.getOne(new LambdaQueryWrapper<User>().eq(User::getPhone, loginKey)));

        if (user == null) {
            return CommonResult.error("用户不存在");
        }

        if ("1".equals(user.getStatus())) {
            return CommonResult.error("账号已被停用");
        }

        if (!user.getPassword().equals(password)) {
            return CommonResult.error("密码错误");
        }

        // 更新最后登录时间
        user.setLastLoginTime(new java.util.Date());
        userService.updateById(user);

        Map<String, Object> result = new HashMap<>();
        result.put("token", "mock-jwt-token-" + user.getId());
        result.put("user", user);
        return CommonResult.success(result);
    }

    /**
     * 退出登录
     */
    @PostMapping("/logout")
    public CommonResult<Boolean> logout() {
        return CommonResult.success(true);
    }

    /**
     * 修改用户信息
     */
    @PutMapping("/profile")
    public CommonResult<Boolean> updateProfile(@RequestBody User user) {
        user.setId(BaseContext.getCurrentId());
        return CommonResult.success(userService.updateById(user));
    }

    /**
     * 上传用户头像，并将相对访问路径保存到数据库
     */
    @PostMapping("/avatar")
    public CommonResult<String> uploadAvatar(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return CommonResult.error("请先选择头像图片");
        }

        if (file.getContentType() == null || !file.getContentType().startsWith("image/")) {
            return CommonResult.error("仅支持上传图片文件");
        }

        String originalFilename = file.getOriginalFilename();
        String suffix = getFileSuffix(originalFilename);
        String monthFolder = new SimpleDateFormat("yyyyMM").format(new Date());
        String fileName = UUID.randomUUID().toString().replace("-", "") + suffix;

        try {
            Path avatarDir = Paths.get(uploadDir, "avatar", monthFolder).toAbsolutePath().normalize();
            Files.createDirectories(avatarDir);

            Path targetFile = avatarDir.resolve(fileName);
            file.transferTo(targetFile.toFile());

            String avatarPath = "/uploads/avatar/" + monthFolder + "/" + fileName;
            User user = new User();
            user.setId(BaseContext.getCurrentId());
            user.setAvatar(avatarPath);
            userService.updateById(user);

            return CommonResult.success(avatarPath);
        } catch (IOException e) {
            return CommonResult.error("头像上传失败，请稍后重试");
        }
    }

    /**
     * 根据ID获取用户信息
     */
    @GetMapping("/{id}")
    public CommonResult<User> getById(@PathVariable Long id) {
        return CommonResult.success(userService.getById(id));
    }

    /**
     * 获取当前登录用户的个人资料
     */
    @GetMapping("/profile")
    public CommonResult<User> getProfile() {
        return CommonResult.success(userService.getById(BaseContext.getCurrentId()));
    }

    private String getFileSuffix(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return ".png";
        }
        return fileName.substring(fileName.lastIndexOf("."));
    }
}
