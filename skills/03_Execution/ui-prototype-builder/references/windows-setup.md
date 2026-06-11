# Windows 環境設定指南

本 SKILL 的指令碼（`scripts/*.sh`）為 Unix shell script，在 Windows 需要額外設定才能執行。

---

## 方案一：Git Bash（推薦，最輕量）

1. 下載安裝 [Git for Windows](https://git-scm.com/download/win)，內建 Git Bash
2. 在 Git Bash 終端執行所有 `.sh` 指令碼：
   ```bash
   bash scripts/add-music.sh my-animation.mp4 --mood=tech
   bash scripts/convert-formats.sh my-animation.mp4
   ```
3. ffmpeg 需另行安裝並加入 PATH（見下方）

## 方案二：WSL（Windows Subsystem for Linux）

```powershell
# 以管理員身份執行 PowerShell
wsl --install
```
安裝後在 WSL 終端執行指令碼，路徑格式：`/mnt/e/你的專案路徑/`

---

## ffmpeg 安裝（Windows）

指令碼依賴 `ffmpeg` 和 `ffprobe`，需要手動安裝：

```powershell
# 方法一：winget（推薦）
winget install Gyan.FFmpeg

# 方法二：Chocolatey
choco install ffmpeg

# 安裝後確認
ffmpeg -version
```

**手動安裝：** 從 [ffmpeg.org/download.html](https://ffmpeg.org/download.html) 下載 Windows build，解壓後把 `bin/` 資料夾加入系統 PATH。

---

## Playwright（跨平臺，無需特別設定）

```bash
# Node.js 環境直接安裝
npm install -g playwright
npx playwright install chromium
```

Windows / macOS / Linux 均可直接使用。

---

## 在瀏覽器開啟 HTML 檔案

verification.md 中的 `open` 指令是 macOS 專屬。Windows 等效指令：

```bash
# Windows CMD
start chrome "C:/path/to/design.html"

# Windows PowerShell
Start-Process "chrome" "C:/path/to/design.html"

# Git Bash（Windows）
start "C:/path/to/design.html"

# 跨平臺方案（Node.js）
npx open-cli "path/to/design.html"
```

---

## Node.js 指令碼（render-video.js）

Windows 的 `npm root -g` 路徑格式不同，建議改用：

```bash
# Windows CMD / PowerShell
node "%APPDATA%\npm\node_modules\.bin\.." scripts/render-video.js my-animation.html

# 或先確認全域性 node_modules 路徑
npm root -g
# 然後用完整路徑：
NODE_PATH=<上面輸出的路徑> node scripts/render-video.js my-animation.html

# Git Bash 用法（最簡單）
NODE_PATH=$(npm root -g) node scripts/render-video.js my-animation.html
```

---

## 快速確認環境是否就緒

```bash
node --version          # ≥ 18 即可
ffmpeg -version         # 有輸出即可
npx playwright --version  # 有輸出即可
```

三個都通，所有指令碼功能均可使用。
