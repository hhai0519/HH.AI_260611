---
title: "SOP 08 Project Readme"
version: "3.1.3"
tags: [SOP, Readme, Directory]
dependencies: []
---
# 本協作系統 工作區 ─ HH.AI_260611

版本控制：v260611 (2026-06-11)

**建立日期**：2026-05-03

**語言限制**：繁體中文 (Traditional Chinese) 強制遵循

---

> [!CAUTION]
> **【系統啟動強制約束 (System Bootstrap Anchor)】**
> 任何 AI 代理人被喚醒或接手本工作區時，**第一個動作必須是完整閱讀本文件**。並嚴格遵守以下鐵律：
> 1. **建立上下文**：依照 §5 對照表，動態載入對應 SOP。
> 2. **反幻覺與偏見壓制**：本系統唯一技術真理為 `Next.js 15.2+ (App Router)` / `React 19` / `Tailwind CSS v4` / `GitLab`。嚴禁提議 Vite 或 GitHub。
> 3. **反工具懶惰 (Anti-Laziness)**：當需要盤點技能數量或系統狀態時，**絕對禁止憑空猜測或捍造欄位**。必須且僅能真實呼叫「檔案讀取工具」去解析 `Data/00_Skill_Manifest.json` 的 Array 長度。

## 1. 工作區目錄結構

```text
HH.AI_260611/
├── README.md                  # 工作區基礎指南
├── Summary_History.md         # 歷史操作紀錄與摘要
├── skills/                    # 包含 本協作系統 Skills 的本地目錄
│   ├── 01_Orchestrators/      # 總管與高階流程控制模組
│   ├── 02_Cognitive/          # 思考模型與邏輯推演模組
│   └── 03_Execution/          # 工具調用與實體執行腳本
│
│   ⚠️ 【全面禁止扁平化存放】所有技能必須歸入上述三層子結構之一。
│       直接存放於 skills/ 根目錄者，視為系統違規，將觸發 Watchdog 異常。
├── Data/                      # 系統設定與快取資料
│   ├── 00_Skill_Manifest.json # 核心技能註冊表 (SSOT)
│   ├── skill_translations.json # 技能中文翻譯索引 (SSOT)
│   └── (已廢除) Pending_Optimization.json # Watchdog 異常暫存區 (V3.2.0 起改用 Neon DB)
└── SOP/                       # 系統管理與 SOP 文件 (V3.1.3 標準)
    ├── SOP_00_Skill_Lifecycle_Management.md
    ├── SOP_00B_Agent_File_Governance.md   # [更名自 SOP_00_Agent_File_Governance]
    ├── SOP_00C_New_Skill_Onboarding.md    # [更名自 SOP_00_New_Skill_Onboarding]
    ├── SOP_01_Automation_Process.md
    ├── SOP_05_System_Policies.md
    ├── SOP_11_Task_Reflection_Protocol.md # [更名自 SOP_09_Task_Reflection_Protocol]
    └── ... (SOP 01 ~ 11 系列文件)
```

---

## 2. 核心啟動腳本

**啟動方法 A（推薦）：**

執行 `start_all_servers.bat` 腳本，自動啟動所有背景服務。

**啟動方法 B（手動終端機）：**

```powershell
# 步驟 1：解除 PowerShell 執行限制
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# 步驟 2：啟動 本協作系統 主控台 (Port 3000)
cd "<工作目錄>\tw-stock-web"
npm run dev   # 預期：Ready in ~400ms

# 步驟 3：啟動舊版後端服務 (Port 8888)
cd "<工作目錄>\taiwan-stock"
py -m http.server 8888   # 預期：Serving HTTP on 0.0.0.0 port 8888

# 步驟 4：驗證 Port 佔用
netstat -ano | Select-String ":3000|:8888"
```

**服務連接埠對照表：**

| 服務 | 說明 | 預設 URL |
|------|------|----------|
| 本協作系統 主控台 | Next.js 前端介面 | `http://localhost:3000` |
| 舊版服務 API | 後端 HTTP 服務 | `http://localhost:8888` |
| Skills Dashboard | Skills 管理儀表板 | `http://localhost:8888/skills_dashboard.html` |

---

## 3. 授權與執行參數 (Auth Tokens)

| 參數 | 用途 |
|------|------|
| `$$自動化$$` | 用於授權腳本執行敏感寫入，繞過一般限制。 |
| `$$Allow All$$` | 用於忽略「單次請求修改」限制，必須明確指定。 |

**警告**：請勿在未經授權的情況下輸入上述指令，系統將會拒絕並記錄異常。

---

## 4. Skills 動態註冊表 (Dynamic Manifest)

系統所有的代理人技能已全面實作動態註冊機制。

- **絕對真實來源 (SSOT)**：`Data/00_Skill_Manifest.json`。
- **嚴禁**在任何 README 或 SOP 中維護靜態的技能表格。代理人需盤點技能時，必須解析上述 JSON 檔案以取得最新 Squad 名單。

---

## 5. SOP 核心路徑對照表 (V3.1.3)

| 核心領域 | 相對路徑 | 說明 |
|----------|----------|------|
| **生命週期** | `./SOP/SOP_00_Skill_Lifecycle_Management.md` | 技能誕生、防腐化過濾與更版核心原則。 |
| **架構守門員** | `./SOP/SOP_00B_Agent_File_Governance.md` | 零散落政策、無前綴 1:1 映射命名規則。 |
| **技能報到** | `./SOP/SOP_00C_New_Skill_Onboarding.md` | 新技能全自動報到、Manifest 注入與映射表同步。 |
| **自動化** | `./SOP/SOP_01_Automation_Process.md` | 自動化模型腳本 SOP 與 10% 熔斷機制。 |
| **安全規範** | `./SOP/SOP_02_Security_Guidelines.md` | 安全性限制、Token 保護防線。 |
| **技能維護** | `./SOP/SOP_03_Skills_Maintenance.md` | 技能庫更新、翻譯索引與儀表板重整。 |
| **系統政策** | `./SOP/SOP_05_System_Policies.md` | Watchdog Hook 機制、跨平台編碼與命名空間治理。 |
| **交接與架構** | `./SOP/SOP_06_Handover_Manual.md` | 系統架構與專案交接指南。 |
| **專案導覽** | `./SOP/SOP_08_Project_Readme.md` | 本文件，目錄結構與啟動腳本。 |
| **反思協議** | `./SOP/SOP_11_Task_Reflection_Protocol.md` | 任務完成後的自我審查與結構化反思機制。 |

---

本協作系統 AI Agent ─ TACTICAL_AUTONOMOUS_ENTITY
工作區版本：v260503 ─ 語言：繁體中文強制遵循
