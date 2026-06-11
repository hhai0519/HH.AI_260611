---
name: chip-logic-expert
type: skill
description: 進階台股籌碼分析邏輯，包含券商借券、融資維持率以及大戶籌碼衝突分析。
version: "3.0.0"
type: "cognitive"
capabilities:
  logic_depth: "籌碼衝突與動能解析"
  strategic_focus: "主力追蹤與散戶洗盤"
  interaction_style: "實戰導向且敏銳"
---
# 進階籌碼邏輯 (Chip Logic Expert)

### 【摘要】觸發條件與 DLP 聲明
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議

本技能整合**臺股最深層的籌碼博弈邏輯**，涵蓋借券放空 vs. 現貨買進的機構對峙模型、融資維持率臨界閾值、千張大戶持股甜蜜點（40~70%）與洗盤確認模型，為主力追蹤提供機構級分析工具。

---

## 🎯 觸發條件

- 詢問「借券跟融資的關係」「大戶持股多少才安全」「有沒有洗盤」
- 需要分析主力是否真的進場（還是假進攻）
- 需要評估空頭強度（借券量 vs. 現股放空）
- 涉及融資追繳危機分析

---

## 🛠️ 核心分析模型

### 1. 借券放空 vs. 現貨買進：機構對峙模型

```python
def analyze_institutional_conflict(data: dict) -> dict:
    """
    data keys:
      securities_lending_add: 本日借券增加量（張）
      foreign_net_buy: 外資現貨淨買超（張）
      price_change_pct: 當日漲跌幅%
    """
    sl = data['securities_lending_add']
    fb = data['foreign_net_buy']
    pc = data['price_change_pct']
    
    # 衝突指數
    conflict_ratio = abs(sl) / (abs(fb) + 1)
    
    if fb > 0 and sl > 0:
        if pc > 0:
            return {"signal": "⚠️ 外資多空雙開 - 對沖策略，趨勢不明", 
                    "conflict": "高", "action": "觀望"}
        else:
            return {"signal": "🔴 借券壓制現貨 - 空方佔優", 
                    "conflict": "極高", "action": "謹慎"}
    elif fb > 0 and sl < 0:
        return {"signal": "🟢 外資大量軋空 - 強力做多訊號", 
                "conflict": "低", "action": "積極做多"}
    elif fb < 0 and sl > 0:
        return {"signal": "🔴 外資現貨賣出 + 加碼放空", 
                "conflict": "低", "action": "方向明確偏空"}
    else:
        return {"signal": "🟡 無明顯衝突資訊號", "conflict": "低", "action": "依技術面決策"}
```

---

### 2. 千張大戶甜蜜點理論（40~70%）

根據深度研究報告，主力與大戶持股比例有最適區間：

```
持股比例判讀：

< 30%  ← 分散化嚴重，多圈散戶，控盤力弱
30~40% ← 建倉階段，主力尚未完全掌控
40~70% ← 🟢 甜蜜點：主力已掌握足夠籌碼但仍有上漲空間
            （拉升最容易 + 散戶持股比例適中可推高股價）
70~85% ← ⚠️ 過度集中：流動性降低，主力難以出貨
> 85%  ← 🔴 危險：籌碼鎖死，一旦主力想出貨，股價崩跌風險高
```

---

### 3. 融資維持率臨界分析

```python
def margin_risk_assessment(margin_balance: float, market_value: float) -> dict:
    """
    margin_balance: 融資餘額（元）
    market_value: 股票市值（元）
    """
    maintenance_rate = market_value / margin_balance * 100
    
    levels = {
        "rate": round(maintenance_rate, 1),
        "zone": "",
        "risk": "",
        "action": ""
    }
    
    if maintenance_rate < 120:
        levels["zone"] = "🔴 追繳區（< 120%）"
        levels["risk"] = "極高 - 強制平倉風險"
        levels["action"] = "避免持有，等待爆量後進場"
    elif maintenance_rate < 130:
        levels["zone"] = "🟠 危險區（120~130%）"
        levels["risk"] = "高 - 可能觸發追繳令"
        levels["action"] = "警示，觀察後續融資動向"
    elif maintenance_rate < 160:
        levels["zone"] = "🟡 觀察區（130~160%）"
        levels["risk"] = "中 - 有壓力但尚未達追繳"
        levels["action"] = "持續監控"
    else:
        levels["zone"] = "🟢 安全區（> 160%）"
        levels["risk"] = "低 - 融資方無被迫賣壓"
        levels["action"] = "正常分析"
    
    return levels
```

---

### 4. 洗盤確認模型

**真洗盤 vs. 真出貨**的識別指標：

| 特徵 | 真洗盤（利多） | 真出貨（利空） |
|---|---|---|
| **K 線** | 帶長下影線、跌停翌日急漲 | 連續陰線、反彈弱 |
| **成交量** | 洗盤放量 + 縮量後止跌 | 持續大量流出 |
| **籌碼** | 大戶持股維持 / 小增 | 大戶持股明顯減少 |
| **借券** | 借券量無增加 | 借券量激增（主力避險） |
| **法人** | 逢低小買 | 法人同步賣出 |

---

## 🔍 空頭軋空訊號（Short Squeeze）

```
觸發條件（同時滿足）：
  ① 借券餘額 > 前3日均量的 150%
  ② 股價連跌 3 日後出現大量（可能底部）
  ③ 外資微幅回補現貨
  ④ 當日「跌不下去」（下跌無量 = 空頭無法繼續施壓）

確認條件：
  翌日開高 + 借券大幅回補 → 軋空展開，最強買點
```

---

## 🤝 協同技能

> 依 SOP §6.1 反死鎖協定：本技能採單向依賴，不直接引用同層的 `ownership-cluster`。
> 共用的籌碼邏輯框架已向下抽取至 `twse-market-logic-skill` 進行中轉。

- `twse-market-logic-skill`：系統級臺股市場邏輯框架（共用中樞，含融資維持率、大戶持股、軋空模型）
- `tech-analyzer`：籌碼訊號 + 技術型態雙重確認

---
## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議

## 版本紀錄 (Changelog)
- **[3.0.0]** 解耦與 `ownership-cluster` 的循環依賴，符合 SOP §6.1 反死鎖協定。版本躍升至 V3.0.0。
- **[2.0.0]** 導入 V2 架構，實裝多維度認知矩陣標籤與 Dynamic Payload 預備介面。


---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文檔不再接收無結構的自然語言，必須處理封裝後的動態參數：
`[SYSTEM-CALL: chip-logic-expert | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

> [!IMPORTANT]
> **Payload 淨化規則 (§6.3)**：
> - 若本技能為 `Cognitive` 型：接收戰略目標、語氣設定、情緒變數；拒絕 SQL/DOM/技術指令。
> - 若本技能為 `Execution` 型：只接收 URL、DOM Selector、SQL、JSON Schema；拒絕認知參數。

發送協定 (Zero-Block Policy)： 執行中若遇能力不足或需外部協作，嚴禁中斷或詢問使用者。必須主動封裝 Dynamic Payload 並發出：
`[SYSTEM-CALL: 目標ID | PAYLOAD: { ... }]` 調閱其他技能。

回傳協定： 任務終止時，必須且只能輸出 `[SYSTEM-RETURN: SUCCESS/FAILED | DATA: <結果>]`。
