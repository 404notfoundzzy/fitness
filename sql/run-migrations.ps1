# ============================================================
# openGym 整合迁移执行器（07 → 08 → 09 → 10 → 11 → 12）
#
# 按 docs/openGym整合方案.md 第 4.0 节的备份规范执行：
#   1) mysqldump 全量备份（含结构与数据）
#   2) 三张变更表快照（exercise / workout_exercise_detail / training_plan_exercise）
#   3) 记录变更前计数
#   4) 按序执行脚本，每步前探测"是否已执行"（07/10/11 的 ADD COLUMN 不可重复执行）
#   5) 执行后核对计数与列/表存在性
#
# 用法：
#   # 只看将要做什么（不连库、不写入）
#   pwsh -File sql/run-migrations.ps1 -PlanOnly
#
#   # 正式执行（会提示输入密码）
#   pwsh -File sql/run-migrations.ps1 -User root -Database fitness_db
#
#   # 非交互（CI/无人值守）：密码走环境变量，别写在命令行
#   $env:FITNESS_DB_PASSWORD = '***'
#   pwsh -File sql/run-migrations.ps1 -User root -Database fitness_db
#
# 回滚：见各脚本文件头部注释；本轮登记表在方案 4.1。
# ============================================================

[CmdletBinding()]
param(
  [string]$Database = 'fitness_db',
  [string]$User = 'root',
  [string]$Password = $env:FITNESS_DB_PASSWORD,
  [string]$DbHost = '127.0.0.1',
  [int]$Port = 3306,
  [string]$MySql = 'mysql',
  [string]$MySqlDump = 'mysqldump',
  [string]$BackupDir = 'backup',
  [switch]$SkipBackup,
  [switch]$DryRun,
  [switch]$PlanOnly
)

$ErrorActionPreference = 'Stop'
$script:Root = Split-Path -Parent $PSScriptRoot
$script:Stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$script:Day = Get-Date -Format 'yyyyMMdd'
$script:TempCnf = $null
$script:Failures = @()

# ── 迁移步骤（顺序即依赖：07 建列 → 08 回填 → 09 导入 → 10/11 扩表 → 12 建表）──
$steps = @(
  @{
    Id = 'D1'; File = 'sql/07-opengym-exercise-schema.sql'; Title = 'exercise +8 列 + source 索引'
    Probe = @{ Table = 'exercise'; Column = 'body_part' }
  },
  @{
    Id = 'D2'; File = 'sql/08-opengym-exercise-backfill.sql'; Title = '33 条存量动作结构化回填'
    # UPDATE 幂等，始终执行
    Probe = $null
  },
  @{
    Id = 'D3'; File = 'sql/09-opengym-exercise-data.sql'; Title = '上游 5602 条动作导入（按 name_en 去重）'
    Probe = $null
  },
  @{
    Id = 'D4'; File = 'sql/10-workout-detail-extend.sql'; Title = 'workout_exercise_detail +7 列（含 exercise_id）'
    # 以 exercise_id 为准：它是 PR/历史窗口/肌肉负荷按动作聚合的关键列
    Probe = @{ Table = 'workout_exercise_detail'; Column = 'exercise_id' }
  },
  @{
    Id = 'D5'; File = 'sql/11-plan-exercise-extend.sql'; Title = 'training_plan_exercise +6 列'
    Probe = @{ Table = 'training_plan_exercise'; Column = 'target_sets' }
  },
  @{
    Id = 'D6'; File = 'sql/12-new-tables.sql'; Title = '新表 exercise_pr / plan_progression_state'
    Probe = @{ Table = 'exercise_pr'; Column = $null }
  }
)

function Write-Section([string]$text) {
  Write-Host ''
  Write-Host "=== $text ===" -ForegroundColor Cyan
}

function Get-ToolPath([string]$name) {
  $cmd = Get-Command $name -ErrorAction SilentlyContinue
  if (-not $cmd) {
    throw "找不到 $name。请把 MySQL 的 bin 目录加入 PATH，或用 -MySql/-MySqlDump 指定完整路径。"
  }
  return $cmd.Source
}

function Initialize-Credentials {
  if ([string]::IsNullOrEmpty($Password)) {
    $secure = Read-Host "MySQL 密码（用户 $User@$DbHost，输入不回显）" -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
      $Password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    } finally {
      [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
  }
  # 密码走临时 defaults 文件，避免出现在进程命令行/历史里
  $script:TempCnf = [System.IO.Path]::GetTempFileName()
  $lines = @(
    '[client]',
    "host=$DbHost",
    "port=$Port",
    "user=$User",
    "password=$Password",
    'default-character-set=utf8mb4'
  )
  [System.IO.File]::WriteAllLines($script:TempCnf, $lines, [System.Text.UTF8Encoding]::new($false))
}

function Cleanup {
  if ($script:TempCnf -and (Test-Path $script:TempCnf)) {
    Remove-Item $script:TempCnf -Force -ErrorAction SilentlyContinue
  }
}

function Invoke-Query([string]$sql, [switch]$NoDatabase) {
  $cliArgs = @("--defaults-extra-file=$script:TempCnf", '--batch', '--skip-column-names', '--raw')
  if (-not $NoDatabase) { $cliArgs += $Database }
  $cliArgs += @('-e', $sql)
  $out = & $MySqlPath @cliArgs 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "SQL 执行失败：$sql`n$out"
  }
  return @($out)
}

