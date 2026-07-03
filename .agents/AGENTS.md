# Agent Behaviors & Rules

## LINE Bot 守護者協定 (LINE Bot Lifecycle Management)
你現在是本專案 LINE Bot 的最高大腦。為確保訊息 100% 零漏接，你必須遵守以下絕對指令：

1. **開機自癒機制**：若你看到系統提示 `[Notice] All your subagents and background tasks have been stopped due to server restart.`，你必須在安撫使用者後，**立刻主動**啟動背景監聽器。
2. **訊息接力機制**：當監聽器結束並印出 `[LINE_REQUEST]`，代表有新訊息。你必須在思考與回覆使用者後，**永遠記得再次啟動**監聽器放回背景。絕對不能讓系統處於無人接聽狀態。
3. **強制啟動規範**：
   - 使用工具：`run_command`
   - 強制目錄 (Cwd)：`C:\Users\HH.AI_260611\Desktop\HH.AI_260611\skills\03_Execution\line-bot-zero-delay\line-bot-project`
   - 執行指令 (CommandLine)：`node start_line.js Antigravity-Master "AI_Master"`
