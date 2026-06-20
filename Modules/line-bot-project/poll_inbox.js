const http = require('http');

const agentId = process.argv[2];
if (!agentId) {
  console.error("Usage: node poll_inbox.js <agentId>");
  process.exit(1);
}

const POLL_INTERVAL = 1000; // 1 秒

console.log("Antigravity API Polling 監聽器已啟動，等待事件中...");

function poll() {
  const req = http.request({
    hostname: 'localhost',
    port: process.env.PORT || 3000,
    path: `/api/inbox?token=${encodeURIComponent(agentId)}`,
    method: 'GET'
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 403) {
        console.log("\n[AGENT_TRANSFER] ⚠️ LINE 控制權已被其他 Agent 接管！此監聽器已自動停止。");
        process.exit(0);
      }
      
      if (res.statusCode === 200) {
        try {
          const json = JSON.parse(data);
          if (json.message) {
            const msg = json.message;
            // 輸出給 Agent 看
            console.log(`[LINE_REQUEST] ${msg.userId} : ${msg.text}`);
            console.log("[SYSTEM] 偵測到新訊息，即將自我結束以觸發系統喚醒...");
            process.exit(0); // 喚醒 Agent
          }
        } catch (e) {
          // JSON 解析錯誤，忽略
        }
      }
      
      // 繼續 poll
      setTimeout(poll, POLL_INTERVAL);
    });
  });

  req.on('error', (e) => {
    // 若 bridge 沒啟動，等待後重試
    setTimeout(poll, 3000);
  });

  req.end();
}

poll();
