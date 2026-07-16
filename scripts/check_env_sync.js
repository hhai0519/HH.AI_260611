#!/usr/bin/env node
/**
 * check_env_sync.js — .env.example 與 .env.local 同步驗證工具
 * 用途：自動偵測 .env.local 中有哪些金鑰未在 .env.example 中聲明
 * 執行：node scripts/check_env_sync.js
 */
const fs   = require('fs');
const path = require('path');

const rootDir     = path.resolve(__dirname, '..');
const examplePath = path.join(rootDir, '.env.example');
const localPath   = path.join(rootDir, '.env.local');

console.log('🔍 .env.example 同步檢查工具');
console.log('============================');

if (!fs.existsSync(localPath)) {
  console.warn('⚠️  .env.local 不存在，請先執行 node scripts/setup_env.js');
  process.exit(0);
}
if (!fs.existsSync(examplePath)) {
  console.error('❌ .env.example 不存在！');
  process.exit(1);
}

function parseKeys(filePath) {
  return fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && line.includes('='))
    .map(line => line.split('=')[0].trim());
}

const localKeys   = parseKeys(localPath);
const exampleKeys = parseKeys(examplePath);

const missingInExample = localKeys.filter(k => !exampleKeys.includes(k));
const missingInLocal   = exampleKeys.filter(k => !localKeys.includes(k));

if (missingInExample.length > 0) {
  console.warn('⚠️  以下金鑰在 .env.local 存在，但 .env.example 缺少聲明：');
  missingInExample.forEach(k => console.warn(`   - ${k}`));
  console.warn('   請立即補全 .env.example 並 git commit！');
  process.exitCode = 1;
} else {
  console.log('✅ .env.example 完整同步，換電腦時不會遺漏任何金鑰。');
}

if (missingInLocal.length > 0) {
  console.info('ℹ️  以下欄位在 .env.example 已宣告，但 .env.local 尚未填入：');
  missingInLocal.forEach(k => console.info(`   - ${k}`));
}
