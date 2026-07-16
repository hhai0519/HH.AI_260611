#!/usr/bin/env node
import * as net from 'net';
import * as path from 'path';
import { startBot } from '../bot';

const { resolveWorkspaceRoot } = require('../../../../../../Modules/shared/workspaceLoader.js');
const WORKSPACE_ROOT = resolveWorkspaceRoot(__dirname);
const dbStatePath = path.join(WORKSPACE_ROOT, 'Modules', 'db_state_manager.js');

async function checkCdpPort(port = 9229): Promise<boolean> {
  return new Promise(resolve => {
    const socket = new net.Socket();
    const timeout = setTimeout(() => { socket.destroy(); resolve(false); }, 1500);
    socket.on('connect', () => { clearTimeout(timeout); socket.destroy(); resolve(true); });
    socket.on('error', () => { clearTimeout(timeout); resolve(false); });
    socket.connect(port, '127.0.0.1');
  });
}

async function reportToWatchdog(priority: 'LOW' | 'MEDIUM' | 'HIGH', taskData: string) {
  try {
    const dbState = require(dbStatePath);
    if (!dbState.isPlaceholderDb() && dbState.pool) {
      await dbState.writePendingOptimization(priority, `[TG Bot] ${taskData}`);
    }
  } catch (e) {
    console.error('[Watchdog] 無法寫入 Watchdog 佇列:', e);
  }
}

async function run() {
  const allowedIds = (process.env.ALLOWED_USER_IDS || '').split(',').map(id => id.trim()).filter(id => id.length > 0).map(Number);
  if (allowedIds.length === 0) {
    console.error('[SECURITY] ALLOWED_USER_IDS 未設定');
    process.exit(1);
  }

  const cdpReady = await checkCdpPort();
  if (!cdpReady) {
    console.warn('⚠️ 偵測到 IDE CDP 尚未開啟。請確認 CDP 模式已啟用。Bot 將繼續啟動，等待 CDP 後續連線。');
    await reportToWatchdog('LOW', 'Bot 啟動警告: 偵測到 IDE CDP 尚未開啟');
    // 移除 process.exit(1) 讓 Bot 保持存活，依賴 bot/index.ts 的優雅處理
  }

  await startBot().catch(async (err) => {
    console.error('[BOT FATAL]', err);
    await reportToWatchdog('HIGH', `Bot 啟動失敗: ${err.message}`);
    process.exit(1);
  });
}

run();
