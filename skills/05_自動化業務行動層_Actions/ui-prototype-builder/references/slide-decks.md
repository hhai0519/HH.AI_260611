# Slide Decks：HTML幻燈片製作規範

做幻燈片是設計工作的高頻場景。這份檔案說明怎麼做好HTML幻燈片——從架構選型、單頁設計，到 PDF/PPTX 匯出的完整路徑。

**本 skill 的能力覆蓋**：
- HTML 播放/PDF 匯出 → 本檔案 + `scripts/export_deck_pdf.mjs` / `scripts/export_deck_stage_pdf.mjs`
- 可編輯 PPTX 匯出 → `references/editable-pptx.md` + `scripts/html2pptx.js` + `scripts/export_deck_pptx.mjs --mode editable`
- 圖片鋪底 PPTX（不可編輯但視覺保真）→ `scripts/export_deck_pptx.mjs --mode image`

---

## 🛑 開工前先確認交付格式（最硬的 checkpoint）

**這個決策比「單檔案還是多檔案」更先。** 2026-04-20 期權私董會專案實測：**不在動手前確認交付格式 = 2-3 小時返工。**

### 決策樹

```
│ 問：最終要交付什麼？
├── 只要瀏覽器全屏演講 / 本地 HTML    → 視覺最自由，隨便做
├── 要 PDF（列印 / 發群 / 存檔）      → 視覺最自由，任何架構都能匯出
└── 要可編輯 PPTX（同事會改文字）    → 🛑 從第一行 HTML 開始就按 `references/editable-pptx.md` 的 4 條硬約束寫
```

### 為什麼「要 PPTX 就得從頭走 Path A」

PPTX 可編輯的前提是 `html2pptx.js` 能把 DOM 逐元素翻譯為 PowerPoint 物件。它需要 **4 條硬約束**：

1. body 固定 720pt × 405pt（不是 1920×1080px）
2. 所有文字包在 `<p>`/`<h1>`-`<h6>` 裡（禁止 div 直接放文字，禁止用 `<span>` 承載主文字）
3. `<p>`/`<h*>` 自身不能有 background/border/shadow（放外層 div）
4. `<div>` 不能用 `background-image`（用 `<img>` 標籤）
5. 不用 CSS gradient、不用 web component、不用複雜 SVG 裝飾

**本 skill 預設的 HTML 視覺自由度高**——大量 span、巢狀 flex、複雜 SVG、web component（如 `<deck-stage>`）、CSS 漸變——**幾乎沒有一條能天然過 html2pptx 的約束**（實測視覺驅動的 HTML 直接上 html2pptx，pass 率 < 30%）。

### 兩條真實路徑的代價對比（2026-04-20 真實踩坑）

| 路徑 | 做法 | 結果 | 代價 |
|------|------|------|------|
| ❌ **先自由寫 HTML，事後補救 PPTX** | 單檔案 deck-stage + 大量 SVG/span 裝飾 | 要可編輯 PPTX 只剩兩條路：<br>A. 手寫 pptxgenjs 幾百行 hardcode 座標<br>B. 重寫 17 頁 HTML 成 Path A 格式 | 2-3 小時返工，且手寫版**維護成本永續**（HTML 改一個字，PPTX 要再人肉同步） |
| ✅ **從第一步按 Path A 約束寫** | 每頁獨立 HTML + 4 條硬約束 + 720×405pt | 一條命令匯出 100% 可編輯 PPTX，同時也能瀏覽器全屏演講（Path A HTML 就是瀏覽器可播放的標準 HTML） | 寫 HTML 時多花 5 分鐘想「文字怎麼包進 `<p>`」，零返工 |

### 開工話術（抄走即用）

> 動手之前先確認交付格式：
> - **瀏覽器演講 / PDF** → 我按設計自由度最大的方式做（可以用動畫、web component、複雜 SVG、CSS 漸變）
> - **需要可編輯 PPTX**（同事會改文字） → 我必須從一開始就按 `references/editable-pptx.md` 的 4 條硬約束寫 HTML。視覺能力會少一些（無漸變、無 web component、無複雜 SVG），但匯出就是一條命令的事
>
> 你選哪條？

### 混合交付怎麼辦

使用者說「我要 HTML 演講 **和** 可編輯 PPTX」——**這不是混合**，是 PPTX 需求覆蓋 HTML 需求。按 Path A 寫出來的 HTML 本身就能瀏覽器全屏演講（加個 `deck_index.html` 拼接器就行）。**沒有額外代價。**

