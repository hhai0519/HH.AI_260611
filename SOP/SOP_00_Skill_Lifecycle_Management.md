---
title: "技能全生命週期與防腐化治理"
version: "3.1.3"
tags: ["SOP", "技能治理", "Lifecycle", "防腐化", "V3.1.3"]
dependencies: ["Data/00_Skill_Manifest.json", "Templates/Template_00_Universal_Skill.md"]
---

# 技能全生命週期與防腐化治理 (Skill Lifecycle Governance SOP)

> [!CAUTION]
> **系統最高安全鐵律**：任何 AI 代理人接收到「新增技能」或「學習外部框架」的指令時，**絕對禁止**立即建立實體檔案。必須強制先讀取並執行本 SOP 的「防腐化過濾」階段。

本文件規範了工作站內所有技能從「誕生、更版、優化到淘汰」的完整生命週期，確保系統維持極簡、高內聚與低耦合。

---

## 一、 需求評估與防腐化過濾 (Pre-Flight Fit-Gap Analysis)

**觸發時機**：接收到新增技能指令，或要求整合外部網站/架構圖時。
**核心精神**：拒絕「名詞複製」，強制進行「底層邏輯拆解」。

### 1. 底層邏輯拆解 (Deconstruction)
- 剝離外部框架的 UI/UX 與專有名詞。
- 萃取出真正的「運作機制」（例如：這是一個分類系統？還是一個傳遞參數的協議？）。

### 2. 現有系統盤點 (System Audit)
- 讀取 `Data/00_Skill_Manifest.json` 與 `SOP_00_System_Architecture_Map.md`。
- 比對現有的 Orchestrators、Cognitive、Execution 技能。

### 3. 適配性與缺口分析決策樹 (Decision Tree)
代理人必須嚴格遵循以下路徑做出決策，並向使用者報告：
- 🔄 **【路徑 A：優化現有 Skill】**：若新機制可直接融入現有角色（例如增強某分析師的 Prompt），**禁止新增檔案**，轉入「三、技能優化與更版規範」。
- 🔼 **【路徑 B：提煉為通用規則】**：若新機制具有普適性（例如模組化傳遞），**禁止新增技能**，直接將規則寫入 `Templates/Template_00_Universal_Skill.md` 或全域通訊協議中。
- 🗑️ **【路徑 C：拒絕融合】**：若新機制流於花俏且對系統無實質幫助，主動建議捨棄。
- ✅ **【路徑 D：生成與新增】**：只有在確認系統存在「真實缺口」且無法透過上述方法解決時，才允許轉入「二、技能生成與新增規範」。

---

## 二、 技能生成與新增規範 (Generation & Creation)

當決策樹通過【路徑 D】後，嚴格執行以下落地流程：
1. **強制克隆**：必須以 `Templates/Template_00_Universal_Skill.md` 為唯一基礎進行開發。
2. **多態能力標記 (Polymorphic Capabilities — 強型別分流)**：YAML 標頭的 `capabilities` 必須依 `type` 欄位執行以下決策樹，任一 REQUIRED 欄位為空字串視為「未通過 CI/CD」，禁止存檔：

   ```
   IF (Skill.type IN ["cognitive", "orchestrator"]) {
       capabilities = {
           logic_depth:       REQUIRED  // 邏輯切入維度
           strategic_focus:   REQUIRED  // 策略聚焦點
           interaction_style: REQUIRED  // 表達互動風格
       }
   }
   ELSE IF (Skill.type == "execution") {
       capabilities = {
           tool_category: REQUIRED  // 工具類別 (如: Database, Browser Automation)
           execution_env: REQUIRED  // 執行環境 (如: Node.js/Playwright, Python/Pandas)
           io_format:     REQUIRED  // 輸入輸出格式 (如: JSON/CSV, PDF/Text)
       }
   }
   ```

