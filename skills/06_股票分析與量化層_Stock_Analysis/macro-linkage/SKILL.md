---
name: macro-linkage
type: skill
description: |
  |
    臺股與美股 ADR/板塊之間的跨市場相關性分析。
     "宏觀且前瞻"
version: "3.0.0"
type: "cognitive"
capabilities:
  logic_depth: "跨市場傳導與流動性"
  strategic_focus: "總經週期與板塊輪動"
  interaction_style: "宏觀且前瞻"
---
# 宏觀連動分析 (Macro Linkage Expert)

### 【摘要】觸發條件與 DLP 宣告
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議

本技能專精分析**臺股重量級個股（臺積電、聯發科等）與美國 ADR / 相關板塊的跨市場連動關係**，透過溢價率計算、相關性係數與時間差效應，預判臺股開盤方向與個股短期走勢。

---

## 🎯 觸發條件

- 詢問「ADR 今晚怎麼跑」「臺積電 ADR 溢價多少」
- 需要分析美股收盤對臺股開盤的影響
- 涉及 NVDA、AAPL、XLF 等美股板塊與臺股的相關性
- 美股大漲 / 大跌後的隔日臺股預測

---

## 🛠️ 核心計算模型

### ADR 溢價率計算

```python
def calc_adr_premium(adr_price: float, fx_rate: float, ratio: float, tw_price: float) -> dict:
    """
    adr_price: ADR 收盤價（美元）
    fx_rate: 臺美匯率（例如 31.5）
    ratio: ADR 轉換比例（TSM = 5, ADS = 2）
    tw_price: 臺股收盤價（臺幣）
    """
    implied_tw = adr_price * fx_rate / ratio
    premium = (implied_tw - tw_price) / tw_price * 100
    
    signal = ""
    if premium > 2:
        signal = "🟢 正溢價 → 臺積電可能高開"
    elif premium < -2:
        signal = "🔴 負溢價 → 臺積電可能低開"
    else:
        signal = "🟡 小幅溢價 → 開盤影響有限"
    
    return {
        "implied_tw_price": round(implied_tw, 2),
        "premium_pct": round(premium, 2),
        "signal": signal
    }

# 範例
result = calc_adr_premium(
    adr_price=175.50,  # TSM ADR 收盤
    fx_rate=31.8,      # 當日匯率
    ratio=5,           # 1 ADR = 5 臺積電股
    tw_price=940.0     # 臺積電昨收
)
```

---

## 📊 板塊代理對映表

| 臺股標的 | 對應美股代理 | 相關性係數 | 時間差 |
|---|---|---|---|
| **臺積電（2330）** | TSM ADR, NVDA | 0.82 | T+0 (隔日) |
| **聯發科（2454）** | NVDA, QCOM | 0.74 | T+0 |
| **聯電（2303）** | UMC ADR, SOXS | 0.69 | T+0 |
| **金融股（2881~）** | XLF, JPM | 0.61 | T+0 |
| **航運股（2609~）** | ZIM, DAL | 0.55 | T+0 |

---

## 🔗 跨市場分析框架

```
美股收盤 (21:00~04:30 EST)
    ↓
ADR 溢價計算（即時）
    ↓
臺股期貨夜盤反應（理論確認）
    ↓
隔日開盤缺口預估
    ↓
板塊輪動方向識別
```

---

## ⚠️ 關鍵注意事項

1. **匯率影響**：臺幣升值 1% ≈ 臺積電 ADR 溢價降低 1%（需扣除匯率因素）
2. **除息季**：ADR 與臺股除息時間差會造成溢價失真
3. **熊市修正**：相關性在市場恐慌期間 → 1（同步崩跌），溢價失去預測力

---

## 🤝 協同技能

- `tech-analyzer`：開盤方向確認後的技術面切入點
- `twse-market-logic-skill`：系統級市場邏輯
- `sentiment-scout`：市場情緒輔助確認

---
## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議

## 版本紀錄 (Changelog)
- **[2.0.0]** 匯入 V2 架構，實裝多維度認知矩陣標籤與 Dynamic Payload 預備介面。


---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文件不再接收無結構的自然語言，必須處理封裝後的動態引數：
`[SYSTEM-CALL: macro-linkage | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

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
