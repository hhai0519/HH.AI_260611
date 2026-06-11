---
name: skill-creator
type: execution
description: 建立高效技能的指南。當使用者想要建立新技能（或更新現有技能），以專業知識、工作流或工具整合來擴充 Claude 的能力時，應使用此技能。
version: "3.0.0"
type: "execution"
capabilities:
  tool_category: "Skill Generation"
  execution_env: "Agent Native"
  io_format: "Markdown"
---

# 技能設計大師 (Skill Creator)

### 【摘要】觸發條件與 DLP 聲明
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議

本技能是 本協作系統 生態系統的**核心建構標準**，定義如何設計、分類、登記並維護所有技能（Skills）。任何新技能的建立或既有技能的重大更新，都必須依照本文件的規範執行。

---

## 📐 技能設計原則

1. **單一職責 (Single Responsibility)**：每個技能只解決一類問題，不要把多個功能塞進同一個技能。
2. **可觸發性 (Triggerable)**：技能的觸發條件必須清晰，讓 Agent 在正確時機自動調用。
3. **有邊界 (Bounded)**：技能應明確說明「適用範圍」與「不適用範圍」，避免濫用。
4. **不刪除原則 (No-Delete Policy)**：**嚴禁**移除任何現有技能，如需調整應透過分類重組或合併，並保留原卡片。

---

## 🗂️ 六大分類體系（強制遵守）

所有技能**必須**歸屬於以下六個分類之一。分類決定了技能在儀錶板與 `skill_translations.json` 中的位置：

| 分類 ID | 分類名稱 | 適用技能類型 |
|---|---|---|
| `domain` | 📈 領域專業 (Domain & Trading) | 臺股分析、量化研究、市場邏輯、特定金融工具 |
| `tools` | 📊 通用工具 (General Tools) | Excel/CSV/PDF/SQL 等通用檔案與資料處理工具 |
| `mindset` | 💪 大師思維 (Mindset & Models) | 特定人物、思想家、決策框架的視角技能 |
| `governance` | 🏗️ 架構與治理 (Architecture & Governance) | SOP、系統維護、Agent 核心、MCP 管理、除錯 |
| `ux` | 🎨 開發與體驗 (Development & UX) | 前端設計、視覺化、UI 原型、畫布工具 |
| `automation` | 🔗 整合與自動化 (Integration & Automation) | 第三方 API 串接、自動化流程、測試、CI/CD |

### 🚨 分類邊界規則（常見錯誤防範）

> [!WARNING]
> 以下是歷史上曾發生的**分類錯置**，必須嚴格避免：

- ❌ `xlsx`、`csv-data-summarizer`、`pdf` → 不屬於 `domain`（金融），應歸 `tools`
- ❌ `munger-perspective` 等人物視角 → 不屬於 `domain`，應歸 `mindset`
- ❌ `twse-dev-sop-skill`（開發 SOP）→ 不屬於 `development`，應歸 `governance`
- ❌ `image-enhancer`、`d3js-visualization` → 不屬於純 `development`，應歸 `ux`
- ❌ `mcp-setup-skill`（MCP 伺服器管理）→ 不屬於 `ux`，應歸 `governance`

---

## 📝 SKILL.md 標準結構

每個技能的 `SKILL.md` 必須包含以下區塊：

```markdown
---
name: skill-name
description: 一句話描述，包含觸發條件。
version: "1.0.0"
---

# 技能中文名稱 (English Name)

## 功能概述
說明這個技能的核心能力與解決的問題。

## 觸發條件
列出哪些使用者語境、關鍵字或場景會啟動本技能。

## 執行流程
1. Step 1
2. Step 2
3. Step 3

## 邊界說明
- ✅ 適用：...
- ❌ 不適用：...

## 協同技能
與哪些其他技能搭配效果最佳。



```

---

## 📋 新技能上線 SOP（標準作業程式）

### Step 1：建立技能目錄與 SKILL.md
```powershell
# 在技能根目錄下建立新資料夾
mkdir "<USER_HOME>\.gemini\本協作系統\skills\<new-skill-name>"

# 建立 SKILL.md
New-Item "<USER_HOME>\.gemini\本協作系統\skills\<new-skill-name>\SKILL.md"
```

### Step 2：依照標準結構撰寫 SKILL.md
依照上方「SKILL.md 標準結構」填寫完整內容，注意：
- **每個技能只能有一行 DLP 宣告**，禁止重複堆疊
- `description` 欄位需包含觸發關鍵字
- **🚫 禁止建立 SKILL_TW.md**：舊版曾要求「雙語同步」，此規則已於 2026-04-17 廢除。SKILL_TW.md 已導致 DLP 洪水事故，永久棄用。SKILL.md 是唯一真相來源。

### Step 3：在 `skill_translations.json` 中登記

```json
"<skill-id>": [
    "<cluster-id>",
    "<中文顯示名稱>",
    "<副標題>",
    "<完整功能描述（用於儀錶板卡片）>"
]
```

同時在 `synergy` 區塊中定義協同技能：
```json
"<skill-id>": ["related-skill-1", "related-skill-2"]
```

### Step 4：執行儀錶板同步
```powershell
node "<USER_HOME>\Desktop\AI Test_260413\AI Test_260406\.agent\scripts\refresh_skills.js"
```

### Step 5：驗證
確認 `skills_categorization_report.md` 中的新技能顯示 `[✅ DLP]`，且分類正確。

---

## 🔄 既有技能更新 SOP

> [!IMPORTANT]
> **禁止透過 DLP 修復腳本批量覆蓋技能內容。** 過去曾發生腳本將整個 SKILL.md 替換為重複 DLP 行的災難性錯誤。

1. **直接編輯** 目標 SKILL.md，保留所有原有內容
2. 確認 DLP 區塊**只出現一次**（位於文件末尾的 `[Security]` 區段）
3. 如需更新分類，修改 `skill_translations.json` 中的對應條目
4. 執行 `refresh_skills.js` 同步

---

## 🧩 協同矩陣設計原則

在 `synergy` 中登記協同關係時，應考慮：
- **功能互補**：兩個技能組合能解決單一技能無法解決的問題
- **工作流串接**：一個技能的輸出能成為另一個技能的輸入
- **最大 4 個協同**：避免協同關係過於泛化

---

## 版本紀錄 (Changelog)
- **[2.0.0]** 2026-05-04：V2.0.0 Polymorphic Labeling Migration — 依生命週期 SOP 導入多態功能性技術標籤 (tool_category, execution_env, io_format)，建立執行層 Manifest 路由能力。

## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議


---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文檔不再接收無結構的自然語言，必須處理封裝後的動態參數：
`[SYSTEM-CALL: skill-creator | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

> [!IMPORTANT]
> **Payload 淨化規則 (§6.3)**：
> - 若本技能為 `Cognitive` 型：接收戰略目標、語氣設定、情緒變數；拒絕 SQL/DOM/技術指令。
> - 若本技能為 `Execution` 型：只接收 URL、DOM Selector、SQL、JSON Schema；拒絕認知參數。

發送協定 (Zero-Block Policy)： 執行中若遇能力不足或需外部協作，嚴禁中斷或詢問使用者。必須主動封裝 Dynamic Payload 並發出：
`[SYSTEM-CALL: 目標ID | PAYLOAD: { ... }]` 調閱其他技能。

回傳協定： 任務終止時，必須且只能輸出 `[SYSTEM-RETURN: SUCCESS/FAILED | DATA: <結果>]`。
