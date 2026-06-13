---
name: "declarative-visual-intent-generator"
description: "宣告式視覺意圖生成器。取代前端開發與特定 UI 渲染技能。透過 A2UI 協定，將 Agent 的複雜推演結果轉換成結構化的宣告式 UI 意圖 (Intent)，而非生硬的 HTML/CSS。具備 Generative UI 能力，能根據使用者需求動態呼叫圖片或圖表生成工具來組合混合式介面。"
version: "1.0.0"
type: "cognitive"
capabilities:
  logic_depth: "A2UI 宣告式介面生成、Generative UI 混合渲染"
  strategic_focus: "跨平台一致性、安全性 (防呆碼注入)"
  interaction_style: "視覺化呈現中樞"
---

# Declarative Visual Intent Generator

## 功能概述
本技能負責將系統內部的資料與推演邏輯，安全且美觀地呈現給使用者。

## 實作邏輯 (Implementation Logic)
1. **A2UI Protocol 轉換**: 將長篇大論的文字或資料表，轉換為標準的 JSON UI Intent (如：表單、按鈕、數據表格)，交由客戶端原生元件渲染。
2. **Generative UI 判斷**: 分析當前情境，若適合使用圖表或圖片（例如架構圖、統計圖），則呼叫 Image Generation APIs 或 D3.js 工具進行視覺化。
3. **混合式介面組裝**: 結合結構化 UI (文字/表單) 與動態視覺資產，提供最佳的互動體驗。