3. **編碼強制攔截 (Encoding Pre-commit Hook)**：任何建立/更新文字檔結束前，必須執行 BOM 清洗並以 UTF-8 (無 BOM) 覆寫存檔。**白名單副檔名**：`.md`, `.yaml`, `.json`, `.ts`, `.js`, `.tsx`, `.jsx`, `.env`。**清洗範圍**：`skills/`、`SOP/`、`Data/`、`src/` 目錄。**嚴禁**對 `.png`, `.pdf`, `.mp4`, `.zip` 等二進位檔執行清洗，以防誤殺。禁止修改此 Regex（不得加 `g` flag 或 `\s+`）：

   ```javascript
   const WHITELIST_EXT = ['.md', '.yaml', '.json', '.ts', '.js', '.tsx', '.jsx', '.env'];
   const ext = path.extname(filePath).toLowerCase();
   if (WHITELIST_EXT.includes(ext)) {
     content = content.replace(/^\uFEFF+/, '');
     fs.writeFileSync(filePath, content, 'utf8');
   }
   // 二進位檔 (.png/.pdf/.mp4 等) 絕對跳過，禁止觸碰
   ```

4. **通訊合規**：必須實作標準的 `[SYSTEM-CALL]` 與 `[SYSTEM-RETURN]` 介面宣告。
5. **Payload 解析合規測試 (CI/CD Gate)**：Cognitive 或 Orchestrator 技能上線前，必須模擬發送含 `PAYLOAD` 的測試字串，驗證技能可解析 JSON 並印出 `objective` 等 Key。若解析失敗，禁止存檔。
6. **註冊驗證**：檔案落地後，強制觸發 Manifest Inject 並啟動 Ping Test。

---

## 三、 技能優化與更版規範 (Optimization & Versioning)

當決策樹進入【路徑 A】時，執行現有技能修改，必須遵守以下鐵律：

### 1. 無損優化 (Backward Compatibility)
- 嚴禁破壞該技能原有的輸入 (Input) 與輸出 (Output) 資料結構。
- `[SYSTEM-CALL]` 的參數定義必須保持向後相容。

### 2. 強制更版標記 (Semantic Versioning & Changelog)
- **版號躍升**：只要邏輯、Prompt 或相依性有任何變動，必須同步提升 YAML 標頭中的 `version:` 號碼（例如：修復 Bug `1.0.0` -> `1.0.1`；新增邏輯 `1.0.0` -> `1.1.0`）。
- **變更紀錄**：在該技能檔案的最底部，強制新增一區塊簡述更版內容。
  ```markdown
  ## 版本紀錄 (Changelog)
  - **[1.1.0]** 2026-05-XX：整合了跨代理人的模組化 Prompt 組裝邏輯。
  ```

---

## 四、 完工前自我審查與退版機制 (Post-Execution Self-Critique)

在結束該次修改/新增任務、回報使用者之前，Agent 必須強制執行最後一道安全閥：

1. **自我審查提問**：
   - 「這次的修改是否偏離了極簡架構？」
   - 「是否因為過度解讀而產生了冗餘的邏輯或檔案？」
   - 「新建/修改的檔案開頭是否已確認不含 `\uFEFF` BOM 字元？是否已執行 `replace(/^\uFEFF+/, '')` 清洗步驟？」
   - 「`capabilities` 欄位是否依 Skill.type 正確填寫對應的多態標籤？任一 REQUIRED 欄位是否為空？」
2. **自動回退 (Auto-Rollback)**：
   - 若 Agent 自我判定為「過度生成」，必須主動執行「自動回退」，清除剛剛建立的殘留檔案。
   - 恢復 Manifest，並向使用者回報失敗原因與替代方案（例如：發現其實只要修改現有 SOP 即可）。

---

## 五、 系統巡檢鉤子與非同步錯誤暫存 (Watchdog Hook & Async Buffer)

> [!IMPORTANT]
> 本節規範「Watchdog 巡檢機制」。請注意：**Watchdog Hook 是 SOP 中的邏輯規則**，與已刪除的實體技能 `sys-watchdog` 無任何關聯。

### 5.1 巡檢觸發時機

Agent 在以下情況**必須**自動觸發背景巡檢：
- **(a)** 啟動跨技能協作（呼叫 Recipe Mixer 或 `subagent-collaboration-skill`）之前
- **(b)** 掃描技能目錄（`skills/`）或讀取 Manifest 時
- **(c)** 執行任何 Manifest Sync / Manifest Inject 操作時

