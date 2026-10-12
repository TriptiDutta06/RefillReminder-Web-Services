# ============================================================
#  RefillReminder - One-Click Start Script (PowerShell)
#  Run this from the project folder in VS Code terminal:
#  PS> .\run.ps1
# ============================================================

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   RefillReminder - Starting Server...   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill any old process using port 8080
Write-Host "[1/2] Checking if port 8080 is free..." -ForegroundColor Yellow
$netstatOutput = netstat -aon | findstr ":8080"
$pid8080 = $null
foreach ($line in $netstatOutput) {
    if ($line -match "LISTENING") {
        $parts = $line.Trim() -split "\s+"
        $pid8080 = $parts[-1]
        break
    }
}
if ($pid8080 -and $pid8080 -match "^\d+$") {
    Write-Host "      Found process $pid8080 on port 8080. Killing it..." -ForegroundColor Red
    taskkill /PID $pid8080 /F | Out-Null
    Start-Sleep -Seconds 2
    Write-Host "      Port 8080 is now free." -ForegroundColor Green
} else {
    Write-Host "      Port 8080 is free. Good!" -ForegroundColor Green
}

# Step 2: Run (spring-boot:run auto-compiles)
Write-Host ""
Write-Host "[2/2] Starting Spring Boot server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "-----------------------------------------" -ForegroundColor DarkGray
Write-Host "  App URL  : http://localhost:8080" -ForegroundColor Green
Write-Host "  REST API : http://localhost:8080/api/refills" -ForegroundColor Green
Write-Host "  MongoDB  : mongodb://localhost:27017/refillreminder" -ForegroundColor Green
Write-Host "-----------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Press Ctrl+C to stop the server." -ForegroundColor DarkGray
Write-Host ""

.\mvnw.cmd spring-boot:run
