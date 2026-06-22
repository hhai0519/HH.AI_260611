param(
    [string]$Workspace = $PSScriptRoot
)

Set-Location $Workspace

$DataPath = Join-Path $Workspace "Data"
$HistoryFile = Join-Path $DataPath "Optimized_History.md"
$SopPath = Join-Path $Workspace "SOP"
$SkillsPath = Join-Path $Workspace "Skills"

# ç¢ºä?è³‡æ?åº«å???
if (-not (Test-Path $HistoryFile)) { "# ?ªå?æ­·å²ç´€?„`n" | Out-File $HistoryFile -Encoding UTF8 }

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
    
    Write-Host "`n[*] ?‹å??·è? SOP: $(Split-Path $FilePath -Leaf)" -ForegroundColor Cyan
    $content = Get-Content $FilePath -Raw
    
    # ç°¡å–®?å??‰æ?è¨˜ç‚º # @EXECUTE ??powershell ?€å¡?
    $regex = "(?s)``````powershell\r?\n# @EXECUTE\r?\n(.*?)\r?\n``````"
    $matches = [regex]::Matches($content, $regex)
    
    if ($matches.Count -eq 0) {
        Write-Host "æ²’æ??¾åˆ°?¯åŸ·è¡Œç? PowerShell ?€å¡?(# @EXECUTE)?? -ForegroundColor Yellow
        return
    }

    foreach ($match in $matches) {
        $code = $match.Groups[1].Value
        # [CRITICAL-01] å»¢é™¤?•æ? ScriptBlock ?·è?ï¼Œæ??‡ç³»çµ±å??¨æ€?
        Write-Host "?±æ–¼ V3.2.0 å®‰å…¨?§è?ç¯?[CRITICAL-01]ï¼Œå·²ç¦æ­¢?´æ¥å¾?Markdown ?·è? PowerShell ä»?¢¼?? -ForegroundColor Yellow
        Write-Host "å¾…åŸ·è¡Œå?å¡Šå…§å®¹å?ä¸‹ï?è«‹ç¢ºèªå??‹å??·è?ï¼? -ForegroundColor Gray
        Write-Host "----------------------------------------" -ForegroundColor DarkGray
        Write-Host $code -ForegroundColor DarkCyan
        Write-Host "----------------------------------------" -ForegroundColor DarkGray
    }
}

