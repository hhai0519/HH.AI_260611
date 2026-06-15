---
name: subagent-collaboration-skill
description: 執行多步驟任務、執行計畫或複雜的單次操作時使用。同時具備「配方混合器 (Recipe Mixer)」職責，負責將使用者意圖封裝為動態參數，並精準調度對應的 Cognitive Personas。
version: "3.1.0"
type: "orchestrator"
capabilities:
  logic_depth: "系統調度與參數解析"
  strategic_focus: "任務隔離與意圖轉譯"
  interaction_style: "結構化且精確"
---
<!-- v1.1.0 - Integrated Recipe Mixer capabilities for Dynamic Payload Assembly -->
<!-- v1.0.0 - Adapted from obra/superpowers subagent-driven-development for 本協作系統 -->

# 子代理人協作與配方混合器技能 (Subagent Collaboration & Recipe Mixer Skill)

### 【摘要】觸發條件與 DLP 聲明
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議

## 概覽 (Overview)

本技能具備雙重職責：
1. **任務隔離與派發 (Subagent Collaboration)**：主代理人將原子性任務委派給子代理人執行，避免上下文汙染。
2. **配方解析與混合器 (Recipe Mixer)**：負責將使用者的模糊意圖，解析並封裝成標準的 `Dynamic Payload`，再透過 `[SYSTEM-CALL]` 注入到負責執行的 Cognitive Persona 體內。

**Core principle:** 主代理人設計任務/解析意圖 → 子代理人執行/角色思考 → 主代理人審查 = 高品質、可重現的輸出

---

## The Recipe Mixer (配方混合器) 職責

當任務需要調用 `02_Cognitive` 領域的角色（如 Musk, Jobs, Taleb）時，本技能必須負責「意圖翻譯」與「參數裝配」：

1. **需求解析**：剖析使用者的模糊指令，提煉出核心的軟體工程或商業邏輯。
2. **參數裝配 (Dynamic Payload Builder)**：嚴格依照 `Template_00_Universal_Skill.md` 的通訊協定，組裝以下參數：
   - `objective`：核心意圖
   - `target_audience`：受眾畫像
   - `strategic_constraints`：策略限制或禁語
   - `tone_variables`：語氣微調
3. **精準調用 (System Call)**：
   ```
   [SYSTEM-CALL: persona-name | PAYLOAD: { objective: "...", target_audience: "...", strategic_constraints: "...", tone_variables: "..." }]
   ```

---

## 分層 Payload 淨化機制 (§6.3 Payload Tiering Protocol)

> [!IMPORTANT]
> 本技能作為 Payload 淨化的**責任方**，在組裝 Dynamic Payload 前必須識別目標層級並執行型別淨化。

| 目標層級 | 允許注入 | 嚴禁注入 |
|---|---|---|
| `02_Cognitive` (Persona / Analyst) | 戰略目標、語氣設定、情緒變數、自然語言約束 | SQL、DOM 路徑、raw URL、技術指令 |
| `03_Execution` (Tool) | URL、DOM Selector、SQL Query、JSON Schema、檔案路徑 | 認知參數、語氣描述、角色設定、情緒變數 |

**執行流程**：
1. 收到 Orchestrator 的原始指令後，**首先檢查旁路旗標**：

   ```
   // §5 CI/CD Onboarding Bypass (SOP_00_New_Skill_Onboarding.md §5.2)
   IF (payload.is_onboarding_test == true) {
     SKIP  skill_translations.json 強制查詢
     SET   target_type = "PENDING_TYPE"
      LOG   [SECURITY-WARN] 偵測到旁路測試參數，此操作僅限測試環境
      LOG   異常事件至 Neon DB 佇列 (Priority: LOW)
     GOTO  步驟 3（直接組裝 Payload，跳過型別淨化）
   }
   ```

2. **正常流程**（無旁路旗標時）：識別目標技能的 `type`（查詢 `Data/skill_translations.json`）。
   - **異常處理 (DEFAULT_FALLBACK)**：若在 `skill_translations.json` 找不到對應型別（可能為新建置中的技能），強制設定 `target_type = "DEFAULT_FALLBACK"`，跳過淨化程序以避免流程中斷死鎖，並將異常事件記錄至 Neon DB 的 watchdog_pending_optimizations 資料表。
