---
name: "telegram-bot-cdp-bridge"
description: "[V14.1.0+ 舊 CDP App 已停用，現已完全改用零延遲的 tg-bridge-zero-delay] 透過 Zero-Delay HTTP Bridge 架構，讓 Agent 透過 Telegram 接收指令並回覆"
version: "14.1.0"
type: "execution"
triggers: ["$$TG連線$$"]
dependencies: []
capabilities:
  tool_category: "Messaging Bridge & Remote Control"
  execution_env: "Node.js/TypeScript/grammY/Express"
  io_format: "JSON over HTTP Long-Polling"
---

# Telegram Zero-Delay Bridge (v14.1)

## 核心功能
本技能透過 Zero-Delay HTTP Long-Polling 架構，讓 Agent 能從 Telegram 接收使用者訊息並即時回覆。
API Server 在 `127.0.0.1:3001` 監聽（與 LINE 的 3000 完全隔離），PM2 守護進程名稱為 `tg-bridge-zero-delay`。

> [!CAUTION]
> **【越權防護紅線】**：收到 `$$TG連線$$` 時，Agent **唯一的合法動作**是執行以下啟動腳本。
> 嚴禁額外執行 `pm2 list`、`Get-Process` 等查詢指令。

## 操作步驟
當收到 `$$TG連線$$` 觸發字時，Agent 依序執行：

**步驟 1：確保 Zero-Delay Bridge 已在 PM2 中運行**
```powershell
try {
  npx pm2 restart tg-bridge-zero-delay 2>$null
  if ($LASTEXITCODE -ne 0) { throw "restart failed" }
} catch {
  $orig = Get-Location
  Set-Location "skills\03_Execution\telegram-bot-cdp-bridge\telegram-bot-project"
  npm install
  if ($LASTEXITCODE -eq 0) { npm run build }
  if ($LASTEXITCODE -eq 0) { npx pm2 start ecosystem.telegram.config.js --only tg-bridge-zero-delay }
  Set-Location $orig
}
```

**步驟 2：取得 Agent 控制權**
```powershell
node skills\03_Execution\telegram-bot-cdp-bridge\telegram-bot-project\start_tg.js Antigravity-Master
```

**步驟 3：開始長輪詢監聽（放入背景）**
執行 `poll_tg.js` 進行持續監聽。

## 回覆格式
```powershell
$env:REPLY_TEXT = "回覆內容"; node skills\03_Execution\telegram-bot-cdp-bridge\telegram-bot-project\reply_tg.js <chatId>
```
