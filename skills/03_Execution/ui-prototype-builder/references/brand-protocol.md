# 核心資產協議 · 完整 5 步操作流程

> 從 SKILL.md §1.a 抽取的完整操作細節。主幹檔案保留核心理念與執行紀律；本檔案提供可操作的搜尋路徑、下載指令碼、brand-spec.md 模板。

---

## 5 步硬流程（每步有 fallback，絕不靜默跳過）

### Step 1 · 問（資產清單一次問全）

不要只問「有 brand guidelines 嗎？」——太寬泛，使用者不知道該給什麼。按清單逐項問：

```
關於 <brand/product>，你手上有以下哪些資料？我按優先順序列：
1. Logo（SVG / 高畫質 PNG）—— 任何品牌必備
2. 產品圖 / 官方渲染圖 —— 實體產品必備（如 DJI Pocket 4 的產品照）
3. UI 截圖 / 介面素材 —— 數字產品必備（如 App 主要頁面截圖）
4. 色值清單（HEX / RGB / 品牌色盤）
5. 字型清單（Display / Body）
6. Brand guidelines PDF / Figma design system / 品牌官網連結

有的直接發我，沒有的我去搜/抓/生成。
```

### Step 2 · 搜官方渠道（按資產型別）

| 資產 | 搜尋路徑 |
|---|---|
| **Logo** | `<brand>.com/brand` · `<brand>.com/press` · `<brand>.com/press-kit` · `brand.<brand>.com` · 官網 header 的 inline SVG |
| **產品圖/渲染圖** | `<brand>.com/<product>` 產品詳情頁 hero image + gallery · 官方 YouTube launch film 截幀 · 官方新聞稿附圖 |
| **UI 截圖** | App Store / Google Play 產品頁截圖 · 官網 screenshots section · 產品官方演示影片截幀 |
| **色值** | 官網 inline CSS / Tailwind config / brand guidelines PDF |
| **字型** | 官網 `<link rel="stylesheet">` 引用 · Google Fonts 追蹤 · brand guidelines |

`WebSearch` 兜底關鍵詞：
- Logo 找不到 → `<brand> logo download SVG`、`<brand> press kit`
- 產品圖找不到 → `<brand> <product> official renders`、`<brand> <product> product photography`
- UI 找不到 → `<brand> app screenshots`、`<brand> dashboard UI`

### Step 3 · 下載資產 · 按型別三條兜底路徑

**3.1 Logo（任何品牌必需）**

三條路徑按成功率遞減：
1. 獨立 SVG/PNG 檔案（最理想）：
   ```bash
   curl -o assets/<brand>-brand/logo.svg https://<brand>.com/logo.svg
   curl -o assets/<brand>-brand/logo-white.svg https://<brand>.com/logo-white.svg
   ```
2. 官網 HTML 全文提取 inline SVG（80% 場景必用）：
   ```bash
   curl -A "Mozilla/5.0" -L https://<brand>.com -o assets/<brand>-brand/homepage.html
   # 然後 grep <svg>...</svg> 提取 logo 節點
   ```
3. 官方社交媒體 avatar（最後手段）：GitHub/Twitter/LinkedIn 的公司頭像通常是 400×400 或 800×800 透明底 PNG

**3.2 產品圖/渲染圖（實體產品必需）**

按優先順序：
1. **官方產品頁 hero image**（最高優先順序）：右鍵檢視圖片地址 / curl 獲取。解析度通常 2000px+
2. **官方 press kit**：`<brand>.com/press` 常有高畫質產品圖下載
3. **官方 launch video 截幀**：用 `yt-dlp` 下載 YouTube 影片，ffmpeg 抽幾幀高畫質圖
4. **Wikimedia Commons**：公共領域常有
5. **AI 影象生成工具兜底**（Gemini Imagen / DALL-E / Flux）：把真實產品圖作為參考，生成符合動畫場景的變體。**不要用 CSS/SVG 手畫代替**

```bash
# 示例：下載 DJI 官網產品 hero image
curl -A "Mozilla/5.0" -L "<hero-image-url>" -o assets/<brand>-brand/product-hero.png
```

**3.3 UI 截圖（數字產品必需）**

- App Store / Google Play 的產品截圖（注意：可能是 mockup 而非真實 UI，要對比）
- 官網 screenshots section
- 產品演示影片截幀
- 產品官方 Twitter/X 的釋出截圖（常是最新版本）
- 使用者有賬號時，直接截圖真實產品介面

**3.4 · 素材質量門檻「5-10-2-8」原則（鐵律）**

> **Logo 的規則不同於其他素材**。Logo 有就必須用；其他素材遵循「5-10-2-8」質量門檻。

