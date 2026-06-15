"""
prepare_cpu.py - TinyStories data prep for CPU autoresearch
Usage: python prepare_cpu.py
Requires: pip install datasets tokenizers
"""
import os
from pathlib import Path

CACHE_DIR = Path.home() / '.cache' / 'autoresearch-cpu'
CACHE_DIR.mkdir(parents=True, exist_ok=True)

VOCAB_SIZE = 32768

def prepare():
    print(f"Cache dir: {CACHE_DIR}")

    try:
        from tokenizers import Tokenizer
        from tokenizers.models import BPE
        from tokenizers.trainers import BpeTrainer
        from tokenizers.pre_tokenizers import ByteLevel
        from datasets import load_dataset
        import numpy as np
    except ImportError as e:
        print(f"\nERROR: Missing dependency: {e}")
        print("Install with:")
        print("  py -m pip install datasets tokenizers numpy")
        return

    tok_path = CACHE_DIR / 'tokenizer.json'
    if not tok_path.exists():
        print("Downloading TinyStories (may take a few minutes)...")
        ds = load_dataset('roneneldan/TinyStories', split='train', streaming=True)

        def text_gen():
            for i, ex in enumerate(ds):
                if i >= 50000:
                    break
                yield ex['text']

        tokenizer = Tokenizer(BPE(unk_token="<SECRET_TOKEN>"))
        tokenizer.pre_tokenizer = ByteLevel()
        trainer = BpeTrainer(vocab_size=VOCAB_SIZE, special_tokens=["<unk>"])
        tokenizer.train_from_iterator(text_gen(), trainer=trainer)
        tokenizer.save(str(tok_path))
        print(f"Tokenizer saved: {tok_path}")
    else:
        from tokenizers import Tokenizer
        tokenizer = Tokenizer.from_file(str(tok_path))
        print(f"Loaded tokenizer: {tok_path}")

    for split_name, n_examples in [('train', 80000), ('val', 5000)]:
        out_path = CACHE_DIR / f'{split_name}.bin'
        if out_path.exists():
            print(f"Skip {split_name} (already exists)")
            continue

        print(f"Tokenizing {split_name} ({n_examples} examples)...")
        try:
            import numpy as np
            from datasets import load_dataset
            ds = load_dataset('roneneldan/TinyStories', split=split_name, streaming=True)
        except Exception:
            ds = load_dataset('roneneldan/TinyStories', split='train', streaming=True)

        all_ids = []
        for i, ex in enumerate(ds):
            if i >= n_examples:
                break
            enc = tokenizer.encode(ex['text'])
            all_ids.extend(enc.ids)
            if (i + 1) % 10000 == 0:
                print(f"  {i+1}/{n_examples} examples, {len(all_ids):,} tokens")

        arr = np.array(all_ids, dtype=np.uint16)
        arr.tofile(str(out_path))
        print(f"Saved {split_name}: {len(arr):,} tokens -> {out_path}")

    print("\nDone! Run: python train_cpu.py")

if __name__ == '__main__':
    prepare()
