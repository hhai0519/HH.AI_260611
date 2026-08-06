---
name: twse-dev-sop-skill
type: orchestrator
description: "臺股分析網站開發標準作業程式 (SOP)。整合 subagent-collaboration-skill、d3-viz-skill、webapp-testing-skill 三大技能，提供從計畫→實作→驗證的完整開發迴圈。"
version: "3.0.0"
type: "orchestrator"
capabilities:
  logic_depth: "多技能協作任務拆解與開發迴圈"
  strategic_focus: "計畫→實作→驗證→迭代四階段"
  interaction_style: "結構化且步驟嚴謹"
  authorized_mcp_tools: ["Persona Knowledge MCP"]
---

# 臺股分析網站開發 SOP

### 【摘要】觸發條件與 DLP 宣告
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議

> **核心哲學：計畫先行 → 子代理人執行 → 截圖驗證 → 迭代**
> 每一個功能都走完整迴圈，不跳步驟。

---

## 📐 三技能協作架構

```
┌─────────────────────────────────────────────────┐
│          twse-dev-sop-skill (本 SOP)             │
│              統籌整體開發流程                     │
└───────────┬─────────────┬───────────────────────┘
            │             │                │
   ┌────────▼──────┐ ┌────▼───────┐ ┌─────▼──────────┐
   │ subagent-     │ │ d3-viz-    │ │ webapp-testing- │
   │ collaboration │ │ skill      │ │ skill           │
   │ 任務拆解與    │ │ 圖表實作   │ │ 視覺驗證        │
   │ 協作執行      │ │ 臺股專用   │ │ 截圖 & 錯誤檢測 │
   └───────────────┘ └────────────┘ └────────────────┘
```

---

## 🗂️ 整體開發迴圈 (Development Loop)

```
PHASE 1: 計畫  →  PHASE 2: 實作  →  PHASE 3: 驗證  →  PHASE 4: 迭代
   (Plan)              (Build)           (Verify)          (Iterate)
     │                   │                  │                  │
     ▼                   ▼                  ▼                  ▼
  寫下功能需求        子代理人執行        Playwright 截圖    標記完成或退回
  拆解成小任務        D3 圖表實作        主控臺錯誤偵測      開下一個 Task
  定義成功標準        CSS 樣式調整       驗證資料正確        更新 task.md
```

---

## PHASE 1：計畫（Plan）

### 步驟 1-A：建立 task.md

每次開始新功能前，先建立或更新任務清單：

```markdown
<!-- task.md 範例 -->
## 功能：臺股 K 線圖頁面

- [ ] 1. 建立 HTML 頁面骨架 (index.html)
- [ ] 2. 實作 CSS 基礎樣式與深色主題
- [ ] 3. 實作 D3 K 線圖元件 (candlestick.js)
- [ ] 4. 串接 TWSE Open API 取得歷史資料
- [ ] 5. 加入股票程式碼搜尋功能
- [ ] 6. 加入技術指標疊加（MA5/MA20/MA60）
- [ ] 7. 截圖驗證所有圖表渲染正確
- [ ] 8. 主控臺錯誤清零確認
```

### 步驟 1-B：為每個 Task 定義成功標準

```markdown
Task 3 成功標準：
- [ ] SVG 元素存在於 DOM
- [ ] 紅色蠟燭（上漲日）正確顯示
- [ ] 綠色蠟燭（下跌日）正確顯示
- [ ] Hover Tooltip 顯示開高低收數值
- [ ] 截圖無空白區域
```

### 步驟 1-C：識別技能觸發點

| Task 型別 | 使用技能 |
|-----------|----------|
| 複雜功能（5步驟以上） | `subagent-collaboration-skill` |
| 任何圖表實作 | `d3-viz-skill` |
| 決定指標閾值與市場邏輯 | `twse-market-logic-skill` |
| 完成任何前端功能後 | `webapp-testing-skill` |
| MCP 或環境設定 | `mcp-setup-skill` |
| NotebookLM 研究 | `nlm-skill` |
| 錯誤無法解決 | `systematic-debugging-skill` |

---

## PHASE 2：實作（Build）

### 標準子代理人指令模板

每次派發子代理人時，必須包含以下結構：

