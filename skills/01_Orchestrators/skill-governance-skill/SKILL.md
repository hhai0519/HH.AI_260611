---
name: skill-governance-skill
description: 技能生態系統的生命週期管理與邏輯審計。
version: "3.0.0"
type: "orchestrator"
capabilities:
  logic_depth: "Standard"
  strategic_focus: "General Analysis"
  interaction_style: "Professional"
---

# 技能生態治理 (Skill Governance)

### 【摘要】觸發條件與 DLP 聲明
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議

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

## ⚙️ 技能同步 SOP

```powershell
# 每次新增或修改技能後必須執行
node scratch/update_manifest.js   # 驗證 Manifest 路徑 100% 有效
```

確認輸出包含：
- `[全數驗證通過]` 所有 N 個技能路徑均存在
- 無 `[INVALID]` 錯誤

---

## 📊 當前系統狀態追蹤

| 指標 | 說明 |
|---|---|
| **總技能數** | 動態維護於 `Data/00_Skill_Manifest.json`（現為 68 條） |
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


---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文檔不再接收無結構的自然語言，必須處理封裝後的動態參數：
`[SYSTEM-CALL: skill-governance-skill | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

> [!IMPORTANT]
> **Payload 淨化規則 (§6.3)**：
> - 若本技能為 `Cognitive` 型：接收戰略目標、語氣設定、情緒變數；拒絕 SQL/DOM/技術指令。
> - 若本技能為 `Execution` 型：只接收 URL、DOM Selector、SQL、JSON Schema；拒絕認知參數。

發送協定 (Zero-Block Policy)： 執行中若遇能力不足或需外部協作，嚴禁中斷或詢問使用者。必須主動封裝 Dynamic Payload 並發出：
`[SYSTEM-CALL: 目標ID | PAYLOAD: { ... }]` 調閱其他技能。

回傳協定： 任務終止時，必須且只能輸出 `[SYSTEM-RETURN: SUCCESS/FAILED | DATA: <結果>]`。
