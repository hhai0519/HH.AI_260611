# 待辦事項 (TODO)
> **最後更新**：2026-06-20 | 由 Antigravity 總管整理

---

## ✅ 已完成
- [x] 在 `.env.local` 中加入 `LINE_CHANNEL_SECRET` 與 `LINE_CHANNEL_ACCESS_TOKEN`（填入實際金鑰）
- [x] 重新啟動 LINE Bridge：`node line-bot-project/bridge.js` 並測試回覆
- [x] V4 Patch：封存幽靈節點（huashu-nuwa / macro-linkage / line-communication-style）
- [x] V4 Patch：封存籌碼備援層（chip-logic-expert / ownership-cluster）
- [x] V4 Patch：`$$自動化$$` 路由碰撞解除，植入三選一選單攔截機制
- [x] V4 Patch：Manifest 同步至 64 個技能，00_System_Architecture_Map.md 更新至 V4.0.0
- [x] 臨時腳本清理：`line-bot-project/reply_all.js`、`process_queue.js`、`test_bridge.js` 等已移至 `scratch/` 歸檔或刪除，符合零散落原則
- [x] 目錄零散落淨化：根目錄散落檔案已移入 `Modules/`、`SOP/`、`Data/` 或 `scratch/`，全站完全符合 SOP_00B 規範
- [x] .gitignore 保護確認：已確認根目錄 `.gitignore` 排除所有 `.env*` 檔案，且從 Git 快取中移除，防止敏感金鑰洩漏
- [x] MCP 認證與防禦：已建立認證狀態監控器 `Modules/nlm_auth_watchdog.ps1`，實作 NotebookLM 認證過期預警與防禦機制

---

## 🔴 緊急 — LINE 服務維運
- [x] **LINE Webhook URL 自癒同步**：已透過 `bridge.js` 中的 Auto-Heal 模組實現開機自癒同步——重啟時自動讀取 Cloudflare 隧道日誌，偵測到 URL 變更時，自動調用 LINE API 更新後台 Webhook endpoint，完美免除人工干預。
- [ ] **Cloudflare Tunnel 穩定性優化**：目前使用 quick tunnel，日誌出現 DNS `i/o timeout`，建議改為建立具名 Cloudflare Tunnel（需登入帳號），確保公開 URL 永久固定、不受重啟影響。

---

## 🟠 系統架構合規性優化
> 📄 **參考計畫文件：** [Architecture_Compliance_Plan_20260618.md](file:///c:/Users/HH.AI_260611/Desktop/HH.AI_260611/Data/Execution_Plans/Architecture_Compliance_Plan_20260618.md)

- [x] **LINE Bridge 狀態管理升級**：已成功重構 `Modules/line-bot-project/bridge.js` 與 `start_line.js`，對接 `db_state_manager.js` 實作資料庫悲觀鎖與 `line_message_queue` 佇列資料庫化（含防呆降級雙模式）。
- [x] **架構位置決策**：已正式將專案搬移至 `Modules/line-bot-project/`（符合 SOP_00B 零散落原則），並實作 PM2 動態自癒回復。

---

## 🟡 安全與維運任務
- [ ] **更新金鑰**：定期輪換所有在 `.env.local` 中的 API 金鑰（LINE、GitHub、NotebookLM 等）。
- [ ] **GitHub 同步機制優化**：優化 Git 推送流程，確保大型重構前必定執行備份 Commit，並確認沒有卡在 `COMMIT_EDITMSG` 中斷狀態（SOP_05）。
- [ ] **資安管理複查**：針對目前所有 API 整合（LINE、NotebookLM、GitHub、FinMind）執行一次完整的資安審計，確認最小權限原則與憑證管理符合 SOP_02。

---

## 🔵 系統架構 P0/P1 遺留優化項目
> 源自 2026-04-12 全案審計報告（整體完成度 68%）

- [ ] **資料流即時化**：將 `ai_report.json` 改為 SSE/WebSocket 推送，取代靜態快取；確認 `/api/scanner/stream/route.ts` 可用性。
- [ ] **盤口與資金資料真實化**：修復 HUD_Capital 硬編碼 Demo 值，對接真實金流 API；將 L2OrderBook 的 `Math.random()` 模擬資料替換為真實盤口。
- [ ] **視覺化組件實裝**：完成 PERiverMap 與 OwnershipCluster 組件的正式頁面掛載（已開發完成但尚未整合至主頁面）。

---

## 📋 規範與文件建立
- [ ] **待辦清單優化**：為 TODO.md 建立更完善的格式規範（如優先級標籤、截止日期欄位），並評估是否遷移至 Notion 統一管理。
- [ ] **計畫書保留規範**：建立計畫書（Execution Plans）的儲存、命名與長期保留標準規範（存放位置 `Data/Execution_Plans/`），確保重要計畫不因對話更新而遺失，並寫入 SOP。