function Invoke-SqlFile([string]$path) {
  $full = Join-Path $script:Root $path
  if (-not (Test-Path $full)) { throw "脚本不存在：$full" }
  $cliArgs = @("--defaults-extra-file=$script:TempCnf", '--default-character-set=utf8mb4', $Database)
  $out = Get-Content -LiteralPath $full -Raw -Encoding UTF8 | & $MySqlPath @cliArgs 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "执行 $path 失败：`n$out"
  }
  return $out
}

function Test-Column([string]$table, [string]$column) {
  if ([string]::IsNullOrEmpty($column)) {
    return (Test-Table $table)
  }
  $sql = "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='$table' AND COLUMN_NAME='$column';"
  return ((Invoke-Query $sql)[0].Trim() -ne '0')
}

function Test-Table([string]$table) {
  $sql = "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='$table';"
  return ((Invoke-Query $sql)[0].Trim() -ne '0')
}

function Get-Count([string]$table, [string]$where = '') {
  $sql = "SELECT COUNT(*) FROM $table"
  if ($where) { $sql += " WHERE $where" }
  return [int]((Invoke-Query "$sql;")[0].Trim())
}

function New-Snapshot([string]$table) {
  $bak = "${table}_bak_$($script:Stamp)"
  if (Test-Table $bak) {
    Write-Host "  快照已存在，跳过：$bak" -ForegroundColor DarkGray
    return $bak
  }
  $before = Get-Count $table
  Invoke-Query "CREATE TABLE $bak AS SELECT * FROM $table;" | Out-Null
  $after = Get-Count $bak
  if ($after -ne $before) {
    throw "快照行数不一致：$table 原表 $before 行，快照 $after 行"
  }
  Write-Host "  快照 $bak（$after 行）" -ForegroundColor Green
  return $bak
}

function Backup-All {
  $dir = Join-Path $script:Root $BackupDir
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
  $file = Join-Path $dir "fitness_full_$($script:Stamp).sql"
  Write-Host "  mysqldump → $file" -ForegroundColor Yellow
  $cliArgs = @(
    "--defaults-extra-file=$script:TempCnf",
    '--single-transaction', '--routines', '--triggers', '--events',
    '--default-character-set=utf8mb4', '--hex-blob',
    '--databases', $Database, '--result-file', $file
  )
  & $MySqlDumpPath @cliArgs
  if ($LASTEXITCODE -ne 0) { throw "mysqldump 失败（exit $LASTEXITCODE）" }
  $size = (Get-Item $file).Length
  if ($size -lt 1024) { throw "备份文件异常（$size 字节），已中止" }
  Write-Host ("  备份完成：{0:N1} MB" -f ($size / 1MB)) -ForegroundColor Green
  return $file
}

# ── 计划模式：不连库，只打印将执行的步骤 ──────────────────────────────────
if ($PlanOnly) {
  Write-Host 'openGym 整合迁移计划（PlanOnly：未连接数据库）' -ForegroundColor Cyan
  Write-Host "  目标：$User@$DbHost`:$Port / $Database"
  Write-Host "  备份：$BackupDir/fitness_full_$($script:Stamp).sql + 三张快照表（缺省跳过 -SkipBackup）"
  foreach ($s in $steps) {
    $probe = if ($s.Probe) {
      $col = if ($s.Probe.Column) { ".$($s.Probe.Column)" } else { '' }
      "（已存在则跳过：$($s.Probe.Table)$col）"
    } else { '（幂等，始终执行）' }
    Write-Host ("  [{0}] {1,-42} {2} {3}" -f $s.Id, $s.File, $s.Title, $probe)
  }
  Write-Host ''
  Write-Host '确认无误后去掉 -PlanOnly 执行；执行前请确认已停掉正在写库的后端服务。' -ForegroundColor Yellow
  exit 0
}

$MySqlPath = Get-ToolPath $MySql
$MySqlDumpPath = if ($SkipBackup) { $null } else { Get-ToolPath $MySqlDump }

