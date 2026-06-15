---
name: quota-monitor-skill
description: 本協作系統 Cockpit Quota API 監控系統，強制實施 20% 安全熔斷。僅在啟用「$$自動化$$」流程或手動查詢時調用。符合 SOP §2.4 授權協議。
version: "3.0.0"
type: "orchestrator"
capabilities:
  logic_depth: "Standard"
  strategic_focus: "General Analysis"
  interaction_style: "Professional"
---

# 配額監控系統 (Quota Monitor System)

### 【摘要】觸發條件與 DLP 聲明
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議

## 功能概述
整合了 本協作系統 Cockpit 的底層 JSON 快取，提供自動化的 AI Credits 與 Model Quota 監控。本技能可確保對 Gemini Pro、Gemini Flash、Claude 系列模型的 API 剩餘配額 (Remaining Fraction) 進行實時追蹤，當可用配額低於 20% 的安全底線時，觸發系統防護熔斷機制。

## 觸發條件
- 詢問目前配額狀況或執行「$$自動化$$」任務前的安全性檢查。
- 需要進行資源消耗監控以確保系統穩定。

## 執行流程
1. **快取讀取**：定位 `%USERPROFILE%\.本協作系統_cockpit\cache\quota_api_v1_plugin\authorized\` 內最新的 JSON 狀態快取。
2. **配額解析**：遍歷 `payload.models` 中的所有 `pro`, `claude`, `flash` 相關模型。
3. **安全判定**：提取 `remainingFraction` 的最小百分比，若無紀錄則預設為安全 (1.0)。若配額跌破 20%，則立刻停止並介入安全終止狀態。

## 邊界說明
- ✅ 適用：自動化檢查目前可用配額，確保資源不超載。
- ❌ 不適用：直接呼叫 API 扣抵配額，無法變更或偽造剩餘點數。

## 協同技能
- systematic-debugging-skill
## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議


---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文檔不再接收無結構的自然語言，必須處理封裝後的動態參數：
`[SYSTEM-CALL: quota-monitor-skill | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

> [!IMPORTANT]
> **Payload 淨化規則 (§6.3)**：
> - 若本技能為 `Cognitive` 型：接收戰略目標、語氣設定、情緒變數；拒絕 SQL/DOM/技術指令。
> - 若本技能為 `Execution` 型：只接收 URL、DOM Selector、SQL、JSON Schema；拒絕認知參數。

發送協定 (Zero-Block Policy)： 執行中若遇能力不足或需外部協作，嚴禁中斷或詢問使用者。必須主動封裝 Dynamic Payload 並發出：
`[SYSTEM-CALL: 目標ID | PAYLOAD: { ... }]` 調閱其他技能。

回傳協定： 任務終止時，必須且只能輸出 `[SYSTEM-RETURN: SUCCESS/FAILED | DATA: <結果>]`。
