---
name: mcp-builder
type: execution
description: 建立高品質 MCP (Model Context Protocol) 伺服器的指南，使 LLM 能夠透過設計良好的工具與外部服務進行互動。
version: "3.0.0"
capabilities:
  tool_category: "MCP/Protocol"
  execution_env: "Node.js/TypeScript"
  io_format: "JSON/SSE"
---

# MCP 伺服器建構 (MCP Builder)

本技能是建立高品質 **MCP（Model Context Protocol）伺服器**的完整指南，讓 本協作系統 Agent 能夠透過自訂工具與任何外部系統互動。

---

## 🎯 觸發條件

- 需要讓 Agent 操作目前尚未整合的外部 API
- 需要建立自訂 MCP Server（Python FastMCP 或 Node.js SDK）
- 系統提示提到「建立 MCP」「自訂工具」「擴充 Agent 能力」

---

## 🏗️ MCP 架構概念

```
[本協作系統 Agent] ←→ [MCP Protocol] ←→ [MCP Server] ←→ [External API/Service]
```

MCP Server 定義一組「工具（Tools）」，每個工具有：
- **名稱**：Agent 呼叫時使用的 ID
- **描述**：Agent 判斷何時使用的說明
- **輸入 Schema**：JSON Schema 定義的參數格式
- **執行邏輯**：實際調用外部 API 的程式碼

---

## 📋 Python FastMCP 建構範例

```python
from fastmcp import FastMCP
import requests

mcp = FastMCP("my-custom-server")

@mcp.tool()
def get_stock_price(symbol: str, market: str = "TWSE") -> dict:
    """
    取得股票即時價格。
    
    Args:
        symbol: 股票代號（如 2330）
        market: 市場代碼（TWSE 或 OTC）
    
    Returns:
        包含 price、volume、change 的字典
    """
    resp = requests.get(f"https://api.example.com/stock/{symbol}")
    return resp.json()

if __name__ == "__main__":
    mcp.run()
```

---

## 📋 Node.js MCP SDK 範例

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({ name: "my-server", version: "1.0.0" });

server.setRequestHandler("tools/list", async () => ({
  tools: [{
    name: "send_notification",
    description: "發送通知到指定渠道",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "通知內容" },
        channel: { type: "string", enum: ["slack", "email"] }
      },
      required: ["message", "channel"]
    }
  }]
}));
```

---

## ⚙️ 在 mcp_config.json 中登記

```json
"my-custom-server": {
  "command": "python",
  "args": ["C:/path/to/my_server.py"],
  "env": { "API_KEY": "your-api-key" }
}
```

> [!WARNING]
> 新增 MCP Server 前，務必計算總工具數量是否超過 100 個上限（參考 `mcp-setup-skill`）。

---

## 🤝 協同技能

- `mcp-setup-skill`：工具上限管理與已有 MCP 設定
- `skill-creator`：將 MCP 能力封裝為新技能
- `connect-apps`：整合現有第三方服務

---

## 版本紀錄 (Changelog)
- **[2.0.0]** 2026-05-04：V2.0.0 Polymorphic Labeling Migration — 依生命週期 SOP 導入多態功能性技術標籤 (tool_category, execution_env, io_format)，建立執行層 Manifest 路由能力。

## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議