try {
  Initialize-Credentials

  Write-Section '0. 连接与库信息'
  $version = (Invoke-Query 'SELECT VERSION();' -NoDatabase)[0].Trim()
  Write-Host "  MySQL $version · $User@$DbHost`:$Port"
  $dbExists = (Invoke-Query "SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='$Database';" -NoDatabase)[0].Trim()
  if ($dbExists -eq '0') { throw "数据库 $Database 不存在" }

  $countsBefore = [ordered]@{
    exercise                  = Get-Count 'exercise'
    workout_exercise_detail   = Get-Count 'workout_exercise_detail'
    training_plan_exercise    = Get-Count 'training_plan_exercise'
    workout_record            = Get-Count 'workout_record'
  }
  Write-Host '  变更前计数：' -NoNewline
  $countsBefore.GetEnumerator() | ForEach-Object { Write-Host -NoNewline (" {0}={1}" -f $_.Key, $_.Value) }
  Write-Host ''

  if (-not $SkipBackup) {
    Write-Section '1. 全量备份'
    if ($DryRun) { Write-Host '  [DryRun] 跳过 mysqldump' -ForegroundColor DarkGray }
    else { Backup-All | Out-Null }

    Write-Section '2. 变更表快照'
    foreach ($t in @('exercise', 'workout_exercise_detail', 'training_plan_exercise')) {
      if ($DryRun) { Write-Host "  [DryRun] CREATE TABLE ${t}_bak_$($script:Stamp)" -ForegroundColor DarkGray }
      else { New-Snapshot $t | Out-Null }
    }
  } else {
    Write-Host '  已指定 -SkipBackup：跳过全量备份与快照（不建议）' -ForegroundColor Yellow
  }

  Write-Section '3. 按序执行迁移'
  foreach ($s in $steps) {
    $already = $false
    if ($s.Probe) { $already = Test-Column $s.Probe.Table $s.Probe.Column }
    if ($already) {
      Write-Host "  [$($s.Id)] 已是目标结构，跳过：$($s.File)" -ForegroundColor DarkGray
      continue
    }
    if ($DryRun) {
      Write-Host "  [DryRun] 将执行 $($s.File) — $($s.Title)" -ForegroundColor DarkGray
      continue
    }
    Write-Host "  [$($s.Id)] $($s.Title) ..." -NoNewline
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    Invoke-SqlFile $s.File | Out-Null
    $sw.Stop()
    Write-Host (" 完成（{0:N1}s）" -f $sw.Elapsed.TotalSeconds) -ForegroundColor Green
  }

  if (-not $DryRun) {
    Write-Section '4. 结果核对'
    $countsAfter = [ordered]@{
      exercise                = Get-Count 'exercise'
      exercise_system         = Get-Count 'exercise' "source='system'"
      exercise_opengym        = Get-Count 'exercise' "source='opengym'"
      exercise_with_bodypart  = Get-Count 'exercise' 'body_part IS NOT NULL'
      detail_rows             = Get-Count 'workout_exercise_detail'
      plan_exercise_rows      = Get-Count 'training_plan_exercise'
    }
    $countsAfter.GetEnumerator() | ForEach-Object { Write-Host ("  {0,-24} {1}" -f $_.Key, $_.Value) }

    $checks = @(
      @{ Name = 'exercise.body_part 列'; Ok = (Test-Column 'exercise' 'body_part') },
      @{ Name = 'exercise.source 列'; Ok = (Test-Column 'exercise' 'source') },
      @{ Name = 'workout_exercise_detail.exercise_id 列'; Ok = (Test-Column 'workout_exercise_detail' 'exercise_id') },
      @{ Name = 'workout_exercise_detail.set_type 列'; Ok = (Test-Column 'workout_exercise_detail' 'set_type') },
      @{ Name = 'training_plan_exercise.target_sets 列'; Ok = (Test-Column 'training_plan_exercise' 'target_sets') },
      @{ Name = 'exercise_pr 表'; Ok = (Test-Table 'exercise_pr') },
      @{ Name = 'plan_progression_state 表'; Ok = (Test-Table 'plan_progression_state') },
      @{ Name = 'exercise_id 索引'; Ok = ((Invoke-Query "SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='workout_exercise_detail' AND INDEX_NAME='idx_detail_exercise';")[0].Trim() -ne '0') }
    )
    foreach ($c in $checks) {
      if ($c.Ok) { Write-Host "  ✓ $($c.Name)" -ForegroundColor Green }
      else { Write-Host "  ✗ $($c.Name)" -ForegroundColor Red; $script:Failures += $c.Name }
    }

    $imported = $countsAfter.exercise_opengym
    if ($imported -lt 5000) {
      $script:Failures += "opengym 动作只导入 $imported 条（期望 5602）"
    }
    if ($countsAfter.exercise -lt $countsBefore.exercise) {
      $script:Failures += '动作总数变少（不应发生）'
    }

    Write-Host ''
    if ($script:Failures.Count) {
      Write-Host '迁移完成但存在告警：' -ForegroundColor Yellow
      $script:Failures | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
      Write-Host "回滚参考：docs/openGym整合方案.md 4.1 登记表；快照表 ${t}_bak_$($script:Stamp)" -ForegroundColor Yellow
      exit 2
    }
    Write-Host '全部迁移与核对通过。' -ForegroundColor Green
    Write-Host '下一步：重启后端（新实体列生效）→ 打开 App 训练台验收。' -ForegroundColor Cyan
  } else {
    Write-Host ''
    Write-Host '[DryRun] 未写入任何数据。' -ForegroundColor DarkGray
  }
} finally {
  Cleanup
}
