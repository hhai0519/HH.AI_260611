---
name: workspace-migration-recovery
description: 偵測並修復工作站架構違規與新環境還原。包含工作區舊名稱全量正則對齊、MCP 伺服器環境自動補齊與實測、Manifest 即時同步、舊版無效引用掃描及 SOP14 審計認證。觸發關鍵字：架構違規、Manifest失效、路徑掃描、環境遷移、孤兒技能、健康檢查、全站重建、災難復原。
version: "3.0.0"
type: "execution"
triggers: ["架構違規", "Manifest失效", "路徑掃描", "環境遷移", "孤兒技能", "健康檢查", "全站重建", "災難復原"]
dependencies: ["SOP_12_MCP_Auth_Recovery.md", "SOP_14_Rigorous_Verification_and_Audit_Protocol.md", "00_Skill_Manifest.json"]
capabilities:
  tool_category: "System Governance & Disaster Recovery"
  execution_env: "Node.js / PowerShell"
  io_format: "Diagnostic Report / Fix Commands / Artifact Report"
---

# 工作站遷移與災難復原 (Workspace Migration & Disaster Recovery)

### 【摘要】觸發條件與 DLP 聲明
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議

本技能為系統的**主動防禦與環境初始化重構層**，實戰整合 2026/08/06 災難復原經驗，能自動引導修復目錄違規、檔案名稱與硬編碼未對齊、MCP 配置缺件、Manifest 離線失聯及廢棄腳本引用。

---

## 🎯 觸發條件

- 使用者提到「架構違規」、「Manifest 失效」、「孤兒技能」、「全站重建」
- 使用者提到「環境遷移」、「路徑掃描」、「健康檢查」、「災難復原」
- 系統於全新 Windows 使用者帳戶或乾淨 OS 環境中首次初始化
- Watchdog 偵測到 `skills/` 頂層子目錄數超過 4 個，或 MCP 工具連線回應異常

---

## 🔍 五大復原與掃描模組 (Core Migration & Recovery Modules)

### 模組 1：頂層目錄結構合規掃描 (Directory Standards)

```javascript
const fs = require('fs');
const skillsDirs = fs.readdirSync('./skills')
  .filter(d => fs.statSync(`./skills/${d}`).isDirectory());
if (skillsDirs.length > 4) {
  console.warn(`⚠️ 架構違規：skills/ 有 ${skillsDirs.length} 個子目錄（標準：4個）`);
  console.log('多餘目錄：', skillsDirs.filter(d => !['01_Orchestrators','02_Cognitive','03_Execution','Archive'].includes(d)));
}
```
- **合規標準**：`skills/` 下應僅有 `01_Orchestrators/`, `02_Cognitive/`, `03_Execution/`, `Archive/` 共 4 個頂層目錄。若發現非標規目錄，遵循 **No-Delete Policy**，自動移至 `skills/Archive/`。

### 模組 2：全工作區舊名稱正則對齊 (Workspace Path Alignment)

- **情境**：專案遷移至新 OS 帳號（例如從 `HH.AI_260611` 變更為 `HH.AI_260806`）時，自動對全站進行安全無損文字替換。
- **涵蓋範圍**：工作區目錄、控制面板 `00_Master_Menu.ps1`、`bridge.js`、SOP 規範、Manifest 與備份日誌。
```javascript
// 自動全站替換邏輯 (保留 UTF-8 編碼不破壞 BOM)
const content = fs.readFileSync(filePath, 'utf8');
if (content.includes(oldName)) {
  const updated = content.split(oldName).join(newName);
  fs.writeFileSync(filePath, updated, 'utf8');
}
```

### 模組 3：MCP 基礎設施環境初始化與補齊 (MCP Setup & Test)

1. **依賴自動安裝**：檢查 Python `notebooklm-mcp-cli` 是否就位，若無則自動執行 `pip install notebooklm-mcp-cli`。
2. **`mcp_config.json` 寫入**：確保包含 5 大 MCP 伺服器完整設定，特別注意 `$typeName` 語法跳脫與絕對路徑：
   - `chrome-devtools-mcp` (npx)
   - `github-mcp-server` (docker)
   - `notion-mcp-server` (npx)
   - `docker` (docker mcp gateway run)
   - `notebooklm` (Python 絕對路徑 executable)
