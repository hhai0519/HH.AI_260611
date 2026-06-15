# 本協作系統 工作區 HH.AI_260611

> **版本**：Argus v6.0 ｜ **架構版本**：V3.2.0 ｜ **更新**：2026-06-16

---

## 專案定位

本工作區是一個以 **AI 代理人驅動** 的高強度智慧決策系統，結合了：

- **AI 決策引擎**：基於 Google Gemini 提供多層次智慧邏輯運算
- **台股分析平台**：D3.js 高階資料視覺化、本益比河流圖、籌碼集中度分析
- **LINE Bot 服務**：零延遲非同步回覆架構（`line-bot-project/`）
- **技能生態系統**：69 個可插拔技能模組，三層架構管理

---

## 技術棧

| 層級 | 技術 |
|------|------|
| **前端** | Next.js 15.2+ (App Router) / React 19 |
| **後端 / API** | Node.js / Next.js API Routes |
| **資料庫** | Neon DB (PostgreSQL，分散式狀態管理) |
| **即時通訊** | LINE Messaging API |
| **版本控制** | GitLab (`hh.ai.20260519-project`) |
| **AI 核心** | Google Gemini Flash / Gemma 4 |
| **隧道工具** | Cloudflared |

---

## 快速啟動

```powershell
# 1. 環境變數設定
Copy-Item .env.example .env.local
# 填寫 .env.local 中的 API Key（見下方「環境變數」章節）

# 2. 安裝依賴
npm install

# 3. 啟動系統
.\啟動系統.bat
# 或手動：
npm run dev               # 前端服務 (port 3000)
node line-bot-project\start_line.js  # LINE Bot 服務
```

---

## 系統架構

詳細架構說明請見 [`00_System_Architecture_Map.md`](./00_System_Architecture_Map.md)。

```
HH.AI_260611/
├── SOP/              ← 標準作業程序（15 份）
├── skills/           ← 技能庫（69 個技能，三層架構）
│   ├── 01_Orchestrators/  (18 個) — 調度與流程控制
│   ├── 02_Cognitive/      (24 個) — 認知與分析引擎
│   ├── 03_Execution/      (27 個) — 執行與自動化工具
│   └── Archive/           — 已歸檔的歷史技能
├── Modules/          ← 核心 JS 模組（Neon DB 狀態管理等）
├── Data/             ← 資料層（Manifest、翻譯表、Persona）
├── line-bot-project/ ← LINE Bot 服務
└── Templates/        ← 技能模板
```

---

## Skills 技能架構

| 分層 | 數量 | 定位 |
|------|------|------|
| `01_Orchestrators` | 18 個 | 任務調度、流程控制、遞迴研究 |
| `02_Cognitive` | 24 個 | 台股分析、財務模型、思維框架 |
| `03_Execution` | 27 個 | 工具串接、自動化、環境管理 |

技能完整清單見 [`Data/00_Skill_Manifest.json`](./Data/00_Skill_Manifest.json)。

---

## 環境變數 (.env.local)

| 變數名稱 | 說明 | 必填 |
|---------|------|------|
| `GEMINI_API_KEY` | Google AI Studio API Key | ✅ |
| `LINE_CHANNEL_SECRET` | LINE Bot 頻道密鑰 | ✅ |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Bot 存取令牌 | ✅ |
| `DATABASE_URL` | Neon DB PostgreSQL 連線字串 | ✅ |
| `LANGSMITH_API_KEY` | LangSmith 追蹤 API Key | 選填 |

---

## 核心政策

- **語言**：所有 Agent 輸出、報告、SOP 均使用**台灣正體中文**（見 `SOP_05 §2.1`）
- **技術棧**：強制 Next.js 15.2+ / React 19 / GitLab（見 `SOP_06`）
- **技能管理**：禁止直接刪除技能，改用歸檔政策（見 `SOP_05 §7`）
- **路徑規範**：零硬編碼原則，使用 `<WORKSPACE_ROOT>` 語意佔位符
- **備份政策**：重大變更前強制 `git commit` + 推送至 GitLab

---

## 維護指令

```powershell
# 健康檢查（建議每次啟動執行）
node scratch/update_manifest.js

# 系統維護
node Modules/maintenance_worker.js

# 配額監控
node Modules/quota_manager.js

# 孤兒技能掃描
node Modules/scan_orphans.js
```

---

*本文件由 Antigravity 總管自動維護 ｜ 嚴格遵守 SOP_05 系統核心治理政策*
