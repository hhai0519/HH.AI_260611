$skillsRoot = '<USER_HOME>\Desktop\AI Test_260503\skills'
$updated = 0; $skipped = 0
Get-ChildItem -Path $skillsRoot -Recurse -Filter 'SKILL.md' | ForEach-Object {
    $fp = $_.FullName
    $raw = [System.IO.File]::ReadAllText($fp, [System.Text.Encoding]::UTF8)
    if ($raw -match 'version: "2\.0\.0"') {
        $new = $raw -replace 'version: "2\.0\.0"', 'version: "3.0.0"'
        [System.IO.File]::WriteAllText($fp, $new, [System.Text.Encoding]::UTF8)
        $folder = $_.Directory.Name; Write-Host "UPDATED: $folder"; $updated++
    } else {
        $folder = $_.Directory.Name; Write-Host "SKIP: $folder"; $skipped++
    }
}
Write-Host ""; Write-Host "Updated=$updated  Skipped=$skipped"
