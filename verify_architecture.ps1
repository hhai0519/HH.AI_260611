# =========================================================================
# Architecture Watchdog Linter (verify_architecture.ps1)
# =========================================================================
# 驗證 Modules/ 目錄的純潔性，防止 Agent 亂塞專案。

$ErrorActionPreference = "Stop"
$workspaceRoot = $PSScriptRoot

# 檢查 Modules 目錄
$modulesPath = Join-Path $workspaceRoot "Modules"
if (Test-Path $modulesPath) {
    # 避開 Get-ChildItem -Recurse bug，使用 Pipeline Filtering
    $subDirs = Get-ChildItem -Path $modulesPath | Where-Object { $_.PSIsContainer }
    if ($subDirs.Count -gt 0) {
        $dirNames = $subDirs.Name -join ", "
        Write-Error "ArchitectureViolation: Modules/ 目錄下嚴禁存在子目錄！發現非法目錄: $dirNames"
        exit 1
    }

    $allowedJsFiles = @("db_state_manager.js", "maintenance_worker.js", "quota_manager.js", "sop_router.js")
    $invalidFiles = Get-ChildItem -Path $modulesPath -File | Where-Object { $_.Extension -ne ".ps1" -and $_.Name -notin $allowedJsFiles }
    if ($invalidFiles.Count -gt 0) {
        $fileNames = $invalidFiles.Name -join ", "
        Write-Error "ArchitectureViolation: Modules/ 目錄下只能存放 .ps1 腳本或核心系統白名單 .js！發現非法檔案: $fileNames"
        exit 1
    }
}

Write-Host "✅ Architecture Linter Check Passed." -ForegroundColor Green
exit 0
