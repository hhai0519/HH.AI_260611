$skillsRoot = '<USER_HOME>\Desktop\AI Test_260503\skills'
Write-Host '=== POST-RENAME DIRECTORY STRUCTURE ==='
Get-ChildItem -Path $skillsRoot -Directory | ForEach-Object {
    $layer = $_.Name
    $subdirs = Get-ChildItem -Path $_.FullName -Directory
    $count = $subdirs.Count
    Write-Host "$layer — $count dirs"
    $subdirs | ForEach-Object { Write-Host "  - $($_.Name)" }
}

Write-Host ''
Write-Host '=== CROSS-LAYER DUPLICATE CHECK ==='
$allDirs = Get-ChildItem -Path $skillsRoot -Recurse -Depth 2 -Directory | 
    Where-Object { Test-Path (Join-Path $_.FullName 'SKILL.md') } | 
    Select-Object -ExpandProperty Name

$dupes = $allDirs | Group-Object | Where-Object { $_.Count -gt 1 }
if ($dupes) {
    $dupes | ForEach-Object { Write-Host "DUPLICATE: $($_.Name) x$($_.Count)" }
} else {
    Write-Host 'No duplicates found.'
}

Write-Host ''
Write-Host "Total skill dirs: $($allDirs.Count)"
