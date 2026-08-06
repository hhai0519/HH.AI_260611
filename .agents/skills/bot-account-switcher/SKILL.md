---
name: "bot-account-switcher"
description: "LINE & Telegram 官方帳號雙平台切換工具。支援 $$Line帳號$$ 與 $$TG帳號$$ 觸發，具備實時訊息額度查詢，覆寫 env 並重啟 PM2。"
version: "1.1.0"
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

1. **偵測觸發平台與額度查詢**：
   - 若為 `$$Line帳號$$`：
     - 執行 `node scripts/get_line_quotas.js` 取得各帳號實時剩餘額度。
     - 根據回傳之 `options` 陣列文字，發起 `ask_question` 呈現「依剩餘額度由高至低自動排序」之動態選單供總管點選。
   - 若為 `$$TG帳號$$`：
     - 解析 `.env.local` 中的 `TELEGRAM_BOT_DESC_<suffix>` 動態生成選單。
2. **切換帳號與寫入**：
   - 根據總管點選之 `suffix`，執行 `node scripts/switch_bot_env.js <platform> <suffix>`。
   - 若為 `line`，執行以下指令以防進程不存在：
     ```powershell
     try { npx pm2 restart line-bridge 2>$null; if ($LASTEXITCODE -ne 0) { throw "restart failed" } } catch { powershell -ExecutionPolicy Bypass -File start_line.ps1 -Start }
     ```
   - 若為 `tg`，執行以下指令以防進程不存在：
     ```powershell
     try { npx pm2 restart tg-bridge-zero-delay 2>$null; if ($LASTEXITCODE -ne 0) { throw "restart failed" } } catch { powershell -ExecutionPolicy Bypass -File start_telegram.ps1 -Start }
     ```
3. **喚醒監聽器與接管控制權**：
   重啟完成後，Agent 必須根據平台執行以下動作以啟動背景長輪詢監聽器（請將指令放入背景執行）：
   - 若為 `line`：
     執行：`node skills/03_Execution/line-bot-zero-delay/line-bot-project/start_line.js Antigravity-Master "AI_Master" true` 
   - 若為 `tg`：
     先執行：`node skills/03_Execution/telegram-bot-cdp-bridge/telegram-bot-project/start_tg.js Antigravity-Master`
     再執行：`node skills/03_Execution/telegram-bot-cdp-bridge/telegram-bot-project/poll_tg.js Antigravity-Master`
4. **確認與回報**：確認服務與監聽器皆成功啟動，並回報總管切換完成。
