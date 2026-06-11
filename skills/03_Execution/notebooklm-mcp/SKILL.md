---
name: notebooklm-mcp
type: execution

version: "3.0.0"
capabilities:
  tool_category: "AI Research"
  execution_env: "Browser/MCP"
  io_format: "JSON/Markdown"
---

# NotebookLM 智庫整合 (NotebookLM MCP)

本技能透過 **NotebookLM MCP Server** 讓 本協作系統 Agent 直接自動化操控 Google NotebookLM，實現：批量建立知識庫、多源研究彙整、Podcast 製作、AI 報告生成，以及跨 Notebook 的深度知識交叉查詢。

---

## 🎯 觸發條件

- 提到「notebooklm」「nlm」「podcast」「audio overview」
- 需要建立或管理知識筆記本
- 需要生成 AI 研究報告、音頻摘要或 Podcast
- 需要從 URL、YouTube、PDF、Google Drive 建立知識庫
- 需要跨筆記本的知識合併查詢

---

## 🛠️ 核心功能矩陣

| 功能類別 | MCP 工具 | 說明 |
|---|---|---|
| **筆記本管理** | `notebook_create/list/get/rename` | 建立、列出、查詢、重命名 |
| **來源添加** | `source_add` | url / text / drive / file 四種類型 |
| **AI 查詢** | `notebook_query` | 對已有來源進行 AI 問答 |
| **異步查詢** | `notebook_query_start/status` | 大型筆記本的非阻塞查詢 |
| **內容生成** | `studio_create` | audio/video/report/quiz/flashcards/mind_map |
| **深度研究** | `research_start/status/import` | 自動網頁搜索並匯入結果 |
| **批量操作** | `batch` | 批量查詢 / 建立 / 新增來源 |
| **下載輸出** | `download_artifact` | 下載 MP4/PDF/JSON/CSV 等格式 |
| **分享協作** | `notebook_share_invite` | 邀請協作者 |

---

## 📋 完整工作流範例

### 工作流 1：快速資料入庫 → 查詢

```
Step 1: mcp_notebooklm_notebook_create(title="臺股籌碼分析")
Step 2: mcp_notebooklm_source_add(source_type="url", url="https://...")
Step 3: mcp_notebooklm_source_add(source_type="text", text="...", title="研究摘要")
        ↑ 等待 2~3 分鐘讓 NotebookLM 處理來源
Step 4: mcp_notebooklm_notebook_query(query="主要的籌碼資訊號有哪些？")
```

### 工作流 2：深度研究 → 報告生成

```
Step 1: mcp_notebooklm_research_start(query="臺積電法人籌碼分析", mode="deep")
Step 2: mcp_notebooklm_research_status(notebook_id=...) → 輪詢直到 completed
Step 3: mcp_notebooklm_research_import(notebook_id=..., task_id=...)
Step 4: mcp_notebooklm_studio_create(artifact_type="report", report_format="Briefing Doc")
Step 5: mcp_notebooklm_download_artifact(artifact_type="report", output_path="./report.md")
```

### 工作流 3：Podcast 製作（Audio Overview）

```
Step 1: 確認筆記本有足夠來源（建議 5+ 個來源）
Step 2: mcp_notebooklm_studio_create(
          artifact_type="audio",
          audio_format="deep_dive",  # 或 "briefing"
          audio_length="default"
        )
Step 3: mcp_notebooklm_studio_status(notebook_id=...) → 等待生成（約 3~5 分鐘）
Step 4: mcp_notebooklm_download_artifact(artifact_type="audio", output_path="./podcast.mp4")
```

### 工作流 4：跨筆記本知識整合查詢

```python
# 向多個筆記本同時提問，彙整答案
mcp_notebooklm_cross_notebook_query(
    query="恐慌指數超過 30 的歷史案例",
    notebook_names="臺股籌碼分析, 市場恐慌指數研究, ADR 連動分析"
)
```

---

## 📦 內容生成類型對照

| artifact_type | 格式選項 | 用途 |
|---|---|---|
| `audio` | deep_dive / briefing | Podcast、語音摘要 |
| `video` | explainer | 視頻概覽 |
| `report` | Briefing Doc / Study Guide / Blog Post | 文字報告 |
| `quiz` | json / markdown / html | 測驗題目 |
| `flashcards` | json / markdown | 學習卡片 |
| `mind_map` | JSON | 思維導圖 |
| `slide_deck` | pdf / pptx | 投影片 |
| `infographic` | PNG | 資訊圖表 |
| `data_table` | CSV | 結構化資料表 |

---

## 🔐 認證管理

```bash
# 首次登入（在終端執行）
nlm login

# 切換 Google 帳號
nlm login switch <profile>

# 重新整理 token（若出現 401）
mcp_notebooklm_refresh_auth
```

---

## ⚠️ 重要限制

| 限制 | 數值 | 應對方法 |
|---|---|---|
| 單筆記本來源數上限 | ~300 個 | 拆分為多個筆記本 |
| Audio 生成時間 | 3~10 分鐘 | 用 studio_status 輪詢 |
| 深度研究時間 | ~5 分鐘 | 用 research_status 輪詢 |
| 查詢 timeout 預設 | 120 秒 | 大型筆記本用 notebook_query_start |

---

## 🤝 協同技能

- `nlm-skill`：CLI 操作進階 SOP
- `csv-data-summarizer`：下載的 data_table 後續統計分析
- `handover-manual-skill`：研究成果整合到交接文件

---

## 版本紀錄 (Changelog)
- **[2.0.0]** 2026-05-04：V2.0.0 Polymorphic Labeling Migration — 依生命週期 SOP 導入多態功能性技術標籤 (tool_category, execution_env, io_format)，建立執行層 Manifest 路由能力。

## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議
