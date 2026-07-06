---
name: artifacts-builder
type: execution
description: 一套用於使用現代前端 Web 技術（React、Tailwind CSS、shadcn/ui）建立精細、多元件 HTML 成品的工具。適用於需要狀態管理、路由或 shadcn/ui 元件的複雜成品。
version: "3.0.0"
type: "execution"
capabilities:
  tool_category: "UI Builder"
  execution_env: "Browser/React"
  io_format: "HTML/JSX"
  authorized_mcp_tools: ["Persona Knowledge MCP"]
---

# Artifacts 原型建構 (Artifacts Builder)

### 【摘要】觸發條件與 DLP 宣告
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議

本技能專精於建立功能完整的**互動式 HTML 原型**，整合 React、Tailwind CSS 與 shadcn/ui 元件庫，能快速呈現複雜 UI 概念或可執行的前端原型。

---

## 🎯 觸發條件

- 需要建立互動式 UI 演示或原型
- 需要多頁面路由的 Web 應用原型
- 需要使用 shadcn/ui 標準元件（Button、Dialog、Table...）
- 需要帶有狀態管理的複雜 UI（購物車、表單驗證、即時篩選）
- 簡單靜態 HTML 已無法滿足需求

---

## 🏗️ 技術選型

| 場景 | 推薦選擇 |
|---|---|
| 簡單靜態頁面 | 直接 HTML + CSS + JS（不使用本技能） |
| **複雜互動原型** | **本技能（React + Tailwind + shadcn）** |
| 需要路由 | React + React Router |
| 需要狀態管理 | React useState / useReducer / Zustand |
| 圖表元件 | Recharts / D3（搭配 `d3js-visualization`）|

---

## 📋 標準建構流程

```
1. 分析需求 → 定義元件樹
2. 設計 Token（色彩/字型/間距）
3. 建立基礎佈局元件
4. 實作各功能頁面
5. 串接狀態管理
6. 加入動畫與微互動
7. 驗證響應式設計
```

---

## 🎨 元件架構範例

```jsx
// shadcn/ui 標準元件整合
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function SkillCard({ skill, category, dlpStatus }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {skill.name}
          <Badge variant={dlpStatus ? "success" : "destructive"}>
            {dlpStatus ? "✅ DLP" : "❌ No DLP"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{skill.description}</p>
      </CardContent>
    </Card>
  );
}
```

---

## 💡 設計品質標準

> [!IMPORTANT]
> 所有 Artifact 輸出必須達到「WOW 效果」——首次看到即令人印象深刻。
> - ✅ 使用 Google Fonts（Inter、Outfit）
> - ✅ 實作 hover 效果與微動畫
> - ✅ 深色模式支援
> - ✅ 響應式設計（Mobile-first）
> - ❌ 不使用純藍/純紅等普通顏色
> - ❌ 不留白或佔位符

---

## 🤝 協同技能

- `theme-factory`：取得專業配色方案
- `d3js-visualization`：整合複雜圖表元件
- `elon-musk-perspective`：「第一性原理」驗證 UI 設計邏輯

---

## 版本紀錄 (Changelog)
- **[2.0.0]** 2026-05-04：V2.0.0 Polymorphic Labeling Migration — 依生命週期 SOP 匯入多型功能性技術標籤 (tool_category, execution_env, io_format)，建立執行層 Manifest 路由能力。

## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議


---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文件不再接收無結構的自然語言，必須處理封裝後的動態引數：
`[SYSTEM-CALL: artifacts-builder | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

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
