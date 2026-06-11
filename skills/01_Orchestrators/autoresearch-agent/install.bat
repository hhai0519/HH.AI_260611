@echo off
echo ============================================================
echo  autoresearch-cpu Installation Script
echo  Windows CPU version (no GPU required)
echo ============================================================
echo.

echo [1/3] Checking Python...
py --version
if %errorlevel% neq 0 (
    echo ERROR: Python not found. Download from https://python.org
    pause & exit /b 1
)

echo.
echo [2/3] Installing PyTorch (CPU-only)...
py -m pip install torch --index-url https://download.pytorch.org/whl/cpu

echo.
echo [3/3] Installing other dependencies...
py -m pip install datasets tokenizers numpy

echo.
echo ============================================================
echo  Installation complete!
echo  Next steps:
echo    python prepare_cpu.py    (download TinyStories data)
echo    python train_cpu.py      (start training / dry-run)
echo ============================================================
pause
