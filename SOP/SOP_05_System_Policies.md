---
title: "系統核心治理政策"
version: "3.2.0"
tags: ["SOP", "系統政策", "治理", "Watchdog", "Governance"]
dependencies: ["SOP_00_Skill_Lifecycle_Management.md", "Modules/db_state_manager.js"]
---

# 本協作系統 系統核心治理政策 (System Governance Policies)

本文件規範 本協作系統 系統最頂層的核心治理規則，所有 Agent 技能與自動化流程均須無條件遵守。

---

### 🚫 絕對禁止事項 (Anti-Patterns) [HARD CONSTRAINTS]

> [!CAUTION]
> **觸犯以下禁止事項，系統將立即判定任務失敗 (Task Failed)，並啟動斷路器強行中斷 Session。**

1. **禁止常駐進程 (Resident Polling)**
   - **嚴禁**使用 `setInterval`、`setTimeout` 建立私有的背景常駐輪詢。
   - **嚴禁**使用 `forever`、`nodemon` 等未授權的第三方守護進程管理工具。
   - `*【官方特許豁免 V2】*`：PM2 可用於管理以下兩個官方認可的 App（可同時並行獨立運行）：
     1. `line-bridge`（LINE Bot 橋接器，透過 `Start-LineBot.ps1` V3.0 管理）
     2. `telegram-cdp-bridge`（Telegram CDP 橋接器，透過 `Start-TelegramBot.ps1` V1.0 管理）
     嚴禁在 PM2 中新增上述以外的任何其他 App（包含 cloudflare-tunnel）。
   - 開機自啟動機制首選 Windows Task Scheduler（延遲 60 秒啟動）。若因缺乏管理員權限無法建立，允許在 Startup 資料夾放置 `Antigravity-LINE-Bridge.vbs` 作為無 UAC 提示的備援機制。嚴禁放置其他 .bat 或 .lnk。
2. **禁止破壞性 Git 指令 (Destructive Commands)**
   - **嚴禁**在腳本內寫死或執行 `git checkout .`、`git reset --hard`、`rm -rf` 等具有歷史抹除與物理破壞性的暴力還原指令。
3. **禁止終端機越權寫入 (Unsafe File Writing)**
   - **嚴禁**在終端機使用 PowerShell 的 `Out-File`、`Set-Content` 或 `>` 重導向來寫入程式碼或檔案。
   - 所有寫入操作強制使用專用 API 工具 (`write_to_file`)，並確保為 **無 BOM 的標準 UTF-8** 編碼。
4. **禁止檔案型跨進程通訊 (No File-Based IPC)**
   - **嚴禁**以「寫入暫存 `.txt` 或 `.json` 再由另一個程式讀取」的方式進行跨進程資料傳遞。
   - **唯一合法作法**：強制使用記憶體串流 `stdio: ['pipe', 'pipe', 'pipe']`，或透過本機 HTTP API / WebSocket 進行傳遞。

5. **嚴禁 PowerShell 隱形母體 (No Hidden PowerShell Daemons)**
   - **嚴禁**使用 PowerShell 的 `-WindowStyle Hidden` 啟動任何需要長期常駐的背景服務。
   - **唯一合法作法**：背景隱藏進程必須統一由 Node.js 發動 `child_process.spawn()` 並強制帶入 `{ windowsHide: true }` 旗標。

6. **強制實作進程連坐法 (Process Synergy — Full Signal Coverage)**
   - 任何由 Node.js 衍生的子進程，**強制要求**同時掛載以下三個信號監聽器：
   - `process.on('exit', fn)` — 正常退出清理
   - `process.on('SIGINT', fn)` — 使用者 Ctrl+C 中斷清理
   - `process.on('SIGTERM', fn)` — 系統終止信號清理

### 🔒 工具呼叫狀態綁定 (Slot-filling Verification)
Agent 在調用任何檔案寫入或終端指令前，**必須**動態填充並核對以下狀態插槽 (Slots)。狀態不符者立即中斷操作：
- `[Current Workspace Root]`: 確認目標路徑是否在預期且合法的技能目錄內。
- `[Intended Write Encoding]`: 寫入前強制確認預期編碼為 UTF-8 (無 BOM)。

