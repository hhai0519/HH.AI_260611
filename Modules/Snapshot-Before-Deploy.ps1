# 部署前 Git 快照 — 確保任何災難都能一鍵退版
param([string]$Workspace = (Split-Path -Parent $PSScriptRoot))
Set-Location $Workspace
$timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
git add -A
git commit -m "SNAPSHOT: Pre-deploy safety net ($timestamp)" --allow-empty --no-verify
Write-Host "SNAPSHOT CREATED: $(git rev-parse HEAD)" -ForegroundColor Green
