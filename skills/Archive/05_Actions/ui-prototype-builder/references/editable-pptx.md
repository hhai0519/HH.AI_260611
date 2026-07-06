# 可編輯 PPTX 匯出：HTML 硬約束 + 尺寸決策 + 常見錯誤

本檔案講的是**用 `scripts/html2pptx.js` + `pptxgenjs` 把 HTML 逐元素翻譯成真·可編輯 PowerPoint 文字框**的路徑。和 `export_deck_pptx.mjs --mode image`（截圖鋪底、文字變圖片、不可編輯）是兩回事。

> **核心前提**：要走這條路，HTML 必須從第一行就按下面 4 條約束寫。**不是寫完再轉**——事後補救會觸發 2-3 小時返工（2026-04-20 期權私董會專案實測踩坑）。

---

## 畫布尺寸：用 960×540pt（LAYOUT_WIDE）

PPTX 單位是 **inch**（物理尺寸），不是 px。決策原則：body 的 computedStyle 尺寸要**匹配 presentation layout 的 inch 尺寸**（±0.1"，由 `html2pptx.js` 的 `validateDimensions` 強制檢查）。

### 3 個候選尺寸對比

| HTML body | 物理尺寸 | 對應 PPT layout | 何時選 |
|---|---|---|---|
| **`960pt × 540pt`** | **13.333″ × 7.5″** | **pptxgenjs `LAYOUT_WIDE`** | ✅ **預設推薦**（現代 PowerPoint 16:9 標配） |
| `720pt × 405pt` | 10″ × 5.625″ | 自定義 | 僅當使用者指定「老版 PowerPoint Widescreen」模板時 |
| `1920px × 1080px` | 20″ × 11.25″ | 自定義 | ❌ 非標尺寸，投影后字型顯得異常小 |

**別把 HTML 尺寸當解析度想。** PPTX 是向量檔案，body 尺寸決定的是**物理尺寸**不是清晰度。超大 body（20″×11.25″）不會讓文字更清晰——只會讓字號 pt 相對畫布變小，投影/列印時反而更難看。

### body 寫法三選一（等價）

```css
body { width: 960pt;  height: 540pt; }    /* 最清晰，推薦 */
body { width: 1280px; height: 720px; }    /* 等價，px 習慣 */
body { width: 13.333in; height: 7.5in; }  /* 等價，英寸直覺 */
```

配套的 pptxgenjs 程式碼：

```js
const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';  // 13.333 × 7.5 inch, 無需自定義
```

---

## 4 條硬約束（違反會直接報錯）

`html2pptx.js` 把 HTML 的 DOM 逐元素翻譯成 PowerPoint 物件。PowerPoint 的格式約束投射到 HTML 上 = 下面 4 條規則。

### 規則 1：DIV 裡不能直接寫文字 — 必須用 `<p>` 或 `<h1>`-`<h6>` 包裹

```html
<!-- ❌ 錯誤：文字直接在 div 裡 -->
<div class="title">Q3營收增長23%</div>

<!-- ✅ 正確：文字在 <p> 或 <h1>-<h6> 裡 -->
<div class="title"><h1>Q3營收增長23%</h1></div>
<div class="body"><p>新使用者是主要驅動力</p></div>
```

**為什麼**：PowerPoint 文字必須存在 text frame 裡，text frame 對應 HTML 的段落級元素（p/h*/li）。裸 `<div>` 在 PPTX 裡沒有對應的文字容器。

**也不能用 `<span>` 承載主文字**——span 是行內元素，沒法獨立對齊成文字框。span 只能**夾在 p/h\* 裡**做區域性樣式（加粗、換色）。

### 規則 2：不支援 CSS 漸變 — 只能用純色

```css
/* ❌ 錯誤 */
background: linear-gradient(to right, #FF6B6B, #4ECDC4);

/* ✅ 正確：純色 */
background: #FF6B6B;

/* ✅ 如果必須多色條紋，用 flex 子元素各自純色 */
.stripe-bar { display: flex; }
.stripe-bar div { flex: 1; }
.red   { background: #FF6B6B; }
.teal  { background: #4ECDC4; }
```

