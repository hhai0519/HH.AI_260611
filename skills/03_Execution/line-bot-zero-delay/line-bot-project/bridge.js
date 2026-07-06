/**
 * Antigravity LINE Bridge v10.0 Final (Sentinel HA & Replay Protection)
 * 架構：Redis Sentinel / Stream + Outbox HMAC 簽章 + dead_letter_stream + 雙人審批工單強關聯
 */

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || require('path').resolve(__dirname, '../../../../');
require('dotenv').config({ path: require('path').join(WORKSPACE_ROOT, '.env.local') });

const express = require('express');
const { spawn } = require('child_process');
const line = require('@line/bot-sdk');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const { parseMarkdownToFlex } = require('./markdown_to_flex');
const OpenCC = require('opencc-js');
const twConverter = OpenCC.Converter({ from: 'cn', to: 'twp' });
const Redis = require('ioredis');

// ─── Redis Sentinel & Fallback 連線配置 ──────────────────────────────────────
let redis = null;
let useRedis = false;

const redisSentinels = process.env.REDIS_SENTINELS; // "sentinel_node1:26379,sentinel_node2:26379,sentinel_node3:26379"
const redisMasterName = process.env.REDIS_MASTER_NAME || 'mymaster';
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

async function initRedis() {
  try {
    if (redisSentinels) {
      const sentinels = redisSentinels.split(',').map(s => {
        const [host, port] = s.split(':');
        return { host, port: parseInt(port || '26379', 10) };
      });
      redis = new Redis({
        sentinels,
        name: redisMasterName,
        connectTimeout: 3000
      });
      console.log('[REDIS] Connecting via Sentinels...');
    } else {
      redis = new Redis(redisUrl, {
        connectTimeout: 3000
      });
      console.log('[REDIS] Connecting to single instance:', redisUrl);
    }

    // 🛡️ [資安/SRE 追加] 掛載背景錯誤監聽器，防止未捕獲異常崩潰
    redis.on('error', (err) => {
      if (err?.message?.includes('ECONNREFUSED')) {
        console.warn('[REDIS] Connection refused, retrying in background...');
      } else {
        console.error('[REDIS] Background connection error:', err?.message || err);
      }
    });

    await redis.ping();
    useRedis = true;
    console.log('[REDIS] Connection established successfully.');
    
    // 初始化 Stream 消費組
    try {
      await redis.xgroup('CREATE', 'prod:linebot:events', 'agent_group', '$', 'MKSTREAM');
      console.log('[REDIS] Consumer group "agent_group" created on "prod:linebot:events".');
    } catch (e) {
      if (!e.message.includes('BUSYGROUP')) {
        console.warn('[REDIS] Group setup warning:', e.message);
      }
    }
  } catch (e) {
    console.warn('[REDIS] Redis unavailable. Falling back to Memory mode. Error:', e.message);
    useRedis = false;
    if (redis) {
      try { redis.disconnect(); } catch (err) {} // 🛡️ [SRE 追加] 釋放 Socket，防止背景重試洩漏
      redis = null;
    }
  }
}
initRedis();

// ─── 設定 ───────────────────────────────────────────────────────────────────
const lineConfig = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
};

const ALLOWED_USER_ID = process.env.LINE_ALLOWED_USER_ID || '';
const PORT = parseInt(process.env.PORT || '3000');

const app = express();

// DLP：防禦性遮蔽日誌中的明文憑證，並加入 null/undefined 空值防護
function sanitizeErrorLog(message, err) {
  if (!err) {
    console.error(`${message}: Unknown Error (null/undefined)`);
    return;
  }
  
  let errStr = '';
  if (err.response && err.response.data) {
    errStr = typeof err.response.data === 'object' ? JSON.stringify(err.response.data) : String(err.response.data);
  } else {
    errStr = err.message || String(err);
  }

  const token = lineConfig.channelAccessToken;
  if (token && errStr.includes(token)) {
    errStr = errStr.replace(new RegExp(token, 'g'), '*** LINE_ACCESS_TOKEN_REDACTED ***');
  }
  console.error(`${message}:`, errStr);
}

// ─── 安全防線 (Localhost Enforcement 中間件) ───────────────────────────────────
function localhostOnly(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || '';
  const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip.includes('localhost');
  if (!isLocal) {
    console.warn(`[SECURITY WARNING] Blocked external request to admin route: ${req.originalUrl} from IP: ${ip}`);
    return res.status(403).json({ error: 'Forbidden', message: 'Admin API only accessible from localhost' });
  }
  next();
}
app.use('/api/lock/*', localhostOnly);
app.use('/api/chaos/*', localhostOnly);
app.use('/metrics', localhostOnly);

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
    sanitizeErrorLog('[系統] 無法取得機器人自身 ID', e);
  }
}
fetchBotInfo();

// ─── 記憶體狀態與持久化 (降級模式用) ───────────────────────────────────────────
const STATE_FILE = path.join(__dirname, 'bridge_state.json');
const ALLOW_IN_MEMORY_FALLBACK = process.env.ALLOW_IN_MEMORY_FALLBACK === 'true';
const MAX_QUEUE_SIZE = parseInt(process.env.MAX_QUEUE_SIZE || '1000');

let activeAgentToken = null;
let activeAgentLabel = null;
let activeAgentLockExpiresAt = 0;
let activeAgentFencingToken = '1:0';

// 運維指標與統計 (符合 V10.0 SLA 稽核)
const metrics = {
  lock_acquire_success_total: 0,
  lock_acquire_failure_total: 0,
  lock_heartbeat_failure_total: 0,
  lock_recovery_total: 0,
  lock_grace_period_total: 0,
  worker_abort_total: 0,
  redis_lock_renew_failure: 0,
  replay_audit_write_failure: 0,
  replay_without_ticket: 0
};

const metrics_gauges = {
  active_workers: 0,
  grace_period_workers: 0,
  lock_waiters: 0
};

