# Test script for custom training plan with custom exercises
$BASE_URL = "http://localhost:8888/api"
$TOKEN = "Bearer mock-jwt-token-1"

function Api-Post($url, $body) {
    $json = $body | ConvertTo-Json -Depth 10 -Compress
    return Invoke-RestMethod -Uri "$BASE_URL$url" -Method POST -Headers @{ "Authorization" = $TOKEN; "Content-Type" = "application/json" } -Body ([System.Text.Encoding]::UTF8.GetBytes($json))
}

function Api-Get($url) {
    return Invoke-RestMethod -Uri "$BASE_URL$url" -Method GET -Headers @{ "Authorization" = $TOKEN }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Custom Training Plan Mock Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create custom exercise 1
Write-Host "[1/6] Creating custom exercise: Pallof Press" -ForegroundColor Yellow
$e1 = @{
    name            = [char]0x5E15 + [char]0x6D1B + [char]0x592B + [char]0x63A8 + [char]0x538B
    category        = [char]0x6838 + [char]0x5FC3 + [char]0x8BAD + [char]0x7EC3
    categoryType    = "core"
    muscleGroup     = [char]0x6838 + [char]0x5FC3 + [char]0x3001 + [char]0x8179 + [char]0x6A2A + [char]0x808C
    difficultyLevel = 2
} 
$exerciseId1 = $null
try {
    $r1 = Api-Post "/exercises/custom" $e1
    $exerciseId1 = $r1.data.id
    Write-Host "  -> OK: ID=$exerciseId1" -ForegroundColor Green
}
catch {
    Write-Host "  -> FAIL: $_" -ForegroundColor Red
}

# Step 2: Create custom exercise 2
Write-Host "[2/6] Creating custom exercise: Single-Leg RDL" -ForegroundColor Yellow
$e2 = @{
    name            = [char]0x5355 + [char]0x817F + [char]0x7F57 + [char]0x9A6C + [char]0x5C3C + [char]0x4E9A + [char]0x786C + [char]0x62C9
    category        = [char]0x4E0B + [char]0x80A2 + [char]0x808C + [char]0x7FA4
    categoryType    = "legs"
    muscleGroup     = [char]0x81C0 + [char]0x5927 + [char]0x808C + [char]0x3001 + [char]0x8179 + [char]0x7EF3 + [char]0x808C
    difficultyLevel = 3
}
$exerciseId2 = $null
try {
    $r2 = Api-Post "/exercises/custom" $e2
    $exerciseId2 = $r2.data.id
    Write-Host "  -> OK: ID=$exerciseId2" -ForegroundColor Green
}
catch {
    Write-Host "  -> FAIL: $_" -ForegroundColor Red
}

# Step 3: Verify exercises
Write-Host "[3/6] Verifying exercises list" -ForegroundColor Yellow
try {
    $r3 = Api-Get "/exercises"
    $count = if ($r3.data) { $r3.data.Count } else { 0 }
    Write-Host "  -> Found $count exercises" -ForegroundColor Green
}
catch {
    Write-Host "  -> FAIL: $_" -ForegroundColor Red
}

# Step 4: Create custom training plan
Write-Host "[4/6] Creating custom training plan with custom exercises" -ForegroundColor Yellow
$plan = @{
    name           = [char]0x6838 + [char]0x5FC3 + [char]0x529B + [char]0x91CF + [char]0x5F3A + [char]0x5316 + [char]0x8BA1 + [char]0x5212
    description    = "Core strength plan with custom exercises"
    type           = "custom"
    daysPerWeek    = 3
    difficulty     = "intermediate"
    targetAudience = "Intermediate trainees"
    tags           = "core,strength,custom"
    planType       = 0
    days           = @(
        @{
            dayNumber = 1
            dayName   = [char]0x6838 + [char]0x5FC3 + [char]0x7A33 + [char]0x5B9A + [char]0x8BAD + [char]0x7EC3
            focus     = [char]0x6838 + [char]0x5FC3 + [char]0x808C + [char]0x7FA4
            sortOrder = 1
            exercises = @(
                @{
                    exerciseId   = $exerciseId1
                    exerciseName = [char]0x5E15 + [char]0x6D1B + [char]0x592B + [char]0x63A8 + [char]0x538B
                    sets         = 3
                    reps         = "12-15"
                    restSeconds  = 45
                    notes        = "Keep core tight"
                    sortOrder    = 1
                },
                @{
                    exerciseId   = $null
                    exerciseName = [char]0x6B7B + [char]0x866B + [char]0x5F0F
                    sets         = 3
                    reps         = "10-12"
                    restSeconds  = 30
                    notes        = "Auto-create test"
                    sortOrder    = 2
                }
            )
        },
        @{
            dayNumber = 2
            dayName   = [char]0x4E0B + [char]0x80A2 + [char]0x540E + [char]0x94FE + [char]0x8BAD + [char]0x7EC3
            focus     = [char]0x81C0 + [char]0x817F + [char]0x808C + [char]0x7FA4
            sortOrder = 2
            exercises = @(
                @{
                    exerciseId   = $exerciseId2
                    exerciseName = [char]0x5355 + [char]0x817F + [char]0x7F57 + [char]0x9A6C + [char]0x5C3C + [char]0x4E9A + [char]0x786C + [char]0x62C9
                    sets         = 4
                    reps         = "8-10"
                    restSeconds  = 90
                    notes        = "Keep pelvis level"
                    sortOrder    = 1
                },
                @{
                    exerciseId   = $null
                    exerciseName = [char]0x81C0 + [char]0x6865
                    sets         = 4
                    reps         = "12-15"
                    restSeconds  = 60
                    notes        = "Squeeze glutes at top"
                    sortOrder    = 2
                }
            )
        },
        @{
            dayNumber = 3
            dayName   = [char]0x5168 + [char]0x8EAB + [char]0x529F + [char]0x80FD + [char]0x6027 + [char]0x8BAD + [char]0x7EC3
            focus     = [char]0x5168 + [char]0x8EAB
            sortOrder = 3
            exercises = @(
                @{
                    exerciseId   = $exerciseId1
                    exerciseName = [char]0x5E15 + [char]0x6D1B + [char]0x592B + [char]0x63A8 + [char]0x538B
                    sets         = 3
                    reps         = "10-12"
                    restSeconds  = 45
                    notes        = "Both sides"
                    sortOrder    = 1
                },
                @{
                    exerciseId   = $null
                    exerciseName = [char]0x571F + [char]0x8033 + [char]0x5176 + [char]0x8D77 + [char]0x7ACB
                    sets         = 3
                    reps         = "3-5"
                    restSeconds  = 90
                    notes        = "Light weight"
                    sortOrder    = 2
                }
            )
        }
    )
}

$planId = $null
try {
    $r4 = Api-Post "/training-plan/custom" $plan
    $planId = $r4.data.id
    Write-Host "  -> OK: Plan ID=$planId" -ForegroundColor Green
}
catch {
    Write-Host "  -> FAIL: $_" -ForegroundColor Red
}

# Step 5: Query plan details
Write-Host "[5/6] Querying plan days and exercises" -ForegroundColor Yellow
if ($planId) {
    try {
        $r5 = Api-Get "/training-plan/$planId/days"
        $days = $r5.data.days
        Write-Host "  -> Plan has $($days.Count) training days:" -ForegroundColor Green
        foreach ($day in $days) {
            $exCount = $day.exercises.Count
            Write-Host "     Day $($day.dayNumber): $($day.dayName) ($exCount exercises)" -ForegroundColor White
            foreach ($ex in $day.exercises) {
                $idLabel = if ($ex.exerciseId) { "exerciseId=$($ex.exerciseId)" } else { "no exerciseId" }
                Write-Host "       - $($ex.exerciseName) | $idLabel | $($ex.sets)x$($ex.reps)" -ForegroundColor Gray
            }
        }
    }
    catch {
        Write-Host "  -> FAIL: $_" -ForegroundColor Red
    }
}
else {
    Write-Host "  -> SKIP (plan creation failed)" -ForegroundColor DarkGray
}

# Step 6: Check exercise references
Write-Host "[6/6] Checking exercise references" -ForegroundColor Yellow
if ($exerciseId1) {
    try {
        $r6 = Api-Get "/exercises/$exerciseId1/reference"
        Write-Host "  -> Exercise ID=$exerciseId1 referenced $($r6.data.referenceCount) times" -ForegroundColor Green
    }
    catch {
        Write-Host "  -> FAIL: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
