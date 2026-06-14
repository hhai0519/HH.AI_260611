---
name: "tool-executor"
description: "萬用工具執行器。作為大腦層 (System 2) 與外部環境之間的唯一橋樑。將自然語言意圖轉換為嚴謹的 JSON-RPC 工具呼叫，並提供完整的 Audit Log 追蹤。"
version: "1.0.0"
type: "execution"
capabilities:
  logic_depth: "Client-Host-Server Model, Deterministic Execution"
  strategic_focus: "消除黑箱作業、提供高度可審計性"
  interaction_style: "同步 / 非同步函數呼叫"
---

# Tool Executor (Deterministic Bridge)

## 功能概述
本技能取代了高達 18 個硬體編碼的自動化腳本 (包含網頁爬蟲、PDF解析、資料處理等)。它本身不包含任何業務邏輯，而是負責「正確地」將 Agent 的需求傳遞給 MCP Gateway，並將結果結構化返回。

## 實作邏輯 (Implementation Logic)
1. **Schema 驗證**: 在將需求發送給 Gateway 前，根據 MCP Server 提供的 Schema 進行嚴格的型別與參數驗證，確保 JSON-RPC Request 格式完全正確。
2. **RARV 循環對接**: 當 Loki Swarm 進入 RARV 迴圈的 "Act" (行動) 階段時，強制調用此技能，防止 Agent 直接寫 code 去執行高風險操作。
3. **Traceability (可追溯性)**: 強制將每一次的工具呼叫 (Request Payload)、執行結果 (Result) 以及錯誤狀態 (Error) 記錄到系統層級的 Audit Log 中，確保系統具備 Enterprise-grade 的可審計性。
