---
name: "line-interaction-manager"
description: "Loki Swarm: 第一線溝通總管。專門處理 LINE Bot 介面互動，確保回覆符合品牌語氣，並保護底層金融邏輯不外洩。"
version: "1.0.0"
type: "action"
capabilities:
  logic_depth: "Context-Aware Natural Language Generation"
  strategic_focus: "品牌語氣維持、平台限制適配 (LINE API)、安全隔離"
  interaction_style: "RARV 執行者"
  semantic_firewall: "/Domain/Social/LineBot/"
  authorized_mcp_tools: ["Persona Knowledge MCP", "REST API MCP", "Webhook MCP"]
---

# LINE Interaction Manager (Frontline Communicator)

## 功能概述
本技能實作了 CLAW (Content-LLM-Automation-Workflow) 架構中的內容管理邏輯。它不負責做金融分析，只負責「說話」。

## 實作邏輯 (Implementation Logic)
1. **Semantic Firewall (語意防火牆)**: 工作記憶區限定於 `/Domain/Social/LineBot/` 與使用者的對話紀錄。它被刻意「蒙住眼睛」，看不到複雜的財務資料庫 Schema 或爬蟲原始碼。
2. **Platform Constraints (平台限制)**: 在回覆前，必須確保格式符合 LINE 的限制 (例如字數、Flex Message JSON 格式)。
3. **Zero-Trust Dispatch (零信任派發)**: 透過 `tool-executor` 呼叫 REST API MCP 發送訊息，確保所有對外通訊都經過 03 層的安全審計 (Audit Log)。
