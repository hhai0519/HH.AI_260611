---
name: line-bot-zero-delay
type: automation
description: 當需要設定、修復或啟動 LINE Bot 與 Antigravity IDE 之間的「光速直連」時觸發。具備零延遲檔案驅動架構與 Cloudflare 隧道能力。
version: "1.0.0"
capabilities:
  tool_category: "Integration & Automation"
  execution_env: "Agent Native"
  io_format: "Markdown"
---

# LINE 光速直連橋接器 (LINE Zero-Delay Pipeline)

## 功能概述
本技能負責部署並維護 LINE Bot 與 Antigravity IDE 之間的「Zero-Delay File Event Pipeline」。
透過完全拋棄傳統 `cron` 輪詢，改用語義清晰、低耗能的 `fs.watch` 事件驅動，並利用 Cloudflare Tunnel 突破本機網路限制，實現毫秒級的 LINE 遙控 Agent 功能。

## 觸發條件
- **`$$Line啟動$$`** 或 **`$$Line啟動: <自訂名稱>$$`**：收到此關鍵字時，立即執行下方「標準啟動流程」，無需詢問確認。
  *(範例：`$$Line啟動: 助理一號$$`)*
- 使用者要求「啟動 LINE Bot」、「檢查 LINE 機器人連線」。
- 系統日誌中看到「LINE_REQUEST」或是需要回覆 LINE 使用者的對話。
- 使用者反映「LINE 收不到訊息」、「Bridge 沒有反應」。

## `$$啟動LINE$$` 標準啟動流程 (SOP v2 — 單一 Agent 鎖定機制)

> [!IMPORTANT]
> 系統會自動判斷目前狀態，Agent 只需執行「唯一一個指令」，其餘邏輯由 `line_controller.js` 自動處理。

### 步驟 1：確認 Agent 身份
每個 Agent 在每次對話開始時，應生成唯一的 `AGENT_ID` 和 `AGENT_LABEL`：
```
AGENT_ID    = "Agent-{當前毫秒時間戳}"        例：Agent-1749815400000
AGENT_LABEL = "[{AI模型名}] {使用者自訂名稱或預設名稱}" 
```
> [!WARNING]
> **絕對禁止使用 `tasklist` 或任何指令去讀取作業系統視窗標題！這會導致嚴重的效能卡頓（長達數分鐘）！**
> - 如果使用者輸入 `$$Line啟動: 我的機器人$$`，請將 LABEL 設為 `[Gemini 3.5] 我的機器人`。
> - 如果使用者只輸入 `$$Line啟動$$`，請預設使用 `[Gemini 3.5] Zero-Delay`。
> - **絕對禁止因為對話題材改變 (例如從股票轉移到購物)，就自作主張改變自己的 `AGENT_LABEL`！** `AGENT_LABEL` 必須在整個過程中保持一致。話題分類請透過 `reply.js` 的 `TopicCategory` 引數進行區分，切勿幹擾 Agent 身份標籤！

### 步驟 2：執行控制器
為了達成「零延遲無縫切換」，當收到 `$$Line啟動$$` 時，請 Agent **自主理解**使用者的意圖就是「強行切換回當前 Agent」。
因此，呼叫控制器時，**必須**傳入 `true` 作為第三個引數（強行接管），絕對不要讓系統進入 pending 狀態再去問使用者。

```powershell
// 注意最後一個引數必須是 true (代表強行接管)
node line-bot-project/start_line.js <AGENT_ID> "<AGENT_LABEL>" true
```

### 步驟 3：根據回傳結果在 IDE 對話方塊中報告

> [!WARNING]
> **嚴格禁止使用 `reply.js` 傳送系統切換通知！**
> 下列所有提到的「回報/告知」，**皆僅限於在 Antigravity IDE 的對話方塊中用文字回答使用者**，絕對不可以將這些系統提示傳送到 LINE APP 中幹擾使用者！

由於我們已經強制傳入 `true`，控制器只會回傳成功接管的訊息。
請直接在對話方塊中回答使用者：「✅ 已成功強制接管 LINE 控制權！目前已切換回您的 Agent，並在背景啟動監聽，隨時準備為您服務。」

### ⏱️ HTTP Polling API 架構
- **Agent 接管**：使用 `$$啟動LINE$$` 時，`start_line.js` 會呼叫 `/api/lock/acquire` 向 Bridge 取得控制權（覆寫 `activeAgentToken`）。
- **訊息拉取**：背景指令碼 `poll_inbox.js` 會每秒呼叫 `GET /api/inbox?token={agentId}`。當收到訊息時，會將其印在日誌中並 `process.exit(0)` 喚醒您。
- **回覆傳送**：只有當您實際要回覆使用者的 LINE 訊息時，才執行 `node reply.js <userId> <text>`。

