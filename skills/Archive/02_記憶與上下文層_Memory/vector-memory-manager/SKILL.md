---
name: "vector-memory-manager"
description: "向量記憶體管理員。負責管理高維度 Vector DB 與稀疏矩陣 (BM25) 的資料儲存與語意相似度檢索。採用 Matryoshka 雙維度架構進行高速過濾與精確排序。"
version: "1.0.0"
type: "cognitive"
capabilities:
  logic_depth: "語意相似度計算、純量過濾"
  strategic_focus: "高效能、大容量召回"
  interaction_style: "底層元件、無對話介面"
---

# Vector Memory Manager

## 功能概述
本技能為基礎檢索層，處理向量化資料的 CRUD 與相似度計算。

## 實作邏輯 (Implementation Logic)
1. **Matryoshka 雙維度嵌入**: 產出 256D 供高速候選名單過濾，以及 768D 供精確語意重排。
2. **混合儲存支援**: 同時維護 Dense Vector 與 Sparse Keyword (BM25) 的索引。
3. **Payload 過濾**: 支援基於 MemCube Metadata (如 `is_current=true`, `owner_id`) 的純量過濾 (Scalar Filtering)。
