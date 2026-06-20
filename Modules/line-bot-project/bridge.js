/**
 * Antigravity LINE Bridge v3.0 (Zero-Delay File Event Pipeline)
 * 架構：檔案事件驅動 (fs.watch) + LINE Webhook
 * 特色：0輪詢、光速傳遞、不受限於 CDP 防火牆
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const dbState = require('../db_state_manager');
const useDb = !dbState.isPlaceholderDb() && dbState.pool !== null;

if (useDb) {
  dbState.initDB().then(async () => {
    try {
      await dbState.pool.query(`ALTER TABLE agent_distributed_locks ADD COLUMN IF NOT EXISTS agent_label VARCHAR(255);`);
      console.log('[DB] 確保 agent_distributed_locks 表有 agent_label 欄位成功。');
    } catch (e) {
      console.error('[DB] 欄位擴充失敗：', e.message);
    }
  }).catch(err => {
    console.error('[DB] 初始化失敗：', err.message);
  });
}
require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const { parseMarkdownToFlex } = require('./markdown_to_flex');
const OpenCC = require('opencc-js');
const twConverter = OpenCC.Converter({ from: 'cn', to: 'twp' });

// ─── 設定 ───────────────────────────────────────────────────────────────────
const lineConfig = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
};

const ALLOWED_USER_ID = process.env.LINE_ALLOWED_USER_ID || '';
const PORT = parseInt(process.env.PORT || '3000');

const app = express();

// ─── 靜態檔案伺服器與下載端點 ──────────────────────────────────────────────
app.use('/public', express.static(path.join(__dirname, 'public')));
app.get('/download/excel', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'Skills_Inventory.xlsx');
  res.download(filePath, 'Skills_Inventory.xlsx', (err) => {
    if (err) console.error('[DOWNLOAD ERROR]', err);
  });
});
const lineClient = new line.messagingApi.MessagingApiClient({
  channelAccessToken: lineConfig.channelAccessToken,
});

let BOT_USER_ID = null;
async function fetchBotInfo() {
  try {
    const res = await axios.get('https://api.line.me/v2/bot/info', {
      headers: { 'Authorization': `Bearer ${lineConfig.channelAccessToken}` }
    });
    BOT_USER_ID = res.data.userId;
    console.log(`[系統] 已成功取得機器人自身 ID: ${BOT_USER_ID}`);
  } catch (e) {
    console.error(`[系統] 無法取得機器人自身 ID:`, e.response ? e.response.data : e.message);
  }
}
fetchBotInfo();

// ─── 記憶體狀態與持久化 ────────────────────────────────────────────────────────
const STATE_FILE = path.join(__dirname, 'bridge_state.json');
let messageQueue = []; // { userId, sourceId, text, timestamp, processing, processingStartTime }
const MAX_QUEUE_SIZE = parseInt(process.env.MAX_QUEUE_SIZE || '10');

let activeAgentToken = null;
let activeAgentLabel = null;

if (fs.existsSync(STATE_FILE)) {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    activeAgentToken = state.activeAgentToken || null;
    activeAgentLabel = state.activeAgentLabel || null;
    messageQueue = state.messageQueue || [];
  } catch (e) {}
}

let saveTimer = null;
function saveState() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify({ activeAgentToken, activeAgentLabel, messageQueue }, null, 2));
    } catch (e) {}
    saveTimer = null;
  }, 1000);
}

async function getActiveLock() {
  if (!useDb) {
    return { token: activeAgentToken, label: activeAgentLabel };
  }
  try {
    const res = await dbState.pool.query(
      `SELECT locked_by, agent_label FROM agent_distributed_locks WHERE resource_id = 'line_bridge_lock' AND expires_at > NOW()`
    );
    if (res.rowCount > 0) {
      return { token: res.rows[0].locked_by, label: res.rows[0].agent_label };
    }
  } catch (e) {
    console.error('[DB] getActiveLock error:', e.message);
  }
  return { token: null, label: null };
}

async function getQueueSize() {
  if (!useDb) return messageQueue.length;
  try {
    const res = await dbState.pool.query('SELECT COUNT(*) FROM line_message_queue');
    return parseInt(res.rows[0].count);
  } catch (e) {
    console.error('[DB] getQueueSize error:', e.message);
    return 0;
  }
}

// ─── HTTP Long Polling API 端點 ─────────────────────────────────────────────
const pendingPolls = []; // { res, token }

async function processPendingPolls() {
  if (pendingPolls.length === 0) return;
  
  const activeLock = await getActiveLock();
  if (!activeLock.token) return; // 沒有 active agent
  
  if (useDb) {
    try {
      // 嘗試獲取一條未處理訊息並標記
      const query = `
        UPDATE line_message_queue
        SET processing = TRUE,
            processing_start_time = $1
        WHERE msg_id = (
          SELECT msg_id
          FROM line_message_queue
          WHERE processing = FALSE
          ORDER BY msg_id ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        RETURNING msg_id, user_id AS "userId", source_id AS "sourceId", text, timestamp, processing, trace_id AS "traceId", retry_count AS "retryCount", notified;
      `;
      const res = await dbState.pool.query(query, [Date.now()]);
      if (res.rowCount > 0) {
        const pendingMsg = res.rows[0];
        // 配對 pendingPolls
        while (pendingPolls.length > 0) {
          const poll = pendingPolls.shift();
          if (poll.token === activeLock.token) {
            console.log(`[Queue-DB] 訊息出列處理中`);
            poll.res.json({ message: pendingMsg });
            return;
          } else {
            poll.res.status(403).json({ error: 'Forbidden', message: 'AGENT_TRANSFER' });
          }
        }
        // 如果配對不到合適的 (例如 token 不匹配且沒有 active lock)，則把訊息回退
        await dbState.pool.query(
          'UPDATE line_message_queue SET processing = FALSE, processing_start_time = NULL WHERE msg_id = $1',
          [pendingMsg.msg_id]
        );
      }
    } catch (e) {
      console.error('[DB] processPendingPolls error:', e.message);
    }
  } else {
    // 原本的本地記憶體邏輯
    const pendingMsg = messageQueue.find(m => !m.processing);
    if (!pendingMsg) return;

    while (pendingPolls.length > 0) {
      const poll = pendingPolls.shift();
      if (poll.token === activeAgentToken) {
        pendingMsg.processing = true;
        pendingMsg.processingStartTime = Date.now();
        saveState();
        console.log(`[Queue] 訊息出列處理中，剩餘 ${messageQueue.length} 則`);
        poll.res.json({ message: pendingMsg });
        break;
      } else {
        poll.res.status(403).json({ error: 'Forbidden', message: 'AGENT_TRANSFER' });
      }
    }
  }
}

// 處理超時與 UX 安撫 (每 5 秒檢查一次)
setInterval(async () => {
  const now = Date.now();
  
  if (useDb) {
    try {
      // 1. 處理超過 3 分鐘 (180,000ms) 的 UX 安撫
      const notifyRes = await dbState.pool.query(
        `UPDATE line_message_queue
         SET notified = TRUE
         WHERE processing = TRUE
           AND ($1 - processing_start_time) > 180000
           AND notified = FALSE
         RETURNING source_id AS "sourceId", trace_id AS "traceId"`,
        [now]
      );
      for (const row of notifyRes.rows) {
        pushToLine(row.sourceId, createSystemFlexMessage(`⏳ AI 正在為您深度思考或執行任務中，請稍候片刻...`, '#f2a900', '進度提示')).catch(()=>{});
        console.log(`[UX-DB] 針對 TraceID: ${row.traceId} 發送超時安撫訊息`);
      }

      // 2. 處理超過 5 分鐘 (300,000ms) 的 Two-Phase Ack 超時
      const timeoutRes = await dbState.pool.query(
        `SELECT msg_id, user_id AS "userId", source_id AS "sourceId", text, timestamp, trace_id AS "traceId", retry_count AS "retryCount"
         FROM line_message_queue
         WHERE processing = TRUE
           AND ($1 - processing_start_time) > 300000`,
         [now]
       );
       
       for (const m of timeoutRes.rows) {
         const newRetry = m.retryCount + 1;
         if (newRetry >= 3) {
           console.error(`[DLQ-DB] 毒藥訊息超過重試上限 (3次)，移入死信佇列！TraceID: ${m.traceId}`);
           const dlqPath = path.join(__dirname, 'dead_letter.json');
           let dlq = [];
           if (fs.existsSync(dlqPath)) {
             try { dlq = JSON.parse(fs.readFileSync(dlqPath, 'utf8')); } catch(e){}
           }
           dlq.push({ ...m, failedAt: now, retryCount: newRetry });
           fs.writeFileSync(dlqPath, JSON.stringify(dlq, null, 2));
           
           pushToLine(m.sourceId, createSystemFlexMessage(`❌ 抱歉，處理此訊息時發生持續性系統錯誤，已為您取消該任務。`, '#ff334b', '系統錯誤')).catch(()=>{});
           await dbState.pool.query('DELETE FROM line_message_queue WHERE msg_id = $1', [m.msg_id]);
         } else {
           console.log(`[Queue-DB] 訊息處理超時 (300s)，重新退回等待狀態 (第 ${newRetry} 次重試)`);
           await dbState.pool.query(
             `UPDATE line_message_queue
              SET processing = FALSE,
                  notified = FALSE,
                  retry_count = $1,
                  processing_start_time = NULL
              WHERE msg_id = $2`,
             [newRetry, m.msg_id]
           );
         }
       }
       
       if (timeoutRes.rowCount > 0) {
         await processPendingPolls();
       }
     } catch (e) {
       console.error('[DB] Timeout interval check error:', e.message);
     }
  } else {
    // 降級模式：原本的本地記憶體邏輯
    let changed = false;
    for (let i = messageQueue.length - 1; i >= 0; i--) {
      const m = messageQueue[i];
      if (m.processing) {
        const elapsed = now - m.processingStartTime;
        
        // UX 主動安撫 (處理超過 3 分鐘)
        if (elapsed > 180000 && !m.notified) {
          m.notified = true;
          changed = true;
          pushToLine(m.sourceId, createSystemFlexMessage(`⏳ AI 正在為您深度思考或執行任務中，請稍候片刻...`, '#f2a900', '進度提示')).catch(()=>{});
          console.log(`[UX] 針對 TraceID: ${m.traceId} 發送超時安撫訊息`);
        }
        
        // Two-Phase Ack 超時退回佇列或進入 DLQ (超過 5 分鐘)
        if (elapsed > 300000) {
          m.retryCount = (m.retryCount || 0) + 1;
          if (m.retryCount >= 3) {
            console.error(`[DLQ] 毒藥訊息超過重試上限 (3次)，移入死信佇列！TraceID: ${m.traceId}`);
            // 寫入 DLQ
            const dlqPath = path.join(__dirname, 'dead_letter.json');
            let dlq = [];
            if (fs.existsSync(dlqPath)) {
              try { dlq = JSON.parse(fs.readFileSync(dlqPath, 'utf8')); } catch(e){}
            }
            dlq.push({ ...m, failedAt: now });
            fs.writeFileSync(dlqPath, JSON.stringify(dlq, null, 2));
            
            // 通知用戶並移除
            pushToLine(m.sourceId, createSystemFlexMessage(`❌ 抱歉，處理此訊息時發生持續性系統錯誤，已為您取消該任務。`, '#ff334b', '系統錯誤')).catch(()=>{});
            messageQueue.splice(i, 1);
          } else {
            console.log(`[Queue] 訊息處理超時 (300s)，重新退回等待狀態 (第 ${m.retryCount} 次重試)`);
            m.processing = false;
            m.notified = false; // 重設安撫旗標
          }
          changed = true;
        }
      }
    }
    
    if (changed) {
      saveState();
      await processPendingPolls();
    }
  }
}, 5000);

// 1. Agent 取得/切換控制權
app.post('/api/lock/acquire', express.json(), async (req, res) => {
  const { agentId, agentLabel, force } = req.body;
  
  if (useDb) {
    try {
      let acquired = false;
      if (force) {
        const query = `
          INSERT INTO agent_distributed_locks (resource_id, locked_by, agent_label, expires_at)
          VALUES ('line_bridge_lock', $1, $2, NOW() + ('60 seconds')::INTERVAL)
          ON CONFLICT (resource_id) DO UPDATE
            SET locked_by = EXCLUDED.locked_by,
                agent_label = EXCLUDED.agent_label,
                locked_at = NOW(),
                expires_at = EXCLUDED.expires_at
          RETURNING resource_id;
        `;
        const dbRes = await dbState.pool.query(query, [agentId, agentLabel]);
        acquired = dbRes.rowCount > 0;
      } else {
        const query = `
          INSERT INTO agent_distributed_locks (resource_id, locked_by, agent_label, expires_at)
          VALUES ('line_bridge_lock', $1, $2, NOW() + ('60 seconds')::INTERVAL)
          ON CONFLICT (resource_id) DO UPDATE
            SET locked_by = EXCLUDED.locked_by,
                agent_label = EXCLUDED.agent_label,
                locked_at = NOW(),
                expires_at = EXCLUDED.expires_at
            WHERE agent_distributed_locks.expires_at < NOW() OR agent_distributed_locks.locked_by = EXCLUDED.locked_by
          RETURNING resource_id;
        `;
        const dbRes = await dbState.pool.query(query, [agentId, agentLabel]);
        acquired = dbRes.rowCount > 0;
      }

      if (acquired) {
        while (pendingPolls.length > 0) {
          const poll = pendingPolls.shift();
          poll.res.status(403).json({ error: 'Forbidden', message: 'AGENT_TRANSFER' });
        }
        console.log(`[Lock-DB] 控制權已轉移至: ${agentLabel} (Agent ID: ${agentId})`);
        res.json({ success: true, action: force ? 'transferred' : 'acquired' });
      } else {
        const currentLock = await getActiveLock();
        res.json({ success: false, action: 'pending', currentOwner: currentLock.label || 'Unknown' });
      }
    } catch (e) {
      console.error('[DB] acquire lock error:', e.message);
      res.status(500).json({ error: 'Database error', message: e.message });
    }
  } else {
    if (!activeAgentToken || force || activeAgentToken === agentId) {
      activeAgentToken = agentId;
      activeAgentLabel = agentLabel;
      saveState();
      
      while (pendingPolls.length > 0) {
        const poll = pendingPolls.shift();
        poll.res.status(403).json({ error: 'Forbidden', message: 'AGENT_TRANSFER' });
      }

      console.log(`[Lock] 控制權已轉移至: ${agentLabel}`);
      res.json({ success: true, action: force ? 'transferred' : 'acquired' });
    } else {
      res.json({ success: false, action: 'pending', currentOwner: activeAgentLabel });
    }
  }
});

// 2. Agent 拉取訊息 (Long Polling)
app.get('/api/inbox', async (req, res) => {
  const { token } = req.query;
  const activeLock = await getActiveLock();
  if (token !== activeLock.token) {
    return res.status(403).json({ error: 'Forbidden', message: 'AGENT_TRANSFER' });
  }
  
  if (useDb) {
    try {
      const query = `
        UPDATE line_message_queue
        SET processing = TRUE,
            processing_start_time = $1
        WHERE msg_id = (
          SELECT msg_id
          FROM line_message_queue
          WHERE processing = FALSE
          ORDER BY msg_id ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        RETURNING msg_id, user_id AS "userId", source_id AS "sourceId", text, timestamp, processing, trace_id AS "traceId", retry_count AS "retryCount", notified;
      `;
      const dbRes = await dbState.pool.query(query, [Date.now()]);
      if (dbRes.rowCount > 0) {
        return res.json({ message: dbRes.rows[0] });
      }
    } catch (e) {
      console.error('[DB] inbox query error:', e.message);
    }
  } else {
    const pendingMsg = messageQueue.find(m => !m.processing);
    if (pendingMsg) {
      pendingMsg.processing = true;
      pendingMsg.processingStartTime = Date.now();
      saveState();
      return res.json({ message: pendingMsg });
    }
  }

  // 進入長輪詢 (Long Polling)
  const pollObj = { res, token };
  pendingPolls.push(pollObj);

  // 20 秒超時後回傳 null
  setTimeout(() => {
    const idx = pendingPolls.indexOf(pollObj);
    if (idx !== -1) {
      pendingPolls.splice(idx, 1);
      res.json({ message: null });
    }
  }, 20000);
});

// 3. Agent 發送回覆 (Two-Phase Ack)
async function checkLLMQuota() {
  try {
    const cockpitDir = path.join(process.env.USERPROFILE || process.env.HOME, '.antigravity_cockpit', 'cache', 'quota_api_v1_plugin', 'authorized');
    if (!fs.existsSync(cockpitDir)) return '';
    const files = await fs.promises.readdir(cockpitDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    if (jsonFiles.length === 0) return '';
    // Find the most recently modified file
    let latestFile = null;
    let latestTime = 0;
    for (const file of jsonFiles) {
      const filePath = path.join(cockpitDir, file);
      const stat = await fs.promises.stat(filePath);
      if (stat.mtimeMs > latestTime) {
        latestTime = stat.mtimeMs;
        latestFile = filePath;
      }
    }
    if (!latestFile) return '';
    const data = await fs.promises.readFile(latestFile, 'utf8');
    const json = JSON.parse(data);
    const proModel = json.payload?.models?.['gemini-2.5-pro'];
    if (proModel && proModel.quotaInfo) {
      const frac = proModel.quotaInfo.remainingFraction;
      const modelName = proModel.displayName || 'LLM';
      return `\n([${modelName}] 模組配額提醒：目前剩餘 ${(frac * 100).toFixed(1)}%)`;
    }
  } catch (e) {
    console.error('[LLM Quota Error]', e.message);
  }
  return '';
}

app.post('/api/outbox', express.json(), async (req, res) => {
  const { userId, text } = req.body;
  
  // 確認處理完成，移出佇列
  if (useDb) {
    try {
      await dbState.pool.query(
        `DELETE FROM line_message_queue
         WHERE msg_id = (
           SELECT msg_id
           FROM line_message_queue
           WHERE user_id = $1 AND processing = TRUE
           ORDER BY msg_id ASC
           LIMIT 1
         )`,
        [userId]
      );
    } catch (e) {
      console.error('[DB] outbox delete error:', e.message);
    }
  } else {
    const idx = messageQueue.findIndex(m => m.userId === userId && m.processing);
    if (idx !== -1) {
      messageQueue.splice(idx, 1);
      saveState();
    }
  }

  console.log(`[←LINE] 傳送回覆給 ${userId}: ${text.substring(0, 30)}...`);
  await pushToLine(userId, text);
  res.json({ success: true });
});

// ─── 推播訊息給 LINE 使用者 ───────────────────────────────────────────────────
function createSystemFlexMessage(text, color = '#ff334b', title = '系統通知') {
  return {
    type: 'flex',
    altText: text,
    contents: {
      type: 'bubble',
      styles: { header: { backgroundColor: color } },
      header: {
        type: 'box', layout: 'vertical', contents: [
          { type: 'text', text: title, color: '#ffffff', weight: 'bold', size: 'sm' }
        ]
      },
      body: {
        type: 'box', layout: 'vertical', contents: [
          { type: 'text', text: text, wrap: true, size: 'sm' }
        ]
      }
    }
  };
}

async function pushToLine(targetId, message) {
  if (typeof message === 'string') {
    
    // Check LINE Quota before sending
    try {
      const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
      const [quotaRes, consumptionRes] = await Promise.all([
        axios.get('https://api.line.me/v2/bot/message/quota', { headers: { 'Authorization': `Bearer ${token}` } }),
        axios.get('https://api.line.me/v2/bot/message/quota/consumption', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const quotaType = quotaRes.data.type;
      const quotaValue = quotaRes.data.value;
      const totalUsage = consumptionRes.data.totalUsage;
      
      if (quotaType !== 'none') {
        const remaining = quotaValue - totalUsage;
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const resetTimeStr = `${nextMonth.getFullYear()}/${String(nextMonth.getMonth()+1).padStart(2, '0')}/01`;
        message += `\n\n(額度提醒：本月剩餘 ${remaining} 則，將於 ${resetTimeStr} 重置)`;
      }
    } catch (e) {
      console.error('[Quota Check Error]', e.response ? e.response.data : e.message);
    }

    // Check LLM Quota
    message += await checkLLMQuota();

    // 轉換為原生字串 + Flex Message 按鈕的組合
    const flexMessages = parseMarkdownToFlex(message);
    
    if (flexMessages && Array.isArray(flexMessages)) {
      await lineClient.pushMessage({
        to: targetId,
        messages: flexMessages,
      });
    } else {
      // 若沒有需要轉換的按鈕，純文字送出
      await lineClient.pushMessage({
        to: targetId,
        messages: [{ type: 'text', text: message }],
      });
    }
  } else {
    // 若原本就是物件格式，直接發送
    await lineClient.pushMessage({
      to: targetId,
      messages: [message],
    });
  }
}

let lastQueueFullWarning = {};

// ─── 指令處理 ─────────────────────────────────────────────────────────────────
async function handleCommand(userId, sourceId, text, replyToken) {
  const cmd = text.trim().toLowerCase();

  // 指令攔截
  if (cmd === '/status') {
    const activeLock = await getActiveLock();
    const qSize = await getQueueSize();
    const status = [
      `🟢 Bridge 伺服器：運作中 (Port ${PORT})`,
      `⚡ 傳輸模式：Zero-Delay File Event Pipeline`,
      `🛡️ 狀態儲存：${useDb ? 'Neon DB (分散式鎖與佇列)' : '本地檔案/記憶體 (降級模式)'}`,
      `${activeLock.token ? '🔄' : '⚪'} 控制狀態：${activeLock.token ? `由 ${activeLock.label} 控制中` : '閒置'}`,
      `📋 佇列：${qSize} 則待處理`,
    ].join('\n');
    await pushToLine(sourceId, status);
    return;
  }
  
  if (cmd === '/help') {
    await lineClient.replyMessage({
      replyToken,
      messages: [{
        type: 'text',
        text: [
          '🤖 Antigravity LINE 光速橋接器：',
          '',
          '📝 一般文字 → 瞬間傳給 Agent',
          '/status → 查看系統狀態',
          '/help → 顯示此說明',
          '',
          '註：CDP 模式指令 (截圖/自動授權) 因底層限制已停用。'
        ].join('\n'),
      }],
    });
    return;
  }

  // 一般訊息：寫入佇列
  const qSize = await getQueueSize();
  if (qSize >= MAX_QUEUE_SIZE) {
    const now = Date.now();
    const lastWarn = lastQueueFullWarning[sourceId] || 0;
    if (now - lastWarn > 10000) { // 每 10 秒最多警告一次
      lastQueueFullWarning[sourceId] = now;
      await pushToLine(sourceId, createSystemFlexMessage(`❌ 訊息佇列已滿（上限 ${MAX_QUEUE_SIZE} 則），請稍後再試`, '#ff334b', '系統繁忙'));
    }
    return;
  }
  
  if (useDb) {
    try {
      const traceId = crypto.randomUUID();
      await dbState.pool.query(
        `INSERT INTO line_message_queue (user_id, source_id, text, timestamp, processing, trace_id, retry_count, notified)
         VALUES ($1, $2, $3, $4, FALSE, $5, 0, FALSE)`,
        [userId, sourceId, text, Date.now(), traceId]
      );
      console.log(`[Queue-DB] 新訊息已入列，TraceID: ${traceId}`);
    } catch (e) {
      console.error('[DB] 入列失敗：', e.message);
      try {
        await pushToLine(sourceId, `❌ 系統錯誤：無法將訊息加入佇列。`);
      } catch {}
      return;
    }
  } else {
    messageQueue.push({ 
      userId, 
      sourceId, 
      text, 
      timestamp: Date.now(), 
      processing: false,
      traceId: crypto.randomUUID(),
      retryCount: 0,
      notified: false
    });
    saveState();
  }
  
  await processPendingPolls();
  
  const currentQSize = await getQueueSize();
  if (currentQSize === 1) {
    // 佇列中的第一筆，直接觸發 loading
    try {
      await lineClient.showLoadingAnimation({ chatId: sourceId, loadingSeconds: 60 });
    } catch (e) { /* 忽略 */ }
  } else {
    // 告知排隊中
    const pos = currentQSize;
    await pushToLine(sourceId, `📋 訊息已排隊（第 ${pos} 則）\nAgent 處理中，請稍候...`);
  }
}

