# ==============================================================================
# Register-StartupTask.ps1
# Create Windows Task Scheduler task (Replaces Startup folder .bat)
# Delays 60 seconds to ensure WSL2 Redis is ready
# ==============================================================================
param([string]$Workspace = (Split-Path -Parent $PSScriptRoot))
if (-not $Workspace) { $Workspace = $PWD.Path }

$taskName = "Antigravity-LINE-Bridge"
$bridgeDir = Join-Path $Workspace "skills\03_Execution\line-bot-zero-delay\line-bot-project"

Write-Host "`n[ Phase 2.5: Create Task Scheduler Task ]`n" -ForegroundColor Cyan

# Remove old task if exists
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

# Create Action
$action = New-ScheduledTaskAction `
    -Execute "cmd.exe" `
    -Argument "/c cd /D `"$bridgeDir`" && npx pm2 start ecosystem.config.js && npx pm2 save" `
    -WorkingDirectory $bridgeDir

# Create Trigger: At Startup, delay 60s
$trigger = New-ScheduledTaskTrigger -AtStartup
$trigger.Delay = "PT60S"

# Task Settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

# Register Task
Register-ScheduledTask `
    -TaskName $taskName `
    -Description "Antigravity LINE Bot PM2 Single-Core Startup (delay 60s for WSL2 Redis)" `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -RunLevel Highest `
    -Force | Out-Null

# Verify
$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($task) {
    Write-Host "  [OK] Task Scheduler task created: $taskName" -ForegroundColor Green
    exit 0
} else {
    Write-Host "  [FAIL] Failed to create Task Scheduler task" -ForegroundColor Red
    exit 1
}
