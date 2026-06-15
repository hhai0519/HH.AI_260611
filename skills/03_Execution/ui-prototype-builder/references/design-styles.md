# 設計哲學風格庫：20種體系

> 用於視覺設計（網頁/PPT/PDF/資訊圖/配圖/App等）的設計風格庫。
> 每種風格提供：哲學核心 + 核心特徵 + 提示詞DNA（與場景模板組合使用）。

## 風格×場景×執行路徑 速查表

| 風格 | 網頁 | PPT | PDF | 資訊圖 | 封面 | AI生成 | 最佳路徑 |
|------|:---:|:---:|:---:|:-----:|:---:|:-----:|---------|
| 01 Pentagram | ★★★ | ★★★ | ★★☆ | ★★☆ | ★★★ | ★☆☆ | HTML |
| 02 Stamen Design | ★★☆ | ★★☆ | ★★☆ | ★★★ | ★★☆ | ★★☆ | 混合 |
| 03 Information Architects | ★★★ | ★☆☆ | ★★★ | ★☆☆ | ★☆☆ | ★☆☆ | HTML |
| 04 Fathom | ★★☆ | ★★★ | ★★★ | ★★★ | ★★☆ | ★☆☆ | HTML |
| 05 Locomotive | ★★★ | ★★☆ | ★☆☆ | ★☆☆ | ★★☆ | ★★☆ | 混合 |
| 06 Active Theory | ★★★ | ★☆☆ | ★☆☆ | ★☆☆ | ★★☆ | ★★★ | AI生成 |
| 07 Field.io | ★★☆ | ★★☆ | ★☆☆ | ★★☆ | ★★★ | ★★★ | AI生成 |
| 08 Resn | ★★★ | ★☆☆ | ★☆☆ | ★☆☆ | ★★☆ | ★★☆ | AI生成 |
| 09 Experimental Jetset | ★★☆ | ★★☆ | ★★☆ | ★★☆ | ★★★ | ★★☆ | 混合 |
| 10 Müller-Brockmann | ★★☆ | ★★★ | ★★★ | ★★★ | ★★☆ | ★☆☆ | HTML |
| 11 Build | ★★★ | ★★★ | ★★☆ | ★☆☆ | ★★★ | ★☆☆ | HTML |
| 12 Sagmeister & Walsh | ★★☆ | ★★★ | ★☆☆ | ★★☆ | ★★★ | ★★★ | AI生成 |
| 13 Zach Lieberman | ★☆☆ | ★☆☆ | ★☆☆ | ★★☆ | ★★★ | ★★★ | AI生成 |
| 14 Raven Kwok | ★☆☆ | ★★☆ | ★☆☆ | ★★☆ | ★★★ | ★★★ | AI生成 |
| 15 Ash Thorp | ★★☆ | ★★☆ | ★☆☆ | ★☆☆ | ★★★ | ★★★ | AI生成 |
| 16 Territory Studio | ★★☆ | ★★☆ | ★☆☆ | ★★☆ | ★★★ | ★★★ | AI生成 |
| 17 Takram | ★★★ | ★★★ | ★★★ | ★★☆ | ★★☆ | ★☆☆ | HTML |
| 18 Kenya Hara | ★★☆ | ★★★ | ★★★ | ★☆☆ | ★★★ | ★☆☆ | HTML |
| 19 Irma Boom | ★☆☆ | ★★☆ | ★★★ | ★★☆ | ★★★ | ★★☆ | 混合 |
| 20 Neo Shen | ★★☆ | ★★☆ | ★★☆ | ★★☆ | ★★★ | ★★★ | AI生成 |

> 場景適配：★★★ = 強烈推薦 / ★★☆ = 適合 / ★☆☆ = 需改造
> AI生成：★★★ = 直出效果好 / ★★☆ = 需調整 / ★☆☆ = 建議HTML執行
> 最佳路徑：AI生成（圖片直出）/ HTML（程式碼渲染，資料精確）/ 混合（HTML佈局+AI配圖）

**核心規律**：有明確視覺元素的風格（插畫/粒子/生成藝術）AI直出效果好；依賴精確排版和資料的風格（網格/資訊架構/留白）HTML渲染更可控。

---