### 5.2 偵測清單 (Detection Checklist)

巡檢必須核查以下四類異常：

| # | 異常類型 | 偵測條件 |
|---|---|---|
| A | **Manifest 孤兒 (Orphan)** | 實體技能數量 ≠ `00_Skill_Manifest.json` 索引數量 |
| B | **YAML 標頭缺失** | `SKILL.md` 無法提取 `name` 欄位 |
| C | **BOM 污染** | 檔案起始字元含 `\uFEFF`（offset 0） |
| D | **capabilities 不合規** | 欄位為空 `{}`、缺失必填 key、或與 `type` 不符的多態標籤 |

### 5.3 強制禁止事項 (Safety Boundary)

偵測到任何異常時，Agent **絕對禁止**：
- ❌ 中斷或暫停當前主任務
- ❌ 自行執行未授權的大規模覆寫或刪除操作
- ❌ 向使用者發出超過**一行**的警示訊息

### 5.4 Buffer 寫入協定（V3.2.0 雲端原生狀態升級）

> [!IMPORTANT]
> **【V3.2.0 升級宣告】** 嚴禁使用 `fs.writeFileSync` 操作本地 `Pending_Optimization.json`。
> 所有 Agent 遇異常需紀錄優化事項時，**必須強制呼叫** `Modules/db_state_manager.js` 的 `writePendingOptimization` 方法寫入 Neon DB，由系統底層保障併發寫入之 ACID 安全。本地 JSON 機制已正式廢除。

```javascript
// Watchdog Buffer Write Protocol — V3.2.0 DB 標準寫入邏輯
const { writePendingOptimization } = require('./Modules/db_state_manager');

await writePendingOptimization({
  Timestamp:      new Date().toISOString(),
  Detected_Issue: '<異常描述字串>',
  Affected_Files: ['<受影響檔案路徑陣列>'],
  Suggested_Fix:  '<建議修復動作>',
  Status:         'PENDING',
  Priority:       'HIGH | MEDIUM | LOW',
}, '<Priority>'); // 第二參數同步設定 DB 欄位 priority
```

**優勢對比**：
| 特性 | 舊機制（JSON 檔） | 新機制（Neon DB） |
|------|-----------------|-----------------|
| 併發安全 | ❌ 競態危害 | ✅ 行級鎖 ACID |
| 查詢能力 | ❌ 全量讀取 | ✅ SQL 條件過濾 |
| 膨脹風險 | ❌ 無限成長 | ✅ SKIP LOCKED 佇列 |
| Context 佔用 | ❌ 隨異常增多 | ✅ 零 Context 佔用 |

### 5.5 錯誤物件 Schema（強制型別）

| 欄位 | 型別 | 是否必填 | 說明 |
|---|---|---|---|
| `Timestamp` | ISO 8601 String | ✅ REQUIRED | 異常偵測時間 |
| `Detected_Issue` | String | ✅ REQUIRED | 異常描述 |
| `Affected_Files` | String[] | ✅ REQUIRED | 受影響檔案路徑清單 |
| `Suggested_Fix` | String | ✅ REQUIRED | 建議的修復動作 |
| `Status` | `"PENDING"` \| `"RESOLVED"` | ✅ REQUIRED | 修復狀態 |
| `Priority` | `"HIGH"` \| `"MEDIUM"` \| `"LOW"` | ✅ REQUIRED | 優先級 |

---

### 6. 技能觸發詞排他性矩陣規範
* **設計原則**：防止多個 Agent 搶奪同一個使用者自然語言意圖而造成衝突。
* **排他性規則**：
  * **最高總管 (Orchestrator)**：觸發詞僅限於高階協調、戰略規劃與狀態控制（如 "自動化"、"SOP14"、"專案重組"）。
  * **專業代理 (Cognitive Agent)**：觸發詞僅限於專業學科（如 "台股"、"財務分析"），且**必須限定為僅能由 Orchestrator 進行內部調用**。
  * **審查流程**：新技能 onboarding 時，必須交叉檢驗 `triggers` 是否與既有活躍技能重疊，如有重疊則強制退回，直到修改為獨佔詞為止。

### 5.6 使用者通報協定 (Alert Protocol)

