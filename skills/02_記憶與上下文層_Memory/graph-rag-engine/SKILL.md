---
name: "graph-rag-engine"
description: "知識圖譜推演引擎。專責從 MemCube 中抽取實體 (Entities) 與關係 (Relationships)，建構 Knowledge Graph，並在面對複雜、多跳 (Multi-hop) 問題時執行圖譜遍歷 (Graph Traversal) 檢索。"
version: "1.0.0"
type: "cognitive"
capabilities:
  logic_depth: "實體關係推理、多跳圖譜檢索"
  strategic_focus: "結構化資料連結、跨文件知識整合"
  interaction_style: "分析與推演"
---

# Graph RAG Engine

## 功能概述
本技能解決單純向量搜尋無法處理的邏輯推演與跨實體關聯問題。

## 實作邏輯 (Implementation Logic)
1. **知識抽取**: 接收來自 Ingestor 的文字，使用 LLM 抽取 (主詞-動詞-受詞) 知識三元組。
2. **圖譜建構**: 將三元組寫入 In-Memory Graph (如 NetworkX 或 Memgraph)。
3. **圖譜遍歷**: 將使用者的自然語言轉為 Cypher 查詢或執行深度優先搜尋 (DFS)，提取相關的 Subgraph 供 LLM 參考。
