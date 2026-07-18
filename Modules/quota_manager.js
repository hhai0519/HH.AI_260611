/**
 * quota_manager.js
 * ─────────────────────────────────────────────────────────────────────────────
 * 本協作系統 V3.1.3 — Neon PostgreSQL 配額管理核心模組
 * 落地路徑：Modules/quota_manager.js（零散落原則）
 *
 * 功能：
 *   1. 透過 DATABASE_URL 環境變數連線 Neon DB，使用 Connection Pool 管理連線。
 *   2. 自動初始化 session_quota_state 與 agent_quota_log 資料表。
 *   3. check_and_consume_quota() 使用 DB Transaction 與原子性 UPDATE，
 *      確保在多 Agent 併發下精準執行 10% 熔斷判斷（Race Condition 零風險）。
 *
 * 依賴：npm install pg dotenv
 * 環境：.env.local 中必須設定 DATABASE_URL=postgresql://...
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const { Pool } = require('pg');
const path = require('path');

// ── 環境變數載入（優先讀取 .env.local）────────────────────────────────────────
require('dotenv').config({
  path: path.resolve(process.cwd(), '.env.local'),
});

if (!process.env.DATABASE_URL) {
  throw new Error(
    '[quota_manager] 致命錯誤：找不到 DATABASE_URL 環境變數。' +
    '請確認 .env.local 已正確設定 Neon DB 連線字串。'
  );
}

// ── Connection Pool 初始化 ─────────────────────────────────────────────────────
// [MED-03] 統一引用 db_state_manager 的共享連線池，避免連線數超限
const { pool, isPlaceholderDb } = require('./db_state_manager');

pool.on('error', (err) => {
  console.error('[quota_manager] Pool 非預期錯誤：', err.message);
});

// ── 資料表初始化 ───────────────────────────────────────────────────────────────
/**
 * initTables()
 * 若資料表不存在則自動建立，確保首次部署無需手動執行 DDL。
 */
async function initTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS session_quota_state (
        session_id   TEXT        PRIMARY KEY,
        used_pct     NUMERIC(6, 3) NOT NULL DEFAULT 0,   -- 單位：百分比 (0~100)
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS agent_quota_log (
        log_id       BIGSERIAL   PRIMARY KEY,
        session_id   TEXT        NOT NULL,
        agent_id     TEXT        NOT NULL,
        cost_pct     NUMERIC(6, 3) NOT NULL,             -- 本次呼叫消耗百分比
        used_after   NUMERIC(6, 3) NOT NULL,             -- 扣除後累計值
        status       TEXT        NOT NULL,               -- 'OK' | 'QUOTA_EXCEEDED'
        logged_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    if (process.env.DEBUG === 'true') console.log('[quota_manager] 資料表初始化完成（session_quota_state, agent_quota_log）');
  } finally {
    client.release(); // 嚴格釋放連線，避免 Pool 洩漏
  }
}

// ── 核心方法：原子性配額檢查與消耗 ────────────────────────────────────────────
/**
 * check_and_consume_quota(sessionId, agentId, costPct)
 *
 * 使用 DB Transaction + 行級鎖（SELECT ... FOR UPDATE）確保在高併發下：
 *   1. 讀取當前累計消耗（避免 Dirty Read）
 *   2. 判斷加總後是否超過 10% 熔斷警戒線
 *   3. 若未超標：原子性寫入新消耗值，記錄軌跡日誌
 *   4. 若超標：ROLLBACK，拋出 QUOTA_EXCEEDED 錯誤，強制觸發任務暫停
 *
 * @param {string} sessionId  - 當前 Session 唯一識別碼
 * @param {string} agentId    - 呼叫的 Agent 識別碼（用於稽核追蹤）
 * @param {number} costPct    - 本次操作消耗的配額百分比（例如 5 代表 5%）
 * @returns {Promise<{ usedAfter: number, status: 'OK' }>}
 * @throws  {Error}           - 錯誤碼 'QUOTA_EXCEEDED' 或 DB 連線錯誤
 */
