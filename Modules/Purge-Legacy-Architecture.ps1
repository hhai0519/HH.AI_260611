# ==============================================================================
# Purge-Legacy-Architecture.ps1
# Nuclear Purge: Eliminate legacy architecture residues
# ==============================================================================
param([string]$Workspace = (Split-Path -Parent $PSScriptRoot))
if (-not $Workspace) { $Workspace = $PWD.Path }
Set-Location $Workspace

Write-Host "`n[ Phase 1: Nuclear Purge ]`n" -ForegroundColor Red

# Step 1: Destroy all old PM2 states
Write-Host "[1/6] Destroying old PM2 configurations..." -ForegroundColor Cyan
npx pm2 delete all 2>$null
npx pm2 save --force 2>$null
npx pm2 kill 2>$null
Write-Host "  [OK] PM2 config cleared" -ForegroundColor Green

# Step 2: WMI targeted kill - Cloudflared
Write-Host "[2/6] WMI targeted kill: Cloudflared..." -ForegroundColor Cyan
$cfProcs = Get-CimInstance Win32_Process -Filter "Name = 'cloudflared.exe' AND CommandLine LIKE '%tunnel%--url%'" -ErrorAction SilentlyContinue
foreach ($p in $cfProcs) {
    Invoke-CimMethod -InputObject $p -MethodName Terminate | Out-Null
    Write-Host "  [OK] Terminated cloudflared PID: $($p.ProcessId)" -ForegroundColor Green
}
if (-not $cfProcs) { Write-Host "  [-] No residual cloudflared" -ForegroundColor DarkGray }

# Step 3: WMI targeted kill - Pinggy SSH
Write-Host "[3/6] WMI targeted kill: Pinggy SSH..." -ForegroundColor Cyan
$sshProcs = Get-CimInstance Win32_Process -Filter "Name = 'ssh.exe' AND CommandLine LIKE '%a.pinggy.io%'" -ErrorAction SilentlyContinue
foreach ($p in $sshProcs) {
    Invoke-CimMethod -InputObject $p -MethodName Terminate | Out-Null
    Write-Host "  [OK] Terminated ssh (Pinggy) PID: $($p.ProcessId)" -ForegroundColor Green
}
if (-not $sshProcs) { Write-Host "  [-] No residual Pinggy" -ForegroundColor DarkGray }

# Step 4: Release Port 3000
Write-Host "[4/6] Releasing Port 3000..." -ForegroundColor Cyan
$port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
foreach ($tcp in $port3000) {
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $($tcp.OwningProcess)"
    if ($proc.CommandLine -match 'bridge\.js') {
        Invoke-CimMethod -InputObject $proc -MethodName Terminate | Out-Null
        Write-Host "  [OK] Released Port 3000 (PID: $($tcp.OwningProcess))" -ForegroundColor Green
    }
}
if (-not $port3000) { Write-Host "  [-] Port 3000 already free" -ForegroundColor DarkGray }

# Step 5: Remove PM2 unstartup
Write-Host "[5/6] Removing PM2 old startup..." -ForegroundColor Cyan
npx pm2 unstartup 2>$null
Write-Host "  [OK] PM2 unstartup executed" -ForegroundColor Green

# Step 6: Clear Startup folder ghosts
Write-Host "[6/6] Clearing Startup folder ghosts..." -ForegroundColor Cyan
$startupPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
$ghosts = @("pm2_startup.bat", "LINE_Bot_AutoHeal.lnk")
foreach ($ghost in $ghosts) {
    $ghostPath = Join-Path $startupPath $ghost
    if (Test-Path $ghostPath) {
        Remove-Item $ghostPath -Force
        Write-Host "  [OK] Cleared ghost: $ghost" -ForegroundColor Green
    } else {
        Write-Host "  [-] Not found: $ghost" -ForegroundColor DarkGray
    }
}

# Final Verification
Start-Sleep -Seconds 2
$remaining = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($remaining) {
    Write-Host "`n[WARNING] Port 3000 is still occupied!" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "`n[OK] Phase 1 Complete: System purged, Port 3000 free" -ForegroundColor Green
    exit 0
}
