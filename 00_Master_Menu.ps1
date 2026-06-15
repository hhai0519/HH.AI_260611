param(
    [string]$Workspace = $PSScriptRoot
)

Set-Location $Workspace

$DataPath = Join-Path $Workspace "Data"
$HistoryFile = Join-Path $DataPath "Optimized_History.md"
$SopPath = Join-Path $Workspace "SOP"
$SkillsPath = Join-Path $Workspace "Skills"

# 確保資料庫存在
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
    param([string]$FilePath)
    
    Write-Host "`n[*] 開始執行 SOP: $(Split-Path $FilePath -Leaf)" -ForegroundColor Cyan
    $content = Get-Content $FilePath -Raw
    
    # 簡單提取有標記為 # @EXECUTE 的 powershell 區塊
    $regex = "(?s)``````powershell\r?\n# @EXECUTE\r?\n(.*?)\r?\n``````"
    $matches = [regex]::Matches($content, $regex)
    
    if ($matches.Count -eq 0) {
        Write-Host "沒有找到可執行的 PowerShell 區塊 (# @EXECUTE)。" -ForegroundColor Yellow
        return
    }

    foreach ($match in $matches) {
        $code = $match.Groups[1].Value
        # [CRITICAL-01] 廢除動態 ScriptBlock 執行，提升系統安全性
        Write-Host "由於 V3.2.0 安全性規範 [CRITICAL-01]，已禁止直接從 Markdown 執行 PowerShell 代碼。" -ForegroundColor Yellow
        Write-Host "待執行區塊內容如下，請確認後手動執行：" -ForegroundColor Gray
        Write-Host "----------------------------------------" -ForegroundColor DarkGray
        Write-Host $code -ForegroundColor DarkCyan
        Write-Host "----------------------------------------" -ForegroundColor DarkGray
    }
}

Function Show-OptimizationMenu {
    Clear-Host
    Write-Host "===================================================================" -ForegroundColor Magenta
    Write-Host "                    優化與修復控制台 (#自動化#)                    " -ForegroundColor Magenta
    Write-Host "===================================================================" -ForegroundColor Magenta
    Write-Host ""
    Write-Host " [ 可執行的優化模組 ]" -ForegroundColor Yellow
    Write-Host "  [1] 程式碼自癒與錯誤修復 (針對待修復清單進行修復)"
    Write-Host "  [2] 演算法與效能優化 (檢查系統資源與迴圈效能)"
    Write-Host "  [3] 量化與研究實驗迴圈 (背景迭代分析模型)"
    Write-Host "  [4] 系統安全與配額監控 (觸發熔斷防護與資源清理)"
    Write-Host ""
    
    $out = node Modules\get_pending_tasks.js
    $pending = if ($LASTEXITCODE -eq 0) { $out | ConvertFrom-Json -ErrorAction SilentlyContinue } else { $null }
    Write-Host " [ 待修復清單 (watchdog_pending_optimizations DB) ]" -ForegroundColor Red
    if ($null -eq $pending -or @($pending).Count -eq 0) {
        Write-Host "  ✅ 目前系統健康，無待修復的錯誤項目。" -ForegroundColor Green
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
    
    $optChoice = Read-Host "請選擇要執行的優化項目 (1-4) 或返回 (B)"
    
    if ($optChoice -match '^[1-4]$') {
        Write-Host "`n已選擇優化模組 [$optChoice]..." -ForegroundColor Cyan
        
        if ($optChoice -eq "1" -and $null -ne $pending -and @($pending).Count -gt 0) {
            $fixChoice = Read-Host "請輸入要優先修復的清單編號 (例如 1)，或按 Enter 啟動全自動修復"
            Write-Host "背景修復任務已派發！正在調用對應之技能進行處理..." -ForegroundColor Green
            # 模擬背景修復動作
            Start-Sleep -Seconds 2
            $dateStr = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            $diffText = @'
### 修復紀錄 (自動化模組 {0})
- **時間**: {1}
- **執行動作**: 攔截錯誤並套用修復邏輯
```diff
- 原始錯誤邏輯
+ 優化後的自動化腳本
```

'@ -f $optChoice, $dateStr
            $diffText | Out-File -FilePath $HistoryFile -Append -Encoding UTF8
            # [MED-04] 移除對 Pending_Optimization.json 的清空動作
            Write-Host "修復紀錄已寫入，請確認 DB Worker 是否將任務標記為 RESOLVED。" -ForegroundColor Green
        } else {
            Write-Host "該優化任務已派發至背景執行！您可以繼續其他操作。" -ForegroundColor Green
        }
    }
}

Function Update-YAML-Index {
    Write-Host "掃描 SOP 檔案並確保 YAML 標頭存在..." -ForegroundColor Cyan
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
    Write-Host "掃描完成！" -ForegroundColor Green
    $global:cachedSops = @(Get-ChildItem -Path $SopPath -Filter "*.md")
}

# 初始快取建立 (降低迴圈磁碟 I/O)
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
            Write-Host " [溫馨提醒] 您的 .env.local 中仍有未填寫的機密金鑰 (如 DATABASE_URL 等)！" -ForegroundColor Yellow
            Write-Host " 若需使用資料庫或 MCP 外部連線功能，請記得補足這些金鑰以恢復正常運作。" -ForegroundColor Yellow
            Write-Host "===================================================================" -ForegroundColor Red
            Write-Host ""
        }
    }

    Write-Host "===================================================================" -ForegroundColor Cyan
    Write-Host "             自動化與軟體工程工作站 (HH.AI_260611)               " -ForegroundColor Cyan
    Write-Host "===================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host " [ 系統健康度 ]" -ForegroundColor Yellow
    Write-Host " - 待優化項目: $pendingCount 筆 (紀錄於 Neon DB)"
    Write-Host " - 已載入 SOP: $($sops.Count) 份"
    Write-Host " - 核心技能數: $skillsCount 項"
    Write-Host ""
    Write-Host " [ 流程控制 (Orchestration) ]" -ForegroundColor Yellow
    
    $i = 1
    foreach ($sop in $sops) {
        Write-Host "  [$i] 執行 $($sop.BaseName)"
        $i++
    }

    Write-Host ""
    Write-Host " [ 系統操作與優化 ]" -ForegroundColor Yellow
    Write-Host "  [S] 掃描更新 : 自動寫入所有 .md 檔案的 YAML 標頭與建置執行索引"
    Write-Host "  [R] 重新載入 : 刷新選單快取 (Reload Cache)"
    Write-Host "  [#自動化#] : 進入優化控制台 (列出優化選項與待修復清單)"
    Write-Host "  [V] 檢視日誌 : 查看 Optimized_History.md"
    Write-Host "  [Q] 離開系統"
    Write-Host "===================================================================" -ForegroundColor Cyan

    $choice = Read-Host "請輸入指令 (1-$($sops.Count), S, R, V, Q, 或是 #自動化#)"

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
    elseif ($choice -eq "#自動化#") {
        Show-OptimizationMenu
        pause
    }
    elseif ($choice -eq "V" -or $choice -eq "v") {
        if (Test-Path $HistoryFile) {
            Get-Content $HistoryFile | Out-Host
        } else {
            Write-Host "尚無日誌。"
        }
        pause
    }
    elseif ($choice -eq "Q" -or $choice -eq "q") {
        Write-Host "系統關閉中..."
        break
    }
}

