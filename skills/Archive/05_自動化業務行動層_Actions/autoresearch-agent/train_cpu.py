"""
train_cpu.py — autoresearch CPU 移植版
Windows + 無 NVIDIA GPU 環境可用

主要修改：
1. 移除 Flash Attention 3（kernels 套件），改用 PyTorch 原生 SDPA
2. 大幅縮減模型：DEPTH=2, SEQ_LEN=256
3. TOTAL_BATCH_SIZE 縮減至 2^12
4. 移除 CUDA 特定代碼，改用 CPU/MPS/CUDA 自動偵測
5. 時間預算從 300s → 60s（CPU 友善）

使用方式：
  pip install torch datasets tokenizers
  python prepare_cpu.py          # 準備 TinyStories 資料
  python train_cpu.py            # 開始訓練

注意：CPU 訓練速度極慢。
每次實驗從 5 分鐘延長至 10-30 分鐘。建議僅學習用。
"""

import os
import gc
import math
import time
import sys
from dataclasses import dataclass, asdict

# Fix Windows CP950 UnicodeEncodeError — force UTF-8 output
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ('utf-8', 'utf8'):
    sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)
if sys.stderr.encoding and sys.stderr.encoding.lower() not in ('utf-8', 'utf8'):
    sys.stderr = open(sys.stderr.fileno(), mode='w', encoding='utf-8', buffering=1)

import torch
import torch.nn as nn
import torch.nn.functional as F

# --- Device Detection ---
if torch.cuda.is_available():
    device = torch.device('cuda')
    print(f"Using CUDA: {torch.cuda.get_device_name(0)}")
elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
    device = torch.device('mps')
    print("Using Apple MPS")
else:
    device = torch.device('cpu')
    print("Using CPU (slow but works!)")

USE_GPU = device.type in ('cuda', 'mps')

# ============================================================
# Model Architecture (Simplified for CPU)
# ============================================================

@dataclass
class GPTConfig:
    sequence_len: int = 256     # 原版 2048，縮短加速
    vocab_size:   int = 32768
    n_layer:      int = 2       # 原版 12
    n_head:       int = 4       # 原版 6+
    n_kv_head:    int = 4
    n_embd:       int = 128     # 原版 768
    drop:         float = 0.0


class RMSNorm(nn.Module):
    def __init__(self, dim: int):
        super().__init__()
        self.scale = nn.Parameter(torch.ones(dim))

    def forward(self, x):
        return F.rms_norm(x, (x.size(-1),)) * self.scale


def apply_rotary_emb(x, cos, sin):
    d = x.shape[-1] // 2
    x1, x2 = x[..., :d], x[..., d:]
    return torch.cat([x1 * cos + x2 * sin, x1 * (-sin) + x2 * cos], dim=-1)


class CausalSelfAttention(nn.Module):
    def __init__(self, config):
        super().__init__()
        self.n_head    = config.n_head
        self.n_kv_head = config.n_kv_head
        self.head_dim  = config.n_embd // config.n_head
        assert config.n_embd % config.n_head == 0

        self.c_q    = nn.Linear(config.n_embd, config.n_head    * self.head_dim, bias=False)
        self.c_k    = nn.Linear(config.n_embd, config.n_kv_head * self.head_dim, bias=False)
        self.c_v    = nn.Linear(config.n_embd, config.n_kv_head * self.head_dim, bias=False)
        self.c_proj = nn.Linear(config.n_embd, config.n_embd, bias=False)
        self.drop   = nn.Dropout(config.drop)

    def forward(self, x, cos, sin):
        B, T, C = x.size()
        q = self.c_q(x).view(B, T, self.n_head,    self.head_dim)
        k = self.c_k(x).view(B, T, self.n_kv_head, self.head_dim)
        v = self.c_v(x).view(B, T, self.n_kv_head, self.head_dim)

        # RoPE
        q = apply_rotary_emb(q, cos, sin)
        k = apply_rotary_emb(k, cos, sin)

        # Repeat KV heads if GQA
        if self.n_kv_head < self.n_head:
            reps = self.n_head // self.n_kv_head
            k = k.repeat_interleave(reps, dim=2)
            v = v.repeat_interleave(reps, dim=2)

        q = q.transpose(1, 2)  # (B, n_head, T, head_dim)
        k = k.transpose(1, 2)
        v = v.transpose(1, 2)

        # Use PyTorch SDPA (Flash Attention 2 on CUDA, standard on CPU)
        y = F.scaled_dot_product_attention(q, k, v, is_causal=True,
                                           dropout_p=self.drop.p if self.training else 0.0)

        y = y.transpose(1, 2).contiguous().view(B, T, C)
        y = self.c_proj(y)
        return y


