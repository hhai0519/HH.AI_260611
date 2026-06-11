# System Post-mortem Report — V2.0.0 Governance Upgrade

> [!NOTE]
> **文件等級：** 系統最高治理記錄 | **建立時間：** 2026-05-04T00:55Z | **作者：** 本協作系統 / Chief Architecture System  
> **影響範圍：** `skills/02_Cognitive/` (22 skills) + `skills/03_Execution/` (21 skills) + `Data/00_Skill_Manifest.json`

---

## [里程碑] 動態調度驗證 (Dynamic Dispatch Milestone)

**成就摘要：** 成功為 22 個 Cognitive 技能注入三維認知能力矩陣，並為 21 個 Execution 技能注入多態功能性技術標籤，完成 Manifest 全域同步，使 Recipe Mixer 具備覆蓋全域技能的高精度路由能力。

### 能力矩陣注入範例 — Cognitive Tier (`persona-elon-musk`)

```yaml
name: elon-musk-perspective
type: skill
version: "2.0.0"
capabilities:
  logic_depth: "第一性原理與物理學視角"
  strategic_focus: "垂直整合與成本極限"
  interaction_style: "激進且不留情面"
```

### 多態標籤注入範例 — Execution Tier (`tool-postgres`)

```yaml
name: postgres
type: execution
version: "2.0.0"
capabilities:
  tool_category: "Database"
  execution_env: "Python/PostgreSQL"
  io_format: "JSON/CSV"
```

### 標準 SYSTEM-CALL 通訊協定範例

```text
[SYSTEM-CALL: persona-elon-musk | PAYLOAD: {
  "objective": "Deconstruct cloud infrastructure costs using first principles",
  "target_audience": "Lead Engineers",
  "strategic_constraints": "No generic best practices; focus on compute economics and vertical integration",
  "tone_variables": "Aggressive, impatient, physics-oriented"
}]
```

**驗證結果：** ✅ Payload 成功封裝 → Persona 正確解析 `objective`、`strategic_constraints`、`tone_variables` 並輸出符合人物設定的回應。

---

## [Root Cause & Fix] BOM 編碼污染事件

### 事件時間線

| 時間 | 事件 |
|---|---|
| T+00 | 首批 YAML 修復腳本執行，未清除 BOM |
| T+01 | 發現雙重 YAML header 疊加症狀 |
| T+02 | 診斷確認污染字元為 `U+FEFF` |
| T+03 | 撰寫 `scratch_fix_4.js` 攜帶精準 BOM 清洗邏輯，完成修復 |

### Root Cause 技術特徵

| 特徵 | 值 |
|---|---|
| 污染字元 Unicode | `U+FEFF` |
| JavaScript 表示 | `\uFEFF` |
| Hex 表示 | `EF BB BF` |
| 出現位置 | 檔案絕對起始字元 (offset 0) |
| 污染來源 | Windows 記事本 / 部分 VS Code 擴充套件的 UTF-8 BOM 寫入行為 |

### 修復正則表達式（Node.js，可重現）

> [!IMPORTANT]
> 以下為 **SOP 標準化正則**，嚴格按 Regex Hardening 規範，禁止使用 `g` flag 與 `\s+`。

```javascript
// [BOM 剝離標準作業 - 適用於任何 .md / .yaml 檔案寫入流程]
// SOP 標準 Regex: /^\uFEFF+/ — 僅精準消除檔案最前端 BOM，不影響內容主體

// Step 1: 讀取原始內容
let content = fs.readFileSync(filePath, 'utf8');

// Step 2: 剝離 BOM（標準 SOP Regex，禁止替換為 /g 配合 \s+）
content = content.replace(/^\uFEFF+/, '');

// Step 3: 以 UTF-8 (無 BOM) 格式覆寫存檔
fs.writeFileSync(filePath, content, 'utf8');
```

