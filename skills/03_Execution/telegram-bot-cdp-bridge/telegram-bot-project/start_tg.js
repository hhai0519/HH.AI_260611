// start_tg.js
// 取得 TG 控制權。使用 TG_BRIDGE_PORT=3001，與 LINE 的 PORT=3000 絕對隔離。
// SOP14 修正：完全不使用 fetch，以 Node 原生 http 模組重構，排除 ExperimentalWarning
const http = require('http');

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
