---
name: "unified-memcube-ingestor"
description: "統一的記憶中樞匯入器。取代傳統的獨立檔案解析器，負責將結構化與非結構化檔案 (PDF, CSV, XLSX, Chat Logs) 轉換為帶有層次化 Metadata 的 Contextual Chunks，並封裝為標準 MemCube 物件以供長期記憶儲存。具備 Context-Aware Ingestion 能力，可動態判斷新增、更新或刪除記憶。"
version: "1.0.0"
type: "cognitive"
capabilities:
  logic_depth: "Context-Aware Ingestion, 結構化文本還原"
  strategic_focus: "Metadata 生成、避免記憶污染、版本追蹤"
  interaction_style: "自動化處理、背景索引"
---

# Unified MemCube Ingestor

## 功能概述
本技能負責將任何形式的外部輸入轉化為 AI Agent 可理解的長期記憶物件 (`MemCube`)。

## 實作邏輯 (Implementation Logic)
1. **結構解析 (Structural Parsing)**: 透過先進解析器 (如 Docling) 將文件轉為 Markdown，保留標題與表格結構。
2. **Metadata 生成**: 呼叫 LLM 產生文件級摘要與段落級屬性 (如：可回答的問題、實體名詞)。
3. **Contextual Chunking**: 將 Metadata 前置於切片文字，使向量特徵更具語意代表性。
4. **Context-Aware Ingestion**: 寫入前先檢索 Vector DB，由 LLM 決定操作 (`ADD`, `UPDATE`, `DELETE`)，並維護 `replaces_id` 確保版本歷史完整。
5. **MemCube 封裝**: 結合 Metadata Header (權限、時間戳記) 與 Payload 寫入資料庫。
