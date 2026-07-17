// start_tg.js
// 取得 TG 控制權。使用 TG_BRIDGE_PORT=3001，與 LINE 的 PORT=3000 絕對隔離。
// SOP14 修正：完全不使用 fetch，以 Node 原生 http 模組重構，排除 ExperimentalWarning
// V1.1：新增 .env.local 尋根載入 + JSON 解析保護
const http = require('http');
const fs = require('fs');
const path = require('path');

// [AUDIT-01] 自動尋根載入 .env.local 確保埠口一致性
const WORKSPACE_ROOT = (() => {
  let current = __dirname;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(current, '.env.local'))) return current;
    current = path.dirname(current);
  }
  return current;
})();
const envPath = path.join(WORKSPACE_ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  try {
    require('dotenv').config({ path: envPath });
  } catch (_) {
    try {
      fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
        const m = line.split('#')[0].trim().match(/^([\w.\-]+)\s*=\s*(.*)/);
        if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
      });
    } catch (_) {}
  }
}

const agentId = process.argv[2];
const port = parseInt(process.env.TG_BRIDGE_PORT || '3001', 10);
if (!agentId) { console.error('Usage: node start_tg.js <agentId>'); process.exit(1); }

const postData = JSON.stringify({ token: agentId, force: true });

const req = http.request({
  hostname: '127.0.0.1',
  port: port,
  path: '/api/lock/acquire',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      // [AUDIT-02] 加入 JSON 解析保護，防止橋接器返回非 JSON 響應時 Unhandled Exception
      try {
        JSON.parse(data);
      } catch (_) {}
      console.log('✅ 已成功強制接管 Telegram 控制權！');
      process.exit(0);
    } else {
      console.error(`TG 鎖定失敗: HTTP ${res.statusCode} - ${data}`);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error('TG 鎖定失敗:', e.message);
  process.exit(1);
});

req.write(postData);
req.end();
