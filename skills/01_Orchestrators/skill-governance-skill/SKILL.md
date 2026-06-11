---
name: skill-governance-skill
description: 技能生態系統的生命週期管理與邏輯審計。
version: "3.0.0"
---

# 技能生態治理 (Skill Governance)

本技能是 本協作系統 技能樹的**健康監控與維護中樞**，負責審計分類邏輯、追蹤 DLP 合規狀態、管理技能生命週期，以及維持整體生態系統的邏輯一致性。

---

## 🏗️ 六大分類體系（Skills 3.0）

| 分類 | 圖示 | 說明 |
|---|---|---|
| `domain` | 📈 | 臺股特定領域：量化研究、籌碼分析、技術形態 |
| `tools` | 📊 | 通用工具：Excel、CSV、PDF、SQL |
| `mindset` | 💪 | 大師思維視角：各人物框架技能 |
| `governance` | 🏗️ | 架構治理：SOP、MCP、除錯、Agent 核心 |
| `ux` | 🎨 | 開發體驗：視覺化、UI、設計工具 |
| `automation` | 🔗 | 整合自動化：API 串接、測試、CI/CD |

---

## 🔴 不刪除原則（No-Delete Policy）

> [!CAUTION]
> **嚴禁**透過任何手段刪除或移除現有技能卡片。違反此原則將導致 Agent 能力不可逆的喪失。

允許的調整方式：
- ✅ 重新分類（修改 `skill_translations.json` 中的 cluster）
- ✅ 合併說明（在卡片中標記「與 X 技能高度相關」）
- ✅ 標記為 `legacy`（在 description 附加說明，但保留卡片）
- ❌ 刪除 SKILL.md 檔案
- ❌ 刪除技能資料夾

---

## 🔄 技能生命週期管理

```
[新增] → [孵化期] → [活躍期] → [維護期] → [Legacy 標記]
              ↕            ↕
        [版本迭代]    [功能擴展]
```

| 狀態 | 說明 | 標記方式 |
|---|---|---|
| **孵化期** | 功能草稿，尚未正式登記 | SKILL.md 存在，但 skill_translations.json 未登記 |
| **活躍期** | 完整登記，正常運作 | `[✅ DLP]` + translations 已登記 |
| **維護期** | 功能穩定，無重大更新計畫 | 保持現狀，版本號凍結 |
| **Legacy** | 功能已被新技能涵蓋，但保留備查 | description 加注 `[Legacy]` |

---

## 🛡️ DLP 合規審計標準

每個技能必須在 SKILL.md 中包含以下格式的 DLP 宣告（**只需一次**）：

```markdown


```

> [!WARNING]
> **絕對禁止**使用批量腳本重複堆疊 DLP 宣告行。這會破壞技能的實質內容，導致「DLP 通過，但技能空洞」的假性合規。

---

## 🌐 語言合規性 (Language Compliance)

所有技能的 `SKILL.md` 描述、工具說明及 UI 翻譯必須符合繁體中文標準。
- **檢查點**：
  1. 無簡體中文術語（如：設定 → 設定、資料 → 資料）。
  2. 專案名詞與描述必須對應台灣中文習慣。
  3. 所有 Agent 結束報告與計畫提案均為繁體中文。

---

## ⚙️ 儀錶板維護 SOP

```powershell
# 每次修改技能後必須執行
node "<USER_HOME>\Desktop\AI Test_260413\AI Test_260406\.agent\scripts\refresh_skills.js"
```

確認輸出包含：
- `[✅ DLP]` 對每個技能
- 無 `[❌ No DLP]` 錯誤

---

## 📊 當前系統狀態追蹤

| 指標 | 說明 |
|---|---|
| **總技能數** | 53+ |
| **DLP 合規率** | 目標 100% |
| **分類覆蓋** | 6 大分類 |
| **未登記技能** | 需補入 skill_translations.json |

---

## 🤝 協同技能

- `skill-creator`：新技能設計標準
- `optimization-status`：系統效能監測
- `systematic-debugging-skill`：執行環境排障
- `handover-manual-skill`：跨 session 狀態傳遞

---
## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議