```markdown
## 任務背景
<<<<<<< HEAD:skills/01_Orchestrators/twse-dev-sop-skill/SKILL.md
我正在開發臺股分析網站，目標是讓使用者查看個股 K 線圖與技術指標。
工作目錄：<USER_HOME>\Desktop\HH.AI_260806\
=======
我正在開發臺股分析網站，目標是讓使用者檢視個股 K 線圖與技術指標。
工作目錄：<USER_HOME>\Desktop\AI Test_260413\
>>>>>>> origin/main:skills/06_股票分析與量化層_Stock_Analysis/twse-dev-sop-skill/SKILL.md

## 你的具體任務
實作 D3.js K 線圖元件，儲存為 js/candlestick.js

## 前置條件
- index.html 已存在（包含 <div id="chart"></div>）
- d3.v7.min.js 已透過 CDN 引入

## 技術規範
- 使用 d3-viz-skill 的 K 線圖模板
- 顏色：漲紅 #e63946，跌綠 #2a9d8f（臺灣慣例）
- 支援響應式寬度（ResizeObserver）
- 加入 Tooltip 顯示：日期、開高低收、漲跌幅%

## 成功標準
- [ ] js/candlestick.js 檔案建立
- [ ] drawCandlestickChart(data, 'chart') 函式可呼叫
- [ ] 用假資料能正確渲染圖表

## 回報格式
STATUS: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
- 實作了哪些功能
- 任何需要注意的事項
```

### 圖表實作順序建議

```
1. HTML 骨架 + CSS 深色主題
   → 先做外觀，確認佈局正確

2. 靜態假資料 + D3 圖表
   → 先用假資料驗證圖表邏輯

3. 串接真實 API
   → 確認圖表正確後再接 API

4. 互動功能（搜尋、篩選、縮放）
   → 最後加入互動，避免幹擾核心邏輯
```

---

## PHASE 3：驗證（Verify）

### 每個 Task 完成後的標準驗證流程

```python
# verify_task.py — 每次完成功能後執行
from playwright.sync_api import sync_playwright

def verify_feature(url, task_name):
    errors = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        
        # 偵測主控臺錯誤
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(f"PAGE ERROR: {e}"))
        
        page.goto(url)
        page.wait_for_load_state('networkidle')
        
        # 全頁截圖
        screenshot_path = f'verify_{task_name}.png'
        page.screenshot(path=screenshot_path, full_page=True)
        
        # 確認核心元素
        svg_count = page.locator('svg').count()
        
        browser.close()
    
    print(f"\n{'='*40}")
    print(f"✅ Task: {task_name}")
    print(f"📸 截圖：{screenshot_path}")
    print(f"📊 SVG 圖表數：{svg_count}")
    if errors:
        print(f"❌ 主控臺錯誤 ({len(errors)} 個)：")
        for e in errors: print(f"   - {e}")
    else:
        print(f"✅ 無主控臺錯誤")
    print(f"{'='*40}\n")
    
    return len(errors) == 0

# 用法（根據實際 URL 調整）
# verify_feature('http://localhost:3000', 'k-line-chart')
# verify_feature('file:///<YOUR_PROJECT_PATH>/index.html', 'homepage')
```

### 驗證透過標準 (Definition of Done)

每個 Task 必須同時滿足以下條件才算「完成」：

```
✅ 功能行為符合需求
✅ 截圖顯示正確（無空白、無亂碼）
✅ 主控臺零錯誤
✅ 響應式頁面在 1280px 與 1920px 均正常
✅ task.md 中對應專案標記 [x]
```

---

## PHASE 4：迭代（Iterate）

### Task 狀態處理

```
Task 完成 (DONE) → 標記 [x]，進行下一個 Task
        │
Task 有疑慮 (DONE_WITH_CONCERNS)
        → 閱讀疑慮，決定：
          - 可接受 → 標記 [x] 並記錄疑慮
          - 不可接受 → 退回修正

Task 阻塞 (BLOCKED / 錯誤無法解)
        → 切換至 systematic-debugging-skill
          執行四階段排查流程
```

### 更新 task.md 範例

```markdown
## 功能：臺股 K 線圖頁面

- [x] 1. 建立 HTML 頁面骨架 - 完成 2024-01-15
- [x] 2. 實作 CSS 深色主題 - 完成 2024-01-15
- [/] 3. 實作 D3 K 線圖元件 ← 進行中
- [ ] 4. 串接 TWSE Open API
- [ ] 5. 加入股票搜尋功能
- [ ] 6. 加入均線疊加
- [ ] 7. 截圖驗證
- [ ] 8. 主控臺錯誤清零
```

