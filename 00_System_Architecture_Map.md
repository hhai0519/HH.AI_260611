# 系統架構總覽 (System Architecture Map)

此文件為自動化工作站的「大腦地圖」，定義了所有 Skills 的相互呼叫關係與核心執行目的。為確保系統穩定與代理人邏輯清晰，所有技能均歸類於三大核心維度：調度與流程控制、認知與角色框架、執行與自動化工具。

## 系統拓樸圖 (System Topology)

```mermaid
graph TD
    %% 定義樣式
    classDef orchestrator fill:#f9d0c4,stroke:#333,stroke-width:2px;
    classDef cognitive fill:#c4e1f9,stroke:#333,stroke-width:2px;
    classDef execution fill:#d1f9c4,stroke:#333,stroke-width:2px;
    classDef system fill:#e2c4f9,stroke:#333,stroke-width:2px;

    %% 根節點
    Root((Master Menu)):::system
    
    %% 第一層次：調度中心 (Orchestrators)
    subgraph 01_Orchestrators [🧠 01_Orchestrators (調度與流程控制)]
        SysGov(sys-skill-governance)
        DevSOP(finance-twse-dev-sop)
        ResLoop(finance-quant-research-loop)
        SubCollab(sys-subagent-collaboration)
        AutoRes(sys-autoresearch)
    end
    
    %% 第二層次：認知大腦 (Cognitive Models)
    subgraph 02_Cognitive [👁️ 02_Cognitive (認知與角色框架)]
        Personas{Persona 系列\n(Musk, Jobs, etc.)}
        FinLogic(finance-twse-market-logic)
        ChipLogic(finance-chip-logic)
        TechAna(finance-tech-analyzer)
        SentScout(finance-sentiment-scout)
    end
    
    %% 第三層次：執行手腳 (Execution Scripts)
    subgraph 03_Execution [⚙️ 03_Execution (執行與自動化工具)]
        WebTest(tool-webapp-testing)
        D3Viz(tool-d3js-visualization)
        SysDebug(sys-debugging)
        MCPSetup(tool-mcp-setup)
        Postgres(tool-postgres)
        LangSmith(tool-langsmith-fetch)
    end

    %% 依賴與呼叫關係
    Root --> 01_Orchestrators
    
    SysGov -.監控與管理.-> 02_Cognitive
    SysGov -.監控與管理.-> 03_Execution
    
    DevSOP --> SubCollab
    DevSOP --> FinLogic
    DevSOP --> WebTest
    DevSOP --> D3Viz
    
    ResLoop --> TechAna
    ResLoop --> ChipLogic
    ResLoop --> Postgres
    
    AutoRes --> SubCollab
    AutoRes --> LangSmith
    
    %% 賦予顏色
    class SysGov,DevSOP,ResLoop,SubCollab,AutoRes orchestrator;
    class Personas,FinLogic,ChipLogic,TechAna,SentScout cognitive;
    class WebTest,D3Viz,SysDebug,MCPSetup,Postgres,LangSmith execution;
```

---

## 多維度檢索目錄 (Multi-dimensional Index)

### 🧠 01_Orchestrators (調度與流程控制)
負責分配任務、管理全域狀態與自動化迴圈的總控 SOP。

| 技能目錄 | 核心目的摘要 (存在意義與輸入/輸出) |
| :--- | :--- |
| **sys-skill-governance** | **生命週期管理**：審計與管理技能生態系統，輸入檢測目標，輸出治理建議。 |
| **sys-subagent-collaboration** | **任務隔離與派發**：執行多步驟任務，防止上下文汙染。輸入複雜任務，輸出子代理人執行結果。 |
| **sys-autoresearch** | **超參數優化**：微型 AI 模型的自動化優化代理人。輸入優化目標，輸出模型參數建議。 |
| **sys-recursive-research** | **遞迴研究框架**：通用自動化研究循環。輸入研究主題，輸出深度調研報告。 |
| **sys-optimization-status** | **優化狀態監控**：監控 TinyStories 資料的超參數實驗。輸入環境狀態，輸出進度與指標。 |
| **sys-quota-monitor** | **資源熔斷機制**：監控 API Quota 並實施 20% 熔斷防護。輸入用量資料，輸出許可或阻斷訊號。 |
| **finance-quant-research-loop** | **量化研究自動迴圈**：金融實驗與策略驗證。輸入市場假說，輸出策略回測結果與優化建議。 |
| **finance-twse-dev-sop** | **專案開發 SOP**：台股網站開發的標準作業程序，整合圖表實作與驗證。輸入開發需求，輸出合規的程式碼。 |
| **sys-handover-manual** | **知識移交**：標準化的專案上下文與知識轉移手冊。輸入系統現狀，輸出上下文快照。 |

### 👁️ 02_Cognitive (認知與角色框架)
負責特定領域分析、思維推論與角色扮演的認知引擎。

