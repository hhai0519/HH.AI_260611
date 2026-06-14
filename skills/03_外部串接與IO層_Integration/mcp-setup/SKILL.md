---
name: mcp-setup
type: execution

version: "3.0.0"
type: "execution"
capabilities:
  tool_category: "MCP/Config"
  execution_env: "Node.js"
  io_format: "JSON"
---
<!-- v1.1.0 - Superpowers CSO format upgrade -->

# MCP 伺服器安裝與設定指南 (MCP Server Installation and Configuration Guide)

### 【摘要】觸發條件與 DLP 宣告
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議

本 skill 記錄了本機 本協作系統 AI 環境中，所有已安裝 MCP 伺服器的設定方式、安裝步驟與維護注意事項。

## 設定檔位置

```
<YOUR_APP_DATA_DIR>\本協作系統\mcp_config.json
```

---

## 現有 MCP 伺服器總覽

| 伺服器名稱 | 介面型別 | 工具數量 | 狀態 |
|---|---|---|---|
| `github-mcp-server` | Docker Container | 32 / 41（已停用 9 個）| ✅ 運作中 |
| `notebooklm` | Python Executable | 38 / 38 | ✅ 運作中 |
| `docker` | Docker MCP Gateway | 動態（依 Docker Desktop 設定） | ✅ 運作中 |
| `notion-mcp-server` | npx | 22 / 22 | ✅ 運作中 |

**⚠️ 注意：** 本協作系統 全域工具上限為 **100 個**。目前合計約 94 個工具。新增 MCP 前必須先確認是否有足夠空間。

---

## 完整 mcp_config.json 設定

```json
{
  "mcpServers": {
    "github-mcp-server": {
      "$typeName": "exa.cascade_plugins_pb.CascadePluginCommandTemplate",
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<SECRET_TOKEN>"
      },
      "disabledTools": [
        "assign_copilot_to_issue",
        "request_copilot_review",
        "get_team_members",
        "get_teams",
        "get_latest_release",
        "get_release_by_tag",
        "get_tag",
        "list_releases",
        "list_tags"
      ]
    },
    "notebooklm": {
      "command": "<YOUR_PYTHON_SCRIPTS_PATH>/notebooklm-mcp.exe",
      "args": []
    },
    "docker": {
      "command": "docker",
      "args": ["mcp", "gateway", "run"]
    },
    "notion-mcp-server": {
      "$typeName": "exa.cascade_plugins_pb.CascadePluginCommandTemplate",
      "command": "npx",
      "args": [
        "-y",
        "@notionhq/notion-mcp-server"
      ],
      "env": {
        "OPENAPI_MCP_HEADERS": "{\"Authorization\": \"Bearer <YOUR_NOTION_INTERNAL_TOKEN>\", \"Notion-Version\": \"2022-06-28\"}"
      }
    }
  }
}
```

---

## 各伺服器安裝說明

### 1. GitHub MCP Server

**官方映像檔：** `ghcr.io/github/github-mcp-server`

**前置需求：**
- Docker Desktop 已安裝並執行
- 已建立 GitHub Personal Access Token (PAT)

**建立 GitHub PAT 的步驟：**
1. 前往 GitHub → Settings → Developer Settings → Personal Access Tokens
2. 選擇 **Fine-grained tokens** 或 **Tokens (classic)**
3. 授予所需許可權（repo, issues, pull_requests 等）
4. 複製 Token 並貼入 `mcp_config.json` 的 `GITHUB_PERSONAL_ACCESS_TOKEN` 欄位

**mcp_config.json 設定片段：**
```json
"github-mcp-server": {
  "command": "docker",
  "args": ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", "ghcr.io/github/github-mcp-server"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "<SECRET_TOKEN>"
  }
}
```

**已停用工具（節省工具名額用）：**
- `assign_copilot_to_issue` - AI 指派類（AI 助理不需要呼叫另一個 AI）
- `request_copilot_review` - AI 審查類
- `get_team_members` - 組織管理類
- `get_teams` - 組織管理類
- `get_latest_release` - 版本發布類（人工操作更安全）
- `get_release_by_tag` - 版本發布類
- `get_tag` - 版本標籤類
- `list_releases` - 版本標籤類
- `list_tags` - 版本標籤類

若要重新啟用，只需從 `disabledTools` 陣列中移除對應的工具名稱即可。

---

### 2. NotebookLM MCP Server

**套件來源：** https://github.com/jacob-bd/notebooklm-mcp-cli

**安裝步驟：**

```powershell
# 1. 安裝 Python 套件（需先安裝 Python 3.x）
pip install notebooklm-mcp-cli

# 2. 登入 NotebookLM（會自動開啟瀏覽器）
nlm login

# 3. （選用）安裝 本協作系統 的 skill 整合
nlm skill install 本協作系統
```

**執行檔位置：**
```
<YOUR_PYTHON_SCRIPTS_PATH>\notebooklm-mcp.exe
```