// ─── Lua scripts ─────────────────────────────────────────────────────────────
const acquireLockScript = `
local lock_key = KEYS[1]
local epoch_key = KEYS[2]
local token_key = KEYS[3]
local agent_id = ARGV[1]
local ttl = ARGV[2]

local owner = redis.call("GET", lock_key)
if not owner or owner == "" then
  redis.call("SET", lock_key, agent_id, "PX", ttl)
  local epoch = redis.call("INCR", epoch_key)
  redis.call("SET", token_key, "0")
  return {1, tonumber(epoch)}
elseif owner == agent_id then
  redis.call("PEXPIRE", lock_key, ttl)
  local epoch = redis.call("GET", epoch_key) or "1"
  return {1, tonumber(epoch)}
else
  return {0, 0}
end
`;

const renewLockScript = `
local lock_key = KEYS[1]
local agent_id = ARGV[1]
local ttl = ARGV[2]

local owner = redis.call("GET", lock_key)
if owner == agent_id then
  return redis.call("PEXPIRE", lock_key, ttl)
else
  return 0
end
`;

const releaseScript = `
local lock_key = KEYS[1]
local agent_id = ARGV[1]

local owner = redis.call("GET", lock_key)
if owner == agent_id then
  return redis.call("DEL", lock_key)
else
  return 0
end
`;

// ─── 輔助：寫入安全鎖審計日誌 ─────────────────────────────────────────────────
async function logLockEvent(eventType, agentId, runId, fencingToken, metadata = {}) {
  if (eventType === 'LOCK_HEARTBEAT') return;
  
  if (useRedis) {
    try {
      await redis.xadd(
        'prod:linebot:lock_audit',
        'MAXLEN', '~', 10000,
        '*',
        'event_type', eventType,
        'agent_id', agentId,
        'run_id', runId || '',
        'fencing_token', fencingToken || '',
        'metadata', JSON.stringify(metadata),
        'timestamp', Date.now().toString()
      );
    } catch (e) {
      console.error('[REDIS AUDIT ERROR]', e.message);
    }
  } else {
    console.log(`[AUDIT_LOG] [${eventType}] Agent: ${agentId}, Run: ${runId}, Token: ${fencingToken}, Metadata:`, metadata);
  }
}

// ─── 輔助：寫入 GitHub 審計倉儲 (Non-Repudiation) ──────────────────────────────
async function logToGitHubAudit(ticketId, messageId, agentId, text) {
  const token = process.env.GITHUB_TOKEN;
  if (!token || token.includes('<YOUR_')) {
    console.warn('[GITHUB AUDIT] GITHUB_TOKEN is a placeholder. Logging locally to audit/replay-log.json.');
    const logDir = path.join(__dirname, 'audit');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(logDir, 'replay-log.json');
    let logs = [];
    if (fs.existsSync(logPath)) {
      try { logs = JSON.parse(await fs.promises.readFile(logPath, 'utf8')); } catch(e){}
    }
    logs.push({ ticketId, messageId, agentId, timestamp: new Date().toISOString(), textSnippet: text.substring(0, 100) });
    await fs.promises.writeFile(logPath, JSON.stringify(logs, null, 2));
    return;
  }

  try {
    const owner = 'HH.AI_260611'; 
    const repo = 'audit-repo';     
    const path = 'audit/replay-log.json';
    
    let sha = undefined;
    let existingLogs = [];
    try {
      const getRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      sha = getRes.data.sha;
      existingLogs = JSON.parse(Buffer.from(getRes.data.content, 'base64').toString('utf8'));
    } catch (e) {
      // File may not exist yet
    }

    existingLogs.push({ ticketId, messageId, agentId, timestamp: new Date().toISOString(), textSnippet: text.substring(0, 100) });
    
    await axios.put(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      message: `Audit: Replay Dead Letter message ${messageId} for ticket ${ticketId}`,
      content: Buffer.from(JSON.stringify(existingLogs, null, 2)).toString('base64'),
      sha
    }, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('[GITHUB AUDIT] Audit trail committed to GitHub Repository.');
  } catch (e) {
    metrics.replay_audit_write_failure++;
    console.error('[GITHUB AUDIT] Failed to commit to GitHub:', e.response ? e.response.data : e.message);
  }
}

if (fs.existsSync(STATE_FILE)) {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    activeAgentToken = state.activeAgentToken || null;
    activeAgentLabel = state.activeAgentLabel || null;
    activeAgentFencingToken = state.activeAgentFencingToken !== undefined && state.activeAgentFencingToken !== null ? String(state.activeAgentFencingToken) : '1:0';
    messageQueue = state.messageQueue || [];
  } catch (e) {}
}

let saveTimer = null;
function saveState() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.writeFile(STATE_FILE, JSON.stringify({ activeAgentToken, activeAgentLabel, activeAgentFencingToken, messageQueue }, null, 2), (err) => {
      if (err) console.error('[BRIDGE] Failed to save state:', err);
    });
    saveTimer = null;
  }, 1000);
}

// ─── 變更管理 (Change Management) ─────────────────────────────────────────────
const changeRecords = [];

app.post('/api/change/record', express.json(), async (req, res) => {
  const { changeId, requester, approver, description, rollbackPlan } = req.body;
  if (!changeId || !requester || !approver) {
    return res.status(400).json({ error: 'Bad Request', message: 'Missing fields' });
  }
  const record = {
    changeId,
    requester,
    approver,
    description: description || '',
    rollbackPlan: rollbackPlan || '',
    status: 'pending',
    createdAt: Date.now().toString()
  };
  changeRecords.push(record);
  
  if (useRedis) {
    try {
      await redis.hset(`change_records:${changeId}`, record);
      await redis.incr('change_total_count');
    } catch (e) {
      console.error('[REDIS] Failed to save change record:', e.message);
    }
  }
  
  console.log('[CAB] Change record saved:', record);
  res.json({ success: true, record });
});

app.post('/api/change/update-status', express.json(), async (req, res) => {
  const { changeId, status } = req.body; // status: "success" or "failed"
  if (!changeId || !status) {
    return res.status(400).json({ error: 'Bad Request', message: 'Missing fields' });
  }
  if (useRedis) {
    try {
      const oldStatus = await redis.hget(`change_records:${changeId}`, 'status');
      if (oldStatus !== status) {
        await redis.hset(`change_records:${changeId}`, 'status', status);
        if (status === 'failed' && oldStatus !== 'failed') {
          await redis.incr('change_failed_count');
        } else if (status === 'success' && oldStatus === 'failed') {
          const failedVal = parseInt(await redis.get('change_failed_count') || '0', 10);
          if (failedVal > 0) await redis.decr('change_failed_count');
        }
      }
    } catch (e) {
      console.error('[REDIS] Failed to update change status:', e.message);
    }
  }
  res.json({ success: true, changeId, status });
});

