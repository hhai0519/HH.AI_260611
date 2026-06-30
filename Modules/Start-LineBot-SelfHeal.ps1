# §7.3 SOP_00 V3.0.0 強制 UTF-8 宣告 — 置於腳本第一行，禁止省略
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8

param(
    [string]$Workspace = $PSScriptRoot
)

# 如果直接執行此腳本，可能 Workspace 解析錯誤，強制切換回專案根目錄 (Desktop/HH.AI_260611)
$RootDir = Split-Path $PSScriptRoot -Parent
Set-Location $RootDir

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "          [系統] LINE Bot Auto-Heal & Infrastructure Recovery      " -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan

# 階段 1：環境清理 (精準狙擊與 PID 單例模式)
Write-Host "[1/3] 正在清理殘留的內網穿透與背景服務..." -ForegroundColor Yellow
$PidFile = Join-Path $RootDir ".tunnel_daemon.pid"
if (Test-Path $PidFile) {
    $oldPid = Get-Content $PidFile
    Stop-Process -Id $oldPid -Force -ErrorAction SilentlyContinue
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
}
# 只殺連向 Pinggy 的 SSH
Get-CimInstance Win32_Process -Filter "Name = 'ssh.exe' AND CommandLine LIKE '%a.pinggy.io%'" | Invoke-CimMethod -MethodName Terminate | Out-Null

# 尋找並砍掉卡死的 bridge.js 或 start_line.js
Get-CimInstance Win32_Process -Filter "Name = 'node.exe' AND CommandLine LIKE '%bridge.js%'" | Invoke-CimMethod -MethodName Terminate | Out-Null
Get-CimInstance Win32_Process -Filter "Name = 'node.exe' AND CommandLine LIKE '%start_line.js%'" | Invoke-CimMethod -MethodName Terminate | Out-Null

# [新增] 撲殺舊版架構遺留的隱形 PowerShell 看門狗 (母體)
Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe' AND CommandLine LIKE '%TunnelDaemonScript%'" | Invoke-CimMethod -MethodName Terminate | Out-Null
Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe' AND CommandLine LIKE '%cloudflared_log.txt%'" | Invoke-CimMethod -MethodName Terminate | Out-Null
Start-Sleep -Seconds 2

# 階段 2：清理舊日誌與切換控制權
Write-Host "[2/3] 正在將 Pinggy 控制權移交給 Node.js Bridge..." -ForegroundColor Yellow
$LogFile = Join-Path $RootDir "cloudflared_log.txt"
if (Test-Path $LogFile) { Remove-Item $LogFile -Force -ErrorAction SilentlyContinue }
if (Test-Path "$LogFile.err") { Remove-Item "$LogFile.err" -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 1

# 階段 3：彈出開發者終端機 (Bridge 與 Manager)
Write-Host "[3/3] 正在啟動 LINE Bridge 與 萬能總管大腦..." -ForegroundColor Yellow
$BotDir = Join-Path $RootDir "skills\03_Execution\line-bot-zero-delay\line-bot-project"

# 啟動 Bridge (負責 Auto-Heal 更新 Webhook)
$BridgeCmd = "`$host.ui.RawUI.WindowTitle = '[LINE Bridge Server]'; `$host.ui.RawUI.ForegroundColor = 'Cyan'; Write-Host 'Starting Bridge Service...'; node bridge.js"
$BridgeBytes = [System.Text.Encoding]::Unicode.GetBytes($BridgeCmd)
$BridgeEncoded = [Convert]::ToBase64String($BridgeBytes)
Start-Process powershell -ArgumentList "-NoExit -EncodedCommand $BridgeEncoded" -WorkingDirectory $BotDir

Start-Sleep -Seconds 2

# 啟動萬能總管 (負責接手對話)
$ManagerCmd = "`$host.ui.RawUI.WindowTitle = '[Master Orchestrator]'; `$host.ui.RawUI.ForegroundColor = 'Green'; Write-Host 'Starting Master Controller...'; node start_line.js Antigravity Master_Mode"
$ManagerBytes = [System.Text.Encoding]::Unicode.GetBytes($ManagerCmd)
$ManagerEncoded = [Convert]::ToBase64String($ManagerBytes)
Start-Process powershell -ArgumentList "-NoExit -EncodedCommand $ManagerEncoded" -WorkingDirectory $BotDir

Write-Host ""
Write-Host "Startup procedure complete! Please check the new window for Webhook update success." -ForegroundColor Green
Write-Host "===================================================================" -ForegroundColor Cyan
Start-Sleep -Seconds 2