---

## 🏗️ 臺股網站標準目錄結構

```
AI Test_260413/
├── index.html              # 首頁（大盤概況）
├── stock.html              # 個股 K 線圖頁面
├── sector.html             # 類股熱力圖頁面
├── css/
│   ├── main.css            # 全域樣式 & 深色主題
│   └── components.css      # 元件樣式
├── js/
│   ├── candlestick.js      # K 線圖 (d3-viz-skill)
│   ├── heatmap.js          # 類股熱力圖 (d3-viz-skill)
│   ├── line-chart.js       # 走勢折線圖 (d3-viz-skill)
│   ├── api.js              # TWSE API 呼叫層
│   └── utils.js            # 共用工具（日期格式化、千位逗號等）
├── data/
│   └── sample/             # 假資料（開發階段使用）
│       ├── twii.json       # 大盤指數範例
│       └── 2330.json       # 臺積電 K 線範例
└── tests/
    ├── verify_task.py      # 通用驗證指令碼 (webapp-testing-skill)
    └── screenshots/        # 驗證截圖存放
```

---

## 🌐 TWSE 公開 API 參考

```javascript
// 常用臺股開放資料 API（無需 Key）
const TWSE_API = {
  // 個股日 K（近 30 天）
  dailyK: (stock, yyyymm) =>
    `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${yyyymm}01&stockNo=${stock}`,

  // 大盤加權指數
  taiex: (yyyymm) =>
    `https://www.twse.com.tw/exchangeReport/FMTQIK?response=json&date=${yyyymm}01`,

  // 類股即時行情
  sector: () =>
    `https://www.twse.com.tw/exchangeReport/MI_INDEX?response=json&type=MS`,

  // 個股基本資料
  stockInfo: (stock) =>
    `https://mops.twse.com.tw/mops/web/t51sb01_q1?encodeURIComponent=1&step=1&firstin=1&off=1&keyword4=&code1=&TYPEK2=&checkbtn=&queryName=co_id&inpuType=co_id&TYPEK=all&isnew=false&co_id=${stock}`,
};

