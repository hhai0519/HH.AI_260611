param([switch]$Start)

$ScriptDir     = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkspaceRoot = Split-Path -Parent $ScriptDir
$BridgeDir     = Join-Path $WorkspaceRoot "skills\03_Execution\telegram-bot-cdp-bridge\telegram-bot-project"
$EcoConfig     = Join-Path $BridgeDir "ecosystem.telegram.config.js"
$LogsDir       = Join-Path $WorkspaceRoot "Data\logs"

$env:PM2_HOME  = Join-Path $env:USERPROFILE ".pm2"

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Magenta
Write-Host "   Antigravity Telegram Bot Manager V1.0 (PM2 Single-Core) " -ForegroundColor Magenta
Write-Host "===========================================================" -ForegroundColor Magenta
Write-Host ""

# 依賴檢查
Write-Host "正在檢查執行依賴環境..." -ForegroundColor Cyan
$testResult = node -e "try { require('better-sqlite3'); process.exit(0); } catch(e) { process.exit(1); }" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] better-sqlite3 尚未安裝，正在執行 npm install 自動安裝..." -ForegroundColor Yellow
    Set-Location $BridgeDir
    npm install
    Set-Location $WorkspaceRoot
}

if (-not (Test-Path $LogsDir)) { New-Item -Path $LogsDir -ItemType Directory -Force | Out-Null }

# CDP 埠 9229 前置檢測 (V14 .NET Socket 防卡死升級)
$cdpPort = $false
try {
    $tcp = [System.Net.Sockets.TcpClient]::new()
    $result = $tcp.BeginConnect("127.0.0.1", 9229, $null, $null)
    $success = $result.AsyncWaitHandle.WaitOne(1000)
    if ($success) {
        $cdpPort = $tcp.Connected
    }
    $tcp.Close()
} catch {
    $cdpPort = $false
}

if (-not $cdpPort) {
    Write-Host "" 
    Write-Host "⚠️  [WARNING] 偵測到 IDE CDP 埠 (Port 9229) 尚未開啟！ " -ForegroundColor Yellow
    Write-Host "    Telegram Bot 需要 CDP 才能控制瀏覽器。 " -ForegroundColor Yellow
    Write-Host "    請確認 Antigravity IDE 已以 CDP 偵錯模式啟動。 " -ForegroundColor Yellow
    Write-Host ""
    
    # 開機自啟動模式強制繞過阻塞
    if ($Start) {
        Write-Host "    [連鎖模式] 跳過確認，強制繼續執行..." -ForegroundColor Cyan
    } else {
        $confirm = Read-Host "仍要繼續啟動嗎？(y/N) "
        if ($confirm -ne "y" -and $confirm -ne "Y") { return }
    }
}

# V12 優化：改用結構化 JSON 解析，防範跨 App 狀態誤判 (避免 LINE 正常而 TG 離線時誤判 TG 在線)
$pm2Output = npx pm2 jlist 2>$null
$tgRunning = $false
if ($LASTEXITCODE -eq 0 -and $pm2Output) {
    try {
        $jsonStart = $pm2Output.IndexOf('[')
        if ($jsonStart -ge 0) {
            $cleanJson = $pm2Output.Substring($jsonStart)
            $apps = ConvertFrom-Json $cleanJson -ErrorAction Stop
            foreach ($app in $apps) {
                if ($app.name -eq "telegram-cdp-bridge" -and ($app.status -eq "online" -or $app.pm2_env.status -eq "online")) {
                    $tgRunning = $true
                }
            }
        }
    } catch {
        # 降級 fallback 正則，限定於同一物件邊界內
        if ($pm2Output -match '"name":"telegram-cdp-bridge"[^}]+"status":"online"') {
            $tgRunning = $true
        }
    }
}

if ($tgRunning -and -not $Start) {
    Write-Host "Telegram Bridge is running under PM2!" -ForegroundColor Green
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
        "2" { npx pm2 logs telegram-cdp-bridge --lines 50 }
        "3" { npx pm2 restart telegram-cdp-bridge; Write-Host "[OK] Telegram Bridge restarted" -ForegroundColor Green }
        "4" { npx pm2 stop telegram-cdp-bridge; Write-Host "[WARN] Telegram Bridge stopped" -ForegroundColor Yellow }
    }
} else {
    Write-Host "Starting Telegram Bridge via PM2..." -ForegroundColor Yellow
    Set-Location $BridgeDir
    npx pm2 delete telegram-cdp-bridge 2>$null
    npx pm2 start $EcoConfig
    npx pm2 save
    Set-Location $WorkspaceRoot
    Start-Sleep -Seconds 3
    npx pm2 list
}

