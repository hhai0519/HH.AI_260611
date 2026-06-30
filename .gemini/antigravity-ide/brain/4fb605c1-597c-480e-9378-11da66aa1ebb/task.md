# 🛠️ V17 架構升級追蹤清單

- `[x]` **階段一：`poll_inbox.js` 網路優化**
  - `[x]` 實例化全域 `http.Agent({ keepAlive: true })`
  - `[x]` 應用至 `http.request` 選項中
- `[x]` **階段二：`bridge.js` 解除阻塞**
  - `[x]` 替換 `saveState()` 中的 `fs.writeFileSync` 為 `fs.writeFile`
  - `[x]` 替換 GitHub Audit 降級模式的 `fs.writeFileSync` 為 `fs.writeFile`
- `[x]` **階段三：`bridge.js` 記憶體防護**
  - `[x]` 在所有的 `redis.xadd` 指令中插入 `MAXLEN ~ 10000`
- `[x]` **階段四：驗證與結案**
  - `[x]` 啟動並驗證 `poll_inbox.js` 與 `bridge.js` 正常無報錯
  - `[x]` 撰寫 V17 `walkthrough.md` 報告
