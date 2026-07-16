param([switch]$Start)

# [SEC-01] Force UTF-8 encoding
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ScriptDir     = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkspaceRoot = Split-Path -Parent $ScriptDir
$BridgeDir     = Join-Path $WorkspaceRoot "skills\03_Execution\telegram-bot-cdp-bridge\telegram-bot-project"
$EcoConfig     = Join-Path $BridgeDir "ecosystem.telegram.config.js"
$LogsDir       = Join-Path $WorkspaceRoot "Data\logs"

$env:PM2_HOME  = Join-Path $env:USERPROFILE ".pm2"

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Magenta
Write-Host "   Antigravity Telegram Bot Manager V2.0 (Zero-Delay Mode) " -ForegroundColor Magenta
Write-Host "===========================================================" -ForegroundColor Magenta
Write-Host ""

# Helper to check if tg-bridge-zero-delay is online
function Get-TgOnlineStatus {
    $pm2Output = npx pm2 jlist 2>$null
    if ($LASTEXITCODE -eq 0 -and $pm2Output) {
        try {
            $jsonStart = $pm2Output.IndexOf('[')
            if ($jsonStart -ge 0) {
                $cleanJson = $pm2Output.Substring($jsonStart)
                $apps = ConvertFrom-Json $cleanJson -ErrorAction Stop
                foreach ($app in $apps) {
                    if ($app.name -eq "tg-bridge-zero-delay") {
                        if ($app.status -eq "online" -or $app.pm2_env.status -eq "online") {
                            return $true
                        }
                    }
                }
            }
        } catch {
            # Fallback regex search
            if ($pm2Output -match '"name":"tg-bridge-zero-delay"') {
                return $true
            }
        }
    }
    return $false
}

# Dependency check
Write-Host "Checking runtime dependency environment..." -ForegroundColor Cyan
$testResult = node -e "try { require('better-sqlite3'); process.exit(0); } catch(e) { process.exit(1); }" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] better-sqlite3 not installed, executing npm install..." -ForegroundColor Yellow
    Set-Location $BridgeDir
    npm install
    Set-Location $WorkspaceRoot
}

if (-not (Test-Path $LogsDir)) { New-Item -Path $LogsDir -ItemType Directory -Force | Out-Null }

# [NODE-02] Verify dist build artifact
$artifactPath = Join-Path $BridgeDir "dist/bin/cli-zero-delay.js"
if (-not (Test-Path $artifactPath)) {
    Write-Host "[INFO] dist/bin/cli-zero-delay.js not found, running build compile..." -ForegroundColor Cyan
    Set-Location $BridgeDir
    npm run build
    Set-Location $WorkspaceRoot
    if (-not (Test-Path $artifactPath)) {
        Write-Host "[FATAL] Build compile failed! cli-zero-delay.js missing, aborting." -ForegroundColor Red
        return
    }
}

$tgRunning = Get-TgOnlineStatus

if ($tgRunning -and -not $Start) {
    Write-Host "Telegram Zero-Delay Bridge is running under PM2!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Available Actions:" -ForegroundColor Yellow
    Write-Host "  [1] Open PM2 Dashboard (Monit)"
    Write-Host "  [2] View Live Logs"
    Write-Host "  [3] Restart Service"
    Write-Host "  [4] Stop Service"
    Write-Host "  [B] Back"
    Write-Host ""
    $action = Read-Host "Please select an action"
    switch ($action) {
        "1" { Set-Location $BridgeDir; npx pm2 monit; Set-Location $WorkspaceRoot }
        "2" { npx pm2 logs tg-bridge-zero-delay --lines 50 }
        "3" { npx pm2 restart tg-bridge-zero-delay; Write-Host "[OK] Telegram Bridge restarted" -ForegroundColor Green }
        "4" { npx pm2 stop tg-bridge-zero-delay; Write-Host "[WARN] Telegram Bridge stopped" -ForegroundColor Yellow }
    }
} else {
    Write-Host "Starting Telegram Zero-Delay Bridge via PM2..." -ForegroundColor Yellow
    
    # [CODE-02] Log current processes before clean start
    npx pm2 list
    
    Set-Location $BridgeDir
    npx pm2 delete telegram-cdp-bridge 2>$null
    npx pm2 delete tg-bridge-zero-delay 2>$null
    
    # [SEC-02] Exit on startup error
    npx pm2 start $EcoConfig
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[FATAL] PM2 service startup failed!" -ForegroundColor Red
        Set-Location $WorkspaceRoot
        return
    }
    
    # [DEVOPS-01] Wait 12 seconds to verify process stability
    Write-Host "Waiting 12 seconds to verify service startup stability..." -ForegroundColor Cyan
    Start-Sleep -Seconds 12
    
    # Re-check status
    $isStable = Get-TgOnlineStatus
    if ($isStable) {
        npx pm2 save
        Write-Host "[SUCCESS] Service started successfully and saved to startup snapshot." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Service failed to remain online! pm2 save skipped." -ForegroundColor Red
    }
    
    Set-Location $WorkspaceRoot
    Start-Sleep -Seconds 2
    npx pm2 list
}