app.post('/api/incident/postmortem', express.json(), async (req, res) => {
  const { incidentId, timeline, rootCause, impact, detection, actionItems } = req.body;
  if (!incidentId || !rootCause || !impact) {
    return res.status(400).json({ error: 'Bad Request', message: 'Missing fields' });
  }
  const record = {
    incidentId,
    timeline: JSON.stringify(timeline || []),
    rootCause,
    impact,
    detection: detection || '',
    actionItems: JSON.stringify(actionItems || []),
    createdAt: Date.now().toString()
  };
  
  if (useRedis) {
    try {
      await redis.hset(`postmortems:${incidentId}`, record);
      await redis.incr('incident_count');
    } catch (e) {
      console.error('[REDIS] Failed to save postmortem:', e.message);
    }
  }
  
  console.log('[SRE] Incident postmortem saved:', incidentId);
  res.json({ success: true, record });
});

// ─── 死信重播雙人審批端點 (DLQ Double Approval) ──────────────────────────────────
app.post('/api/dlq/ticket/create', express.json(), async (req, res) => {
  const { ticketId, proposer, payload, messageId } = req.body;
  if (!ticketId || !proposer || !payload || !messageId) {
    return res.status(400).json({ error: 'Bad Request', message: 'Missing fields' });
  }
  
  const ticket = {
    ticketId,
    proposer,
    approver: '',
    status: 'pending',
    payload: JSON.stringify(payload),
    messageId,
    createdAt: Date.now().toString()
  };
  
  if (useRedis) {
    try {
      await redis.hset(`prod:linebot:double_approval:${ticketId}`, ticket);
      console.log(`[DLQ] Replay ticket ${ticketId} created by ${proposer}`);
      res.json({ success: true, ticket });
    } catch (e) {
      res.status(500).json({ error: 'Redis error', message: e.message });
    }
  } else {
    res.json({ success: true, ticket });
  }
});

app.post('/api/dlq/ticket/approve', express.json(), async (req, res) => {
  const { ticketId, approver, auditReason } = req.body;
  if (!ticketId || !approver || !auditReason) {
    return res.status(400).json({ error: 'Bad Request', message: 'Missing fields' });
  }
  
  if (useRedis) {
    try {
      const ticket = await redis.hgetall(`prod:linebot:double_approval:${ticketId}`);
      if (!ticket || Object.keys(ticket).length === 0) {
        return res.status(404).json({ error: 'Not Found', message: 'Ticket not found' });
      }
      if (ticket.status !== 'pending') {
        return res.status(400).json({ error: 'Bad Request', message: 'Ticket status is not pending' });
      }
      if (ticket.proposer === approver) {
        return res.status(400).json({ error: 'Bad Request', message: 'Approver must be different from proposer' });
      }
      
      // Update ticket in Redis
      await redis.hset(`prod:linebot:double_approval:${ticketId}`, {
        status: 'approved',
        approver,
        approvedAt: Date.now().toString(),
        auditReason
      });
      
      // Write to events stream so agent can process
      const payload = JSON.parse(ticket.payload);
      await redis.xadd(
        'prod:linebot:events',
        'MAXLEN', '~', 10000,
        '*',
        'payload', JSON.stringify({
          ...payload,
          isReplay: true,
          ticketId,
          originalMessageId: ticket.messageId
        })
      );
      
      console.log(`[DLQ] Replay ticket ${ticketId} approved by ${approver}. Replayed message queued.`);
      res.json({ success: true, message: 'Ticket approved and replayed' });
    } catch (e) {
      res.status(500).json({ error: 'Redis error', message: e.message });
    }
  } else {
    res.json({ success: true, message: 'Memory fallback approved (no-op)' });
  }
});

// ─── 鎖分配與續約端點 ──────────────────────────────────────────────────────────
app.post('/api/lock/acquire', express.json(), async (req, res) => {
  const { agentId, agentLabel, runId, secret, force } = req.body;
  
  // 驗證 Agent Secret
  const currentAgentSecret = process.env.CURRENT_AGENT_SECRET || 'default_agent_secret';
  const nextAgentSecret = process.env.NEXT_AGENT_SECRET || 'default_agent_secret';
  if (secret !== currentAgentSecret && secret !== nextAgentSecret) {
    metrics.lock_acquire_failure_total++;
    return res.status(403).json({ error: 'Forbidden', message: 'Agent unauthorized' });
  }

  if (useRedis) {
    try {
      if (force) {
        // 強制搶佔鎖，直接覆寫
        await redis.set('prod:linebot:lock', agentId, 'PX', 30000);
        const epoch = await redis.incr('prod:linebot:token_epoch');
        await redis.set('prod:linebot:session_token', '0');
        
        activeAgentToken = agentId;
        activeAgentLabel = agentLabel;
        activeAgentFencingToken = `${epoch}:0`;
        
        await logLockEvent('LOCK_FORCE_ACQUIRED', agentId, runId, activeAgentFencingToken, { label: agentLabel, forced: true });
        metrics.lock_acquire_success_total++;
        metrics_gauges.active_workers = 1;
        return res.json({ success: true, fencingToken: activeAgentFencingToken });
      }

      const result = await redis.eval(
        acquireLockScript,
        3,
        'prod:linebot:lock',
        'prod:linebot:token_epoch',
        'prod:linebot:session_token',
        agentId,
        '30000'
      );
      const success = result[0] === 1;
      const epoch = result[1];
      
      if (success) {
        activeAgentToken = agentId;
        activeAgentLabel = agentLabel;
        activeAgentFencingToken = `${epoch}:0`;
        
        await logLockEvent('LOCK_ACQUIRED', agentId, runId, activeAgentFencingToken, { label: agentLabel });
        metrics.lock_acquire_success_total++;
        metrics_gauges.active_workers = 1;
        res.json({ success: true, fencingToken: activeAgentFencingToken });
      } else {
        metrics.lock_acquire_failure_total++;
        metrics_gauges.lock_waiters++;
        const currentOwner = await redis.get('prod:linebot:lock');
        res.status(403).json({
          success: false,
          message: 'LOCK_ACTIVE_REJECT',
          currentOwner
        });
      }
    } catch (e) {
      res.status(500).json({ error: 'Redis error', message: e.message });
    }
  } else {
    // Memory fallback
    const now = Date.now();
    const isExpired = !activeAgentToken || activeAgentLockExpiresAt < now;
    if (isExpired || force) {
      const oldOwner = activeAgentToken;
      activeAgentToken = agentId;
      activeAgentLabel = agentLabel;
      activeAgentLockExpiresAt = now + 60000;
      activeAgentFencingToken = `1:${(parseInt(String(activeAgentFencingToken || '').split(':')[1] || '0') + 1)}`;
      saveState();
      
      if (force && oldOwner && oldOwner !== agentId) {
        await logLockEvent('LOCK_FORCE_ACQUIRED', agentId, runId, activeAgentFencingToken, { label: agentLabel, oldOwner });
      } else {
        metrics.lock_acquire_success_total++;
      }
      metrics_gauges.active_workers = 1;
      res.json({ success: true, fencingToken: activeAgentFencingToken });
    } else {
      metrics.lock_acquire_failure_total++;
      metrics_gauges.lock_waiters++;
      res.status(403).json({ success: false, message: 'LOCK_ACTIVE_REJECT', currentOwner: activeAgentLabel });
    }
  }
});

