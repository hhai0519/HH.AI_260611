# 🛡️ 本協作系統 技能資產保護 SOP v1.1
> **最後更新**：2026-04-17 09:33 (UTC+8)
> **安全等級**：🔴 最高 (CRITICAL)
> **修改本檔案需要**：使用者 2 次以上明確確認

---

## ⚠️ 不可違反規則（ABSOLUTE RULES）

> [!CAUTION]
> 以下規則為**絕對規則**，任何 AI Agent、指令碼、或自動化流程**皆不得違反**。
> 修改這些規則本身也需要使用者**至少 2 次明確確認**。

### 規則 1：不刪除原則（No-Delete Policy）
- **嚴禁**刪除任何 SKILL.md 檔案
- **嚴禁**刪除任何技能資料夾
- **嚴禁**以任何方式（重新命名、移動、清空）使技能失效
- 唯一例外：經使用者 **2 次以上明確確認**，且記錄原因於日誌

### 規則 2：禁止批次覆蓋（No Batch Overwrite）
- **嚴禁**使用指令碼批次修改 SKILL.md 的核心內容
- **嚴禁**使用 fix_dlp.js / patch_missing_dlp.js 等自動修復指令碼
- 每次修改只能**手動逐一**進行，且必須確認不破壞現有內容

### 規則 3：SKILL.md 為唯一真相來源（Single Source of Truth）
- `refresh_skills.js` **永久禁止**讀取 SKILL_TW.md
- 儀錶板 Modal 內容**只來自** SKILL.md
- 此規則已寫入 refresh_skills.js 程式碼中，附帶安全註釋

### 規則 4：DLP 宣告唯一性（One DLP Only）
- 每個 SKILL.md **只能有一個** `## [Security] Smart Integration & DLP` 區塊
- 該區塊必須位於**檔案最末尾**
- 禁止重複堆疊 DLP 宣告行

### 規則 5：版本備份強制性（Mandatory Versioning）
- 每次修改技能系統前，必須先備份到 `.skill_versions/` 目錄
- 備份格式：`full_backup_YYYYMMDD_HHmmss/`
- 備份內容：所有 53 個 SKILL.md + refresh_skills.js + skill_translations.json

### 規則 6：🚫 禁止建立 SKILL_TW.md（Deprecated Bilingual Rule）
- **舊規則（已廢除 2026-04-17）**：舊版 `skill-creator` v1.0.0 要求「雙語同步」，即同時維護 `SKILL.md`（英文）與 `SKILL_TW.md`（繁體中文）
- **廢除原因**：`SKILL_TW.md` 被 DLP 洪水感染指令碼覆蓋，導致 27 個技能的 Modal 內容崩潰
- **現行鐵律**：**嚴禁**建立新的 `SKILL_TW.md`；現存的 15 個 `SKILL_TW.md` 不被系統讀取，僅保留作歷史參考
- **單一真相來源**：`SKILL.md` 是唯一的技能定義檔案，繁體中文在儀錶板的顯示名稱透過 `skill_translations.json` 提供

### 規則 7：🚫 建立新網頁/儀錶板需要 2 次以上使用者明確確認（New Page Approval Gate）
- **嚴禁**在未取得使用者 **2 次以上明確確認**的情況下，建立任何新的網頁（`.html`）或儀錶板
- **執行流程**：
  1. AI 提出計畫，說明擬建立網頁的用途、功能、與現有架構的關係
  2. 使用者第 1 次確認：閱讀計畫後同意
  3. AI 列出完整的檔案名稱、位置、預計內容清單，再次詢問
  4. 使用者第 2 次確認：再次同意後，AI 才可開始建立
- **唯一例外**：使用者在同一條指令中明確說明「無需再次確認，直接建立」
- **違反後果**：形成版本碎片，增加維護複雜度（歷史案例：skills_dashboard_v2.html 事件）
- **本規則生效日期**：2026-04-17，由使用者 2 次確認後寫入

---

## 📋 日常維護 SOP

### A. 新增技能
```
1. mkdir <USER_HOME>\.gemini\本協作系統\skills\<new-skill>
2. 手動建立 SKILL.md（遵循標準結構）
3. 確認 DLP 區塊只出現一次
4. 登記到 skill_translations.json
5. node refresh_skills.js
6. 驗證儀錶板渲染正確
7. 備份到 .skill_versions/
```

### B. 修改既有技能
```
1. 備份當前版本到 .skill_versions/
2. 直接編輯 SKILL.md（只修改需要的部分）
3. 確認 DLP 區塊仍只有一個
4. node refresh_skills.js
5. 驗證儀錶板渲染正確
```

