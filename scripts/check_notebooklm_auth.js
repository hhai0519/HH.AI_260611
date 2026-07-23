const fs = require('fs');
const path = require('path');

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || path.resolve(__dirname, '../');
const cookiePath = path.join(
  WORKSPACE_ROOT,
  'knowledge/notebooklm-auth-sop/artifacts/mock_cookies.json'
);

console.log(`🔍 檢查 NotebookLM 快取時效: ${cookiePath}`);

if (!fs.existsSync(cookiePath)) {
  console.log('⚠️ 警告：未發現 mock_cookies.json 憑證快取，NotebookLM 需重新認證！');
  process.exit(1);
}

const stats = fs.statSync(cookiePath);
const hoursDiff = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);

if (hoursDiff > 18) {
  console.log(`🟡 [PRE-WARNING] NotebookLM 憑證快取更新於 ${stats.mtime.toLocaleString()}，已過期 ${hoursDiff.toFixed(1)} 小時（門檻: 18h）。建議執行 nlm login 刷回！`);
  process.exit(2);
} else {
  console.log(`🟢 憑證快取健康（距上次更新 ${hoursDiff.toFixed(1)} 小時，位在 18h 安全窗口內）。`);
  process.exit(0);
}
