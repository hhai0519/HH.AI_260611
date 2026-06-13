const http = require('http');

const WEBHOOK_URL = 'http://localhost:3000/webhook';
const CONCURRENT_REQUESTS = 50;
const TOTAL_REQUESTS = 500;

console.log(`[Stress Test] 開始壓力測試...`);
console.log(`目標: ${WEBHOOK_URL}`);
console.log(`併發數: ${CONCURRENT_REQUESTS}, 總請求數: ${TOTAL_REQUESTS}`);

let completed = 0;
let success = 0;
let failed = 0;
const startTime = Date.now();

const payload = JSON.stringify({
  events: [
    {
      type: 'message',
      replyToken: 'dummy_token',
      source: { userId: 'U_stress_test', type: 'user' },
      timestamp: Date.now(),
      message: { type: 'text', id: '123', text: '壓力測試訊息' }
    }
  ],
  destination: 'U_dummy_dest'
});

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

function sendRequest() {
  return new Promise((resolve) => {
    const req = http.request(WEBHOOK_URL, options, (res) => {
      // 橋接器會驗證 LINE Signature，因為沒帶 Signature 所以會回傳 401 或是被 Express 擋下來，
      // 但只要能正常回應 (不管 200 或 401) 都算伺服器有活著且能承受壓力。
      if (res.statusCode >= 200 && res.statusCode < 500) {
        success++;
      } else {
        failed++;
      }
      res.on('data', () => {});
      res.on('end', () => resolve());
    });

    req.on('error', (e) => {
      failed++;
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

async function runTest() {
  const queue = [];
  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    queue.push(sendRequest());
    
    if (queue.length >= CONCURRENT_REQUESTS) {
      await Promise.all(queue);
      queue.length = 0; // 清空
      completed += CONCURRENT_REQUESTS;
      process.stdout.write(`\r進度: ${completed} / ${TOTAL_REQUESTS}`);
    }
  }
  
  if (queue.length > 0) {
    await Promise.all(queue);
    completed += queue.length;
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  const rps = TOTAL_REQUESTS / duration;

  console.log(`\n\n=== 📊 壓力測試報告 ===`);
  console.log(`總花費時間: ${duration.toFixed(2)} 秒`);
  console.log(`處理速度: ${rps.toFixed(2)} Req/Sec`);
  console.log(`✅ 成功回應: ${success}`);
  console.log(`❌ 失敗/超時: ${failed}`);
  console.log(`=======================\n`);
}

runTest();