### C. 健康檢查（建議每週執行）
```powershell
# 掃描所有技能的 DLP 密度
$folders = Get-ChildItem "<USER_HOME>\.gemini\本協作系統\skills" -Directory
foreach ($f in $folders) {
    $md = Join-Path $f.FullName "SKILL.md"
    if (Test-Path $md) {
        $c = Get-Content $md -Raw -Encoding UTF8
        $dlp = ([regex]::Matches($c, '## \[Security\]')).Count
        if ($dlp -ne 1) { Write-Output "ALERT: $($f.Name) has $dlp DLP sections (expected 1)" }
    }
}
```

---

## 🚨 事故應急流程

### 如果發現 Modal 顯示異常（DLP 洪水）
```
1. 停止所有自動化操作
2. 檢查 SKILL.md 是否被覆蓋 → 若是，從 .skill_versions/ 恢復
3. 檢查 refresh_skills.js 是否被修改 → 若是，從備份恢復
4. 執行健康檢查指令碼
5. 重新生成儀錶板
6. 記錄事故到日誌
```

### 如果需要刪除技能（極端情況）
```
1. 使用者第 1 次確認：明確說明刪除原因
2. AI 回覆確認理解，列出將被刪除的技能
3. 使用者第 2 次確認：再次明確同意
4. 備份該技能到 .skill_versions/deleted/
5. 執行刪除
6. 記錄到日誌
```

---

## 📊 系統基線資料（2026-04-17）

| 指標 | 基線值 |
|---|---|
| 總技能數 | 53 |
| 分類數 | 6 |
| SKILL.md 完整率 | 100% |
| DLP 合規率 | 100% |
| SKILL_TW.md 依賴 | 已永久禁用 |
| 備份數量 | 2 (full_backup + clean dashboard) |

---

## 📝 事故日誌

### 事故 #1：DLP 洪水感染事件
- **日期**：2026-04-16 ~ 2026-04-17
- **嚴重等級**：🔴 CRITICAL
- **根因**：自動化 DLP 修復指令碼 (fix_dlp.js) 向 SKILL_TW.md 注入了數百行重複的 DLP 宣告文字
- **影響範圍**：27 個 SKILL_TW.md 被嚴重感染
- **表現**：儀錶板 Modal 充滿重複的「資料加密處理 | 隱私保護協議」文字
- **修復措施**：
  1. 刪除 27 個被感染的 SKILL_TW.md
  2. 從 refresh_skills.js 永久移除 SKILL_TW.md 讀取邏輯
  3. 加入 DLP 洪水自動清洗防護
  4. 修復 skill-creator 和 skill-governance-skill 中的重複 DLP 區塊
- **預防措施**：建立本 SOP，禁止批次指令碼操作

### 事故 #2：Health Guard 偽陽性誤判
- **日期**：2026-04-17 08:25
- **嚴重等級**：🟡 LOW
- **根因**：`health_guard.js` 未排除 code block 內的 DLP 標題，導致把教學用的 DLP 示例也算作真實感染
- **影響範圍**：`skill-creator`、`skill-governance-skill` 被錯誤標記 CRITICAL
- **修復**：更新健康檢查邏輯，在掃描前先 strip 所有 ``` 程式碼區塊
- **結果**：重新掃描後 53/53 全數透過 ✅

### 事故 #3：瀏覽器快取殘留（低影響）
- **日期**：2026-04-17
- **嚴重等級**：🟡 LOW
- **根因**：瀏覽器快取了舊版 HTML（01:01:30），未載入修復後的新版（01:17:03）
- **影響**：視覺驗證困難，但磁碟上的真實檔案是乾淨的
- **解決方式**：按 Ctrl+Shift+R 強制重新整理，或用新檔名開啟

---

## 📦 版本歷史

| 版本時間戳 | 型別 | 說明 |
|---|---|---|
| 20260417_020735 | 初始備份 | 修復根因後第一次備份 |
| 20260417_021237 | CLEAN 備份 | DLP 洪水清除後確認乾淨 |
| 20260417_082532 | FINAL CLEAN | Health Guard 透過後最終確認版 |
| 20260417_093304 | MIGRATE | v2 synergy 標籤遷移至 main，35 張卡片 data-parts 更新，v2 刪除 |
| 20260417_093340 | GOVERNANCE | 新增規則 7（新建網頁/儀錶板需 2 次使用者確認），SOP 升版至 v1.1 |

---

> **本檔案由 本協作系統 Agent 於 2026-04-17 建立**
> **修改本檔案的任何內容都需要使用者 2 次以上明確確認**


