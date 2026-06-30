# 🏗️ LINE Zero-Delay 架構與輕量化盤點報告

> [!NOTE]
> 總管您好，遵照您的指示，本報告完整梳理了目前 LINE 啟動的**所有核心調用流程**與**系統架構**，並為您詳細表列出**已經停用、可進行輕量化刪除的冗餘資料與程式碼**。
> 
> *註：目前僅作盤點，尚未執行任何刪除動作，待您確認後隨時可啟動輕量化程序。*

---

## 🟢 第一部分：目前 LINE 啟用的所有調動及核心架構 (Current Architecture)

目前系統已全面轉移至 **「單一入口、分散式鎖、Redis 訊息佇列」** 的高效能架構。

### 1. 系統啟動與網路層 (System Daemon & Tunnel)
* **`$$Line啟動$$.ps1`** -> **`start_line.ps1`**
  - **角色**：系統唯一的守護神 (Daemon)。
  - **流程**：
    1. 清理舊日誌與舊有連線。
    2. 在背景啟動 `cloudflared.exe` (Quick Tunnel)，並導出日誌到 `cloudflared_log.txt`。
    3. 動態解析出最新的網址 (`https://*.trycloudflare.com`)。
    4. 將網址設為環境變數 `$env:TUNNEL_URL`。
    5. 前景啟動 `node bridge.js`。

### 2. 核心橋接層 (The Bridge)
* **`skills/03_Execution/line-bot-zero-delay/line-bot-project/bridge.js`**
  - **角色**：LINE 官方 API 與 AI Agent 之間的中央處理器。
  - **功能**：
    - **自動綁定**：開機時讀取 `$env:TUNNEL_URL`，主動呼叫 LINE API 更新 Webhook（做到開機即連線，零死角）。
    - **接收端 (`/webhook`)**：接收 LINE 訊息，並寫入 Redis Stream (`prod:linebot:events`)。
    - **派發端 (`/api/inbox`)**：利用 `XREADGROUP` / `XAUTOCLAIM` 分發訊息，並內建 `SETNX` 冪等性去重，防止訊息陷入重複派發迴圈。
    - **發送端 (`/api/outbox`)**：攔截 API，若憑證有效，則呼叫 LINE SDK (`pushMessage`) 推播回覆，同時支援 Markdown 轉 Flex Message (`markdown_to_flex.js`) 與額度 (Quota) 檢查防護。並內建 Try-Catch 防止 `400 Bad Request` 導致系統崩潰。
    - **鎖控中心 (`/api/lock/*`)**：發放與驗證分散式鎖 (`Fencing Token`)。

### 3. 代理人控制層 (Agent Worker Layer)
當任何 AI Agent 想要「接管」LINE 機器人時，會執行以下兩支核心程式：
* **`start_line.js`**
  - 向 Bridge 呼叫 `/api/lock/acquire`，強制搶奪控制權與鎖。
  - 成功後，在背景孵化 (Spawn) `poll_inbox.js` 開始傾聽。
* **`poll_inbox.js`**
  - 不斷向 Bridge 的 `/api/inbox` 長輪詢 (Long-polling)。收到新訊息後，轉交給 Agent 處理。一旦發現自己失去了鎖 (被別人搶走)，自動優雅退出。
* **`reply.js`**
  - Agent 產生回覆後，呼叫此腳本。
  - 此腳本會將文字打包，送往 `/api/outbox`。
  - **自癒機制**：如果收到 403 (鎖已過期)，會自動以「指數退避 (Exponential Backoff)」等待並重新向 Bridge 索取新鎖再重送，確保長文回覆不遺失。

---

## 🔴 第二部分：已停用、可準備輕量化清除的資料 (Deprecated / Dead Code)

在經過多次架構升級與「三頭馬車」整併後，以下檔案與機制已經完全失去作用。建議在後續的「輕量化處理」中將它們全數移除以淨化專案庫：

### 1. 被取代的舊架構核心
* ❌ **`index.js`**
  - *原因*：最早期撰寫的簡易版 Express 伺服器，僅能做到「學他說話 (Echo)」，目前已完全被強大的 `bridge.js` 取代。
* ❌ **`fetch_fallback.js`**
  - *原因*：舊版架構中用來防止漏訊息的定期抓取腳本。現在已由 Redis 的 `XAUTOCLAIM` 與 `poll_inbox.js` 的長輪詢機制完美取代。
* ❌ **`check_quota.js`**
  - *原因*：獨立的 LINE 額度檢查腳本。現在額度檢查邏輯已直接內建於 `bridge.js` 的 `pushToLine()` 中，每次發言自動檢查。

### 2. 舊版守護與自癒機制 (PM2 殘黨)
* ❌ **`ecosystem.config.js`**
  - *原因*：PM2 的啟動設定檔。系統現已全面改用 `start_line.ps1` 原生背景執行，不再依賴 PM2。
* ❌ **`bridge_stdout.log` / `bridge_stderr.log`**
  - *原因*：PM2 遺留的日誌檔案，不再被寫入，佔用空間。
* ❌ **`Modules/Start-LineBot-SelfHeal.ps1`**
  - *原因*：放置於 `Modules/` 的舊版 PowerShell 自癒腳本，已被最新版本的 `start_line.ps1` 取代並統籌。
* ❌ **`start_line.js` 內的 `selfHealAndRetry()` 舊函數邏輯**
  - *狀態*：(已於先前步驟清除) 原先設計不良會導致 Port 3000 死鎖，現已被 `reply.js` 內的 403 指數退避邏輯取代。

### 3. 周邊不相關的附屬腳本
* ❌ **`generate_excel.js` / `send_excel_link.js`**
  - *原因*：舊版用來產生技能庫 Excel 表格的腳本，與目前 Zero-Delay 核心的即時通訊職責無關。
* ❌ **`public/Skills_Inventory.xlsx`**
  - *原因*：前述 Excel 腳本產生的舊有靜態檔案。
* ❌ **`report.txt` / `send_report.js`**
  - *原因*：舊版用來推播系統報告的腳本，目前的監控日誌與例外處理已足夠完善。

---

> [!IMPORTANT]
> 總管，以上列出的紅色 ❌ 項目皆可安全刪除而不會影響目前 LINE 機器人的任何運作。
> 
> 目前並未執行任何刪除動作，待您詳閱報告後，若同意進行輕量化，請直接通知我執行「刪除停用資料」程序。
