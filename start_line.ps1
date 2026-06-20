# ==============================================================================
# start_line.ps1
# LINE Bot 完整啟動腳本 (Quick Tunnel + Bridge 一鍵啟動)
# 位置：專案根目錄 (與 cloudflared.exe 同層)
# 功能：
#   1. 清空 cloudflared_log.txt，啟動 cloudflared Quick Tunnel
#   2. 將 cloudflared 的所有輸出（含 URL）寫入 cloudflared_log.txt
#   3. 啟動 bridge.js（bridge 會自動讀取 log 偵測 URL 並更新 LINE Webhook）
# ==============================================================================

$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogFile     = Join-Path $ScriptDir "cloudflared_log.txt"
$BridgeDir   = Join-Path $ScriptDir "Modules\line-bot-project"
$Cloudflared = Join-Path $ScriptDir "cloudflared.exe"
$Port        = 3000

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Antigravity LINE Bot 啟動器 v2.0 (Auto-Heal 版)       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: 確認 cloudflared.exe 存在 ───────────────────────────────────────
if (-not (Test-Path $Cloudflared)) {
    Write-Host "❌ 找不到 cloudflared.exe，請確認檔案在根目錄：$ScriptDir" -ForegroundColor Red
    exit 1
}

# ── Step 2: 清空舊的 log（讓 bridge.js 能讀到最新的 URL）───────────────────
"" | Set-Content -Path $LogFile -Encoding UTF8
Write-Host "✅ cloudflared_log.txt 已清空，準備接收新的隧道 URL" -ForegroundColor Green

# ── Step 3: 啟動 cloudflared Quick Tunnel（背景執行，輸出寫入 log）──────────
Write-Host ""
Write-Host "🚀 正在啟動 Cloudflare Quick Tunnel (http://localhost:$Port)..." -ForegroundColor Yellow
Write-Host "   隧道 URL 將在幾秒後出現在 cloudflared_log.txt"
Write-Host ""

# 使用 Start-Process 在背景啟動，stdout + stderr 皆重導至 log 檔
$cfProcess = Start-Process -FilePath $Cloudflared `
    -ArgumentList "tunnel", "--url", "http://localhost:$Port", "--no-autoupdate" `
    -RedirectStandardOutput $LogFile `
    -RedirectStandardError $LogFile `
    -PassThru -NoNewWindow

Write-Host "✅ cloudflared 已啟動 (PID: $($cfProcess.Id))" -ForegroundColor Green
Write-Host "   等待 8 秒讓隧道建立..." -ForegroundColor DarkGray

# 等待 cloudflared 建立隧道並輸出 URL（通常需要 3-6 秒）
Start-Sleep -Seconds 8

# ── Step 4: 驗證 URL 是否成功寫入 log ────────────────────────────────────
$logContent = Get-Content $LogFile -Raw -ErrorAction SilentlyContinue
$urlMatch   = [regex]::Match($logContent, 'https://[a-z0-9-]+\.trycloudflare\.com')

if ($urlMatch.Success) {
    $tunnelUrl = $urlMatch.Value
    Write-Host ""
    Write-Host "🌐 Cloudflare 隧道已建立！" -ForegroundColor Green
    Write-Host "   公開網址：$tunnelUrl" -ForegroundColor Cyan
    Write-Host "   Webhook：$tunnelUrl/webhook" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   💡 bridge.js 將在啟動後 8 秒自動更新 LINE Webhook URL" -ForegroundColor DarkGray
} else {
    Write-Host ""
    Write-Host "⚠️  尚未偵測到隧道 URL（cloudflared 可能仍在建立中）" -ForegroundColor Yellow
    Write-Host "   bridge.js 的 Auto-Heal 將持續每 30 秒重試偵測" -ForegroundColor DarkGray
    Write-Host ""
}

# ── Step 5: 啟動 bridge.js（前景執行，可看到日誌輸出）───────────────────────
Write-Host "🚀 正在啟動 LINE Bridge (bridge.js)..." -ForegroundColor Yellow
Write-Host "   按 Ctrl+C 可停止 Bridge（cloudflared 將繼續在背景執行）"
Write-Host ""

Set-Location $BridgeDir
node bridge.js

# ── 清理：bridge 停止後同時結束 cloudflared ────────────────────────────────
Write-Host ""
Write-Host "⏹  LINE Bridge 已停止，正在關閉 Cloudflare Tunnel..." -ForegroundColor Yellow
if (-not $cfProcess.HasExited) {
    Stop-Process -Id $cfProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Host "✅ cloudflared (PID: $($cfProcess.Id)) 已關閉" -ForegroundColor Green
}
Write-Host ""
Write-Host "系統已完全停止。" -ForegroundColor DarkGray
