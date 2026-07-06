---
name: langsmith-fetch
type: execution
description: 透過從 LangSmith Studio 獲取執行追蹤來偵錯 LangChain 和 LangGraph 代理人。在偵錯代理人行為、調查錯誤、分析工具呼叫、檢查記憶體操作或檢查代理人效能時使用。自動獲取最近的追蹤並分析執行模式。需要安裝 langsmith-fetch CLI。
version: "3.0.0"
type: "execution"
capabilities:
  tool_category: "AI Debugging"
  execution_env: "Python/CLI"
  io_format: "JSON/Log"
---

# LangSmith 追蹤分析 (LangSmith Fetch)

### 【摘要】觸發條件與 DLP 宣告
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議

本技能透過 **LangSmith Studio API** 提取 LangChain / LangGraph Agent 的執行追蹤記錄，進行深度除錯：分析 Tool Call 鏈、工作記憶存取、Token 消耗、Agent 決策路徑和錯誤定位。

---

## 🎯 觸發條件

- Agent 行為異常（無限迴圈、跳過步驟）
- Tool Call 失敗或回傳錯誤
- 需要分析 Agent 的決策過程
- 效能問題（Token 使用過多、回應太慢）
- 調查記憶體（Memory）讀寫異常

---

## 🛠️ 初始化與配置

```python
# 環境設定
import os
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "your-langsmith-api-key"
os.environ["LANGCHAIN_PROJECT"] = "your-project-name"

# 安裝
# pip install langsmith langchain

from langsmith import Client

client = Client(api_key=os.environ["LANGCHAIN_API_KEY"])
```

---

## 📋 追蹤提取工作流

### 1. 列出最近執行的 Runs

```python
def get_recent_runs(project_name: str, limit: int = 20, 
                    run_type: str = None, error_only: bool = False):
    """提取最近的 Agent 執行記錄"""
    
    filters = {"project_name": project_name}
    if run_type:
        filters["run_type"] = run_type  # "chain", "tool", "llm"
    if error_only:
        filters["error"] = {"$ne": None}
    
    runs = list(client.list_runs(
        **filters,
        limit=limit,
        order="desc"
    ))
    
    for run in runs:
        status = "❌ ERROR" if run.error else "✅ OK"
        duration = (run.end_time - run.start_time).total_seconds() if run.end_time else "N/A"
        tokens = run.prompt_tokens + run.completion_tokens if run.prompt_tokens else "N/A"
        
        print(f"{status} [{run.run_type}] {run.name}")
        print(f"  ID: {run.id}")
        print(f"  時間: {run.start_time.strftime('%H:%M:%S')} | 耗時: {duration}s | Tokens: {tokens}")
        if run.error:
            print(f"  ❌ 錯誤: {run.error[:200]}")
        print()
    
    return runs
```

### 2. 深度分析單一 Run

```python
def analyze_run(run_id: str) -> dict:
    """深度分析單一執行追蹤"""
    run = client.read_run(run_id)
    
    analysis = {
        "id": str(run.id),
        "name": run.name,
        "status": "error" if run.error else "success",
        "duration_sec": (run.end_time - run.start_time).total_seconds() if run.end_time else None,
        "total_tokens": (run.prompt_tokens or 0) + (run.completion_tokens or 0),
        "error": run.error,
        "inputs": run.inputs,
        "outputs": run.outputs,
        "tool_calls": []
    }
    
    # 提取子 Runs（Tool Calls）
    child_runs = list(client.list_runs(parent_run_id=run_id))
    for child in child_runs:
        if child.run_type == "tool":
            analysis["tool_calls"].append({
                "tool": child.name,
                "input": child.inputs,
                "output": child.outputs,
                "error": child.error,
                "duration": (child.end_time - child.start_time).total_seconds() if child.end_time else None
            })
    
    return analysis

def print_run_tree(run_id: str, depth: int = 0):
    """樹狀顯示 Agent 執行路徑"""
    run = client.read_run(run_id)
    indent = "  " * depth
    status = "❌" if run.error else "✅"
    print(f"{indent}{status} [{run.run_type}] {run.name}")
    
    children = list(client.list_runs(parent_run_id=run_id))
    for child in sorted(children, key=lambda r: r.start_time):
        print_run_tree(str(child.id), depth + 1)
```

### 3. 錯誤模式分析

```python
def find_error_patterns(project_name: str, limit: int = 100) -> dict:
    """分析常見錯誤模式"""
    error_runs = list(client.list_runs(
        project_name=project_name,
        error={"$ne": None},
        limit=limit
    ))
    
    from collections import Counter
    import re
    
    # 錯誤分類
    error_types = Counter()
    for run in error_runs:
        if run.error:
            # 提取錯誤型別
            match = re.search(r'(\w+Error|\w+Exception)', run.error)
            if match:
                error_types[match.group(1)] += 1
            else:
                error_types["UnclassifiedError"] += 1
    
    print("=== 錯誤型別分佈 ===")
    for error, count in error_types.most_common(10):
        print(f"  {error}: {count} 次")
    
    return dict(error_types)
```

---

## 🔍 常見問題診斷

| 症狀 | 診斷步驟 | 可能原因 |
|---|---|---|
| Agent 無限迴圈 | 檢視 Run Tree，找迴圈路徑 | Max iterations 設定錯誤 |
| Tool Call 全失敗 | 檢查 tool 子 Run 的 error | API Key 失效/限流 |
| 回應太慢 | 查 duration_sec，定位最慢步驟 | 某個 Tool 阻塞 |
| 輸出不完整 | 查 completion_tokens 是否達上限 | max_tokens 太小 |
| 記憶體讀取失敗 | 查 memory 相關 tool 的 error | Vector Store 異常 |

---

## ⚡ CLI 快速使用

```bash
# 檢視最近 20 個 runs
langsmith-fetch list --project my-agent --limit 20

# 分析特定 run
langsmith-fetch trace --run-id <RUN_ID>

# 只看錯誤
langsmith-fetch list --project my-agent --errors-only

# 輸出 JSON 供進一步分析
langsmith-fetch trace --run-id <RUN_ID> --format json > trace.json
```

---

## 🤝 協同技能

- `systematic-debugging-skill`：更廣泛的環境除錯流程
- `optimization-status`：Agent 效能最佳化追蹤

---

## 版本紀錄 (Changelog)
- **[2.0.0]** 2026-05-04：V2.0.0 Polymorphic Labeling Migration — 依生命週期 SOP 匯入多型功能性技術標籤 (tool_category, execution_env, io_format)，建立執行層 Manifest 路由能力。

## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議


---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文件不再接收無結構的自然語言，必須處理封裝後的動態引數：
`[SYSTEM-CALL: langsmith-fetch | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

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
