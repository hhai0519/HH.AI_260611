const http = require('http');
const fs = require('fs');
const crypto = require('crypto');

const agentId = 'universal_manager';
const agentLabel = '萬能總管模式';
const userId = 'U37e3e917b8b20188a60ba64e47acea95';
const textPath = 'report.txt';
const secret = process.env.CURRENT_AGENT_SECRET || 'default_agent_secret';

const req = http.request({
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/api/lock/acquire',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const result = JSON.parse(data);
    if (!result.success) {
      console.error('Failed to acquire lock:', result);
      return;
    }
    
    const fencingToken = result.fencingToken;
    const [epoch, tokenVal] = fencingToken.split(':');
    const timestamp = Date.now().toString();
    const messageId = '';
    const ticketId = '';
    const outboxSecret = process.env.CURRENT_OUTBOX_SECRET || 'default_outbox_secret';
    
    const signature = crypto
      .createHmac("sha256", outboxSecret)
      .update(`${messageId}:${epoch}:${tokenVal}:${timestamp}`)
      .digest("hex");
      
    let text = fs.readFileSync(textPath, 'utf8');
    text = `【由 ${agentLabel} 提供回覆】\n\n` + text;

    const outReq = http.request({
      hostname: 'localhost',
      port: process.env.PORT || 3000,
      path: '/api/outbox',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (outRes) => {
      let outData = '';
      outRes.on('data', chunk => outData += chunk);
      outRes.on('end', () => {
        console.log('Outbox status:', outRes.statusCode, outData);
      });
    });
    
    outReq.write(JSON.stringify({ 
      userId, text, agentId, fencingToken, signature, timestamp, epoch, token: tokenVal, messageId, ticketId 
    }));
    outReq.end();
  });
});

req.write(JSON.stringify({ agentId, agentLabel, force: true, secret }));
req.end();