// ─── LINE Webhook 端點 ────────────────────────────────────────────────────────
app.post('/webhook', express.raw({type: 'application/json'}), (req, res, next) => {
  console.log(`[DEBUG] 收到來自外部的 POST /webhook 請求！IP: ${req.ip}`);
  next();
}, line.middleware(lineConfig), (req, res) => {
  res.status(200).end();

  req.body.events.forEach(async (event) => {
    if (event.type !== 'message') return;

    const userId = event.source.userId;
    const sourceId = event.source.groupId || event.source.roomId || event.source.userId;
    const replyToken = event.replyToken;

    if (ALLOWED_USER_ID && userId !== ALLOWED_USER_ID) {
      console.warn(`[SECURITY] 拒絕未授權的使用者: ${userId} (Source: ${sourceId})`);
      return;
    }

    if (event.message.type === 'text') {
      // 進站邊界正規化 (Inbound Normalization)：強制將使用者訊息的簡體轉為繁體
      let text = twConverter(event.message.text);
      const isGroup = !!(event.source.groupId || event.source.roomId);

      if (isGroup) {
        // 群組環境：檢查是否有標記 Bot
        const mentionees = event.message.mention?.mentionees || [];
        const isMentioned = BOT_USER_ID && mentionees.some(m => m.userId === BOT_USER_ID);
        if (!isMentioned) {
          // 未被標記，直接忽略
          return;
        }
        // 被標記，加入前綴以辨識發言者
        text = `[User: ${userId.substring(0,6)}] ` + text;
      }

      console.log(`[LINE→] 來自 ${userId} (群組/對話框: ${sourceId}): ${text}`);
      
      // 攔截查詢額度的特殊指令
      if (text.trim() === '$$額度$$') {
        try {
          const [quotaRes, consumptionRes] = await Promise.all([
            axios.get('https://api.line.me/v2/bot/message/quota', { headers: { 'Authorization': `Bearer ${lineConfig.channelAccessToken}` } }),
            axios.get('https://api.line.me/v2/bot/message/quota/consumption', { headers: { 'Authorization': `Bearer ${lineConfig.channelAccessToken}` } })
          ]);
          
          const quotaType = quotaRes.data.type;
          const quotaValue = quotaRes.data.value;
          const totalUsage = consumptionRes.data.totalUsage;
          
          let msg = '';
          if (quotaType === 'none') {
            msg = `📊 【LINE 訊息額度狀態】\n目前為無上限方案\n已使用則數：${totalUsage} 則`;
          } else {
            const remaining = quotaValue - totalUsage;
            msg = `📊 【LINE 訊息額度狀態】\n本月額度上限：${quotaValue} 則\n已使用則數：${totalUsage} 則\n剩餘額度：${remaining} 則`;
          }
          
          // 使用 replyMessage 確保不扣額度
          await lineClient.replyMessage({
            replyToken,
            messages: [{ type: 'text', text: msg }]
          });
          return;
        } catch (e) {
          console.error('[QUOTA ERROR]', e.response ? e.response.data : e.message);
          await lineClient.replyMessage({
            replyToken,
            messages: [{ type: 'text', text: `❌ 查詢額度失敗：${e.message}` }]
          });
          return;
        }
      }

      try {
        await handleCommand(userId, sourceId, text, replyToken);
      } catch (e) {
        console.error('[ERROR]', e);
        try {
          await pushToLine(sourceId, `❌ 系統錯誤：${e.message}`);
        } catch {}
      }
    } else if (event.message.type === 'image') {
      const messageId = event.message.id;
      console.log(`[LINE→] 來自 ${userId} (群組/對話框: ${sourceId}) 傳送了圖片: ${messageId}`);
      try {
        // ✅ 修復：圖片永久存至 public/ 目錄，讓 Agent 可用 view_file 讀取後自行清理
        const publicDir = path.join(__dirname, 'public');
        if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
        const imageFileName = `image_${messageId}.jpg`;
        const imagePath = path.join(publicDir, imageFileName);

        const response = await axios({
          method: 'GET',
          url: `https://api-data.line.me/v2/bot/message/${messageId}/content`,
          headers: { 'Authorization': `Bearer ${lineConfig.channelAccessToken}` },
          responseType: 'stream'
        });
        
        const writer = fs.createWriteStream(imagePath);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        console.log(`[IMAGE] 圖片已儲存至: ${imagePath}`);

        // ✅ 傳給 Agent [IMAGE:本機絕對路徑] 標記，讓 Agent 用 view_file 讀取
        const text = `[IMAGE:${imagePath}]\n使用者傳送了一張圖片，請分析圖片內容並根據上下文提供回應。`;
        await handleCommand(userId, sourceId, text, replyToken);
        // 注意：圖片由 Agent 處理完後自行清理，Bridge 不再自動刪除
      } catch (e) {
        console.error('[IMAGE ERROR]', e);
        try { await pushToLine(sourceId, `❌ 圖片下載失敗：${e.message}`); } catch {}
      }
    }
  });
});

