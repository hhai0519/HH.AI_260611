---
title: "新技能全自動報到標準作業程序"
version: "3.1.3"
tags: ["SOP", "技能新增", "Onboarding", "CI/CD"]
dependencies: ["Templates/Template_00_Universal_Skill.md", "Data/00_Skill_Manifest.json", "SOP_00_Skill_Lifecycle_Management.md"]
---

# 新技能全自動報到 SOP (New Skill Onboarding)

當系統或使用者要求「新增技能」時，接手的 Agent 必須在背景依序執行以下 4 個標準動作，以確保技能 100% 遵守跨代理人通訊協議與系統架構規範。

## 1. 自動克隆 (Auto-Clone)
強制複製 `Templates/Template_00_Universal_Skill.md` 作為開發起點。
- **目錄命名強制原則**：技能資料夾的命名必須完全基於「功能性」（例如 `ui-prototype-builder`），嚴禁直接保留來源專案的原始名稱（例如 `claude-canva-design`）。
- 絕對禁止使用 Agent 自身的預設格式。
- 必須保留模板底部的 `【系統通訊層宣告 (System Comms Layer)】`。

## 2. 索引寫入與映射表同步 (Manifest Inject & Translation Sync)
新技能檔案建立並儲存後，強制執行以下**兩步操作**：

### 2a. Manifest 注入
強制修改 `Data/00_Skill_Manifest.json`，寫入精確的 JSON 物件。
資料結構必須包含：
```json
{
  "id": "技能的唯一識別碼",
  "path": "相對路徑 (例如: skills/03_Execution/tool-example)",
  "type": "分類 (Orchestrators/Cognitive/Execution)",
  "triggers": ["觸發關鍵字1", "觸發關鍵字2"],
  "dependencies": ["相依的技能ID"]
}
```

### 2b. 全域別名映射表同步（強制，不可省略）

> [!CAUTION]
> **依 SOP §6.2 嚴格命名空間映射**：新技能存檔或更名後，除了更新 Manifest，**必須**同步更新 `Data/skill_translations.json`，確保全域別名路由不會斷鏈。

強制寫入以下格式的映射條目：
```json
{
  "name": "技能 YAML 標頭的 name 值（與資料夾名稱完全一致）",
  "folder_path": "層級/資料夾名稱（例如 03_Execution/playwright-automation）",
  "layer": "所屬層級（01_Orchestrators / 02_Cognitive / 03_Execution）",
  "aliases": ["舊目錄前綴名", "中文簡稱", "其他觸發別名"]
}
```

**更名時的同步義務**：若對已存在的技能資料夾進行更名，必須：
1. 同步更新 `skill_translations.json` 中對應條目的 `folder_path`
2. 將舊目錄名加入 `aliases` 陣列（作為向後相容的別名保留）
3. 觸發 Watchdog 巡檢，確認更名後無孤兒 Manifest 項目



## 3. 語法檢核 (Syntax Linting)
自動檢查以下事項：
- **YAML 標頭** 是否存在且欄位齊全 (`name`, `description`, `version`, `type`, `capabilities`)。
- **多態 capabilities 驗證**：依 `type` 檢查對應欄位是否皆非空字串：
  - Cognitive/Orchestrator → `logic_depth`, `strategic_focus`, `interaction_style` 必填
  - Execution → `tool_category`, `execution_env`, `io_format` 必填
- **BOM 編碼攔截 (Encoding Pre-commit Hook)**：寫入任何 `.md` 或 `.yaml` 之前，強制執行清洗。使用且僅使用以下 Regex，禁止加 `g` flag 或 `\s+`：
  ```javascript
  content = content.replace(/^\uFEFF+/, '');
  fs.writeFileSync(filePath, content, 'utf8');
  ```
  若 Linting 未通過，禁止進入 Manifest Inject 步驟。
- **通訊協定宣告** 檢查底部是否完整包含 `[SYSTEM-CALL]` 與 `[SYSTEM-RETURN]` 的強型別通訊介面與 `Zero-Block Policy`。
- **DLP 與結構檢核**：強制檢查檔案是否包含 SOP_03 規定的 `### 【摘要】觸發條件與 DLP 聲明`，以及標準 H2 標題（核心功能、操作步驟等）。若有缺失，一律阻擋存檔。

## 4. 連線與 Payload 合規測試 (CI/CD Gate) [防呆機制]
Agent 必須執行兩階段測試：

**階段 4a — Ping Test：**
```text
[SYSTEM-CALL: <新技能ID> | TASK: Ping | CONTEXT: None]
```
必須驗證該技能可以正確解析並回傳：
```text
[SYSTEM-RETURN: SUCCESS | DATA: Pong]
```

