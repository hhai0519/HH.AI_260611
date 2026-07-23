import os
import subprocess
import time
from pathlib import Path
import json
import urllib.request
import urllib.error

# Load environment variables
def load_env():
    base_dir = Path(__file__).parent.resolve()
    paths = [
        base_dir / '.env',
        base_dir / '../.env',
        base_dir / '../../.env',
        base_dir / '.env.local',
        base_dir / '../.env.local',
        base_dir / '../../.env.local',
        base_dir.parent.parent.parent / '.env',
        base_dir.parent.parent.parent / '.env.local'
    ]
    for p in paths:
        if p.exists():
            try:
                with open(p, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#'):
                            parts = line.split('=', 1)
                            if len(parts) == 2:
                                key = parts[0].strip()
                                val = parts[1].strip()
                                if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                                    val = val[1:-1]
                                if key not in os.environ:
                                    os.environ[key] = val
            except Exception as e:
                print(f"[ENV-INIT] Error loading env: {e}")

load_env()
INTERNAL_GATEWAY_TOKEN = os.getenv('INTERNAL_GATEWAY_TOKEN', 'mock-internal-secret-token')
BRIDGE_URL = os.getenv('BRIDGE_URL', 'http://localhost:3000')

def get_lock_status_from_bridge():
    url = f"{BRIDGE_URL}/lock/status"
    headers = {
        'Content-Type': 'application/json',
        'x-internal-secret': os.getenv('INTERNAL_GATEWAY_TOKEN', 'mock-internal-secret-token')
    }
    req = urllib.request.Request(url, headers=headers, method='GET')
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            res_data = response.read().decode('utf-8')
            return json.loads(res_data)
    except Exception as e:
        print(f"[ORPHAN-CHECK] Failed to contact bridge for lock status: {e}")
        return None

def clean_orphans():
    print("[ORPHAN-CHECK] Scanning for orphan training processes...")
    scratch_dir = BASE_DIR / 'scratch'
    if not scratch_dir.exists():
        return
        
    pid_files = list(scratch_dir.glob("train_cpu_*.pid"))
    if not pid_files:
        print("[ORPHAN-CHECK] No PID files found. No orphans to clean.")
        return
        
    lock_status = get_lock_status_from_bridge()
    is_lock_valid = False
    lock_owner = None
    
    if lock_status:
        is_lock_valid = not lock_status.get('is_expired', True)
        lock_owner = lock_status.get('current_owner')
        
    for pf in pid_files:
        try:
            with open(pf, 'r', encoding='utf-8') as f:
                pdata = json.load(f)
            
            pid = pdata.get('pid')
            expected_creation = pdata.get('creation_time')
            run_id = pdata.get('run_id')
            
            if not pid or not expected_creation:
                continue
                
            is_alive = False
            creation_match = False
            
            if os.name == 'nt':
                cmd = f'powershell -NoProfile -Command "$p = Get-CimInstance Win32_Process -Filter \\"ProcessId = {pid}\\"; if ($p) {{ $p.CreationDate.ToFileTime().ToString() }} else {{ \\"\\" }}"'
                res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=5)
                actual_creation = res.stdout.strip()
                
                if actual_creation:
                    is_alive = True
                    try:
                        diff = abs(int(actual_creation) - int(expected_creation))
                        if diff < 20000000: # 2 seconds tolerance
                            creation_match = True
                    except Exception:
                        if actual_creation == expected_creation:
                            creation_match = True
            else:
                if os.path.exists(f"/proc/{pid}/stat"):
                    is_alive = True
                    with open(f"/proc/{pid}/stat", 'r') as f:
                        parts = f.read().split()
                        if len(parts) >= 22:
                            actual_creation = parts[21]
                            if actual_creation == expected_creation:
                                creation_match = True
                                
            if is_alive:
                if creation_match:
                    should_kill = False
                    if not lock_status:
                        print(f"[ORPHAN-CHECK] Bridge unreachable. Skipping process {pid} kill to prevent false alarm.")
                    elif not is_lock_valid or lock_owner != "train_worker":
                        should_kill = True
                        reason = "lock expired or owned by others"
                        
                    if should_kill:
                        print(f"[ORPHAN-CHECK] Killing orphan process {pid} (Run: {run_id}) due to {reason}...")
                        if os.name == 'nt':
                            subprocess.run(f"taskkill /F /PID {pid}", shell=True)
                        else:
                            try: os.kill(pid, 9)
                            except: pass
                        try: pf.unlink()
                        except: pass
                    else:
                        print(f"[ORPHAN-CHECK] Process {pid} (Run: {run_id}) is running with a VALID lock. Skipping.")
                else:
                    print(f"[ORPHAN-CHECK] PID {pid} is reused by another process. Removing stale PID file.")
                    try: pf.unlink()
                    except: pass
            else:
                print(f"[ORPHAN-CHECK] Process {pid} is not running. Removing stale PID file.")
                try: pf.unlink()
                except: pass
        except Exception as e:
            print(f"[ORPHAN-CHECK] Error processing PID file {pf}: {e}")

# Configuration
BASE_DIR = Path(__file__).parent.resolve()
SKILL_MD = Path(__file__).parent.parent / 'optimization-status' / 'SKILL.md'
RESULTS_TSV = BASE_DIR / 'results.tsv'
TARGET_BPB = 4.0

# Search Space (Expanded Hyperparameter Tuning)
SEARCH_SPACE = [
    {'DEPTH': 2, 'LR': 5e-4},
    {'DEPTH': 2, 'LR': 8e-4},
    {'DEPTH': 2, 'LR': 1e-3},
    {'DEPTH': 3, 'LR': 5e-4},
    {'DEPTH': 3, 'LR': 8e-4},
    {'DEPTH': 4, 'LR': 3e-4},
    {'DEPTH': 4, 'LR': 5e-4},
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
    env['SKIP_LOCK'] = '1'
    env['DEPTH'] = str(depth)
    env['LR'] = f"{lr:.2e}"
    
    print(f"Running: DEPTH={depth}, LR={lr}...")
    try:
        import sys
        result = subprocess.run([sys.executable, 'train_cpu.py'], env=env, cwd=BASE_DIR, capture_output=True, text=True)
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
    clean_orphans()
    
    best_bpb = get_best_bpb_from_tsv()
    print(f"Loaded current best val_bpb baseline: {best_bpb:.6f}")
    
    for i, params in enumerate(SEARCH_SPACE):
        # Check CANARY_STOP valve
        while True:
            load_env()
            if os.getenv('CANARY_STOP') == 'true':
                print(f"\n[CANARY_STOP] Canary stop valve is ACTIVE! Pausing sweep execution before step {i+1}. Checking again in 10s...")
                time.sleep(10)
            else:
                break
                
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
