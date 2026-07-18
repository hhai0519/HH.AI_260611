---
name: "telegram-bot-cdp-bridge"
description: "[V14.2.0] 透過 Zero-Delay HTTP Bridge 架構，讓 Agent 透過 Telegram 接收指令並回覆。採長駐阻塞式輪詢，只在收到真實訊息時喚醒 Agent，消除監聽器週期性退出所造成的洗版問題。"
version: "14.2.0"
type: "execution"
triggers: ["$$TG連線$$"]
dependencies: []
capabilities:
  tool_category: "Messaging Bridge & Remote Control"
  execution_env: "Node.js/TypeScript/grammY/Express"
  io_format: "JSON over HTTP Long-Polling"
---

# Telegram Zero-Delay Bridge (v14.2)

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

## 回覆格式（強烈建議使用模式 2 或模式 3，防範環境變數殘留衝突）
```powershell
# 模式 1：環境變數（舊版，不建議，跨通道切換易殘留）
$env:REPLY_TEXT = "回覆內容"
node skills\03_Execution\telegram-bot-cdp-bridge\telegram-bot-project\reply_tg.js <chatId>

# 模式 2：從文字檔讀取（推薦！支援 UTF-16 LE 自癒，防 PowerShell 重導向截斷）
$longText | Out-File -FilePath reply.txt -Encoding unicode
node skills\03_Execution\telegram-bot-cdp-bridge\telegram-bot-project\reply_tg.js <chatId> reply.txt

# 模式 3：stdin 管道（適合程式輸出直接導入）
echo "回覆內容" | node skills\03_Execution\telegram-bot-cdp-bridge\telegram-bot-project\reply_tg.js <chatId>
```
