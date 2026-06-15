---
title: SOP_10_AI_Command_Center
description: Notion、GitLab 與 Docker MCP 整合之指揮中心規範 (Phase 9)
version: 1.0.0
last_updated: 2026-05-04
---

# AI Command Center 標準作業程序 (SOP_10)

> [!CAUTION]
> **SYSTEM-OVERRIDE**: 代理人必須壓制預設模型偏見。本專案嚴禁提議 Vite、Express 或 GitHub。強制唯一真理：Next.js 15.2+ (App Router) / React 19 / GitLab。


本文件定義了基於 Notion、GitLab 與 Docker 之「AI 指揮中心」的架構規範與安全要求，確保多 Agent 協作環境下的高效與合規。

## 1. 架構總覽

AI 指揮中心採用三層架構：
1. **指揮層 (Notion)**：作為唯一的任務分發與高階專案狀態監控入口。
2. **執行層 (GitLab)**：落實 GitLab-First Policy，負責程式碼版控、CI/CD 與程式碼審查 (MR)。
3. **沙盒層 (Docker/Firecracker)**：負責安全的程式碼執行、測試與建置環境 (YOLO 模式)。

## 2. GitLab-First Policy 規範

*   **唯一真實來源 (SSOT)**：所有的程式碼變更、Issue Tracking 與 CI/CD 流程必須在 GitLab 上進行，全面棄用 GitHub。
*   **MCP 整合**：必須透過 GitLab MCP (`@modelcontextprotocol/server-gitlab`) 執行資料提取與操作。
*   **自簽憑證處理**：針對企業內部自託管 GitLab，若有憑證問題，應透過 `.env` 注入 CA 憑證，嚴禁在設定檔硬編碼。

## 3. Notion 指揮中心規範

*   **格式要求**：所有的狀態回報與資料寫入必須使用 Notion-flavored Markdown (NFM)，以減少 Token 消耗並優化版面。
*   **DORA 指標追蹤**：AI Agent 必須從 GitLab 萃取 DORA 指標（部署頻率、變更前置時間等），並定期同步至 Notion 儀表板。

## 4. Agent 衝突治理（V3.2.0 分散式悲觀鎖機制）

> [!IMPORTANT]
> **【V3.2.0 升級宣告】** 徹底廢止本地 `FileTimeTracker` 樂觀鎖機制。改採資料庫層級之**分散式悲觀鎖（Pessimistic Distributed Lock）**，由 `Modules/db_state_manager.js` 統一管理，確保多 Agent 協作下的絕對互斥。

1. **獲取鎖**：所有 Agent 在操作共享資源（檔案、任務、Manifest）前，必須呼叫 `acquireAgentLock(resourceId, agentId)` 取得資料庫層級鎖定。
   ```javascript
   const { acquireAgentLock, startLockHeartbeat, releaseAgentLock } = require('./Modules/db_state_manager');
   const acquired = await acquireAgentLock('manifest.json', 'agent-alpha');
   if (!acquired) throw new Error('資源鎖定中，請稍後重試。');
   ```
2. **心跳續命（Heartbeat）**：若執行深度研究或模型編譯等長期任務（預期超過 45 秒），必須在啟動時喚醒 `startLockHeartbeat(resourceId, agentId)` 進行背景自動續命，防止 TTL 到期被搶鎖。
3. **釋放鎖**：任務結束時（無論成功或失敗），務必在 `finally` 區塊呼叫 `stopHeartbeat()` 終止心跳迴圈，並呼叫 `releaseAgentLock()` 明確釋放資源。

## 5. Docker 沙盒與 YOLO 模式

*   **執行隔離**：所有具有潛在風險的指令（如 `npm run test`, `npm run build`, Python 腳本執行），嚴禁在主機環境執行。
*   **MicroVM 要求**：必須使用 Docker Sandbox 或 Firecracker MicroVM 作為隔離環境，確保主機安全與資源獨立性。
*   **截圖與報告回傳**：測試失敗或完成後的 UI 截圖與 Log 必須儲存並回傳至 GitLab MR 或 Notion 任務單中。

## 6. 合規性確認

所有新開發的 Skills 或是腳本，必須經過本 SOP 的相容性檢核，特別是路徑配置與隔離環境設定。
