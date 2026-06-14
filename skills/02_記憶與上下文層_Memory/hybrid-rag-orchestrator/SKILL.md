---
name: "hybrid-rag-orchestrator"
description: "混合檢索總指揮官。代理系統的記憶提取核心，平行調度 Vector、BM25 與 Graph 檢索結果，執行 RRF 融合、時間感知加權 (Temporal Boosting) 與 Cross-Encoder 重排，提供最精確的上下文。"
version: "1.0.0"
type: "orchestrator"
capabilities:
  logic_depth: "混合檢索融合、時間權重計算、Cross-Encoder Re-ranking"
  strategic_focus: "精確度最大化、上下文視窗優化"
  interaction_style: "最高級檢索決策者"
---

# Hybrid RAG Orchestrator

## 功能概述
本技能是系統提取記憶的單一入口。

## 實作邏輯 (Implementation Logic)
1. **平行檢索**: 同時向 `vector-memory-manager` 與 `graph-rag-engine` 發起檢索。
2. **RRF 融合**: 以 70% 向量分數與 30% BM25 關鍵字分數的比例，進行 Reciprocal Rank Fusion，兼顧語意涵蓋與精確名詞錨定。
3. **Temporal Boosting**: 若判定為時間敏感問題，基於事件時間距離給予權重加成。
4. **去重與過濾**: 移除相似度 >99% 的重複版本。
5. **最終重排 (Cross-Encoder)**: 利用 BGE-2 級別的模型對所有匯集的 Context 進行最終排序，只截取最精華的 N 個 Chunk 提供給生成模型。