## 一、資訊建築派（01-04）
> 哲學：「資料不是裝飾，是建築材料」

### 01. Pentagram - Michael Bierut風格
**哲學**：字型即語言，網格即思想
**核心特徵**：
- 極度剋制的顏色（黑白+1個品牌色）
- 瑞士網格系統的現代演繹
- 字型排印作為主要視覺語言
- 負空間的戰略性使用（60%+留白）

**提示詞DNA**：
```
Pentagram/Michael Bierut style:
- Extreme typographic hierarchy, Helvetica/Univers family
- Swiss grid with precise mathematical spacing
- Black/white + one accent color (#HEX)
- Information architecture as visual structure
- 60%+ whitespace ratio
- Data visualization as primary decoration
```

**代表作**：Hillary Clinton 2016 campaign identity
**搜尋關鍵詞**：pentagram hillary logo system

---

### 02. Stamen Design - 資料詩學
**哲學**：讓資料成為可觸控的風景
**核心特徵**：
- 地圖學思維應用於資訊設計
- 演算法生成的有機圖形
- 溫暖的資料視覺化色調（赭石、鼠尾草綠、深藍）
- 可互動的層級系統

**提示詞DNA**：
```
Stamen Design aesthetic:
- Cartographic approach to data visualization
- Organic, algorithm-generated patterns
- Warm palette (terracotta, sage green, deep blues)
- Layered information like topographic maps
- Hand-crafted feel despite digital precision
- Soft shadows and depth
```

**代表作**：COVID-19 surge map
**搜尋關鍵詞**：stamen covid map visualization

---

### 03. Information Architects - 內容優先原則
**哲學**：設計不是裝飾，是內容的建築
**核心特徵**：
- 極端的內容層級清晰度
- 只使用系統字型（最佳化閱讀）
- 藍色超連結傳統的堅守
- 效能即美學

**提示詞DNA**：
```
Information Architects philosophy:
- Content-first hierarchy, zero decorative elements
- System fonts only (SF Pro/Roboto/Inter)
- Classic blue hyperlinks (#0000EE)
- Reading-optimized line length (66 characters)
- Progressive disclosure of depth
- Text-heavy, fast-loading design
```

**代表作**：iA Writer app
**搜尋關鍵詞**：information architects ia writer

---

### 04. Fathom Information Design - 科學敘事
**哲學**：每一個畫素都必須承載資訊
**核心特徵**：
- 科學期刊的嚴謹+設計的優雅
- 定量資料的精確視覺化
- 冷靜的專業色調（灰、海軍藍）
- 註釋與引用系統的設計化

**提示詞DNA**：
```
Fathom Information Design style:
- Scientific journal aesthetic meets modern design
- Precise data visualization (charts, timelines, scatter plots)
- Neutral scheme (grays, navy, one highlight color)
- Footnote/citation design integrated into layout
- Clean sans-serif (GT America/Graphik)
- Information density without clutter
```

**代表作**：Bill & Melinda Gates Foundation年度報告
**搜尋關鍵詞**：fathom information design gates foundation

---

## 二、運動詩學派（05-08）
> 哲學：「技術本身就是一種流動的詩」

### 05. Locomotive - 滾動敘事大師
**哲學**：滾動不是瀏覽，是旅程
**核心特徵**：
- 絲滑的視差滾動
- 電影化的分鏡敘事
- 大膽的空間留白
- 動態元素的精確編排

**提示詞DNA**：
```
Locomotive scroll narrative style:
- Film-like scene composition with parallax depth
- Generous vertical spacing between sections
- Bold typography emerging from darkness
- Smooth motion blur effects
- Dark mode (near-black backgrounds)
- Strategic glowing accents
- Hero sections 100vh tall
```

**代表作**：Lusion.co website
**搜尋關鍵詞**：locomotive scroll lusion

---

### 06. Active Theory - WebGL詩人
**哲學**：讓技術可見化即讓技術可理解
**核心特徵**：
- 3D粒子系統作為核心元素
- 實時渲染的資料視覺化
- 滑鼠互動驅動的世界構建
- 霓虹與深空的配色

