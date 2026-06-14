---
name: "self-improvement"
description: "系統的自我進化與修復協議。取代靜態的技能治理。定期掃描 AUDIT_LOG 與失敗的 RARV 紀錄，找出流程瓶頸，並自動覆寫底層的程式碼與 procedural memory (技能規範)，讓系統愈用愈聰明。"
version: "1.0.0"
type: "orchestrator"
capabilities:
  logic_depth: "Textual Backpropagation、Meta-Evolution"
  strategic_focus: "自我修復、長期適應性"
  interaction_style: "背景非同步稽核"
---

# Self Improvement (Meta-Evolution)

## 功能概述
本技能讓 Agentic Swarm 具備自我學習能力，不會永遠卡在同一個死胡同。

## 實作邏輯 (Implementation Logic)
1. **Textual Backpropagation**: 將 `Epistemic-State-Governor` 擋下的失敗紀錄或編譯器報錯當作「Loss Signal (損失函數)」，反向追蹤是哪個 Agent、哪段 Prompt 或哪個 SOP 造成的問題。
2. **自動打補丁 (Auto-Patching)**: 當發現某個 API 用法已過期或某種思考模式常導致無限迴圈，此技能會自動改寫導致錯誤的 `.skill.md` (程序記憶)，永久更新系統知識。
3. **回歸測試 (Regression Verification)**: 在應用補丁前，自動發起一個小型沙盒驗證，確保新的技能規範沒有破壞既有功能。
