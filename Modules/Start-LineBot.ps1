# ==============================================================================
# Start-LineBot.ps1 V3.0 — PM2 Smart Manager
# ==============================================================================
param([switch]$Start)

$ScriptDir     = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkspaceRoot = Split-Path -Parent $ScriptDir
$BridgeDir     = Join-Path $WorkspaceRoot "skills\03_Execution\line-bot-zero-delay\line-bot-project"
$EcoConfig     = Join-Path $BridgeDir "ecosystem.config.js"
$LogsDir       = Join-Path $WorkspaceRoot "Data\logs"
$env:PM2_HOME  = Join-Path $env:USERPROFILE ".pm2"

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "   Antigravity LINE Bot Manager V3.0 (PM2 Single-Core)     " -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $LogsDir)) { New-Item -Path $LogsDir -ItemType Directory -Force | Out-Null }

if (-not (Test-Path $EcoConfig)) {
    Write-Host "ERROR: ecosystem.config.js not found!" -ForegroundColor Red
    Write-Host "Path: $EcoConfig" -ForegroundColor DarkGray
    exit 1
}

$pm2Output = npx pm2 jlist 2>$null
$bridgeRunning = $false
if ($LASTEXITCODE -eq 0 -and $pm2Output) {
    try {
        $jsonStart = $pm2Output.IndexOf('[')
        if ($jsonStart -ge 0) {
            $cleanJson = $pm2Output.Substring($jsonStart)
            $apps = ConvertFrom-Json $cleanJson -ErrorAction Stop
            foreach ($app in $apps) {
                if ($app.name -eq "line-bridge" -and ($app.status -eq "online" -or $app.pm2_env.status -eq "online")) {
                    $bridgeRunning = $true
                }
            }
        }
    } catch {
        if ($pm2Output -match '"name":"line-bridge"[^}]+"status":"online"') {
            $bridgeRunning = $true
        }
    }
}

if ($bridgeRunning -and -not $Start) {
    Write-Host "LINE Bridge is running under PM2!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Available Actions:" -ForegroundColor Yellow
    Write-Host "  [1] Open PM2 Dashboard (Monit)" -ForegroundColor White
    Write-Host "  [2] View Live Logs" -ForegroundColor White
    Write-Host "  [3] Restart Service" -ForegroundColor White
    Write-Host "  [4] Stop Service" -ForegroundColor White
    Write-Host "  [B] Back" -ForegroundColor White
    Write-Host ""
    $action = Read-Host "Please select an action"
    
    switch ($action) {
        "1" { Set-Location $BridgeDir; npx pm2 monit; Set-Location $WorkspaceRoot }
        "2" { npx pm2 logs line-bridge --lines 50 }
        "3" { 
            npx pm2 restart line-bridge
            Write-Host "[OK] LINE Bridge restarted" -ForegroundColor Green 
        }
        "4" { 
            npx pm2 stop line-bridge
            Write-Host "[WARN] LINE Bridge stopped" -ForegroundColor Yellow 
        }
    }
} else {
    Write-Host "Starting LINE Bridge via PM2..." -ForegroundColor Yellow
    
    $sshZombies = Get-CimInstance Win32_Process -Filter "Name = 'ssh.exe' AND CommandLine LIKE '%a.pinggy.io%'" -ErrorAction SilentlyContinue
    foreach ($z in $sshZombies) { 
        Invoke-CimMethod -InputObject $z -MethodName Terminate | Out-Null 
    }
    
    $port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
    foreach ($tcp in $port3000) {
        Stop-Process -Id $tcp.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
    
    Set-Location $BridgeDir
    npx pm2 delete line-bridge 2>$null
    npx pm2 start ecosystem.config.js
    npx pm2 save
    Set-Location $WorkspaceRoot
    
    Start-Sleep -Seconds 5
    Write-Host ""
    npx pm2 list
    Write-Host ""
    
    $port = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
    if ($port) {
        Write-Host "[OK] LINE Bridge successfully started on Port 3000!" -ForegroundColor Green
        Write-Host "     Pinggy SSH tunnel is managed automatically." -ForegroundColor DarkGray
    } else {
        Write-Host "[WARN] Startup might have failed. Check PM2 logs." -ForegroundColor Yellow
    }

    # V14 連鎖啟動優化：僅在開機自啟動 (-Start) 模式下進行連鎖喚醒，避免手動調試干擾，防止 PM2 競態衝突
    if ($Start) {
        $TgScript = Join-Path $ScriptDir "Start-TelegramBot.ps1"
        if (Test-Path $TgScript) {
            Write-Host ""
            Write-Host "===========================================================" -ForegroundColor Cyan
            Write-Host "   正在連鎖喚醒 Telegram CDP Bridge...                       " -ForegroundColor Cyan
            Write-Host "===========================================================" -ForegroundColor Cyan
            & $TgScript -Start
        }
    }
}

