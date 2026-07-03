# ==============================================================================
# Register-StartupTask.ps1 (VBS Fallback Edition)
# Fallback: Creates an invisible VBScript in the Startup folder since 
# Task Scheduler requires Admin privileges.
# Delays 60 seconds to ensure WSL2 Redis is ready.
# ==============================================================================
param([string]$Workspace = (Split-Path -Parent $PSScriptRoot))
if (-not $Workspace) { $Workspace = $PWD.Path }

$bridgeDir = Join-Path $Workspace "skills\03_Execution\line-bot-zero-delay\line-bot-project"
$startupPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
$vbsPath = Join-Path $startupPath "Antigravity-LINE-Bridge.vbs"

$startScriptPath = Join-Path $Workspace "Modules\Start-LineBot.ps1"

Write-Host "`n[ Phase 2.5: Create Startup VBScript (Non-Admin Fallback / SOP14 Audited) ]`n" -ForegroundColor Cyan

# VBScript content: Sleep 60s, then run Start-LineBot.ps1 invisibly
$vbsContent = @"
WScript.Sleep 60000
Set objShell = CreateObject("WScript.Shell")
objShell.Run "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File ""$startScriptPath"" -Start", 0, False
"@

try {
    $vbsContent | Out-File -FilePath $vbsPath -Encoding ascii -Force
    Write-Host "  [OK] Startup VBScript created at: $vbsPath" -ForegroundColor Green
    exit 0
} catch {
    Write-Host "  [FAIL] Failed to create VBScript: $_" -ForegroundColor Red
    exit 1
}