| 技能目錄 | 核心目的摘要 (存在意義與輸入/輸出) |
| :--- | :--- |
| **persona-*** (共 15 個) | **特定人物思維模型**：包含 Musk、Jobs、Feynman、Karpathy 等。輸入情境與問題，輸出該人物專屬框架的決策建議或文字風格。 |
| **finance-twse-market-logic** | **台股市場深度邏輯**：包含恐慌指數、分層確認等。輸入市場數據，輸出市場情緒與方向判斷。 |
| **finance-chip-logic** | **籌碼分析邏輯**：分析借券、融資與大戶動向。輸入籌碼數據，輸出籌碼衝突與動能分析。 |
| **finance-tech-analyzer** | **技術分析專家**：價格形態與量能結構分析。輸入 K 線與量價資料，輸出趨勢指標與反轉訊號。 |
| **finance-macro-linkage** | **跨市場相關性分析**：分析台美股 ADR 聯動。輸入總體經濟與板塊數據，輸出市場傳導路徑與影響預期。 |
| **finance-ownership-cluster** | **籌碼集中度分析**：機構持股與 CI_INDEX 解析。輸入股權分散資料，輸出集中度評估與籌碼穩固度。 |
| **finance-sentiment-scout** | **非結構化情緒分析**：新聞與論壇情緒解讀。輸入文本資料，輸出市場情緒分數與關鍵敘事。 |
| **sys-nuwa-skill-template** | **人物蒸餾引擎 (女媧)**：自動深度調研並提煉思維框架。輸入人名或主題，輸出可執行的角色技能。 |

### ⚙️ 03_Execution (執行與自動化工具)
負責具體程式碼運作、檔案操作、外部 API 串接或環境配置的實體技能。

| 技能目錄 | 核心目的摘要 (存在意義與輸入/輸出) |
| :--- | :--- |
| **sys-debugging** | **系統排錯專家**：解決 MCP、npm、設定檔語法等異常。輸入錯誤日誌，輸出修正方案或直接修復。 |
| **sys-skill-creator** | **技能建構指南**：建立高效技能的工作流指引。輸入功能需求，輸出符合規範的技能目錄與 SKILL.md。 |
| **tool-artifacts-builder** | **前端成品建構器**：使用 React/Tailwind/shadcn 建立 Web 成品。輸入 UI 需求，輸出可互動 HTML/React 程式碼。 |
| **tool-webapp-testing** | **Web 應用測試**：使用 Playwright 驗證本地前端。輸入測試路徑，輸出測試結果、螢幕截圖與錯誤日誌。 |
| **tool-playwright-automation**| **瀏覽器自動化**：編寫測試腳本、截圖與驗證。輸入自動化目標，輸出執行腳本與結果。 |
| **tool-d3js-visualization** | **資料視覺化實作**：使用 d3.js 建立 SVG/互動圖表。輸入圖表規格與資料，輸出圖表渲染邏輯代碼。 |
| **finance-pe-river-map** | **本益比河流圖工具**：視覺化長期投資評估。輸入財務數據，輸出 PE Band 視覺圖表。 |
| **tool-notebooklm-mcp** | **NotebookLM 串接**：操作 Google NotebookLM 生成內容或摘要。輸入文檔或查詢，輸出 AI 生成報告與快閃卡。 |
| **tool-mcp-builder** | **MCP 開發指南**：建立高品質 MCP 伺服器的標準。輸入工具設計理念，輸出 MCP 伺服器程式碼架構。 |
| **tool-mcp-setup** | **MCP 環境配置**：在本地環境設定或排錯 MCP 伺服器。輸入配置參數或錯誤，輸出修正後的 `mcp_config.json`。 |
| **tool-gemma-4-api** | **Gemma API 串接**：Google AI Studio API 的 SOP。輸入 API 調用需求，輸出符合限流與思考模式的代碼配置。 |
| **tool-langsmith-fetch** | **LangSmith 追蹤**：抓取執行追蹤以偵錯代理人。輸入執行 ID 或時間，輸出追蹤日誌分析。 |
| **tool-postgres** | **資料庫查詢**：安全執行唯讀 SQL 查詢。輸入探索需求，輸出資料庫結構或查詢結果。 |
| **tool-csv-data-summarizer**| **CSV 分析器**：使用 pandas 分析資料與繪圖。輸入 CSV 路徑，輸出統計摘要與圖表。 |
| **tool-xlsx** | **Excel 處理**：讀寫與格式化試算表。輸入 Excel 檔案，輸出修改後的檔案或分析數據。 |
| **tool-pdf** | **PDF 操作**：提取、合併、加密與 OCR。輸入 PDF 檔案，輸出處理後的檔案或提取文字。 |
| **tool-image-enhancer** | **圖像畫質提升**：優化截圖與簡報圖像。輸入原始圖像，輸出銳化與高解析度圖像。 |
| **tool-canvas-design** | **視覺藝術生成**：建立靜態海報或設計圖。輸入設計理念，輸出 PDF/PNG 視覺作品。 |
| **tool-theme-factory** | **主題工廠**：為成品設定視覺風格與色彩。輸入成品與風格偏好，輸出配置好的設計主題。 |
| **tool-changelog-generator**| **發佈日誌生成**：分析 Git 提交生成客戶端 Release Notes。輸入 Commit 紀錄，輸出結構化發佈說明。 |
| **tool-connect-apps** | **外部應用整合**：連接 Gmail, Slack, GitHub。輸入發送或發布需求，輸出外部服務操作結果。 |
