#!/usr/bin/env node
import { startZeroDelayBridge } from '../bridge/zeroDelay';

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
