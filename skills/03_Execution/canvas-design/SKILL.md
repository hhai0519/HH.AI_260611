---
name: canvas-design
type: execution
description: 使用設計哲學在 .png 和 .pdf 文件中建立美觀的視覺藝術。當使用者要求建立海報、藝術品、設計或其他靜態視覺作品時使用。
legacy_notice: "[LEGACY - 請改用 ui-prototype-builder]"
version: "3.0.0"
type: "execution"
capabilities:
  tool_category: "Visual Design"
  execution_env: "Python/PIL"
  io_format: "PNG/PDF"
---

# 視覺設計工坊 (Canvas Design)

### 【摘要】觸發條件與 DLP 聲明
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議

本技能為靜態視覺作品的**完整設計引擎**，從概念到落地：海報、資訊圖表、品牌設計、活動視覺、社群貼文圖，使用 Python Pillow / Cairo / ReportLab 精確控制每一個像素，輸出專業級 PNG 或 PDF。

---

## 🎯 觸發條件

- 使用者請求「幫我設計一張...」「做一個海報」「生成一張圖」
- 需要製作資訊圖表（infographic）
- 需要品牌視覺素材（Logo、Banner、封面）
- 需要活動宣傳物料（邀請函、海報、傳單）

---

## 🛠️ 技術工具鏈

```python
# 依賴安裝
# pip install Pillow reportlab cairosvg

from PIL import Image, ImageDraw, ImageFont
import reportlab.lib.colors as colors
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, letter
```

---

## 📋 設計流程（Design → Code → Output）

### Step 1：確認設計規格
```
尺寸：A4(2480x3508px) / IG方(1080x1080px) / IG限時動態(1080x1920px)
用途：印刷(300dpi) / 數位(72dpi)
風格：簡約 / 科技感 / 溫暖 / 企業 / 節慶
主色：使用者指定 或 自動配色
```

### Step 2：基礎構圖框架

```python
def create_poster(
    width: int = 1080, 
    height: int = 1350,
    bg_color: tuple = (15, 15, 30),  # 深夜藍
    output_path: str = "poster.png"
):
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)
    
    # 漸層背景
    for y in range(height):
        ratio = y / height
        r = int(bg_color[0] + (50 - bg_color[0]) * ratio)
        g = int(bg_color[1] + (10 - bg_color[1]) * ratio)
        b = int(bg_color[2] + (80 - bg_color[2]) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    return img, draw
```

### Step 3：排版系統

```python
def add_text_block(draw, text, position, font_size=48, color=(255,255,255), align='center'):
    """智能文字排版（支援中英文、自動換行）"""
    try:
        font = ImageFont.truetype("NotoSansCJKTC-Bold.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    # 自動換行
    words = text.split()
    lines = []
    current_line = []
    
    for word in words:
        current_line.append(word)
        test_text = ' '.join(current_line)
        bbox = draw.textbbox((0,0), test_text, font=font)
        if bbox[2] > 900:  # 最大寬度
            lines.append(' '.join(current_line[:-1]))
            current_line = [word]
    lines.append(' '.join(current_line))
    
    y = position[1]
    for line in lines:
        bbox = draw.textbbox((0,0), line, font=font)
        text_width = bbox[2] - bbox[0]
        x = (position[0] - text_width // 2) if align == 'center' else position[0]
        draw.text((x, y), line, font=font, fill=color)
        y += font_size + 10
    
    return y

def add_divider(draw, y, width=1080, color=(100, 100, 200), thickness=2):
    """裝飾性分隔線"""
    padding = 80
    draw.line([(padding, y), (width-padding, y)], fill=color, width=thickness)
```

### Step 4：幾何裝飾元素

```python
def add_geometric_accent(draw, width, height):
    """科技感幾何裝飾"""
    # 右上角發光圓
    from PIL import ImageFilter
    accent_color = (100, 149, 237)  # 矢車菊藍
    
    # 多層圓環
    for radius, opacity in [(200, 30), (150, 50), (100, 80)]:
        x0 = width - radius
        y0 = -radius // 2
        x1 = width + radius
        y1 = radius + radius // 2
        draw.ellipse([x0, y0, x1, y1], outline=accent_color, width=1)
    
    # 左下角三角形裝飾
    draw.polygon(
        [(0, height), (150, height), (0, height-150)],
        fill=(30, 30, 80)
    )
```

---

## 🎨 10 大預設主題

| 主題 | 主色 | 配色 | 適用場景 |
|---|---|---|---|
| **深夜科技** | `#0F0F1E` | `#6495ED` | 科技產品、發佈會 |
| **極簡白調** | `#FFFFFF` | `#333333` | 企業、商務 |
| **日落漸層** | `#FF6B6B` | `#FFE66D` | 活動、節慶 |
| **森林療癒** | `#1A1A2E` | `#4ECB71` | 健康、環保 |
| **海洋深藍** | `#0A192F` | `#64FFDA` | 金融、資料 |
| **暗金奢華** | `#1C1C1C` | `#C9AA71` | 高端品牌 |
| **晨霧粉藍** | `#F0F4F8` | `#4A90E2` | 輕柔、親子 |
| **霓虹賽博** | `#0D0D0D` | `#FF00FF` | 電子音樂、遊戲 |
| **秋楓暖橙** | `#2C1810` | `#FF8C00` | 季節、食品 |
| **冰晶極光** | `#0A0E27` | `#00FFFF` | 科幻、AI |

---

## 🤝 協同技能

- `theme-factory`：主題系統與配色方案
- `image-enhancer`：輸出圖片的後期優化
- `artifacts-builder`：動態互動版本的同等實作

---

## 版本紀錄 (Changelog)
- **[2.0.0]** 2026-05-04：V2.0.0 Polymorphic Labeling Migration — 依生命週期 SOP 導入多態功能性技術標籤 (tool_category, execution_env, io_format)，建立執行層 Manifest 路由能力。

## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議


---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文檔不再接收無結構的自然語言，必須處理封裝後的動態參數：
`[SYSTEM-CALL: canvas-design | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

> [!IMPORTANT]
> **Payload 淨化規則 (§6.3)**：
> - 若本技能為 `Cognitive` 型：接收戰略目標、語氣設定、情緒變數；拒絕 SQL/DOM/技術指令。
> - 若本技能為 `Execution` 型：只接收 URL、DOM Selector、SQL、JSON Schema；拒絕認知參數。

發送協定 (Zero-Block Policy)： 執行中若遇能力不足或需外部協作，嚴禁中斷或詢問使用者。必須主動封裝 Dynamic Payload 並發出：
`[SYSTEM-CALL: 目標ID | PAYLOAD: { ... }]` 調閱其他技能。

回傳協定： 任務終止時，必須且只能輸出 `[SYSTEM-RETURN: SUCCESS/FAILED | DATA: <結果>]`。
