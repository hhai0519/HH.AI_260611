# Scan all SKILL.md files, extract name: field, compare with directory name
# Output: mismatch report

$skillsRoot = '<USER_HOME>\Desktop\AI Test_260503\skills'

Write-Host "=== SKILL NAMESPACE AUDIT ===" 
Write-Host ""

Get-ChildItem -Path $skillsRoot -Recurse -Filter 'SKILL.md' | ForEach-Object {
    $fp = $_.FullName
    $dirName = $_.Directory.Name
    $raw = [System.IO.File]::ReadAllText($fp, [System.Text.Encoding]::UTF8)
    
    # Extract name: from YAML frontmatter (first --- block)
    if ($raw -match '(?m)^name:\s*["\x27]?([^\n"''\r]+)["\x27]?\s*$') {
        $skillName = $matches[1].Trim().Trim('"').Trim("'")
        if ($skillName -ne $dirName) {
            Write-Host "MISMATCH: dir=[$dirName] name=[$skillName]"
        } else {
            Write-Host "OK:       [$dirName]"
        }
    } else {
        Write-Host "NO_NAME:  [$dirName] (cannot extract name:)"
    }
}