class MLP(nn.Module):
    def __init__(self, config):
        super().__init__()
        self.c_fc   = nn.Linear(config.n_embd, 4 * config.n_embd, bias=False)
        self.c_proj = nn.Linear(4 * config.n_embd, config.n_embd, bias=False)

    def forward(self, x):
        return self.c_proj(F.relu(self.c_fc(x)).square())


class Block(nn.Module):
    def __init__(self, config):
        super().__init__()
        self.ln1  = RMSNorm(config.n_embd)
        self.attn = CausalSelfAttention(config)
        self.ln2  = RMSNorm(config.n_embd)
        self.mlp  = MLP(config)

    def forward(self, x, cos, sin):
        x = x + self.attn(self.ln1(x), cos, sin)
        x = x + self.mlp(self.ln2(x))
        return x


class GPT(nn.Module):
    def __init__(self, config):
        super().__init__()
        self.config = config
        head_dim = config.n_embd // config.n_head
        seq_len  = config.sequence_len

        # RoPE buffers
        inv_freq = 1.0 / (10000 ** (torch.arange(0, head_dim, 2).float() / head_dim))
        t = torch.arange(seq_len).float()
        freqs = torch.outer(t, inv_freq)
        cos_buf = freqs.cos()[None, :, None, :]
        sin_buf = freqs.sin()[None, :, None, :]
        self.register_buffer('cos', cos_buf)
        self.register_buffer('sin', sin_buf)

        self.transformer = nn.ModuleDict({
            'wte': nn.Embedding(config.vocab_size, config.n_embd),
            'h':   nn.ModuleList([Block(config) for _ in range(config.n_layer)]),
            'ln_f': RMSNorm(config.n_embd),
        })
        self.lm_head = nn.Linear(config.n_embd, config.vocab_size, bias=False)

    def forward(self, idx, targets=None):
        B, T = idx.size()
        assert T <= self.config.sequence_len
        cos = self.cos[:, :T]
        sin = self.sin[:, :T]

        x = self.transformer.wte(idx)
        for block in self.transformer.h:
            x = block(x, cos, sin)
        x = self.transformer.ln_f(x)

        if targets is not None:
            logits = self.lm_head(x)
            loss = F.cross_entropy(logits.view(-1, logits.size(-1)), targets.view(-1), ignore_index=-1)
            return loss
        return self.lm_head(x)


# ============================================================
# Training Config
# ============================================================

# Model
DEPTH          = int(os.getenv('DEPTH', '2'))      # 原版 8 — CPU 用 2 層
ASPECT_RATIO   = 64     # model_dim = depth * ASPECT_RATIO

# Training
TIME_BUDGET        = 60           # 秒 (原版 300 — CPU 用 60s)
TOTAL_BATCH_SIZE   = 2 ** 12      # ~4K tokens (原版 2^19)
DEVICE_BATCH_SIZE  = 4            # per-device (原版 128)
MAX_SEQ_LEN        = 256          # (原版 2048)

# Optimizer (AdamW, simpler than Muon for CPU)
LR           = float(os.getenv('LR', '3e-4'))
WEIGHT_DECAY = 0.1
BETAS        = (0.9, 0.95)
WARMUP_RATIO    = 0.1
WARMDOWN_RATIO  = 0.5
FINAL_LR_FRAC   = 0.1


# ============================================================
# Data Loading (requires prepare_cpu.py first)
# ============================================================

def load_data(split='train'):
    """Load tokenized data from cache."""
    cache_dir = Path.home() / '.cache' / 'autoresearch-cpu'
    shard_file = cache_dir / f'{split}.bin'
    if not shard_file.exists():
        raise FileNotFoundError(
            f"Data not found: {shard_file}\n"
            f"Run: python prepare_cpu.py"
        )
    import numpy as np
    data = np.memmap(str(shard_file), dtype=np.uint16, mode='r')
    return torch.tensor(data, dtype=torch.long)

def get_batch(data, batch_size, seq_len):
    ix = torch.randint(len(data) - seq_len, (batch_size,))
    x = torch.stack([data[i:i+seq_len] for i in ix])
    y = torch.stack([data[i+1:i+seq_len+1] for i in ix])
    return x.to(device), y.to(device)

def evaluate(model, data_val, seq_len, n_batches=20):
    model.eval()
    losses = []
    with torch.no_grad():
        for _ in range(n_batches):
            x, y = get_batch(data_val, 4, seq_len)
            loss = model(x, y)
            losses.append(loss.item())
    model.train()
    return sum(losses) / len(losses)


