# ==============================================================================
# nlm_auth_watchdog.ps1
# NotebookLM MCP 認證狀態自動監控器 (Auth Watchdog)
# 位置：Modules/nlm_auth_watchdog.ps1
# 依據：SOP_02 §5 + KI: notebooklm-auth-sop/artifacts/sop.md
# 規範：禁止硬編碼使用者路徑，一律使用環境變數
# 版本：1.0.0 | 建立日期：2026-06-20
# ==============================================================================

param(
    [int]$IntervalSeconds = 300,   # 預設每 5 分鐘檢查一次
    [switch]$RunOnce               # 加此參數則只執行一次後退出
)

# ── 路徑設定（禁止硬編碼，使用環境變數）────────────────────────────────────
$UserProfile    = $env:USERPROFILE
$GeminiDir      = Join-Path $UserProfile ".gemini"
$McpCachePath   = Join-Path $GeminiDir "antigravity-ide\mcp\notebooklm"
$AuthTokenFile  = Join-Path $McpCachePath "auth_tokens.json"

# LINE Bot 通知端點（若 bridge 在執行中則可推播）
$BridgeEndpoint = "http://localhost:3000/api/outbox"
$AllowedUserId  = $env:LINE_ALLOWED_USER_ID

# ── 函式：讀取 auth_status ───────────────────────────────────────────────────
function Get-NLMAuthStatus {
    if (-not (Test-Path $AuthTokenFile)) {
        return "missing"
    }
    try {
        $tokenData = Get-Content $AuthTokenFile -Raw | ConvertFrom-Json
        $status = $tokenData.auth_status
        if ($null -eq $status) { return "unknown" }
        return $status
    } catch {
        return "parse_error"
    }
}

# ── 函式：發送 LINE 通知（需 bridge 正在執行）────────────────────────────────
function Send-LineNotification {
    param([string]$Message)
    if (-not $AllowedUserId) {
        Write-Host "[WATCHDOG] LINE_ALLOWED_USER_ID 未設定，跳過推播" -ForegroundColor Yellow
        return
    }
    try {
        $body = @{ userId = $AllowedUserId; text = $Message } | ConvertTo-Json
        Invoke-RestMethod -Uri $BridgeEndpoint -Method Post `
            -Body $body -ContentType "application/json" -TimeoutSec 5 | Out-Null
        Write-Host "[WATCHDOG] LINE 通知已發送" -ForegroundColor Green
    } catch {
        Write-Host "[WATCHDOG] LINE 通知失敗（bridge 可能未啟動）：$($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# ── 函式：主要檢查邏輯 ───────────────────────────────────────────────────────
function Invoke-AuthCheck {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $status = Get-NLMAuthStatus

    switch ($status) {
        "active" {
            Write-Host "[$timestamp] [WATCHDOG] ✅ NotebookLM 認證狀態正常 (active)" -ForegroundColor Green
        }
        "stale" {
            Write-Host "[$timestamp] [WATCHDOG] ⚠️  NotebookLM 認證已過期 (stale)！" -ForegroundColor Red
            $msg = "⚠️ [系統警報] NotebookLM MCP 認證已過期 (stale)！`n`n請依照 SOP 執行修復：`n1. 在 Chrome 開啟 notebooklm.google.com 並確認已登入`n2. 執行 nlm login 重新取得 Cookie`n3. 確認 auth_status 變為 active"
            Send-LineNotification -Message $msg
            # 同時寫入本地警告日誌
            $logPath = Join-Path $McpCachePath "watchdog_alerts.log"
            "[$timestamp] STALE AUTH DETECTED" | Add-Content -Path $logPath -Encoding UTF8
        }
        "missing" {
            Write-Host "[$timestamp] [WATCHDOG] ❓ 找不到 auth_tokens.json，可能從未登入" -ForegroundColor Yellow
        }
        default {
            Write-Host "[$timestamp] [WATCHDOG] ❓ 未知狀態：$status" -ForegroundColor Yellow
        }
    }
}

# ── 主程式 ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  NotebookLM Auth Watchdog v1.0.0 已啟動          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "  監控路徑：$AuthTokenFile"
Write-Host "  檢查間隔：$IntervalSeconds 秒"
Write-Host ""

if ($RunOnce) {
    Invoke-AuthCheck
    exit
}

# 持續監控模式
while ($true) {
    Invoke-AuthCheck
    Start-Sleep -Seconds $IntervalSeconds
}
