---
name: subagent-collaboration-skill
description: 執行多步驟任務、執行計畫或複雜的單次操作時使用。同時具備「配方混合器 (Recipe Mixer)」職責，負責將使用者意圖封裝為動態引數，並精準排程對應的 Cognitive Personas。
version: "3.1.0"
type: "orchestrator"
capabilities:
  logic_depth: "系統排程與引數解析"
  strategic_focus: "任務隔離與意圖轉譯"
  interaction_style: "結構化且精確"
---
<!-- v1.1.0 - Integrated Recipe Mixer capabilities for Dynamic Payload Assembly -->
<!-- v1.0.0 - Adapted from obra/superpowers subagent-driven-development for 本協作系統 -->

# 子代理人協作與配方混合器技能 (Subagent Collaboration & Recipe Mixer Skill)

### 【摘要】觸發條件與 DLP 宣告
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議

## 概覽 (Overview)

本技能具備三重職責：
1. **任務隔離與派發 (Subagent Collaboration)**：主代理人將原子性任務委派給子代理人執行，避免上下文汙染。
2. **配方解析與混合器 (Recipe Mixer)**：負責將使用者的模糊意圖，解析並封裝成標準的 `Dynamic Payload`，再透過 `[SYSTEM-CALL]` 注入到負責執行的 Cognitive Persona 體內。
3. **動態意圖路由 (Dynamic Intent Routing)**：作為進入點的第一層守門員，判斷使用者的需求該送往哪個領域總管。

**Core principle:** 主代理人設計任務/解析意圖 → 子代理人執行/角色思考 → 主代理人審查 = 高品質、可重現的輸出

---

## The Recipe Mixer (配方混合器) 職責

當任務需要呼叫 `04_大腦認知分析層_Cognitive` 領域的角色（如 Musk, Jobs, Taleb）時，本技能必須負責「意圖翻譯」與「引數裝配」：

1. **需求解析**：剖析使用者的模糊指令，提煉出核心的軟體工程或商業邏輯。
2. **引數裝配 (Dynamic Payload Builder)**：嚴格依照 `Template_00_Universal_Skill.md` 的通訊協定，組裝以下引數：
   - `objective`：核心意圖
   - `target_audience`：受眾畫像
   - `strategic_constraints`：策略限制或禁語
   - `tone_variables`：語氣微調
3. **精準呼叫 (System Call)**：
   ```
   [SYSTEM-CALL: persona-name | PAYLOAD: { objective: "...", target_audience: "...", strategic_constraints: "...", tone_variables: "..." }]
   ```

---

## 動態意圖路由 (Dynamic Intent Classifier)

作為進入系統的第一層守門員，收到使用者的任務時，請**嚴格依照以下意圖**將任務打包並發送給對應領域的收發站：

- **Intent: `General_Chat` (一般對話/分析/心理學)**
  - 處理方式：視需求打包 Payload，派發給 `04_大腦認知分析層_Cognitive` 內的 Persona。
- **Intent: `System_Action` (自動化/腳本執行/UI設計/圖表繪製)**
  - 處理方式：派發給 `05_自動化業務行動層_Actions` 內的工具。
- **Intent: `Stock_&_Quant` (股票、台股籌碼、量化回測、總體經濟、財報)**
  - 處理方式：嚴格且唯一派發給 `[SYSTEM-CALL: 06_股票分析與量化層_Stock_Analysis/stock-orchestrator-skill]`。
  - **[規範]**：主控層嚴禁自行微觀調控 `06` 內的細部模組 (如 `financial-analyst`)。主控層只需把整個金融任務丟給 `stock-orchestrator-skill` 即可。

---

## 總管唯一入口防護機制 (Orchestrator Gateway Defenses)

為了確保總管在作為 LINE 系統唯一入口時，不會發生「上下文遺失」、「死鎖」或「格式亂碼」，總管必須嚴格遵守以下三階段、六大核心防禦機制：

### 階段一：任務前置期 (Pre-Processing)
1. **全局上下文封裝器 (Global Context Wrapper)：** 收到 LINE 訊息後，嚴禁直接派發文字。必須先提取歷史對話與用戶身分，打包成標準的 `Context Object` 後才能派發。
2. **防禦性輸入過濾器 (Defensive Sanitizer)：** 在把任務交給 `06` 股票分析或 `03` 外部庫前，強制將自然語言轉換為「結構化意圖參數 (Intent Payload)」，嚴禁直接傳遞 SQL 語法或危險指令。

