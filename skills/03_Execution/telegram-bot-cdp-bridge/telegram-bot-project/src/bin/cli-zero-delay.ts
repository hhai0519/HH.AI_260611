#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { startZeroDelayBridge } from '../bridge/zeroDelay';

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || (() => {
  let current = __dirname;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(current, '.env.local'))) return current;
    current = path.dirname(current);
  }
  return current;
})();

const envPath = path.join(WORKSPACE_ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  try {
    dotenv.config({ path: envPath });
  } catch (_) {
    try {
      fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
        const m = line.split('#')[0].trim().match(/^([\w.\-]+)\s*=\s*(.*)/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
      });
    } catch (_) {}
  }
}

async function run() {
  const allowedIds = (process.env.ALLOWED_USER_IDS || '')
    .split(',').map(id => id.trim()).filter(id => id.length > 0);
  if (allowedIds.length === 0) {
    console.error('[SECURITY] ALLOWED_USER_IDS 未設定，拒絕啟動');
    process.exit(1);
  }
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('[SECURITY] TELEGRAM_BOT_TOKEN 未設定，拒絕啟動');
    process.exit(1);
  }
  await startZeroDelayBridge({ botToken: token, allowedUserIds: allowedIds });
}

run().catch(err => { console.error('[FATAL]', err); process.exit(1); });
