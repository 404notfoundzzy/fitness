# Copy Skills to Global Trae Directory
$sourcePath = "d:\softWare\develop\app-myself\fitness\fitness-app\.trae\skills"
$destPath = "C:\Users\zzy\.trae\skills"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Copy Skills to Global Trae Directory" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $sourcePath)) {
    Write-Host "ERROR: Source directory not found - $sourcePath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $destPath)) {
    New-Item -ItemType Directory -Force -Path $destPath | Out-Null
    Write-Host "Created: $destPath" -ForegroundColor Yellow
}

$skills = Get-ChildItem -Path $sourcePath -Directory
$totalCount = $skills.Count
$copiedCount = 0

Write-Host "Found $totalCount skills, copying..." -ForegroundColor Green
Write-Host ""

foreach ($skill in $skills) {
    $skillName = $skill.Name
    $skillSource = Join-Path $sourcePath $skillName
    $skillDest = Join-Path $destPath $skillName
    
    try {
        if (Test-Path $skillDest) {
            Remove-Item -Path $skillDest -Recurse -Force
            Write-Host "  [OVERWRITE] $skillName" -ForegroundColor Yellow
        }
        
        Copy-Item -Path $skillSource -Destination $destPath -Recurse -Force
        Write-Host "  [OK] $skillName" -ForegroundColor Green
        $copiedCount++
    }
    catch {
        Write-Host "  [FAIL] $skillName - $_.Exception.Message" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Done!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Copied: $copiedCount / $totalCount skills" -ForegroundColor White
Write-Host "Destination: $destPath" -ForegroundColor White
Write-Host ""

Write-Host "Installed Skills:" -ForegroundColor Cyan
Get-ChildItem -Path $destPath -Directory | ForEach-Object {
    Write-Host "  + $($_.Name)" -ForegroundColor Green
}
