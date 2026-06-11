---
name: recursive-research-automation
type: orchestrator
description: "通用的遞迴研究自動化框架。僅在指令包含「$$自動化$$」時啟用。符合 SOP §2.4 強制授權協議。"
version: "3.0.0"
capabilities:
  logic_depth: "遞迴深化研究路徑與子方向識別"
  strategic_focus: "配額管理與深度研究產出"
  interaction_style: "廣度→深度且自主收斂"
---

# 遞迴研究自動化路徑 (Recursive Research Automation Path)

## 功能概述
本技能定義了自動化深度研究的標準作業程式 (SOP)。它採用「遞迴式」的研究邏輯，透過不斷分析前一階段的發現來啟動更深化的研究路徑，並整合資源配額監控（如 Gemini 3 Flash 配額），確保在資源耗盡前（預設 20%）安全產出報告。

## 觸發條件
- 指令必須明確包含「$$自動化$$」。
- 需要在背景不斷運行研究直到配額觸發終結條件。
- 要求進行受控的深度遞迴分析。

## 執行流程

### 1. 初始化與規劃 (Initial Setup)
- **定義主題**：確立研究的核心領域（如：臺股技術指標、AI 醫療應用）。
- **設定終結點**：確認監控對象（預設為 Gemini 3 Flash）與門檻（預設 20%）。
- **啟動任務單**：在 `task.md` 中標註當前自動化循環的版本。

### 2. 廣度探索階段 (Breadth Exploration)
- 使用 `notebooklm_research_start` 或搜尋工具進行首波資料採集。
- 收集至少 10-20 個初步來源，並導入目標筆記本。

### 3. 遞迴深化循環 (Recursive Deepening Loop)
- **分析發現**：讀取上一階段的摘要，識別出「未解之謎」或「具潛力的子方向」。
- **下達加深指令**：針對識別出的子方向，重新啟動更細緻的研究任務。
- **動態調整**：根據新資訊修正研究路徑，確保不偏離核心主題。

### 4. 資源配額監控 (Quota Monitoring)
- 每次循環跳轉前，必須執行 `scripts/quota_monitor.py`。
- 若配額 > 20%：繼續下一個循環。
- 若配額 <= 20%：觸發「強制終結序列」。

### 5. 終結與報告 (Termination & Reporting)
- **整合資料**：調用 `studio_create` 產出最終報告。
- **語言規範**：統一使用 **繁體中文**。
- **產出檔案**：預設儲存為 `[PROJECT_NAME]_FINAL_REPORT.md`。

## 邊界說明
- ✅ 適用：需要極高深度的主題研究、長時程的背景資料監測、複雜的技術調研。
- ❌ 不適用：簡單的一次性問答、無配額限制的任務、不需深化的基礎查詢。

## 協同技能
- `nlm-skill`：核心研究工具。
- `twse-market-logic-skill`：臺股研究時的邏輯參考。
- `quant-research-loop`：量化資料驗證。
- `systematic-debugging-skill`：自動化中斷時的排障。

## 版本紀錄 (Changelog)
- **[2.0.0]** 2026-05-04：V2.0.0 Orchestrator Alignment — 依生命週期 SOP 導入三維認知能力矩陣標籤 (logic_depth, strategic_focus, interaction_style)，完成 Manifest 全域補錄。

## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議
