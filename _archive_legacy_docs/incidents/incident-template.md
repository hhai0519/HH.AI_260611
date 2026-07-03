# 🔍 事故分析報告 (Incident Post-Mortem Template)

### 📌 事故基本資訊
* **事件時間**：YYYY-MM-DD HH:MM:SS
* **影響範圍**：(例如：第幾階段的 Canary 實驗中斷、鎖被無故搶佔、Worker 異常自毀等)
* **復原點與時間**：RTO = XX 分鐘，RPO = XX
* **Correlation ID**：`run_worker_xxxx_yyyy` (可用此 ID 還原 lock_audit_log 完整事件流)

### 🚨 事故時間線 (Timeline)
* **HH:MM:SS**：系統警報觸發 (Prometheus `/metrics` 偵測到 `worker_abort_total` 飆升)
* **HH:MM:SS**：SRE 介入，讀取 `/lock/status` 診斷端點確認鎖被搶佔，調用 `CANARY_STOP=true` 手動停止閥。
* **HH:MM:SS**：故障排除完成，移除停止閥，系統恢復正常。

### 🔍 根因分析 (Root Cause Analysis - 5 Whys)
1. 為什麼...？
2. 為什麼...？

### 🛠️ 改善措施與追蹤項目 (Action Items)
- [ ] **短期防線**：... (負責人：XX, 預計完成：MM/DD)
- [ ] **長期加固**：...
