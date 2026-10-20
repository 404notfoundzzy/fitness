# ============================================================
# Cloudflare Tunnel 一键部署脚本 - 健身小助手项目
# 适用于 Windows PowerShell
# ============================================================
# 使用前请先阅读下方配置区，根据实际情况修改变量值
# ============================================================

# ==================== 配置区（必须修改） ====================

# 你的域名（已托管到 Cloudflare）
$DOMAIN = "your-domain.com"

# 子域名配置
$APP_SUBDOMAIN = "app"          # 前端访问地址: app.your-domain.com
$API_SUBDOMAIN = "api"          # 后端访问地址: api.your-domain.com

# 本地服务端口
$FRONTEND_PORT = 8080           # 前端 H5 开发服务器端口
$BACKEND_PORT = 8888            # 后端 Spring Boot 端口

# 隧道名称
$TUNNEL_NAME = "fitness-app"

# ==================== 配置区结束 ====================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   Cloudflare Tunnel 部署脚本 - 健身小助手" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  域名: $DOMAIN" -ForegroundColor Yellow
Write-Host "  前端: ${APP_SUBDOMAIN}.${DOMAIN} -> localhost:$FRONTEND_PORT" -ForegroundColor Yellow
Write-Host "  后端: ${API_SUBDOMAIN}.${DOMAIN} -> localhost:$BACKEND_PORT" -ForegroundColor Yellow
Write-Host ""

# ============================================================
# Step 1: 检查 cloudflared 是否已安装
# ============================================================
function Step1-CheckInstall {
    Write-Host "[Step 1] 检查 cloudflared 安装状态..." -ForegroundColor Green

    try {
        $version = cloudflared --version 2>&1
        Write-Host "  ✅ cloudflared 已安装: $version" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "  ❌ cloudflared 未安装" -ForegroundColor Red
        Write-Host ""
        Write-Host "  正在安装 cloudflared..." -ForegroundColor Yellow

        try {
            winget install Cloudflare.cloudflared --accept-source-agreements --accept-package-agreements
            Write-Host "  ✅ cloudflared 安装成功" -ForegroundColor Green

            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            return $true
        }
        catch {
            Write-Host "  ❌ winget 安装失败，尝试手动下载..." -ForegroundColor Red
            Write-Host ""
            Write-Host "  请手动执行以下命令安装:" -ForegroundColor Yellow
            Write-Host "  winget install Cloudflare.cloudflared" -ForegroundColor White
            Write-Host ""
            Write-Host "  或从 GitHub 下载:" -ForegroundColor Yellow
            Write-Host "  https://github.com/cloudflare/cloudflared/releases/latest" -ForegroundColor White
            return $false
        }
    }
}

# ============================================================
# Step 2: 登录 Cloudflare
# ============================================================
function Step2-Login {
    Write-Host ""
    Write-Host "[Step 2] 登录 Cloudflare 账号..." -ForegroundColor Green
    Write-Host "  将打开浏览器，请选择你的域名 $DOMAIN 进行授权" -ForegroundColor Yellow
    Write-Host ""

    cloudflared tunnel login

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ 登录成功" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "  ❌ 登录失败" -ForegroundColor Red
        return $false
    }
}

# ============================================================
# Step 3: 创建隧道
# ============================================================
function Step3-CreateTunnel {
    Write-Host ""
    Write-Host "[Step 3] 创建 Cloudflare Tunnel..." -ForegroundColor Green

    $tunnelList = cloudflared tunnel list 2>&1
    if ($tunnelList -match $TUNNEL_NAME) {
        Write-Host "  ⚠️ 隧道 '$TUNNEL_NAME' 已存在，跳过创建" -ForegroundColor Yellow
    }
    else {
        cloudflared tunnel create $TUNNEL_NAME
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ 隧道创建成功" -ForegroundColor Green
        }
        else {
            Write-Host "  ❌ 隧道创建失败" -ForegroundColor Red
            return $false
        }
    }

    $tunnelInfo = cloudflared tunnel list 2>&1
    $tunnelId = ""
    if ($tunnelInfo -match "([a-f0-9\-]{36})\s+$TUNNEL_NAME") {
        $tunnelId = $Matches[1]
        Write-Host "  隧道 ID: $tunnelId" -ForegroundColor Cyan
    }

    return $true
}

