<#
.SYNOPSIS
    維護時間窗排程橋接入口
    本協作系統 V3.1.3 — Modules/Start-Maintenance.ps1

.DESCRIPTION
    作為 OS 層級進入點，喚醒並執行同目錄下的 maintenance_worker.js。
    可供 Windows 工作排程器 (Task Scheduler) 或系統總管直接呼叫。

    執行要求：
      - Node.js 必須已安裝並在 PATH 中可用。
      - 若 Node.js 未在 PATH，請修改 $NodePath 變數指向實際路徑。

.USAGE
    # 直接執行
    .\Modules\Start-Maintenance.ps1

    # 於 Windows 工作排程器中以下列命令呼叫：
    # 程式：powershell.exe
    # 引數：-NonInteractive -ExecutionPolicy Bypass -File "C:\...\Modules\Start-Maintenance.ps1"

.NOTES
    守門員準則合規：
      - 零散落原則：腳本落地於 Modules/，不置於根目錄。
      - 編碼規範：UTF-8 (無 BOM)，使用 LF 為主行尾。
      - DLP 防護：不含任何硬編碼憑證或 API Key。
#>

#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── 路徑解析 ─────────────────────────────────────────────────────────────────
$ScriptDir   = $PSScriptRoot
$WorkerPath  = Join-Path $ScriptDir 'maintenance_worker.js'
$LogDir      = Join-Path (Split-Path $ScriptDir -Parent) 'Data'
$LogFile     = Join-Path $LogDir "maintenance_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

# ── Node.js 路徑（可自訂，預設使用 PATH 中的 node）────────────────────────────
$NodePath = 'node'

# ── 前置驗證 ──────────────────────────────────────────────────────────────────
Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  本協作系統 維護時間窗 (Maintenance Window)"     -ForegroundColor Cyan
Write-Host "  啟動時間：$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan

# 確認 maintenance_worker.js 存在
if (-not (Test-Path $WorkerPath)) {
    Write-Error "❌ 找不到核心工作模組：$WorkerPath`n請確認 maintenance_worker.js 已正確部署於 Modules/ 目錄。"
    exit 1
}

# 確認 Node.js 可用
try {
    $nodeVersion = & $NodePath --version 2>&1
    Write-Host "✅ Node.js 版本：$nodeVersion"
} catch {
    Write-Error "❌ 無法執行 Node.js（路徑：$NodePath）。`n請確認 Node.js 已安裝並加入 PATH 環境變數。"
    exit 1
}

# 確認 Data/ 目錄存在（用於日誌）
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    Write-Host "📁 已建立 Data/ 目錄：$LogDir"
}

# ── 執行 maintenance_worker.js ────────────────────────────────────────────────
Write-Host "`n🚀 正在喚醒 maintenance_worker.js ..."
Write-Host "   工作模組路徑：$WorkerPath"
Write-Host "   執行日誌路徑：$LogFile`n"

try {
    # 同步執行：等待 Node.js 程序完成，標準輸出同時鏡像至終端與日誌檔
    & $NodePath $WorkerPath 2>&1 | Tee-Object -FilePath $LogFile

    $exitCode = $LASTEXITCODE

    Write-Host "`n──────────────────────────────────────────────────"
    if ($exitCode -eq 0) {
        Write-Host "✅ maintenance_worker.js 執行成功（Exit Code: $exitCode）" -ForegroundColor Green
    } else {
        Write-Warning "⚠️ maintenance_worker.js 以非零退出碼結束（Exit Code: $exitCode）"
        Write-Host "   詳細錯誤請查閱日誌：$LogFile"
    }

} catch {
    Write-Error "💥 喚醒 Node.js 工作模組時發生例外：$($_.Exception.Message)"
    exit 1
}

Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  維護時間窗作業結束：$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan

exit $exitCode
