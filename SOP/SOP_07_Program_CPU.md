---
title: "AutoResearch CPU 實驗框架（已遷移）"
version: "3.1.3"
tags: ["SOP", "AutoResearch", "CPU", "已遷移"]
dependencies: ["SOP_09_AutoResearch_CPU.md"]
---

> [!IMPORTANT]
> **本文件已依 V3.1.3 規範遷移至 `SOP_09_AutoResearch_CPU.md`（正體中文完整版），請參閱新版文件。本檔案保留作向後相容參考。**

# autoresearch CPU ??- 撖阡??誘??# Adapted from karpathy/autoresearch program.md

This is the CPU-compatible version of autoresearch.
Target: minimize val_bpb on TinyStories validation set.
Constraint: 60-second time budget per experiment.

## Setup

1. Install dependencies:
   py -m pip install torch datasets tokenizers numpy

2. Prepare data (one-time):
   python prepare_cpu.py

3. Create experiment branch:
   git checkout -b autoresearch/YYYYMMDD

4. Verify results.tsv has header row only.

5. Confirm: python train_cpu.py (dry-run with random data if no real data)

## Experimentation

Each experiment runs with TIME_BUDGET=60 seconds.
Run: python train_cpu.py > run.log 2>&1

What you CAN modify (in train_cpu.py):
- DEPTH (n_layer) ??try 2, 3, 4
- ASPECT_RATIO ??changes model width
- LR, BETAS, WEIGHT_DECAY
- MAX_SEQ_LEN (keep low for CPU)
- Activation function in MLP
- Optimizer type (AdamW vs SGD with momentum)
- RMSNorm vs LayerNorm

What you CANNOT modify:
- prepare_cpu.py (data loading / evaluation)
- The evaluate() function structure
- Time budget (60s)

Goal: minimize val_bpb. Lower = better.

## Output format

---
val_bpb:          2.345678
val_loss:         1.625432
training_seconds: 60.1
total_seconds:    62.3
num_steps:        45
num_params_M:     0.07

## Logging

Log to results.tsv (tab-separated):
commit | val_bpb | status | description

Status values: keep, discard, crash

## LOOP FOREVER

Once started, do NOT pause to ask if you should continue.
Run approx 12+ experiments per sleep session (each ~60s + overhead).
Advance branch on improvement, git reset on equal/worse.

Extract metric:
  grep "^val_bpb:" run.log