**提示詞DNA**：
```
Active Theory WebGL aesthetic:
- Particle systems representing data flow
- 3D visualization in depth space
- Neon gradients (cyan/magenta/electric blue) on dark
- Mouse-reactive environment
- Depth of field and bokeh effects
- Floating UI with glassmorphism
```

**代表作**：NASA Prospect
**搜尋關鍵詞**：active theory nasa webgl

---

### 07. Field.io - 演算法美學
**哲學**：程式碼即設計師
**核心特徵**：
- 生成藝術系統
- 每次訪問都不同的動態圖形
- 抽象幾何的智慧編排
- 技術感與藝術性的平衡

**提示詞DNA**：
```
Field.io generative design style:
- Abstract geometric patterns, algorithmically generated
- Dynamic composition that feels computational
- Monochromatic base with vibrant accent
- Mathematical precision in spacing
- Voronoi diagrams or Delaunay triangulation
- Clean code aesthetic
```

**代表作**：British Council digital installations
**搜尋關鍵詞**：field.io generative design

---

### 08. Resn - 敘事驅動的互動
**哲學**：每個點選都推進故事
**核心特徵**：
- 遊戲化的使用者旅程
- 強烈的情感化設計
- 插畫與程式碼的深度結合
- 非線性的探索體驗

**提示詞DNA**：
```
Resn interactive storytelling approach:
- Illustrative style mixed with UI elements
- Gamified exploration (progress indicators)
- Warm color palette despite tech subject
- Character-driven design
- Scroll-triggered animations
- Editorial illustration meets product design
```

**代表作**：Resn.co.nz portfolio
**搜尋關鍵詞**：resn interactive storytelling

---

## 三、極簡主義派（09-12）
> 哲學：「刪減到無法再刪」

### 09. Experimental Jetset - 概念極簡
**哲學**：一個想法=一個形式
**核心特徵**：
- 單一視覺隱喻貫穿整個設計
- 藍/紅/黃+黑白的蒙德里安色系
- 字型即圖形
- 反商業的誠實設計

**提示詞DNA**：
```
Experimental Jetset conceptual minimalism:
- Single visual metaphor for entire design
- Primary colors only (red/blue/yellow) + black/white
- Typography as main graphic element
- Grid-based with deliberate rule-breaking
- No photography, only type and geometry
- Anti-commercial, honest aesthetic
```

**代表作**：Whitney Museum identity
**搜尋關鍵詞**：experimental jetset whitney responsive w

---

### 10. Müller-Brockmann傳承 - 瑞士網格純粹主義
**哲學**：客觀性即美
**核心特徵**：
- 數學精確的網格系統（8pt基線）
- 絕對的左對齊或居中
- 單色或雙色方案
- 功能主義至上

**提示詞DNA**：
```
Josef Müller-Brockmann Swiss modernism:
- Mathematical grid system (8pt baseline)
- Strict alignment (flush left or centered)
- Two-color maximum (black + one accent)
- Akzidenz-Grotesk or similar rationalist typeface
- No decorative elements
- Timeless, objective aesthetic
```

**代表作**：《Grid Systems in Graphic Design》
**搜尋關鍵詞**：muller brockmann grid systems poster

---

### 11. Build - 當代極簡品牌
**哲學**：精緻的簡單比複雜更難
**核心特徵**：
- 奢侈品級的留白（70%+）
- 微妙的字重對比（200-600）
- 單一強調色的戰略使用
- 呼吸感的節奏

**提示詞DNA**：
```
Build studio luxury minimalism:
- Generous whitespace (70%+ of area)
- Subtle typography weight shifts (200 to 600)
- Single accent color used sparingly
- High-end product photography aesthetic
- Soft shadows and subtle gradients
- Golden ratio proportions
```

**代表作**：Build studio portfolio
**搜尋關鍵詞**：build studio london branding

---

### 12. Sagmeister & Walsh - 快樂極簡
**哲學**：美即功能的情感維度
**核心特徵**：
- 意外的色彩爆發
- 手工感與數字的融合
- 正能量的視覺語言
- 實驗性但可讀

**提示詞DNA**：
```
Sagmeister & Walsh joyful philosophy:
- Unexpected color bursts on minimal base
- Handmade elements (physical objects in digital)
- Optimistic visual language
- Experimental typography that remains legible
- Human warmth through imperfection
- Mix of analog and digital aesthetics
```