Buffer 寫入完成後，Agent **僅能**在對話**結尾**以一行警示通知使用者，禁止打斷正在進行的主任務說明：

```
⚠️ Watchdog 偵測到 N 個異常，已記錄至 Neon DB 待命。
```

使用者將依此訊息決定何時執行批次修復。**Agent 不得自行啟動修復。**

---

## 六、 三大架構防禦條款 (V3.0.0 Architecture Guard Clauses)

> [!CAUTION]
> 本節為 V3.0.0 強型別防禦條款。任何違反以下三條規則的技能，**禁止存檔**，並強制觸發 Watchdog 錯誤寫入。

### §6.1 反死鎖與單向依賴協定 (Anti-Deadlock & Uni-directional Flow)

**規則**：嚴禁同層級技能（特別是 `02_Cognitive` 層）產生「循環互相依賴」。

**定義**：若技能 A 在其「協同技能」或 `dependencies` 中宣告依賴技能 B，而技能 B 同時也宣告依賴技能 A，則構成循環依賴死鎖，**一律違規**。

**強制處置**：
- 若 A 技能與 B 技能需要共用邏輯或資料，必須將共用部分「向下抽取 (Extract-Down)」，於 `03_Execution` 層建立獨立的中轉工具（例如：共用的 `twse-market-logic-skill`）。
- 兩個技能各自單向依賴該中轉工具，禁止互相引用。
- 違者必須解耦後才允許存檔。

```
合法（單向）:  chip-logic → twse-market-logic  ✅
合法（單向）:  ownership-cluster → twse-market-logic  ✅
違規（循環）:  chip-logic ↔ ownership-cluster  ❌
```

---

### §6.2 嚴格命名空間映射 (Strict Namespace Binding) — V3.0.0 修訂版

> [!IMPORTANT]
> **V3.0.0 修訂宣告**：正式廢除「領域前綴強制要求」（如 `sys-`, `finance-`, `tool-`, `persona-` 等）。舊前綴規範自本版起作廢。

**規則**：技能的實體目錄名稱（Folder Name）必須與 YAML 標頭中的 `name:` 欄位**完全一致（1:1 Exact Match）**，且**不得添加冗餘前綴**。

**強制執行細則**：
1. 目錄名 = `name:` YAML 欄位，完全相同（區分大小寫，無前後空白，無域名前綴）。
2. 任何更名動作必須同步更新 `Data/skill_translations.json` 中的 `folder_path` 與 `aliases` 欄位，以及 `Data/00_Skill_Manifest.json`。
3. 舊前綴名（如 `finance-chip-logic`）應保留於 `aliases` 陣列中作為向後相容別名。
4. Watchdog 巡檢偵測到目錄名與 `name:` 不一致時，必須寫入 Buffer 並標記 Priority: HIGH。

**正確格式範例**：
```json
// Data/skill_translations.json
{
  "name": "chip-logic-expert",
  "folder_path": "02_Cognitive/chip-logic-expert",
  "aliases": ["chip-logic", "finance-chip-logic", "籌碼專家"]
}
```

**違規條件**：若實體目錄末段名稱與 `name:` 不符，且 `skill_translations.json` 中無對應別名映射記錄，視為違規，禁止存檔。

---

### §6.3 分層 Payload 淨化機制 (Payload Tiering Protocol)

**規則**：Orchestrator 在派發 Payload 時，必須根據目標層級進行「型別淨化」，嚴禁將錯誤型別的參數發送給不匹配的層級。

**強制型別矩陣**：

| 目標層級 | 允許的 Payload 內容 | 嚴禁包含 |
|---|---|---|
| `02_Cognitive` (Persona / Analyst) | 戰略目標、語氣設定、情緒變數、自然語言約束 | SQL 語句、DOM 路徑、raw URL、技術指令 |
| `03_Execution` (Tool) | URL、DOM Selector、SQL Query、JSON Schema、檔案路徑 | 認知參數、語氣描述、角色設定、情緒變數 |

