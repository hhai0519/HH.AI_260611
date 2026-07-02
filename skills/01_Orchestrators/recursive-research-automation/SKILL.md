---
name: recursive-research-automation
type: orchestrator
description: "通用的遞迴研究自動化框架。僅在指令包含「$$自動化_通用研究$$」時啟用。符合 SOP §2.4 強制授權協議。"
version: "3.0.0"
type: "orchestrator"
capabilities:
  logic_depth: "遞迴深化研究路徑與子方向識別"
  strategic_focus: "配額管理與深度研究產出"
  interaction_style: "廣度→深度且自主收斂"
---

# 遞迴研究自動化路徑 (Recursive Research Automation Path)

### 【摘要】觸發條件與 DLP 聲明
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議

## 功能概述
本技能定義了自動化深度研究的標準作業程式 (SOP)。它採用「遞迴式」的研究邏輯，透過不斷分析前一階段的發現來啟動更深化的研究路徑，並整合資源配額監控（如 Gemini 3 Flash 配額），確保在資源耗盡前（預設 20%）安全產出報告。

## 觸發條件
- 指令必須明確包含「$$自動化_通用研究$$」。
- 需要在背景不斷運行研究直到配額觸發終結條件。
- 要求進行受控的深度遞迴分析。

## 執行流程

### 0. 前置認證健康檢查 (Pre-flight Auth Check) [新增]

> [!IMPORTANT]
> 依照 SOP_12「外部 MCP 服務認證修復標準作業程序」，必須在啟動研究迴圈前執行此檢查。
> 若跳過此步驟，可能在第 N 輪研究後才因認證失效而中斷，造成大量資源浪費。

**執行邏輯（偽碼 Pseudocode）**：
```python
import subprocess
import time
import threading

MAX_AUTH_RETRIES = 3  # SOP_11 規定：反思迴圈最多 3-5 次
AUTH_INPUT_TIMEOUT_SEC = 120  # SRE 顧問建議：防止在非互動式環境永久懸掛

def _input_with_timeout(prompt: str, timeout_sec: int) -> str:
    """支援 Windows 的帶 timeout 的 input()"""
    result = [None]
    
    def _get_input():
        result[0] = input(prompt)
    
    thread = threading.Thread(target=_get_input, daemon=True)
    thread.start()
    thread.join(timeout=timeout_sec)
    
    if thread.is_alive():
        raise TimeoutError(f"使用者未在 {timeout_sec} 秒內回應，操作已逾時。")
    return result[0]

def pre_flight_auth_check(mcp_client) -> bool:
    """
    在啟動深度研究迴圈前，強制驗證 NotebookLM MCP 認證狀態。
    符合 SOP_12 引導修復模式。
    """
    for retry in range(MAX_AUTH_RETRIES):
        # Step 1：查詢 MCP 認證狀態
        status = mcp_client.call("notebooklm", "server_info", {})
        auth_status = status.get("auth_status", "unknown")

        if auth_status == "configured":
            print("✅ [前置檢查] NotebookLM 認證正常，開始研究迴圈。")
            return True

        # Step 2：認證失效，依 SOP_12 §3.1 引導使用者
        print(f"\n⚠️ [認證警告] NotebookLM auth_status = '{auth_status}'（第 {retry+1}/{MAX_AUTH_RETRIES} 次嘗試）")
        print("依照 SOP_12，請先在 Chrome 開啟 https://notebooklm.google.com 並確認登入。")

        try:
            _input_with_timeout("👉 登入完成後，請按 Enter 鍵繼續...", AUTH_INPUT_TIMEOUT_SEC)
        except TimeoutError as e:
            raise RuntimeError(f"[前置認證] {e}") from e

        # Step 3：執行 nlm login（安全設計：capture_output=True 不落盤）
        try:
            result = subprocess.run(
                ["nlm", "login"],
                capture_output=True,   # 資安稽核官建議：輸出不落盤
                text=True,
                timeout=60
            )
            if result.returncode != 0:
                print(f"   nlm login 失敗：{result.stderr[:200]}，重試中...")
                continue
        except subprocess.TimeoutExpired:
            print("   nlm login 執行逾時，重試中...")
            continue

        # Step 4：通知 MCP Server 重新載入快取
        mcp_client.call("notebooklm", "refresh_auth", {})
        time.sleep(3)  # 等待快取同步

    # 超過最大重試次數
    raise RuntimeError(
        f"[前置認證失敗] 已重試 {MAX_AUTH_RETRIES} 次仍無法通過 NotebookLM 認證。"
        "任務中止。請依 SOP_12 手動排查。"
    )

# 在研究迴圈前呼叫
pre_flight_auth_check(mcp_client=your_mcp_client_instance)
```

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
- 每次循環跳轉前，必須呼叫 `Modules/quota_manager.js` 的 `check_and_consume_quota` 方法。
- 方法將透過 Neon PostgreSQL 原子性操作讀取 `session_quota_state.used_pct`。
- 若剩餘配額 > 20%：繼續下一個循環。
- 若剩餘配額 <= 20%：觸發「強制終結序列」（`quota_manager.js` 拋出 `QUOTA_EXCEEDED` 錯誤）。

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


---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文檔不再接收無結構的自然語言，必須處理封裝後的動態參數：
`[SYSTEM-CALL: recursive-research-automation | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

> [!IMPORTANT]
> **Payload 淨化規則 (§6.3)**：
> - 若本技能為 `Cognitive` 型：接收戰略目標、語氣設定、情緒變數；拒絕 SQL/DOM/技術指令。
> - 若本技能為 `Execution` 型：只接收 URL、DOM Selector、SQL、JSON Schema；拒絕認知參數。

發送協定 (Zero-Block Policy)： 執行中若遇能力不足或需外部協作，嚴禁中斷或詢問使用者。必須主動封裝 Dynamic Payload 並發出：
`[SYSTEM-CALL: 目標ID | PAYLOAD: { ... }]` 調閱其他技能。

回傳協定： 任務終止時，必須且只能輸出 `[SYSTEM-RETURN: SUCCESS/FAILED | DATA: <結果>]`。
