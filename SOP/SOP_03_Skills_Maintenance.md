---
title: "技能生命週期維護標準作業程序"
version: "3.1.3"
tags: ["SOP", "技能維護", "Skills", "Dashboard"]
dependencies: ["SOP_00_Skill_Lifecycle_Management.md", "Data/00_Skill_Manifest.json"]
---

# 本協作系統 Skills 技能庫維護與視覺化管理標準作業程序 (SOP)

**版本**：3.1.3 ｜ **更新日期**：2026-05-04（更新於 2026-05-04）
**通訊語言**：台灣正體中文（強制規定）

本文件規範 本協作系統 技能庫的新增、更新、審查與同步作業，確保系統技能保持高品質且可持續演進，同時與 AI 自動化工作流程無縫整合。

---

## 1. 視覺設計規範（Design Standard: Ocean Depths）

技能儀表板採用 **Ocean Depths（深海視覺）** 主題配色，由 `scripts\refresh_skills.js` 自動套用：

- **色彩系統**：
  - 背景色：`#030712`（極深海藍底色）
  - 卡片底色：`rgba(17, 24, 39, 0.6)`（半透明深色）
  - 主題強調色：`#0ea5e9`（Ocean Blue）搭配漸層邊框光暈
- **版面設計**：
  - 卡片格數：最多 5 欄（`minmax(230px, 1fr)`）
  - 卡片間距：15px
  - 卡片容器採毛玻璃效果（Glassmorphism）
- **視覺特效**：
  - 啟用 Layer 1 & 2 半透明光暈動畫
  - 滑鼠懸停時展開卡片詳細資訊（依技能類型顯示不同內容）

---

## 2. 路徑設定（v260503 版）

### 2.1 本協作系統 官方技能庫路徑（頂層來源）
```
技能庫路徑：<USER_HOME>\.gemini\本協作系統\skills\
更新方式：直接修改 `Data/00_Skill_Manifest.json` 並執行 `node scratch/update_manifest.js` 驗證
翻譯索引：  <USER_HOME>\.gemini\本協作系統\skills\scripts\skill_translations.json
```

### 2.2 專案本地技能目錄路徑
```
技能目錄：<工作站路徑>\skills\
文件目錄：<工作站路徑>\docs\
```

> **注意**：`<工作站路徑>\skills\` 為本地擴充技能目錄，技能實體不得與 本協作系統 官方技能庫中的技能重複。
> 新增或修改 Skill 後，必須同步更新官方技能庫，再透過下方腳本部署至本地目錄。

```powershell
# @EXECUTE
# 同步腳本：將官方技能庫部署至本地目錄
$src = "<USER_HOME>\.gemini\本協作系統\skills"
$dst = "<工作站路徑>\skills"
Get-ChildItem -Path $src -Directory |
  Where-Object { $_.Name -notin @('.git','scripts','docs') } |
  ForEach-Object { Copy-Item -Path $_.FullName -Destination "$dst\$($_.Name)" -Recurse -Force }
Write-Host "同步完成"
```

---

## 3. 資料層設計 (Data Layer)

### 資料唯一來源 (Source of Truth)
- **正體中文技能說明**：所有 Skill 的正式說明文件為 `SKILL_TW.md`（若存在），英文版僅作參考。
- **翻譯索引（SSOT）**：所有技能的中文標題、描述與分類標籤對應，統一維護於 `Data/skill_translations.json`。此為唯一合法路徑，嚴禁指向 `scripts/` 或 `.agent/` 等過期目錄。

### 技能更新標準流程
1. 修改來源：直接編輯 本協作系統 官方技能庫 `skills\<folder>\SKILL.md`
2. **【建議】** 同步更新 `SKILL_TW.md`（確保 100% 正體中文覆蓋率）
3. 更新 `skill_translations.json` 中對應的分類標籤與描述
4. 確認合規性（見第 4 節）
5. 部署至本地技能目錄（見 §2.2 腳本）

---

## 4. 技能 Modal 詳細資訊規範（Modal 展開內容）

### 4.1 SKILL_TW.md 標準範本
```markdown
---
name: skill-folder-name
description: "（用正體中文描述：此技能的用途、適用情境與觸發關鍵字說明）"
version: "1.0.0"
---

### 【摘要】觸發條件與 DLP 聲明
- **適用情境**：說明此技能的適用情境與觸發條件
- **憑證聲明**：此技能不嵌入任何 API Key 等敏感憑證

---

# 以下為技能的完整中文說明

