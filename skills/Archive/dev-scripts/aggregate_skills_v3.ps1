
$skillsPath = "<USER_HOME>\Desktop\AI Test_260503\skills"
$outputPath = "<USER_HOME>\Desktop\AI Test_260503\scratch" # Moving to project scratch

if (!(Test-Path $outputPath)) { New-Item -ItemType Directory -Path $outputPath }

function Combine-Skills($subDir, $outputFile) {
    $content = ""
    $fullPath = Join-Path $skillsPath $subDir
    if (Test-Path $fullPath) {
        $files = Get-ChildItem -Path $fullPath -Filter "SKILL.md" -Recurse
        foreach ($file in $files) {
            if ($file.FullName -like "*\examples\*") { continue }
            $content += "`n`n--- FILE: $($file.FullName) ---`n"
            $content += Get-Content -Path $file.FullName -Raw
        }
    }
    $content | Out-File -FilePath "$outputPath\$outputFile" -Encoding utf8
}

Combine-Skills "01_Orchestrators" "orchestrators_v4.txt"
Combine-Skills "02_Cognitive" "cognitive_v4.txt"
Combine-Skills "03_Execution" "execution_v4.txt"
