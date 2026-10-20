$BASE_URL = "http://localhost:8888/api"
$TOKEN = "Bearer mock-jwt-token-1"

function Api-Post($url, $body) {
    $json = $body | ConvertTo-Json -Depth 10 -Compress
    return Invoke-RestMethod -Uri "$BASE_URL$url" -Method POST -Headers @{ "Authorization" = $TOKEN; "Content-Type" = "application/json" } -Body ([System.Text.Encoding]::UTF8.GetBytes($json))
}

function Api-Get($url) {
    return Invoke-RestMethod -Uri "$BASE_URL$url" -Method GET -Headers @{ "Authorization" = $TOKEN }
}

function Api-Put($url, $body) {
    $json = $body | ConvertTo-Json -Depth 10 -Compress
    return Invoke-RestMethod -Uri "$BASE_URL$url" -Method PUT -Headers @{ "Authorization" = $TOKEN; "Content-Type" = "application/json" } -Body ([System.Text.Encoding]::UTF8.GetBytes($json))
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Full E2E Test: Create -> Edit -> Verify" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ====== STEP 1: Create a custom exercise first ======
Write-Host "[STEP 1] Create custom exercise: Pallof Press" -ForegroundColor Yellow
$e1 = @{
    name = [char]0x5E15 + [char]0x6D1B + [char]0x592B + [char]0x63A8 + [char]0x538B
    category = [char]0x6838 + [char]0x5FC3 + [char]0x8BAD + [char]0x7EC3
    categoryType = "core"
    muscleGroup = [char]0x6838 + [char]0x5FC3
    difficultyLevel = 2
}
$exerciseId1 = $null
try {
    $r1 = Api-Post "/exercises/custom" $e1
    $exerciseId1 = $r1.data.id
    Write-Host "  -> OK: exerciseId=$exerciseId1, name=$($r1.data.name)" -ForegroundColor Green
} catch {
    Write-Host "  -> Already exists or FAIL: $_" -ForegroundColor Red
    # Try to find existing
    $all = Api-Get "/exercises"
    $found = $all.data | Where-Object { $_.name -like "*$([char]0x5E15)*" } | Select-Object -First 1
    if ($found) { $exerciseId1 = $found.id; Write-Host "  -> Found existing: id=$exerciseId1" -ForegroundColor DarkYellow }
}

Write-Host ""

# ====== STEP 2: Create custom training plan ======
Write-Host "[STEP 2] Create custom training plan" -ForegroundColor Yellow
$planName = [char]0x4E0A + [char]0x80A2 + [char]0x63A8 + [char]0x529B + [char]0x5F3A + [char]0x5316 + [char]0x8BA1 + [char]0x5212
$day1Name = [char]0x80F8 + [char]0x90E8 + [char]0x4E0E + [char]0x4E09 + [char]0x89D2
$day2Name = [char]0x80CC + [char]0x90E8 + [char]0x4E0E + [char]0x4E8C + [char]0x5934
$day3Name = [char]0x4E0B + [char]0x80A2 + [char]0x529B + [char]0x91CF

$plan = @{
    name = $planName
    description = "Upper body push strength 3-day plan"
    type = "three-split"
    daysPerWeek = 3
    difficulty = "intermediate"
    targetAudience = "Intermediate lifters"
    tags = "push,strength,upper"
    planType = 0
    days = @(
        @{
            dayNumber = 1
            dayName = $day1Name
            focus = [char]0x80F8 + [char]0x90E8 + [char]0x3001 + [char]0x4E09 + [char]0x89D2 + [char]0x808C
            sortOrder = 1
            exercises = @(
                @{ exerciseId = $exerciseId1; exerciseName = [char]0x5E15 + [char]0x6D1B + [char]0x592B + [char]0x63A8 + [char]0x538B; sets = 3; reps = "12-15"; restSeconds = 45; notes = "Core anti-rotation"; sortOrder = 1 },
                @{ exerciseId = $null; exerciseName = [char]0x7A7A + [char]0x6746 + [char]0x4EF0 + [char]0x5367 + [char]0x63A8; sets = 4; reps = "8-12"; restSeconds = 90; notes = "Auto-create test"; sortOrder = 2 },
                @{ exerciseId = $null; exerciseName = [char]0x54D1 + [char]0x94C3 + [char]0x63A8 + [char]0x4E3E; sets = 4; reps = "10-12"; restSeconds = 60; notes = ""; sortOrder = 3 }
            )
        },
        @{
            dayNumber = 2
            dayName = $day2Name
            focus = [char]0x80CC + [char]0x90E8 + [char]0x3001 + [char]0x4E8C + [char]0x5934 + [char]0x808C
            sortOrder = 2
            exercises = @(
                @{ exerciseId = $null; exerciseName = [char]0x5F15 + [char]0x4F53 + [char]0x5411 + [char]0x4E0A; sets = 4; reps = "6-8"; restSeconds = 120; notes = ""; sortOrder = 1 },
                @{ exerciseId = $null; exerciseName = [char]0x4FEF + [char]0x8EAB + [char]0x5212 + [char]0x8239; sets = 3; reps = "10-12"; restSeconds = 90; notes = ""; sortOrder = 2 }
            )
        },
        @{
            dayNumber = 3
            dayName = $day3Name
            focus = [char]0x80A1 + [char]0x56DB + [char]0x5934 + [char]0x808C + [char]0x3001 + [char]0x81C0 + [char]0x5927 + [char]0x808C
            sortOrder = 3
            exercises = @(
                @{ exerciseId = $null; exerciseName = [char]0x6DF1 + [char]0x8E72; sets = 5; reps = "5-8"; restSeconds = 180; notes = ""; sortOrder = 1 },
                @{ exerciseId = $null; exerciseName = [char]0x817F + [char]0x4E3E; sets = 3; reps = "12-15"; restSeconds = 60; notes = ""; sortOrder = 2 }
            )
        }
    )
}

$planId = $null
try {
    $r2 = Api-Post "/training-plan/custom" $plan
    $planId = $r2.data.id
    Write-Host "  -> OK: planId=$planId, name=$($r2.data.name)" -ForegroundColor Green
} catch {
    Write-Host "  -> FAIL: $_" -ForegroundColor Red
}

Write-Host ""

# ====== STEP 3: Verify plan was created correctly ======
Write-Host "[STEP 3] Verify plan structure (GET /training-plan/{id}/days)" -ForegroundColor Yellow
if ($planId) {
    try {
        $r3 = Api-Get "/training-plan/$planId/days"
        $days = $r3.data.days
        $summary = $r3.data.summary
        Write-Host "  -> Plan has $($days.Count) training days" -ForegroundColor Green
        Write-Host "  -> Total exercises: $($summary.totalExercises), Progress: $($summary.progress)%" -ForegroundColor Green
        Write-Host ""
        foreach ($day in $days) {
            Write-Host "  Day $($day.dayNumber): $($day.dayName) - Focus: $($day.focus)" -ForegroundColor White
            foreach ($ex in $day.exercises) {
                $linkType = if ($ex.exerciseId) { "LINKED(id=$($ex.exerciseId))" } else { "MANUAL" }
                Write-Host "    [$linkType] $($ex.exerciseName) - $($ex.sets)x$($ex.reps) rest=$($ex.restSeconds)s" -ForegroundColor Gray
            }
            Write-Host ""
        }
    } catch {
        Write-Host "  -> FAIL: $_" -ForegroundColor Red
    }
}

# ====== STEP 4: Verify custom plans list ======
Write-Host "[STEP 4] Verify custom plans list (GET /training-plan/list)" -ForegroundColor Yellow
try {
    $r4 = Api-Get "/training-plan/list"
    $customPlans = $r4.data | Where-Object { $_.planType -eq 0 }
    $presetPlans = $r4.data | Where-Object { $_.planType -eq 1 }
    Write-Host "  -> System plans: $($presetPlans.Count)" -ForegroundColor Green
    Write-Host "  -> Custom plans: $($customPlans.Count)" -ForegroundColor Green
    foreach ($cp in $customPlans) {
        Write-Host "     - ID=$($cp.id) name=$($cp.name) status=$($cp.status) source=$($cp.source)" -ForegroundColor White
    }
} catch {
    Write-Host "  -> FAIL: $_" -ForegroundColor Red
}

Write-Host ""

# ====== STEP 5: Check exercise reference ======
Write-Host "[STEP 5] Check exercise reference count" -ForegroundColor Yellow
if ($exerciseId1) {
    try {
        $r5 = Api-Get "/exercises/$exerciseId1/reference"
        Write-Host "  -> Exercise ID=$exerciseId1 referenced $($r5.data.referenceCount) times" -ForegroundColor Green
    } catch {
        Write-Host "  -> FAIL: $_" -ForegroundColor Red
    }
}

Write-Host ""

# ====== STEP 6: Add exercise to existing day ======
Write-Host "[STEP 6] Add exercise to Day 1 via API" -ForegroundColor Yellow
if ($planId) {
    try {
        $r3 = Api-Get "/training-plan/$planId/days"
        $day1Id = $r3.data.days[0].dayId
        $newEx = @{
            exerciseId = $null
            exerciseName = [char]0x4E0A + [char]0x659C + [char]0x5367 + [char]0x63A8
            sets = 3
            reps = "10-12"
            restSeconds = 60
            notes = "Added after creation"
            sortOrder = 4
        }
        $r6 = Api-Post "/training-plan/days/$day1Id/exercises" $newEx
        Write-Host "  -> OK: Added exercise to day1 (dayId=$day1Id), new exerciseId=$($r6.data.id)" -ForegroundColor Green
    } catch {
        Write-Host "  -> FAIL: $_" -ForegroundColor Red
    }
}

Write-Host ""

# ====== STEP 7: Verify updated plan ======
Write-Host "[STEP 7] Verify updated plan structure" -ForegroundColor Yellow
if ($planId) {
    try {
        $r7 = Api-Get "/training-plan/$planId/days"
        $day1 = $r7.data.days[0]
        Write-Host "  -> Day1 now has $($day1.exercises.Count) exercises:" -ForegroundColor Green
        foreach ($ex in $day1.exercises) {
            Write-Host "     - $($ex.exerciseName) $($ex.sets)x$($ex.reps)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  -> FAIL: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  E2E Test Complete!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
