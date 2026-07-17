# =========================================================================
# Architecture Watchdog Linter (Verify-Architecture.ps1)
# =========================================================================

$ErrorActionPreference = "Stop"
$workspaceRoot = Split-Path -Parent $PSScriptRoot

# Check Modules directory
$modulesPath = Join-Path $workspaceRoot "Modules"
if (Test-Path $modulesPath) {
    # Check for subdirectories in Modules/ (allowing 'shared' directory)
    $subDirs = Get-ChildItem -Path $modulesPath | Where-Object { $_.PSIsContainer -and $_.Name -ne "shared" }
    if ($subDirs.Count -gt 0) {
        $dirNames = $subDirs.Name -join ", "
        Write-Error "ArchitectureViolation: Subdirectories are strictly forbidden in Modules/! Found: $dirNames"
        exit 1
    }

    # Check for unauthorized files in Modules/
    $allowedJsFiles = @("db_state_manager.js", "maintenance_worker.js", "quota_manager.js", "sop_router.js")
    $invalidFiles = Get-ChildItem -Path $modulesPath -File | Where-Object { $_.Extension -ne ".ps1" -and $_.Name -notin $allowedJsFiles }
    if ($invalidFiles.Count -gt 0) {
        $fileNames = $invalidFiles.Name -join ", "
        Write-Error "ArchitectureViolation: Only whitelist .js or .ps1 files are allowed in Modules/! Found: $fileNames"
        exit 1
    }
}

# Check for Mojibake (Encoding Corruption)
$mojibakePattern = [char]65533
$filesToScan = Get-ChildItem -Path $workspaceRoot -Include *.ps1,*.md,*.js,*.bat -Recurse -File | Where-Object { $_.FullName -notmatch "\\node_modules\\" -and $_.FullName -notmatch "\\\.git\\" }
foreach ($file in $filesToScan) {
    if ($file.Length -gt 1MB) { continue }
    $content = Get-Content $file.FullName -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
    if ($content -match $mojibakePattern) {
        $relativePath = $file.FullName.Substring($workspaceRoot.Length + 1)
        Write-Error "EncodingViolation: Mojibake (U+FFFD) detected in $relativePath. File encoding is corrupted!"
        exit 1
    }
}

Write-Host "SUCCESS: Architecture Linter Check Passed." -ForegroundColor Green
# Check PM2 Architecture Compliance
$pm2ListOutput = npx pm2 jlist 2>$null
if ($LASTEXITCODE -eq 0 -and $pm2ListOutput) {
    if ($pm2ListOutput -match '"name":"cloudflare-tunnel"') {
        Write-Error "ArchitectureViolation: Detected legacy 'cloudflare-tunnel' PM2 app! Only 'line-bridge' is allowed."
        exit 1
    }
}

# Check Startup folder for ghosts
$startupPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
$ghostFiles = @("pm2_startup.bat", "LINE_Bot_AutoHeal.lnk")
foreach ($g in $ghostFiles) {
    if (Test-Path (Join-Path $startupPath $g)) {
        Write-Error "ArchitectureViolation: Ghost startup file detected: $g"
        exit 1
    }
}

# ─── Check skill triggers uniqueness ──────────────────────────────────────────────
$skillsPath = Join-Path $workspaceRoot "skills"
if (Test-Path $skillsPath) {
    $triggerMap = @{}
    $activeSkills = Get-ChildItem -Path $skillsPath -Filter "SKILL.md" -Recurse | Where-Object { $_.FullName -notmatch "\\Archive\\" }
    foreach ($skillFile in $activeSkills) {
        $content = Get-Content $skillFile.FullName -Raw
        $skillName = $skillFile.Directory.Name
        $triggers = @()

        if ($content -match 'triggers:\s*\[(.*?)\]') {
            $triggerListStr = $Matches[1]
            $triggers = $triggerListStr.Split(',') | ForEach-Object { $_.Trim(" `"'").ToLower() }
        }
        elseif ($content -match '(?s)triggers:\r?\n(.*?)(?:\r?\n\r?\n|\r?\n[a-zA-Z]|\r?\n---)') {
            $linesBlock = $Matches[1]
            $lines = $linesBlock -split "\r?\n"
            foreach ($line in $lines) {
                if ($line -match '^\s*-\s*(.*)$') {
                    $triggers += $Matches[1].Trim(" `"'").ToLower()
                }
            }
        }

        foreach ($t in $triggers) {
            if ($null -ne $t -and $t -ne "") {
                if ($triggerMap.ContainsKey($t)) {
                    $otherSkill = $triggerMap[$t]
                    if ($otherSkill -ne $skillName) {
                        Write-Error "ArchitectureViolation: Duplicate trigger '$t' detected between skill '$skillName' and skill '$otherSkill'!"
                        exit 1
                    }
                } else {
                    $triggerMap[$t] = $skillName
                }
            }
        }
    }
}

exit 0
