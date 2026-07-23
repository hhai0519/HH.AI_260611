---
name: "telegram-bot-cdp-bridge"
description: "[V14.3.0] 透過 Zero-Delay HTTP Bridge 架構，讓 Agent 透過 Telegram 接收指令並回覆。採長駐阻塞式輪詢，只在收到真實訊息時喚醒 Agent。"
version: "14.3.0"
type: "execution"
triggers: ["$$TG連線$$"]
dependencies: []
capabilities:
  tool_category: "Messaging Bridge & Remote Control"
  execution_env: "Node.js/TypeScript/grammY/Express"
  io_format: "JSON over HTTP Long-Polling"
---

# Telegram Zero-Delay Bridge (v14.3)

## 核心功能
本技能透過 Zero-Delay HTTP Long-Polling 架構，讓 Agent 能從 Telegram 接收使用者訊息並即時回覆。
API Server 在 `127.0.0.1:3001` 監聽（與 LINE 的 3000 完全隔離），PM2 守護進程名稱為 `tg-bridge-zero-delay`。

> [!CAUTION]
> **【越權防護紅線】**：收到 `$$TG連線$$` 時，Agent 應優先執行以下啟動腳本。
> 允許執行 `Get-Process -Id <PID>` 專門用於檢查 `Data/monitoring_pid.tmp` 的存活狀態，但嚴禁額外執行 `pm2 list`、`Get-Process` 等無參數查詢指令。

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
```powershell
# poll_tg.js 為長駐阻塞模式：遇到逾時(204)會自動在進程內靜默續期，
# 只有收到真實訊息([TG_REQUEST])或控制權轉移([AGENT_TRANSFER])時才退出並喚醒 Agent
node skills\03_Execution\telegram-bot-cdp-bridge\telegram-bot-project\poll_tg.js Antigravity-Master
```

## 回覆格式（統一規範：與 AGENTS.md 完全對齊）
```powershell
# 模式 1：環境變數傳遞（官方標準 SOP，無痕傳送不留暫存檔）
$env:REPLY_TEXT = @"
(您的 Markdown 回覆內容)
"@; node skills\03_Execution\telegram-bot-cdp-bridge\telegram-bot-project\reply_tg.js <chatId> "env" "[Gemini] 萬能總管" "<主題分類>" "<問題簡述>"

# 模式 2：文字檔備用讀取（僅當文字量極大且包含複雜轉義字元時使用）
node skills\03_Execution\telegram-bot-cdp-bridge\telegram-bot-project\reply_tg.js <chatId> reply.txt "[Gemini] 萬能總管" "<主題分類>" "<問題簡述>"
```

## 接力監聽規範 (Task-Exit Loop SOP)
當 Agent (您) 處理完 Telegram 使用者對話並呼叫 `reply_tg.js` 傳送回覆後，**必須立刻手動重啟下一輪背景監聽器**：
```powershell
node skills\03_Execution\telegram-bot-cdp-bridge\telegram-bot-project\poll_tg.js Antigravity-Master
```

## 災難自癒與排障手冊 (DRP)
- 若遭遇 `ECONNREFUSED` 或 `3001` 埠口無回應，執行以下指令手動重啟 PM2 服務：
```powershell
npx pm2 restart tg-bridge-zero-delay
```
