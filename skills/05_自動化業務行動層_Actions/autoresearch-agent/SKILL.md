---
name: autoresearch-agent
type: orchestrator
description: "微型 AI 模型超引數自動化最佳化代理人。僅在指令包含「$$自動化$$」且涉及模型最佳化時啟用。符合 SOP §2.4 強制授權協議。"
version: "3.0.0"
type: "orchestrator"
capabilities:
  logic_depth: "超引數搜尋空間與 val_bpb 最小化"
  strategic_focus: "時間預算內自動化實驗迭代"
  interaction_style: "精準且資源受限"
  authorized_mcp_tools: ["Persona Knowledge MCP"]
---

# 核心最佳化代理人 (AutoResearch Agent Path)

### 【摘要】觸發條件與 DLP 宣告
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議

## 功能概述
本技能定義了微型模型 (LLM) 在受限運算資源 (CPU) 下的自動化最佳化流程。它基於 Andrej Karpathy 的 `autoresearch` 改編，目標是在 60 秒的固定時間預算內，透過調整超引數（如深度、學習率、啟用函式等）來最小化 `val_bpb` 指標。

- 指令必須明確包含「$$自動化$$」。
- 需要進行自動化模型超引數最佳化迴圈。
- 啟動受控的實驗迴圈 sequence。

## 核心流程 (Core Workflow)

### 1. 環境配置 (Environment)
- **依賴安裝**：`torch`, `datasets`, `tokenizers`, `numpy`。
- **資料準備**：執行 `python prepare_cpu.py` 進行一鍵式資料下載與分詞。

### 2. 實驗迴圈 (Experiment Loop)
- **目標設定**：固定 `TIME_BUDGET=60s`。
- **可變引數 (Search Space)**：
    - `DEPTH`: 模型層數 (2, 3, 4)。
    - `LR`, `BETAS`, `WEIGHT_DECAY`: 最佳化器引數。
    - `MAX_SEQ_LEN`: 序列長度。
    - `Activation`: 啟用函式型別。
- **執行指令**：`python train_cpu.py > run.log 2>&1`。

### 3. 指標提煉與日誌 (Metrics & Logging)
- 每次實驗結束後，從日誌中提取 `val_bpb`、`val_loss` 與引數量。
- 記錄至 `results.tsv` (Tab-separated) 以追蹤進度。
- **自動進退**：若有改進則推進分支，若無改進則回退。

## 限制與邊界
- ✅ 適用：快速驗證模型架構、超引數搜尋策略研究、邊緣運算最佳化。
- ❌ 不適用：大規模語言模型訓練、GPU 加速任務、非語言建模任務。

## 協同技能
- `systematic-debugging-skill`：處理訓練中斷。
- `optimization-status`：監控背景執行狀態。


- ✓ DLP 資料安全驗證已透過 | 資料本地處理 | 隱私保護協議

## 版本紀錄 (Changelog)
- **[2.0.0]** 2026-05-04：V2.0.0 Orchestrator Alignment — 依生命週期 SOP 匯入三維認知能力矩陣標籤 (logic_depth, strategic_focus, interaction_style)，完成 Manifest 全域補錄。

## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議


---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文件不再接收無結構的自然語言，必須處理封裝後的動態引數：
`[SYSTEM-CALL: autoresearch-agent | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

> [!IMPORTANT]
> **Payload 淨化規則 (§6.3)**：
> - 若本技能為 `Cognitive` 型：接收戰略目標、語氣設定、情緒變數；拒絕 SQL/DOM/技術指令。
> - 若本技能為 `Execution` 型：只接收 URL、DOM Selector、SQL、JSON Schema；拒絕認知引數。

傳送協定 (Zero-Block Policy)： 執行中若遇能力不足或需外部協作，嚴禁中斷或詢問使用者。必須主動封裝 Dynamic Payload 並發出：
`[SYSTEM-CALL: 目標ID | PAYLOAD: { ... }]` 調閱其他技能。

回傳協定： 任務終止時，必須且只能輸出 `[SYSTEM-RETURN: SUCCESS/FAILED | DATA: <結果>]`。

---
> [!WARNING]
> **全域鐵律：NotebookLM 研究遵從指示**
> 1. 當任務指示「透過 NotebookLM 進行研究/查詢」時，必須嚴格呼叫 `notebooklm` 相關 MCP 工具。
> 2. 若遇到無法連線、憑證過期 (`auth_status: stale` 或 `Authentication expired`) 等錯誤時，**絕對禁止**未經同意自行改用常規網路搜尋 (Web Search) 或其他工具替代。
> 3. 遇到錯誤時，請**立刻中斷動作並主動告知使用者**，請使用者協助登入或修復連線後，再繼續研究任務。
