---
name: reflection-module
type: orchestrator
description: '具備前瞻性 (Prospective) 與多代理人 (Multi-Agent) 協作架構的自我反思與行為優化模組。'
version: '2.0.0'
type: "orchestrator"
capabilities:
  logic_depth: '多代理人批判與前瞻性預判'
  strategic_focus: '硬性約束驗證與狀態改變評估'
  interaction_style: '後設認知與分層記憶儲存'
---

# 反思模組 (Reflection Module V2.0.0)

### 【摘要】觸發條件與 DLP 聲明
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議

## 功能概述
本技能將賦予代理人「自我檢討」的能力，不再僅限於事後反思，更導入了 **前瞻性反思 (Prospective Reflection - PreFlect)** 與 **多角色批判 (Multi-Agent Generator-Critic)** 模式。透過強制執行硬性約束 (Hard Assertions) 與狀態評估 (State Change Scoring)，建立高精度的封閉式學習迴圈，並將結果儲存於長期與短期記憶庫中。

## 觸發條件
- **事後反思 (Retrospective)**：任意 SOP 執行到達「任務結束」階段，或偵測到連續的工具錯誤與執行瓶頸。
- **事前反思 (Prospective)**：準備執行具備破壞性、高風險或不可逆之操作（如大量刪除、發送重要決策）前。
- **手動觸發**：使用者明確要求「檢討剛剛的操作」、「進行反思」或「先檢查你的計畫」。

## 執行流程 (The 5-Step Reflexion Loop)

本模組透過三個虛擬角色協同運作：**執行者 (Actor)**、**批判者 (Evaluator/Critic)** 與 **裁判 (Judge/Meta-Reflector)**。

### 1. 初始生成 (Initial Generation)
- **Actor** 根據當前任務要求產出初始計畫、草稿或程式碼。
- 從短期記憶中載入目前軌跡，從長期記憶中載入相關的「歷史教訓 (Gotchas)」。

### 2. 執行與評估 (Execution & Evaluation)
- 進入 **Evaluator** 批判階段，採用兩種角色輪替：
  - **嚴謹邏輯家 (Strict Logician)**：專注驗證數學、邏輯、SOP 合規性與格式限制。
  - **懷疑論者 (Skeptic)**：挑戰假設，尋找極端案例 (Edge Cases)、安全漏洞或潛在幻覺 (Hallucinations)。

### 3. 反思與批判 (Reflection & Critique)
- **Judge** 綜合 Evaluator 的意見，產出 **Sweet & Sour Feedback**：
  - **Sweet (正向強化)**：哪些部分做得很好，值得保留。
  - **Sour (建設性批評)**：具體指出「錯在哪裡」以及「應該如何修改」。
  - 確保回饋是**具體且可執行的 (Actionable and Specific)**。

### 4. 策略提煉與修正 (Refinement)
- **Actor** 接收原始提示、失敗草稿與批判回饋，生成改進版本。
- 採用 **狀態改變評估 (State Change Scoring)**：不僅檢查文字是否通順，必須驗證「工具是否成功呼叫？」、「報錯是否消失？」。

### 5. 退出條件與記憶寫入 (Exit & Memory Logging)
- **硬性約束 (Computational Constraints)**：反思迴圈最多執行 3-5 次。若達上限仍未解決，則記錄「未解瓶頸」並中斷。
- **短期記憶**：記錄本次對話的失敗嘗試，防止同對話內重蹈覆轍。
- **長期記憶**：將核心洞察 (Core Learnings) 寫入 `Data/Agent_Reflections.md`。

## 注意事項
- 嚴格遵守多角色切換，避免單一代理人自圓其說 (Confirmation Bias)。
- 將重點放在「實質狀態改變」，避免浪費 Token 在無效的文字美化上。


---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文檔不再接收無結構的自然語言，必須處理封裝後的動態參數：
`[SYSTEM-CALL: reflection-module | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

> [!IMPORTANT]
> **Payload 淨化規則 (§6.3)**：
> - 若本技能為 `Cognitive` 型：接收戰略目標、語氣設定、情緒變數；拒絕 SQL/DOM/技術指令。
> - 若本技能為 `Execution` 型：只接收 URL、DOM Selector、SQL、JSON Schema；拒絕認知參數。

發送協定 (Zero-Block Policy)： 執行中若遇能力不足或需外部協作，嚴禁中斷或詢問使用者。必須主動封裝 Dynamic Payload 並發出：
`[SYSTEM-CALL: 目標ID | PAYLOAD: { ... }]` 調閱其他技能。

回傳協定： 任務終止時，必須且只能輸出 `[SYSTEM-RETURN: SUCCESS/FAILED | DATA: <結果>]`。
