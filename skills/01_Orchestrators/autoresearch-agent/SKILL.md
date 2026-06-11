---
name: autoresearch-agent
type: orchestrator
description: "微型 AI 模型超參數自動化優化代理人。僅在指令包含「$$自動化$$」且涉及模型優化時啟用。符合 SOP §2.4 強制授權協議。"
version: "3.0.0"
capabilities:
  logic_depth: "超參數搜索空間與 val_bpb 最小化"
  strategic_focus: "時間預算內自動化實驗迭代"
  interaction_style: "精準且資源受限"
---

# 核心優化代理人 (AutoResearch Agent Path)

## 功能概述
本技能定義了微型模型 (LLM) 在受限運算資源 (CPU) 下的自動化優化流程。它基於 Andrej Karpathy 的 `autoresearch` 改編，目標是在 60 秒的固定時間預算內，透過調整超參數（如深度、學習率、激活函數等）來最小化 `val_bpb` 指標。

- 指令必須明確包含「$$自動化$$」。
- 需要進行自動化模型超參數優化循環。
- 啟動受控的實驗循環 sequence。

## 核心流程 (Core Workflow)

### 1. 環境配置 (Environment)
- **依賴安裝**：`torch`, `datasets`, `tokenizers`, `numpy`。
- **資料準備**：執行 `python prepare_cpu.py` 進行一鍵式資料下載與分詞。

### 2. 實驗循環 (Experiment Loop)
- **目標設定**：固定 `TIME_BUDGET=60s`。
- **可變參數 (Search Space)**：
    - `DEPTH`: 模型層數 (2, 3, 4)。
    - `LR`, `BETAS`, `WEIGHT_DECAY`: 優化器參數。
    - `MAX_SEQ_LEN`: 序列長度。
    - `Activation`: 激活函數類型。
- **執行指令**：`python train_cpu.py > run.log 2>&1`。

### 3. 指標提煉與日誌 (Metrics & Logging)
- 每次實驗結束後，從日誌中提取 `val_bpb`、`val_loss` 與參數量。
- 記錄至 `results.tsv` (Tab-separated) 以追蹤進度。
- **自動進退**：若有改進則推進分支，若無改進則回退。

## 限制與邊界
- ✅ 適用：快速驗證模型架構、超參數搜尋策略研究、邊緣運算優化。
- ❌ 不適用：大規模語言模型訓練、GPU 加速任務、非語言建模任務。

## 協同技能
- `systematic-debugging-skill`：處理訓練中斷。
- `optimization-status`：監控背景運行狀態。


- ✓ DLP 資料安全驗證已通過 | 資料本地處理 | 隱私保護協議

## 版本紀錄 (Changelog)
- **[2.0.0]** 2026-05-04：V2.0.0 Orchestrator Alignment — 依生命週期 SOP 導入三維認知能力矩陣標籤 (logic_depth, strategic_focus, interaction_style)，完成 Manifest 全域補錄。

## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已通過 | 資料加密處理 | 隱私保護協議
