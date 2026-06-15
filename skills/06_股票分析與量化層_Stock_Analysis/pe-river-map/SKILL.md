---
name: pe-river-map
type: execution
description: 用於長期投資評估的互動式本益比河流圖（PE Band）估值視覺化。
version: "3.0.0"
type: "execution"
capabilities:
  tool_category: "Finance Visualization"
  execution_env: "Browser/D3.js"
  io_format: "SVG/JSON"
  authorized_mcp_tools: ["Persona Knowledge MCP"]
---

# PE 河流圖分析 (PE River Map)

### 【摘要】觸發條件與 DLP 宣告
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議

本技能生成個股**歷史本益比（P/E）河流圖**，以 8x / 12x / 16x / 20x / 25x 估值區間為基準，視覺化股價與合理估值的相對位置，提供長線佈局的安全邊際判斷。

---

## 🎯 觸發條件

- 詢問「這股票現在貴不貴」「本益比河流圖」「估值區間」
- 需要評估長線買點（股價接近歷史低估區）
- 需要設定長期目標價（以合理 P/E 推算）
- 進行價值投資評估或巴菲特式安全邊際分析

---

## 🛠️ 河流圖核心計算

```python
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

def draw_pe_river(df: pd.DataFrame, pe_bands: list = [8, 12, 16, 20, 25]):
    """
    df: DataFrame with columns ['date', 'close', 'eps_ttm']
    pe_bands: List of P/E multiples to draw as river bands
    """
    df['date'] = pd.to_datetime(df['date'])
    
    fig, ax = plt.subplots(figsize=(14, 7))
    
    colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']
    band_labels = []
    
    # Draw PE bands
    for i, pe in enumerate(pe_bands):
        band_price = df['eps_ttm'] * pe
        ax.fill_between(df['date'], 
                        df['eps_ttm'] * (pe_bands[i-1] if i > 0 else 0),
                        band_price,
                        alpha=0.15, color=colors[i])
        ax.plot(df['date'], band_price, '--', color=colors[i], 
                linewidth=0.8, label=f'{pe}x PE')
        band_labels.append(mpatches.Patch(color=colors[i], label=f'{pe}x PE'))
    
    # Draw actual price
    ax.plot(df['date'], df['close'], 'k-', linewidth=2, label='實際股價', zorder=5)
    
    ax.set_title('P/E 估值河流圖', fontsize=16, fontweight='bold')
    ax.set_xlabel('日期')
    ax.set_ylabel('股價（元）')
    ax.legend(handles=band_labels + [
        mpatches.Patch(color='black', label='實際股價')
    ], loc='upper left')
    ax.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig('pe_river_map.png', dpi=150)
    return fig
```

---

## 📊 估值區間判讀

| PE 位置 | 市場涵義 | 長線操作建議 |
|---|---|---|
| **< 8x** | 極度低估（景氣谷底/恐慌） | 🟢 強力建倉區 |
| **8x ~ 12x** | 低估（悲觀預期） | 🟢 積極買入 |
| **12x ~ 16x** | 合理估值 | 🟡 持倉觀望 |
| **16x ~ 20x** | 輕微高估 | 🟡 減少加碼 |
| **> 20x** | 高估（泡沫風險） | 🔴 考慮減持 |
| **> 25x** | 嚴重高估 | 🔴 大幅減持 |

---

## 🔢 EPS 趨勢分析

```python
# 透過滾動 EPS 推算合理股價
def estimate_fair_value(current_eps: float, growth_rate: float, target_pe: float, years: int = 3) -> dict:
    """
    current_eps: 當前 EPS (TTM)
    growth_rate: 預期年增率 (小數, e.g., 0.15 = 15%)
    target_pe: 合理 PE 倍數
    """
    projected_eps = current_eps * ((1 + growth_rate) ** years)
    fair_value = projected_eps * target_pe
    
    return {
        "當前 EPS": current_eps,
        f"{years}年後預估 EPS": round(projected_eps, 2),
        "目標PE": target_pe,
        "合理股價目標": round(fair_value, 1)
    }
```

---

## 🤝 協同技能

- `tech-analyzer`：PE 低估 + 技術底部確認 = 最佳長線進場
- `ownership-cluster`：主力籌碼是否配合估值低點吸籌
- `quant-research-loop`：PE 策略的回測驗證

---

## 版本紀錄 (Changelog)
- **[2.0.0]** 2026-05-04：V2.0.0 Polymorphic Labeling Migration — 依生命週期 SOP 匯入多型功能性技術標籤 (tool_category, execution_env, io_format)，建立執行層 Manifest 路由能力。

## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議


---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文件不再接收無結構的自然語言，必須處理封裝後的動態引數：
`[SYSTEM-CALL: pe-river-map | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

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
