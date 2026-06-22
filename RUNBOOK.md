# 📖 分散式鎖與訓練控制器運維行動手冊 (Runbook)

本手冊供 SRE 運維工程師於微型模型超參數優化系統發生異常時使用。系統核心採用 PostgreSQL 行級鎖作爲分散式鎖，並結合 Fencing Token 進行併發防護。

---

## 🚨 快速故障診斷路徑

### 1. 檢查分散式鎖狀態
調用安全唯讀端點查詢當前鎖的持有者與過期狀態：
```bash
# 本地查詢（免密鑰）
curl http://localhost:3000/lock/status

# 外部或跨網段查詢（需認證）
curl -H "x-internal-secret: <INTERNAL_GATEWAY_TOKEN>" http://localhost:3000/lock/status
```
**期望輸出：**
```json
{
  "resource_id": "line_bridge_lock",
  "current_owner": "train_worker",
  "fencing_token": 42,
  "expires_at": "2026-06-21T02:00:00.000Z",
  "is_expired": false
}
```

### 2. 判定故障類型
* **`is_expired` 為 true 且鎖無人持有**：鎖處於閒置狀態，控制器會自動拉起 Worker。
* **`is_expired` 為 false 且鎖由舊 Worker 持有，但該 Worker 進程已不存在**：此為孤兒行程（Orphan Process）。控制器在啟動時會調用 `clean_orphans()`，透過 CreationDate 比對自動清理，或運維人員可手動釋放鎖。
* **搶鎖或心跳回傳 `503 Service Unavailable`**：PostgreSQL 資料庫失聯。此時 `ALLOW_IN_MEMORY_FALLBACK=false` 鎖機制會拒絕服務，以防止腦裂。

---

## 🛠️ 故障處置標準作業程序 (SOP)

### SOP 1：手動強制重設/釋放鎖
若鎖被殭屍 Worker 佔用且需要立即手動釋放，可以使用重設 API：
```bash
curl -X POST \
     -H "x-internal-secret: <INTERNAL_GATEWAY_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"clearQueue": false}' \
     http://localhost:3000/internal/reset-lock
```
* **參數說明**：若將 `"clearQueue": true` 傳入，將同步清空 `line_message_queue` 訊息佇列。

### SOP 2：緊急人工煞車 (CANARY_STOP)
當發現模型訓練出現異常（例如 val_bpb 異常、記憶體洩漏、CPU 暴漲），可立即啟用手動停止閥凍結優化實驗：
1. 在控制器運行的環境變數中設定 `CANARY_STOP=true`。
2. 或在當前工作區對應的環境設定檔（如 `.env` 或 `.env.local`）中寫入：
   ```text
   CANARY_STOP=true
   ```
3. 控制器將在執行下一個優化步驟前自動讀取並進入暫停狀態。移除該環境變數或設為 `false` 即可恢復。

### SOP 3：PostgreSQL 資料庫斷開自癒
當 Prometheus 監控指標 `lock_heartbeat_failure_total` 觸發警報，且 DB 連線恢復後，Worker 會有 30 秒的自癒寬限期（Grace Period）自動呼叫 `/api/lock/verify` 校驗並重置心跳。若自癒失敗，Worker 將自動安全退出，SRE 僅需重新啟動控制器即可。