**執行規則**：
1. `subagent-collaboration-skill` 作為 Payload 淨化的責任方，在組裝 Dynamic Payload 前必須識別目標層級。
2. 發送給 Cognitive 層前，過濾掉所有技術型參數。
3. 發送給 Execution 層前，過濾掉所有認知型參數，只保留純技術指令。
4. 任何 Orchestrator 直接將自然語言報告傳遞給 Execution 工具（如直接傳文字給 D3 工具），視為違規。

---

### §6.4 統一歸檔政策 (Unified Archive Policy) — V3.0.0 新增

> [!CAUTION]
> **廢除所有「直接物理刪除」條款**：任何先前文件中提及的「直接刪除技能目錄」或「二次確認後刪除」等模糊政策，自本版起一律作廢。

**唯一合法的停用流程**：
1. **物理歸檔**：將技能目錄整體移至工作站根目錄下的 `Archive/` 資料夾。
2. **Manifest 標記**：在 `Data/00_Skill_Manifest.json` 中找到對應條目，將 `status` 欄位設為 `"Disabled"`。
3. **Translation 保留**：`Data/skill_translations.json` 中的條目**不得刪除**，僅在 `aliases` 中追加 `"[ARCHIVED]"`。
4. **Pending 紀錄**：呼叫 `writePendingOptimization` 在 Neon DB 中寫入歸檔事件，Priority: LOW。

**格式範例**：
```json
// Data/00_Skill_Manifest.json — 已停用技能標記
{
  "id": "example-skill",
  "path": "Archive/example-skill",
  "status": "Disabled",
  "archived_at": "2026-05-04T00:00:00Z"
}
```

**嚴禁行為**：
- ❌ 直接 `rm -rf` 或 `Remove-Item` 刪除技能目錄
- ❌ 在 Manifest 中直接刪除條目（應改為標記 Disabled）
- ❌ 未經歸檔直接移除 `skill_translations.json` 映射記錄

---



---

## §7 跨平台編碼安全協定 (Cross-Platform Encoding Protocol)

> [!IMPORTANT]
> **V3.0.0 新增｜級別：SYSTEM-MANDATORY**
> 本協定為系統終極防線，所有涉及文字檔操作的腳本，無論新建或維護，皆須無條件遵守。

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

### §7.2 禁止使用 Hex 拼湊法 (No Char-Code Concatenation)

> [!CAUTION]
> **嚴禁**在腳本中使用 `[char]0xXXXX` 十六進位陣列拼湊人類可讀字串。

此做法雖可繞過 PowerShell 編碼問題，但：

- ❌ **完全喪失人類可讀性**，維護成本極高
- ❌ **難以 Code Review**，隱藏潛在安全風險
- ❌ **不具可移植性**，跨平台遷移時會引入新問題

**正確替代方案**：改用 §7.1 所規範的 Node.js 或 Python 腳本，以原生字串處理 CJK 內容。

### §7.3 PowerShell 強制 UTF-8 宣告 (PowerShell UTF-8 Lock)

若因特殊工程需求（如 CI/CD Pipeline、系統整合腳本）**必須**使用 PowerShell 處理含 CJK 字元的檔案，腳本開頭**必須強制加入**以下宣告，鎖死執行緒編碼：

```powershell
# §7.3 V3.0.0 強制 UTF-8 宣告 — 置於腳本第一行，禁止省略
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
```

> [!WARNING]
> 違反 §7.3 規定（未加 UTF-8 宣告）的 PowerShell 腳本，一律視為**不合規腳本**，禁止合入主線並須立即退回重寫。

### §7.4 腳本選用決策樹 (Decision Tree)

```
需要操作含 CJK 字元的檔案？
├─ YES → 優先使用 Node.js 或 Python (§7.1) ✅
│         └─ 若環境不允許 → PowerShell + §7.3 強制宣告
└─ NO  → 任意語言皆可，但仍建議 UTF-8 宣告
```

---

*§7 Cross-Platform Encoding Protocol — 由 V3.0.0 審計修復流程中的 Hex 拼湊血淚教訓總結，2026-05-04 正式立法。*

*執行簽章：SOP_00_Skill_Lifecycle_Management V3.0.0 — Anti-Deadlock / Namespace Binding (No-Prefix) / Payload Tiering / BOM Whitelist / Archive Policy / Cross-Platform Encoding Protocol Activated*