app.post('/api/lock/heartbeat', express.json(), async (req, res) => {
  const { agentId, fencingToken } = req.body;
  
  if (useRedis) {
    try {
      const result = await redis.eval(
        renewLockScript,
        1,
        'prod:linebot:lock',
        agentId,
        '30000'
      );
      if (result === 1) {
        res.json({ success: true });
      } else {
        metrics.redis_lock_renew_failure++;
        metrics.lock_heartbeat_failure_total++;
        res.status(403).json({ error: 'Forbidden', message: 'LOCK_LOST_OR_EXPIRED' });
      }
    } catch (e) {
      metrics.redis_lock_renew_failure++;
      metrics.lock_heartbeat_failure_total++;
      res.status(500).json({ error: 'Redis error', message: e.message });
    }
  } else {
    // Memory fallback
    const now = Date.now();
    const isActive = activeAgentToken === agentId && activeAgentLockExpiresAt >= now;
    if (isActive) {
      activeAgentLockExpiresAt = now + 60000;
      res.json({ success: true });
    } else {
      metrics.lock_heartbeat_failure_total++;
      res.status(403).json({ error: 'Forbidden', message: 'LOCK_LOST_OR_EXPIRED' });
    }
  }
});

app.post('/api/lock/release', express.json(), async (req, res) => {
  const { agentId, fencingToken, runId } = req.body;
  
  if (useRedis) {
    try {
      const result = await redis.eval(
        releaseScript,
        1,
        'prod:linebot:lock',
        agentId
      );
      if (result === 1) {
        await logLockEvent('LOCK_RELEASED', agentId, runId, fencingToken, { action: 'release' });
        metrics_gauges.active_workers = 0;
        res.json({ success: true });
      } else {
        res.json({ success: false, message: 'LOCK_NOT_OWNED' });
      }
    } catch (e) {
      res.status(500).json({ error: 'Redis error', message: e.message });
    }
  } else {
    if (activeAgentToken === agentId) {
      activeAgentToken = null;
      activeAgentLabel = null;
      activeAgentLockExpiresAt = 0;
      saveState();
      metrics_gauges.active_workers = 0;
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'LOCK_NOT_OWNED' });
    }
  }
});