**為什麼**：PowerPoint 的 shape fill 只支援 solid/gradient-fill 兩種，但 pptxgenjs 的 `fill: { color: ... }` 只對映 solid。漸變走 PowerPoint 原生 gradient 需要另寫結構，目前工具鏈不支援。

### 規則 3：背景/邊框/陰影只能在 DIV 上，不能在文字標籤上

```html
<!-- ❌ 錯誤：<p> 有背景色 -->
<p style="background: #FFD700; border-radius: 4px;">重點內容</p>

<!-- ✅ 正確：外層 div 承載背景/邊框，<p> 只負責文字 -->
<div style="background: #FFD700; border-radius: 4px; padding: 8pt 12pt;">
  <p>重點內容</p>
</div>
```

**為什麼**：PowerPoint 裡 shape（方塊/圓角矩形）和 text frame 是兩個物件。HTML 的 `<p>` 只翻譯成 text frame，背景/邊框/陰影屬於 shape——必須在**包裹 text 的 div** 上寫。

### 規則 4：DIV 不能用 `background-image` — 用 `<img>` 標籤

```html
<!-- ❌ 錯誤 -->
<div style="background-image: url('chart.png')"></div>

<!-- ✅ 正確 -->
<img src="chart.png" style="position: absolute; left: 50%; top: 20%; width: 300pt; height: 200pt;" />
```

**為什麼**：`html2pptx.js` 只從 `<img>` 元素提取圖片路徑，不解析 CSS 的 `background-image` URL。

---

## Path A HTML 模板骨架