（依據技能實際功能，包含以下區塊：）
## 核心功能
## 使用方法 / 工作站路徑
## 操作步驟（如適用）
## 使用範例（如適用）
```

### 4.2 品質驗證清單
| 驗證項目 | 必填 | 驗證說明 |
|---------|------|---------|
| **YAML frontmatter** | ✅ | `name` 欄位不可為空；`description` 須包含觸發關鍵字說明 |
| **【摘要】DLP 聲明** | ✅ | 至少 2 個要點，明確說明技能的適用範圍及憑證聲明 |
| **核心功能說明** | ✅ | 清楚描述技能做什麼，以及對系統的價值 |
| **操作步驟範例** | ✅ | 至少 2 個實際步驟，附帶預期輸出或回饋說明 |
| **工作站路徑** | ✅ | 包含「完成」、「跳過」或「失敗」等狀態描述 |
| **使用範例** | 選填（建議填寫） | 補充具體的應用場景以利理解 |

### 4.3 常見違規
- 若 YAML frontmatter 的 `name` 欄位為空，**禁止存檔，必須補全所有必填欄位**
- 若工作站路徑中的觸發條件不夠清晰，**須補充觸發關鍵字並標記狀態條件**
- 若 DLP 聲明段落缺失，確認是否真的無敏感資料依賴
- 若操作步驟範例不完整（如包含 `data = "TODO"` 等佔位符），視為未完成狀態

---

## 5. 自動化更新協議 (Auto-Refresh Protocol)

### AI 自動化管理邏輯
若 AI 系統在任何會話中自動更新技能，**必須在完成後主動執行**以下驗證步驟：
- 建立或確認技能目錄結構
- 同步更新翻譯索引與分類標籤
- 更新 `SKILL_TW.md` 技能 Modal 詳細資訊
- 觸發儀表板自動重整

### 大規模合規性巡檢腳本 (Massive Optimization Loop)
若因 SOP 結構性改版導致大量技能不合規，授權 Agent 以 `$$自動化$$` 權限撰寫並執行 Node.js 腳本 (如 `massive_optimization_loop.js`)，進行全系統的 3 輪以上自我修復與驗證，取代人工逐一修改。確保 100% 絕對合規。

### 同步義務（V3.1.3 修訂）
技能更新後，Agent 必須直接執行以下檔案寫入操作，無需依賴外部 Node.js 腳本：
1. 更新 `Data/00_Skill_Manifest.json`（寫入或修改對應技能物件）
2. 更新 `Data/skill_translations.json`（同步中文標題、描述與別名）
3. 更新 `SKILL_TW.md`（確保技能的正體中文說明完整）

> [!NOTE]
> `scripts/refresh_skills.js` 與 `.agent/scripts/` 路徑已於 V3.1.3 正式廢除。現行唯一真理來源：`Data/00_Skill_Manifest.json`。

### 預期成功輸出
```
HTML Dashboard generated: ...skills_dashboard.html
Markdown Report updated: ...skills_categorization_report.md
```

---

## 6. 新增或補齊技能詳細資訊 SOP

若發現技能缺乏 Modal 詳細資訊，按以下步驟補齊：

### 步驟 1：找出缺少 SKILL_TW.md 的技能
```powershell
# @EXECUTE
Get-ChildItem -Path "<USER_HOME>\.gemini\本協作系統\skills" -Recurse -Name "SKILL_TW.md"
```

### 步驟 2：選取需要補齊的技能
確認清單後，按照第 4 節範本逐一補齊 `SKILL_TW.md` 的內容。

> [!NOTE]
> **V3.1.3 廢棄宣告**：原步驟 3（觸發儀表板更新）與步驟 4（驗證儀表板大小）已正式廢除。
> 現行唯一真理來源為 `Data/00_Skill_Manifest.json`，請直接透過 `write_to_file` 工具更新該檔案，無需執行任何外部腳本。

### 步驟 5：同步部署至本地專案目錄
```powershell
# @EXECUTE
# 同步 SKILL_TW.md 至本地技能目錄
$src = "<USER_HOME>\.gemini\本協作系統\skills"
$dst = "<工作站路徑>\skills"
Get-ChildItem $src -Recurse -Filter "SKILL_TW.md" | ForEach-Object {
  $rel = $_.FullName.Replace($src, "").TrimStart("\")
  $target = Join-Path $dst $rel
  New-Item -ItemType Directory -Path (Split-Path $target) -Force | Out-Null
  Copy-Item $_.FullName -Destination $target -Force
  Write-Host "已同步：$rel"
}
```

---

*本 SOP 建立於 2026-04-15 ｜ v3.1.3 更新於 2026-05-04（更新於 2026-05-04，整合技能翻譯管理）*
*翻譯索引與 UI 系統已全面更新，確保 本協作系統 技能庫視覺一致性並符合正體中文規範*
