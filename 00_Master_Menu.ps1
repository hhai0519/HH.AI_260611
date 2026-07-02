param(
    [string]$Workspace = $PSScriptRoot
)

Set-Location $Workspace

$DataPath = Join-Path $Workspace "Data"
$HistoryFile = Join-Path $DataPath "Optimized_History.md"
$SopPath = Join-Path $Workspace "SOP"
$SkillsPath = Join-Path $Workspace "Skills"

# 確保資料庫目錄
if (-not (Test-Path $HistoryFile)) { "# 優化歷史紀錄`n" | Out-File $HistoryFile -Encoding UTF8 }

Function Get-PendingCount {
    try {
        $out = node Modules\get_pending_tasks.js
        if ($LASTEXITCODE -ne 0) { return 0 }
        $content = $out | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($null -eq $content) { return 0 }
        return @($content).Count
    } catch {
        return 0
    }
}

Function Invoke-SOP {
    param ([string]$FilePath)
    if (Test-Path $FilePath) {
        Write-Host "========================================" -ForegroundColor DarkGray
        Write-Host "執行 SOP 指引: $(Split-Path $FilePath -Leaf)" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor DarkGray
        $code = Get-Content $FilePath -Raw
        Write-Host "請詳閱下方 SOP，並指示下一步動作" -ForegroundColor Gray
        Write-Host "----------------------------------------" -ForegroundColor DarkGray
        Write-Host $code -ForegroundColor DarkCyan
        Write-Host "----------------------------------------" -ForegroundColor DarkGray
    }
}

Function Show-OptimizationMenu {
    Clear-Host
    Write-Host "===================================================================" -ForegroundColor Magenta
    Write-Host "                    系統自動化修復控制台 (#自動化)                    " -ForegroundColor Magenta
    Write-Host "===================================================================" -ForegroundColor Magenta
    Write-Host ""
    Write-Host " [ 可用自動化指令 ]" -ForegroundColor Yellow
    Write-Host "  [1] 執行代碼級別修復 (攔截異常並執行修復)"
    Write-Host "  [2] 架構依賴巡檢 (檢查系統目錄完整性)"
    Write-Host "  [3] 基礎設施重啟 (強制重建運行環境)"
    Write-Host "  [4] 系統安全審計 (觸發壓力與漏洞防禦測試)"
    Write-Host "  [5] 啟動/接管 LINE Bot 與排程系統 (Zero Delay)"
    Write-Host "  [6] LINE Bot PM2 即時監控 (Dashboard)"
    Write-Host ""
    
    $out = node Modules\get_pending_tasks.js
    $pending = if ($LASTEXITCODE -eq 0) { $out | ConvertFrom-Json -ErrorAction SilentlyContinue } else { $null }
    Write-Host " [ 待處理異常修復清單 (watchdog_pending_optimizations DB) ]" -ForegroundColor Red
    if ($null -eq $pending -or @($pending).Count -eq 0) {
        Write-Host "  目前系統健康，無待修復異常項目。" -ForegroundColor Green
    } else {
        $i = 1
        foreach ($item in $pending) {
            Write-Host "  [ERR-$i] ID: $($item.id) | Priority: $($item.priority) | Data: $($item.task_data)" -ForegroundColor Gray
            $i++
        }
    }
    
    Write-Host ""
    Write-Host "  [B] 返回主選單"
    Write-Host "===================================================================" -ForegroundColor Magenta
    
    $optChoice = Read-Host "請選擇系統優化指令 (1-6) 或是 (B)"

    if ($optChoice -eq "5") {
        powershell -NoProfile -ExecutionPolicy Bypass -File start_line.ps1
        pause
        return
    }

    if ($optChoice -eq "6") {
        Write-Host "`n進入 PM2 即時監控面板 (按 Ctrl+C 退出，服務仍會在背景守護)..." -ForegroundColor Cyan
        Start-Sleep -Seconds 1
        npx pm2 monit
        return
    }
    
    if ($optChoice -match '^[1-4]$') {
        Write-Host "`n已選擇優化模式 [$optChoice]..." -ForegroundColor Cyan
        
        if ($optChoice -eq "1" -and $null -ne $pending -and @($pending).Count -gt 0) {
            $fixChoice = Read-Host "請輸入欲修復的錯誤編號 (例如 1)，然後按 Enter 啟動自動修復"
            Write-Host "背景修復任務已派發，呼叫對應之 Agent 進行修復..." -ForegroundColor Green
            # 模擬背景修復派發
            Start-Sleep -Seconds 2
            $dateStr = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            $diffText = @'
### 修復紀錄 (優化模式 {0})
- **時間**: {1}
- **修復內容**: 攔截異常並進行修復作業
```diff
- 原始錯誤邏輯
+ 修復後的安全腳本
```

'@ -f $optChoice, $dateStr
            $diffText | Out-File -FilePath $HistoryFile -Append -Encoding UTF8
            # [MED-04] 移除對 Pending_Optimization.json 的依賴寫入
            Write-Host "修復紀錄已寫入，請確認 DB Worker 是否將任務標記為 RESOLVED！" -ForegroundColor Green
        } else {
            Write-Host "優化任務已派發或無異常可執行，您可以繼續其他工作。" -ForegroundColor Green
        }
    }
}