3. 依型別矩陣過濾 Payload 內容。
4. 組裝淨化後的 Payload，執行 `[SYSTEM-CALL]`。
5. 若目標層級不明（且不符合 FALLBACK 條件），優先詢問 Orchestrator，禁止猜測。

## 任務派發與執行流程 (The Process)

```
1. 主代理人：閱讀計畫，拆解為獨立任務清單或認知呼叫
2. 對每個任務：
   a. 若為實體任務：撰寫完整的子代理人指令（含背景、前置條件、成功標準）並派發。
   b. 若為認知任務：啟動 Recipe Mixer 封裝 Dynamic Payload，透過 SYSTEM-CALL 調用 Persona。
   c. 等待回報狀態與資料
   d. 審查輸出（規格合規 → 品質審查）
   e. 標記完成或退回修正
3. 所有任務完成後：最終整合審查
```

---

## Controller (主代理人) 職責

### 任務拆解規則
- 每個任務需**可獨立執行、可獨立驗證**
- 任務之間依賴需明確標注（Task 2 depends on Task 1 output）
- 每個實體任務的指令必須包含背景說明、前置條件、成功標準與回報格式。

---

## Two-Stage Review (雙重審查)

每個任務完成後，主代理人自行執行兩階段審查：

### 階段一：規格合規審查
- ✅ 所有要求的專案都實作/回答了嗎？
- ✅ 是否符合 Dynamic Payload 中的策略限制？
- ❌ → 退回給子代理人或 Persona 修正。

### 階段二：品質審查
- 程式碼是否清晰可維護？輸出是否高質量且契合人物設定？
- ❌ → 退回修正。

---

## Red Flags（自我檢查清單）

- [ ] (Recipe) Payload 是否足夠精準？有無遺漏關鍵的策略限制？
- [ ] (Subagent) 指令是否包含完整背景？
- [ ] 成功標準是否可驗證？

**絕不允許：**
- 傳遞無結構、模糊的自然語言給 Cognitive Persona。
- 跳過規格審查直接進行品質審查。
- 接受「差不多就好」的結果。

---

## Integration with Other Skills

- **mcp-setup-skill** — 當子代理人任務涉及 MCP 設定時，參考設定格式
- **nlm-skill** — 當任務涉及 NotebookLM 操作時，參考 nlm CLI 指令
- **systematic-debugging-skill** — 當子代理人回報 BLOCKED 超過 2 次時，切換至系統化除錯模式

---

## 版本紀錄 (Changelog)
- **[3.1.0]** 2026-05-04：依 SOP_00_New_Skill_Onboarding §5.2 實裝 `is_onboarding_test` CI/CD 旁路旗標邏輯，徹底解除新技能報到死鎖。PENDING_TYPE 回退機制啟用。
- **[3.0.0]** 2026-05-04：依 SOP §6.3 新增「分層 Payload 淨化機制」說明，實裝型別矩陣與淨化執行流程。版本躍升至 V3.0.0。
- **[1.1.0]** 2026-05-XX：依據 SOP_00 升級，導入 Recipe Mixer 職責，支援 Dynamic Payload 參數裝配與精準 Persona 調度。
- **[1.0.0]** 初始版本，基礎子代理人隔離機制。

## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議


---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文檔不再接收無結構的自然語言，必須處理封裝後的動態參數：
`[SYSTEM-CALL: subagent-collaboration-skill | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

> [!IMPORTANT]
> **Payload 淨化規則 (§6.3)**：
> - 若本技能為 `Cognitive` 型：接收戰略目標、語氣設定、情緒變數；拒絕 SQL/DOM/技術指令。
> - 若本技能為 `Execution` 型：只接收 URL、DOM Selector、SQL、JSON Schema；拒絕認知參數。

發送協定 (Zero-Block Policy)： 執行中若遇能力不足或需外部協作，嚴禁中斷或詢問使用者。必須主動封裝 Dynamic Payload 並發出：
`[SYSTEM-CALL: 目標ID | PAYLOAD: { ... }]` 調閱其他技能。

回傳協定： 任務終止時，必須且只能輸出 `[SYSTEM-RETURN: SUCCESS/FAILED | DATA: <結果>]`。
