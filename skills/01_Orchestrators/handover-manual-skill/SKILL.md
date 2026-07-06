---
name: handover-manual-skill
description: 標準化的專案上下文與知識轉移手冊。
version: "3.0.0"
type: "orchestrator"
capabilities:
  logic_depth: "Standard"
  strategic_focus: "General Analysis"
  interaction_style: "Professional"
---

# 交接手冊系統 (Handover Manual Skill)

### 【摘要】觸發條件與 DLP 聲明
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議

本技能生成**標準化的專案交接文件**，確保在 Session 切換、人員交接或長期專案暫停後，任何繼任者（包含 AI Agent 本身）都能立即掌握全局、無縫接手，零資訊損失。

---

## 🎯 觸發條件

- 專案即將暫停或交接給其他人員
- 需要整合多個 Session 的工作成果
- 建立 AI-to-AI 的上下文傳遞文件
- 長期專案的定期狀態快照

---

## 📋 標準交接文件結構

```markdown
# [專案名稱] 交接手冊 v[版本]

**最後更新**：[日期時間]
**交接人**：[姓名/Agent ID]
**接收人**：[姓名/下一個 Agent Session]

---

## 1. 專案快照（30 秒可讀版）

> 用 3~5 句話描述：專案是什麼、目前到哪個階段、最重要的未完成事項。

## 2. 技術環境

| 專案 | 詳情 |
|---|---|
| **技術棧** | Next.js 14 + Python 3.12 + PostgreSQL |
| **關鍵路徑** | `C:\Project\` |
| **設定檔位置** | `.env.local`, `config.yaml` |
| **開發服務器** | `npm run dev` (port 3000) |

## 3. 已完成工作（Done）

- [x] 技能儀錶板 v3.0 UI 重設計
- [x] DLP 合規修復（53 個技能全部通過）
- [x] refresh_skills.js frontmatter 剝離修復

## 4. 進行中工作（In Progress）

- [ ] 技能品質提升（18 個 FAIR 技能重建中）
- [ ] 自動化測試套件建立

## 5. 待辦事項（Backlog）

- [ ] 技能版本控制系統
- [ ] 技能搜尋功能

## 6. 已知問題與風險

> [!WARNING]
> **已知問題**：舊 DLP 腳本（fix_dlp.js）若再次執行將導致內容覆蓋，已永久廢棄。

## 7. 關鍵決策記錄

| 日期 | 決策 | 原因 |
|---|---|---|
| 2026-04-17 | 採用 frontmatter 剝離方案 | 解決 YAML 渲染為純文字的根本問題 |
| 2026-04-17 | No-Delete Policy | 防止技能卡片被誤刪，需 2 次使用者確認 |

## 8. 重要聯絡與資源

- **Skills Manifest**：`Data/00_Skill_Manifest.json`（技能唯一真理來源，現有 68 條）
- **技能目錄**：`<WORKSPACE_ROOT>/skills/`（三層：01_Orchestrators / 02_Cognitive / 03_Execution）
- **系統架構圖**：`../../../SOP/SOP_00_System_Architecture_Map.md`
- **Not-Delete Policy**：見 `SOP_05_System_Policies.md §7`

## 9. 下一個 Session 的首要任務

1. 執行 `node scratch/update_manifest.js` 驗證 Manifest 路徑 100% 有效
2. 執行 `node Modules/db_state_manager.js`（或呼叫 Watchdog）確認 Neon DB 連線正常
3. 接續完成 [In Progress] 中的任務
```

---

## 🤖 AI-to-AI 交接協定（Context Handoff Protocol）

當 AI Agent 切換 Session 時，自動生成以下格式的上下文恢復包：

```json
{
  "session_id": "（每次新 Session 自動生成）",
  "project": "本協作系統 Argus v6.0",
  "architecture": "V3.2.0 — 三層 68 技能",
  "critical_rules": [
    "No-Delete Policy: 刪除技能需 2 次確認（見 SOP_05 §7）",
    "禁止使用 fix_dlp.js / patch_missing_dlp.js",
    "Manifest 必須與實體目錄 100% 同步"
  ],
  "files_to_watch": [
    "Data/00_Skill_Manifest.json",
    "Data/skill_translations.json",
    "SOP/SOP_05_System_Policies.md"
  ]
}
```

---

## 🛡️ No-Delete Policy（最高優先原則）

> [!CAUTION]
> **任何技能資料夾的刪除操作，必須經過使用者 2 次（含）以上明確確認**。
>
> **確認流程**：
> 1. Agent 要求第一次確認：「您確定要刪除 [技能名稱]？」
> 2. 使用者確認後，Agent 要求第二次確認：「請再次輸入技能名稱以確認刪除」
> 3. 完全一致後方可執行
>
> **寧可保留不確定的技能，也絕不誤刪。**

---

## ⚙️ 定期維護 SOP

```bash
# 每週執行一次的系統健康檢查
node detect_dlp_flood.js          # 確認零 DLP 感染
node full_quality_scan.js         # 確認所有技能達到 GOOD 品質
node refresh_skills.js            # 同步儀錶板
```

---

## 🤝 協同技能

- `skill-governance-skill`：技能生命週期管理
- `skill-creator`：新技能的標準建立流程
- `systematic-debugging-skill`：問題發生時的排障 SOP

---
## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議


---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文檔不再接收無結構的自然語言，必須處理封裝後的動態參數：
`[SYSTEM-CALL: handover-manual-skill | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

> [!IMPORTANT]
> **Payload 淨化規則 (§6.3)**：
> - 若本技能為 `Cognitive` 型：接收戰略目標、語氣設定、情緒變數；拒絕 SQL/DOM/技術指令。
> - 若本技能為 `Execution` 型：只接收 URL、DOM Selector、SQL、JSON Schema；拒絕認知參數。

發送協定 (Zero-Block Policy)： 執行中若遇能力不足或需外部協作，嚴禁中斷或詢問使用者。必須主動封裝 Dynamic Payload 並發出：
`[SYSTEM-CALL: 目標ID | PAYLOAD: { ... }]` 調閱其他技能。

回傳協定： 任務終止時，必須且只能輸出 `[SYSTEM-RETURN: SUCCESS/FAILED | DATA: <結果>]`。