### ⚙️ 被踢出時的自動通知機制
當控制權被其他 Agent 奪走時（`transferred`），系統會自動：
1. 讓舊 Agent 的 `poll_inbox.js` 收到 `403 Forbidden`。此時舊 Agent 的 `poll_inbox.js` 會印出 `[AGENT_TRANSFER]` 警告並結束。
2. **⚠️ 給舊 Agent 的重要指令**：當您（舊 Agent）被喚醒，且在日誌中看到 `[AGENT_TRANSFER]` 時，您必須在 **IDE 對話方塊中** 告知使用者：「⚠️ LINE 控制權已被其他 Agent 接管，此 Agent 已自動確認退出監聽。」，然後直接結束任務。**(再次強調：嚴禁呼叫 `reply.js` 傳送此通知至 LINE！)**
## 執行流程

### 1. 啟動或重啟橋接器
由於我們已採用 Node 原生自癒監管模式（Supervisor），橋接器與隧道的啟動與重啟已完全自動化。
您不需要手動啟動 PM2 或手動重啟服務。只需執行唯一的標準啟動指令：
`node line-bot-project/start_line.js <AGENT_ID> "<AGENT_LABEL>" true`
系統會自動檢查 Redis Docker 容器、強殺任何佔用 Port 3000 的無關進程，並在背景以 IDE 任務的形式重新拉起 `bridge.js` 和 `cloudflared.exe`，隨後立即完成控制權接管。

> [!IMPORTANT]
> **V4 核心喚醒機制 (Task-Exit Loop)**
> 為了突破系統休眠，當 `poll_inbox.js` 收到訊息時，會立刻印出內容並自我結束 (`process.exit(0)`)，利用任務結束的系統通知強制喚醒您。
> **因此，每次您被喚醒並處理完 LINE 訊息後，都必須立刻帶入您自己的 AGENT_ID 來重啟監聽器！否則通訊將會中斷！**
> 恢復監聽指令：`node poll_inbox.js <您的AGENT_ID>`

### 2. 回覆 LINE 使用者
當 Agent (您) 在 stdout 或日誌中收到 `[LINE_REQUEST] <userId> : <text>` 時，必須使用專屬回覆指令碼，**絕對不能使用自然語言回答在終端機或聊天室中**。

為徹底解決「中文亂碼」並避免觸發 IDE 的「檔案修改核准提示 (Modify/Add)」，我們已全面升級為「環境變數無痕傳遞」機制。`reply.js` 會自動讀取環境變數，並將紀錄完美歸檔到桌面。

**執行回覆 SOP (無痕傳送，嚴禁發明新指令碼或寫實體檔案)：**

1. **嚴禁使用 `write_to_file`**：
   為了避免打擾使用者，**絕對禁止**建立 `reply.txt`、`send.js` 或任何實體暫存檔！

2. **透過 PowerShell 環境變數傳遞長篇回覆**：
   請透過 `run_command` (使用 PowerShell) 先將回覆設定為 `$env:REPLY_TEXT` (支援多行 `@"` 字串)，然後在同一行指令中呼叫 `reply.js` 並傳入 `env` 作為第二個引數。

   **引數說明：**
   `node reply.js "<userId>" "env" "<AGENT_LABEL>" "<類別/標的名稱>" "<問題簡述>"`
   - `類別/標的名稱`：請您**自主判斷**目前討論的核心標的或類別（例如：「鉅祥」、「群創」、「掃地機器人」）。系統會自動依據這個類別名稱，幫您把對話分門別類歸檔到對應的資料夾中！
   - `問題簡述`：本次回答的重點摘要（例如：「分析技術面」）。

```powershell
// 範例指令：分析鉅祥的技術面
$env:REPLY_TEXT = @"
(您的長篇大論 Markdown 回覆內容)
"@; node line-bot-project\reply.js "<userId>" "env" "[Gemini 3.1 Pro] 臺股分析工具" "鉅祥" "分析技術面"
```
*(執行完畢後，`reply.js` 會自動讀取變數並傳送，並在桌面生成 `Line對話紀錄` 歸檔，過程中不會產生任何垃圾檔案！)*
回覆的內容支援完整的 Markdown 語法（包含程式碼區塊）。

### 3. 問題排解 (Troubleshooting)
- **如果 Bridge 收不到 Webhook**：檢查是否誤用 `localtunnel`。`localtunnel` 會攔截首次連線，請使用 PM2 狀態中的 `cloudflare-tunnel`。
- **如果 Agent 沒有自動醒來**：這代表 `poll_inbox.js` 可能已經停止運作，請再次執行 `node poll_inbox.js <AGENT_ID>`。
- **如果指示透過 NotebookLM 研究**：
  1. 必須嚴格遵照指示呼叫 `notebooklm` 相關 MCP 工具。
  2. 若遇到無法連線、憑證過期 (`auth_status: stale` 或 `Authentication expired`) 等錯誤時，**絕對禁止**未經同意自行改用常規網路搜尋 (Web Search) 替代。
  3. 遇到錯誤時，請**立刻中斷動作並主動告知使用者**，請使用者協助登入或修復連線後，再繼續研究任務。

