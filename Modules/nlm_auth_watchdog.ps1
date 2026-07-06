# ==============================================================================
# nlm_auth_watchdog.ps1
# NotebookLM MCP Auth Watchdog
# Location: Modules/nlm_auth_watchdog.ps1
# ==============================================================================

param(
    [int]$IntervalSeconds = 300,
    [switch]$RunOnce
)

$UserProfile    = $env:USERPROFILE
$GeminiDir      = Join-Path $UserProfile ".gemini"
$McpCachePath   = Join-Path $GeminiDir "antigravity-ide\mcp\notebooklm"
$AuthTokenFile  = Join-Path $McpCachePath "auth_tokens.json"

$BridgeEndpoint = "http://localhost:3000/api/local-notify"
$AllowedUserId  = $env:LINE_ALLOWED_USER_ID

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

function Send-LineNotification {
    param([string]$Message)
    if (-not $AllowedUserId) {
        Write-Host "[WATCHDOG] LINE_ALLOWED_USER_ID not set, skipping notify." -ForegroundColor Yellow
        return
    }
    try {
        $body = @{ userId = $AllowedUserId; text = $Message } | ConvertTo-Json
        Invoke-RestMethod -Uri $BridgeEndpoint -Method Post -Body $body -ContentType "application/json" -TimeoutSec 5 -ErrorAction Stop | Out-Null
        Write-Host "[WATCHDOG] Notification sent successfully." -ForegroundColor Green
    } catch {
        Write-Host "[WATCHDOG] Notification failed. Bridge might be down." -ForegroundColor Yellow
    }
}

function Invoke-AuthCheck {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $status = Get-NLMAuthStatus
    $alertLog = Join-Path $McpCachePath "watchdog_alerts.log"

    if (Test-Path $alertLog) {
        $fileSize = (Get-Item $alertLog).Length
        if ($fileSize -gt 1MB) {
            Clear-Content -Path $alertLog
            "[$timestamp] ALERT LOG ROTATED" | Add-Content -Path $alertLog -Encoding UTF8
        }
    }

    switch ($status) {
        "active" {
            Write-Host "[$timestamp] [WATCHDOG] OK: NotebookLM auth is active" -ForegroundColor Green
            "[$timestamp] [ACTIVE_RESET]" | Add-Content -Path $alertLog -Encoding UTF8
        }
        "stale" {
            Write-Host "[$timestamp] [WATCHDOG] WARN: NotebookLM auth is STALE" -ForegroundColor Red
            
            $lastAlertTime = $null
            $forceAlert = $true
            
            if (Test-Path $alertLog) {
                $lines = Get-Content $alertLog -Tail 5
                for ($i = $lines.Count - 1; $i -ge 0; $i--) {
                    if ($lines[$i] -match "\[(.*?)\] \[ACTIVE_RESET\]") {
                        $forceAlert = $true
                        break
                    }
                    if ($lines[$i] -match "\[(.*?)\] STALE ALERT SENT") {
                        $lastAlertTime = [datetime]::ParseExact($Matches[1], "yyyy-MM-dd HH:mm:ss", $null)
                        $forceAlert = $false
                        break
                    }
                }
            }

            if ($forceAlert -or $null -eq $lastAlertTime -or ((Get-Date) - $lastAlertTime).TotalSeconds -gt 86400) {
                $msg = "SYSTEM ALERT: NotebookLM MCP auth is stale!"
                Send-LineNotification -Message $msg
                "[$timestamp] STALE ALERT SENT" | Add-Content -Path $alertLog -Encoding UTF8
            } else {
                Write-Host "[WATCHDOG] In cooldown period. Skipping duplicate alert." -ForegroundColor Yellow
            }
        }
        "missing" {
            Write-Host "[$timestamp] [WATCHDOG] missing auth_tokens.json" -ForegroundColor Yellow
        }
        default {
            Write-Host "[$timestamp] [WATCHDOG] Unknown status: $status" -ForegroundColor Yellow
        }
    }
}

Write-Host "Starting Watchdog v1.0.0" -ForegroundColor Cyan

if ($RunOnce) {
    Invoke-AuthCheck
    exit 0
}

while ($RunOnce -eq $false) {
    Invoke-AuthCheck
    Start-Sleep -Seconds $IntervalSeconds
}