app.get('/lock/status', async (req, res) => {
  try {
    let status = {
      resource_id: 'line_bridge_lock',
      current_owner: null,
      fencing_token: null,
      expires_at: null,
      is_expired: true
    };
    
    if (useRedis) {
      const owner = await redis.get('prod:linebot:lock');
      const ttl = await redis.pttl('prod:linebot:lock');
      const epoch = await redis.get('prod:linebot:token_epoch') || '1';
      const seq = await redis.get('prod:linebot:session_token') || '0';
      status.current_owner = owner;
      status.fencing_token = `${epoch}:${seq}`;
      status.expires_at = ttl > 0 ? new Date(Date.now() + ttl).toISOString() : null;
      status.is_expired = ttl <= 0;
    } else {
      status.current_owner = activeAgentToken;
      status.fencing_token = activeAgentFencingToken;
      status.expires_at = activeAgentLockExpiresAt ? new Date(activeAgentLockExpiresAt).toISOString() : null;
      status.is_expired = !activeAgentToken || activeAgentLockExpiresAt < Date.now();
    }
    res.json(status);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── 訊息出列端點 (Inbox Pull) ─────────────────────────────────────────────────
app.get('/api/inbox', async (req, res) => {
  const { token, fencingToken } = req.query; // token is agentId
  
  // 觸發超時檢查
  checkTimeoutsAndAlert();
  
  if (useRedis) {
    try {
      // 1. 驗證是否為目前鎖持有者
      const currentOwner = await redis.get('prod:linebot:lock');
      if (currentOwner !== token) {
        return res.status(403).json({ error: 'Forbidden', message: 'LOCK_LOST_OR_EXPIRED' });
      }
      
      // 1.1 Fencing Token Epoch 驗證
      const curEpoch = parseInt(await redis.get('prod:linebot:token_epoch') || '1', 10);
      const [reqEpochStr] = String(fencingToken || '0:0').split(':');
      const reqEpoch = parseInt(reqEpochStr || '0', 10);
      if (reqEpoch < curEpoch) {
        return res.status(403).json({ error: 'Forbidden', message: 'LOCK_LOST_OR_EXPIRED' });
      }

      // [自癒] 只要 Agent 還在正常 Poll，就自動將鎖延期 60 秒
      await redis.pexpire('prod:linebot:lock', 60000);
      
      // 2. 自動認領已超時之 Pending 訊息 (XAUTOCLAIM) - 60s
      const claimResult = await redis.xautoclaim(
        'prod:linebot:events',
        'agent_group',
        token,
        60000,
        '0-0',
        'COUNT',
        1
      );
      
      let messageToDeliver = null;
      let messageId = null;
      
      if (claimResult && claimResult[1] && claimResult[1].length > 0) {
        const item = claimResult[1][0];
        messageId = item[0];
        const fields = item[1];
        for (let i = 0; i < fields.length; i += 2) {
          if (fields[i] === 'payload') {
            messageToDeliver = JSON.parse(fields[i+1]);
            break;
          }
        }
        
        // 毒性訊息檢測
        if (messageId) {
          const retryCount = await redis.incr(`prod:linebot:retry:${messageId}`);
          if (retryCount > 5) {
            console.error(`[DLQ] Message ${messageId} reached retry limit, moving to dead letter stream`);
            await redis.xadd(
              'prod:linebot:dead_letter_stream',
              'MAXLEN', '~', 10000,
              '*',
              'payload', JSON.stringify(messageToDeliver),
              'reason', 'max_retries_exceeded',
              'messageId', messageId
            );
            await redis.xack('prod:linebot:events', 'agent_group', messageId);
            messageToDeliver = null;
            messageId = null;
          }
        }
      }
      
      // 3. 若無 Pending 訊息，讀取全新訊息
      if (!messageToDeliver) {
        const readResult = await redis.xreadgroup(
          'GROUP',
          'agent_group',
          token,
          'COUNT',
          1,
          'BLOCK',
          2000,
          'STREAMS',
          'prod:linebot:events',
          '>'
        );
        
        if (readResult && readResult.length > 0 && readResult[0][1] && readResult[0][1].length > 0) {
          const item = readResult[0][1][0];
          messageId = item[0];
          const fields = item[1];
          for (let i = 0; i < fields.length; i += 2) {
            if (fields[i] === 'payload') {
              messageToDeliver = JSON.parse(fields[i+1]);
              break;
            }
          }
        }
      }
      
      if (messageToDeliver && messageId) {
        const isFirstDispatch = await redis.set(`prod:linebot:dispatched:${messageId}`, '1', 'NX', 'EX', 600);
        if (!isFirstDispatch) {
          console.log(`[Idempotency] 訊息 ${messageId} 在 10 分鐘內已派發過。強制 XACK 避免無限迴圈。`);
          await redis.xack('prod:linebot:events', 'agent_group', messageId);
          messageToDeliver = null;
        }
      }

      if (messageToDeliver) {
        const epoch = await redis.get('prod:linebot:token_epoch') || '1';
        const nextSeq = await redis.incr('prod:linebot:session_token');
        const nextFencingToken = `${epoch}:${nextSeq}`;
        
        // [自癒] 偵測到有訊息需要處理，將鎖延期 5 分鐘 (300000ms)，確保 Agent 處理長任務期間鎖不會過期
        await redis.pexpire('prod:linebot:lock', 300000);
        
        return res.json({
          message: {
            ...messageToDeliver,
            messageId,
            fencingToken: nextFencingToken
          }
        });
      } else {
        return res.json({ message: null });
      }
    } catch (e) {
      console.error('[REDIS] inbox error:', e.message);
      return res.status(500).json({ error: 'Redis error', message: e.message });
    }
  } else {
    // Memory fallback
    const now = Date.now();
    const isActive = activeAgentToken === token && activeAgentLockExpiresAt >= now;
    if (!isActive) {
      return res.status(403).json({ error: 'Forbidden', message: 'LOCK_LOST_OR_EXPIRED' });
    }
    
    // Fencing Token Epoch 驗證
    const [reqEpochStr] = String(fencingToken || '0:0').split(':');
    const [curEpochStr] = String(activeAgentFencingToken || '1:0').split(':');
    if (parseInt(reqEpochStr, 10) < parseInt(curEpochStr, 10)) {
      return res.status(403).json({ error: 'Forbidden', message: 'LOCK_LOST_OR_EXPIRED' });
    }
    
    // [自癒] 只要 Agent 還在正常 Poll，就自動將鎖延期 60 秒
    activeAgentLockExpiresAt = now + 60000;
    saveState();
    
    const pendingMsg = messageQueue.find(m => !m.processing);
    if (pendingMsg) {
      pendingMsg.processing = true;
      pendingMsg.processingStartTime = Date.now();
      
      // [自癒] 偵測到有訊息需要處理，將鎖延期 5 分鐘 (300000ms)，確保 Agent 處理長任務期間鎖不會過期
      activeAgentLockExpiresAt = Date.now() + 300000;
      saveState();
      
      return res.json({ message: pendingMsg });
    }
    return res.json({ message: null });
  }
});

// ─── 訊息出站與簽章驗證 (Outbox HMAC Validation) ───────────────────────────────
app.post('/api/outbox', express.json(), async (req, res) => {
  const { userId, text, agentId, fencingToken, signature, timestamp, epoch, token, messageId, ticketId } = req.body;
  
  // 1. 時效性窗口比對 (±60秒)
  const MAX_SKEW = 60 * 1000;
  if (!timestamp || Math.abs(Date.now() - Number(timestamp)) > MAX_SKEW) {
    return res.status(403).json({ error: 'Forbidden', message: 'expired request - timestamp skew too large' });
  }

  // 2. HMAC-SHA256 簽章驗證 (相容雙密鑰並存)
  const currentOutboxSecret = process.env.CURRENT_OUTBOX_SECRET || 'default_outbox_secret';
  const nextOutboxSecret = process.env.NEXT_OUTBOX_SECRET || 'default_outbox_secret';
  
  const sign = (key) => crypto
    .createHmac("sha256", key)
    .update(`${messageId || ''}:${epoch || ''}:${token || ''}:${timestamp}`)
    .digest("hex");
    
  if (signature !== sign(currentOutboxSecret) && signature !== sign(nextOutboxSecret)) {
    return res.status(403).json({ error: 'Forbidden', message: 'invalid signature' });
  }

  // 2.1 防止 60 秒時間窗口內的簽章重複發送攻擊 (Replay Attack)
  if (useRedis) {
    try {
      const sigKey = `prod:linebot:sig:${signature}`;
      const sigExists = await redis.exists(sigKey);
      if (sigExists) {
        return res.status(403).json({ error: 'Forbidden', message: 'replay attack detected within window' });
      }
      await redis.set(sigKey, '1', 'EX', 60);
    } catch (e) {
      console.error('[REDIS] Signature cache check error:', e.message);
    }
  } else {
    // Memory fallback signature cache
    if (!global.memorySigCache) {
      global.memorySigCache = new Set();
    }
    if (global.memorySigCache.has(signature)) {
      return res.status(403).json({ error: 'Forbidden', message: 'replay attack detected within window' });
    }
    global.memorySigCache.add(signature);
    setTimeout(() => {
      if (global.memorySigCache) {
        global.memorySigCache.delete(signature);
      }
    }, 60000);
  }

  // 3. 死信重播工單強制關聯
  const isReplay = messageId && messageId.includes('dead');
  if (isReplay && !ticketId) {
    metrics.replay_without_ticket++;
    return res.status(400).json({ error: 'Bad Request', message: 'ticket required for DLQ replay' });
  }

  if (useRedis) {
    try {
      const currentOwner = await redis.get('prod:linebot:lock');
      if (currentOwner !== agentId) {
        return res.status(403).json({ error: 'Forbidden', message: 'LOCK_LOST_OR_EXPIRED' });
      }
      
      // Fencing Token Epoch 驗證
      const curEpoch = parseInt(await redis.get('prod:linebot:token_epoch') || '1', 10);
      const [reqEpochStr] = String(fencingToken || '0:0').split(':');
      const reqEpoch = parseInt(reqEpochStr || '0', 10);
      if (reqEpoch < curEpoch) {
        return res.status(403).json({ error: 'Forbidden', message: 'LOCK_LOST_OR_EXPIRED' });
      }

      // [自癒] 回覆成功後，將鎖的 TTL 重設為 60 秒
      await redis.pexpire('prod:linebot:lock', 60000);
      
      // ACK Stream 訊息並紀錄冪等過濾
      if (messageId && !isReplay) {
        await redis.xack('prod:linebot:events', 'agent_group', messageId);
        await redis.set(`prod:linebot:processed:${messageId}`, '1', 'EX', 86400);
      }
      
      if (isReplay && ticketId) {
        // 驗證工單狀態
        const ticket = await redis.hgetall(`prod:linebot:double_approval:${ticketId}`);
        if (!ticket || Object.keys(ticket).length === 0) {
          return res.status(400).json({ error: 'Bad Request', message: 'ticket not found' });
        }
        if (ticket.status !== 'approved') {
          return res.status(400).json({ error: 'Bad Request', message: 'ticket is not approved' });
        }

        // 寫入 Redis Audit Stream
        await redis.xadd(
          'prod:linebot:replay_audit',
          'MAXLEN', '~', 10000,
          '*',
          'ticket_id', ticketId,
          'message_id', messageId,
          'operator', agentId,
          'proposer', ticket.proposer,
          'approver', ticket.approver,
          'timestamp', Date.now().toString()
        );
        // 同步 GitHub Audit Repository
        await logToGitHubAudit(ticketId, messageId, agentId, text);
      }
    } catch (e) {
      console.error('[REDIS] outbox error:', e.message);
      return res.status(500).json({ error: 'Redis error', message: e.message });
    }
  } else {
    // Memory fallback
    const now = Date.now();
    const isActive = activeAgentToken === agentId && activeAgentLockExpiresAt >= now;
    if (!isActive) {
      return res.status(403).json({ error: 'Forbidden', message: 'LOCK_LOST_OR_EXPIRED' });
    }
    
    // Fencing Token Epoch 驗證
    const [reqEpochStr] = String(fencingToken || '0:0').split(':');
    const [curEpochStr] = String(activeAgentFencingToken || '1:0').split(':'); // 🛡️ 強制轉型防崩潰
    if (parseInt(reqEpochStr, 10) < parseInt(curEpochStr, 10)) {
      return res.status(403).json({ error: 'Forbidden', message: 'LOCK_LOST_OR_EXPIRED' });
    }

    // [自癒] 回覆成功後，將鎖的 TTL 重設為 60 秒
    activeAgentLockExpiresAt = now + 60000;
    
    const idx = messageQueue.findIndex(m => m.userId === userId && m.processing);
    if (idx !== -1) {
      messageQueue.splice(idx, 1);
    }
    saveState();
  }

  console.log(`[←LINE] 傳送回覆給 ${userId}: ${text.substring(0, 30)}...`);
  try {
    await pushToLine(userId, text);
    res.json({ success: true });
  } catch (err) {
    console.error(`[←LINE] 傳送失敗: ${err.message}`);
    res.status(500).json({ error: 'LINE_API_ERROR', message: err.message });
  }
});

// ─── 推播訊息與安撫模組 ─────────────────────────────────────────────────────────
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
    // Quota check
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

    const flexMessages = parseMarkdownToFlex(message);
    
    if (flexMessages && Array.isArray(flexMessages)) {
      await lineClient.pushMessage({
        to: targetId,
        messages: flexMessages,
      });
    } else {
      await lineClient.pushMessage({
        to: targetId,
        messages: [{ type: 'text', text: message }],
      });
    }
  } else {
    await lineClient.pushMessage({
      to: targetId,
      messages: [message],
    });
  }
}

// ─── 流量限制與死信超時判定 ─────────────────────────────────────────────────────
const LIMIT = 100; // 每分鐘 100 次最大限制

async function checkRateLimit(agentId) {
  if (!useRedis) return;
  const rateKey = `prod:linebot:rate:${agentId}:${Math.floor(Date.now() / 60000)}`;
  const count = await redis.incr(rateKey);
  if (count === 1) {
    await redis.pexpire(rateKey, 60000);
  }
  if (count > LIMIT) {
    console.warn(`[RATE_LIMIT] Agent ${agentId} exceeded ${LIMIT} req/min (count: ${count})`);
    throw new Error("rate limit exceeded");
  }
}

// 超時與安撫機制 (改由 /api/inbox 觸發)
async function checkTimeoutsAndAlert() {
  if (!useRedis) return;
  try {
    const pendingInfo = await redis.xpending('prod:linebot:events', 'agent_group');
    if (pendingInfo && pendingInfo[0] > 0) {
      const list = await redis.xpending('prod:linebot:events', 'agent_group', '0-0', '+', 10);
      for (const item of list) {
        const msgId = item[0];
        const elapsed = Date.now() - item[2]; 
        if (elapsed > 180000) { 
          console.log(`[UX-Redis] Message ${msgId} timed out, sending progress alert.`);
        }
      }
    }
  } catch (e) {
    console.error('[REDIS] Timeout check error:', e.message);
  }
}

// ─── 指令處理與 Webhook ──────────────────────────────────────────────────────
async function handleCommand(userId, sourceId, text, replyToken) {
  const cmd = text.trim().toLowerCase();

  if (cmd === '/status') {
    const activeLock = useRedis ? await redis.get('prod:linebot:lock') : activeAgentToken;
    const status = [
      `🟢 Bridge 伺服器：運作中 (Port ${PORT})`,
      `⚡ 傳輸模式：Redis Sentinel & Stream Cluster`,
      `🛡️ 狀態儲存：${useRedis ? 'Redis Sentinel (A++ Ready)' : '本地檔案/記憶體 (降級模式)'}`,
      `${activeLock ? '🔄' : '⚪'} 控制狀態：${activeLock ? `由 ${activeLock} 控制中` : '閒置'}`,
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
          '🤖 Antigravity LINE 光速橋接器 (V10.0 Final)：',
          '',
          '/status → 查看系統狀態',
          '/help → 顯示此說明'
        ].join('\n'),
      }],
    });
    return;
  }

  // 寫入佇列 (Stream)
  if (useRedis) {
    try {
      const traceId = crypto.randomUUID();
      const payload = {
        userId,
        sourceId,
        text,
        timestamp: Date.now(),
        traceId
      };
      
      const exists = await redis.exists(`prod:linebot:processed:${traceId}`);
      if (exists) return; // 冪等過濾
      
      await checkRateLimit(userId);

      await redis.xadd(
        'prod:linebot:events',
        'MAXLEN', '~', 10000,
        '*',
        'payload',
        JSON.stringify(payload)
      );
      console.log(`[Queue-Redis] 新訊息已寫入 Stream, TraceID: ${traceId}`);
    } catch (e) {
      console.error('[REDIS] xadd error:', e.message);
      try { await pushToLine(sourceId, `❌ 系統錯誤：無法寫入佇列。`); } catch {}
      return;
    }
  } else {
    // Memory fallback
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
  
  try {
    await lineClient.showLoadingAnimation({ chatId: sourceId, loadingSeconds: 60 });
  } catch (e) {}
}

