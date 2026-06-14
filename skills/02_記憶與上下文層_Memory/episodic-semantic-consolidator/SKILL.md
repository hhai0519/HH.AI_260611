---
name: "episodic-semantic-consolidator"
description: "記憶整合與反思模組。負責管理情境記憶 (Episodic) 與語意記憶 (Semantic) 之間的轉換，定時進行對話日誌的濃縮 (Consolidation)、遺忘 (Decay) 與永久性知識萃取。"
version: "1.0.0"
type: "cognitive"
capabilities:
  logic_depth: "記憶濃縮、模式識別"
  strategic_focus: "系統長效穩定性、避免 Token 浪費"
  interaction_style: "背景非同步執行"
---

# Episodic Semantic Consolidator

## 功能概述
本技能是系統的「潛意識與睡眠反思」機制，確保 Agent 不會因為無窮盡的對話紀錄而變得遲鈍。

## 實作邏輯 (Implementation Logic)
1. **日誌紀錄 (Write-After-Acting)**: 將系統的所有操作、對話結果以時間戳記存為情境事件 (Events)。
2. **定時反思 (Periodic Reflection)**: 每日或每 Session 結束後觸發背景排程，掃描情境記憶。
3. **模式提取**: 將重複出現的特徵或使用者偏好，從情境中抽離出來，晉升為不受時間限制的「語意記憶 (Semantic Memory)」。
4. **記憶老化 (Decay)**: 根據重要性分數與存取頻率，對無用的原始日誌進行衰減或強制遺忘，釋放空間。
