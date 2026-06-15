# CHANGELOG

## v1.4.0 — 2026-04-22

### 重要改動
- **Skill 改名**：`huashu-design` → `claude-design`；全站替換 SKILL.md / references / canvas-art.md 中的品牌名稱（README 中指向原始倉庫的外部 URL 保留不動）

### 新增
- `references/canvas-art.md`：整併 canvas-design skill——靜態藝術創作模式（設計哲學宣言 → Canvas 表達 → 精煉 Pass → 多頁選項），輸出 PNG/PDF

### 修改
- `SKILL.md` frontmatter：版本升至 1.4.0；description 更新品牌名稱；觸發詞換為自然口語（移除 canvas art / static art / PNG export 等低命中詞，改為「做張海報、做張圖、出圖、做藝術感的」等）
- `SKILL.md` 速查入口：新增「做海報 / 靜態藝術 / PNG / PDF → canvas-art.md」一行
- `SKILL.md` 使用前提：補入「靜態藝術創作」適用場景說明
- `SKILL.md` References 路由表：補入 canvas-art.md 條目
- `references/audio-design-rules.md`、`sfx-library.md`、`video-export.md`：品牌名更新

---

## v1.3.0 — 2026-04-22

### 新增
- `references/session-tracking.md`：Session 透明度與跨工作階段狀態追蹤（複雜度預估、_project-state.json、進度快照、脈絡管理、自動命名）
- `references/windows-setup.md`：Windows 環境完整設定指南（Git Bash、WSL、ffmpeg、Playwright、瀏覽器開啟 HTML）
- `SKILL.md` 速查入口首屏路由表
- `SKILL.md` 環境限制說明表格（明確標註僅限 claude.ai Artifacts 的功能）
- `references/tweaks-system.md` 補入 claude.ai Artifacts 原生 Tweaks postMessage 協議

### 修正
- `references/verification.md`：修正硬編碼絕對路徑 → `{skill-root}/`；補入 Windows 開瀏覽器指令
- `references/video-export.md`：修正絕對路徑 → `$SKILL` 相對變數
- `SKILL.md`：投影片標籤必須從 1 開始計數警告（0 起始導致每次引用錯一位）
- `SKILL.md`：`nano-banana-pro` 改為「AI 影象生成工具」並說明可用工具（Gemini / DALL-E / Flux 等）
- `SKILL.md`：版權保護規則（§3.5 禁止重建有版權的 UI）
- `SKILL.md`：App 原型通則補入「禁止加標題屏」

### 最佳化
- `SKILL.md`：frontmatter 加入 `version` 和 `updated` 欄位
- `SKILL.md`：觸發詞補入完整繁體中文 + 17 個英文觸發詞
- `references/session-tracking.md` → `references/tweaks-system.md` → `references/windows-setup.md` 加入 References 路由表

---

## v1.2.0 — 2026-04-20（原版作者 alchaincyf 釋出）

- 品牌資產協議從「品牌色值協議」升級為「核心資產協議」（v1.1）
  - 新增：Logo（任何品牌必需）
  - 新增：產品圖（實體產品必需）
  - 新增：UI 截圖（數字產品必需）
  - 新增：5-10-2-8 素材質量門檻
- 核心原則 #0：事實驗證先於假設（由 DJI Pocket 4 真實踩坑觸發）
- 修正：CSS 剪影/SVG 手畫代替真實產品圖的反模式記錄
- `scripts/export_deck_stage_pdf.mjs` 新增（處理單檔案 deck-stage shadow DOM 匯出坑）

---

## v1.1.0 — 2026-02-13（原版作者 alchaincyf 釋出）

- 初始公開版本
- 核心能力：高保真原型 / 設計變體 / 幻燈片 / 動畫 Demo / 資訊圖
- 品牌色值協議（v1.0）
- App/iOS 原型專屬守則
- 動畫 → MP4/GIF 影片匯出流水線（含 BGM/SFX）
- 設計方向顧問模式（20 種設計哲學）
- 專家 5 維度評審