app.post('/webhook', express.raw({type: 'application/json'}), line.middleware(lineConfig), (req, res) => {
  // 記憶體佇列 OOM 反壓保護
  if (!useRedis && messageQueue.length >= MAX_QUEUE_SIZE) {
    console.warn(`[OOM Backpressure] Queue full (${messageQueue.length}/${MAX_QUEUE_SIZE}). Returning 503.`);
    return res.status(503).end();
  }
  res.status(200).end();

  req.body.events.forEach(async (event) => {
    if (event.type !== 'message') return;

    const userId = event.source.userId;
    const sourceId = event.source.groupId || event.source.roomId || event.source.userId;
    const replyToken = event.replyToken;

    if (ALLOWED_USER_ID && userId !== ALLOWED_USER_ID) {
      console.warn(`[SECURITY] 拒絕未授權的使用者: ${userId}`);
      return;
    }

    if (event.message.type === 'text') {
      let text = twConverter(event.message.text);
      const isGroup = !!(event.source.groupId || event.source.roomId);

      if (isGroup) {
        const mentionees = event.message.mention?.mentionees || [];
        const isMentioned = BOT_USER_ID && mentionees.some(m => m.userId === BOT_USER_ID);
        if (!isMentioned) return;
        text = `[User: ${userId.substring(0,6)}] ` + text;
      }

      console.log(`[LINE→] 來自 ${userId}: ${text}`);
      try {
        await handleCommand(userId, sourceId, text, replyToken);
      } catch (e) {
        sanitizeErrorLog('[ERROR]', e);
      }
    } else if (event.message.type === 'image') {
      const messageId = event.message.id;
      
      // 資安加固：限制 messageId 只能是英數字，防範路徑穿透
      if (!/^[a-zA-Z0-9]+$/.test(messageId)) {
        console.warn(`[SECURITY WARNING] Invalid messageId character detected: ${messageId}`);
        return;
      }
      
      try {
        const publicDir = path.join(__dirname, 'public');
        if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
        const imagePath = path.join(publicDir, `image_${messageId}.jpg`);

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

        const text = `[IMAGE:${imagePath}]\n使用者傳送了圖片，請分析。`;
        await handleCommand(userId, sourceId, text, replyToken);
      } catch (e) {
        sanitizeErrorLog('[IMAGE ERROR]', e);
      }
    }
  });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('[SECURITY] Malformed JSON payload blocked:', err.message);
    return res.status(400).json({ error: 'Bad Request', message: 'Malformed JSON payload' });
  }
  if (err && err.name === 'SignatureValidationFailed') {
    return res.status(401).send('Invalid signature');
  }
  next(err);
});

