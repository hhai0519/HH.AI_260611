# 🛠️ V17 架構升級計畫：極限併發與記憶體防護修復

總管您好，收到「啟動修復計畫」的指示。根據我們先前第二階段深度研究發掘的三大隱患，我已擬定 V17 版本的底層修復計畫。

本計畫將徹底解決 Socket 耗竭、同步 I/O 阻塞以及 Redis 記憶體洩漏的問題，使系統具備承載企業級萬人併發的能力。

---

## ⚠️ User Review Required
本次修復涉及 `bridge.js` (系統心臟) 與 `poll_inbox.js` (感測器) 的底層 I/O 邏輯變更。請確認以下修復方案是否符合您的預期，我們將在您的批准後正式執行修改。

---

## 🛠️ 預定修改項目 (Proposed Changes)

### 1. `poll_inbox.js` (修復 Socket 資源耗竭)
- **問題**：目前未啟用 `keep-alive`，每秒連線會產生大量 `TIME_WAIT` Socket。
- **解法**：在頂部實例化一個全域的 `http.Agent({ keepAlive: true, maxSockets: 1 })`。
- **效益**：確保與 Bridge 的連線重複使用同一個 TCP Socket，徹底消滅作業系統的連線數耗竭風險。

### 2. `bridge.js` (修復 Event Loop 阻塞)
- **問題**：記憶體降級模式的 `saveState()` 使用了同步的 `fs.writeFileSync`，高負載下會卡死 Node.js 單執行緒。
- **解法**：將 `fs.writeFileSync` 替換為非同步的 `fs.writeFile`。
- **效益**：解除 I/O 阻塞，確保 LINE Webhook ( `/api/events` 等入口 ) 能在 1 毫秒內迅速響應，避免 LINE Platform 判定超時。

### 3. `bridge.js` (修復 Redis 記憶體溢位)
- **問題**：所有的 `redis.xadd` (包含 audit, events, dlq, replay) 皆未設定最大長度，會導致 Redis 記憶體無限增長。
- **解法**：在所有的 `redis.xadd` 指令中，插入 `MAXLEN` 近似修剪參數 (例如 `MAXLEN ~ 10000`)。
- **效益**：確保每個 Stream 佇列最多只保留最近的 10,000 筆紀錄，讓 Redis 的記憶體使用量保持平穩的水平線，實現「永遠不會 OOM (Out of Memory)」的全自動化運行。

---

## ✅ 驗證計畫 (Verification Plan)
1. 執行修改後，啟動 `start_line.js`。
2. 驗證 `poll_inbox.js` 是否能正常維持連線 (Keep-Alive)。
3. 驗證 `bridge.js` 是否能正常啟動且無語法錯誤。
4. 撰寫 V17 升級結案的 `walkthrough.md`。

請問總管是否同意啟動 V17 升級？若無問題，請回覆「**同意執行**」，我將立刻開始動刀！
