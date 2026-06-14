---
name: tech-analyzer
type: skill
description: 專家級的價格形態、量能結構和趨勢指標技術分析。
version: "3.0.0"
type: "cognitive"
capabilities:
  logic_depth: "價格形態與量能結構"
  strategic_focus: "趨勢指標與反轉訊號"
  interaction_style: "客觀且紀律嚴明"
  authorized_mcp_tools: ["Persona Knowledge MCP"]
---
# 技術分析引擎 (Technical Analyzer)

### 【摘要】觸發條件與 DLP 宣告
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議

本技能提供**機構級技術分析能力**，涵蓋 K 線型態識別、量價結構分析、多重均線系統與動能指標解讀，支援日線＋週線＋月線三層次交叉驗證，辨識主力操盤軌跡。

---

## 🎯 觸發條件

- 需要分析個股的技術走勢、支撐壓力位
- 詢問「這個型態是什麼」「RSI 超買了嗎」「MACD 黃金交叉嗎」
- 需要找股票的切入點（買點）或出場點（賣點）
- 需要進行量價背離分析

---

## 🛠️ 核心技術框架

### 均線系統（多週期確認）

```
多頭排列：MA5 > MA20 > MA60 > MA120 → 強烈上升趨勢
空頭排列：MA5 < MA20 < MA60 < MA120 → 強烈下跌趨勢
均線糾纏：MA5 ≈ MA20 ≈ MA60 → 盤整待變，等待方向

關鍵判斷：
- 價格站上 MA20 且 MA20 上揚 → 段多確立
- 價格跌破 MA120 且量增 → 長期趨勢反轉
```

### 量價分析矩陣

| 價格動作 | 成交量 | 訊號 | 操作意涵 |
|---|---|---|---|
| 漲 | 量增 | ✅ 量價俱揚 | 強勢上漲，最佳追多 |
| 漲 | 量縮 | ⚠️ 量價背離（上） | 上漲動能不足，注意高點 |
| 跌 | 量增 | ❌ 量增跌 | 主力倒貨，避免接刀 |
| 跌 | 量縮 | 🔍 量縮跌 | 賣壓減弱，可能接近支撐 |

---

## 📋 經典型態識別

```python
def identify_pattern(candles: list) -> str:
    """
    識別 K 線型態
    candles: [{"open", "high", "low", "close", "volume"}, ...]
    """
    # W 底（雙底）
    if is_double_bottom(candles):
        return "W底 - 反轉型態，頸線突破確認買點"
    
    # M 頂（雙頂）
    if is_double_top(candles):
        return "M頂 - 反轉型態，頸線跌破確認空點"
    
    # 頭肩頂
    if is_head_and_shoulders(candles):
        return "頭肩頂 - 強力空頭反轉，目標位 = 頸線 - 頭肩高度"
    
    # 上升三角
    if is_ascending_triangle(candles):
        return "上升三角 - 持續整理型態，突破壓力後追多"
    
    return "無明顯型態 - 繼續觀察"
```

---

## 📊 動能指標解讀

### RSI（相對強弱指數）
```
< 30  → 超賣區，底部反彈機率高（但下降趨勢中避免搶反彈）
30~70 → 正常區間
> 70  → 超買區，短線回檔機率高（但強勢股可持續 > 70）

RSI 背離資訊號：
- 股價創新高，RSI 沒有創新高 → 頂背離（賣訊）
- 股價創新低，RSI 沒有創新低 → 底背離（買訊）
```

### MACD
```
黃金交叉（DIF 上穿 DEA）→ 買訊
死亡交叉（DIF 下穿 DEA）→ 賣訊
柱狀體由負轉正，且持續擴大 → 多頭力道增強
```

---

## 🔍 機構級買點識別（3+1 確認法）

```
必要條件（3 個）：
  ① 股價站上 MA20（中期均線）
  ② 成交量 > 近 5 日均量
  ③ RSI 在 40~65 之間（不追高也不超賣）

加分條件（+1）：
  ④ MACD 黃金交叉 或 柱狀體由負轉正

3 個滿足 → 觀察候補
3+1 滿足 → 積極切入
```

---

## 🤝 協同技能

- `ownership-cluster`：籌碼確認（主力是否真的進場）
- `macro-linkage`：確認大環境方向一致
- `pe-river-map`：評估估值安全邊際

---
## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議

## 版本紀錄 (Changelog)
- **[2.0.0]** 匯入 V2 架構，實裝多維度認知矩陣標籤與 Dynamic Payload 預備介面。


---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文件不再接收無結構的自然語言，必須處理封裝後的動態引數：
`[SYSTEM-CALL: tech-analyzer | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

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