---

## 1. Watchdog 非同步巡檢機制 [HIGHEST_PERMISSION]

> [!IMPORTANT]
> **V3.2.0 架構宣告**：系統已全面採用**非同步 Watchdog Hook 機制與 Neon DB 佇列**。所有異常偵測結果需呼叫 `Modules/db_state_manager.js` 的 `writePendingOptimization(priority, taskData)` 寫入資料庫。
> **舊版本地 `Data/Pending_Optimization.json` 寫入機制已正式廢除。**

### 1.1 現行 Watchdog Hook 機制說明
- 系統巡檢採用**非同步背景偵測**方式執行，不依賴任何實體常駐腳本。
- Agent 在執行跨技能協作、掃描技能目錄或進行 Manifest 同步等操作時，**自動觸發**內建巡檢邏輯。
- 偵測到異常時，Agent 必須呼叫 `writePendingOptimization` 將錯誤寫入 Neon DB 佇列，詳細規範見 `SOP_00_Skill_Lifecycle_Management.md §5`。

### 1.2 異常回報協定

- 偵測到異常時，Agent **僅能**在對話**結尾**以一行警示通知使用者：
  ```
  ⚠️ Watchdog 偵測到 N 個異常，已寫入 Neon DB 佇列待命。
  ```
- 系統已導入**「維護時間窗 (Maintenance Window)」**機制。Agent **不得**在常規任務中自行啟動修復，低/中優先級的異常將由背景排程器（`Modules/maintenance_worker.js`）在系統閒置時自動批次派發給反思模組處理。

> [!NOTE]
> **優先級處置規則**：
> - `LOW` / `MEDIUM`：寫入 Neon DB 佇列，由 `maintenance_worker.js` 排程自動處理。
> - `HIGH` / `CRITICAL`：仍需即時通知使用者，等待人工確認後優先處置。

### 1.3 廢除條款聲明（Deprecation Notice）
以下條款自 V3.1.3 起**正式廢除**，任何文件中仍保留相關描述者，視為過時資訊，應忽略：
- ~~實體腳本 `scripts\watchdog.ps1` 的建立與執行~~
- ~~`.watchdog_authorized` 授權憑證檔案機制~~
- ~~觸發指令 `$$Watchdog$$` 啟動實體巡檢~~
- ~~任何要求 Agent 主動輪詢或等待 watchdog 回應的流程~~

---

## 2. 通訊授權管理政策

### 2.1 語言規定
- 所有 Agent 輸出的對話回覆、規劃文件與正式報告，必須使用**台灣正體中文**撰寫。
- 允許保留英文技術術語縮寫（如 API、SOP、YAML），但說明性段落須以正體中文撰寫。

---

## 3. 嚴格配額監控政策

- 本系統所有自動化任務皆須遵守 20% 配額安全熔斷機制。
- 超出警戒線時，Agent 必須立即暫停任務並通知使用者，禁止自行決策繼續執行。
- 配額監控相關規範詳見 `SOP_01_Automation_Process.md §2.2`。

---

## 4. 跨平台編碼與檔案規範 (Cross-Platform Encoding Protocol)

### 4.1 零容忍編碼政策
- **唯一合法編碼**：系統內所有的文字檔案（包含 `*.md`, `*.json`, `*.py`, `*.js`, `*.ps1` 等）**強制使用 UTF-8 (無 BOM)** 格式儲存。唯一特許例外：主選單 `00_Master_Menu.ps1` 為了相容 Windows PowerShell 5.1 的解釋器限制，強制採用 UTF-8 with BOM 格式儲存。
- **BOM 字元防範**：嚴禁檔案中出現 `\uFEFF` (BOM) 字元。任何因工具（如 Windows 記事本）自動附加 BOM 所導致的損壞，系統一旦發現必須立即進行無 BOM 清洗作業。
- **跨平台相容**：行尾符號（Line Endings）應盡量保持標準化（如預設 LF 或相容 CRLF），但在任何修改與寫入操作中，絕對禁止引入非標準或混合編碼。

