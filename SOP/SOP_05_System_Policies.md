---
title: "系統核心治理政策"
version: "3.2.0"
tags: ["SOP", "系統政策", "治理", "Watchdog", "Governance"]
dependencies: ["SOP_00_Skill_Lifecycle_Management.md", "Modules/db_state_manager.js"]
---

# 本協作系統 系統核心治理政策 (System Governance Policies)

本文件規範 本協作系統 系統最頂層的核心治理規則，所有 Agent 技能與自動化流程均須無條件遵守。

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
- **唯一合法編碼**：系統內所有的文字檔案（包含 `*.md`, `*.json`, `*.py`, `*.js`, `*.ps1` 等）**強制使用 UTF-8 (無 BOM)** 格式儲存。
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

- **命名規則**：技能實體目錄名稱必須與該技能 `SKILL.md` YAML 標頭的 `name` 欄位**完全一致（1:1 映射）**，不得加入任何前綴、後綴或縮寫。
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

