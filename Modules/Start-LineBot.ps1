# ==============================================================================
# Start-LineBot.ps1
# LINE Bot Startup Script (Quick Tunnel + Bridge)
# ==============================================================================

$ScriptDir     = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkspaceRoot = Split-Path -Parent $ScriptDir
$LogFile       = Join-Path $WorkspaceRoot "Data\logs\cloudflared_log.txt"
$BridgeDir     = Join-Path $WorkspaceRoot "skills\03_Execution\line-bot-zero-delay\line-bot-project"
$Cloudflared   = Join-Path $WorkspaceRoot "cloudflared.exe"
$Port          = 3000

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Antigravity LINE Bot Launcher v2.0 (Auto-Heal)         " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# -- Step 1: Check cloudflared.exe exists --
if (-not (Test-Path $Cloudflared)) {
    Write-Host "ERROR: cloudflared.exe not found in directory: $WorkspaceRoot" -ForegroundColor Red
    exit 1
}

# -- Step 2: Clear old log --
"" | Set-Content -Path $LogFile -Encoding UTF8
Write-Host "SUCCESS: cloudflared_log.txt cleared." -ForegroundColor Green

# -- Step 3: Start cloudflared Quick Tunnel in background --
Write-Host ""
Write-Host "Starting Cloudflare Quick Tunnel (http://localhost:$Port)..." -ForegroundColor Yellow
Write-Host "Tunnel URL will appear in cloudflared_log.txt shortly."
Write-Host ""

# Redirect stdout to a temp file, and stderr (which contains the tunnel URL) to the log file
$OutFile = Join-Path $WorkspaceRoot "Data\logs\cloudflared_out.txt"
$cfProcess = Start-Process -FilePath $Cloudflared `
    -ArgumentList "tunnel", "--url", "http://localhost:$Port", "--no-autoupdate" `
    -RedirectStandardOutput $OutFile `
    -RedirectStandardError $LogFile `
    -PassThru -NoNewWindow

Write-Host "SUCCESS: cloudflared started (PID: $($cfProcess.Id))" -ForegroundColor Green
Write-Host "Waiting 8 seconds for tunnel establishment..." -ForegroundColor DarkGray

Start-Sleep -Seconds 8

# -- Step 4: Verify URL in log --
$logContent = Get-Content $LogFile -Raw -ErrorAction SilentlyContinue
$urlMatch   = [regex]::Match($logContent, 'https://[a-z0-9-]+\.trycloudflare\.com')

if ($urlMatch.Success) {
    $tunnelUrl = $urlMatch.Value
    Write-Host ""
    Write-Host "Cloudflare Tunnel established!" -ForegroundColor Green
    Write-Host "Public URL: $tunnelUrl" -ForegroundColor Cyan
    Write-Host "Webhook: $tunnelUrl/webhook" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "bridge.js will auto-update LINE Webhook URL after startup." -ForegroundColor DarkGray
} else {
    Write-Host ""
    Write-Host "WARNING: Tunnel URL not detected yet (still starting up)." -ForegroundColor Yellow
    Write-Host "bridge.js Auto-Heal will retry detection every 30s." -ForegroundColor DarkGray
    Write-Host ""
}

# -- Step 5: Start bridge.js --
Write-Host "Starting LINE Bridge (bridge.js)..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop Bridge (cloudflared will also be stopped automatically)."
Write-Host ""

Set-Location $BridgeDir
if ($tunnelUrl) {
    $env:TUNNEL_URL = $tunnelUrl
}

# Use try/finally to build an absolute safety net
# Ensure cloudflared is cleaned up regardless of normal exit, crash, or Ctrl+C
try {
    node bridge.js
}
finally {
    Write-Host "`n[System Cleanup] Safely stopping Cloudflare Tunnel..." -ForegroundColor Yellow
    if ($cfProcess -and -not $cfProcess.HasExited) {
        Stop-Process -Id $cfProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "SUCCESS: cloudflared (PID: $($cfProcess.Id)) safely terminated." -ForegroundColor Green
    }
    Write-Host "System completely stopped." -ForegroundColor DarkGray
}
