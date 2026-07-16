/**
 * send_reply.js — 主動推播 LINE 訊息工具 (V10.0 完全解耦版)
 *
 * 修復紀錄：
 *   - V10.0 [問題1-A] 移除硬編碼絕對路徑，改用 WORKSPACE_ROOT 動態解析
 *   - V10.0 [問題1-B] 移除硬編碼 userId，改從 LINE_ALLOWED_USER_ID 環境變數讀取
 *
 * 使用方式：
 *   node send_reply.js                      ← 使用 .env.local 中的 LINE_ALLOWED_USER_ID
 *   node send_reply.js <userId>             ← 手動指定接收者（覆蓋環境變數）
 *   node send_reply.js <userId> <message>   ← 指定接收者與訊息文字
 *   REPLY_TEXT="訊息" node send_reply.js    ← 以環境變數傳入訊息
 */

const axios = require('axios');
const path  = require('path');

// ── [修復 1-A] 動態 WORKSPACE_ROOT：適用任何路徑，告別硬編碼 ──
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT
  || path.resolve(__dirname, '../../../../');
require('dotenv').config({ path: path.join(WORKSPACE_ROOT, '.env.local') });

const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// ── [修復 1-B] 動態讀取接收者 ID，優先命令列參數（保留彈性）──
const userId = process.argv[2] || process.env.LINE_ALLOWED_USER_ID;

if (!token) {
  console.error('❌ 錯誤：找不到 LINE_CHANNEL_ACCESS_TOKEN');
  console.error('   請確認 .env.local 已正確設定，或 WORKSPACE_ROOT 路徑正確。');
  process.exit(1);
}

if (!userId) {
  console.error('❌ 錯誤：找不到接收者 ID。');
  console.error('   請在 .env.local 設定 LINE_ALLOWED_USER_ID，或以命令列第一個參數傳入。');
  process.exit(1);
}

const message = process.env.REPLY_TEXT
  || process.argv[3]
  || '(此為測試訊息)';

axios.post('https://api.line.me/v2/bot/message/push', {
  to: userId,
  messages: [{ type: 'text', text: message }]
}, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}).then(() => {
  console.log(`✅ LINE 訊息已成功發送至 ${userId}`);
}).catch(e => {
  console.error('❌ 發送失敗：', e.response?.data || e.message);
});