每張 slide 一個獨立 HTML 檔案，彼此作用域隔離（避開單檔案 deck 的 CSS 汙染）。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 960pt; height: 540pt;           /* ⚠️ 匹配 LAYOUT_WIDE */
    font-family: system-ui, -apple-system, "PingFang SC", sans-serif;
    background: #FEFEF9;                    /* 純色，不能漸變 */
    overflow: hidden;
  }
  /* DIV 負責佈局/背景/邊框 */
  .card {
    position: absolute;
    background: #1A4A8A;                    /* 背景在 DIV 上 */
    border-radius: 4pt;
    padding: 12pt 16pt;
  }
  /* 文字標籤只負責字型樣式，不加背景/邊框 */
  .card h2 { font-size: 24pt; color: #FFFFFF; font-weight: 700; }
  .card p  { font-size: 14pt; color: rgba(255,255,255,0.85); }
</style>
</head>
<body>

  <!-- 標題區：外層 div 定位，內層文字標籤 -->
  <div style="position: absolute; top: 40pt; left: 60pt; right: 60pt;">
    <h1 style="font-size: 36pt; color: #1A1A1A; font-weight: 700;">標題用斷言句，不是主題詞</h1>
    <p style="font-size: 16pt; color: #555555; margin-top: 10pt;">副標題補充說明</p>
  </div>

  <!-- 內容卡片：div 負責背景，h2/p 負責文字 -->
  <div class="card" style="top: 130pt; left: 60pt; width: 240pt; height: 160pt;">
    <h2>要點一</h2>
    <p>簡短說明文字</p>
  </div>

  <!-- 列表：使用 ul/li，不用手動 • 符號 -->
  <div style="position: absolute; top: 320pt; left: 60pt; width: 540pt;">
    <ul style="font-size: 16pt; color: #1A1A1A; padding-left: 24pt; list-style: disc;">
      <li>第一條要點</li>
      <li>第二條要點</li>
      <li>第三條要點</li>
    </ul>
  </div>

  <!-- 插圖：用 <img> 標籤，不用 background-image -->
  <img src="illustration.png" style="position: absolute; right: 60pt; top: 110pt; width: 320pt; height: 240pt;" />

</body>
</html>
```

---

## 常見錯誤速查

| 錯誤資訊 | 原因 | 修復方法 |
|---------|------|---------|
| `DIV element contains unwrapped text "XXX"` | div 裡有裸文字 | 把文字包進 `<p>` 或 `<h1>`-`<h6>` |
| `CSS gradients are not supported` | 用了 linear/radial-gradient | 改為純色，或用 flex 子元素分段 |
| `Text element <p> has background` | `<p>` 標籤加了背景色 | 外套 `<div>` 承載背景，`<p>` 只寫文字 |
| `Background images on DIV elements are not supported` | div 用了 background-image | 改為 `<img>` 標籤 |
| `HTML content overflows body by Xpt vertically` | 內容超出 540pt | 減少內容或縮小字號，或 `overflow: hidden` 截斷 |
| `HTML dimensions don't match presentation layout` | body 尺寸和 pres layout 對不上 | body 用 `960pt × 540pt` 配 `LAYOUT_WIDE`；或 defineLayout 自定義尺寸 |
| `Text box "XXX" ends too close to bottom edge` | 大字號 `<p>` 距離 body 底邊 < 0.5 inch | 往上挪，留足下邊距；PPT 底部本身就會被遮住一部分 |

---

## 基本工作流（3 步出 PPTX）

### Step 1：按約束寫每頁獨立 HTML

```
我的Deck/
├── slides/
│   ├── 01-cover.html    # 每個檔案都是完整 960×540pt HTML
│   ├── 02-agenda.html
│   └── ...
└── illustration/        # 所有 <img> 引用的圖片
    ├── chart1.png
    └── ...
```

### Step 2：寫 build.js 呼叫 `html2pptx.js`

```js
const pptxgen = require('pptxgenjs');
const html2pptx = require('../scripts/html2pptx.js');  // 本 skill 指令碼

(async () => {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';  // 13.333 × 7.5 inch，匹配 HTML 的 960×540pt

  const slides = ['01-cover.html', '02-agenda.html', '03-content.html'];
  for (const file of slides) {
    await html2pptx(`./slides/${file}`, pres);
  }

  await pres.writeFile({ fileName: 'deck.pptx' });
})();
```

### Step 3：開啟檢查

- PowerPoint/Keynote 開啟匯出 PPTX
- 雙擊任意文字應能直接編輯（如果是圖片說明第 1 條違反了）
- 驗證 overflow：每頁應該在 body 範圍內，沒有被截

---

## 這條路徑 vs 其他選項（什麼時候選什麼）

| 需求 | 選什麼 |
|------|------|
| 同事會改 PPTX 裡的文字 / 發給非技術人員繼續編輯 | **本文路徑**（editable，需從頭按 4 條約束寫 HTML） |
| 只是演講用 / 發存檔，不再改 | `export_deck_pdf.mjs`（多檔案）或 `export_deck_stage_pdf.mjs`（單檔案 deck-stage），出向量 PDF |
| 視覺自由度優先（動畫、web component、CSS 漸變、複雜 SVG），接受不可編輯 | `export_deck_pptx.mjs --mode image`（圖片鋪底 PPTX） |

**絕不要在視覺自由寫好的 HTML 上硬跑 html2pptx**——實測視覺驅動的 HTML pass 率 < 30%，剩下的逐頁改造比重寫還慢。

---

## 為什麼 4 條約束不是 Bug 而是物理約束

這 4 條不是 `html2pptx.js` 作者偷懶——它們是 **PowerPoint 檔案格式（OOXML）本身的約束**投射到 HTML 上的結果：

- PPTX 裡文字必須在 text frame（`<a:txBody>`），對應段落級 HTML 元素
- PPTX 的 shape 和 text frame 是兩個物件，無法在同一 element 上同時畫背景和寫文字
- PPTX 的 shape fill 對 gradient 支援有限（僅某些 preset gradients，不支援 CSS 任意角度漸變）
- PPTX 的 picture 物件必須引用真實圖片檔案，不是 CSS 屬性

理解這點後，**不要期待工具變聰明** —— 是 HTML 寫法要適配 PPTX 格式，不是反過來。
