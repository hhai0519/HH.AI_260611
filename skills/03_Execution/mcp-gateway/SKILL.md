---
name: "mcp-gateway"
description: "Zero-Trust 萬用執行閘道器。負責啟動並連接所有的 MCP (Model Context Protocol) 伺服器，管理安全白名單 (mcp_config.json)，並訂閱外部資料的即時更新 (Server-Sent Events 推播)。"
version: "1.0.0"
type: "execution"
capabilities:
  logic_depth: "Broker Pattern, Observer/Pub-Sub Pattern"
  strategic_focus: "Zero-Trust 安全性控管、連線池管理、事件推播"
  interaction_style: "背景非同步伺服器"
---

# MCP Gateway (Broker & Mediator)

## 功能概述
本技能取代了舊有零散的連線腳本 (`mcp-builder`, `mcp-setup`, `connect-apps`)。它作為系統中所有外部互動的唯一出入口，確保 Agent 只能使用被明確授權的工具。

## 實作邏輯 (Implementation Logic)
1. **Zero-Trust 初始化**: 啟動時強制讀取 `mcp_config.json`。任何未在白名單中的 MCP 伺服器或指令皆被阻斷。
2. **連線生命週期管理**: 透過 JSON-RPC 2.0 建立 Client-Host-Server 架構，負責 Capability Negotiation (能力交涉) 與憑證管理 (OAuth)。
3. **即時事件訂閱 (Pub/Sub)**: 支援 Streamable HTTP 與 Server-Sent Events (SSE)。當外部資源 (如資料庫或檔案系統) 發生變化時，主動推播通知給需要的 Agent，取代低效的 polling 迴圈。
