# Proxy Wrapper for backwards compatibility
# The actual script has been moved to Modules\Start-TelegramBot.ps1 to comply with Zero-Clutter Policy.
$root = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent (Get-Item -LiteralPath $MyInvocation.MyCommand.Path).FullName }
$scriptPath = Join-Path -Path $root -ChildPath "Modules\Start-TelegramBot.ps1"
if (-not (Test-Path $scriptPath)) {
    Write-Host "ERROR: Start-TelegramBot.ps1 not found at: $scriptPath" -ForegroundColor Red
    exit 1
}
powershell -NoProfile -ExecutionPolicy Bypass -File $scriptPath @args
