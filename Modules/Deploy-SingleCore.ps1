# ==============================================================================
# Deploy-SingleCore.ps1 — One-click deploy single core PM2 architecture (V2.0)
# ==============================================================================
param([string]$Workspace = (Split-Path -Parent $PSScriptRoot))
if (-not $Workspace) { $Workspace = $PWD.Path }

$ErrorActionPreference = "Continue"
$LogsDir = Join-Path $Workspace "Data\logs"
$BridgeDir = Join-Path $Workspace "skills\03_Execution\line-bot-zero-delay\line-bot-project"

Write-Host "`n[ Antigravity Deploy: Single-Core PM2 Architecture ]`n" -ForegroundColor Magenta

# Phase 0
Write-Host "=== Phase 0: Snapshot ===" -ForegroundColor Yellow
& (Join-Path $Workspace "Modules\Snapshot-Before-Deploy.ps1") -Workspace $Workspace

# Phase 1 & 1.5
Write-Host "`n=== Phase 1: Nuclear Purge ===" -ForegroundColor Yellow
& (Join-Path $Workspace "Modules\Purge-Legacy-Architecture.ps1") -Workspace $Workspace
if ($LASTEXITCODE -ne 0) { Write-Error "Phase 1 Failed"; exit 1 }

if (-not (Test-Path $LogsDir)) { New-Item -Path $LogsDir -ItemType Directory -Force | Out-Null }

# Phase 2
Write-Host "`n=== Phase 2: Deploy PM2 Ecosystem ===" -ForegroundColor Yellow
Set-Location $BridgeDir
npx pm2 delete line-bridge 2>$null
npx pm2 start ecosystem.config.js
npx pm2 save
Set-Location $Workspace
Write-Host "  [OK] PM2 ecosystem deployed" -ForegroundColor Green

# Phase 2.5
Write-Host "`n=== Phase 2.5: Register Task Scheduler ===" -ForegroundColor Yellow
& (Join-Path $Workspace "Modules\Register-StartupTask.ps1") -Workspace $Workspace

Write-Host "`n=== Waiting 8 seconds for stability ===" -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Phase 9: Verification
Write-Host "`n=== Phase 9: Architecture Verification ===" -ForegroundColor Yellow
& (Join-Path $Workspace "Modules\Verify-Architecture.ps1")
if ($LASTEXITCODE -ne 0) { Write-Error "Verification Failed"; exit 1 }

Write-Host "`n=== Post-Deploy Deep Audit ===" -ForegroundColor Yellow
$auditPassed = $true

$pm2Output = npx pm2 jlist 2>$null
if ($pm2Output -match '"name":"line-bridge"' -and $pm2Output -match '"status":"online"') {
    Write-Host "  [OK] line-bridge is online" -ForegroundColor Green
} else { Write-Warning "  [FAIL] line-bridge offline"; $auditPassed = $false }

if ($pm2Output -match '"name":"cloudflare-tunnel"') {
    Write-Warning "  [FAIL] Legacy cloudflare-tunnel detected"; $auditPassed = $false
} else { Write-Host "  [OK] No cloudflare-tunnel" -ForegroundColor Green }

$port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($port3000) { Write-Host "  [OK] Port 3000 bound" -ForegroundColor Green }
else { Write-Warning "  [FAIL] Port 3000 not bound"; $auditPassed = $false }

$sshProc = Get-CimInstance Win32_Process -Filter "Name = 'ssh.exe' AND CommandLine LIKE '%a.pinggy.io%'" -ErrorAction SilentlyContinue
if ($sshProc) { Write-Host "  [OK] Pinggy SSH tunnel established" -ForegroundColor Green }
else { Write-Host "  [WARN] Pinggy SSH tunnel still establishing" -ForegroundColor Yellow }

$vbsPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Antigravity-LINE-Bridge.vbs"
if (Test-Path $vbsPath) { Write-Host "  [OK] Startup VBScript exists" -ForegroundColor Green }
else { Write-Warning "  [FAIL] Startup VBScript missing"; $auditPassed = $false }

$startupPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
$noGhosts = $true
foreach ($g in @("pm2_startup.bat", "LINE_Bot_AutoHeal.lnk")) {
    if (Test-Path (Join-Path $startupPath $g)) { $noGhosts = $false }
}
if ($noGhosts) { Write-Host "  [OK] Startup ghosts cleared" -ForegroundColor Green }
else { Write-Warning "  [FAIL] Startup ghosts remain"; $auditPassed = $false }

if ($auditPassed) {
    Write-Host "`n[ DEPLOYMENT SUCCESS: Single-Core Architecture Online ]" -ForegroundColor Green
} else {
    Write-Host "`n[ DEPLOYMENT FAILED: Check logs above ]" -ForegroundColor Red
    exit 1
}
