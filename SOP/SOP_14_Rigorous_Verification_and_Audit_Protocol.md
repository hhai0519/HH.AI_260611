---
title: "嚴謹驗證與審計標準程序"
version: "1.0.0"
tags: ["SOP", "Audit", "Verification", "Rigorous", "Planning"]
dependencies: ["SOP_00_Skill_Lifecycle_Management.md", "SOP_05_System_Policies.md", "SOP_11_Task_Reflection_Protocol.md"]
---

# 嚴謹驗證與審計標準程序 (Rigorous Verification & Audit Protocol)

**核心精神**：慎始敬終。以多層審查防範漏洞，以分段驗證確保穩定。

---

## 1. 聯席審計規範 (Joint Audit Standard)

當觸發本程序時，Orchestrator 必須模擬並召集以下四個角色的聯席會議，產出獨立的審查意見：

### 1.1 資安稽核官 (Security Auditor)
- 檢查金鑰暴露（如 `.env.local` 密碼洩漏）。
- 檢驗極端情境的 Fallback 機制（如變數未定義時的預設值安全）。
- 檢查是否符合 WMI 精準狙擊原則（SOP_02）。

### 1.2 代碼與架構審查官 (Code Reviewer & Architect)
- 靜態掃描是否有語法衝突（如重複宣告 `const path`）。
- 掃描參數傳遞的精準性與變數作用域。
- 確認無窮迴圈等 Anti-Pattern。

### 1.3 顧問團 (Advisory Board)
- **Node.js 顧問**：評估非同步與事件驅動效能。
- **DevOps 顧問**：評估環境變數與容器化對接。
- **SRE 顧問**：評估進程生命週期與重試退避機制（Backoff）。

### 1.4 總架構師 (Chief Architect)
- 執行最後的「全域副作用與相容性評估」，給予最終核發。

---

## 2. 前置沙盒模擬測試 (Pre-flight Sandbox Simulation)

- **強約束**：禁止直接在工作區實際代碼上進行測試。
- **執行方式**：建立獨立的模擬測試腳本（如 `sandbox_test.js`），在隔離的控制台環境運行參數解析與邏輯邊界測試，並將結果輸出為 `SIMULATION_TEST_REPORT.md`。

---

## 3. 使用者確認防線 (User Consent Barrier)

- **強約束**：在使用者未輸入「同意執行」或「Proceed」前，代理人必須凍結工作區修改權限。
- 必須完整呈現：
  1. 聯席審計意見彙整。
  2. 模擬測試結果。
  3. 分段執行計畫。

---

## 4. 分段執行與階段簽章審計 (Phased Execution & Intermediate Audit)

1. **清單化管理**：建立 `task.md` 並拆分為 `Phase A, B, C...`。
2. **階段解凍**：每完成一個 Phase 的變更，必須執行該 Phase 的單元測試。
3. **階段審計**：由相關 Agent 進行階段查核。只有在上一階段 100% 審計通過且在 `task.md` 標記為 `[x]` 後，下一個 Phase 才能解凍執行。
4. **失敗退回**：若任一階段審計失敗，必須立即退回 Stage 1，啟動反思程序（SOP_11）。

---

## 5. Walkthrough 與結案報告 (Closing & Traceability)

- 任務成功後，產出純 UTF-8 (無 BOM) 的 `walkthrough.md`。
- 必須詳列修改的檔案路徑與行號連結，並附上最終功能驗證成功的終端機日誌。