使用者說「我要 PPTX **和** 動畫 / web component」——**這是真矛盾**。告訴使用者：要可編輯 PPTX 就得犧牲這些視覺能力。讓他做取捨，不要偷偷做手寫 pptxgenjs 方案（會變成永續維護債）。

### 事後才知道要 PPTX 怎麼辦（緊急補救）

極個別情況：HTML 已經寫好了才發現要 PPTX。此時兩個選項都不完美：

1. **圖片鋪底 PPTX**（`scripts/export_deck_pptx.mjs` image 模式）——視覺 100% 保真但文字不可編輯。適合「演講用 PPT 播放、不改內容」場景
2. **手寫 pptxgenjs 重建**（為每頁手寫 addText/addShape + 圖形 PNG 嵌入）——文字可編輯，但位置、字型、對齊都要手調，維護成本高。**只有使用者明確接受「HTML 源要改就得重新手調 PPTX」才走這條**

永遠優先把選擇告訴使用者，讓他決定。**永遠不要第一反應就開始手寫 pptxgenjs**——那是最後的兜底手段。

---

## 🛑 先定架構：單檔案 還是 多檔案？

**這個選擇是做幻燈片的第一步，錯了會反覆踩坑。先讀完這一節再動手。**

### 兩種架構對比

| 維度 | 單檔案 + `deck_stage.js` | **多檔案 + `deck_index.html` 拼接器** |
|------|--------------------------|--------------------------------------|
| 程式碼結構 | 一個 HTML，所有 slide 是 `<section>` | 每頁獨立 HTML，`index.html` 用 iframe 拼接 |
| CSS 作用域 | ❌ 全域性，一頁的樣式可能影響所有頁 | ✅ 天然隔離，iframe 各自一片天 |
| 驗證粒度 | ❌ 要 JS goTo 才能切到某頁 | ✅ 單頁檔案雙擊就能在瀏覽器看 |
| 並行開發 | ❌ 一個檔案，多 agent 改會衝突 | ✅ 多 agent 可並行做不同頁，零衝突 merge |
| 除錯難度 | ❌ 一處 CSS 出錯，全 deck 翻車 | ✅ 一頁出錯隻影響自己 |
| 內嵌互動 | ✅ 跨頁共享狀態很簡單 | 🟡 iframe 間需 postMessage |
| 列印 PDF | ✅ 內建 | ✅ 拼接器 beforeprint 遍歷 iframe |
| 鍵盤導航 | ✅ 內建 | ✅ 拼接器內建 |

### 選哪個？（決策樹）

```
│ 問：deck 預計有多少頁？
├── ≤10 頁、需要 in-deck 動畫或跨頁互動、pitch deck → 單檔案
└── ≥10 頁、學術講座、課件、長 deck、多 agent 並行 → 多檔案（推薦）
```

**預設走多檔案路徑**。它不是「備選」，是**長 deck 和團隊協作的主路徑**。原因：單檔案架構的每一個優勢（鍵盤導航、列印、scale）多檔案都有，而多檔案的作用域隔離和可驗證性是單檔案補不回來的。

### 為什麼這條規則這麼硬？（真實事故記錄）

單檔案架構曾經在 AI心理學講座 deck 製作中連踩四坑：

1. **CSS 特異性覆蓋**：`.emotion-slide { display: grid }` (特異性 10) 幹翻 `deck-stage > section { display: none }` (特異性 2)，導致所有頁同時渲染疊加。
2. **Shadow DOM slot 規則被外層 CSS 壓制**：`::slotted(section) { display: none }` 擋不住 outer rule 的覆蓋，sections 不肯隱藏。
3. **localStorage + hash 導航競態**：重新整理後不是跳到 hash 位置，而是停在 localStorage 記錄的舊位置。
4. **驗證成本高**：必須 `page.evaluate(d => d.goTo(n))` 才能截某頁，比直接 `goto(file://.../slides/05-X.html)` 慢一倍，還常報錯。

全部根因是**單一全域性名稱空間**——多檔案架構從物理層面把這些問題消除了。

---

## 路徑 A（預設）：多檔案架構

### 目錄結構

