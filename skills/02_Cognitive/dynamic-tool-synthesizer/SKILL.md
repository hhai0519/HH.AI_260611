---
name: "dynamic-tool-synthesizer"
description: "動態工具合成器。取代傳統的後端、資料工程與軟體架構師。具備知識編譯 (Knowledge Compilation) 能力，當發現現有工具或 API 整合不足時，能自主生成程式碼、測試並進行熱部署 (Hot-deploy) 以擴展系統能力。"
version: "1.0.0"
type: "cognitive"
capabilities:
  logic_depth: "因果最佳化、知識編譯 (Knowledge Compilation)、程式碼合成"
  strategic_focus: "能力自主擴展、快取推演邏輯"
  interaction_style: "底層自動化擴充"
---

# Dynamic Tool Synthesizer

## 功能概述
本技能讓系統具備「自我生長」的能力，當遇到沒有現成工具可用的情況時，能夠自己寫工具自己用。

## 實作邏輯 (Implementation Logic)
1. **Capability Gap 偵測**: 接收從 Orchestrator 傳來的工具缺失訊號。
2. **Code Generation & Testing**: 調用 Code-Gen LLM 生成特定的整合腳本或資料處理管線，並在沙盒中執行測試。
3. **Knowledge Compilation**: 記錄成功的解題邏輯與工具呼叫順序，將其「編譯」成一個快取的 Meta-package (新工具)，供後續重複使用。
4. **Hot-Deployment**: 將新生成的工具熱部署至 MCP 伺服器或系統的可用工具清單中。

## 認知顧問編譯能力 (Persona Knowledge Compilation)
當攔截到帶有 `persona_target` 標籤的任務需求時，本技能必須透過 `Persona Knowledge MCP` 去 `Data/personas/` 讀取對應的 Markdown 顧問設定檔，並利用 Knowledge Compilation 技術將其編譯為暫存的環境上下文或虛擬工具，動態提供給 Action 層使用。
