# V3.0.0 Final Mile: Hard Rename Script
# Renames physical directories to match name: in SKILL.md (SOP §6.2)
# Also updates skill_translations.json with new folder_path

param(
    [switch]$WhatIf = $false
)

$skillsRoot   = '<USER_HOME>\Desktop\AI Test_260503\skills'
$translPath   = '<USER_HOME>\Desktop\AI Test_260503\Data\skill_translations.json'

$renames = [System.Collections.Generic.List[hashtable]]::new()

# --- Phase 1: Scan & Rename ---
Get-ChildItem -Path $skillsRoot -Directory -Recurse -Depth 1 | ForEach-Object {
    $skillFile = Join-Path $_.FullName 'SKILL.md'
    if (-not (Test-Path $skillFile)) { return }

    $raw  = [System.IO.File]::ReadAllText($skillFile, [System.Text.Encoding]::UTF8)
    $dirName = $_.Name
    $parentPath = $_.Parent.FullName

    if ($raw -match '(?m)^name:\s*["\x27]?([^\n"''\r]+)["\x27]?\s*$') {
        $skillName = $matches[1].Trim().Trim('"').Trim("'")
        if ($skillName -ne $dirName) {
            $newPath = Join-Path $parentPath $skillName
            $oldPath = $_.FullName

            # Build relative paths for JSON
            $relOld = $oldPath.Replace($skillsRoot + '\', '').Replace('\','/')
            $relNew = $newPath.Replace($skillsRoot + '\', '').Replace('\','/')

            $renames.Add(@{
                OldDir    = $dirName
                NewDir    = $skillName
                SkillName = $skillName
                OldPath   = $oldPath
                NewPath   = $newPath
                RelOld    = $relOld
                RelNew    = $relNew
            })

            if (-not $WhatIf) {
                Rename-Item -Path $oldPath -NewName $skillName -ErrorAction Stop
                Write-Host "RENAMED: $dirName -> $skillName"
            } else {
                Write-Host "[WHATIF] Would rename: $dirName -> $skillName"
            }
        }
    }
}

Write-Host ""
Write-Host "Total renames: $($renames.Count)"

# --- Phase 2: Update skill_translations.json ---
if (-not $WhatIf -and $renames.Count -gt 0) {
    $json = Get-Content $translPath -Raw | ConvertFrom-Json

    foreach ($r in $renames) {
        foreach ($entry in $json.translations) {
            if ($entry.folder_path -like "*/$($r.OldDir)" -or $entry.folder_path -eq $r.RelOld) {
                Write-Host "UPDATING JSON: $($entry.folder_path) -> $($r.RelNew)"
                $entry.folder_path = $r.RelNew
            }
        }
    }

    $json._last_updated = (Get-Date -Format 'yyyy-MM-ddTHH:mm:sszzz')
    $json | ConvertTo-Json -Depth 10 | Set-Content $translPath -Encoding UTF8
    Write-Host ""
    Write-Host "skill_translations.json updated."
}

# --- Phase 3: Output rename log ---
Write-Host ""
Write-Host "=== RENAME LOG ==="
foreach ($r in $renames) {
    Write-Host "  $($r.OldDir)  =>  $($r.NewDir)"
}