## 核心通訊規範與 UI/UX 最佳實踐 (v2 更新)

### 1. 許可權預警機制 (Permission Pre-warning)
**嚴格規定**：當 Agent 準備呼叫會觸發 IDE 畫面「許可權核准視窗」的工具（例如 `run_command` 執行未知指令碼或登入指令時），**必須先透過 LINE 傳送預警訊息**，告知使用者「請至電腦前點選 Approve」，以免使用者在遠端空等。

### 2. 訊息文字與按鈕解耦 (Text & Button Decoupling)
為了保留手機端「長按複製文字與程式碼」的原生功能，回覆機制不應將全部文字包裝成單一的 `Flex Message`。
- **作法**：主體文字使用純 `Text Message` 傳送，若有指令選項按鈕，則抽離為獨立的 `Flex Message`，並附在文字下方作為陣列一起傳送。

### 3. 零消耗狀態回饋 (Zero-Quota Loading Animation)
- 當 Bridge 收到使用者訊息時，立即呼叫 LINE 官方 `showLoadingAnimation({ loadingSeconds: 60 })`，產生「三個小點點」的打字中動畫，提供即時運算回饋，且**不消耗推播額度**。

### 4. 靜態檔案與圖片處理
- **圖片接收**：Bridge 內建圖片攔截機制，透過 `sharp` 轉換為 WebP 並儲存至 `public/`，向 Agent 傳遞 `[IMAGE:/path/to/img]` 標記。
- **檔案下載**：提供 `/download/...` 路由並強制寫入 `Content-Disposition: attachment` 標頭。必須透過 Cloudflare Tunnel (`*.trycloudflare.com`) 傳送連結，避免被 localtunnel 的防釣魚警告頁面阻擋。

### 5. 零延遲系統指令 (Zero-Delay Commands)
- 例如輸入 `$$額度$$`，Bridge 應直接攔截並呼叫 LINE API 查詢剩餘訊息額度，**完全不喚醒 Agent** 以節省運算資源與時間。

### 6. 超時安撫與死信佇列防護 (Proactive Timeout & DLQ)
- **UX 主動安撫**：當 Agent 處理時間超過 60 秒時，Bridge 會自動推送橘色的「⏳ AI 正在深度思考中...」進度提示卡片。
- **死信佇列 (DLQ)**：當單一訊息重試超過 3 次 (每次 120 秒) 仍未完成，Bridge 會將其移入 `dead_letter.json` 並傳送紅色錯誤卡片，避免主排隊通道卡死。

### 7. Markdown 純淨過濾與系統卡片 (Markdown Cleaner & System Flex)
- **純淨閱讀**：透過 `markdown_to_flex.js` 自動過濾 Agent 輸出的 `**粗體**` 星號，並將 `### 標題` 轉為更乾淨的 `■ 標題`，提供舒適的手機端閱讀體驗。
- **系統卡片隔離**：所有 Bridge 自動傳送的系統通知（滿載、超時、錯誤）都會包裝成專屬的 Flex Message 卡片，與 AI 的自然語言回覆做出強烈的視覺隔離。

### 8. 顧問命名與呈現格式 (Naming Convention)
> [!IMPORTANT]
> **全域鐵律：** 只要在 LINE 訊息中向使用者提到任何代理人、專家或顧問，**必須嚴格遵守「先中文說明，再加括號標註英文代號」的格式**，且中文應使用全名標準翻譯，以確保手機端閱讀的直覺性。
> - ❌ 錯誤示範：交給 data-engineer 處理，或是請參考 馬斯克視角 / 卡帕西視角。
> - ✅ 正確示範：交給資料工程師 (data-engineer) 處理，或是請參考伊隆·馬斯克視角 (elon-musk-perspective) / 安德烈·卡帕西視角 (andrej-karpathy-perspective)。

## 邊界說明
- ✅ 適用：LINE Bot 串接、Webhook 隧道建立、Zero-Delay 事件機制架設、原生 UI 解耦、許可權預警。
- ❌ 不適用：直接使用 CDP `--remote-debugging-port` 注入 UI（目前環境不支援）。

## 協同技能
- `notebooklm-mcp`: 當 LINE 使用者要求進行長文研究時協同呼叫。

---

## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議

---
> [!WARNING]
> **全域鐵律：NotebookLM 研究遵從指示**
> 1. 當任務指示「透過 NotebookLM 進行研究/查詢」時，必須嚴格呼叫 `notebooklm` 相關 MCP 工具。
> 2. 若遇到無法連線、憑證過期 (`auth_status: stale` 或 `Authentication expired`) 等錯誤時，**絕對禁止**未經同意自行改用常規網路搜尋 (Web Search) 或其他工具替代。
> 3. 遇到錯誤時，請**立刻中斷動作並主動告知使用者**，請使用者協助登入或修復連線後，再繼續研究任務。