# ============================================================
# Step 4: 生成配置文件
# ============================================================
function Step4-GenerateConfig {
    Write-Host ""
    Write-Host "[Step 4] 生成配置文件..." -ForegroundColor Green

    $configDir = "$env:USERPROFILE\.cloudflared"
    if (-not (Test-Path $configDir)) {
        New-Item -ItemType Directory -Path $configDir -Force | Out-Null
        Write-Host "  创建配置目录: $configDir" -ForegroundColor Cyan
    }

    $tunnelInfo = cloudflared tunnel list 2>&1
    $tunnelId = ""
    if ($tunnelInfo -match "([a-f0-9\-]{36})\s+$TUNNEL_NAME") {
        $tunnelId = $Matches[1]
    }

    if ([string]::IsNullOrEmpty($tunnelId)) {
        Write-Host "  ❌ 无法获取隧道 ID，请确认隧道已创建" -ForegroundColor Red
        return $false
    }

    $credFile = "$configDir\$tunnelId.json"

    $configContent = @"
tunnel: $tunnelId
credentials-file: $credFile

ingress:
  - hostname: ${API_SUBDOMAIN}.$DOMAIN
    service: http://localhost:$BACKEND_PORT
  - hostname: ${APP_SUBDOMAIN}.$DOMAIN
    service: http://localhost:$FRONTEND_PORT
  - service: http_status:404
"@

    $configPath = "$configDir\config.yml"
    $configContent | Out-File -FilePath $configPath -Encoding UTF8 -Force
    Write-Host "  ✅ 配置文件已生成: $configPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "  配置内容:" -ForegroundColor Cyan
    Write-Host "  ----------------------------------------" -ForegroundColor DarkGray
    Write-Host "  API:  ${API_SUBDOMAIN}.$DOMAIN -> localhost:$BACKEND_PORT" -ForegroundColor White
    Write-Host "  APP:  ${APP_SUBDOMAIN}.$DOMAIN -> localhost:$FRONTEND_PORT" -ForegroundColor White
    Write-Host "  ----------------------------------------" -ForegroundColor DarkGray

    return $true
}

# ============================================================
# Step 5: 配置 DNS 路由
# ============================================================
function Step5-ConfigureDNS {
    Write-Host ""
    Write-Host "[Step 5] 配置 DNS 路由..." -ForegroundColor Green
    Write-Host "  将在 Cloudflare 添加 CNAME 记录指向隧道" -ForegroundColor Yellow
    Write-Host ""

    Write-Host "  配置 API 子域名..." -ForegroundColor Cyan
    cloudflared tunnel route dns $TUNNEL_NAME "${API_SUBDOMAIN}.$DOMAIN"

    Write-Host "  配置 APP 子域名..." -ForegroundColor Cyan
    cloudflared tunnel route dns $TUNNEL_NAME "${APP_SUBDOMAIN}.$DOMAIN"

    Write-Host ""
    Write-Host "  ✅ DNS 路由配置完成" -ForegroundColor Green
    Write-Host "  也可以在 Cloudflare Dashboard 手动添加 CNAME 记录:" -ForegroundColor Yellow
    Write-Host "  ${API_SUBDOMAIN} -> <隧道ID>.cfargotunnel.com (已代理)" -ForegroundColor White
    Write-Host "  ${APP_SUBDOMAIN} -> <隧道ID>.cfargotunnel.com (已代理)" -ForegroundColor White

    return $true
}

# ============================================================
# Step 6: 更新项目 API 配置
# ============================================================
function Step6-UpdateProjectConfig {
    Write-Host ""
    Write-Host "[Step 6] 更新项目 API 配置..." -ForegroundColor Green

    $requestJsPath = "d:\softWare\develop\app-myself\fitness\fitness-app\utils\request.js"

    if (Test-Path $requestJsPath) {
        Write-Host "  找到 request.js: $requestJsPath" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  ⚠️ 请手动修改以下内容:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  1. 打开 fitness-app\utils\request.js" -ForegroundColor White
        Write-Host "  2. 修改 ENV_CONFIG.production 为:" -ForegroundColor White
        Write-Host "     production: 'https://${API_SUBDOMAIN}.$DOMAIN/api'" -ForegroundColor Green
        Write-Host "  3. 修改 CURRENT_ENV 为:" -ForegroundColor White
        Write-Host "     const CURRENT_ENV = 'production'" -ForegroundColor Green
        Write-Host ""
        Write-Host "  ⚠️ 同时检查以下文件中的硬编码 URL:" -ForegroundColor Yellow
        Write-Host "  - stores/training.js (第1行 API_BASE)" -ForegroundColor White
        Write-Host "  - pages/knowledge/training-plan-detail.vue (第191行 API_BASE)" -ForegroundColor White
        Write-Host "  将 http://localhost:8888 替换为 https://${API_SUBDOMAIN}.$DOMAIN" -ForegroundColor Green
    }
    else {
        Write-Host "  ⚠️ 未找到 request.js，请手动修改 API 地址" -ForegroundColor Yellow
    }

    return $true
}

