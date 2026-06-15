# ============================================================
# SOP Hotfix Script — 4 Tasks
# Encoding: UTF-8 no-BOM via [System.IO.File]::WriteAllText
# Strictly uses PowerShell single-quote Here-String
# ============================================================
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$base = '<USER_HOME>\Desktop\AI Test_260503\SOP'

# ─── NOTE on TASK 1 ───
# 目標文件「系統架構守門員準則.md」不存在獨立實體。
# §6.2 已在 SOP_00_Skill_Lifecycle_Management.md 中以「無前綴映射原則」落地。
# 任務 1 確認邏輯已到位，無需重複寫入，記錄為 CONFIRMED-IN-PLACE。
Write-Host "TASK1: CONFIRMED-IN-PLACE - §6.2 無前綴映射原則已存在於 SOP_00_Skill_Lifecycle_Management.md，無獨立守門員文件需修改。"

# ─── TASK 2: §7.1 Rewrite in SOP_00_Skill_Lifecycle_Management.md ───
$file2 = Join-Path $base 'SOP_00_Skill_Lifecycle_Management.md'
$content2 = [System.IO.File]::ReadAllText($file2, [System.Text.Encoding]::UTF8)

$oldSec71 = @'
### §7.1 高階語言優先原則 (Node.js / Python First)

凡涉及**讀取、修改、替換**含有大量 CJK 正體中文字元的檔案（包含 `.md` Markdown 文檔、`.json` 數據檔），**強制優先使用 Node.js 或 Python 腳本**執行。

**理由**：Node.js 與 Python 原生支援標準 UTF-8 字元集，可完整處理 CJK 字元，根本避免 Windows PowerShell 因 `$OutputEncoding` 預設值不一致而導致的 Mojibake（亂碼）問題。

```javascript
// Node.js 標準範例：UTF-8 無 BOM 讀寫
const fs = require('fs');
const content = fs.readFileSync(filePath, 'utf8');
const updated = content.replace(/舊字串/g, '新字串');
fs.writeFileSync(filePath, updated, { encoding: 'utf8' }); // 預設無 BOM
```

```python
# Python 標準範例：UTF-8 無 BOM 讀寫
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
updated = content.replace('舊字串', '新字串')
with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.write(updated)
```
'@

$newSec71 = @'
### §7.1 物理寫入最高標準：PowerShell Here-String

根據災難反思，處理多行 Markdown 或 JSON 寫入時，**強制使用 PowerShell 單引號 Here-String (`@' ... '@`)** 以免疫跳脫字元與轉義崩潰。Node.js 僅限用於不涉及大篇幅文件生成的單純邏輯運算或 BOM 清洗。

```powershell
# PowerShell Here-String 強制範例：多行 Markdown 寫入
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$content = @'
# 標題
多行內容，不需要任何跳脫字元
包含反引號與「特殊符號」均安全
'@
[System.IO.File]::WriteAllText('output.md', $content, $utf8NoBom)
```

**適用情境**：
- 多行 Markdown 文件生成（SOP、SKILL.md、README）
- 含 CJK 字元的 JSON 結構寫入
- 任何含換行符、引號、特殊符號的文字寫入

**Node.js 僅允許用於**：
- BOM 清洗（`replace(/^\uFEFF+/, '')`）
- 不含大篇幅文字的純邏輯運算（如讀取 JSON Key、計算數值）
'@

if ($content2.Contains('### §7.1 高階語言優先原則')) {
    $updated2 = $content2.Replace($oldSec71, $newSec71)
    if ($updated2 -ne $content2) {
        [System.IO.File]::WriteAllText($file2, $updated2, $utf8NoBom)
        Write-Host "TASK2: OK - §7.1 已成功改寫為 PowerShell Here-String 最高標準"
    } else {
        Write-Host "TASK2: WARNING - 字串比對未命中，請確認原文空白字元"
    }
} else {
    Write-Host "TASK2: SKIP - §7.1 舊標題不存在，可能已更新"
}

# ─── TASK 3: Append DLP check to §3 in SOP_00_New_Skill_Onboarding.md ───
$file3 = Join-Path $base 'SOP_00_New_Skill_Onboarding.md'
$content3 = [System.IO.File]::ReadAllText($file3, [System.Text.Encoding]::UTF8)

$dlpLine = @'
- **DLP 與結構檢核**：強制檢查檔案是否包含 SOP_03 規定的 `### 【摘要】觸發條件` 與 DLP 聲明，以及標準 H2 標題（核心功能、操作步驟等）。若有缺失，一律阻擋存檔。
'@

$marker3 = '- **通訊協定宣告** 檢查底部是否完整包含 `[SYSTEM-CALL]` 與 `[SYSTEM-RETURN]` 的強型別通訊介面與 `Zero-Block Policy`。'

if (-not $content3.Contains('DLP 與結構檢核')) {
    $updated3 = $content3.Replace($marker3, ($marker3 + "`r`n" + $dlpLine))
    [System.IO.File]::WriteAllText($file3, $updated3, $utf8NoBom)
    Write-Host "TASK3: OK - DLP 與結構檢核條件已追加至 §3 語法檢核"
} else {
    Write-Host "TASK3: SKIP - DLP 條件已存在"
}

# ─── TASK 4: SYSTEM-OVERRIDE CAUTION block ───
$cautionBlock = @'

> [!CAUTION]
> **SYSTEM-OVERRIDE**: 代理人必須壓制預設模型偏見。本專案嚴禁提議 Vite、Express 或 GitHub。強制唯一真理：Next.js 15.2+ (App Router) / React 19 / GitLab。

'@

# TASK 4a: SOP_06_Handover_Manual.md
$file4a = Join-Path $base 'SOP_06_Handover_Manual.md'
$content4a = [System.IO.File]::ReadAllText($file4a, [System.Text.Encoding]::UTF8)
$title4a = '# 本協作系統 (Argus v6.0) 專案維護日誌 CORE_MAINTENANCE_LOG'

if (-not $content4a.Contains('SYSTEM-OVERRIDE')) {
    $updated4a = $content4a.Replace($title4a, ($title4a + $cautionBlock))
    [System.IO.File]::WriteAllText($file4a, $updated4a, $utf8NoBom)
    Write-Host "TASK4a: OK - SYSTEM-OVERRIDE 已注入 SOP_06_Handover_Manual.md"
} else {
    Write-Host "TASK4a: SKIP - SYSTEM-OVERRIDE 已存在"
}

# TASK 4b: SOP_10_AI_Command_Center.md
$file4b = Join-Path $base 'SOP_10_AI_Command_Center.md'
$content4b = [System.IO.File]::ReadAllText($file4b, [System.Text.Encoding]::UTF8)
$title4b = '# AI Command Center 標準作業程序 (SOP_10)'

if (-not $content4b.Contains('SYSTEM-OVERRIDE')) {
    $updated4b = $content4b.Replace($title4b, ($title4b + $cautionBlock))
    [System.IO.File]::WriteAllText($file4b, $updated4b, $utf8NoBom)
    Write-Host "TASK4b: OK - SYSTEM-OVERRIDE 已注入 SOP_10_AI_Command_Center.md"
} else {
    Write-Host "TASK4b: SKIP - SYSTEM-OVERRIDE 已存在"
}

Write-Host ""
Write-Host "=== SOP Hotfix 完畢 ==="