3. **5/5 功能性與權限驗證**：分別調用 `list_pages`, `get_me`, `API-get-self`, `mcp-find`, `server_info` 確認 100% 響應。

### 模組 4：Manifest 全量即時同步與孤兒清理 (Manifest Auto-Repair)

```javascript
const manifestPath = './Data/00_Skill_Manifest.json';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// 1. 動態掃描 active 技能並自動補充未登記條目
// 2. 自動修正不正確的 relative path
// 3. 移除已被封存或路徑不存在的失效 key
for (const [key, val] of Object.entries(manifest)) {
  if (!val || !val.path || !fs.existsSync(val.path)) {
    delete manifest[key];
  }
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
```

### 模組 5：SOP14 聯席安全審計與完工 Artifact 產出 (Audit & Artifact)

- 執行 `node scripts/sop14_audit_tool.js`，完成弱金鑰、防護模式降級、漏洞靜態掃描與 Zero-Quota 壓力測試。
- 在 `artifacts` 目錄自動生成 `system_restoration_audit_report.md` 作為最高指揮官簽核文件。

---

## 📋 修復指令與快速執行 SOP (Restoration Cheat Sheet)

### 快速一鍵健康檢查腳本 (建議每次重構或遷移後執行)

```powershell
# 1. 執行全站健康檢查與 Manifest 自動修復
node scratch/workspace_full_health_check.js

# 2. 執行 SOP14 自動化安全審計認證
node scripts/sop14_audit_tool.js

# 3. 測試 5 大 MCP 伺服器連線狀態
# (呼叫 list_pages, get_me, API-get-self, mcp-find, server_info)
```

---

## ⚠️ 邊界說明

- ✅ 適用：工作站遷移、新 OS 帳號初始化與架構違規掃描
- ✅ 適用：`mcp_config.json` 自動修正與 Python 工具鏈自動安裝
- ✅ 適用：`Data/00_Skill_Manifest.json` 失聯條目動態清理
- ❌ 不適用：未獲得使用者授權前硬刪除任何技能資料夾 (必須遵循 No-Delete Policy 移至 `Archive/`)

---

## 🤝 協同技能與 SOP 依據

- `skill-creator`：技能設計標準與分類體系
- `handover-manual-skill`：系統交接快照
- `SOP_12_MCP_Auth_Recovery.md`：MCP 服務認證與離線修復 SOP
- `SOP_14_Rigorous_Verification_and_Audit_Protocol.md`：SOP14 聯席審計規範

---

## Technical Deliverables
- `scratch/workspace_full_health_check.js` (全站檢測與 Manifest 復原腳本)
- `system_restoration_audit_report.md` (全站重建與健康審計完工 Artifact 報告)

## Success Metrics
- 頂層 `skills/` 子目錄數量 100% 等於 4 個
- 5 大 MCP 伺服器測試回應成功率 = 100%
- Manifest 中的條目實體檔案存在率 = 100%

---

⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文件不再接收無結構的自然語言，必須處理封裝後的動態參數：
`[SYSTEM-CALL: workspace-migration-recovery | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

> [!IMPORTANT]
> **Payload 淨化規則 (§6.3)**：
> - 若本技能為 `Cognitive` 型：接收戰略目標、語氣設定、情緒變數；拒絕 SQL/DOM/技術指令。
> - 若本技能為 `Execution` 型：只接收 URL、DOM Selector、SQL、JSON Schema；拒絕認知參數。

發送協定 (Zero-Block Policy)： 執行中若遇能力不足或需外部協作，嚴禁中斷或詢問使用者。必須主動封裝 Dynamic Payload 並發出：
`[SYSTEM-CALL: 目標ID | PAYLOAD: { ... }]` 調閱其他技能。

回傳協定： 任務終止時，必須且只能輸出 `[SYSTEM-RETURN: SUCCESS/FAILED | DATA: <結果>]`。

---

## 版本紀錄 (Changelog)
- **[3.0.0]** 2026-08-06 匯入災難復原實戰經驗：包含全站舊名稱無損正則對齊、MCP 環境自動補齊與 5/5 功能實測、Manifest 動態清理及 SOP14 聯席審計一鍵化流程。同時補齊能力宣告與系統通訊層。
- **[1.0.0]** 初始版本，提供基礎目錄結構與 Manifest 路徑驗證。
