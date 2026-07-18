---
name: "bot-account-switcher"
description: "LINE & Telegram 官方帳號雙平台切換工具。支援 $$Line帳號$$ 與 $$TG帳號$$ 觸發，覆寫 env 並重啟 PM2。"
version: "1.0.1"
type: "execution"
triggers: ["$$Line帳號$$", "$$TG帳號$$"]
dependencies: []
capabilities:
  tool_category: "System Configuration"
  execution_env: "Node.js/PowerShell"
  io_format: "JSON/.env"
---

# 雙平台帳號自動切換指令

當總管輸入 `$$Line帳號$$` 或 `$$TG帳號$$` 時，請依序執行以下步驟：

1. **偵測觸發平台**：若為 `$$Line帳號$$` 平台設為 `line`；若為 `$$TG帳號$$` 設為 `tg`。
2. **展示互動式選單**：
   - 讀取並解析 `.env.local` 中的後綴變數。
   - 動態解析帶有後綴的金鑰變數與描述欄位（例如 `LINE_ACCOUNT_DESC_922dmfib="新帳號 - 運作中"`），以帳號描述的「友善名稱」呼叫 `ask_question` 供總管點選。
3. **寫入配置與重啟**：
   - 執行 `node scripts/switch_bot_env.js <platform> <選擇字尾>`。
   - 若為 `line`，執行以下指令以防進程不存在：
     ```powershell
     try { npx pm2 restart line-bridge 2>$null; if ($LASTEXITCODE -ne 0) { throw "restart failed" } } catch { powershell -ExecutionPolicy Bypass -File start_line.ps1 -Start }
     ```
   - 若為 `tg`，執行以下指令以防進程不存在：
     ```powershell
     try { npx pm2 restart tg-bridge-zero-delay 2>$null; if ($LASTEXITCODE -ne 0) { throw "restart failed" } } catch { powershell -ExecutionPolicy Bypass -File start_telegram.ps1 -Start }
     ```
4. **喚醒監聽器與接管控制權**：
   重啟完成後，Agent 必須根據平台執行以下動作以啟動背景長輪詢監聽器（請將指令放入背景執行）：
   - 若為 `line`：
     執行：`node skills/03_Execution/line-bot-zero-delay/line-bot-project/start_line.js Antigravity-Master "AI_Master" true` 
   - 若為 `tg`：
     先執行：`node skills/03_Execution/telegram-bot-cdp-bridge/telegram-bot-project/start_tg.js Antigravity-Master`
     再執行：`node skills/03_Execution/telegram-bot-cdp-bridge/telegram-bot-project/poll_tg.js Antigravity-Master`
5. **確認與回報**：確認服務與監聽器皆成功啟動，並回報總管切換完成。
