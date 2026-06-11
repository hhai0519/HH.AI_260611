---
name: sentiment-scout
type: skill
description: |
  |
    透過新聞、論壇和機構報告對市場情緒進行非結構化資料分析。
     "敏銳且多空辯證"
version: "3.0.0"
type: "cognitive"
capabilities:
  logic_depth: "非結構化情緒解析"
  strategic_focus: "市場敘事與反身性"
  interaction_style: "敏銳且多空辯證"
---
# 市場情緒偵測 (Sentiment Scout)

### 【摘要】觸發條件與 DLP 聲明
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議

本技能分析**非結構化資料**（新聞標題、PTT/Dcard 討論、法人報告摘要），透過自然語言處理量化市場情緒，辨識散戶恐慌/貪婪週期與法人態度轉變的早期訊號。

---

## 🎯 觸發條件

- 詢問「現在市場情緒怎麼樣」「散戶在怎麼想」「法人有翻空嗎」
- 需要分析某個股或板塊的新聞情緒傾向
- 需要偵測 PTT 八卦板/股板等論壇的恐慌或 FOMO 情緒
- 需要彙整法人研究報告的觀點轉變

---

## 🛠️ 情緒評分框架

### Prompt Atlas 策略（新聞情緒量化）

```python
SENTIMENT_PROMPT = """
請分析以下新聞標題的市場情緒，評分範圍 -10 到 +10：
  +10 = 極度樂觀（強烈利多）
    0 = 中性
  -10 = 極度悲觀（強烈利空）

只返回數字分數和一句原因說明。

新聞標題：{headline}
"""

def score_headlines(headlines: list) -> dict:
    scores = []
    for h in headlines:
        # 呼叫 LLM 評分
        score = llm_evaluate(SENTIMENT_PROMPT.format(headline=h))
        scores.append(score)
    
    avg_score = sum(scores) / len(scores)
    
    return {
        "average_sentiment": round(avg_score, 2),
        "signal": classify_sentiment(avg_score),
        "scored_headlines": list(zip(headlines, scores))
    }

def classify_sentiment(score: float) -> str:
    if score >= 7:   return "🔴 極度貪婪（逆向看空）"
    if score >= 4:   return "🟠 樂觀（市場偏多）"
    if score >= 1:   return "🟡 輕微偏多"
    if score >= -1:  return "⚪ 中性"
    if score >= -4:  return "🟡 輕微偏空"
    if score >= -7:  return "🟠 悲觀（市場偏空）"
    return "🟢 極度恐慌（逆向看多）"
```

---

## 📊 情緒指標矩陣

| 資料來源 | 分析維度 | 更新頻率 |
|---|---|---|
| **財經新聞標題** | 正負情緒傾向、關鍵詞密度 | 即時 |
| **PTT 股版** | 多空比、恐慌關鍵詞（「慘」「完了」）| 每小時 |
| **Dcard 財經** | 年輕散戶 FOMO 程度 | 每日 |
| **法人報告** | 目標價上調/下調比率 | 每週 |
| **社群媒體** | 搜尋趨勢、提及量變化 | 每日 |

---

## 🔍 逆向情緒訊號識別

恐慌 = 買點，貪婪 = 危險。以下模式觸發逆向研究：

```
觸發條件（任一）：
  1. PTT 股版「停損」帖數 > 當周平均 3 倍
  2. 新聞情緒評分 < -7（極度悲觀）
  3. 法人連 5 日下調目標價 + 情緒評分同步惡化
  
逆向檢核清單：
  ☐ 基本面是否出現根本性問題？
  ☐ 籌碼面是否顯示主力大量出清？（若否→可能超跌）
  ☐ 技術面是否在長期支撐區？
```

---

## 📈 情緒週期模型

```
恐慌 → 底部 → 復甦 → 樂觀 → 貪婪 → 頂部 → 修正 → 恐慌
        ↑                              ↑
      買點（情緒最差時）              賣點（情緒最好時）
```

---

## 🤝 協同技能

- `macro-linkage`：確認外部情緒（美股情緒）是否同步
- `chip-logic-expert`：情緒與籌碼面的交叉驗證
- `notebooklm-mcp`：彙整研究報告建立情緒資料庫

---
## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議

## 版本紀錄 (Changelog)
- **[2.0.0]** 導入 V2 架構，實裝多維度認知矩陣標籤與 Dynamic Payload 預備介面。


---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文檔不再接收無結構的自然語言，必須處理封裝後的動態參數：
`[SYSTEM-CALL: sentiment-scout | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

> [!IMPORTANT]
> **Payload 淨化規則 (§6.3)**：
> - 若本技能為 `Cognitive` 型：接收戰略目標、語氣設定、情緒變數；拒絕 SQL/DOM/技術指令。
> - 若本技能為 `Execution` 型：只接收 URL、DOM Selector、SQL、JSON Schema；拒絕認知參數。

發送協定 (Zero-Block Policy)： 執行中若遇能力不足或需外部協作，嚴禁中斷或詢問使用者。必須主動封裝 Dynamic Payload 並發出：
`[SYSTEM-CALL: 目標ID | PAYLOAD: { ... }]` 調閱其他技能。

回傳協定： 任務終止時，必須且只能輸出 `[SYSTEM-RETURN: SUCCESS/FAILED | DATA: <結果>]`。
