---
name: optimization-status
type: orchestrator
description: "🤖 背景自動最佳化狀態監控器。追蹤超引數實驗進度，管理 val_bpb 閾值與結果日誌。"
version: "3.0.0"
type: "orchestrator"
capabilities:
  logic_depth: "背景實驗進度追蹤與指標監控"
  strategic_focus: "val_bpb 閾值管理與結果日誌"
  interaction_style: "即時且狀態感知"
---

# 自我進化：背景自動最佳化進度 (Auto-Evolution Status)

### 【摘要】觸發條件與 DLP 宣告
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議

> 
> 

> [!NOTE]
> 這是由 本協作系統 核心系統主導的背景任務。目標是將 `val_bpb` 最佳化至 4.0 以下。

## 當前實驗狀態
- **最佳化物件**：`autoresearch-cpu/train_cpu.py`
- **當前階段**：已完成階段最佳化
- **已跑實驗數**：5
- **最佳指標 (val_bpb)**：10.302328
- **當前選用引數** (最近一次)：
  - `n_layer`: 4
  - `LR`: 3.00e-04
  - `Result`: 11.3636 (discard)

## 歷史實驗日誌摘要
請參閱 `results.tsv` 以獲取完整日誌。

---
*上次同步時間：2026-04-19 04:58:37*

## 版本紀錄 (Changelog)
- **[2.0.0]** 2026-05-04：V2.0.0 Orchestrator Alignment — 依生命週期 SOP 匯入三維認知能力矩陣標籤 (logic_depth, strategic_focus, interaction_style)，完成 Manifest 全域補錄。

## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議


---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文件不再接收無結構的自然語言，必須處理封裝後的動態引數：
`[SYSTEM-CALL: optimization-status | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

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
