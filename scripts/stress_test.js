const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 正在啟動 PM2 進程...');
execSync('npx pm2 resurrect || npx pm2 start ecosystem.config.js', { stdio: 'inherit' });

console.log('⏳ 等待 5 秒讓伺服器完全啟動...');
setTimeout(() => {
  const DURATION_MS = 20000; 
  const BATCH_SIZE = 100; 
  const BATCH_INTERVAL_MS = 100;

  const stats = {
    line: { success: 0, error: 0, timeouts: 0 },
    tg: { success: 0, error: 0, timeouts: 0 }
  };

  const agent = new http.Agent({ keepAlive: true, maxSockets: 500 });
  const lineOptions = {
    hostname: '127.0.0.1', port: 3000, path: '/webhook', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-sop14-mock': 'true' },
    agent
  };
  const tgOptions = {
    hostname: '127.0.0.1', port: 3001, path: '/', method: 'GET',
    agent
  };

  function sendRequest(options, target) {
    return new Promise((resolve) => {
      const req = http.request(options, (res) => {
        res.on('data', () => {}); 
        res.on('end', () => {
          stats[target].success++;
          resolve();
        });
      });
      req.on('error', (err) => {
        stats[target].error++;
        resolve();
      });
      req.on('timeout', () => {
        stats[target].timeouts++;
        req.destroy();
        resolve();
      });
      req.setTimeout(5000); 
      if (options.method === 'POST') req.write(JSON.stringify({ events: [] }));
      req.end();
    });
  }

  async function fireBatch() {
    const promises = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      promises.push(sendRequest(lineOptions, 'line'));
      promises.push(sendRequest(tgOptions, 'tg'));
    }
    await Promise.all(promises);
  }

  console.log('🔥 開始轟炸 (持續 20 秒)...');
  const startTime = Date.now();
  
  const interval = setInterval(() => {
    fireBatch();
    if (Date.now() - startTime >= DURATION_MS) {
      clearInterval(interval);
      setTimeout(() => {
        console.log('✅ 壓測結束！');
        console.log('📊 統計結果:');
        console.log(`[LINE] 成功: ${stats.line.success}, 錯誤: ${stats.line.error}, 逾時: ${stats.line.timeouts}`);
        console.log(`[TG] 成功: ${stats.tg.success}, 錯誤: ${stats.tg.error}, 逾時: ${stats.tg.timeouts}`);
        
        console.log('\n🔍 PM2 最終狀態:');
        try {
          execSync('npx pm2 list', { stdio: 'inherit' });
        } catch(e) {}
        
        process.exit(0);
      }, 2000);
    }
  }, BATCH_INTERVAL_MS);
}, 5000);