# ============================================================
# Main Training Loop
# ============================================================

from pathlib import Path

t_start = time.time()
torch.manual_seed(42)

# Model
model_dim = DEPTH * ASPECT_RATIO
config = GPTConfig(
    sequence_len=MAX_SEQ_LEN, vocab_size=32768,
    n_layer=DEPTH, n_head=max(1, model_dim // 64),
    n_kv_head=max(1, model_dim // 64), n_embd=model_dim,
)
print(f"Config: {asdict(config)}")

model = GPT(config).to(device)
num_params = sum(p.numel() for p in model.parameters())
print(f"Parameters: {num_params:,}")

# Optimizer
optimizer = torch.optim.AdamW(model.parameters(), lr=LR,
                               weight_decay=WEIGHT_DECAY, betas=BETAS)

# Try loading data
try:
    train_data = load_data('train')
    val_data   = load_data('val')
    print(f"Train tokens: {len(train_data):,}")
    print(f"Val   tokens: {len(val_data):,}")
    HAS_DATA = True
except FileNotFoundError as e:
    print(f"\n⚠️  {e}")
    print("使用隨機假資料進行 dry-run 測試...\n")
    train_data = torch.randint(0, 32768, (TOTAL_BATCH_SIZE * 10,))
    val_data   = torch.randint(0, 32768, (TOTAL_BATCH_SIZE * 2,))
    HAS_DATA = False

grad_accum_steps = max(1, TOTAL_BATCH_SIZE // (DEVICE_BATCH_SIZE * MAX_SEQ_LEN))
print(f"Gradient accumulation steps: {grad_accum_steps}")
print(f"Time budget: {TIME_BUDGET}s\n")

# LR schedule
def get_lr(progress):
    if progress < WARMUP_RATIO:
        return progress / WARMUP_RATIO if WARMUP_RATIO > 0 else 1.0
    elif progress < 1.0 - WARMDOWN_RATIO:
        return 1.0
    else:
        cooldown = (1.0 - progress) / WARMDOWN_RATIO
        return cooldown + (1 - cooldown) * FINAL_LR_FRAC

# Training loop
t_start_training = time.time()
total_training_time = 0
step = 0
smooth_loss = 0.0

print("=" * 50)
while True:
    t0 = time.time()

    optimizer.zero_grad()
    for micro_step in range(grad_accum_steps):
        x, y = get_batch(train_data, DEVICE_BATCH_SIZE, MAX_SEQ_LEN)
        loss = model(x, y)
        (loss / grad_accum_steps).backward()

    # LR schedule
    progress = min(total_training_time / TIME_BUDGET, 1.0)
    lrm = get_lr(progress)
    for group in optimizer.param_groups:
        group['lr'] = LR * lrm

    optimizer.step()

    t1 = time.time()
    dt = t1 - t0
    if step > 2:
        total_training_time += dt

    ema = 0.9
    smooth_loss = ema * smooth_loss + (1 - ema) * loss.item()
    debiased = smooth_loss / (1 - ema ** (step + 1))

    print(f"\rstep {step:04d} ({100*progress:.0f}%) | loss {debiased:.4f} | lr {LR*lrm:.5f} | {dt*1000:.0f}ms/step | remaining {max(0,TIME_BUDGET-total_training_time):.0f}s   ",
          end='', flush=True)

    step += 1
    if step > 2 and total_training_time >= TIME_BUDGET:
        break

print("\n" + "=" * 50)

# --- Final eval ---
val_loss = evaluate(model, val_data, MAX_SEQ_LEN)
# Convert cross-entropy loss to bits per byte approximation
# bpb ≈ loss / ln(2) / log2(vocab_size) * 8
# Simplified: just report loss for CPU version
val_bpb_approx = val_loss / math.log(2)

t_end = time.time()
peak_mb = torch.cuda.max_memory_allocated() / 1024 / 1024 if USE_GPU else 0

print("---", flush=True)
print(f"val_bpb:          {val_bpb_approx:.6f}  (~approx cross-entropy/ln2, CPU proxy)", flush=True)
print(f"val_loss:         {val_loss:.6f}", flush=True)
print(f"training_seconds: {total_training_time:.1f}", flush=True)
print(f"total_seconds:    {t_end - t_start:.1f}", flush=True)
print(f"peak_vram_mb:     {peak_mb:.1f}", flush=True)
print(f"num_steps:        {step}", flush=True)
print(f"num_params_M:     {num_params / 1e6:.2f}", flush=True)
print(f"depth:            {DEPTH}", flush=True)
print(f"has_real_data:    {HAS_DATA}", flush=True)
print("---", flush=True)