// 加入錯誤處理中介軟體，攔截 SignatureValidationFailed 避免日誌洗版
app.use((err, req, res, next) => {
  if (err && err.name === 'SignatureValidationFailed') {
    // 忽略無效簽章的請求 (可能是 LINE 的 Webhook 驗證或網路掃描器)
    return res.status(401).send('Invalid signature');
  }
  next(err);
});

// ─── 管理 API ────────────────────────────────────────────────────────────────
app.post('/internal/reset-lock', express.json(), async (req, res) => {
  const secret = req.headers['x-internal-secret'];
  if (secret !== process.env.INTERNAL_GATEWAY_TOKEN) return res.status(403).json({ error: 'Forbidden' });
  
  if (req.body && req.body.clearQueue) {
    let dropped = 0;
    if (useDb) {
      try {
        const countRes = await dbState.pool.query('SELECT COUNT(*) FROM line_message_queue');
        dropped = parseInt(countRes.rows[0].count);
        await dbState.pool.query('TRUNCATE TABLE line_message_queue');
      } catch (e) {
        console.error('[DB] truncate error:', e.message);
      }
    } else {
      dropped = messageQueue.length;
      messageQueue.length = 0; // 清空佇列
      saveState();
    }
    console.log(`[Bridge] 佇列已清空（${dropped} 則丟棄）`);
    res.json({ success: true, queueCleared: true, dropped });
  } else {
    const qSize = await getQueueSize();
    res.json({ success: true, queueSize: qSize });
  }
});

