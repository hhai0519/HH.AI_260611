const crypto = require('crypto');

console.log('🔑 正在生成高強度 256-bit 密碼學金鑰...\n');

const keys = {
  AGENT_SECRET: crypto.randomBytes(32).toString('hex'),
  OUTBOX_SECRET: crypto.randomBytes(32).toString('hex'),
  GATEWAY_TOKEN: crypto.randomBytes(32).toString('hex'),
};

console.log('請手動更新 .env.local 中的以下預設弱金鑰：');
console.log('--------------------------------------------------');
console.log(`CURRENT_AGENT_SECRET=${keys.AGENT_SECRET}`);
console.log(`OUTBOX_SECRET=${keys.OUTBOX_SECRET}`);
console.log(`INTERNAL_GATEWAY_TOKEN=${keys.GATEWAY_TOKEN}`);
console.log('--------------------------------------------------');
console.log('💡 更新完成後，請重啟相關監聽器與 Bridge 服務以套用新金鑰。');