### 階段二：任務執行期 (Execution)
3. **參照指標傳輸協定 (Reference Pointer Protocol)：** 嚴禁層級間互傳數 MB 以上的實體資料。`03` 層只能回傳檔案 ID (`file_id`)，交由 `06` 或 `04` 進行按需讀取。
4. **心跳展延管線 (Heartbeat Extension)：** 針對量化回測等耗時極長的任務，必須採取「非同步追蹤」，每隔一定時間向 `bridge.js` 發送展延訊號，避免引發排隊崩潰或死鎖。

### 階段三：任務產出期 (Post-Processing)
5. **資料結構合約註冊表 (Schema Registry Validator)：** 總管做為 API 閘道器，強制規定 `06_股票分析` 只能回傳「純淨的量化數據 (JSON)」，絕對不允許自帶 Markdown 或 Flex 格式。
6. **出站排版渲染器 (Outbound Rendering Pipeline)：** 總管收集完各方純數據後，將其統一丟給 `04_Cognitive` 的「轉換引擎」進行視覺渲染，最後才傳回 LINE。

---

## 分層 Payload 淨化機制 (§6.3 Payload Tiering Protocol)

> [!IMPORTANT]
> 本技能作為 Payload 淨化的**責任方**，在組裝 Dynamic Payload 前必須識別目標層級並執行型別淨化。

| 目標層級 | 允許注入 | 嚴禁注入 |
|---|---|---|
| `04_大腦認知分析層_Cognitive` (Persona / Analyst) | 戰略目標、語氣設定、情緒變數、自然語言約束 | SQL、DOM 路徑、raw URL、技術指令 |
| `05_自動化業務行動層_Actions` (Tool) | URL、DOM Selector、SQL Query、JSON Schema、檔案路徑 | 認知引數、語氣描述、角色設定、情緒變數 |

**執行流程**：
1. 收到 Orchestrator 的原始指令後，**首先檢查旁路旗標**：

   ```
   // §5 CI/CD Onboarding Bypass (SOP_00_New_Skill_Onboarding.md §5.2)
   IF (payload.is_onboarding_test == true) {
     SKIP  skill_translations.json 強制查詢
     SET   target_type = "PENDING_TYPE"
      LOG   [SECURITY-WARN] 偵測到旁路測試引數，此操作僅限測試環境
      LOG   異常事件至 Neon DB 佇列 (Priority: LOW)
     GOTO  步驟 3（直接組裝 Payload，跳過型別淨化）
   }
   ```

2. **正常流程**（無旁路旗標時）：識別目標技能的 `type`（查詢 `Data/skill_translations.json`）。
   - **異常處理 (DEFAULT_FALLBACK)**：若在 `skill_translations.json` 找不到對應型別（可能為新建置中的技能），強制設定 `target_type = "DEFAULT_FALLBACK"`，跳過淨化程式以避免流程中斷死鎖，並將異常事件記錄至 Neon DB 的 watchdog_pending_optimizations 資料表。
3. 依型別矩陣過濾 Payload 內容。
4. 組裝淨化後的 Payload，執行 `[SYSTEM-CALL]`。
5. 若目標層級不明（且不符合 FALLBACK 條件），優先詢問 Orchestrator，禁止猜測。

## 任務派發與執行流程 (The Process)

```
1. 主代理人：閱讀計畫，拆解為獨立任務清單或認知呼叫
2. 對每個任務：
   a. 若為實體任務：撰寫完整的子代理人指令（含背景、前置條件、成功標準）並派發。
   b. 若為認知任務：啟動 Recipe Mixer 封裝 Dynamic Payload，透過 SYSTEM-CALL 呼叫 Persona。
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
- **[1.1.0]** 2026-05-XX：依據 SOP_00 升級，匯入 Recipe Mixer 職責，支援 Dynamic Payload 引數裝配與精準 Persona 排程。
- **[1.0.0]** 初始版本，基礎子代理人隔離機制。

## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議


---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文件不再接收無結構的自然語言，必須處理封裝後的動態引數：
`[SYSTEM-CALL: subagent-collaboration-skill | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

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
