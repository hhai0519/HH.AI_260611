---
name: "episodic-consolidation"
description: "長期記憶生命週期管理者。取代人工的交接手冊與靜態 SOP。負責將完成的任務或重大的失敗經驗，壓縮並歸檔至 4-Layer Hybrid Memory (情境/語意/程序記憶) 中，供 MCP 伺服器未來精準檢索。"
version: "1.0.0"
type: "orchestrator"
capabilities:
  logic_depth: "4-Layer Memory Management、Progressive Disclosure"
  strategic_focus: "知識留存、避免 Context Rot"
  interaction_style: "記憶體收斂與索引建立"
---

# Episodic Consolidation

## 功能概述
本技能負責在每次專案或長程推演告一段落時，進行大腦的「睡眠鞏固」，把短暫的工作記憶轉化為長期的智慧。

## 實作邏輯 (Implementation Logic)
1. **Working Memory 擷取**: 攔截 ReCAP 引擎中已經解決的樹狀節點，提取出有價值的最終決策與解法。
2. **記憶壓縮與分類 (4-Layer Sorting)**:
   *   將犯過的錯與避雷指南存入 **Episodic Memory** (情境記憶)。
   *   將專案不變的架構事實 (如：本專案使用 FastAPI) 存入 **Semantic Memory** (語意記憶)。
   *   將可重複使用的通用工具邏輯，交由 `self-improvement` 轉化為 **Procedural Memory** (程序記憶)。
3. **Progressive Disclosure**: 建立輕量級的索引。確保未來 Agent 在調用知識時，只會先看到目錄，直到明確請求時才將完整知識載入 Context，徹底消除 Context Rot (記憶體腐敗)。