> [!CAUTION]
> Node.js `fs.writeFileSync(path, data, 'utf8')` 本身不主動寫入 BOM，但若原始字串開頭已含 `\uFEFF`（從舊檔讀入帶入），將被原樣寫回。**必須在 writeFileSync 之前執行 replace 步驟。**

---

## [架構決策] 多態標籤分流 (Polymorphic Labeling)

### 決策背景（廢除豁免概念）

原草稿採用「Execution 層豁免」，即 Execution 技能 `capabilities = {}`。  
此方案已被否決，理由：**缺乏 Meta 資訊將產生管理死角**，使 Manifest 索引無法對執行層工具進行功能性路由查詢。

### 最終強型別分流決策樹

```
IF (Skill.type IN ["cognitive", "orchestrator"]) {
    // 認知矩陣標籤 — 描述思維風格與分析深度
    Enforce_Capabilities = {
        logic_depth:       REQUIRED,  // 邏輯切入維度
        strategic_focus:   REQUIRED,  // 策略聚焦點
        interaction_style: REQUIRED   // 表達互動風格
    };
    ASSERT ALL fields != "";
}

ELSE IF (Skill.type == "execution") {
    // 多態功能性技術標籤 — 描述工具的技術屬性
    Enforce_Capabilities = {
        tool_category: REQUIRED,  // 工具類別 (DB, Scraper, AI/LLM 等)
        execution_env: REQUIRED,  // 執行環境 (Node.js, Python, Browser 等)
        io_format:     REQUIRED   // 輸入輸出格式 (JSON, PDF, Stream 等)
    };
    ASSERT ALL fields != "";
}
```

### 多態標籤全域對照表 (21 個執行層技能)

| 技能 ID | tool_category | execution_env | io_format |
|---|---|---|---|
| finance-pe-river-map | Finance Visualization | Browser/D3.js | SVG/JSON |
| sys-debugging | System Diagnostics | Multi-env | Log/Text |
| sys-skill-creator | Skill Generation | Agent Native | Markdown |
| tool-artifacts-builder | UI Builder | Browser/React | HTML/JSX |
| tool-canvas-design | Visual Design | Python/PIL | PNG/PDF |
| tool-changelog-generator | DevOps/CI | Git/Node.js | Markdown |
| tool-connect-apps | API Integration | HTTP/REST | JSON/Stream |
| tool-csv-data-summarizer | Data Analysis | Python/Pandas | CSV/PNG |
| tool-d3js-visualization | Data Visualization | Browser/D3.js | SVG/HTML |
| tool-gemma-4-api | AI/LLM | Python/REST | JSON/Stream |
| tool-image-enhancer | Image Processing | Python/PIL | PNG/JPEG |
| tool-langsmith-fetch | AI Debugging | Python/CLI | JSON/Log |
| tool-mcp-builder | MCP/Protocol | Node.js/TypeScript | JSON/SSE |
| tool-mcp-setup | MCP/Config | Node.js | JSON |
| tool-notebooklm-mcp | AI Research | Browser/MCP | JSON/Markdown |
| tool-pdf | Document Processing | Python/PyPDF | PDF/Text |
| tool-playwright-automation | Browser Automation | Node.js/Playwright | HTML/PNG/JSON |
| tool-postgres | Database | Python/PostgreSQL | JSON/CSV |
| tool-theme-factory | UI Design | Browser/CSS | CSS/HTML |
| tool-webapp-testing | Testing | Node.js/Playwright | HTML/Screenshot |
| tool-xlsx | Spreadsheet | Python/openpyxl | XLSX/CSV |

---

## 版本紀錄
- **[2.0.0 Post-mortem]** 2026-05-04：完成 V2.0.0 升級事後報告，記錄 BOM 污染根因與修復 Regex、多態標籤分流架構決策、21 個執行層技能的 Polymorphic Labeling Migration 執行記錄，以及 Manifest 全域索引同步結果。