---

## 5. 技能目錄與命名空間治理 (Namespace Governance)

### 5.1 架構層級劃分
- 所有技能實體必須存放於 `skills/` 目錄，並嚴格歸類於以下三大主目錄：
  - `01_Orchestrators/`：總管與高階流程控制模組。
  - `02_Cognitive/`：思考模型、邏輯推演與知識性分析模組。
  - `03_Execution/`：單純的工具調用、檔案操作與實體執行腳本。

### 5.2 嚴格 1:1 映射原則（無前綴）

> [!CAUTION]
> **V3.1.3 架構宣告：強制前綴政策（`sys-*`, `finance-*`, `tool-*`, `persona-*`）已正式廢除。**
> 任何文件中仍保留相關前綴規定者，視為過期條文，一律忽略。

- **命名規則**：技能實體目錄名稱必須與該技能 `SKILL.md` YAML 標頭的 `name` 欄位**完全一致（1:1 映射）**，不得加入任何前綴、後綴或縮寫。唯一歷史遺留特許：`skills/03_Execution/tool-executor` 為了避免協作鏈中斷，保留其原有名稱不進行強制變更。
- **技能分類管理**：所有技能的分類、標籤與所屬層級，統一由 `Data/00_Skill_Manifest.json` 集中管理。SOP 文件中禁止重複維護靜態分類列表。
- **合規驗證**：新增或更名技能後，必須確認 Manifest 的 `path` 欄位與實體目錄名稱完全一致，否則視為架構違規。

### 5.3 Manifest 絕對同步原則
- `Data/00_Skill_Manifest.json` 必須與物理檔案系統 (`skills/`) 維持 100% 的絕對同步。
- 若發生目錄重命名、移動或新增，必須在同一操作週期內更新 Manifest 的 `path` 欄位，否則將觸發系統中斷與 Watchdog 錯誤。

---

## 6. 系統備份與版本控制規範 (System Backup Protocol)

### 6.1 GitLab 遠端備份政策
- **常態性版控**：工作區內的所有原始碼、設定檔及 SOP 文件，必須全面納入 Git 版本控制，並定期執行 `git commit`。
- **單一真實來源**：所有變更應定期推送 (Push) 至指定的 GitLab 專案（如 `hh.ai.20260519-project`），確保系統環境、知識庫及架構資產具備異地備援與可溯源性。
- **執行要求**：進行系統更新或大規模架構重構前，必須強制執行備份推送至遠端，並確認提交流程順利（無卡在 `COMMIT_EDITMSG` 等中斷狀態）。

---

## 7. 技能不刪除原則 (No-Delete Policy) [HIGHEST_PERMISSION]

> [!CAUTION]
> **系統最高優先原則**：任何技能目錄或 SKILL.md 的直接刪除操作，均須使用者進行 **2 次明確確認**方可執行。違反此原則將導致 Agent 能力不可逆的喪失。

### 7.1 允許的技能狀態調整
- ✅ **重新分類**：修改 `Data/skill_translations.json` 中的分類欄位
- ✅ **標記 Legacy**：在 SKILL.md `description` 加注 `[Legacy]`，技能卡片保留
- ✅ **歸檔至 Archive**：`Move-Item` 至 `skills/Archive/`（保留實體，僅移出活躍區）
- ❌ **直接刪除 SKILL.md 檔案**
- ❌ **直接刪除技能資料夾**

### 7.2 雙重確認流程

當使用者主動要求刪除技能時，Agent 必須嚴格執行以下流程：

1. **第一次確認**：Agent 詢問「您確定要刪除 `[技能名稱]`？此操作不可逆，建議改為歸檔至 Archive/。」
2. **使用者確認**後，Agent 詢問「請再次輸入技能名稱以確認刪除（輸入：`[技能名稱]`）」
3. 使用者輸入**完全一致**後方可執行
4. 執行前強制執行 `git commit` 備份

> [!NOTE]
> 本原則取代所有分散在個別技能文件中的 No-Delete Policy 說明。各技能文件如有相關段落，應改為「詳見 `SOP_05_System_Policies.md §7`」。