**⚠️ 重要：** 設定中必須使用**絕對路徑**指向執行檔，因為 本協作系統 的執行環境 PATH 不一定包含 Python Scripts 資料夾。

**mcp_config.json 設定片段：**
```json
"notebooklm": {
  "command": "<YOUR_PYTHON_SCRIPTS_PATH>/notebooklm-mcp.exe",
  "args": []
}
```

**身份驗證注意事項：**
- 登入 session 約 20 分鐘後過期，需重新執行 `nlm login`
- 若 MCP 出現認證錯誤，先在 terminal 執行 `nlm login` 再重試

---

### 3. Docker MCP Gateway

**官方工具：** Docker Desktop 內建的 MCP Toolkit

**前置需求：**
- Docker Desktop 已安裝並執行（版本需支援 MCP Toolkit）

**安裝步驟：**

```powershell
# 1. 確認 docker mcp 指令是否可用
docker mcp --help

# 2. 將 Docker MCP Toolkit 連線至 Gemini（全域模式）
docker mcp client connect gemini --global

# 3. 確認連線狀態
docker mcp client ls --global
```

預期輸出：
```
=== System-wide MCP Configurations ===
 ● gemini: connected
   MCP_DOCKER: Docker MCP Catalog (gateway server) (stdio)
```

**mcp_config.json 設定片段：**
```json
"docker": {
  "command": "docker",
  "args": ["mcp", "gateway", "run"]
}
```

**在 Docker Desktop 中管理工具：**
1. 開啟 Docker Desktop
2. 找到 **MCP Toolkit** 設定（可能在 Settings > Beta / Extensions）
3. 在 **Catalog** 中選擇要啟用的 MCP 伺服器
4. 設定完成後，工具會透過 `docker mcp gateway run` 自動提供

**常用管理指令：**
```powershell
docker mcp server --help       # 管理已啟用的 MCP 伺服器
docker mcp tools ls            # 列出所有可用工具
docker mcp catalog --help      # 管理 MCP 型錄（Catalog）
docker mcp secret --help       # 管理 API 金鑰與金鑰
```

---

### 4. Notion MCP Server

**套件來源：** `@notionhq/notion-mcp-server`（官方 npm 套件）

**前置需求：**
- Node.js / npm 已安裝
- 已建立 Notion Integration Token

**建立 Notion Integration Token 的步驟：**
1. 前往 https://www.notion.so/my-integrations
2. 點選 **+ New integration**
3. 填入名稱（例如：AI Assistant）
4. 選擇要授權的 Workspace
5. 複製 **Internal Integration Token**（以 `ntn_` 或 `secret_` 開頭）
6. **重要：** 在 Notion 中，將你的頁面/資料庫分享給這個 Integration（Share > Invite > 選擇你的 Integration）

**mcp_config.json 設定片段：**
```json
"notion-mcp-server": {
  "command": "npx",
  "args": ["-y", "@notionhq/notion-mcp-server"],
  "env": {
    "OPENAPI_MCP_HEADERS": "{\"Authorization\": \"Bearer <你的 Notion Token>\", \"Notion-Version\": \"2022-06-28\"}"
  }
}
```

**⚠️ Token 格式注意：**
`OPENAPI_MCP_HEADERS` 的值是一個 JSON 字串，其中的雙引號需要被跳脫（`\"`），這是正常的格式。

---

## 工具數量管理

### 100 工具上限規則

本協作系統（Gemini 模型限制）最多同時支援 **100 個 MCP 工具**。超過時會收到錯誤：
```
Error: adding this instance with X enabled tools would exceed max limit of 100.
```

### 目前工具使用量

```
GitHub:      32 / 41 工具（已停用 9 個）
NotebookLM:  38 / 38 工具
Docker:      動態（視啟用的伺服器而定，基礎為 6 個管理工具）
Notion:      22 / 22 工具
─────────────────────────────────
合計約：     ~98 個工具
```

### 建議關閉的 GitHub 工具（已完成）

以下工具已透過 `disabledTools` 設定停用：

| 工具名稱 | 原因 |
|---|---|
| `assign_copilot_to_issue` | AI 已在協助，不需再呼叫另一個 AI |
| `request_copilot_review` | 同上 |
| `get_team_members` | 個人專案不常用 |
| `get_teams` | 個人專案不常用 |
| `get_latest_release` | 人工操作更安全 |
| `get_release_by_tag` | 同上 |
| `get_tag` | 同上 |
| `list_releases` | 同上 |
| `list_tags` | 同上 |

若需要新增更多 MCP 伺服器，可考慮再停用以下 GitHub 工具：
- `create_repository` - 建立新 Repo（人工操作更安全）
- `fork_repository` - Fork 操作
- `get_label` - 取得標籤
- `list_issue_types` - 列出 Issue 型別
- `sub_issue_write` - 建立子 Issue
- `update_pull_request_branch` - 更新 PR 分支
- `add_comment_to_pending_review` - 進階留言（有通用版本可替代）
- `add_reply_to_pull_request_comment` - 進階留言

