# =========================================================================
# Agent Terminal Guard Profile (agent_profile.ps1)
# =========================================================================
# 本腳本旨在實作 V3 極致優化版的防呆機制 (Destructive Command Guard)，
# 透過覆寫與別名攔截，防堵 Agent 執行危險指令與產生 BOM 亂碼檔案。

$ErrorActionPreference = "Stop"

function Out-File {
    throw "WriteAbortedException: [防呆機制攔截] 嚴禁使用 Out-File 寫入檔案，以免產生 BOM 導致亂碼！請使用標準 write_to_file 工具。"
}

function Set-Content {
    throw "WriteAbortedException: [防呆機制攔截] 嚴禁使用 Set-Content 寫入檔案，以免產生 BOM 導致亂碼！請使用標準 write_to_file 工具。"
}

function Invoke-GitGuard {
    # 攔截破壞性 Git 指令
    $argsString = $args -join " "
    if ($argsString -match "checkout\s+\.") {
        throw "AccessDeniedException: [防呆機制攔截] 嚴禁執行暴力還原 (git checkout .)！請使用安全的修復策略。"
    }
    if ($argsString -match "reset\s+--hard") {
        throw "AccessDeniedException: [防呆機制攔截] 嚴禁執行歷史抹除 (git reset --hard)！"
    }
    
    # 放行安全指令
    & git.exe $args
}

# 覆寫預設 git 呼叫
Set-Alias -Name git -Value Invoke-GitGuard -Option AllScope -Force

Write-Host "[System] 🛡️ Agent Guardrails Initialized. Destructive commands are blocked." -ForegroundColor Green