Function Show-OptimizationMenu {
    Clear-Host
    Write-Host "===================================================================" -ForegroundColor Magenta
    Write-Host "                    ?ªå??‡ä¿®å¾©æ§?¶å° (#?ªå???)                    " -ForegroundColor Magenta
    Write-Host "===================================================================" -ForegroundColor Magenta
    Write-Host ""
    Write-Host " [ ?¯åŸ·è¡Œç??ªå?æ¨¡ç? ]" -ForegroundColor Yellow
    Write-Host "  [1] ç¨‹å?ç¢¼è‡ª?’è??¯èª¤ä¿®å¾© (?å?å¾…ä¿®å¾©æ??®é€²è?ä¿®å¾©)"
    Write-Host "  [2] æ¼”ç?æ³•è??ˆèƒ½?ªå? (æª¢æŸ¥ç³»çµ±è³‡æ??‡è¿´?ˆæ???"
    Write-Host "  [3] ?å??‡ç?ç©¶å¯¦é©—è¿´??(?Œæ™¯è¿­ä»£?†æ?æ¨¡å?)"
    Write-Host "  [4] ç³»çµ±å®‰å…¨?‡é?é¡ç›£??(è§¸ç™¼?”æ–·?²è­·?‡è?æºæ???"
    Write-Host "  [5] LINE Bot Auto-Heal & Infrastructure Recovery (Redis/PM2/Port)"
    Write-Host ""
    
    $out = node Modules\get_pending_tasks.js
    $pending = if ($LASTEXITCODE -eq 0) { $out | ConvertFrom-Json -ErrorAction SilentlyContinue } else { $null }
    Write-Host " [ å¾…ä¿®å¾©æ???(watchdog_pending_optimizations DB) ]" -ForegroundColor Red
    if ($null -eq $pending -or @($pending).Count -eq 0) {
        Write-Host "  ???®å?ç³»çµ±?¥åº·ï¼Œç„¡å¾…ä¿®å¾©ç??¯èª¤?…ç›®?? -ForegroundColor Green
    } else {
        $i = 1
        foreach ($item in $pending) {
            Write-Host "  [ERR-$i] ID: $($item.id) | Priority: $($item.priority) | Data: $($item.task_data)" -ForegroundColor Gray
            $i++
        }
    }
    
    Write-Host ""
    Write-Host "  [B] è¿”å?ä¸»é¸??
    Write-Host "===================================================================" -ForegroundColor Magenta
    
    $optChoice = Read-Host "è«‹é¸?‡è??·è??„å„ª?–é???(1-5) ?–è???(B)"
    if ($optChoice -eq "5") {
        powershell -ExecutionPolicy Bypass -File Modules\Start-LineBot-SelfHeal.ps1
        pause
        return
    }
    
    if ($optChoice -match '^[1-4]$') {
        Write-Host "`nå·²é¸?‡å„ª?–æ¨¡çµ?[$optChoice]..." -ForegroundColor Cyan
        
        if ($optChoice -eq "1" -and $null -ne $pending -and @($pending).Count -gt 0) {
            $fixChoice = Read-Host "è«‹è¼¸?¥è??ªå?ä¿®å¾©?„æ??®ç·¨??(ä¾‹å? 1)ï¼Œæ???Enter ?Ÿå??¨è‡ª?•ä¿®å¾?
            Write-Host "?Œæ™¯ä¿®å¾©ä»»å?å·²æ´¾?¼ï?æ­?œ¨èª¿ç”¨å°æ?ä¹‹æ??½é€²è??•ç?..." -ForegroundColor Green
            # æ¨¡æ“¬?Œæ™¯ä¿®å¾©?•ä?
            Start-Sleep -Seconds 2
            $dateStr = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            $diffText = @'
### ä¿®å¾©ç´€??(?ªå??–æ¨¡çµ?{0})
- **?‚é?**: {1}
- **?·è??•ä?**: ?”æˆª?¯èª¤ä¸¦å??¨ä¿®å¾©é?è¼?
```diff
- ?Ÿå??¯èª¤?è¼¯
+ ?ªå?å¾Œç??ªå??–è…³??
```

'@ -f $optChoice, $dateStr
            $diffText | Out-File -FilePath $HistoryFile -Append -Encoding UTF8
            # [MED-04] ç§»é™¤å°?Pending_Optimization.json ?„æ?ç©ºå?ä½?
            Write-Host "ä¿®å¾©ç´€?„å·²å¯«å…¥ï¼Œè?ç¢ºè? DB Worker ?¯å¦å°‡ä»»?™æ?è¨˜ç‚º RESOLVED?? -ForegroundColor Green
        } else {
            Write-Host "è©²å„ª?–ä»»?™å·²æ´¾ç™¼?³è??¯åŸ·è¡Œï??¨å¯ä»¥ç¹¼çºŒå…¶ä»–æ?ä½œã€? -ForegroundColor Green
        }
    }
}

Function Update-YAML-Index {
    Write-Host "?ƒæ? SOP æª”æ?ä¸¦ç¢ºä¿?YAML æ¨™é ­å­˜åœ¨..." -ForegroundColor Cyan
    $files = Get-ChildItem -Path $SopPath -Filter "*.md"
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw
        if ($content -notmatch "^---\r?\n(?:.*\r?\n)*?---") {
            $title = $file.BaseName -replace "_", " "
            $yaml = "---`nTitle: `"$title`"`nTags: [SOP]`nDependencies: []`n---`n`n"
            $content = $yaml + $content
            $content | Set-Content $file.FullName -Encoding UTF8
            Write-Host "å·²æ›´??YAML: $($file.Name)"
        }
    }
    Write-Host "?ƒæ?å®Œæ?ï¼? -ForegroundColor Green
    $global:cachedSops = @(Get-ChildItem -Path $SopPath -Filter "*.md")
}

# ?å?å¿«å?å»ºç? (?ä?è¿´å?ç£ç? I/O)
$global:cachedSops = @(Get-ChildItem -Path $SopPath -Filter "*.md")
$global:cachedSkillsCount = @(Get-ChildItem -Path $SkillsPath -Directory).Count
if ($global:cachedSkillsCount -eq 0) { $global:cachedSkillsCount = @(Get-ChildItem -Path $SkillsPath -File).Count }