---

## 常見問題排查

### GitHub MCP 無法連線
```
原因：Docker Desktop 未啟動，或 PAT 已過期
解決：
1. 確認 Docker Desktop 已開啟
2. 至 GitHub 確認 PAT 有效期（Settings > Developer Settings）
3. 若 PAT 過期，重新產生並更新 mcp_config.json
```

### NotebookLM MCP 無法啟動
```
原因：找不到執行檔，或 session 過期
解決：
1. 確認執行檔存在：
   ls "<YOUR_PYTHON_SCRIPTS_PATH>\notebooklm-mcp.exe"
2. 若不存在，重新安裝：pip install notebooklm-mcp-cli
3. 重新登入：nlm login
```

### Docker MCP Gateway 出現 OAuth 連線錯誤
```
Failed to connect to OAuth notifications: ... No connection could be made
原因：這是 Docker Desktop 背景服務的連線警告，不影響正常功能
解決：確認 Docker Desktop 主程式已開啟，此錯誤可安全忽略
```

### Notion MCP 超過 100 工具上限
```
Error: adding this instance with 22 enabled tools would exceed max limit of 100
原因：目前啟用的工具總數已達上限
解決：
1. 在 GitHub MCP 中停用更多不需要的工具（修改 disabledTools 陣列）
2. 重新載入設定（重啟 本協作系統）
```

### 所有 MCP 工具消失
```
原因：mcp_config.json 格式錯誤（JSON 語法問題）
解決：
1. 用 JSON 驗證工具確認格式：https://jsonlint.com
2. 常見問題：最後一個專案後面多了逗號、引號未跳脫
3. 參考上方「完整 mcp_config.json 設定」區段還原設定
```

---

## 新增 MCP 伺服器的流程

當需要新增新的 MCP 伺服器時，請依照以下步驟：

1. **確認工具空間**：計算目前工具總數 + 新 MCP 的工具數是否 ≤ 100
2. **找到正確的指令或套件**：確認官方檔案中的啟動方式（docker / npx / python 等）
3. **在 mcp_config.json 中新增設定**：參考上方各伺服器設定格式
4. **重新啟動 本協作系統**：讓新設定生效
5. **測試連線**：呼叫一個簡單的工具確認運作正常

**常見 MCP 指令格式：**

```json
// Docker Container 模式
"server-name": {
  "command": "docker",
  "args": ["run", "-i", "--rm", "docker-image-name"]
}

// npx 模式（nodejs 套件）
"server-name": {
  "command": "npx",
  "args": ["-y", "npm-package-name"],
  "env": { "API_KEY": "your-key" }
}

// Python 執行檔模式
"server-name": {
  "command": "C:/full/path/to/executable.exe",
  "args": []
}

// Docker MCP Gateway 模式（透過 Docker Desktop 管理）
"server-name": {
  "command": "docker",
  "args": ["mcp", "gateway", "run"]
}
```

---

## 版本紀錄 (Changelog)
- **[2.0.0]** 2026-05-04：V2.0.0 Polymorphic Labeling Migration — 依生命週期 SOP 匯入多型功能性技術標籤 (tool_category, execution_env, io_format)，建立執行層 Manifest 路由能力。

## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議


---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文件不再接收無結構的自然語言，必須處理封裝後的動態引數：
`[SYSTEM-CALL: mcp-setup | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

> [!IMPORTANT]
> **Payload 淨化規則 (§6.3)**：
> - 若本技能為 `Cognitive` 型：接收戰略目標、語氣設定、情緒變數；拒絕 SQL/DOM/技術指令。
> - 若本技能為 `Execution` 型：只接收 URL、DOM Selector、SQL、JSON Schema；拒絕認知引數。

傳送協定 (Zero-Block Policy)： 執行中若遇能力不足或需外部協作，嚴禁中斷或詢問使用者。必須主動封裝 Dynamic Payload 並發出：
`[SYSTEM-CALL: 目標ID | PAYLOAD: { ... }]` 調閱其他技能。

回傳協定： 任務終止時，必須且只能輸出 `[SYSTEM-RETURN: SUCCESS/FAILED | DATA: <結果>]`。

---
> [!WARNING]
> **全域鐵律：NotebookLM 研究遵從指示**
> 1. 當任務指示「透過 NotebookLM 進行研究/查詢」時，必須嚴格呼叫 `notebooklm` 相關 MCP 工具。
> 2. 若遇到無法連線、憑證過期 (`auth_status: stale` 或 `Authentication expired`) 等錯誤時，**絕對禁止**未經同意自行改用常規網路搜尋 (Web Search) 或其他工具替代。
> 3. 遇到錯誤時，請**立刻中斷動作並主動告知使用者**，請使用者協助登入或修復連線後，再繼續研究任務。