app.get('/internal/status', async (req, res) => {
  const activeLock = await getActiveLock();
  const qSize = await getQueueSize();
  res.json({ activeAgentLabel: activeLock.label, queueSize: qSize, uptime: process.uptime(), dbMode: useDb });
});

// ─── Auto-Healing Webhook Updater ──────────────────────────────────────────────
// 修復說明：原版讀取 PM2 日誌（使用者未使用 PM2，故永遠失效）。
// 修正版改讀專案根目錄的 cloudflared_log.txt，由 start_line.ps1 負責寫入此檔。
// 支援 Quick Tunnel（trycloudflare.com）與 Named Tunnel（兩種模式皆可）。
async function autoUpdateWebhook() {
  try {
    // ① 優先讀本地 cloudflared_log.txt（由啟動腳本將 cloudflared 輸出重導至此）
    const localLogPath = path.resolve(__dirname, '..', 'cloudflared_log.txt');
    // ② 備援：PM2 日誌（若改用 PM2 管理則自動切換）
    const pm2LogPath = path.join(process.env.USERPROFILE || process.env.HOME, '.pm2', 'logs', 'cloudflare-tunnel-error.log');

    let logContent = '';
    if (fs.existsSync(localLogPath)) {
      logContent = fs.readFileSync(localLogPath, 'utf8');
    } else if (fs.existsSync(pm2LogPath)) {
      logContent = fs.readFileSync(pm2LogPath, 'utf8');
    } else {
      return; // 兩個日誌都不存在，靜默跳過
    }

    // 同時匹配 Quick Tunnel (trycloudflare.com) 與 Named Tunnel (.cloudflare.com)
    const matches = logContent.match(/https:\/\/[a-z0-9-]+\.(?:trycloudflare\.com|cloudflare\.com)/g);
    if (!matches || matches.length === 0) return;

    const latestTunnelUrl = matches[matches.length - 1];
    const newWebhookEndpoint = `${latestTunnelUrl}/webhook`;

    const res = await axios.get('https://api.line.me/v2/bot/channel/webhook/endpoint', {
      headers: { 'Authorization': `Bearer ${lineConfig.channelAccessToken}` }
    });

    const currentEndpoint = res.data.endpoint;

    if (currentEndpoint !== newWebhookEndpoint) {
      console.log(`[Auto-Heal] 偵測到網址變更！`);
      console.log(`  舊: ${currentEndpoint}`);
      console.log(`  新: ${newWebhookEndpoint}`);

      await axios.put('https://api.line.me/v2/bot/channel/webhook/endpoint', {
        endpoint: newWebhookEndpoint
      }, {
        headers: {
          'Authorization': `Bearer ${lineConfig.channelAccessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[Auto-Heal] ✅ LINE Webhook 網址自動更新成功！');

      if (ALLOWED_USER_ID) {
        await pushToLine(ALLOWED_USER_ID,
          `🟢 **系統重啟自動修復成功**\n\n` +
          `偵測到全新的隧道網址，已自動為您更新至 LINE 後台！\n\n` +
          `新網址：\`${newWebhookEndpoint}\``
        );
      }
    } else {
      console.log(`[Auto-Heal] Webhook 網址無變化，無需更新。`);
    }
  } catch (e) {
    console.error('[Auto-Heal] 自動更新 Webhook 失敗:', e.response ? JSON.stringify(e.response.data) : e.message);
  }
}

// cloudflared 啟動需要幾秒才能建立隧道並輸出 URL，故首次偵測延遲 8 秒
// 之後每 30 秒重新檢查（應對網路中斷後重連的情況）
setTimeout(autoUpdateWebhook, 8000);
setInterval(autoUpdateWebhook, 30000);

// ─── 啟動 ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Antigravity LINE Bridge v3.0 (光速版) 已啟動       ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`📡 Webhook 端點：http://localhost:${PORT}/webhook`);
  console.log(`⚡ 核心架構：Zero-Delay File Event Pipeline`);
  console.log('');
});