**階段 4b — Payload 解析合規測試（僅限 Cognitive / Orchestrator 技能）：**
Agent 必須模擬發送以下格式的字串：
```text
[SYSTEM-CALL: <新技能ID> | PAYLOAD: { "objective": "test", "target_audience": "QA", "strategic_constraints": "none", "tone_variables": "neutral" }]
```
技能必須能將 `PAYLOAD` 正確解析為 JSON 物件並印出 `objective` Key 的值。若解析失敗，視為「CI/CD 不通過」，禁止存檔，Agent 必須進入 Debugging 流程自行修復直至兩項測試均通過為止。

---

## 5. CI/CD 旁路機制 (Onboarding Bypass) — V3.0.0 新增

> [!IMPORTANT]
> **死鎖解除條款**：新技能在通過 CI/CD 測試前無法寫入 `skill_translations.json`，但查詢失敗會阻斷 CI/CD，形成循環死鎖。本條款提供合法旁路出口。

### 5.1 旁路觸發條件

當技能尚在 Onboarding 測試階段（即 `skill_translations.json` 中**尚無**該技能的映射條目），允許在 `[SYSTEM-CALL]` 中傳入旁路旗標：

```text
[SYSTEM-CALL: <新技能ID> | TASK: Ping | is_onboarding_test: true | CONTEXT: None]
- **DLP 與結構檢核**：強制檢查檔案是否包含 SOP_03 規定的 `### 【摘要】觸發條件與 DLP 聲明`，以及標準 H2 標題（核心功能、操作步驟等）。若有缺失，一律阻擋存檔。

## 4. 連線與 Payload 合規測試 (CI/CD Gate) [防呆機制]
Agent 必須執行兩階段測試：

**階段 4a — Ping Test：**
```text
[SYSTEM-CALL: <新技能ID> | TASK: Ping | CONTEXT: None]
```
必須驗證該技能可以正確解析並回傳：
```text
[SYSTEM-RETURN: SUCCESS | DATA: Pong]
```

**階段 4b — Payload 解析合規測試（僅限 Cognitive / Orchestrator 技能）：**
Agent 必須模擬發送以下格式的字串：
```text
[SYSTEM-CALL: <新技能ID> | PAYLOAD: { "objective": "test", "target_audience": "QA", "strategic_constraints": "none", "tone_variables": "neutral" }]
```
技能必須能將 `PAYLOAD` 正確解析為 JSON 物件並印出 `objective` Key 的值。若解析失敗，視為「CI/CD 不通過」，禁止存檔，Agent 必須進入 Debugging 流程自行修復直至兩項測試均通過為止。

---

## 5. CI/CD 旁路機制 (Onboarding Bypass) — V3.0.0 新增

> [!IMPORTANT]
> **死鎖解除條款**：新技能在通過 CI/CD 測試前無法寫入 `skill_translations.json`，但查詢失敗會阻斷 CI/CD，形成循環死鎖。本條款提供合法旁路出口。

### 5.1 旁路觸發條件

當技能尚在 Onboarding 測試階段（即 `skill_translations.json` 中**尚無**該技能的映射條目），允許在 `[SYSTEM-CALL]` 中傳入旁路旗標：

```text
[SYSTEM-CALL: <新技能ID> | TASK: Ping | is_onboarding_test: true | CONTEXT: None]
```

> [!CAUTION]
> **安全限制 (Security Constraint)**： `is_onboarding_test` 旁標僅允許在系統明確處於「開發與測試工作階段 (Dev/Test Session)」時被呼叫。
> **嚴禁**在常規生產路由 (Production Routing) 中夾帶此參數。違規者視為安全漏洞濫用，必須觸發 Watchdog 錯誤寫入並拒絕執行。

### 5.2 旁路邏輯

- 當路由核心解析到 `is_onboarding_test` 旗標：
  - **繞過**強制查詢 `Data/skill_translations.json` 驗證技能是否存在的步驟。
  - 直接調用 `writePendingOptimization()` 向 Neon DB 寫入含有該技能 ID 的任務，標籤記為 `[ONBOARDING_TEST]`。
  - 等待執行引擎直接抓取並傳送「Ping」操作。
- 測試任務一旦拋出，路由模組即可暫時結束責任。

---

## 6. 最終註冊與旁路失效 (§6. Finalization & Bypass Deactivation)

技能通過完整 CI/CD 測試（4a + 4b）後，**必須**立即補全 §2b 的映射表同步：
1. 寫入 `Data/skill_translations.json` 完整條目
2. 確保在 Neon DB 中將該筆任務更新為 `"RESOLVED"`（或交由排程器處理）
3. 旁路條款自動失效，後續調用恢復正常強制查詢流程

---

## 7. MCP 伺服器與外部大腦串接 (MCP Integration)

當新技能需要調用外部環境（如 GitHub、Notion、NotebookLM）時，必須遵守 MCP 串接規範：
- **單一真理來源**：所有 MCP 伺服器的連線配置必須且只能維護於 `C:\Users\HH.AI_260611\.gemini\config\mcp_config.json`。
- **禁止本地配置**：嚴禁在單一技能的目錄內私自存放獨立的 MCP 啟動設定檔，以確保全域授權的統一管理與安全性。
