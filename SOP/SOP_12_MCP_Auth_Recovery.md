---
title: "外部 MCP 服務認證修復標準作業程序"
version: "1.0.0"
tags: ["SOP", "MCP", "認證修復", "NotebookLM", "外部服務"]
dependencies: ["SOP_00_Skill_Lifecycle_Management.md", "SOP_05_System_Policies.md"]
---

# SOP_12 外部 MCP 服務認證修復 SOP (External MCP Auth Recovery)

> [!IMPORTANT]
> 本 SOP 適用於所有透過 Cookie/Session 認證的外部 MCP 服務（如 NotebookLM、Notion 等）。
> 當 MCP 工具回傳認證錯誤或 `auth_status: stale` 時，必須依本 SOP 執行，**不得跳過任何步驟**。

---

## 1. 觸發條件

- MCP `server_info` 回傳 `auth_status: stale | not_configured | error`
- 任何 MCP 工具回傳 `Authentication expired` 或類似訊息
- `nlm login --check` 顯示失敗

---

## 2. 診斷流程

### 步驟 2.1：確認伺服器狀態
```python
server_info()  # 查看 auth_status 欄位
```

| auth_status | 意義 | 對應動作 |
|-------------|------|---------|
| `stale` | 憑證已過期 | 執行第 3 節完整修復流程 |
| `not_configured` | 從未設定 | 執行第 3 節完整修復流程 |
| `unverified` | 網路問題 | 先確認網路，再重試 |
| `configured` | 正常 | 無需修復 |

---

## 3. NotebookLM MCP 認證修復標準流程

> [!CAUTION]
> **步驟順序絕對不可顛倒。** 若直接執行 `nlm login` 而未先完成步驟 3.1，Cookie 將無效，修復會失敗。

### 步驟 3.1：請使用者手動訪問 NotebookLM
1. 告知使用者：請開啟 Chrome，前往 `https://notebooklm.google.com`
2. 確認使用者看到**筆記本列表頁面**（不只是 Google 帳號選擇畫面）
3. 等待使用者回報「完成」

### 步驟 3.2：執行認證指令
```powershell
nlm login
```

### 步驟 3.3：判斷成功標準（關鍵！）

| 輸出訊息 | 代表 | 動作 |
|---------|------|------|
| `✓ Authentication valid! Notebooks found: N` | ✅ 成功 | 繼續步驟 3.4 |
| `✓ Successfully authenticated! Cookies: N extracted` | ❌ 失敗 | 重新從步驟 3.1 開始 |

### 步驟 3.4：更新 MCP 伺服器快取
```python
refresh_auth()  # 等待回傳 status: success
```

### 步驟 3.5：驗證修復完成
```python
notebook_list()  # 確認可正常列出筆記本
```

---

## 4. 根本原因說明

NotebookLM 需要特定的認證 Cookie（`OSID`、`__Secure-OSID`）才能通過 API 驗證。這些 Cookie 只有在 Chrome 瀏覽器**實際訪問** `notebooklm.google.com` 後才會存在。

若未先訪問 NotebookLM 頁面就執行 `nlm login`，工具只會提取 Google 帳號的通用 Cookie，缺少 NotebookLM 特定的憑證，導致 HTTP 302 重定向至登入頁面。

---

## 5. 常見錯誤速查

| 症狀 | 原因 | 解法 |
|------|------|------|
| `auth_status: stale`，`nlm login` 顯示「Cookie 提取成功」但仍失敗 | 未先訪問 NotebookLM | 重新執行步驟 3.1 |
| `refresh_auth` 回傳 `status: expired` | `nlm login` 未成功完成 | 重新從步驟 3.1 開始 |
| `notebook_list` 回傳認證錯誤 | MCP 快取未更新 | 等待 30 秒後再次呼叫 `refresh_auth` |
| Chrome 未彈出 | 瀏覽器衝突 | 手動關閉 Chrome 再執行 `nlm login` |

---

## 6. 相關設定檔位置

| 項目 | 路徑 |
|------|------|
| MCP 指示文件 | `C:\Users\HH.AI_260611\.gemini\antigravity-ide\mcp\notebooklm\instructions.md` |
| Antigravity Skill | `C:\Users\HH.AI_260611\.gemini\antigravity\skills\nlm-skill\` |
| Knowledge Item | `C:\Users\HH.AI_260611\.gemini\antigravity-ide\knowledge\notebooklm-auth-sop\` |
| 認證憑證儲存 | `C:\Users\HH.AI_260611\.notebooklm-mcp-cli\profiles\default\` |

---

*本 SOP 建立於 2026-06-13 | v1.0.0 | 基於實際修復案例（Conversation: da924ec9）建立*