async function check_and_consume_quota(sessionId, agentId, costPct) {
  const QUOTA_LIMIT = 10; // 10% 熔斷警戒線（SOP §2.2 鐵律）

  // 🛡️ [SRE 降級防護] 若資料庫為佔位符，自動啟用降級放行模式，防止 null.connect() 崩潰
  if (isPlaceholderDb() || !pool) {
    if (process.env.DEBUG === 'true') {
      console.log(
        `[quota_manager] [Fallback Mode] Session "${sessionId}" | Agent: "${agentId}" | 消耗: ${costPct}%`
      );
    }
    return { usedAfter: 0, status: 'OK' };
  }

  const client = await pool.connect();

  try {
    // ── BEGIN Transaction ──────────────────────────────────────────────────────
    await client.query('BEGIN');

    // Step 1：UPSERT Session 狀態行，並取得行級鎖（FOR UPDATE 防止併發衝突）
    const upsertResult = await client.query(
      `INSERT INTO session_quota_state (session_id, used_pct)
       VALUES ($1, 0)
       ON CONFLICT (session_id) DO UPDATE
         SET session_id = EXCLUDED.session_id  -- 觸發 RETURNING 而不改變值
       RETURNING used_pct`,
      [sessionId]
    );

    // Step 2：取得行級鎖，重新讀取最新值（防止 UPSERT 後的 Phantom Read）
    const lockResult = await client.query(
      `SELECT used_pct FROM session_quota_state
       WHERE session_id = $1
       FOR UPDATE`,
      [sessionId]
    );

    const currentUsed = parseFloat(lockResult.rows[0].used_pct);
    const projectedUsed = currentUsed + costPct;

    // Step 3：熔斷判斷
    if (projectedUsed > QUOTA_LIMIT) {
      // 記錄超標日誌（ROLLBACK 前先寫入，用獨立連線避免被 ROLLBACK 抹除）
      await client.query('ROLLBACK');

      // 使用 Pool 直接查詢（不在 Transaction 中），確保日誌持久化
      await pool.query(
        `INSERT INTO agent_quota_log
           (session_id, agent_id, cost_pct, used_after, status)
         VALUES ($1, $2, $3, $4, 'QUOTA_EXCEEDED')`,
        [sessionId, agentId, costPct, currentUsed]
      );

      const err = new Error(
        `[quota_manager] QUOTA_EXCEEDED — Session "${sessionId}" 配額超標！` +
        ` 當前已用：${currentUsed.toFixed(2)}%，` +
        ` 本次請求：${costPct}%，` +
        ` 上限：${QUOTA_LIMIT}%。強制觸發任務暫停。`
      );
      err.code = 'QUOTA_EXCEEDED';
      err.sessionId = sessionId;
      err.agentId = agentId;
      err.currentUsed = currentUsed;
      err.costPct = costPct;
      throw err;
    }

    // Step 4：原子性更新累計消耗（UPDATE ... RETURNING 確保寫入值即時回傳）
    const updateResult = await client.query(
      `UPDATE session_quota_state
       SET used_pct   = used_pct + $1,
           updated_at = NOW()
       WHERE session_id = $2
       RETURNING used_pct`,
      [costPct, sessionId]
    );

    const usedAfter = parseFloat(updateResult.rows[0].used_pct);

    // Step 5：寫入呼叫軌跡日誌
    await client.query(
      `INSERT INTO agent_quota_log
         (session_id, agent_id, cost_pct, used_after, status)
       VALUES ($1, $2, $3, $4, 'OK')`,
      [sessionId, agentId, costPct, usedAfter]
    );

    // ── COMMIT Transaction ─────────────────────────────────────────────────────
    await client.query('COMMIT');

    if (process.env.DEBUG === 'true') {
      console.log(
        `[quota_manager] ✅ OK — Session: ${sessionId} | Agent: ${agentId} ` +
        `| 消耗: ${costPct}% | 累計: ${usedAfter.toFixed(2)}%`
      );
    }

    return { usedAfter, status: 'OK' };

  } catch (err) {
    // 若非 QUOTA_EXCEEDED（即 DB 錯誤），執行 ROLLBACK 防止資料污染
    if (err.code !== 'QUOTA_EXCEEDED') {
      try { await client.query('ROLLBACK'); } catch (_) {}
      console.error('[quota_manager] DB 錯誤，已 ROLLBACK：', err.message);
    }
    throw err;
  } finally {
    client.release(); // 無論如何必須釋放連線
  }
}

// ── 查詢 Session 當前消耗（唯讀，無需 Transaction） ───────────────────────────
/**
 * getSessionUsage(sessionId)
 * @param {string} sessionId
 * @returns {Promise<{ usedPct: number, updatedAt: Date } | null>}
 */
async function getSessionUsage(sessionId) {
  const result = await pool.query(
    `SELECT used_pct, updated_at
     FROM session_quota_state
     WHERE session_id = $1`,
    [sessionId]
  );
  if (result.rows.length === 0) return null;
  return {
    usedPct: parseFloat(result.rows[0].used_pct),
    updatedAt: result.rows[0].updated_at,
  };
}

// ── 優雅關閉（供程序結束時呼叫） ──────────────────────────────────────────────
async function shutdown() {
  await pool.end();
  if (process.env.DEBUG === 'true') console.log('[quota_manager] Connection Pool 已關閉。');
}

// ── 模組導出 ───────────────────────────────────────────────────────────────────
module.exports = {
  initTables,
  check_and_consume_quota,
  getSessionUsage,
  shutdown,
};
