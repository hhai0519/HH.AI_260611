# V3.0.0 Aesthetic Polish: Remove tool- and sys- prefixes from name: fields + rename dirs

$skillsRoot = '<USER_HOME>\Desktop\AI Test_260503\skills'

# Define targets: [relative path from skillsRoot] -> [new name (prefix removed)]
$targets = @(
    @{ RelPath = '03_Execution\tool-connect-apps';       OldName = 'tool-connect-apps';       NewName = 'connect-apps' },
    @{ RelPath = '03_Execution\tool-csv-data-summarizer';OldName = 'tool-csv-data-summarizer'; NewName = 'csv-data-summarizer' },
    @{ RelPath = '03_Execution\tool-gemma-4-api';        OldName = 'tool-gemma-4-api';         NewName = 'gemma-4-api' },
    @{ RelPath = '03_Execution\tool-mcp-setup';          OldName = 'tool-mcp-setup';           NewName = 'mcp-setup' },
    @{ RelPath = '03_Execution\tool-notebooklm-mcp';     OldName = 'tool-notebooklm-mcp';      NewName = 'notebooklm-mcp' },
    @{ RelPath = '03_Execution\tool-xlsx';               OldName = 'tool-xlsx';                NewName = 'xlsx' },
    @{ RelPath = '01_Orchestrators\sys-reflection-module';OldName = 'sys-reflection-module';   NewName = 'reflection-module' }
)

foreach ($t in $targets) {
    $oldDirPath  = Join-Path $skillsRoot $t.RelPath
    $skillFile   = Join-Path $oldDirPath 'SKILL.md'
    $parentPath  = Split-Path $oldDirPath -Parent
    $newDirPath  = Join-Path $parentPath $t.NewName

    # 1. Update name: in SKILL.md
    $content = [System.IO.File]::ReadAllText($skillFile, [System.Text.Encoding]::UTF8)
    $oldNameLine = "name: `"$($t.OldName)`""
    $newNameLine = "name: `"$($t.NewName)`""
    if ($content -match [regex]::Escape($oldNameLine)) {
        $content = $content.Replace($oldNameLine, $newNameLine)
        [System.IO.File]::WriteAllText($skillFile, $content, [System.Text.Encoding]::UTF8)
        Write-Host "NAME UPDATED: $($t.OldName) -> $($t.NewName)"
    } else {
        # Try without quotes
        $oldNameLine2 = "name: $($t.OldName)"
        $newNameLine2 = "name: $($t.NewName)"
        if ($content -match [regex]::Escape($oldNameLine2)) {
            $content = $content.Replace($oldNameLine2, $newNameLine2)
            [System.IO.File]::WriteAllText($skillFile, $content, [System.Text.Encoding]::UTF8)
            Write-Host "NAME UPDATED (no-quote): $($t.OldName) -> $($t.NewName)"
        } else {
            Write-Host "WARNING: Could not find name: field for $($t.OldName)"
        }
    }

    # 2. Rename directory
    Rename-Item -Path $oldDirPath -NewName $t.NewName -ErrorAction Stop
    Write-Host "DIR RENAMED:  $($t.OldName) -> $($t.NewName)"
    Write-Host ''
}

Write-Host '=== All 7 targets processed ==='
