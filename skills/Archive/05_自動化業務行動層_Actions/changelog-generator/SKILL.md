---
name: changelog-generator
type: execution
description: 透過分析提交歷史、對變更進行分類，並將技術性提交訊息轉換為清晰、對客戶友好的釋出說明，從 Git 提交紀錄自動生成面向使用者的版本日誌。
version: "3.0.0"
type: "execution"
capabilities:
  tool_category: "DevOps/CI"
  execution_env: "Git/Node.js"
  io_format: "Markdown"
  authorized_mcp_tools: ["Persona Knowledge MCP"]
---

# 版本日誌生成器 (Changelog Generator)

### 【摘要】觸發條件與 DLP 宣告
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議

本技能自動解析 git commit 歷史，將晦澀的技術提交訊息**轉化為使用者友好的版本釋出說明**，支援 Keep a Changelog 標準格式、Conventional Commits 規範，以及自定義分類策略。

---

## 🎯 觸發條件

- 需要產出新版本的 Release Notes
- 詢問「把這些 commit 整理成 changelog」
- 準備 GitHub Release / 產品公告
- 需要為非技術使用者說明本次更新內容

---

## 🛠️ 核心工作流程

### Step 1：提取 Commit 歷史

```bash
# 提取上一個 tag 到現在的所有 commit
git log v1.0.0..HEAD --pretty=format:"%h|%s|%an|%ad" --date=short

# 或提取最近 N 個 commit
git log -30 --pretty=format:"%h|%s|%an|%ad" --date=short
```

### Step 2：Commit 分類引擎

```python
import subprocess
import re
from collections import defaultdict

CATEGORIES = {
    "✨ 新功能": ["feat:", "feature:", "add:", "新增", "新功能"],
    "🐛 錯誤修復": ["fix:", "bugfix:", "hotfix:", "修復", "修正", "bug"],
    "⚡ 效能最佳化": ["perf:", "optimize:", "speed:", "效能", "最佳化"],
    "🔧 維護更新": ["chore:", "refactor:", "cleanup:", "重構"],
    "📚 檔案更新": ["docs:", "doc:", "檔案", "readme"],
    "🛡️ 安全更新": ["security:", "sec:", "auth:", "安全"],
    "💥 重大變更": ["BREAKING CHANGE", "breaking:", "major:"]
}

def categorize_commits(commits: list) -> dict:
    categorized = defaultdict(list)
    
    for commit in commits:
        hash_, msg, author, date = commit.split('|', 3)
        assigned = False
        
        for category, keywords in CATEGORIES.items():
            for kw in keywords:
                if kw.lower() in msg.lower():
                    categorized[category].append({
                        "hash": hash_,
                        "message": clean_commit_msg(msg, kw),
                        "author": author,
                        "date": date
                    })
                    assigned = True
                    break
            if assigned:
                break
        
        if not assigned:
            categorized["🔧 維護更新"].append({
                "hash": hash_, "message": msg, 
                "author": author, "date": date
            })
    
    return categorized

def clean_commit_msg(msg: str, prefix: str) -> str:
    """移除 conventional commit 字首，首字母大寫"""
    cleaned = re.sub(r'^(feat|fix|perf|chore|docs|security|refactor)\s*[:\(][^)]*\)?\s*', '', msg, flags=re.I)
    return cleaned.strip().capitalize() if cleaned.strip() else msg
```

### Step 3：技術語言 → 使用者語言 轉換

```python
# LLM 轉換 Prompt
HUMANIZE_PROMPT = """
你是一個技術作家。將以下技術 commit 訊息，改寫成使用者友好的說明。

規則：
1. 用「您」或「你」的角度描述使用者獲得的好處
2. 避免技術術語（如「重構」「refactor」「config」）
3. 每條控制在 50 字以內
4. 繁體中文

技術訊息：{commit_msg}
使用者友好版本：
"""

def humanize_commits(commits: list) -> list:
    return [llm_call(HUMANIZE_PROMPT.format(commit_msg=c['message'])) for c in commits]
```

### Step 4：生成標準 Changelog

```python
def generate_changelog(version: str, date: str, categorized: dict) -> str:
    lines = [
        f"# v{version} ({date})",
        "",
        "> 感謝您使用我們的產品！以下是本次更新的重要內容：",
        ""
    ]
    
    # 重大變更優先顯示
    priority_order = ["💥 重大變更", "✨ 新功能", "🐛 錯誤修復", 
                      "⚡ 效能最佳化", "🛡️ 安全更新", "📚 檔案更新", "🔧 維護更新"]
    
    for category in priority_order:
        if category in categorized and categorized[category]:
            lines.append(f"## {category}")
            for commit in categorized[category]:
                lines.append(f"- {commit['message']}")
            lines.append("")
    
    return '\n'.join(lines)
```

---

## 📄 標準輸出格式範例

```markdown
# v2.3.0 (2026-04-17)

> 感謝您使用我們的產品！以下是本次更新的重要內容：

## ✨ 新功能
- 新增技能儀錶板的黑暗模式切換功能
- 支援從 Google Drive 直接匯入研究檔案

## 🐛 錯誤修復
- 修復在 Windows 環境下中文字型無法正確顯示的問題
- 解決技能卡片在手機裝置上點選無效的問題

## ⚡ 效能最佳化
- 技能儀錶板載入速度提升 40%

## 🛡️ 安全更新
- 加強 API Token 的加密儲存機制
```

---

## 🔧 CLI 快速使用

```bash
# 從上個 TAG 到現在
python changelog_gen.py --from-tag v1.2.0 --version 1.3.0

# 最近 50 個 commits
python changelog_gen.py --count 50 --version 1.3.0

# 輸出到檔案
python changelog_gen.py --version 1.3.0 --output CHANGELOG.md
```

---

## 🤝 協同技能

- `handover-manual-skill`：版本交接檔案整合
- `notebooklm-mcp`：將 changelog 匯入知識庫存檔

---

## 版本紀錄 (Changelog)
- **[2.0.0]** 2026-05-04：V2.0.0 Polymorphic Labeling Migration — 依生命週期 SOP 匯入多型功能性技術標籤 (tool_category, execution_env, io_format)，建立執行層 Manifest 路由能力。

## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議


---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文件不再接收無結構的自然語言，必須處理封裝後的動態引數：
`[SYSTEM-CALL: changelog-generator | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

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
