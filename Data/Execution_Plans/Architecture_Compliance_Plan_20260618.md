# 系統架構合規性優化計畫 (Architecture Compliance Plan)

在檢視目前的 `line-bot-project` 與系統根目錄後，發現目前的架構有幾處**違反了現行的 SOP 與系統政策**。為確保系統穩定性及符合 V3.2.0 的最高安全與架構標準，提出以下修正計畫。

> [!WARNING]
> 本計畫涉及搬移檔案及修改 LINE Bridge 的底層鎖定邏輯（改接資料庫）。在執行前需要您的確認。

## ⚠️ 發現的 SOP 違規項目

### 1. 違反「絕對零散落原則 (Zero-Clutter Policy)」
**依據：** [`SOP_00B_Agent_File_Governance.md`](file:///c:/Users/HH.AI_260611/Desktop/HH.AI_260611/SOP/SOP_00B_Agent_File_Governance.md)
SOP_00B 明確規範根目錄僅能存在 `00_Master_Menu.ps1`、`啟動系統.bat` 與隱藏設定檔。其餘任何腳本、專案與說明檔皆須歸入子資料夾（`Modules/`、`SOP/`、`Data/` 等）。
- **違規檔案**：
  - `LINE_Bridge_Improvement_Report.md`、`TODO.md` 散落在根目錄。
  - `send_full_report.js`、`extract_cookies.py`、`smart_distillation_runner.py` 散落在根目錄（應在 `Modules/`）。
  - `line-bot-project/` 獨立於根目錄，未納入模組或系統資料夾規範。

### 2. 違反「分散式悲觀鎖機制 (Pessimistic Distributed Lock)」
**依據：** [`SOP_10_AI_Command_Center.md`](file:///c:/Users/HH.AI_260611/Desktop/HH.AI_260611/SOP/SOP_10_AI_Command_Center.md)
SOP_10 強制宣告 V3.2.0 已廢除本地檔案鎖機制，所有 Agent 資源鎖定必須透過 `Modules/db_state_manager.js` 操作資料庫。
- **違規實作**：目前的 `bridge.js` 仍使用本地檔案 `bridge_state.json` 作為 `messageQueue` 與 `activeAgentToken` 的儲存媒介，並且自行實作了 `/api/lock/acquire`，這在多 Agent 併發環境下不具備分散式互斥的安全性。

---

## 🛠️ Proposed Changes (預計執行的修改)

### Phase 1: 根目錄零散落淨化 (Zero-Clutter Cleanup)
將散落的檔案歸位至符合 SOP_00B 的指定目錄。

#### [MODIFY] 將腳本移入 Modules
- 將 `send_full_report.js` 移至 `Modules/`
- 將 `extract_cookies.py` 移至 `Modules/`
- 將 `smart_distillation_runner.py` 移至 `Modules/`

#### [MODIFY] 將文件移入歸檔
- 將 `LINE_Bridge_Improvement_Report.md` 移至 `SOP/` (並補上 YAML 標頭) 或 `Data/`
- 將 `TODO.md` 移至 `Data/`

### Phase 2: LINE Bridge 狀態管理升級 (DB State Manager Integration)
對 `line-bot-project/bridge.js` 與 `start_line.js` 進行深度重構，廢除 `bridge_state.json`，對接標準資料庫層級。

#### [MODIFY] `line-bot-project/bridge.js`
- 移除本地 `bridge_state.json` 讀寫邏輯 (`fs.writeFileSync`)。
- 引入 `Modules/db_state_manager.js` 的連線池。
- 修改 `/api/lock/acquire` 端點，不再修改記憶體變數，而是呼叫 `acquireAgentLock('line_bridge_lock', agentId)`，直接鎖定資料庫資源。
- (可選) 評估是否將 `messageQueue` 也改寫至 Neon DB 以確保無狀態 (Stateless)，或維持記憶體暫存但只由拿到 DB 鎖的 Agent 消耗。

#### [MODIFY] `line-bot-project/start_line.js`
- 更新其獲取控制權的邏輯，配合新的 DB 鎖定機制，並在常駐執行時加入 `startLockHeartbeat` 確保 Agent 鎖定不會因逾時而失效。

---

## ❓ Open Questions (需要您的確認)

> [!IMPORTANT]
> 1. **`line-bot-project` 的位置**：目前 LINE Bot 專案作為一個完整的 Node.js 專案放置在根目錄。依據零散落原則，是否應將整個 `line-bot-project/` 目錄搬移至 `Modules/line-bot-project/`，或是將其視為特許的「核心服務目錄」保留在根目錄？
> 2. **訊息佇列 (Message Queue)**：目前使用陣列儲存訊息並寫入 `bridge_state.json`。為了符合資料庫優先的原則，是否需要我在 Neon DB 新增一個 `line_message_queue` 資料表來徹底取代 `bridge_state.json`？還是只修正 Agent Lock (控制權) 的部分即可？

## Verification Plan
1. 確認執行 `node bridge.js` 時無語法或啟動錯誤。
2. 啟動 `start_line.js`，觀察 `db_state_manager.js` 是否成功在 Neon DB 的 `agent_distributed_locks` 寫入鎖定紀錄與心跳續命。
3. 根目錄檢視符合絕對零散落原則。
