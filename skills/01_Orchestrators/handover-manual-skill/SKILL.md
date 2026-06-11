---
name: handover-manual-skill
description: 標準化的專案上下文與知識轉移手冊。
version: "3.0.0"
---

# 交接手冊系統 (Handover Manual Skill)

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

- **儀錶板**：`AI Test_260406/skills_dashboard.html`
- **腳本目錄**：`.agent/scripts/`
- **技能目錄**：`~/.gemini/本協作系統/skills/`

## 9. 下一個 Session 的首要任務

1. 執行 `node refresh_skills.js` 確認儀錶板正常
2. 執行 `node detect_dlp_flood.js` 確認零感染
3. 接續完成 [In Progress] 中的任務
```

---

## 🤖 AI-to-AI 交接協定（Context Handoff Protocol）

當 AI Agent 切換 Session 時，自動生成以下格式的上下文恢復包：

```json
{
  "session_id": "ac9b20f5-c322-4e9b-b2ac-0d10ed072676",
  "project": "本協作系統 Skill Ecosystem",
  "checkpoint": 6,
  "last_action": "全面重建 18 個 FAIR 技能",
  "current_priority": "品質驗證 + 儀錶板更新",
  "critical_rules": [
    "No-Delete Policy: 刪除技能需 2 次確認",
    "禁止使用 fix_dlp.js / patch_missing_dlp.js",
    "每次修改後執行 refresh_skills.js"
  ],
  "files_to_watch": [
    "skills_dashboard.html",
    "skill_translations.json",
    ".agent/scripts/refresh_skills.js"
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
