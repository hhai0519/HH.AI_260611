---
name: "real-time-stream-orchestrator"
description: "即時串流總指揮。取代傳統的話術腳本與溝通風格包裝。實作 Interactive ReAct 架構，支援非同步的「邊想邊說、邊聽邊想」，並透過 AG-UI 協定將推演過程即時投影至前端介面。"
version: "1.0.0"
type: "cognitive"
capabilities:
  logic_depth: "Interactive ReAct、AG-UI 即時事件串流、Affective Grounding"
  strategic_focus: "流暢互動體驗、打斷處理"
  interaction_style: "直接與用戶的互動介面"
---

# Real-Time Stream Orchestrator

## 功能概述
本技能負責管理 Agent 與使用者之間對話的時間軸與節奏，讓 AI 的回應更像一個有思考過程的活人。

## 實作邏輯 (Implementation Logic)
1. **Interactive ReAct 迴圈**: 解耦「觀察-思考-行動」的死板順序。當系統需要長時間思考時，先輸出「讓我深思一下...」的 Filler Phrase，填補空白時間。
2. **打斷處理 (Interruption Handling)**: 當使用者在思考中途補充資訊時，立即將新資訊併入 Context Window，無縫接續先前的思考進度，而非重新開始。
3. **AG-UI SSE 串流**: 將內部的推演狀態 (如：正在檢索資料庫、正在合成工具) 轉換為標準 Server-Sent Events 發送給前端，提供透明的思考進度條。
4. **Affective Grounding (Valence Engine)**: 動態感知使用者的情緒與急迫性，自動調整輸出的口吻與長短。
