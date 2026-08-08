# ==============================================================================
# Register-StartupTask.ps1 (VBS Fallback Edition)
# Fallback: Creates invisible VBScripts in the Startup folder since 
# Task Scheduler requires Admin privileges.
# Delays 30 seconds for network and environment readiness.
# ==============================================================================
param([string]$Workspace = (Split-Path -Parent $PSScriptRoot))
if (-not $Workspace) { $Workspace = $PWD.Path }

$startupPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
$lineVbsPath = Join-Path $startupPath "Antigravity-LINE-Bridge.vbs"
$tgVbsPath = Join-Path $startupPath "Antigravity-TG-Bridge.vbs"

$startLineScript = Join-Path $Workspace "Modules\Start-LineBot.ps1"
$startTgScript = Join-Path $Workspace "Modules\Start-TelegramBot.ps1"

Write-Host "`n[ Register Startup VBScripts (Non-Admin Fallback / SOP14 Audited) ]`n" -ForegroundColor Cyan

# LINE VBScript
$lineVbsContent = @"
WScript.Sleep 30000
Set objShell = CreateObject("WScript.Shell")
objShell.Run "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File ""$startLineScript"" -Start", 0, False
"@

# TG VBScript
$tgVbsContent = @"
WScript.Sleep 35000
Set objShell = CreateObject("WScript.Shell")
objShell.Run "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File ""$startTgScript"" -Start", 0, False
"@

try {
    $lineVbsContent | Out-File -FilePath $lineVbsPath -Encoding ascii -Force
    $tgVbsContent | Out-File -FilePath $tgVbsPath -Encoding ascii -Force
    Write-Host "  [OK] LINE Startup VBScript created at: $lineVbsPath" -ForegroundColor Green
    Write-Host "  [OK] TG Startup VBScript created at: $tgVbsPath" -ForegroundColor Green
    exit 0
} catch {
    Write-Host "  [FAIL] Failed to create Startup VBScripts: $_" -ForegroundColor Red
    exit 1
}
