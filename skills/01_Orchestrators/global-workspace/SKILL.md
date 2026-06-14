---
name: "global-workspace"
description: "動態工作流引擎。取代靜態的協作腳本與研究迴圈。實作 ReCAP (Recursive Context-Aware Planning) 引擎，負責遞迴式任務拆解、滑動視窗上下文廣播 (Context Broadcasting)，並透過 A2A Gateway 指揮 Loki Swarm。"
version: "1.0.0"
type: "orchestrator"
capabilities:
  logic_depth: "ReCAP 引擎、Global Workspace 理論"
  strategic_focus: "動態任務派發、防範上下文衰退 (Context Decay)"
  interaction_style: "任務排程與狀態廣播"
---

# Global Workspace

## 功能概述
本技能負責打破資訊孤島，確保所有 Agent 都「活在同一個現實」，並負責將龐大的任務拆解為可被獨立執行的子節點。

## 實作邏輯 (Implementation Logic)
1. **ReCAP 遞迴分解**: 接收來自 `active-inference` 的高階規格，將其分解為 Tree-of-Tasks。先執行第一個子任務，再根據回饋動態重塑剩餘任務。
2. **Sliding-Window Context**: 確保在深層遞迴推演中，不必要的舊思考痕跡會被修剪，只將最關鍵的「總結上下文 (Context Re-injection)」傳給下一個 Agent，防止 Context 撐爆。
3. **RARV 循環管理**: 強制每一個被委派的子任務都必須通過 Reason -> Act -> Reflect -> Verify 的循環，任何一個階段失敗即擋下，防止錯誤蔓延。