**代表作**：The Happy Show
**搜尋關鍵詞**：sagmeister walsh happy show

---

## 四、實驗先鋒派（13-16）
> 哲學：「打破規則即創造規則」

### 13. Zach Lieberman - 程式碼詩學
**哲學**：程式設計即繪畫
**核心特徵**：
- 手繪感的演算法圖形
- 實時生成藝術
- 黑白的純粹表達
- 工具本身的可見性

**提示詞DNA**：
```
Zach Lieberman code-as-art style:
- Hand-drawn aesthetic generated by code
- Black and white only, no color
- Real-time generative patterns
- Sketch-like line quality
- Visible process/grid/construction lines
- Poetic interpretation of algorithms
```

**代表作**：openFrameworks creative coding
**搜尋關鍵詞**：zach lieberman openframeworks generative

---

### 14. Raven Kwok - 引數化美學
**哲學**：系統的美勝過個體的美
**核心特徵**：
- 分形與遞迴圖形
- 黑白高對比
- 建築化的資訊結構
- 東方園林的演算法演繹

**提示詞DNA**：
```
Raven Kwok parametric aesthetic:
- Fractal patterns and recursive structures
- High-contrast black and white
- Architectural visualization of data
- Chinese garden principles in algorithm form
- Intricate detail that rewards zooming
- Processing/Creative coding aesthetic
```

**代表作**：Raven Kwok generative art exhibitions
**搜尋關鍵詞**：raven kwok processing generative art

---

### 15. Ash Thorp - 賽博詩意
**哲學**：未來不是冰冷的，是孤獨的詩
**核心特徵**：
- 電影級的光影
- 賽博朋克的溫暖版本（橙/青，非冷藍）
- 故事性的概念設計
- 工業美學的精緻化

**提示詞DNA**：
```
Ash Thorp cinematic concept art:
- Film-grade lighting and atmospheric effects
- Warm cyberpunk (orange/teal, NOT cold blue)
- Industrial design meets luxury
- Narrative concept art feel
- Volumetric lighting and god rays
- Blade Runner warmth over Tron coldness
```

**代表作**：Ghost in the Shell concept art
**搜尋關鍵詞**：ash thorp ghost shell concept art

---

### 16. Territory Studio - 螢幕介面虛構
**哲學**：未來UI的今日想象
**核心特徵**：
- 科幻電影中的螢幕設計（FUI）
- 全息投影感
- 多層疊加的資料視覺化
- 可信的未來感

**提示詞DNA**：
```
Territory Studio FUI (Fantasy User Interface):
- Fantasy User Interface design
- Holographic projection aesthetics
- Orange/amber monochrome or cyan accents
- Multiple overlapping data layers
- Believable future technology
- Technical readouts and data streams
```

**代表作**：Blade Runner 2049 screen graphics
**搜尋關鍵詞**：territory studio blade runner interface

---

## 五、東方哲學派（17-20）
> 哲學：「留白即內容」

### 17. Takram - 日式思辨設計
**哲學**：技術是思考的媒介
**核心特徵**：
- 概念原型的優雅
- 柔和的科技感（圓角、柔和陰影）
- 圖表即藝術
- 謙遜的精緻

**提示詞DNA**：
```
Takram Japanese speculative design:
- Elegant concept prototypes and diagrams
- Soft tech aesthetic (rounded corners, gentle shadows)
- Charts and diagrams as art pieces
- Modest sophistication
- Neutral natural colors (beige, soft gray, muted green)
- Design as philosophical inquiry
```

**代表作**：NHK Fabricated City
**搜尋關鍵詞**：takram nhk data visualization

---

### 18. Kenya Hara - 空的設計
**哲學**：設計不是填充，是清空
**核心特徵**：
- 極致的留白（80%+）
- 紙張質感的數字化
- 白色的層次（暖白、冷白、米白）
- 觸覺的視覺化

**提示詞DNA**：
```
Kenya Hara "emptiness" design:
- Extreme whitespace (80%+)
- Paper texture and tactility in digital form
- Layers of white (warm white, cool white, off-white)
- Minimal color (if any, very desaturated)
- Design by subtraction not addition
- Zen simplicity
```

