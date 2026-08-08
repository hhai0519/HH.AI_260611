// scripts/get_line_quotas.js
// LINE 官方帳號實時訊息額度查詢工具 (SOP14 Audited & DLP Protected)
const https = require('https');
const fs = require('fs');
const path = require('path');

const WORKSPACE_ROOT = path.resolve(__dirname, '../');
const envPath = path.join(WORKSPACE_ROOT, '.env.local');

if (!fs.existsSync(envPath)) {
  console.log(JSON.stringify({ success: false, message: 'Missing .env.local' }));
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF+/, '');
const tokens = {};
let activeAccount = (envContent.match(/^ACTIVE_LINE_ACCOUNT\s*=\s*(.*)$/m) || [])[1] || '';
activeAccount = activeAccount.trim().replace(/^['"]|['"]$/g, '');

envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^LINE_CHANNEL_ACCESS_TOKEN_(\w+)\s*=\s*(.*)$/);
  if (match) {
    let token = match[2].trim();
    if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
      token = token.slice(1, -1);
    }
    tokens[match[1]] = token;
  }
});

if (Object.keys(tokens).length === 0) {
  console.log(JSON.stringify({ success: false, message: 'No LINE accounts configured in .env.local' }));
  process.exit(0);
}

function fetchAccountQuota(suffix, token) {
  return new Promise((resolve) => {
    const createReq = (apiPath, onData) => {
      const req = https.request({
        hostname: 'api.line.me',
        path: apiPath,
        method: 'GET',
        timeout: 2000,
        headers: { 'Authorization': `Bearer ${token}` }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => onData(res.statusCode, body));
      });
      req.on('timeout', () => { req.destroy(); onData(0, ''); });
      req.on('error', () => onData(0, ''));
      req.end();
    };

    createReq('/v2/bot/message/quota', (code1, body1) => {
      let quotaInfo = {};
      try { quotaInfo = JSON.parse(body1); } catch (e) {}

      createReq('/v2/bot/message/quota/consumption', (code2, body2) => {
        let consumeInfo = {};
        try { consumeInfo = JSON.parse(body2); } catch (e) {}

        const total = quotaInfo.value || 0;
        const used = consumeInfo.totalUsage || 0;
        const remaining = Math.max(0, total - used);
        const usagePercent = total > 0 ? ((used / total) * 100).toFixed(1) : '0.0';

        resolve({
          suffix,
          total,
          used,
          remaining,
          usagePercent,
          isActive: suffix === activeAccount,
          status: (code1 === 200 && code2 === 200) ? 'OK' : 'ERROR'
        });
      });
    });
  });
}

Promise.all(Object.entries(tokens).map(([suffix, token]) => fetchAccountQuota(suffix, token)))
  .then(accounts => {
    // 依剩餘額度由高至低排序；額度相同時以目前生效帳號優先
    accounts.sort((a, b) => (b.remaining - a.remaining) || (b.isActive ? 1 : -1));
    
    const formattedOptions = accounts.map((acc, index) => {
      const activeTag = acc.isActive ? ' [目前生效中]' : '';
      let label = '';
      if (acc.status === 'OK') {
        label = `帳號 @${acc.suffix} — 剩餘 ${acc.remaining} 則 / 上限 ${acc.total} 則 (使用率 ${acc.usagePercent}%)${activeTag}`;
      } else {
        label = `帳號 @${acc.suffix} — (實時額度查詢失敗)${activeTag}`;
      }
      if (index === 0) label = `(Recommended) ` + label;
      return { suffix: acc.suffix, label };
    });

    console.log(JSON.stringify({ success: true, options: formattedOptions }, null, 2));
  });
