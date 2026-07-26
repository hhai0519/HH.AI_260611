---
title: "系統架構守門員準則"
version: "3.1.3"
tags: ["SOP", "架構治理", "Governance", "Zero-Clutter"]
dependencies: ["00_Master_Menu.ps1"]
---

# 系統架構守門員準則 (Architecture Guardian SOP)

> **系統強制約束 (Pre-flight Hook)**
> 此文件為最高優先級設定。未來代理人在本目錄進行任何新建、修改、刪除動作前，都必須先讀取此文件作為「系統行為準則」。

## 1. 絕對零散落原則 (Zero-Clutter Policy)
- **根目錄 (`<USER_HOME>\Desktop\HH.AI_260726`)** 僅限存在：
  - `00_Master_Menu.ps1` (主控台入口)
  - `啟動系統.bat` (快捷啟動特許檔案)
  - `start_line.ps1` (特許代理入口 Proxy)
  - 隱藏設定檔 (如 `.vscode`、`.env`、`.git`)
- 其餘生成的任何暫存檔、腳本或說明檔，一律視為違規，必須被移入正確的子資料夾。

## 2. 強制性落地與命名決策樹 (Decision Tree)

當需要新增檔案時，強制執行以下判斷邏輯：

1. **[IF] 檔案是「任務流程、步驟導引、準則文件」：**
   - **落地層**：➔ 存入 `SOP/`
   - **命名規則**：`SOP_流水號_英文動作名稱.md` (例: `SOP_01_Init_Env.md`)

2. **[IF] 檔案是「單一功能、可重複執行的獨立 PowerShell 腳本」：**
   - **落地層**：➔ 存入 `Modules/`
   - **命名規則**：`動詞-名詞.ps1` (例: `Fix-Encoding.ps1`)。這使得純程式腳本與代理人技能完全解耦。

3. **[IF] 檔案是「AI 代理人系統技能目錄 (包含 `SKILL.md`)」：**
   - **落地層**：➔ 存入 `skills/` 並嚴格歸入三大子層級（`01_Orchestrators/`, `02_Cognitive/`, `03_Execution/`）
   - **命名規則**：嚴格遵守 **1:1 映射（無前綴）原則** ─ 實體目錄名稱必須與 `SKILL.md` YAML 標頭的 `name` 欄位完全一致。
   - **嚴禁**使用任何領域前綴（`sys-*`, `finance-*`, `tool-*`, `persona-*`）。此政策已於 V3.1.3 正式廢除。
   - **技能分類**：由 `Data/00_Skill_Manifest.json` 統一管理，不在目錄名稱中編碼。

4. **[IF] 檔案是「日誌、設定、歷史、待優化清單、資料庫」：**
   - **落地層**：➔ 存入 `Data/`
   - **命名規則**：保持語意清晰即可，建議使用 `.json` 或 `.md`。

## 3. 強制關聯更新 (Dependency Binding)
- **孤島防範**：每次新增 `SOP/` 或 `Skills/` 檔案（內建技能除外）時，必須確保它能被 `00_Master_Menu.ps1` 引用。
- **YAML 標頭約定**：所有 SOP 文件必須包含 YAML Frontmatter，且 `Dependencies` 欄位不得為空，必須寫明其前置依賴或入口。

---
*執行簽章：Agent File Governance Enforcement*