// ─── 監控與運維指標曝露 (Prometheus Format) ──────────────────────────────────
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  let body = '';
  
  let changeFailureRate = 0.0;
  let incidentCount = 0;
  if (useRedis) {
    try {
      const failed = parseInt(await redis.get('change_failed_count') || '0', 10);
      const total = parseInt(await redis.get('change_total_count') || '0', 10);
      if (total > 0) {
        changeFailureRate = failed / total;
      }
      incidentCount = parseInt(await redis.get('incident_count') || '0', 10);
    } catch (e) {
      console.error('[REDIS] Metrics fetch error:', e.message);
    }
  }
  
  body += `# HELP lock_acquire_success_total Total successful lock acquisitions\n`;
  body += `# TYPE lock_acquire_success_total counter\n`;
  body += `lock_acquire_success_total ${metrics.lock_acquire_success_total}\n\n`;
  
  body += `# HELP lock_acquire_failure_total Total failed lock acquisitions\n`;
  body += `# TYPE lock_acquire_failure_total counter\n`;
  body += `lock_acquire_failure_total ${metrics.lock_acquire_failure_total}\n\n`;
  
  body += `# HELP lock_heartbeat_failure_total Total failed lock heartbeats\n`;
  body += `# TYPE lock_heartbeat_failure_total counter\n`;
  body += `lock_heartbeat_failure_total ${metrics.lock_heartbeat_failure_total}\n\n`;
  
  body += `# HELP redis_lock_renew_failure Total atomic renew lock failures\n`;
  body += `# TYPE redis_lock_renew_failure counter\n`;
  body += `redis_lock_renew_failure ${metrics.redis_lock_renew_failure}\n\n`;

  body += `# HELP replay_without_ticket Total dead letter replay attempts without ticket\n`;
  body += `# TYPE replay_without_ticket counter\n`;
  body += `replay_without_ticket ${metrics.replay_without_ticket}\n\n`;
  
  body += `# HELP change_failure_rate Rate of production changes that failed\n`;
  body += `# TYPE change_failure_rate gauge\n`;
  body += `change_failure_rate ${changeFailureRate.toFixed(4)}\n\n`;
  
  body += `# HELP incident_count Number of incidents recorded\n`;
  body += `# TYPE incident_count counter\n`;
  body += `incident_count ${incidentCount}\n\n`;
  
  body += `# HELP active_workers Number of active workers\n`;
  body += `# TYPE active_workers gauge\n`;
  body += `active_workers ${metrics_gauges.active_workers}\n\n`;
  
  res.send(body);
});

