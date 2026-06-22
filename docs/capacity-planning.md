# 📊 分散式鎖與心跳容量規劃 (Capacity Planning)

為避免擴容時數據庫與 Bridge 發生過載，以下為實體資源與併發規模規劃基準：

| 併發規模 (Workers) | DB 連線數需求 (Connections) | 心跳吞吐量 (Requests/Min) | 預估鎖延遲 P99 (Latency) | 系統瓶頸與資源建議 |
|---|---|---|---|---|
| **1 Worker (Canary)** | 2 | 5 | < 5ms | CPU/IO 負載微小；1vCPU 1GB 記憶體足矣。 |
| **5 Workers** | 8 | 25 | < 8ms | 心跳抖動 (Jitter) 可保證請求分散；無鎖競爭延遲。 |
| **20 Workers** | 25 | 100 | < 15ms | 建議 DB 連線池上限設為 50；Bridge CPU 負載約 5%。 |
| **50 Workers (Canary)**| 60 | 250 | < 25ms | 開始觸發併發 acquire 競爭，鎖排隊延遲上升；建議 Bridge 升級為 2vCPU。 |
| **100 Workers (Prod)** | 120 | 500 | < 45ms | DB 核心效能關鍵點。Audit Log 每週產生 7 萬行，保留政策 (Retention) 必須啟用。 |
