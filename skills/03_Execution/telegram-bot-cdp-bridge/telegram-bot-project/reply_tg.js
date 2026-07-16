// reply_tg.js
// 發送回覆 (REPLY_TEXT)
// SOP14 修正：完全不使用 fetch，以 Node 原生 http 模組重構，排除 ExperimentalWarning
const http = require('http');

const chatId = process.argv[2];
const text = process.env.REPLY_TEXT;
const port = parseInt(process.env.TG_BRIDGE_PORT || '3001', 10);

if (!chatId) { console.error('Usage: REPLY_TEXT="..." node reply_tg.js <chatId>'); process.exit(1); }
if (!text)   { console.error('[ERROR] REPLY_TEXT 環境變數未設定！'); process.exit(1); }

const postData = JSON.stringify({ chatId, text });

const req = http.request({
  hostname: '127.0.0.1',
  port: port,
  path: '/api/send',
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
      console.log('✅ TG 回覆發送成功');
      process.exit(0);
    } else {
      console.error(`TG 回覆發送失敗: HTTP ${res.statusCode} - ${data}`);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error('TG 回覆發送失敗:', e.message);
  process.exit(1);
});

req.write(postData);
req.end();
