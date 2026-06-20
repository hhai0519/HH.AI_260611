# Study Guide: LINE Messaging and Shopping API Development

這份學習指南綜合了有關 2022 年 LINE Flex Message 更新、HTTP 錯誤排除流程，以及 LINE SHOPPING API 與 Messaging API 的整合指引的技術文件。

---

## I. 关键概念

### 1. Flex Message 2022 功能更新
Flex Message 允許在 LINE 中製作高度自訂的版面配置。2022 年的更新帶來三項主要功能：

* **Video Component（影片元件）**：開發者現在可以在 Flex Message 的 Hero 區塊嵌入影片。
  * **需求**：必須提供影片 URL（HTTPS、TLS 1.2、.mp4、最大 200 MB）、預覽圖 URL（HTTPS、TLS 1.2、JPEG/PNG、最大 1 MB），以及 `altContent`（在不支援影片的客戶端使用的 Box 或 Image 元件）。
  * **限制**：僅支援於 Hero 區塊，且只適用於 bubble 大小 `kilo`、`mega`、`giga`，無法放入 Carousel 容器。
* **Box Component Sizing（盒子元件尺寸）**：新增 `maxWidth` 與 `maxHeight` 屬性，可用像素（px）或百分比（%）嚴格控制子元件大小。
* **Text Component Line Spacing（文字行間距）**：`lineSpacing` 屬性（以像素或小數表示），可解決特定語言（如泰文）因字形漂浮或下沉而產生的版面問題。

### 2. LINE SHOPPING API 整合禁令
為確保平台穩定，LINE SHOPPING API 嚴格規範以下事項：
* **載測試（Load Testing）**：禁止大量請求進行載測或營運測試，需使用獨立測試環境。
* **IP 限制**：客戶端伺服器不得根據 LINE SHOPPING API 的 IP 進行存取限制，因為 IP 會變動且未公開。
* **冗餘拉取**：禁止在未加過濾條件的情況下重複拉取訂單或商品清單，亦不可執行 "hard pull" 造成資料重疊。

### 3. API 錯誤處理與排除
* **400 Bad Request**：語法錯誤或超出提供者限制。檢查拼寫、空格、JSON 格式或請求標頭/參數是否正確。
* **409 Conflict**：請求與現有狀態衝突（例如已出貨的訂單再次標記為出貨）或使用已接受的 retry key 重複請求。
* **429 Too Many Requests**：超過頻率限制。
* **5xx Internal Error**：伺服器端失敗，重試可能最終成功。

### 4. Webhook 安全與可靠性
* **簽名驗證**：使用 `x-myshop-signature`（或 `x-line-signature`）配合 secret token，以 HMAC‑SHA256 計算請求 Body 雜湊，並比對 Base64 編碼的標頭值。
* **非同步處理**：建議將 webhook 事件以非同步方式處理，避免阻塞後續事件傳遞。
* **重試機制**：若客戶端未在 5 秒內回傳 200，LINE SHOPPING API 會在一小時內使用指數退避重試 webhook 共 9 次。

### 5. 進階重試機制（Messaging API）
`X-Line-Retry-Key`（十六進位 UUID）允許安全重試失敗的訊息請求。
* **機制**：若 LINE 平台接受請求，使用相同 key 再次重試會回傳 409，防止重複訊息送達。
* **有效期限**：retry key 於首次請求後 24 小時內有效。

---

## II. 簡答練習題

1. **Flex Message Video Component 可接受的最大檔案大小是多少？**
   - 200 MB。
2. **Video Component 必須放在哪個 Flex Message 區塊？**
   - Hero 區塊。
3. **若開發者在不支援的 API 上使用 retry key，會返回哪個 HTTP 狀態碼？**
   - 400 Bad Request。
4. **`X-Line-Retry-Key` 在首次請求後的有效期限是多久？**
   - 24 小時。
5. **驗證 LINE SHOPPING API webhook 簽名需使用哪種演算法？**
   - HMAC‑SHA256。
6. **如果買家未付款，訂單會在多久後自動變成 "EXPIRED" 狀態？**
   - 預設 3 天（視賣家設定而定）。
7. **為了讓 LINE 支援追蹤問題，必須在日誌中保存哪個標頭？**
   - `x-line-oap-request-id`。
8. **Flex Message Video Component 的必填屬性有哪些？**
   - `type`（video）、`url`、`previewUrl`、`altContent`。
9. **為什麼禁止根據 LINE SHOPPING API 的 IP 限制客戶端存取？**
   - 因為 IP 未公開且會變動，限制會導致不可預期的失敗。
10. **建議使用什麼方式控制 API 重試間隔？**
    - 指數退避（Exponential backoff）。

---

## III. 論文式問題（深入探索）

1. **說明 `X-Line-Retry-Key` 在訊息傳遞可靠性中的重要性，並與單純的 200 OK 回應作比較。**
   - 重點在於說明網路超時會造成訊息是否送達的不確定性，`retry key` 確保請求具備冪等性（只執行一次），而 200 OK 只能保證伺服器已接收請求，無法保證使用者實際看到訊息（例如被封鎖）。
2. **分析未驗證簽名處理 webhook 的安全風險，並提出完整的防護策略。**
   - 包含惡意 POST、未授權請求、IP 白名單無效等，建議使用 HMAC‑SHA256、嚴格比對簽名、忽略不符合的來源、使用速率限制與日誌追蹤。
3. **描述 LINE SHOPPING API 訂單生命周期，包括 `FINALIZED`、`PAID`、`SHIPPED_ALL` 等階段，並比較銀行轉帳與貨到付款的流程差異。**
   - 詳細說明訂單從建立、買家上傳匯款憑證、賣家確認、出貨、完成的每一步，以及 COD 僅在付款完成後直接進入待出貨階段。
4. **評估高流量整合時頻率限制的影響，說明開發者應如何設計系統以處理 `429 Too Many Requests` 同時保持資料完整性。**
   - 討論每個 channel 或 API 群組的限制、使用 `RateLimit-Remaining` 標頭、停頓請求直到配額重置、使用佇列與批次處理確保資料不遺失。

---

## IV. 重要詞彙表

| 詞彙 | 定義 |
| :--- | :--- |
| **altContent** | Flex Message Video 元件在不支援影片的客戶端所使用的 Box 或 Image 元件。 |
| **aspectRatio** | 顯示區域的寬高比例。對於 Flex Message 影片，高度不能超過寬度的 3 倍。 |
| **Exponential Backoff** | 一種重試策略，重試間隔時間逐次遞增，以降低伺服器負載。 |
| **HMAC‑SHA256** | 一種使用密鑰的雜湊訊息驗證碼（MAC）演算法，用於簽名驗證。 |
| **Idempotency** | 某些 API 請求可多次執行而不改變最終結果的特性。 |
| **LineSpacing** | Text 元件用於設定行間距的屬性，單位為像素。 |
| **onHandAmount** | 包含已保留或待出貨的商品庫存總量。 |
| **readyToShipAmount** | 客戶已完成付款且待出貨的商品數量。 |
| **Signature Validation** | 用於驗證 webhook 是否來自正式提供者（LINE）的安全流程。 |
| **x-line-oap-request-id** | 每個 API 請求的唯一識別碼，對於審計與問題排查至關重要。 |