| 維度 | 標準 | 反模式 |
|---|---|---|
| **5 輪搜尋** | 多渠道交叉搜（官網 / press kit / 官方社媒 / YouTube 截幀 / Wikimedia / 使用者賬號截圖），不是一輪抓前 2 個就停 | 第一頁結果直接用 |
| **10 個候選** | 至少湊 10 個備選才開始篩 | 只抓 2 個，沒得選 |
| **選 2 個好的** | 從 10 個裡精選 2 個作為最終素材 | 全都用 = 視覺過載 + 品位稀釋 |
| **每個 8/10 分以上** | 不夠 8 分**寧可不用**，用誠實 placeholder 或 AI 生成 | 湊數 7 分素材進 brand-spec.md |

**8/10 評分維度**（打分時記錄在 `brand-spec.md`）：
1. **解析度** · ≥2000px（印刷/大屏場景 ≥3000px）
2. **版權清晰度** · 官方來源 > 公共領域 > 免費素材 > 疑似盜圖（疑似盜圖直接 0 分）
3. **與品牌氣質契合度** · 和 brand-spec.md 裡的「氣質關鍵詞」一致
4. **光線/構圖/風格一致性** · 2 個素材放一起不打架
5. **獨立敘事能力** · 能單獨表達一個敘事角色（不是裝飾）

### Step 4 · 驗證 + 提取（不只是 grep 色值）

| 資產 | 驗證動作 |
|---|---|
| **Logo** | 檔案存在 + SVG/PNG 可開啟 + 至少兩個版本（深底/淺底用）+ 透明背景 |
| **產品圖** | 至少一張 2000px+ 解析度 + 去背或乾淨背景 + 多個角度（主視角、細節、場景） |
| **UI 截圖** | 解析度真實（1x / 2x）+ 是最新版本（不是舊版）+ 無使用者資料汙染 |
| **色值** | `grep -hoE '#[0-9A-Fa-f]{6}' assets/<brand>-brand/*.{svg,html,css} \| sort \| uniq -c \| sort -rn \| head -20`，過濾黑白灰 |

**警惕示範品牌汙染**：產品截圖裡常有使用者 demo 的品牌色，那不是該工具/品牌的色。**同時出現兩種強色時必須區分**。

**品牌多切面**：官網營銷色和產品 UI 色經常不同（如 Lovart 官網暖米+橙，產品 UI 是 Charcoal + Lime）——**兩套都是真的**，根據交付場景選合適的切面。

### Step 5 · 固化為 `brand-spec.md`

```markdown
# <Brand> · Brand Spec
> 採集日期：YYYY-MM-DD
> 資產來源：<列出下載來源>
> 資產完整度：<完整 / 部分 / 推斷>

## 🎯 核心資產（一等公民）

### Logo
- 主版本：`assets/<brand>-brand/logo.svg`
- 淺底反色版：`assets/<brand>-brand/logo-white.svg`
- 使用場景：<片頭/片尾/角落水印/全域性>
- 禁用變形：<不能拉伸/改色/加描邊>

### 產品圖（實體產品必填）
- 主視角：`assets/<brand>-brand/product-hero.png`（2000×1500）
- 細節圖：`assets/<brand>-brand/product-detail-1.png` / `product-detail-2.png`
- 場景圖：`assets/<brand>-brand/product-scene.png`
- 使用場景：<特寫/旋轉/對比>

### UI 截圖（數字產品必填）
- 主頁：`assets/<brand>-brand/ui-home.png`
- 核心功能：`assets/<brand>-brand/ui-feature-<name>.png`
- 使用場景：<產品展示/Dashboard 漸現/對比演示>

## 🎨 輔助資產

### 色板
- Primary: #XXXXXX  <來源標註>
- Background: #XXXXXX
- Ink: #XXXXXX
- Accent: #XXXXXX
- 禁用色: <品牌明確不用的色系>

### 字型
- Display: <font stack>
- Body: <font stack>
- Mono（資料 HUD 用）: <font stack>

### 簽名細節
- <哪些細節是「120% 做到」的>

### 禁區
- <明確不能做的>

### 氣質關鍵詞
- <3-5 個形容詞>
```

---

## 全流程失敗兜底

| 缺失 | 處理 |
|---|---|
| **Logo 完全找不到** | **停下問使用者**，不要硬做 |
| **產品圖（實體產品）找不到** | AI 影象生成工具（以官方參考圖為基底）→ 向使用者索取 → 誠實 placeholder（灰塊+文字標籤） |
| **UI 截圖（數字產品）找不到** | 向使用者索取賬號截圖 → 官方演示影片截幀。不用 mockup 生成器湊 |
| **色值完全找不到** | 按「設計方向顧問模式」走，推薦 3 個方向並標註 assumption |

**禁止**：找不到資產就靜默用 CSS 剪影/通用漸變硬做——這是協議最大的反 pattern。**寧可停下問，也不要湊**。
