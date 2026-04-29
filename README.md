# 健身小助手

一款全栈健身记录应用，帮助用户记录运动、体重、饮食、饮水等健康数据，提供训练计划管理和热量计算功能。

## 项目简介

健身小助手是一款基于 uni-app 和 Spring Boot 开发的跨平台健身记录应用，支持 iOS、Android、H5 等多个平台。应用提供了完整的健身数据记录和管理功能，包括运动记录、体重追踪、身高记录、饮食管理、饮水提醒等，同时支持训练计划管理和热量计算功能。

## 技术栈

### 前端
- **框架**: uni-app (Vue 3)
- **UI 组件**: uni-ui
- **图表库**: uCharts
- **构建工具**: Vite

### 后端
- **框架**: Spring Boot 2.3.12
- **ORM**: MyBatis Plus 3.5.7
- **数据库**: MySQL 8.0
- **连接池**: Druid 1.2.23
- **JSON 处理**: Fastjson2 2.0.53

## 功能特性

### 用户管理
- 用户注册与登录
- 个人信息管理
- 头像上传

### 数据记录
- **运动记录**: 记录每次运动的类型、时长、强度等
- **体重记录**: 追踪体重变化，支持晨重/晚重分类
- **身高记录**: 记录身高数据
- **饮食记录**: 记录每日饮食摄入
- **饮水记录**: 追踪每日饮水量

### 数据统计
- 每日数据汇总统计
- 历史数据趋势分析
- 数据可视化图表展示

### 训练计划
- 训练计划创建与编辑
- 训练计划详情查看
- 训练计划列表管理

### 知识模块
- 热量计算器
- 健身知识库
- 营养指南

## 项目结构

```
fitness/
├── fitness-app/          # 前端应用
│   ├── pages/           # 页面
│   │   ├── index/       # 首页
│   │   ├── login/       # 登录页
│   │   ├── record/      # 记录模块
│   │   ├── knowledge/   # 知识模块
│   │   └── profile/     # 个人中心
│   ├── components/      # 公共组件
│   ├── App.vue          # 应用入口
│   ├── main.js          # 主入口文件
│   ├── manifest.json    # 应用配置
│   └── pages.json       # 页面配置
├── fitness-server/      # 后端服务
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/zzy/fitnessserver/
│   │       │       ├── common/       # 公共模块
│   │       │       ├── config/       # 配置类
│   │       │       ├── controller/   # 控制器
│   │       │       ├── dto/          # 数据传输对象
│   │       │       ├── entity/       # 实体类
│   │       │       ├── exception/    # 异常处理
│   │       │       ├── interceptor/  # 拦截器
│   │       │       ├── mapper/       # 数据访问层
│   │       │       └── service/      # 业务逻辑层
│   │       └── resources/
│   │           ├── application.properties  # 应用配置
│   │           └── sql/                   # 数据库脚本
│   └── pom.xml          # Maven 配置
└── README.md            # 项目文档
```

## 快速开始

### 环境要求

- Node.js >= 14
- Java >= 8
- MySQL >= 8.0
- Maven >= 3.6

### 后端启动

1. 配置数据库连接

编辑 `fitness-server/src/main/resources/application.properties` 文件：

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/fitness?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
spring.datasource.username=root
spring.datasource.password=your_password
```

2. 初始化数据库

执行 `fitness-server/src/main/resources/sql/` 目录下的 SQL 脚本：

```bash
mysql -u root -p < fitness.sql
mysql -u root -p < health_data_v2.sql
```

3. 启动后端服务

```bash
cd fitness-server
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动。

### 前端启动

1. 安装依赖

```bash
cd fitness-app
npm install
```

2. 启动开发服务器

```bash
npm run dev
```

3. 构建生产版本

```bash
npm run build
```

## API 接口

### 用户接口

- `POST /api/user/login` - 用户登录
- `POST /api/user/register` - 用户注册
- `GET /api/user/info` - 获取用户信息
- `PUT /api/user/update` - 更新用户信息
- `POST /api/user/upload-avatar` - 上传头像

### 运动记录接口

- `POST /api/workout/add` - 添加运动记录
- `GET /api/workout/list` - 获取运动记录列表
- `PUT /api/workout/update` - 更新运动记录
- `DELETE /api/workout/delete` - 删除运动记录

### 体重记录接口

- `POST /api/weight/add` - 添加体重记录
- `GET /api/weight/list` - 获取体重记录列表
- `PUT /api/weight/update` - 更新体重记录
- `DELETE /api/weight/delete` - 删除体重记录

### 其他接口

更多接口信息请参考后端代码中的 Controller 类。

## 数据库设计

### 主要数据表

- `user` - 用户表
- `workout_record` - 运动记录表
- `weight_record` - 体重记录表
- `height_record` - 身高记录表
- `diet_record` - 饮食记录表
- `water_record` - 饮水记录表
- `exercise` - 运动项目表
- `training_plan` - 训练计划表
- `training_plan_day` - 训练计划日程表
- `training_plan_exercise` - 训练计划运动表
- `daily_stats` - 每日统计表
- `sys_dict_type` - 系统字典类型表
- `sys_dict_data` - 系统字典数据表

## 开发规范

### 代码提交规范

遵循 Conventional Commits 规范：

- `feat` - 新功能
- `fix` - 修复 Bug
- `docs` - 文档更新
- `style` - 代码格式调整
- `refactor` - 代码重构
- `perf` - 性能优化
- `test` - 测试相关
- `chore` - 构建/工具变更

示例：

```
feat(backend): 添加用户登录接口

- 实现用户名密码登录
- 添加 JWT Token 生成
- 实现登录状态验证
```

### 代码风格

- 前端遵循 Vue 3 官方风格指南
- 后端遵循阿里巴巴 Java 开发手册
- 使用 ESLint 和 Prettier 进行代码格式化
- 使用 Checkstyle 进行代码检查

## 常见问题

### 1. 数据库连接失败

检查数据库配置是否正确，确保 MySQL 服务已启动。

### 2. 前端页面空白

检查 API 接口地址是否正确，确保后端服务已启动。

### 3. 图片上传失败

检查上传目录权限，确保 `uploads/avatar` 目录存在且有写入权限。

## 贡献指南

欢迎提交 Issue 和 Pull Request。在提交代码前，请确保：

1. 代码符合项目规范
2. 通过所有测试
3. 更新相关文档
4. 提交信息清晰明确

## 许可证

MIT License

## 联系方式

- 项目地址: https://github.com/404notfoundzzy/fitness
- 问题反馈: https://github.com/404notfoundzzy/fitness/issues

## 更新日志

### v1.0.2 (2026-04-29)
- 完成后端基础架构搭建
- 实现用户管理功能
- 实现运动、体重、身高、饮食、饮水记录功能
- 实现训练计划管理功能
- 实现数据统计功能
- 完成前端页面开发
- 完成前后端联调

### v1.0.1 (2026-04-20)
- 项目初始化
- 完成需求分析
- 完成系统设计

### v1.0.0 (2026-04-15)
- 项目启动
- 技术选型
- 架构设计
