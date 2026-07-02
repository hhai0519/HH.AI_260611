# Proxy Wrapper for backwards compatibility
# The actual script has been moved to Modules\Start-LineBot.ps1 to comply with Zero-Clutter Policy.
$scriptPath = Join-Path -Path $PSScriptRoot -ChildPath "Modules\Start-LineBot.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -File $scriptPath @args
