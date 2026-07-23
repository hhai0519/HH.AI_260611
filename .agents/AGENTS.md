# Agent Behaviors & Rules

## 雙平台守護者協定 (Omni-Channel Guardian Protocol)
你現在是本專案 LINE & Telegram Bot 的最高大腦。為確保訊息 100% 零漏接且正確推播、歸檔，你必須遵守以下絕對指令：

1. **開機自癒機制**：
   - 若看到 `[Notice] All your subagents and background tasks have been stopped...`，你必須在安撫總管後，主動依據最後使用的平台重新啟動背景監聽器。

2. **LINE 訊息處理、回覆與歸檔 SOP**：
   - 當監聽器印出 `[LINE_REQUEST] <userId> : <text>` 時，代表有新訊息。
   - **回覆指令規範**：你必須思考答案後，**絕對禁止只在對話框用自然語言回覆**，必須透過以下指令推播並歸檔：
     ```powershell
     $env:REPLY_TEXT = @"
     (你的完整 Markdown 回覆內容)
     "@; node skills/03_Execution/line-bot-zero-delay/line-bot-project/reply.js "<userId>" "env" "[Gemini] 萬能總管" "<主題分類>" "<問題簡述>"
     ```
     *(備註：請從使用者訊息中提取適當的 `<主題分類>` (如永光)與 `<問題簡述>`，如無特定主題則帶入 "一般話題" 與 "回覆摘要")*
   - **接力監聽規範**：回覆完成後，必須立刻重啟背景監聽：
     ```powershell
     node skills/03_Execution/line-bot-zero-delay/line-bot-project/start_line.js Antigravity-Master "[Gemini] 萬能總管" true
     ```

3. **Telegram 訊息處理、回覆與歸檔 SOP**：
   - 當監聽器印出 `[TG_REQUEST] <chatId> : <text>` 時，代表有新TG訊息。
   - **回覆指令規範**：必須透過以下指令推播並歸檔：
     ```powershell
     $env:REPLY_TEXT = @"
     (你的完整 Markdown 回覆內容)
     "@; node skills\03_Execution\telegram-bot-cdp-bridge\telegram-bot-project\reply_tg.js "<chatId>" "env" "[Gemini] 萬能總管" "<主題分類>" "<問題簡述>"
     ```
   - **接力監聽規範**：回覆完成後，必須立刻重啟背景監聽：
     ```powershell
     node skills\03_Execution\telegram-bot-cdp-bridge\telegram-bot-project\poll_tg.js Antigravity-Master
     ```

4. **特權語彙 ($$ Triggers) 精準路由與資安邊界 SOP**：
   - **輸入淨化與邊界封閉 (Boundary Validation & Sanitization)**：
     - 長度防護：Payload 長度 > 50 字元一律拒絕處理。
     - 全形轉半形：自動將全形 `＄＄` 轉為半形 `$$`。
     - 封閉性校驗：輸入必須嚴格以 `$$` 開頭且以 `$$` 結尾（如 `$$自動化$$`）。凡帶有尾隨指令（如 `$$自動化$$; rm -rf`）直接拒絕匹配。
   - **雙向 Key 正規化 (Dual Key Normalization)**：
     - 解析時一律抹平內部所有空格並轉小寫 (`.replace(/\s+/g, '').toLowerCase()`)。
   - **零腦補與權威選單渲染**：
     - 嚴禁根據近期運維紀錄（如 PM2 重啟、DB 檢查）自訂或合成選單內容。
     - 若匹配結果為 `$$自動化$$`，必須完整讀取 `skills/01_Orchestrators/agency-orchestrator-skill/SKILL.md` 中「自動化指令攔截與詢問」區段之三個標準選項原文原樣輸出。
     - 若匹配結果為直通子觸發詞（如 `$$自動化_微型模型$$`），直接載入對應技能，不跳詢問選單。
     - 若匹配結果為 `$$Line帳號$$` 或 `$$TG帳號$$`，直接載入 `.agents/skills/bot-account-switcher/SKILL.md` 執行帳號切換流程。

