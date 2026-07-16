# 代理人反思長期記憶庫 (Agent Long-Term Memory / AGENTS.md)

> 此檔案由 `reflection-module` 自動維護，作為系統的分層式長期記憶庫 (Tiered Memory System)。在制定計畫 (Planning Mode) 前，代理人**必須**優先讀取此檔，從歷史教訓中進行前瞻性預判 (Prospective Reflection)，避免重蹈覆轍。

---

## 1. 架構與慣例 (Patterns & Conventions)
> 高層次專案架構、常用依賴與框架準則。

- *尚未有紀錄。由後續任務累積。*

## 2. 歷史教訓與陷阱 (Gotchas)
> 容易踩雷的邊界條件、工具限制或過去發生過的重大失誤。

- **MCP 認證失效預備 (2026-05-04)**：未來調用依賴外部認證的 MCP（如 NotebookLM）前，應先預設「認證可能過期」的處理邏輯，確保流程不中斷。若發生認證失效，能迅速切換回 fallback 方案（如搜尋引擎）是正確的架構設計。
- **SOP 檔案亂碼與轉義崩潰 (2026-05-05)**：在腳本（如 Node.js）中處理大量多行字串時，若未妥善處理字串轉義 (Escaping)，極易導致程式碼崩潰或產生 BOM/亂碼污染。未來在自動化寫入大篇幅文件時，應優先採用 PowerShell 的單引號 Here-String (`@' ... '@`)，藉由其不解析變數與跳脫字元的特性，徹底免疫轉義錯誤。遭遇嚴重資料損毀時，則可借助 NotebookLM 進行語意還原。
- **Telegram CDP 轉 Zero-Delay 遷移與 PM2 衝突 (2026-07-17)**：在多平台機器人（如 LINE 和 TG）運行時，必須為每個 App 設置獨立且物理隔離的連接埠（例如 LINE 3000、TG 3001），且多進程絕不能共享相同的 Telegram Bot Token 進行 `getUpdates`，否則會觸發 409 衝突。開機自啟動與 PM2 dump 應在修改時使用 `pm2 delete` 徹底清理並重寫。
- **PowerShell `param()` 語句優先順序與編碼限制 (2026-07-17)**：PowerShell 腳本中的 `param()` 聲明必須是第一個執行語句（除了註解外），任何在其之前的變數宣告（如 `$OutputEncoding`）皆會導致編譯錯誤。PowerShell 腳本內容應盡量英文化，防止中文字元在 Windows CP950/ANSI 環境下解碼錯誤產生非法運算子字元（如 `[`）。
## 3. 風格與偏好 (Style / Preferences)
> 程式碼風格、日誌格式或執行偏好。

- *尚未有紀錄。由後續任務累積。*

## 4. 近期反思日誌 (Recent Learnings)
> 依時間序排列的短期重點反思（由 5-Step Reflexion Loop 產生）。

### [2026-07-17] Telegram 舊版 CDP 刪除與 Zero-Delay 升級反思
- **任務上下文**：升級 Telegram 監聽核心並完全移除舊 CDP App 及其關聯 PM2 進程。
- **Sweet (優點)**：成功修正 PS1 中的 param 宣告語法優先級，並在 Translations/Manifest 中對齊全部技能白名單，完成 100% 合規清理。
- **Sour (缺點)**：前期忽略了 PM2 開機自啟動與 dump 狀態覆寫的冗餘，以及 PowerShell `param()` 語句前的變數宣告會導致解析崩潰。PowerShell 中文字元亦容易引發 CP950/ANSI 解碼解析為非法 `MissingArrayIndexExpression` 語法錯誤。
- **Refinement (修正)**：將「PS1 的 param() 必須置於任何執行語句之前」及「PowerShell 腳本控制台日誌英文化」列為寫入守則。

### [2026-05-05] SOP 檔案亂碼與重建災難反思
- **任務上下文**：V3.1.3 系統總管接手，回顧並總結「SOP 檔案亂碼與 Node.js 字串轉義崩潰」的災難復原經驗。
- **Sweet (優點)**：果斷且成功地運用 NotebookLM 的語意還原能力，完美挽救並重建了被污染的文件，確保系統知識庫無損遷移。
- **Sour (缺點)**：前期編寫自動化寫入腳本時，低估了 Node.js 處理多層次跳脫字元的風險，導致嚴重的 BOM 污染與系統崩潰。
- **Refinement (修正)**：將「強制使用 PowerShell 單引號 Here-String (`@' ... '@`)」立為最高安全寫入標準，徹底阻絕語法注入與轉義風險；此教訓已永久寫入 Gotchas 免疫庫。

### [2026-05-04] 初始化反思記憶庫
- **任務上下文**：實作反思模組 (Reflection Module) 架構。
- **Sweet (優點)**：成功透過網路搜尋架構了基於 Reflexion 的模組，並將 SOP 流程明確定義。
- **Sour (缺點)**：缺乏自動預判 NotebookLM 認證過期的機制。
- **Refinement (修正)**：將此經驗提煉至 Gotchas 區塊，作為未來的防禦性設計守則。
