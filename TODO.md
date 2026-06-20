# 待辦事項 (TODO)
> **最後更新**：2026-06-18 | 由 Antigravity 總管整理

---

## ✅ 已完成
- [x] 在 `.env.local` 中加入 `LINE_CHANNEL_SECRET` 與 `LINE_CHANNEL_ACCESS_TOKEN`（填入實際金鑰）
- [x] 重新啟動 LINE Bridge：`node line-bot-project/bridge.js` 並測試回覆
- [x] V4 Patch：封存幽靈節點（huashu-nuwa / macro-linkage / line-communication-style）
- [x] V4 Patch：封存籌碼備援層（chip-logic-expert / ownership-cluster）
- [x] V4 Patch：`$$自動化$$` 路由碰撞解除，植入三選一選單攔截機制
- [x] V4 Patch：Manifest 同步至 64 個技能，00_System_Architecture_Map.md 更新至 V4.0.0

---

## 🔴 緊急 — LINE 服務維運
- [ ] **LINE Webhook URL 固定化**：Cloudflare free tunnel 每次重啟 URL 都會改變，必須至 LINE Developers Console 手動更新 Webhook URL，或改用具名隧道（Named Tunnel）解決此問題。
- [ ] **Cloudflare Tunnel 穩定性優化**：目前使用 quick tunnel，日誌出現 DNS `i/o timeout`，建議改為建立具名 Cloudflare Tunnel（需登入帳號），確保公開 URL 永久固定、不受重啟影響。
- [ ] **臨時腳本清理**：`line-bot-project/reply_all.js`、`process_queue.js`、`test_bridge.js` 為臨時調試腳本，應移至 `Data/` 歸檔或直接刪除，符合零散落原則。

---

## 🟠 系統架構合規性優化
> 📄 **參考計畫文件：** [Architecture_Compliance_Plan_20260618.md](file:///c:/Users/HH.AI_260611/Desktop/HH.AI_260611/Data/Execution_Plans/Architecture_Compliance_Plan_20260618.md)

- [ ] **目錄零散落淨化**：將根目錄下不符合 SOP_00B 的散落檔案（如 `.js`、`.py`、`LINE_Bridge_Improvement_Report.md` 等）移入對應的 `Modules/`、`SOP/` 或 `Data/` 目錄。
- [ ] **LINE Bridge 狀態管理升級**：重構 `line-bot-project/bridge.js` 與 `start_line.js`，廢除本地 `bridge_state.json`，改用 `Modules/db_state_manager.js` 實作資料庫層級之分散式悲觀鎖（SOP_10）。
- [ ] **架構位置決策**：決定 `line-bot-project/` 專案目錄是否需搬移至 `Modules/`，以及是否將 Message Queue 一併遷入 Neon DB。

---

## 🟡 安全與維運任務
- [ ] **更新金鑰**：定期輪換所有在 `.env.local` 中的 API 金鑰（LINE、GitHub、NotebookLM 等）。
- [ ] **`.gitignore` 保護確認**：確認根目錄 `.gitignore` 已將 `.env.local` 及所有 `.env*` 加入排除，避免機密金鑰被推送至 Git 版控。
- [ ] **GitHub 同步機制優化**：優化 Git 推送流程，確保大型重構前必定執行備份 Commit，並確認沒有卡在 `COMMIT_EDITMSG` 中斷狀態（SOP_05）。
- [ ] **資安管理複查**：針對目前所有 API 整合（LINE、NotebookLM、GitHub、FinMind）執行一次完整的資安審計，確認最小權限原則與憑證管理符合 SOP_02。
- [ ] **MCP 認證與防禦**：將 NotebookLM MCP 認證修復 SOP 實作「自動預判過期」與備援切換機制，加入主系統行為（源自 Agent_Reflections）。

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