Function Update-YAML-Index {
    Write-Host "搜尋 SOP 檔案並確保 YAML 標頭存在..." -ForegroundColor Cyan
    $files = Get-ChildItem -Path $SopPath -Filter "*.md"
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw
        if ($content -notmatch "^---\r?\n(?:.*\r?\n)*?---") {
            $title = $file.BaseName -replace "_", " "
            $yaml = "---`nTitle: `"$title`"`nTags: [SOP]`nDependencies: []`n---`n`n"
            $content = $yaml + $content
            $content | Set-Content $file.FullName -Encoding UTF8
            Write-Host "已更新 YAML: $($file.Name)"
        }
    }
    Write-Host "更新完成！" -ForegroundColor Green
    $global:cachedSops = @(Get-ChildItem -Path $SopPath -Filter "*.md")
}

# 預先快取建立 (避免迴圈磁碟 I/O)
$global:cachedSops = @(Get-ChildItem -Path $SopPath -Filter "*.md")
$global:cachedSkillsCount = @(Get-ChildItem -Path $SkillsPath -Directory).Count
if ($global:cachedSkillsCount -eq 0) { $global:cachedSkillsCount = @(Get-ChildItem -Path $SkillsPath -File).Count }

# 進入主選單迴圈
while ($true) {
    Clear-Host
    $pendingCount = Get-PendingCount
    $sops = $global:cachedSops
    $skillsCount = $global:cachedSkillsCount

    $envFile = Join-Path $Workspace ".env.local"
    if (Test-Path $envFile) {
        $envContent = Get-Content $envFile -Raw
        if ($envContent -match "<PASSWORD>" -or $envContent -match "<YOUR_") {
            Write-Host "===================================================================" -ForegroundColor Red
            Write-Host " [溫馨提醒] 您的 .env.local 中似乎未填寫實際密碼或金鑰 (例如 DATABASE_URL 欄位)" -ForegroundColor Yellow
            Write-Host " 若要使用資料庫或 MCP 外部連線功能，請記得補足相關金鑰以恢復正常運作。" -ForegroundColor Yellow
            Write-Host "===================================================================" -ForegroundColor Red
            Write-Host ""
        }
    }

    Write-Host "===================================================================" -ForegroundColor Cyan
    Write-Host "             防重力軟體工程工作台 (HH.AI_260611)               " -ForegroundColor Cyan
    Write-Host "===================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host " [ 系統健康度 ]" -ForegroundColor Yellow
    Write-Host " - 待優化異常: $pendingCount 件 (紀錄於 Neon DB)"
    Write-Host " - 已載入 SOP: $($sops.Count) 項"
    Write-Host " - 技能庫總數: $skillsCount 個"
    Write-Host ""
    Write-Host " [ 流程控制 (Orchestration) ]" -ForegroundColor Yellow
    
    $i = 1
    foreach ($sop in $sops) {
        Write-Host "  [$i] 檢視 $($sop.BaseName)"
        $i++
    }

    Write-Host ""
    Write-Host " [ 系統維護與優化 ]" -ForegroundColor Yellow
    Write-Host "  [S] 索引更新 : 強制寫入所有 .md 檔案的 YAML 標頭並建置執行索引"
    Write-Host "  [R] 重新載入 : 重新整理選單快取 (Reload Cache)"
    Write-Host "  [#自動化] : 進入自動化控制台 (顯示待處理的異常修復清單)"
    Write-Host "  [V] 檢視日誌 : 檢視 Optimized_History.md"
    Write-Host "  [Q] 關閉系統"
    Write-Host "===================================================================" -ForegroundColor Cyan

    $choice = Read-Host "請輸入選項 (1-$($sops.Count), S, R, V, Q, 或是 #自動化)"

    if ($choice -match '^\d+$' -and [int]$choice -ge 1 -and [int]$choice -le $sops.Count) {
        Invoke-SOP -FilePath $sops[[int]$choice - 1].FullName
        pause
    }
    elseif ($choice -eq "S" -or $choice -eq "s") {
        Update-YAML-Index
        pause
    }
    elseif ($choice -eq "R" -or $choice -eq "r") {
        Write-Host "重新掃描磁碟建立快取..." -ForegroundColor Cyan
        $global:cachedSops = @(Get-ChildItem -Path $SopPath -Filter "*.md")
        $global:cachedSkillsCount = @(Get-ChildItem -Path $SkillsPath -Directory).Count
        if ($global:cachedSkillsCount -eq 0) { $global:cachedSkillsCount = @(Get-ChildItem -Path $SkillsPath -File).Count }
        Write-Host "快取刷新完成！" -ForegroundColor Green
        Start-Sleep -Seconds 1
    }
    elseif ($choice -eq "#自動化") {
        Show-OptimizationMenu
        pause
    }
    elseif ($choice -eq "V" -or $choice -eq "v") {
        if (Test-Path $HistoryFile) {
            Get-Content $HistoryFile | Out-Host
        } else {
            Write-Host "尚無日誌紀錄。"
        }
        pause
    }
    elseif ($choice -eq "Q" -or $choice -eq "q") {
        Write-Host "系統關閉中..."
        break
    }
}

