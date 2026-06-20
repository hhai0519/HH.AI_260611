import os
import subprocess
import time
from pathlib import Path

# Configuration
BASE_DIR = Path(__file__).parent.resolve()
SKILL_MD = Path(__file__).parent.parent / 'optimization-status' / 'SKILL.md'
RESULTS_TSV = BASE_DIR / 'results.tsv'
TARGET_BPB = 4.0

# Search Space
SEARCH_SPACE = [
    {'DEPTH': 2, 'LR': 3e-4},
    {'DEPTH': 2, 'LR': 5e-4},
    {'DEPTH': 3, 'LR': 3e-4},
    {'DEPTH': 3, 'LR': 5e-4},
    {'DEPTH': 4, 'LR': 3e-4},
]

def update_skill_md(best_bpb, current_exp, last_log):
    status_content = f"""---
name: optimization-status
description: 🤖 背景自動優化狀態監控器。目前正在針對 TinyStories 數據進行超參數 (DEPTH, LR) 實驗中。
---

# 自我進化：背景自動優化進度 (Auto-Evolution Status)

> [!NOTE]
> 這是由 本協作系統 核心系統主導的背景任務。目標是將 `val_bpb` 優化至 {TARGET_BPB} 以下。

## 當前實驗狀態
- **優化對象**：`autoresearch-cpu/train_cpu.py`
- **當前階段**：{'優化實驗進行中' if current_exp < len(SEARCH_SPACE) else '已完成階段優化'}
- **已跑實驗數**：{current_exp}
- **最佳指標 (val_bpb)**：{best_bpb if best_bpb < 100 else 'N/A'}
- **當前選用參數** (最近一次)：
  {last_log}

## 歷史實驗日誌摘要
請參閱 `results.tsv` 以獲取完整日誌。

---
*上次同步時間：{time.strftime('%Y-%m-%d %H:%M:%S')}*
"""
    SKILL_MD.parent.mkdir(parents=True, exist_ok=True)
    SKILL_MD.write_text(status_content, encoding='utf-8')

def run_experiment(depth, lr):
    env = os.environ.copy()
    env['DEPTH'] = str(depth)
    env['LR'] = f"{lr:.2e}"
    
    print(f"Running: DEPTH={depth}, LR={lr}...")
    try:
        # We use 'py' on Windows
        result = subprocess.run(['py', 'train_cpu.py'], env=env, cwd=BASE_DIR, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"ERROR in train_cpu.py: {result.stderr}")
        return result.stdout
    except Exception as e:
        print(f"CRASH in controller: {e}")
        return f"CRASH: {e}"

def extract_bpb(output):
    for line in output.split('\n'):
        if line.startswith('val_bpb:'):
            try:
                return float(line.split(':')[1].strip().split()[0])
            except:
                pass
    return 999.0

def get_best_bpb_from_tsv():
    default_best = 15.281531
    if not RESULTS_TSV.exists():
        return default_best
    try:
        best = default_best
        lines = RESULTS_TSV.read_text(encoding='utf-8').splitlines()
        for line in lines[1:]: # Skip header
            parts = line.split('\t')
            if len(parts) >= 3 and parts[2] == 'keep':
                try:
                    bpb = float(parts[1])
                    if bpb < best:
                        best = bpb
                except ValueError:
                    pass
        return best
    except Exception as e:
        print(f"Error reading results.tsv: {e}")
        return default_best

def main():
    print("Starting Auto-Optimization Controller...")
    best_bpb = get_best_bpb_from_tsv()
    print(f"Loaded current best val_bpb baseline: {best_bpb:.6f}")
    
    for i, params in enumerate(SEARCH_SPACE):
        depth = params['DEPTH']
        lr = params['LR']
        
        output = run_experiment(depth, lr)
        bpb = extract_bpb(output)
        
        status = "keep" if bpb < best_bpb else "discard"
        if status == "keep":
            best_bpb = bpb
            # In a real autoresearch we would git commit here
        
        # Log to TSV
        desc = f"experiment: DEPTH={depth}, LR={lr:.2e}"
        with open(RESULTS_TSV, 'a') as f:
            f.write(f"local\t{bpb:.6f}\t{status}\t{desc}\n")
        
        last_log = f"- `n_layer`: {depth}\n  - `LR`: {lr:.2e}\n  - `Result`: {bpb:.4f} ({status})"
        update_skill_md(best_bpb, i+1, last_log)
        
        print(f"Exp {i+1} Result: {bpb:.4f} ({status})")
        
        if bpb <= TARGET_BPB:
            print(f"TARGET REACHED: {bpb}")
            break

if __name__ == '__main__':
    main()
