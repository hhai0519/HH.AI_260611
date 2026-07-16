// poll_tg.js
// 長輪詢任務取得，含 5 秒網路抖動指數退避
// SOP14 修正：完全不使用 fetch，以 Node 原生 http 模組重構，排除 ExperimentalWarning
const http = require('http');

const agentId = process.argv[2];
const port = parseInt(process.env.TG_BRIDGE_PORT || '3001', 10);
if (!agentId) { console.error('Usage: node poll_tg.js <agentId>'); process.exit(1); }

const req = http.request({
  hostname: '127.0.0.1',
  port: port,
  path: `/api/inbox?token=${encodeURIComponent(agentId)}`,
  method: 'GET'
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 204) { process.exit(0); } 
    if (res.statusCode === 403) { console.log('[AGENT_TRANSFER]'); process.exit(0); }
    if (res.statusCode === 503) { 
      console.error('Bridge 正在重啟/優雅關機，退避中...');
      setTimeout(() => process.exit(0), 5000);
      return;
    }
    if (res.statusCode !== 200) {
      console.error(`HTTP Error ${res.statusCode}`);
      process.exit(1);
    }

    try {
      const msg = JSON.parse(data);
      if (msg && msg.chatId) {
        const safeText = (msg.text || '').replace(/\n/g, '\\n');
        console.log(`[TG_REQUEST] ${msg.chatId} : ${safeText}`);
      }
      process.exit(0);
    } catch (e) {
      console.error('JSON 解析失敗:', e.message);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('連線異常，退避 5 秒:', err.message);
  setTimeout(() => process.exit(1), 5000);
});

req.end();
