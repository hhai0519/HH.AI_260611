# Legacy Script to MCP Server 遷移指南 (SOP)

## 1. 背景說明

在系統升級至 **Loki Swarm 架構** 且導入了 **Zero-Trust MCP Gateway** 之後，所有的外部工具操作都必須透過 Model Context Protocol (MCP) 標準協定來與大腦層溝通。過去散落於 `skills/03_Execution/` 下的獨立腳本（如 Python, Shell, JavaScript 檔案）已違反架構設計，被視為技術債而遭到移除。

為了保留這些強大的工具能力，本文件規範了將「舊有技能」重新包裝為「標準 MCP 伺服器」的標準作業程序 (SOP)。

## 2. 待遷移能力清單 (Technical Debt Backlog)

以下是被刪除但等待重構的 3 大核心能力：

1. **ui-prototype-builder (Claude Design HTML 原型)**
   - **原本用途**：高保真原型生成、互動 Demo、簡報與動畫匯出。
   - **未來 MCP 規劃**：設計一個專用的 `ui-prototype-mcp-server`。將原本的 `render-video.js` 和 `html2pptx.js` 等指令碼封裝為 JSON-RPC 方法 (Tools)。讓大腦層可以發送 `render_prototype` 或 `export_slide` 等請求。

2. **webapp-testing (Playwright 自動化測試)**
   - **原本用途**：前端功能驗證、UI 除錯、截圖及 Console Log 擷取。
   - **未來 MCP 規劃**：建置一個 Node.js 或 Python 的 `playwright-mcp-server`。暴露如 `navigate`, `click`, `take_screenshot`, `get_console_logs` 等標準 API 工具。這將能作為 Swarm 在 `Verify` 階段的強大武器。

3. **xlsx (Excel 處理引擎)**
   - **原本用途**：解析、修改與驗證 Office XML 結構。
   - **未來 MCP 規劃**：建立 `office-mcp-server`，專門處理 `.xlsx` 或 `.docx` 的複雜操作。這比直接讓 LLM 操作二進制檔案安全穩定得多。

## 3. 重構為 MCP Server 的標準步驟

當團隊決定重構上述任一能力時，請遵循以下步驟：

### Phase 1: 建立 MCP 骨架
- 在 `/mcp-servers/` (或對應的 MCP 目錄) 下建立新的 Node.js 或 Python 專案。
- 引入官方 `@modelcontextprotocol/sdk` 或 `mcp` SDK。
- 將過去分散的腳本邏輯封裝在內部 Controller 中。

### Phase 2: 定義 Tools Schema
- 將功能拆解為明確的 Tools，並在 Server 中詳細定義 Input JSON Schema。
- **注意**：務必設計安全邊界。例如：測試伺服器只能連線至本機開發埠，不能讀取 `/etc/passwd` 等。

### Phase 3: 註冊至 MCP Gateway
- 完成開發與測試後，將該伺服器的啟動指令註冊至 `mcp_config.json` 的白名單內。
- 使用 `mcp-gateway` 重新載入，確認 Swarm 網路可以探測到這些新工具。