```
我的Deck/
├── index.html              # 從 assets/deck_index.html 複製來，改 MANIFEST
├── shared/
│   ├── tokens.css          # 共享設計 token（色板/字號/常用 chrome）
│   └── fonts.html          # <link> 引入 Google Fonts（每頁 include）
└── slides/
    ├── 01-cover.html       # 每個檔案都是完整 1920×1080 HTML
    ├── 02-agenda.html
    ├── 03-problem.html
    └── ...
```

### 每張 slide 的模板骨架

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>P05 · Chapter Title</title>
<link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">
<link rel="stylesheet" href="../shared/tokens.css">
<style>
  /* 這一頁獨有的樣式。用任何 class 名都不會汙染別的頁。*/
  body { padding: 120px; }
  .my-thing { ... }
</style>
</head>
<body>
  <!-- 1920×1080 的內容（由 body 的 width/height 在 tokens.css 裡鎖定）-->
  <div class="page-header">...</div>
  <div>...</div>
  <div class="page-footer">...</div>
</body>
</html>
```

**關鍵約束**：
- `<body>` 就是畫布，直接在上面佈局。不要包 `<section>` 或其他 wrapper。
- `width: 1920px; height: 1080px` 由 `shared/tokens.css` 裡的 `body` 規則鎖定。
- 引 `shared/tokens.css` 共享設計 token（色板、字號、page-header/footer 等）。
- 字型 `<link>` 每頁自己寫（fonts 單獨 import 不貴，且保證每頁獨立可開啟）。

### 拼接器：`deck_index.html`

**直接從 `assets/deck_index.html` 複製**。你只需要改一處——`window.DECK_MANIFEST` 陣列，按順序列出所有 slide 檔名和人類可讀標籤：

```js
window.DECK_MANIFEST = [
  { file: "slides/01-cover.html",    label: "封面" },
  { file: "slides/02-agenda.html",   label: "目錄" },
  { file: "slides/03-problem.html",  label: "問題陳述" },
  // ...
];
```

拼接器已內建：鍵盤導航（←/→/Home/End/數字鍵/P 列印）、scale + letterbox、右下計數器、localStorage 記憶、hash 跳頁、列印模式（遍歷 iframe 按頁輸出 PDF）。

### 單頁驗證（這是多檔案架構的殺手級優勢）

每張 slide 都是獨立 HTML。**做完一張就在瀏覽器雙擊開啟看**：

```bash
open slides/05-personas.html
```

Playwright 截圖也是直接 `goto(file://.../slides/05-personas.html)`，不需要 JS 跳頁，也不會被別的頁的 CSS 幹擾。這讓「改一點驗一點」的工作流成本接近零。

### 並行開發

把每張 slide 的任務拆給不同 agent，同時跑——HTML 檔案彼此獨立，merge 時沒有衝突。長 deck 用這種並行方式能把製作時間壓到 1/N。

### `shared/tokens.css` 該放什麼

只放**真正跨頁共用**的東西：

- CSS 變數（色板、字號階、間距階）
- `body { width: 1920px; height: 1080px; }` 這樣的 canvas 鎖定
- `.page-header` / `.page-footer` 這種每頁都用一模一樣的 chrome

**不要**把單頁的佈局 class 塞進來——那會退化回單檔案架構的全域性汙染問題。

---

## 路徑 B（小 deck）：單檔案 + `deck_stage.js`

適用於 ≤10 頁、需要跨頁共享狀態（比如一個 React tweaks 面板要操控所有頁）、或者做 pitch deck demo 這種要求極度緊湊的場景。

### 基本用法

1. 從 `assets/deck_stage.js` 讀取內容，嵌入 HTML 的 `<script>`（或 `<script src="deck_stage.js">`）
2. 在 body 裡用 `<deck-stage>` 包 slide
3. 🛑 **script 標籤必須放在 `</deck-stage>` 之後**（見下方硬約束）

```html
<body>

  <deck-stage>
    <section>
      <h1>Slide 1</h1>
    </section>
    <section>
      <h1>Slide 2</h1>
    </section>
  </deck-stage>

  <!-- ✅ 正確：script 在 deck-stage 之後 -->
  <script src="deck_stage.js"></script>

</body>
```

### 🛑 Script 位置硬約束（2026-04-20 真實踩坑）

**不能把 `<script src="deck_stage.js">` 放在 `<head>` 裡。** 即使它在 `<head>` 裡能定義 `customElements`，parser 在解析到 `<deck-stage>` 開始標籤時就會觸發 `connectedCallback`——此時子 `<section>` 還沒被 parse，`_collectSlides()` 拿到空陣列，counter 顯示 `1 / 0`，所有頁同時疊加渲染。

**三條合規寫法**（任選其一）：

```html
<!-- ✅ 最推薦：script 在 </deck-stage> 之後 -->
</deck-stage>
<script src="deck_stage.js"></script>

<!-- ✅ 也可：script 在 head 但加 defer -->
<head><script src="deck_stage.js" defer></script></head>

<!-- ✅ 也可：module 指令碼天然 defer -->
<head><script src="deck_stage.js" type="module"></script></head>
```

`deck_stage.js` 本身已內建 `DOMContentLoaded` 延遲收集防禦，即使 script 放 head 也不會徹底炸掉——但 `defer` 或放 body 底部仍然是更乾淨的做法，避免依賴防禦分支。

### ⚠️ 單檔案架構的 CSS 陷阱（務必閱讀）

單檔案架構最常見的坑——**`display` 屬性被單頁樣式偷走**。

常見錯誤姿勢 1（直接寫 display: flex 到 section）：

```css
/* ❌ 外部 CSS 特異性 2，覆蓋了 shadow DOM 的 ::slotted(section){display:none}（也是 2）*/
deck-stage > section {
  display: flex;            /* 所有頁會同時疊加渲染！ */
  flex-direction: column;
  padding: 80px;
  ...
}
```

常見錯誤姿勢 2（section 有特異性更高的 class）：

```css
.emotion-slide { display: grid; }   /* 特異性: 10，更糟 */
```

兩種都會讓 **所有 slide 同時疊加渲染**——counter 可能顯示 `1 / 10` 假裝正常，但視覺上第一頁蓋著第二頁蓋著第三頁。

### ✅ Starter CSS（開工直接 copy，不踩坑）

**section 自身**只管「可見/不可見」；**layout（flex/grid 等）寫到 `.active` 上**：

```css
/* section 只定義非 display 的通用樣式 */
deck-stage > section {
  background: var(--paper);
  padding: 80px 120px;
  overflow: hidden;
  position: relative;
  /* ⚠️ 不要在這裡寫 display! */
}

/* 鎖死「非啟用即隱藏」——特異性+權重雙保險 */
deck-stage > section:not(.active) {
  display: none !important;
}

/* 啟用頁才寫需要的 display + layout */
deck-stage > section.active {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* 列印模式：所有頁都要顯示，覆蓋 :not(.active) */
@media print {
  deck-stage > section { display: flex !important; }
  deck-stage > section:not(.active) { display: flex !important; }
}
```

替代方案：**把單頁的 flex/grid 寫到內部 wrapper `<div>` 上**，section 本身永遠只是 `display: block/none` 的切換器。這是最乾淨的做法：

```html
<deck-stage>
  <section>
    <div class="slide-content flex-layout">...</div>
  </section>
</deck-stage>
```

### 自定義尺寸

```html
<deck-stage width="1080" height="1920">
  <!-- 9:16 豎版 -->
</deck-stage>
```

---

## Slide Labels

Deck_stage 和 deck_index 都會給每頁打標籤（計數器顯示）。給它們**更有意義**的 label：

**多檔案**：在 `MANIFEST` 裡寫 `{ file, label: "04 問題陳述" }`
**單檔案**：在 section 上加 `<section data-screen-label="04 Problem Statement">`

**關鍵：Slide 編號從 1 開始，不要從 0**。

使用者說"slide 5"時，他指的是第 5 張，永遠不是陣列位置 `[4]`。人類不說 0-indexed。

---

## Speaker Notes

**預設不加**，只在使用者明確要求時才加。

加了 speaker notes 你就可以把 slide 上的文字減少到最小，focus on impactful visuals——notes 承載完整 script。

### 格式

**多檔案**：在 `index.html` 的 `<head>` 裡寫：

```html
<script type="application/json" id="speaker-notes">
[
  "第1張的 script...",
  "第2張的 script...",
  "..."
]
</script>
```

**單檔案**：同上位置。

### Notes 寫作要點

- **完整**：不是提綱，是真要講的話
- **對話式**：像平時說話，不是書面語
- **對應**：陣列第 N 個對應第 N 張 slide
- **長度**：200-400 字最佳
- **情緒線**：標註重音、停頓、強調點

---

## Slide 設計模式

### 1. 建立一個系統（必做）

探索完 design context 後，**先口頭說你要用的系統**：

```markdown
Deck系統：
- 背景色：最多2種（90% 白 + 10% 深色 section divider）
- 字型：display 用 Instrument Serif，body 用 Geist Sans
- 節奏：section divider 用 full-bleed 彩色 + 白字，普通 slide 白底
- 影象：hero slide 用 full-bleed 照片，data slide 用 chart

我按這個系統做，有問題告訴我。
```

使用者確認後再往下做。

### 2. 常用 slide layouts

- **Title slide**：純色背景 + 巨大標題 + 副標題 + 作者/日期
- **Section divider**：彩色背景 + 章節號 + 章節標題
- **Content slide**：白底 + 標題 + 1-3 bullet points
- **Data slide**：標題 + 大圖表/數字 + 簡短說明
- **Image slide**：full-bleed 照片 + 底部小 caption
- **Quote slide**：留白 + 巨大 quote + attribution
- **Two-column**：左右對比（vs / before-after / problem-solution）

一個 deck 裡最多用 4-5 種 layout。

### 3. Scale（再次強調）

- 正文最小 **24px**，理想 28-36px
- 標題 **60-120px**
- Hero 字 **180-240px**
- 幻燈片是給 10 米外看的，字要夠大

### 4. 視覺節奏

Deck 需要 **intentional variety**：

- 顏色節奏：大部分白底 + 偶爾彩色 section divider + 偶爾 dark 片段
- 密度節奏：幾張 text-heavy 的 + 幾張 image-heavy 的 + 幾張 quote 留白
- 字號節奏：正常標題 + 偶爾巨型 hero 文字

**不要每張 slide 長一樣**——那是 PPT 模板，不是設計。

### 5. 空間呼吸（資料密集頁必讀）

**新手最容易踩的坑**：把所有能放的資訊都塞進一頁。

資訊密度 ≠ 有效資訊傳達。學術/演講類 deck 尤其要剋制：

- 列表/矩陣頁：不要把 N 個元素都畫成同一大小。用 **主次分層**——今天要聊的 5 個放大做主角，剩下 16 個縮小做背景 hint。
- 大數字頁：數字本身是視覺主角。周圍的 caption 不要超過 3 行，否則觀眾眼球來回跳。
- 引用頁：引語和 attribution 之間要有留白隔開，不要貼在一起。

對照「資料是不是主角」「文字有沒有擠在一起」兩條自我審查，改到留白讓你有點不安為止。

---

## 列印為 PDF

**多檔案**：`deck_index.html` 已處理 `beforeprint` 事件，按頁輸出 PDF。

**單檔案**：`deck_stage.js` 同樣處理。

列印樣式已寫好，不需要額外寫 `@media print` CSS。

---

## 匯出為 PPTX / PDF（自助指令碼）

HTML 優先是第一公民。但使用者經常需要 PPTX/PDF 交付。提供兩個通用指令碼，**任何多檔案 deck 都能用**，位於 `scripts/` 下：

### `export_deck_pdf.mjs` — 匯出向量 PDF（多檔案架構）

```bash
node scripts/export_deck_pdf.mjs --slides <slides-dir> --out deck.pdf
```

**特點**：
- 文字**保留向量**（可複製、可搜尋）
- 視覺 100% 保真（Playwright 內嵌 Chromium 渲染後列印）
- **不需要改 HTML 任何一個字**
- 每個 slide 獨立 `page.pdf()`，再用 `pdf-lib` 合併

**依賴**：`npm install playwright pdf-lib`

**限制**：PDF 不能再編輯文字——要改回到 HTML 改。

### `export_deck_stage_pdf.mjs` — 單檔案 deck-stage 架構專用 ⚠️

**什麼時候用**：deck 是單 HTML 檔案 + `<deck-stage>` web component 包裹 N 個 `<section>`（即路徑 B 架構）。此時 `export_deck_pdf.mjs` 那套「每個 HTML 一次 `page.pdf()`」走不通，需要走這個專用指令碼。

```bash
node scripts/export_deck_stage_pdf.mjs --html deck.html --out deck.pdf
```

**為什麼不能複用 export_deck_pdf.mjs**（2026-04-20 真實踩坑記錄）：

1. **Shadow DOM 贏過 `!important`**：deck-stage 的 shadow CSS 裡有 `::slotted(section) { display: none }`（只 active 的那張 `display: block`）。即使在 light DOM 用 `@media print { deck-stage > section { display: block !important } }` 也壓不住——`page.pdf()` 觸發 print 媒體後 Chromium 最終渲染只有 active 那一張，結果**整個 PDF 只有 1 頁**（當前 active slide 的重複）。

2. **迴圈 goto 每頁還是隻出 1 頁**：直覺解法「對每個 `#slide-N` navigate 一次再 `page.pdf({pageRanges:'1'})`」也失敗——因為 print CSS 在 shadow DOM 之外也有 `deck-stage > section { display: block }` 規則被 override 後，最終渲染永遠是 section 列表的第一個（不是你 navigate 到的那一頁）。結果 17 次迴圈得到 17 張 P01 封面。

3. **absolute 子元素跑到下一頁**：即使成功讓所有 section 渲染出來，section 本身若 `position: static`，其 absolute 定位的 `cover-footer`/`slide-footer` 會相對 initial containing block 定位——當 section 被 print 強制為 1080px 高度，absolute footer 可能被推到下一頁（表現為 PDF 比 section 數量多 1 頁，多出來的那頁只含 footer 孤兒）。

**修復策略**（指令碼已實現）：

```js
// 開啟 HTML 後，用 page.evaluate 把 section 從 deck-stage slot 中提出來，
// 直接掛到 body 下一個普通 div 裡，並內聯 style 確保 position:relative + 固定尺寸
await page.evaluate(() => {
  const stage = document.querySelector('deck-stage');
  const sections = Array.from(stage.querySelectorAll(':scope > section'));
  document.head.appendChild(Object.assign(document.createElement('style'), {
    textContent: `
      @page { size: 1920px 1080px; margin: 0; }
      html, body { margin: 0 !important; padding: 0 !important; }
      deck-stage { display: none !important; }
    `,
  }));
  const container = document.createElement('div');
  sections.forEach(s => {
    s.style.cssText = 'width:1920px!important;height:1080px!important;display:block!important;position:relative!important;overflow:hidden!important;page-break-after:always!important;break-after:page!important;background:#F7F4EF;margin:0!important;padding:0!important;';
    container.appendChild(s);
  });
  // 最後一頁禁分頁，避免尾部空白頁
  sections[sections.length - 1].style.pageBreakAfter = 'auto';
  sections[sections.length - 1].style.breakAfter = 'auto';
  document.body.appendChild(container);
});

await page.pdf({ width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true });
```

**為什麼這能 work**：
- 把 section 從 shadow DOM slot 拔到 light DOM 的普通 div——徹底繞過 `::slotted(section) { display: none }` 規則
- 內聯 `position: relative` 讓 absolute 子元素相對 section 定位，不會溢位
- `page-break-after: always` 讓瀏覽器 print 時每 section 獨立一頁
- `:last-child` 不分頁避免尾部空白頁

**用 `mdls -name kMDItemNumberOfPages` 驗證時注意**：macOS 的 Spotlight metadata 有快取，PDF 重寫後要跑 `mdimport file.pdf` 強制重新整理，否則顯示舊的頁數。用 `pdfinfo` 或 `pdftoppm` 數檔案數才是真數。

---

### `export_deck_pptx.mjs` — 匯出 PPTX（兩種模式）

```bash
# 圖片鋪底（視覺 100% 保真，不可編輯文字）
node scripts/export_deck_pptx.mjs --slides <dir> --out deck.pptx --mode image

# 每個文字獨立文字框（可編輯，但字型會回落）
node scripts/export_deck_pptx.mjs --slides <dir> --out deck.pptx --mode editable
```

| 模式 | 視覺保真 | 文字可編輯 | 工作原理 | 限制 |
|------|---------|----------|---------|------|
| `image` | ✅ 100% | ❌ | Playwright 截圖 → pptxgenjs addImage | 文字變圖片 |
| `editable` | 🟡 ~70% | ✅ | html2pptx 提取每個文字框 | 見下方約束 |

**editable 模式的硬性約束**（使用者 HTML 必須滿足，否則該頁 skip）：
- 所有文字必須在 `<p>`/`<h1>`-`<h6>`/`<ul>`/`<ol>` 裡（禁止裸文字 div）
- `<p>`/`<h*>` 標籤自身不能有 background/border/shadow（放外層 div）
- 不用 `::before`/`::after` 插入裝飾文字（偽元素提不出來）
- inline 元素（span/em/strong）不能有 margin
- 不用 CSS gradient（不可渲染）
- div 不用 `background-image`（用 `<img>`）

指令碼已內建**自動前處理器**——把 "葉子 div 裡的裸文字" 自動包成 `<p>`（保留 class）。這解決了最常見的違規（裸文字）。但其他違規（p 上有 border、span 上有 margin 等）仍需 HTML 源頭合規。

**editable 模式的另一個 caveat——字型回落**：
- Playwright 用 webfont 測量 text-box 尺寸；PowerPoint/Keynote 用本機字型渲染
- 兩者不同時會有**溢位或錯位**——每頁都要肉眼過
- 建議目標機器裝好 HTML 裡用的字型，或 fallback 到 `system-ui`

### 從一開始就讓 HTML 對匯出友好

對效能最穩的 deck：**從寫 HTML 時就按 editable 模式的約束寫**。這樣 `--mode editable` 可以直接全部 pass。額外成本不大：

```html
<!-- ❌ 不好 -->
<div class="title">關鍵發現</div>

<!-- ✅ 好（p 包裹，class 繼承） -->
<p class="title">關鍵發現</p>

<!-- ❌ 不好（border 在 p 上） -->
<p class="stat" style="border-left: 3px solid red;">41%</p>

<!-- ✅ 好（border 在外層 div） -->
<div class="stat-wrap" style="border-left: 3px solid red;">
  <p class="stat">41%</p>
</div>
```

### 何時選哪個

| 場景 | 推薦 |
|------|------|
| 給主辦方/檔案存檔 | **PDF**（通用、高保真、文字可搜） |
| 發給協作者讓他們微調文字 | **PPTX editable**（接受字型回落） |
| 要現場演講、不改內容 | **PDF** 或 **PPTX image** |
| HTML 是首選呈現媒介 | 直接瀏覽器播放，匯出只是備份 |

## 匯出為可編輯 PPTX 的深度路徑（僅長期專案）

如果你的 deck 會長期維護、反覆修改、團隊協作——建議**一開始就按 html2pptx 約束寫 HTML**，讓 `--mode editable` 穩定透過。詳見 `references/editable-pptx.md`（4 條硬約束 + HTML 模板 + 常見錯誤速查）。

---

## 常見問題

**多檔案：iframe 裡的頁打不開 / 白屏**
→ 檢查 `MANIFEST` 的 `file` 路徑是否相對 `index.html` 正確。用瀏覽器 DevTools 看 iframe 的 src 能否直接訪問。

**多檔案：某頁樣式和別頁衝突**
→ 不可能（iframe 隔離）。如果感覺衝突，那是快取——Cmd+Shift+R 強刷。

**單檔案：多 slide 同時渲染疊加**
→ CSS 特異性問題。看上面「單檔案架構的 CSS 陷阱」一節。

**單檔案：縮放看起來不對**
→ 檢查是否所有 slide 直接掛在 `<deck-stage>` 下作為 `<section>`。中間不能包 `<div>`。

**單檔案：想跳到特定 slide**
→ URL 加 hash：`index.html#slide-5` 跳到第 5 張。

**兩種架構都適用：字在不同螢幕下位置不一致**
→ 用固定尺寸（1920×1080）和 `px` 單位，不要用 `vw`/`vh` 或 `%`。縮放統一處理。

---

## 驗證檢查清單（做完 deck 必過）

1. [ ] 瀏覽器直接開啟 `index.html`（或主 HTML），檢查首頁無破圖、字型已載入
2. [ ] 按 → 鍵翻到每一頁，沒有空白頁、沒有佈局錯位
3. [ ] 按 P 鍵列印預覽，每頁恰好一張 A4（或 1920×1080）且無裁切
4. [ ] 隨機選 3 頁 Cmd+Shift+R 強刷，localStorage 記憶正常工作
5. [ ] Playwright 批次截圖（單頁架構：遍歷 `slides/*.html`；單檔案架構：用 goTo 切換），人工肉眼過一遍
6. [ ] 搜一下 `TODO` / `placeholder` 殘留，確認都清理了