# ============================================================
# Step 7: 启动隧道
# ============================================================
function Step7-StartTunnel {
    Write-Host ""
    Write-Host "[Step 7] 启动 Cloudflare Tunnel..." -ForegroundColor Green
    Write-Host ""
    Write-Host "  正在启动隧道，按 Ctrl+C 可停止..." -ForegroundColor Yellow
    Write-Host ""

    cloudflared tunnel run $TUNNEL_NAME
}

# ============================================================
# Step 8: 安装为系统服务（可选）
# ============================================================
function Step8-InstallService {
    Write-Host ""
    Write-Host "[Step 8] 安装为 Windows 系统服务（开机自启）..." -ForegroundColor Green
    Write-Host "  需要以管理员身份运行 PowerShell" -ForegroundColor Yellow
    Write-Host ""

    try {
        cloudflared service install
        Write-Host "  ✅ 服务安装成功" -ForegroundColor Green
        Write-Host ""
        Write-Host "  管理命令:" -ForegroundColor Cyan
        Write-Host "  启动: Start-Service cloudflared" -ForegroundColor White
        Write-Host "  停止: Stop-Service cloudflared" -ForegroundColor White
        Write-Host "  状态: Get-Service cloudflared" -ForegroundColor White
        Write-Host "  卸载: cloudflared service uninstall" -ForegroundColor White
    }
    catch {
        Write-Host "  ❌ 安装失败，请以管理员身份运行" -ForegroundColor Red
    }
}

# ============================================================
# 主菜单
# ============================================================
function Show-Menu {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "   请选择操作:" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  [1] 完整部署（依次执行 Step 1-7）" -ForegroundColor Green
    Write-Host "  [2] 仅检查/安装 cloudflared (Step 1)" -ForegroundColor White
    Write-Host "  [3] 仅登录 Cloudflare (Step 2)" -ForegroundColor White
    Write-Host "  [4] 仅创建隧道 (Step 3)" -ForegroundColor White
    Write-Host "  [5] 仅生成配置文件 (Step 4)" -ForegroundColor White
    Write-Host "  [6] 仅配置 DNS (Step 5)" -ForegroundColor White
    Write-Host "  [7] 仅启动隧道 (Step 7)" -ForegroundColor White
    Write-Host "  [8] 安装为系统服务 (Step 8)" -ForegroundColor White
    Write-Host "  [9] 查看隧道状态" -ForegroundColor White
    Write-Host "  [0] 退出" -ForegroundColor Red
    Write-Host ""
}

function Show-TunnelStatus {
    Write-Host ""
    Write-Host "当前隧道列表:" -ForegroundColor Green
    cloudflared tunnel list

    Write-Host ""
    Write-Host "配置文件位置: $env:USERPROFILE\.cloudflared\config.yml" -ForegroundColor Cyan
    Write-Host "凭证文件位置: $env:USERPROFILE\.cloudflared\<tunnel-id>.json" -ForegroundColor Cyan
}

# ============================================================
# 主流程
# ============================================================
do {
    Show-Menu
    $choice = Read-Host "请输入选项"

    switch ($choice) {
        "1" {
            if (Step1-CheckInstall) {
                if (Step2-Login) {
                    if (Step3-CreateTunnel) {
                        if (Step4-GenerateConfig) {
                            Step5-ConfigureDNS | Out-Null
                            Step6-UpdateProjectConfig | Out-Null
                            Write-Host ""
                            Write-Host "============================================================" -ForegroundColor Green
                            Write-Host "   ✅ 配置完成！现在可以启动隧道了" -ForegroundColor Green
                            Write-Host "============================================================" -ForegroundColor Green
                            Write-Host ""
                            $startNow = Read-Host "是否立即启动隧道? (Y/N)"
                            if ($startNow -eq "Y" -or $startNow -eq "y") {
                                Step7-StartTunnel
                            }
                        }
                    }
                }
            }
        }
        "2" { Step1-CheckInstall }
        "3" { Step2-Login }
        "4" { Step3-CreateTunnel }
        "5" { Step4-GenerateConfig }
        "6" { Step5-ConfigureDNS }
        "7" { Step7-StartTunnel }
        "8" { Step8-InstallService }
        "9" { Show-TunnelStatus }
        "0" {
            Write-Host "退出脚本" -ForegroundColor Yellow
            break
        }
        default {
            Write-Host "无效选项" -ForegroundColor Red
        }
    }

    if ($choice -ne "0" -and $choice -ne "7") {
        Write-Host ""
        Read-Host "按回车键继续"
    }
} while ($choice -ne "0")
