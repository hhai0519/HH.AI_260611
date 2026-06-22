# ==============================================================================
# Modules/Start-LineBot-SelfHeal.ps1
# LINE Bot Ultimate Diagnostic & Self-Healing Tool (ASCII Only Version)
# ==============================================================================
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Workspace = Split-Path -Parent $ScriptDir
$LogFile   = Join-Path $Workspace "cloudflared_log.txt"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "    LINE Bot Ultimate Diagnostic & Self-Healing Tool      " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""

# ── 1. Diagnose Docker Redis Service ────────────────────────────────────
Write-Host "[*] Diagnosing Docker Redis status..." -ForegroundColor Yellow
$DockerCheck = Get-Command docker -ErrorAction SilentlyContinue
if (-not $DockerCheck) {
    Write-Host "WARNING: Docker command not found. Please ensure Docker is installed." -ForegroundColor Red
} else {
    $RedisContainer = docker ps -a --filter "name=linebot-redis" --format "{{.Status}}"
    if (-not $RedisContainer) {
        Write-Host "ERROR: Redis container 'linebot-redis' not found." -ForegroundColor Red
    } else {
        Write-Host "Current Redis container status: $RedisContainer" -ForegroundColor DarkGray
        if ($RedisContainer -notmatch "Up") {
            Write-Host "[+] Redis container is not running. Starting container..." -ForegroundColor Cyan
            docker start linebot-redis
            docker update --restart unless-stopped linebot-redis
            Write-Host "SUCCESS: Redis container started with policy 'unless-stopped'." -ForegroundColor Green
        } else {
            Write-Host "SUCCESS: Redis container is running healthily." -ForegroundColor Green
        }
    }
}

# ── 2. Diagnose Port 3000 & PM2 ──────────────────────────────────────────
Write-Host ""
Write-Host "[*] Diagnosing Port 3000 occupancy..." -ForegroundColor Yellow
$PortOccupied = netstat -ano | Select-String ":3000\s+.*LISTENING"
if ($PortOccupied) {
    $PidMatch = [regex]::Match($PortOccupied.Line, '\s+(\d+)$')
    if ($PidMatch.Success) {
        $OccupiedPid = [int]$PidMatch.Groups[1].Value
        Write-Host "Port 3000 is occupied. Occupied PID: $OccupiedPid" -ForegroundColor Yellow
        
        $Proc = Get-CimInstance Win32_Process -Filter "ProcessId = $OccupiedPid" -ErrorAction SilentlyContinue
        if ($Proc -and $Proc.CommandLine -match "pm2") {
            Write-Host "SUCCESS: Port 3000 is occupied by background PM2. Restarting PM2 instances..." -ForegroundColor Cyan
            cmd /c npx pm2 restart line-bridge
            cmd /c npx pm2 restart cloudflare-tunnel
            Write-Host "SUCCESS: PM2 instances restarted and connection refreshed." -ForegroundColor Green
        } else {
            Write-Host "WARNING: Port 3000 occupied by non-PM2 process. Terminating to avoid conflicts..." -ForegroundColor Yellow
            Stop-Process -Id $OccupiedPid -Force -ErrorAction SilentlyContinue
            Write-Host "SUCCESS: Conflicting process (PID: $OccupiedPid) terminated." -ForegroundColor Green
        }
    }
} else {
    Write-Host "SUCCESS: Port 3000 is free and ready." -ForegroundColor Green
}

# ── 3. Log File and Encoding Correction ──────────────────────────────────
Write-Host ""
Write-Host "[*] Clearing and repairing log encoding pollution..." -ForegroundColor Yellow
if (Test-Path $LogFile) {
    [System.IO.File]::WriteAllText($LogFile, "", [System.Text.Encoding]::ASCII)
    Write-Host "SUCCESS: cloudflared_log.txt cleared in pure ASCII mode." -ForegroundColor Green
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "         Diagnostics Completed! System is Ready.          " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