// 資料清洗（TWSE 回傳格式統一處理）
function parseTWSEDailyK(rawData) {
  if (!rawData.data || rawData.stat !== 'OK') return [];
  return rawData.data.map(row => ({
    date: row[0].replace(/\//g, '-')
      .replace(/^(\d+)/, m => (parseInt(m) + 1911).toString()), // 民國轉西元
    volume: parseInt(row[1].replace(/,/g, ''), 10),
    open:   parseFloat(row[3].replace(/,/g, '')),
    high:   parseFloat(row[4].replace(/,/g, '')),
    low:    parseFloat(row[5].replace(/,/g, '')),
    close:  parseFloat(row[6].replace(/,/g, '')),
    change: parseFloat(row[7].replace(/[+,]/g, '')),
  })).filter(d => !isNaN(d.close));
}
```

---

## 🚦 開發啟動清單 (Kickoff Checklist)

開始一個新的臺股功能前，確認：

```
環境
- [ ] 工作目錄正確：<USER_HOME>\Desktop\HH.AI_260806\
- [ ] Python + Playwright 可用（pip install playwright && playwright install chromium）
- [ ] 瀏覽器可開啟目標 URL

計畫
- [ ] task.md 已建立並列出所有子任務
- [ ] 每個 Task 有明確的成功標準
- [ ] 已識別哪些 Task 需要哪個技能

實作
- [ ] 有假資料可先讓圖表渲染
- [ ] TWSE API CORS 問題已處理（用 fetch proxy 或直接在檔案開發）

驗證
- [ ] verify_task.py 指令碼就緒
- [ ] screenshots/ 目錄已建立
```

---

## 🔬 PHASE 5：自主實驗迴圈（autoresearch 模式）

> **靈感來源：karpathy/autoresearch**
> 讓 AI 作為自主研究員，不停迭代直到人工中斷。

### 啟動條件
當你希望 AI 自主改進圖表或 UI 品質時，使用此模式：
1. 確認 `experiment_program.md` 存在（AI 的指令書）
2. 確認 `experiments.tsv` 僅有 header 行（空白起點）
3. 下指令給 AI：「**請閱讀 experiment_program.md 並開始自主迭代**」

### VQS 評分標準（Visual Quality Score）

```
+ 40 pts：無主控臺錯誤
+ 30 pts：SVG 圖表正確渲染
+ 15 pts：1280px 響應式正常
+ 15 pts：1920px 響應式正常
= 100 pts 滿分
```

評估指令：
```bash
python tests/verify_task.py
grep "^vqs_score:" tests/latest_result.txt
```

### LOOP FOREVER 迭代規則

```
LOOP:
  1. git state 確認
  2. 修改 js/ 或 css/（一次只改一件事）
  3. git commit -m "experiment: <說明>"
  4. python tests/verify_task.py > tests/latest_result.txt 2>&1
  5. grep "^vqs_score:" tests/latest_result.txt
  6. 記錄到 experiments.tsv
  7. VQS 改善 → 保留 commit（advance）
  8. VQS 相同或更差 → git reset HEAD~1 --hard
```

### 實驗 TSV 格式

```tsv
commit	vqs_score	status	description
a1b2c3d	60	keep	baseline
b2c3d4e	75	keep	加入動畫入場效果
c3d4e5f	55	discard	散點圖嘗試失敗
```

### 改進方向靈感庫

| 類別 | 想法 |
|------|------|
| 圖表 | MA均線、RSI 指標、成交量柱 |
| 動畫 | stagger 蠟燭入場、走勢線描繪動畫 |
| 互動 | 十字遊標、縮放平移、Tooltip 增強 |
| 樣式 | Glassmorphism、漸層幕、發光效果 |

---

## Integration（技能協作速查）

| 情境 | 觸發技能 |
|------|----------|
| 「幫我規劃這個功能要怎麼做」 | subagent-collaboration-skill |
| 「幫我畫 K 線圖 / 熱力圖」 | d3-viz-skill |
| 「確認這個頁面有沒有問題」 | webapp-testing-skill |
| 「MCP 工具不能用了」 | systematic-debugging-skill |
| 「幫我研究臺股技術指標」 | nlm-skill |
| 「幫我確認市場分析指標與閾值」 | **twse-market-logic-skill** |
| 「開始開發 XX 功能」 | **本 SOP（twse-dev-sop-skill）** |
| 「自主迭代最佳化圖表」 | **本 SOP PHASE 5（autoresearch 模式）** |

## 版本紀錄 (Changelog)
- **[2.0.0]** 2026-05-04：V2.0.0 Orchestrator Alignment — 依生命週期 SOP 匯入三維認知能力矩陣標籤 (logic_depth, strategic_focus, interaction_style)，完成 Manifest 全域補錄。

## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議


---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文件不再接收無結構的自然語言，必須處理封裝後的動態引數：
`[SYSTEM-CALL: twse-dev-sop-skill | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

> [!IMPORTANT]
> **Payload 淨化規則 (§6.3)**：
> - 若本技能為 `Cognitive` 型：接收戰略目標、語氣設定、情緒變數；拒絕 SQL/DOM/技術指令。
> - 若本技能為 `Execution` 型：只接收 URL、DOM Selector、SQL、JSON Schema；拒絕認知引數。

傳送協定 (Zero-Block Policy)： 執行中若遇能力不足或需外部協作，嚴禁中斷或詢問使用者。必須主動封裝 Dynamic Payload 並發出：
`[SYSTEM-CALL: 目標ID | PAYLOAD: { ... }]` 調閱其他技能。

回傳協定： 任務終止時，必須且只能輸出 `[SYSTEM-RETURN: SUCCESS/FAILED | DATA: <結果>]`。

---
> [!WARNING]
> **全域鐵律：NotebookLM 研究遵從指示**
> 1. 當任務指示「透過 NotebookLM 進行研究/查詢」時，必須嚴格呼叫 `notebooklm` 相關 MCP 工具。
> 2. 若遇到無法連線、憑證過期 (`auth_status: stale` 或 `Authentication expired`) 等錯誤時，**絕對禁止**未經同意自行改用常規網路搜尋 (Web Search) 或其他工具替代。
> 3. 遇到錯誤時，請**立刻中斷動作並主動告知使用者**，請使用者協助登入或修復連線後，再繼續研究任務。
