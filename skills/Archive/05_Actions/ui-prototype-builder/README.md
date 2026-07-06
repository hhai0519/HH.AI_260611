<sub>🌐 <a href="README.en.md">English</a> · <b>中文</b></sub>

<div align="center">

# Huashu Design

> *「打字。回車。一份能交付的設計。」*
> *"Type. Hit enter. A finished design lands in your lap."*

[![License](https://img.shields.io/badge/License-Personal%20Use%20Only-orange.svg)](LICENSE)
[![Agent-Agnostic](https://img.shields.io/badge/Agent-Agnostic-blueviolet)](https://skills.sh)
[![Skills](https://img.shields.io/badge/skills.sh-Compatible-green)](https://skills.sh)

<br>

**在你的 agent 裡打一句話，拿回一份能交付的設計。**

<br>

3 到 30 分鐘，你能 ship 一段**產品釋出動畫**、一個能點選的 App 原型、一套能編輯的 PPT、一份印刷級的資訊圖。

不是「AI 做的還行」那種水平——是看起來像大廠設計團隊做的。給 skill 你的品牌資產（logo、色板、UI 截圖），它會讀懂你的品牌氣質；什麼都不給，內建的 20 種設計語彙也能兜底到不出 AI slop。

**你看到這篇 README 裡的每一個動畫，都是 huashu-design 自己做的。** 不是 Figma，不是 AE，就是一句話 prompt + skill 跑通。下次產品釋出要做宣傳片？現在你也能做。

```
npx skills add alchaincyf/huashu-design
```

跨 agent 通用——Claude Code、Cursor、Codex、OpenClaw、Hermes 都能裝。

[看效果](#demo-畫廊) · [安裝](#裝上就能用) · [能做什麼](#能做什麼) · [核心機制](#核心機制) · [和 Claude Design 的關係](#和-claude-design-的關係)

</div>

---

<p align="center">
  <img src="https://github.com/alchaincyf/huashu-design/releases/download/v2.0/hero-animation-v10-en.gif" alt="huashu-design Hero · 打字 → 選方向 → 畫廊展開 → 聚焦 → 品牌顯形" width="100%">
</p>

<p align="center"><sub>
  ▲ 25 秒 · Terminal → 4 方向 → Gallery ripple → 4 次 Focus → Brand reveal<br>
  👉 <a href="https://www.huasheng.ai/huashu-design-hero/">訪問帶音效的 HTML 互動版</a> ·
  <a href="https://github.com/alchaincyf/huashu-design/releases/download/v2.0/hero-animation-v10-en.mp4">下載 MP4（含 BGM+SFX · 10MB）</a>
</sub></p>

---

## 裝上就能用

```bash
npx skills add alchaincyf/huashu-design
```

然後在 Claude Code 裡直接說話：

```
「做一份 AI 心理學的演講 PPT，推薦 3 個風格方向讓我選」
「做個 AI 番茄鍾 iOS 原型，4 個核心螢幕要真能點選」
「把這段邏輯做成 60 秒動畫，匯出 MP4 和 GIF」
「幫我對這個設計做一個 5 維度評審」
```

沒有按鈕、沒有面板、沒有 Figma 外掛。

---

## Star 趨勢

<p align="center">
  <a href="https://star-history.com/#alchaincyf/huashu-design&Date">
    <img src="https://api.star-history.com/svg?repos=alchaincyf/huashu-design&type=Date" alt="huashu-design Star History" width="80%">
  </a>
</p>

---

## 能做什麼

| 能力 | 交付物 | 典型耗時 |
|------|--------|----------|
| 互動原型（App / Web） | 單檔案 HTML · 真 iPhone bezel · 可點選 · Playwright 驗證 | 10–15 min |
| 演講幻燈片 | HTML deck（瀏覽器演講）+ 可編輯 PPTX（文字框保留） | 15–25 min |
| 時間軸動畫 | MP4（25fps / 60fps 插幀）+ GIF（palette 最佳化）+ BGM | 8–12 min |
| 設計變體 | 3+ 並排對比 · Tweaks 實時調參 · 跨維度探索 | 10 min |
| 資訊圖 / 視覺化 | 印刷級排版 · 可導 PDF/PNG/SVG | 10 min |
| 設計方向顧問 | 5 流派 × 20 種設計哲學 · 推薦 3 方向 · 並行生成 Demo | 5 min |
| 5 維度專家評審 | 雷達圖 + Keep/Fix/Quick Wins · 可操作修復清單 | 3 min |

---

## Demo 畫廊

### 設計方向顧問

模糊需求時的 fallback：從 5 流派 × 20 種設計哲學裡挑 3 個差異化方向，並行生成 3 個 Demo 讓你選。

<p align="center"><img src="https://github.com/alchaincyf/huashu-design/releases/download/v2.0/w3-fallback-advisor.gif" width="100%"></p>

### iOS App 原型

iPhone 15 Pro 精確機身（靈動島 / 狀態列 / Home Indicator）· 狀態驅動多屏切換 · 真圖從 Wikimedia/Met/Unsplash 取 · Playwright 自動點選測試。

<p align="center"><img src="https://github.com/alchaincyf/huashu-design/releases/download/v2.0/c1-ios-prototype.gif" width="100%"></p>

### Motion Design 引擎

Stage + Sprite 時間片段模型 · `useTime` / `useSprite` / `interpolate` / `Easing` 四 API 覆蓋所有動畫需求 · 一條命令匯出 MP4 / GIF / 60fps 插幀 / 帶 BGM 的成片。

<p align="center"><img src="https://github.com/alchaincyf/huashu-design/releases/download/v2.0/c3-motion-design.gif" width="100%"></p>

### HTML Slides → 可編輯 PPTX

HTML deck 瀏覽器演講 · `html2pptx.js` 讀 DOM 的 computedStyle 逐元素翻譯成 PowerPoint 物件 · 匯出的是**真文字框**，不是圖片鋪底。

<p align="center"><img src="https://github.com/alchaincyf/huashu-design/releases/download/v2.0/c2-slides-pptx.gif" width="100%"></p>

### Tweaks · 實時變體切換

配色 / 字型 / 資訊密度等引數化 · 側邊面板切換 · 純前端 + `localStorage` 持久化 · 重新整理不丟。

<p align="center"><img src="https://github.com/alchaincyf/huashu-design/releases/download/v2.0/c4-tweaks.gif" width="100%"></p>

### 資訊圖 / 資料視覺化

雜誌級排版 · CSS Grid 精準分欄 · `text-wrap: pretty` 排印細節 · 真資料驅動 · 可導 PDF 向量 / PNG 300dpi / SVG。

<p align="center"><img src="https://github.com/alchaincyf/huashu-design/releases/download/v2.0/c5-infographic.gif" width="100%"></p>

### 5 維度專家評審

哲學一致性 · 視覺層級 · 細節執行 · 功能性 · 創新性 各 0–10 分 · 雷達圖視覺化 · 輸出 Keep / Fix / Quick Wins 清單。

<p align="center"><img src="https://github.com/alchaincyf/huashu-design/releases/download/v2.0/c6-expert-review.gif" width="100%"></p>

### Junior Designer 工作流

不悶頭做大招：先寫 assumptions + placeholders + reasoning，儘早 show 給你，再迭代。理解錯了早改比晚改便宜 100 倍。

<p align="center"><img src="https://github.com/alchaincyf/huashu-design/releases/download/v2.0/w2-junior-designer.gif" width="100%"></p>

### 品牌資產協議 5 步硬流程

涉及具體品牌時強制執行：問 → 搜 → 下載（三條兜底）→ grep 色值 → 寫 `brand-spec.md`。

<p align="center"><img src="https://github.com/alchaincyf/huashu-design/releases/download/v2.0/w1-brand-protocol.gif" width="100%"></p>

---

## 核心機制

### 品牌資產協議

skill 裡最硬的一段規則。涉及具體品牌（Stripe、Linear、Anthropic、自家公司等）時強制執行 5 步：

| 步驟 | 動作 | 目的 |
|------|------|------|
| 1 · 問 | 使用者有 brand guidelines 嗎？ | 尊重已有資源 |
| 2 · 搜官方品牌頁 | `<brand>.com/brand` · `brand.<brand>.com` · `<brand>.com/press` | 抓權威色值 |
| 3 · 下載資產 | SVG 檔案 → 官網 HTML 全文 → 產品截圖取色 | 三條兜底，前一條失敗立刻走下一條 |
| 4 · grep 提取色值 | 從資產裡抓所有 `#xxxxxx`，按頻率排序，過濾黑白灰 | **絕不從記憶猜品牌色** |
| 5 · 固化 spec | 寫 `brand-spec.md` + CSS 變數，所有 HTML 引用 `var(--brand-*)` | 不固化就會忘 |

A/B 測試（v1 vs v2，各跑 6 agent）：**v2 的穩定性方差比 v1 低 5 倍**。穩定性的穩定性，這是 skill 真正的護城河。

### 設計方向顧問（Fallback）

當使用者需求模糊到無法著手時觸發：

- 不憑通用直覺硬做，進入 Fallback 模式
- 從 5 流派 × 20 種設計哲學裡推薦 3 個**必須來自不同流派**的差異化方向
- 每個方向配代表作、氣質關鍵詞、代表設計師
- 並行生成 3 個視覺 Demo 讓使用者選
- 選定後進入主幹 Junior Designer 流程

### Junior Designer 工作流

預設工作模式，貫穿所有任務：

- 開工前 show 問題清單一次性發給使用者，等批次答完再動手
- HTML 裡先寫 assumptions + placeholders + reasoning comments
- 儘早 show 給使用者（哪怕只是灰色方塊）
- 填充實際內容 → variations → Tweaks 這三步分別再 show 一次
- 交付前用 Playwright 肉眼過一遍瀏覽器

### 反 AI slop 規則

避免一眼 AI 的視覺最大公約數（紫漸變 / emoji 圖示 / 圓角+左 border accent / SVG 畫人臉 / Inter 做 display）。用 `text-wrap: pretty` + CSS Grid + 精心選擇的 serif display 和 oklch 色彩。

---

## 和 Claude Design 的關係

我大方承認：品牌資產協議的哲學是從 Claude Design 流傳出來的提示詞裡偷師的。那份提示詞反覆強調**好的高保真設計不是從白紙開始，而是從已有的設計上下文長出來**。這個原則是 65 分作品和 90 分作品的分水嶺。

定位差異：

| | Claude Design | huashu-design |
|---|---|---|
| 形態 | 網頁產品（瀏覽器裡用） | skill（Claude Code 裡用） |
| 配額 | 訂閱 quota | API 消耗 · 並行跑 agent 不受 quota 限 |
| 交付物 | 畫布內 + 可導 Figma | HTML / MP4 / GIF / 可編輯 PPTX / PDF |
| 操作方式 | GUI（點、拖、改） | 對話（說話、等 agent 做完） |
| 複雜動畫 | 有限 | Stage + Sprite 時間軸 · 60fps 匯出 |
| 跨 agent | 專屬 Claude.ai | 任意 skill 相容 agent |

Claude Design 是**更好的圖形工具**，huashu-design 是**讓圖形工具這層消失**。兩條路，不同受眾。

---

## Limitations

- **不支援圖層級可編輯的 PPTX 到 Figma**。產出 HTML，可截圖、錄屏、導圖，但不能拖進 Keynote 改文字位置。
- **Framer Motion 級別的複雜動畫不行**。3D、物理模擬、粒子系統超出 skill 邊界。
- **完全空白的品牌從零設計質量會掉到 60–65 分**。憑空畫 hi-fi 本來就是 last resort。

這是一個 80 分的 skill，不是 100 分的產品。對不願意開啟圖形介面的人，80 分的 skill 比 100 分的產品好用。

---

## 倉庫結構

```
huashu-design/
├── SKILL.md                 # 主檔案（給 agent 讀）
├── README.md                # 本檔案（給使用者讀）
├── assets/                  # Starter Components
│   ├── animations.jsx       # Stage + Sprite + Easing + interpolate
│   ├── ios_frame.jsx        # iPhone 15 Pro bezel
│   ├── android_frame.jsx
│   ├── macos_window.jsx
│   ├── browser_window.jsx
│   ├── deck_stage.js        # HTML 幻燈片引擎
│   ├── deck_index.html      # 多檔案 deck 拼接器
│   ├── design_canvas.jsx    # 並排變體展示
│   ├── showcases/           # 24 個預製樣例（8 場景 × 3 風格）
│   └── bgm-*.mp3            # 6 首場景化背景音樂
├── references/              # 按任務深入讀的子檔案
│   ├── animation-pitfalls.md
│   ├── design-styles.md     # 20 種設計哲學詳細庫
│   ├── slide-decks.md
│   ├── editable-pptx.md
│   ├── critique-guide.md
│   ├── video-export.md
│   └── ...
├── scripts/                 # 匯出工具鏈
│   ├── render-video.js      # HTML → MP4
│   ├── convert-formats.sh   # MP4 → 60fps + GIF
│   ├── add-music.sh         # MP4 + BGM
│   ├── export_deck_pdf.mjs
│   ├── export_deck_pptx.mjs
│   ├── html2pptx.js
│   └── verify.py
└── demos/                   # 9 個能力演示 (c*/w*)，中英雙版 GIF/MP4/HTML + hero v10
```

---

## 起源

Anthropic 釋出 Claude Design 那天我玩到凌晨四點。幾天之後發現自己再也沒點開過它，不是它不好——它是這個賽道目前最成熟的產品——是我寧願讓 agent 在終端裡幫我幹活，也不願意開啟任何圖形介面。

於是讓 agent 拆解 Claude Design 本身（包括社群流傳的系統提示詞、品牌資產協議、元件機制），蒸餾成結構化 spec，再寫成 skill 裝進自己的 Claude Code。

感謝 Anthropic 把 Claude Design 的提示詞寫得清晰。這種基於其他產品靈感的二次創作，是開源文化在 AI 時代的新形態。

---

## License · 使用授權

**個人使用免費、自由**——學習、研究、創作、給自己做東西、寫文章、做副業、發微博發公眾號，隨便用，不用打招呼。

**企業商用禁止**——任何公司、團隊、或以盈利為目的的組織，想把本 skill 整合到產品、對外服務、給客戶交付工作中使用，**必須先和花生聯絡獲得授權**。包括但不限於：
- 把 skill 作為公司內部工具鏈的一部分
- 把 skill 產出物作為對外交付物的主要創作手段
- 基於 skill 二次開發做成商業產品
- 在客戶商單專案中使用

**商用授權聯絡方式**見下方社交平臺。

---

## Connect · 花生（花叔）

花生是 AI Native Coder、獨立開發者、AI 自媒體博主。代表作：小貓補光燈（AppStore 付費榜 Top 1）、《一本書玩轉 DeepSeek》、女媧 .skill（GitHub 12000+ star）。自媒體全平臺 30 萬+ 粉絲。

| 平臺 | 賬號 | 連結 |
|---|---|---|
| X / Twitter | @AlchainHust | https://x.com/AlchainHust |
| 公眾號 | 花叔 | 微信搜尋「花叔」 |
| B 站 | 花叔 | https://space.bilibili.com/14097567 |
| YouTube | 花叔 | https://www.youtube.com/@Alchain |
| 小紅書 | 花叔 | https://www.xiaohongshu.com/user/profile/5abc6f17e8ac2b109179dfdf |
| 官網 | huasheng.ai | https://www.huasheng.ai/ |
| 開發者主頁 | bookai.top | https://bookai.top |

商用授權、合作諮詢、自媒體約稿 → 以上任一平臺私信花生即可。
