/**
 * db_state_manager.js
 * ─────────────────────────────────────────────────────────────────────────────
 * 本協作系統 V3.2.0 — 核心狀態管理器 (Core State Manager)
 * 落地路徑：Modules/db_state_manager.js
 *
 * 功能：
 *   1. 連線池建立與 SIGTERM/SIGINT 優雅關閉
 *   2. 冪等性資料表初始化（CREATE TABLE IF NOT EXISTS）
 *   3. 絕對原子性分散式鎖（INSERT ON CONFLICT + 抖動退避重試）
 *   4. 鎖心跳續命機制（startLockHeartbeat / stopHeartbeat 解耦）
 *   5. Pending Optimization 寫入 API（供 SOP_00 Watchdog 呼叫）
 *
 * 依賴：npm install pg
 * 環境：.env.local 中必須設定 DATABASE_URL=postgresql://...
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const { Pool } = require('pg');
const path     = require('path');

// ── 環境變數載入 ───────────────────────────────────────────────────────────────
require('dotenv').config({
  path: path.resolve(__dirname, '..', '.env.local'),
});

if (!process.env.DATABASE_URL) {
  throw new Error(
    '[db_state_manager] 致命錯誤：找不到 DATABASE_URL 環境變數。' +
    '請確認 .env.local 已正確設定 Neon DB 連線字串。'
  );
}

// ── 1. 連線池建立 ──────────────────────────────────────────────────────────────
// 採用連線字串參數方式設定 SSL，避免 pg 套件因 ssl 物件觸發 SSL 模式相容性警告。
// uselibpqcompat=true 強制使用 libpq 相容模式，sslmode=require 確保加密連線。
const dbUrl = new URL(process.env.DATABASE_URL);
dbUrl.searchParams.set('sslmode', 'require');
dbUrl.searchParams.set('uselibpqcompat', 'true');
const _connString = dbUrl.toString();

const pool = new Pool({
  connectionString: _connString,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  if (process.env.DEBUG === 'true') console.error('[db_state_manager] Pool 非預期錯誤：', err.message);
});

// ── 優雅關閉（攔截系統訊號） ───────────────────────────────────────────────────
const gracefulShutdown = async () => {
  if (process.env.DEBUG === 'true') console.log('[db_state_manager] 系統中斷訊號觸發，正在優雅關閉資料庫連線池...');
  await pool.end();
  if (process.env.DEBUG === 'true') console.log('[db_state_manager] 資料庫連線池已關閉。');
  process.exit(0);
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT',  gracefulShutdown);

// ── 輔助：暫停 ────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ══════════════════════════════════════════════════════════════════════════════
// § 2  冪等性資料表初始化
// ══════════════════════════════════════════════════════════════════════════════

/**
 * initDB()
 * 建立所有系統所需資料表（若已存在則跳過），確保多次呼叫冪等安全。
 * 涵蓋：watchdog_pending_optimizations、agent_distributed_locks
 */
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      -- 異常優化待辦佇列（取代 Pending_Optimization.json）
      CREATE TABLE IF NOT EXISTS watchdog_pending_optimizations (
        id                SERIAL        PRIMARY KEY,
        task_data         JSONB         NOT NULL,
        status            VARCHAR(20)   NOT NULL DEFAULT 'PENDING',   -- PENDING | RESOLVED | FAILED
        priority          VARCHAR(20)   NOT NULL DEFAULT 'MEDIUM',    -- LOW | MEDIUM | HIGH | CRITICAL
        retry_count       INT           NOT NULL DEFAULT 0,
        last_attempted_at TIMESTAMPTZ,
        created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );

      -- Agent 分散式鎖資料表
      CREATE TABLE IF NOT EXISTS agent_distributed_locks (
        resource_id  VARCHAR(255)  PRIMARY KEY,
        locked_by    VARCHAR(255)  NOT NULL,
        locked_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        expires_at   TIMESTAMPTZ   NOT NULL
      );
    `);
    if (process.env.DEBUG === 'true') console.log('[db_state_manager] 資料庫狀態管理器初始化完成（冪等性確保）。');
  } finally {
    client.release();
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// § 3 & 4  絕對原子性分散式鎖 + 抖動退避重試
// ══════════════════════════════════════════════════════════════════════════════

/**
 * acquireAgentLock(resourceId, agentId, ttlSeconds)
 *
 * 使用 INSERT ON CONFLICT DO UPDATE WHERE expires_at < NOW() 實現原子性鎖定：
 *   - 若鎖不存在或已過期 → INSERT/UPDATE 成功 → RETURNING 回傳 → 取鎖成功
 *   - 若鎖存在且未過期  → WHERE 條件不符 → UPDATE 跳過 → rowCount = 0 → 取鎖失敗
 *
 * 遭遇 23505（Unique Violation）或取鎖失敗時，採用
 * 「指數退避 + 隨機 Jitter」策略重試，防止驚群效應。
 *
 * @param {string} resourceId  - 被鎖定的共享資源識別碼
 * @param {string} agentId     - 申請鎖的 Agent 識別碼
 * @param {number} ttlSeconds  - 鎖存活時間（秒，預設 60）
 * @returns {Promise<boolean>} - true = 取鎖成功，false = 鎖被佔用
 */
async function acquireAgentLock(resourceId, agentId, ttlSeconds = 60) {
  const maxRetries  = 5;
  const baseDelayMs = 200;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const query = `
        INSERT INTO agent_distributed_locks (resource_id, locked_by, expires_at)
        VALUES ($1, $2, NOW() + ($3 || ' seconds')::INTERVAL)
        ON CONFLICT (resource_id) DO UPDATE
          SET locked_by  = EXCLUDED.locked_by,
              locked_at  = NOW(),
              expires_at = EXCLUDED.expires_at
          WHERE agent_distributed_locks.expires_at < NOW()
        RETURNING resource_id;
      `;
      const res = await pool.query(query, [resourceId, agentId, ttlSeconds]);

      if (res.rowCount > 0) {
        if (process.env.DEBUG === 'true') console.log(`[db_state_manager] 🔒 分散式鎖已取得：${resourceId} (by ${agentId})`);
        return true;  // 取鎖成功
      }

      // rowCount = 0：鎖被佔用且未過期，不重試直接返回
      if (process.env.DEBUG === 'true') console.warn(`[db_state_manager] ⚠️ 鎖 "${resourceId}" 被佔用且未過期，放棄取鎖。`);
      return false;

    } catch (err) {
      // 23505 Unique Violation：極少數情況下的併發衝突，加抖動退避重試
      if (err.code === '23505' && attempt < maxRetries) {
        const jitter = Math.random() * 100;
        const delay  = baseDelayMs * Math.pow(2, attempt) + jitter;
        if (process.env.DEBUG === 'true') {
          console.warn(
            `[db_state_manager] [併發衝突] 取鎖 "${resourceId}" 失敗，` +
            `${delay.toFixed(0)}ms 後進行第 ${attempt}/${maxRetries} 次重試...`
          );
        }
        await sleep(delay);
      } else {
        console.error('[db_state_manager] 取分散式鎖達最大重試次數，宣告失敗：', err.message);
        throw err;
      }
    }
  }

  return false;
}

/**
 * releaseAgentLock(resourceId, agentId)
 * 明確釋放鎖（非等待 TTL 過期），確保資源盡快可用。
 */
async function releaseAgentLock(resourceId, agentId) {
  await pool.query(
    `DELETE FROM agent_distributed_locks
     WHERE resource_id = $1 AND locked_by = $2`,
    [resourceId, agentId]
  );
  if (process.env.DEBUG === 'true') console.log(`[db_state_manager] 🔓 分散式鎖已釋放：${resourceId} (by ${agentId})`);
}

/**
 * renewAgentLock(resourceId, agentId, ttlSeconds)
 * 心跳續命：延長鎖的 expires_at，防止長期任務鎖自動過期。
 */
async function renewAgentLock(resourceId, agentId, ttlSeconds = 60) {
  await pool.query(
    `UPDATE agent_distributed_locks
     SET expires_at = NOW() + ($1 || ' seconds')::INTERVAL
     WHERE resource_id = $2 AND locked_by = $3`,
    [ttlSeconds, resourceId, agentId]
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// § 5  心跳續命機制（與業務邏輯解耦）
// ══════════════════════════════════════════════════════════════════════════════

/**
 * startLockHeartbeat(resourceId, agentId, ttlSeconds)
 *
 * 在背景每 30 秒自動呼叫 renewAgentLock，防止長期任務（如深度研究、模型編譯）
 * 因 TTL 到期而被其他 Agent 搶鎖。
 *
 * @returns {Function} stopHeartbeat — 任務結束時必須呼叫，終止心跳 interval
 */
function startLockHeartbeat(resourceId, agentId, ttlSeconds = 60) {
  const HEARTBEAT_INTERVAL_MS = 30_000; // 每 30 秒續命一次

  const intervalId = setInterval(async () => {
    try {
      await renewAgentLock(resourceId, agentId, ttlSeconds);
      if (process.env.DEBUG === 'true') {
        console.log(
          `[db_state_manager] 💓 心跳續命成功：${resourceId} (by ${agentId}) ` +
          `→ 延長至 ${ttlSeconds}s 後過期`
        );
      }
    } catch (err) {
      console.error(
        `[db_state_manager] [Heartbeat Error] Agent "${agentId}" 對鎖 "${resourceId}" 續命失敗：`,
        err.message
      );
    }
  }, HEARTBEAT_INTERVAL_MS);

  // 返回停止函式，供 Agent 在任務結束時呼叫
  return function stopHeartbeat() {
    clearInterval(intervalId);
    if (process.env.DEBUG === 'true') console.log(`[db_state_manager] 💔 心跳已停止：${resourceId} (by ${agentId})`);
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// § 6  Pending Optimization 寫入 API（供 SOP_00 Watchdog Hook 呼叫）
// ══════════════════════════════════════════════════════════════════════════════

/**
 * writePendingOptimization(taskData, priority)
 *
 * 取代本地 Pending_Optimization.json 的 append 操作。
 * Watchdog 偵測到異常後，直接呼叫此方法寫入 Neon DB，
 * 由資料庫行級鎖保障並發寫入安全，無需額外檔案鎖。
 *
 * @param {Object} taskData  - 標準化異常物件（遵循 SOP_00 §5 規範）
 * @param {string} priority  - 優先級：'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
 */
async function writePendingOptimization(taskData, priority = 'MEDIUM') {
  await pool.query(
    `INSERT INTO watchdog_pending_optimizations (task_data, priority)
     VALUES ($1, $2)`,
    [JSON.stringify(taskData), priority]
  );
  if (process.env.DEBUG === 'true') console.log(`[db_state_manager] 📝 異常已寫入 DB 佇列（priority: ${priority}）`);
}

// ── 模組導出 ───────────────────────────────────────────────────────────────────
module.exports = {
  pool,
  initDB,
  acquireAgentLock,
  releaseAgentLock,
  renewAgentLock,
  startLockHeartbeat,
  writePendingOptimization,
};
