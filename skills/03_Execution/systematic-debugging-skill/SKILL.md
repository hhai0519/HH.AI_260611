---
name: systematic-debugging-skill
type: execution
description: 當遇到 MCP 連接失敗、工具載入錯誤、npm/pip 安裝失敗、Docker 問題、JSON 設定語法錯誤或 本協作系統 本地環境中的任何異常行為時，在提出任何修正方案前使用此技能。
version: "3.0.0"
type: "execution"
capabilities:
  tool_category: "System Diagnostics"
  execution_env: "Multi-env"
  io_format: "Log/Text"
---
<!-- v1.0.0 - Adapted from obra/superpowers systematic-debugging for 本協作系統/Windows -->

# 系統化除錯技能 (Systematic Debugging Skill)

### 【摘要】觸發條件與 DLP 聲明
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議

## 概覽 (Overview)

隨機嘗試修正浪費時間且製造新問題。快速補丁只是掩蓋根本原因。

**Core principle:** 永遠先找到根本原因，才能提出修正。症狀修補是失敗的除錯。

**The Iron Law:**
```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

---

## When to Use

適用於本地環境的任何技術問題：
- MCP 伺服器無法載入或連線失敗
- npm / pip 安裝錯誤（404、permission denied、version conflict）
- Docker 錯誤（container exits, gateway OAuth errors）
- JSON 設定語法問題（工具全部消失）
- 工具數量超出 100 上限
- 瀏覽器子代理人操作失敗
- `BLOCKED` 狀態的子代理人（連續 2 次以上）

**尤其要用在：**
- 時間緊迫時（緊急感讓猜測變得誘人，但系統化更快）
- 「這應該很簡單」的問題（簡單問題也有根本原因）
- 已經試過多次修正卻失敗

---

## The Four Phases

完成每個階段後才能進入下一個。

### Phase 1：根本原因調查（修正前必做）

1. **完整閱讀錯誤訊息**
   - 不要跳過警告
   - 記下錯誤碼、檔案路徑、行號
   - Stack trace 需完整閱讀

2. **確認可重現性**
   - 能穩定重現嗎？重現的精確步驟是什麼？
   - 若無法重現 → 先收集更多資料，不要猜

3. **檢查最近的變更**
   - 什麼改動可能導致此問題？
   - 查看 mcp_config.json 的最近編輯
   - 新安裝了什麼套件？Docker 版本有變嗎？

4. **多元件系統的證據收集**

   本地環境常見的多層系統：
   ```
   本協作系統 → mcp_config.json → MCP Server Process → Tool API
   Docker Desktop → MCP Gateway → Container → Tool
   pip install → Python Path → Executable → 本協作系統 PATH
   ```

   **在每個邊界加入診斷：**
   ```powershell
   # 確認執行檔存在
   where.exe notebooklm-mcp

   # 確認 docker 可用
   docker --version
   docker mcp --help

   # 確認 npx 套件
   npx -y @notionhq/notion-mcp-server --version

   # 確認 JSON 格式
   # 用 https://jsonlint.com 貼入 mcp_config.json 驗證
   ```

5. **追蹤資料流**

   問：壞的值從哪裡來的？
   - 本協作系統 讀到什麼？（查 mcp_config.json）
   - MCP Server 接收到什麼？（查 server logs）
   - 工具呼叫傳入什麼？（查 error message 的 input）
   - 往上追溯直到找到源頭

---

### Phase 2：模式分析

1. **找到能正常運作的相似範例**
   - 哪個 MCP 設定是正常的？（GitHub MCP 通常是參照基準）
   - 工作中的那個跟壞掉的有什麼不同？

2. **逐條比對官方文件**
   - 不要略讀，完整閱讀設定範例
   - 不要假設「這個欄位應該不重要」

3. **列出所有差異**，再小的差異也算

---

### Phase 3：假說與測試

1. **提出單一假說**
   - 清楚陳述：「我認為 X 是根本原因，因為 Y」
   - 寫下來，不要只是猜

2. **最小化測試**
   - 一次只改一個變數
   - 別同時修多個地方

3. **驗證後才繼續**
   - 成功 → Phase 4
   - 失敗 → 提出新假說
   - **不要在原本的修正上疊加更多修正**

---

### Phase 4：實作修正

1. 建立最小可重現的失敗案例
2. 實作針對根本原因的單一修正
3. 驗證修正有效（工具是否出現？連線是否成功？）
4. **若修正無效：**
   - < 3 次：回到 Phase 1，帶著新資訊重新分析
   - ≥ 3 次 → **停下來，質疑架構**

### Phase 4.5：3 次修正失敗 → 質疑架構

**架構問題的訊號：**
- 每次修正都在不同地方暴露新問題
- 修正需要大幅重構
- 每次修正引發新症狀

**停下來問：**
- 這個設計模式根本是對的嗎？
- 我們是否因為「已投入」而繼續錯誤的方向？
- 應該重寫設定/換工具，而非繼續修補？

---

## 本地環境常見問題速查

| 症狀 | 最可能的根本原因 | Phase 1 第一步 |
|------|----------------|----------------|
| 所有工具消失 | JSON 語法錯誤 | 驗證 mcp_config.json 格式 |
| 工具超出 100 上限 | 新增 MCP 超出額度 | 計算各 MCP 工具數，找可停用的 |
| MCP server 啟動失敗 | 執行檔路徑錯誤或不存在 | `Test-Path <executable>` |
| GitHub MCP 連線失敗 | PAT 過期 / Docker 未啟動 | `docker ps` + 確認 PAT 有效期 |
| NotebookLM 認證錯誤 | Session 過期 | `nlm doctor` 接著 `nlm login` 重新登入 |
| Docker OAuth 警告 | Docker Desktop 背景服務 | 確認 Docker Desktop 已開啟，可忽略 |
| npm 404 錯誤 | 套件名稱錯誤 | 確認官方文件中的正確 npm 套件名 |

---

## Red Flags — 停下來，回到 Phase 1

如果你發現自己在想：
- 「快速修一下，之後再查原因」
- 「就改 X 看看」
- 「同時改多個地方，跑看看」
- 「應該是 X，讓我修一下」
- 「不完全理解，但這個可能有用」
- 「再試一次修正」（已失敗 2 次以上）

**以上全都代表：停止。回到 Phase 1。**

---

## 常見藉口 vs 現實

| 藉口 | 現實 |
|------|------|
| 「問題很簡單，不需要流程」 | 簡單問題也有根本原因，流程對簡單問題反而更快 |
| 「緊急，沒時間走流程」 | 系統化除錯比「猜了改、改了猜」快 10 倍 |
| 「先試這個，不行再查」 | 「先試」設定了錯誤的模式，從一開始就做對 |
| 「再試一次修正」（已失敗 2+） | 3 次失敗 = 架構問題，質疑模式，不要繼續修補 |

---

## 協作體系 (Integration)
 
- **mcp-setup-skill** — 查找正確的設定格式與常見問題解法
- **subagent-collaboration-skill** — 複雜除錯任務可以派發子代理人進行診斷
- **notebooklm-mcp** — NotebookLM 相關問題的專屬指令參考

## 版本紀錄 (Changelog)
- **[2.0.0]** 2026-05-04：V2.0.0 Polymorphic Labeling Migration — 依生命週期 SOP 導入多態功能性技術標籤 (tool_category, execution_env, io_format)，建立執行層 Manifest 路由能力。

## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議


---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文檔不再接收無結構的自然語言，必須處理封裝後的動態參數：
`[SYSTEM-CALL: systematic-debugging-skill | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

> [!IMPORTANT]
> **Payload 淨化規則 (§6.3)**：
> - 若本技能為 `Cognitive` 型：接收戰略目標、語氣設定、情緒變數；拒絕 SQL/DOM/技術指令。
> - 若本技能為 `Execution` 型：只接收 URL、DOM Selector、SQL、JSON Schema；拒絕認知參數。

發送協定 (Zero-Block Policy)： 執行中若遇能力不足或需外部協作，嚴禁中斷或詢問使用者。必須主動封裝 Dynamic Payload 並發出：
`[SYSTEM-CALL: 目標ID | PAYLOAD: { ... }]` 調閱其他技能。

回傳協定： 任務終止時，必須且只能輸出 `[SYSTEM-RETURN: SUCCESS/FAILED | DATA: <結果>]`。
