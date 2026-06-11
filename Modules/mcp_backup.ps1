# mcp_backup.ps1 - MCP Config Auto-Backup Script
# V3.0.0 Architecture Hardening

$ErrorActionPreference = "Stop"
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$mcpConfigPath = Join-Path $env:USERPROFILE ".gemini\本協作系統\mcp_config.json"
$bakPath       = Join-Path $env:USERPROFILE ".gemini\本協作系統\mcp_config.bak"
$ts            = Get-Date -Format 'yyyyMMdd_HHmmss'
$timestampBak  = Join-Path $env:USERPROFILE ".gemini\本協作系統\mcp_config_$ts.bak"

function Write-Log([string]$Msg, [string]$Lvl = "INFO") {
    $t = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$t][$Lvl] $Msg"
}

if (-not (Test-Path $mcpConfigPath)) {
    Write-Log "mcp_config.json not found: $mcpConfigPath" "ERROR"
    exit 1
}

Copy-Item $mcpConfigPath $timestampBak -Force
Write-Log "Timestamp backup created: $timestampBak"

Copy-Item $mcpConfigPath $bakPath -Force
Write-Log "Main backup updated: $bakPath"

$srcSize = (Get-Item $mcpConfigPath).Length
$bakSize = (Get-Item $bakPath).Length

if ($srcSize -eq $bakSize) {
    Write-Log "Integrity check passed ($srcSize bytes)"
} else {
    Write-Log "Size mismatch! src=$srcSize bak=$bakSize" "WARN"
}

# Clean up backups older than 7 days
$oldBaks = Get-ChildItem (Join-Path $env:USERPROFILE ".gemini\本協作系統\mcp_config_*.bak") -ErrorAction SilentlyContinue |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) }

if ($oldBaks) {
    $cnt = ($oldBaks | Measure-Object).Count
    $oldBaks | Remove-Item -Force
    Write-Log "Cleaned $cnt expired backup(s)"
}

Write-Host ""
Write-Host "MCP Backup Complete"
Write-Host "  Main : $bakPath"
Write-Host "  Stamp: $timestampBak"
