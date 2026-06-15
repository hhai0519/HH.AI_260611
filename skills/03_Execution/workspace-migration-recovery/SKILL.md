---
name: workspace-migration-recovery
type: execution
description: 偵測並修復工作站架構違規。掃描 skills/ 目錄結構異常、Manifest 路徑失效、歷史硬編碼路徑（AI Test_260*）與廢棄腳本引用。觸發關鍵字：架構違規、Manifest失效、路徑掃描、環境遷移、孤兒技能、健康檢查。
version: "1.0.0"
capabilities:
  tool_category: "System Governance"
  execution_env: "Node.js / PowerShell"
  io_format: "Diagnostic Report / Fix Commands"
---

# 工作站遷移修復 (Workspace Migration Recovery)

### 【摘要】觸發條件與 DLP 聲明
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議

本技能為系統的**主動防禦層**，能自動偵測並引導修復以下架構問題：
目錄結構違規、Manifest 路徑失效、歷史硬編碼路徑殘留、廢棄腳本引用。

---

## 🎯 觸發條件

- 使用者提到「架構違規」、「Manifest 失效」、「孤兒技能」
- 使用者提到「環境遷移」、「路徑掃描」、「健康檢查」
- 使用者提到「AI Test_260*」殘留
- 系統首次在新工作站環境啟動
- Watchdog 偵測到 `skills/` 子目錄數超過 4 個

---

## 🔍 四大掃描模組

### 模組 1：目錄結構合規掃描

```javascript
const fs = require('fs');
const skillsDirs = fs.readdirSync('./skills')
  .filter(d => fs.statSync(`./skills/${d}`).isDirectory());
if (skillsDirs.length > 4) {
  console.warn(`⚠️ 架構違規：skills/ 有 ${skillsDirs.length} 個子目錄（標準：4個）`);
  console.log('多餘目錄：', skillsDirs.filter(d => !['01_Orchestrators','02_Cognitive','03_Execution','Archive'].includes(d)));
}
```

**判斷標準**：`skills/` 下應僅有 `01_Orchestrators/`, `02_Cognitive/`, `03_Execution/`, `Archive/` 共 4 個目錄。

### 模組 2：Manifest 路徑一致性驗證

```javascript
const manifest = JSON.parse(fs.readFileSync('./Data/00_Skill_Manifest.json', 'utf8'));
const invalidPaths = [];
for (const [key, val] of Object.entries(manifest)) {
  const dir = path.dirname(path.join('.', val.path.replace('./', '')));
  if (!fs.existsSync(dir)) {
    invalidPaths.push({ skill: key, path: val.path });
  }
}
if (invalidPaths.length > 0) {
  console.error('❌ Manifest 失效路徑：', invalidPaths);
}
```

### 模組 3：歷史硬編碼路徑掃描

掃描範圍：`SOP/*.md`, `skills/01_Orchestrators/**/*.md`, `skills/02_Cognitive/**/*.md`, `skills/03_Execution/**/*.md`

**危險標記清單**：
- `AI Test_260*`（前任工作站名稱）
- `.agent/scripts/`（V3.1.3 廢棄路徑）
- `refresh_skills.js`（V3.1.3 廢棄腳本）
- `skills_dashboard.html`（廢棄儀表板）

```powershell
# PowerShell 快速掃描指令
Get-ChildItem -Path "SOP","skills\01_Orchestrators","skills\02_Cognitive","skills\03_Execution" `
  -Recurse -Filter "*.md" |
  Select-String -Pattern "AI Test_260|\.agent\\scripts|refresh_skills\.js|skills_dashboard\.html" |
  Select-Object Filename, LineNumber, Line
```

### 模組 4：修復引導

偵測到問題後，依照以下優先順序引導修復：

| 問題類型 | 修復指令 |
|---------|---------|
| 多餘目錄 | `Move-Item -Path "skills/<舊目錄>" -Destination "skills/Archive/<舊目錄>"` |
| Manifest 失效路徑 | `node scratch/update_manifest.js` 重新同步 |
| 歷史硬編碼 | 替換為 `<WORKSPACE_ROOT>` 語意佔位符 |
| 廢棄腳本引用 | 改為 `Data/00_Skill_Manifest.json` |

---

## 📋 執行 SOP

### 快速健康檢查（每次系統啟動建議執行）

```powershell
# 1. 目錄結構檢查
$dirs = Get-ChildItem "skills" -Directory | Select-Object -ExpandProperty Name
if ($dirs.Count -ne 4) { Write-Warning "skills/ 目錄數異常：$($dirs.Count)（應為 4）" }

# 2. Manifest 驗證
node scratch/update_manifest.js

# 3. 歷史路徑掃描
Get-ChildItem -Path "SOP","skills\01_Orchestrators","skills\02_Cognitive","skills\03_Execution" `
  -Recurse -Filter "*.md" | Select-String "AI Test_260"
```

---

## ⚠️ 邊界說明

- ✅ 適用：工作站遷移後的合規驗證
- ✅ 適用：Manifest 路徑失效的自動偵測
- ✅ 適用：歷史殘留標記的定位與引導修復
- ❌ 不適用：`SOP_12` 中的 MCP 設定路徑（這些必須是真實絕對路徑）
- ❌ 不適用：`Archive/` 目錄內的歸檔文件（保持歷史原始狀態）

---

## 🤝 協同技能

- `skill-governance-skill`：技能生命週期管理
- `systematic-debugging-skill`：環境異常排障
- `handover-manual-skill`：系統交接時的完整上下文傳遞

---

## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議
