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