// ─── 混沌工程故障注入 (僅限內部授權) ──────────────────────────────────────────
app.post('/api/chaos/inject', express.json(), async (req, res) => {
  const { action } = req.body;
  const gatewayToken = req.headers['x-internal-secret'];
  
  const expectedToken = process.env.INTERNAL_GATEWAY_TOKEN || 'default_gateway_token';
  if (gatewayToken !== expectedToken) {
    return res.status(403).json({ error: 'Forbidden', message: 'Unauthorized chaos injection' });
  }
  
  console.log(`[CHAOS] Injected failure action: ${action}`);
  
  if (action === 'redis_latency') {
    if (useRedis) {
      try {
        await redis.eval("local i=0; while i<50000000 do i=i+1 end return 1", 0);
      } catch(e){}
    }
  } else if (action === 'abort_bridge') {
    console.error('[CHAOS] Aborting bridge server process...');
    setTimeout(() => process.exit(1), 100);
  }
  
  res.json({ success: true, injected: action });
});

// ─── V10.0 Node.js 原生接管: Pinggy SSH 永動機 (免彈窗 / 免寫檔) ───────────
let sshProcess = null;

function startPinggyDaemon() {
  console.log('[Auto-Heal] 啟動底層 SSH Pinggy 通道...');
  
  // 注入 windowsHide: true，沒收 Windows Terminal 的彈窗權限
  sshProcess = spawn('ssh', [
    '-p', '443', 
    '-R0:localhost:3000', 
    '-o', 'StrictHostKeyChecking=no', 
    '-o', 'ServerAliveInterval=30', 
    'a.pinggy.io'
  ], { 
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'] 
  });

  const handleOutput = async (data) => {
    const output = data.toString();
    const matches = output.match(/https:\/\/[a-z0-9.-]+\.(?:trycloudflare\.com|cloudflare\.com|free\.pinggy\.link|pinggy\.io|pinggy\.net|pinggy-free\.link)/g);
    
    if (matches && matches.length > 0) {
      const latestTunnelUrl = matches[matches.length - 1];
      const newWebhookEndpoint = `${latestTunnelUrl}/webhook`;
      
      try {
        const res = await axios.get('https://api.line.me/v2/bot/channel/webhook/endpoint', {
          headers: { 'Authorization': `Bearer ${lineConfig.channelAccessToken}` }
        });

        if (res.data.endpoint !== newWebhookEndpoint) {
          await axios.put('https://api.line.me/v2/bot/channel/webhook/endpoint', {
            endpoint: newWebhookEndpoint
          }, {
            headers: {
              'Authorization': `Bearer ${lineConfig.channelAccessToken}`,
              'Content-Type': 'application/json'
            }
          });
          console.log('[Auto-Heal] 記憶體攔截成功！LINE Webhook 已無縫更新至:', newWebhookEndpoint);
        }
      } catch (e) {
        sanitizeErrorLog('[Auto-Heal] Webhook 更新失敗', e);
      }
    }
  };

  sshProcess.stdout.on('data', handleOutput);
  sshProcess.stderr.on('data', handleOutput);

  sshProcess.on('close', (code) => {
    // 🛡️ [編碼/自癒 追加] 改為純英文防 Windows Console 亂碼，延遲改為 5 秒防止 Rate Limit
    console.warn(`[Auto-Heal] Pinggy SSH connection lost (Code ${code}). Entering auto-heal mode, restarting in 5 seconds...`);
    sshProcess = null;
    setTimeout(startPinggyDaemon, 5000);
  });
  
  sshProcess.on('error', (err) => {
    console.error(`[Auto-Heal] Pinggy 進程發生致命錯誤:`, err);
  });
}

// 服務啟動時點火
startPinggyDaemon();

// ─── 進程連坐法 (完整版 V10.1) ───────────────────────────────────────────────
// 確保 Bridge 在任何情況下關閉時，SSH Pinggy 也必定死亡 (不殘留殭屍進程)
// 涵蓋三種終止情境：正常退出、Ctrl+C、系統終止信號
function cleanupAndExit(signal) {
  console.log(`\n[連坐法] 接收到 ${signal} 信號，正在執行清理...`);
  if (sshProcess) {
    const proc = sshProcess;  // 保存引用，避免被 on('close') 的 null 覆蓋
    sshProcess = null;        // 阻止 on('close') callback 觸發 startPinggyDaemon 重啟
    proc.kill('SIGTERM');
    setTimeout(() => {
      try { proc.kill('SIGKILL'); } catch(e) {}
    }, 2000);
    console.log('[連坐法] SSH Pinggy 進程已終止。');
  }
  setTimeout(() => process.exit(0), 2500);
}

process.on('exit',   () => { if (sshProcess) { sshProcess.kill(); } });
process.on('SIGINT',  () => cleanupAndExit('SIGINT'));   // Ctrl+C 中斷
process.on('SIGTERM', () => cleanupAndExit('SIGTERM'));  // 系統終止信號

// ─── 啟動 Express 伺服器 ───────────────────────────────────────────────────────
const http = require('http');
const server = http.createServer(app);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[FATAL ERROR] Port ${PORT} is already in use by another process. Exiting gracefully.`);
    process.exit(1);
  } else {
    console.error('[SERVER ERROR]', err.message);
  }
});

server.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Antigravity LINE Bridge v10.0 Final 已啟動         ║');
  console.log('╚════════════════════════════════════════════════════════╝');
});