# ?²å…¥ä¸»é¸?®è¿´??
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
            Write-Host " [æº«é¦¨?é?] ?¨ç? .env.local ä¸­ä??‰æœªå¡«å¯«?„æ?å¯†é???(å¦?DATABASE_URL ç­?ï¼? -ForegroundColor Yellow
            Write-Host " ?¥é?ä½¿ç”¨è³‡æ?åº«æ? MCP å¤–éƒ¨????Ÿèƒ½ï¼Œè?è¨˜å?è£œè¶³?™ä??‘é‘°ä»¥æ¢å¾©æ­£å¸¸é?ä½œã€? -ForegroundColor Yellow
            Write-Host "===================================================================" -ForegroundColor Red
            Write-Host ""
        }
    }

    Write-Host "===================================================================" -ForegroundColor Cyan
    Write-Host "             ?ªå??–è?è»Ÿé?å·¥ç?å·¥ä?ç«?(HH.AI_260611)               " -ForegroundColor Cyan
    Write-Host "===================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host " [ ç³»çµ±?¥åº·åº?]" -ForegroundColor Yellow
    Write-Host " - å¾…å„ª?–é??? $pendingCount ç­?(ç´€?„æ–¼ Neon DB)"
    Write-Host " - å·²è???SOP: $($sops.Count) ä»?
    Write-Host " - ?¸å??€?½æ•¸: $skillsCount ??
    Write-Host ""
    Write-Host " [ æµç??§åˆ¶ (Orchestration) ]" -ForegroundColor Yellow
    
    $i = 1
    foreach ($sop in $sops) {
        Write-Host "  [$i] ?·è? $($sop.BaseName)"
        $i++
    }

    Write-Host ""
    Write-Host " [ ç³»çµ±?ä??‡å„ª??]" -ForegroundColor Yellow
    Write-Host "  [S] ?ƒæ??´æ–° : ?ªå?å¯«å…¥?€??.md æª”æ???YAML æ¨™é ­?‡å»ºç½®åŸ·è¡Œç´¢å¼?
    Write-Host "  [R] ?æ–°è¼‰å…¥ : ?·æ–°?¸å–®å¿«å? (Reload Cache)"
    Write-Host "  [#?ªå???] : ?²å…¥?ªå??§åˆ¶??(?—å‡º?ªå??¸é??‡å?ä¿®å¾©æ¸…å–®)"
    Write-Host "  [V] æª¢è??¥è? : ?¥ç? Optimized_History.md"
    Write-Host "  [Q] ?¢é?ç³»çµ±"
    Write-Host "===================================================================" -ForegroundColor Cyan

    $choice = Read-Host "è«‹è¼¸?¥æ?ä»?(1-$($sops.Count), S, R, V, Q, ?–æ˜¯ #?ªå???)"

    if ($choice -match '^\d+$' -and [int]$choice -ge 1 -and [int]$choice -le $sops.Count) {
        Invoke-SOP -FilePath $sops[[int]$choice - 1].FullName
        pause
    }
    elseif ($choice -eq "S" -or $choice -eq "s") {
        Update-YAML-Index
        pause
    }
    elseif ($choice -eq "R" -or $choice -eq "r") {
        Write-Host "?æ–°?ƒæ?ç£ç?å»ºç?å¿«å?..." -ForegroundColor Cyan
        $global:cachedSops = @(Get-ChildItem -Path $SopPath -Filter "*.md")
        $global:cachedSkillsCount = @(Get-ChildItem -Path $SkillsPath -Directory).Count
        if ($global:cachedSkillsCount -eq 0) { $global:cachedSkillsCount = @(Get-ChildItem -Path $SkillsPath -File).Count }
        Write-Host "å¿«å??·æ–°å®Œæ?ï¼? -ForegroundColor Green
        Start-Sleep -Seconds 1
    }
    elseif ($choice -eq "#?ªå???") {
        Show-OptimizationMenu
        pause
    }
    elseif ($choice -eq "V" -or $choice -eq "v") {
        if (Test-Path $HistoryFile) {
            Get-Content $HistoryFile | Out-Host
        } else {
            Write-Host "å°šç„¡?¥è???
        }
        pause
    }
    elseif ($choice -eq "Q" -or $choice -eq "q") {
        Write-Host "ç³»çµ±?œé?ä¸?.."
        break
    }
}