**代表作**：Muji art direction, 《Designing Design》
**搜尋關鍵詞**：kenya hara designing design muji

---

### 19. Irma Boom - 書籍建築師
**哲學**：資訊的物理詩學
**核心特徵**：
- 非線性的資訊架構
- 邊緣與邊界的遊戲
- 意外的顏色組合（粉+紅、橙+棕）
- 手工藝的數字轉譯

**提示詞DNA**：
```
Irma Boom book architecture style:
- Non-linear information structure
- Play with edges, margins, boundaries
- Unexpected color combos (pink+red, orange+brown)
- Handcraft translated to digital
- Dense information inviting exploration
- Editorial design, unconventional grid
```

**代表作**：SHV Think Book (2136 pages)
**搜尋關鍵詞**：irma boom shv think book

---

### 20. Neo Shen - 東方光影詩
**哲學**：技術需要人的溫度
**核心特徵**：
- 水墨暈染的數字化
- 柔和的光暈效果
- 詩意的留白
- 情感化的色彩（深藍、暖灰、柔金）

**提示詞DNA**：
```
Neo Shen poetic Chinese aesthetic:
- Digital interpretation of ink wash painting
- Soft glow and light diffusion effects
- Poetic negative space
- Emotional palette (deep blues, warm grays, soft gold)
- Calligraphic influences in typography
- Atmospheric depth
```

**代表作**：Neo Shen digital art series
**搜尋關鍵詞**：neo shen digital ink wash art

---

## 提示詞使用說明

**組合公式**：`[風格提示詞DNA] + [場景模板（見scene-templates.md）] + [具體內容]`

### 核心原則：描述情緒而非佈局（Mood, Not Layout）

AI影象生成的關鍵：短提示詞 > 長提示詞。描述3句情緒和內容，比30行佈局細節效果更好。

| 殺死多樣性的寫法 | 激發創造力的寫法 |
|----------------|----------------|
| 指定顏色比例（60%/25%/15%） | 描述情緒（"warm like Sunday morning"） |
| 規定佈局位置（"標題居中，圖片右側"） | 引用具體美學（"Pentagram editorial feel"） |
| 限制角色姿勢和表情 | 讓AI自然詮釋風格 |
| 列出所有要包含的視覺元素 | 描述觀眾應該感受到什麼 |

### Good / Bad 示例

**Bad — 過度約束（AI生成出來空且平）：**
```
Professional presentation slide. Dark background, light text.
Title centered at top. Two columns below. Left column: bullet points.
Right column: bar chart. Colors: navy 60%, white 30%, gold 10%.
Font size: title 36pt, body 18pt. Margins: 40px all sides.
```

**Good — 情緒驅動（生成多樣且有質感）：**
```
A data visualization that feels like a Bloomberg Businessweek
editorial spread. The key number "28.5%" should dominate the
composition like a headline. Warm cream tones with sharp black
typography. The data tells a story of dramatic channel shift.
```

### 執行路徑選擇

根據速查表的「最佳路徑」列選擇：
- **AI生成**：有明確視覺元素的風格（06/07/12/13/14/15/16/20），用 Gemini/Midjourney 直出
- **HTML渲染**：依賴精確排版的風格（01/03/04/10/11/17/18），程式碼控制資料和佈局
- **混合**：HTML做骨架佈局 + AI生成配圖/背景（02/05/08/09/19）

### 質量控制

1. ❌ 不要直接寫 "in the style of Pentagram" → ✅ 用具體設計特徵描述
2. 文字在AI生成中常出錯 → 生成後替換文字
3. 比例易失真 → 明確指定 aspect ratio
4. 先生成3-5個變體，選擇最佳後細化

**預設審美禁區**（使用者可按自己品牌 override）：
- ❌ 賽博霓虹/深藍色底（#0D1117）
- ❌ 封面圖加個人署名/水印

---

**版本**：v2.1
**更新日期**：2026-02-13
**適用場景**：網頁/PPT/PDF/資訊圖/封面/配圖/App等所有視覺設計
**與 image-to-slides 聯動**：PPT場景可直接引用本檔案風格，透過 image-to-slides skill 執行生成
