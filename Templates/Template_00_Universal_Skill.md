---
name: ""
description: ""
version: "3.0.0"
type: ""   # "cognitive" | "orchestrator" | "execution"
triggers: []
dependencies: []
# ── 多態 capabilities（依 type 填入對應分支，刪除不適用的分支）──
#
# [Cognitive / Orchestrator 分支]
# capabilities:
#   logic_depth: ""        # REQUIRED 邏輯切入維度 (e.g., 第一性原理、系統思考)
#   strategic_focus: ""    # REQUIRED 策略聚焦點 (e.g., 降維打擊、紅海差異化)
#   interaction_style: ""  # REQUIRED 互動風格 (e.g., 權威感、同理心)
#
# [Execution 分支]
# capabilities:
#   tool_category: ""      # REQUIRED 工具類別 (e.g., Database, Browser Automation)
#   execution_env: ""      # REQUIRED 執行環境 (e.g., Node.js/Playwright, Python/Pandas)
#   io_format: ""          # REQUIRED 輸入輸出格式 (e.g., JSON, CSV, PNG, PDF/Text)
capabilities:
  logic_depth: ""
  strategic_focus: ""
  interaction_style: ""
---

# <INSERT_SKILL_NAME_HERE>

<INSERT_CORE_LOGIC_HERE>

### Technical Deliverables
- [Deliverable 1]
- [Deliverable 2]

### Success Metrics
- [Metric 1]
- [Metric 2]

---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文檔不再接收無結構的自然語言，必須處理封裝後的動態參數：
`[SYSTEM-CALL: 本技能ID | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

> [!IMPORTANT]
> **Payload 淨化規則 (§6.3)**：
> - 若本技能為 `Cognitive` 型：接收戰略目標、語氣設定、情緒變數；拒絕 SQL/DOM/技術指令。
> - 若本技能為 `Execution` 型：只接收 URL、DOM Selector、SQL、JSON Schema；拒絕認知參數。

發送協定 (Zero-Block Policy)： 執行中若遇能力不足或需外部協作，嚴禁中斷或詢問使用者。必須主動封裝 Dynamic Payload 並發出：
`[SYSTEM-CALL: 目標ID | PAYLOAD: { ... }]` 調閱其他技能。

回傳協定： 任務終止時，必須且只能輸出 `[SYSTEM-RETURN: SUCCESS/FAILED | DATA: <結果>]`。

## 版本紀錄 (Changelog)
- **[3.0.0]** 補充 Execution 型別多態分支與 §6.3 Payload 分層規則宣告。
- **[2.0.0]** 導入了基於週期表與配方模式的多維度認知矩陣與動態參數裝配表 (Dynamic Payload)。

