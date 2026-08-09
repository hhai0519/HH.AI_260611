/**
 * 🛡️ FR-01 BOM 修正版 (generate_keys.js)
 * 自動生成 3 大強隨機金鑰。若 .env.local 不存在則自動建立。自動去除 BOM。
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ENV_PATH = path.join(__dirname, '..', '.env.local');

console.log('🔑 正在生成高強度 256-bit 密碼學金鑰...\n');

const keys = {
  CURRENT_AGENT_SECRET: crypto.randomBytes(32).toString('hex'),
  OUTBOX_SECRET: crypto.randomBytes(32).toString('hex'),
  INTERNAL_GATEWAY_TOKEN: crypto.randomBytes(32).toString('hex'),
};

let content = '';
if (fs.existsSync(ENV_PATH)) {
  content = fs.readFileSync(ENV_PATH, 'utf8');
  // 去除可能存在的 UTF-8 BOM
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
} else {
  console.log('ℹ️ .env.local 不存在，將自動建立全新檔案。');
}

if (content.includes('CURRENT_AGENT_SECRET=')) {
  content = content.replace(/CURRENT_AGENT_SECRET=.*/g, `CURRENT_AGENT_SECRET=${keys.CURRENT_AGENT_SECRET}`);
} else {
  content += `\nCURRENT_AGENT_SECRET=${keys.CURRENT_AGENT_SECRET}\n`;
}

if (content.includes('CURRENT_OUTBOX_SECRET=')) {
  content = content.replace(/CURRENT_OUTBOX_SECRET=.*/g, `CURRENT_OUTBOX_SECRET=${keys.OUTBOX_SECRET}`);
} else {
  content += `CURRENT_OUTBOX_SECRET=${keys.OUTBOX_SECRET}\n`;
}

if (content.includes('INTERNAL_GATEWAY_TOKEN=')) {
  content = content.replace(/INTERNAL_GATEWAY_TOKEN=.*/g, `INTERNAL_GATEWAY_TOKEN=${keys.INTERNAL_GATEWAY_TOKEN}`);
} else {
  content += `INTERNAL_GATEWAY_TOKEN=${keys.INTERNAL_GATEWAY_TOKEN}\n`;
}

if (!content.includes('WORKER_URL=')) {
  content += `WORKER_URL="https://line-proxy.hh-ai-19850519.workers.dev"\n`;
}

fs.writeFileSync(ENV_PATH, content, 'utf8');
console.log('✅ 已成功生成金鑰並寫入 .env.local！');
