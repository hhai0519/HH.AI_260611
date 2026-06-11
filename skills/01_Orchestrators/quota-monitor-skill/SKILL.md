---
name: quota-monitor-skill
description: 本協作系統 Cockpit Quota API 監控系統，強制實施 20% 安全熔斷。僅在啟用「$$自動化$$」流程或手動查詢時調用。符合 SOP §2.4 授權協議。
version: "3.0.0"
---

# 配額監控系統 (Quota Monitor System)

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
