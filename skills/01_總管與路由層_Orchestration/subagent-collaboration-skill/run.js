'use strict';

const path = require('path');
const { spawnSync } = require('child_process');
const db = require('../../../Modules/db_state_manager.js');

// [SECURITY] Application-layer payload size limit.
// Guards Stream/HTTP/IPC input paths where OS argv limits do not apply.
const MAX_PAYLOAD_LENGTH = 100_000; // 100 KB — enough for any legitimate JSON

async function getAgentOutput() {
  const args = process.argv.slice(2).join(' ');
  if (args.trim().length > 0) return args;
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    setTimeout(() => resolve(data), 1000);
  });
}

function purifyPayload(targetSkill, payload) {
  const cleanPayload = { ...payload };
  
  // [SOP_02 Section 1.3] Strip common sensitive keys
  const SENSITIVE_KEYS = ['password', 'secret', 'token', 'apikey', 'api_key', 'authorization', 'private_key'];
  Object.keys(cleanPayload).forEach(key => {
    if (SENSITIVE_KEYS.some(sk => key.toLowerCase().includes(sk))) {
      delete cleanPayload[key];
    }
  });

  if (targetSkill.includes('04_大腦認知分析層_Cognitive')) {
    delete cleanPayload.sql_query;
    delete cleanPayload.dom_selector;
    delete cleanPayload.api_endpoint;
    delete cleanPayload.css_selector;
    delete cleanPayload.bash_command;
  } else if (targetSkill.includes('05_自動化業務行動層_Actions')) {
    delete cleanPayload.tone;
    delete cleanPayload.role;
    delete cleanPayload.persona;
    delete cleanPayload.style;
    delete cleanPayload.emotion;
  }
  return cleanPayload;
}

async function main() {
  let stopHeartbeat = null;
  const agentId = 'subagent-collaboration-skill';
  let targetSkill = 'UNKNOWN';
  let inputPayload = {};

  try {
    const rawOutput = await getAgentOutput();
    if (!rawOutput || rawOutput.trim() === '') throw new Error("Empty input received.");

    // [SECURITY] Payload size circuit-breaker: reject oversized inputs before any processing.
    if (rawOutput.length > MAX_PAYLOAD_LENGTH)
      throw new Error(`Payload size exceeded limits (${rawOutput.length} > ${MAX_PAYLOAD_LENGTH} chars).`);

    // [SECURITY] Sanitize control characters before any parsing.
    // Removes: Null Byte (\x00), non-printable ASCII controls (\x01-\x08, \x0B-\x0C, \x0E-\x1F, \x7F)
    // Preserves: \t (\x09), \n (\x0A), \r (\x0D) for legitimate whitespace in payloads.
    const sanitizedOutput = rawOutput.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    const systemCallRegex = /\[SYSTEM-CALL:\s*(.+?)\s*\|\s*PAYLOAD:\s*(\{.*?\})\s*\]/i;
    const match = sanitizedOutput.match(systemCallRegex);
    if (!match) throw new Error("Invalid format. Expected [SYSTEM-CALL: <target> | PAYLOAD: <json>]");

    targetSkill = match[1].trim();
    const payloadStr = match[2].trim();

    try { inputPayload = JSON.parse(payloadStr); } 
    catch (e) { throw new Error(`JSON parsing failed for PAYLOAD: ${e.message}`); }

    const lockAcquired = await db.acquireAgentLock(targetSkill, agentId, 60);
    if (!lockAcquired) throw new Error(`Lock acquisition failed or timed out for target: ${targetSkill}`);

    stopHeartbeat = db.startLockHeartbeat(targetSkill, agentId, 60);
    const purifiedPayload = purifyPayload(targetSkill, inputPayload);
    const targetScriptPath = path.resolve(__dirname, '../../', targetSkill, 'run.js');
    
    const child = spawnSync('node', [targetScriptPath, JSON.stringify(purifiedPayload)], {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 300000
    });

    if (child.error) throw new Error(`Child process failed to start: ${child.error.message}`);
    if (child.status !== 0) throw new Error(`Target skill exited with status ${child.status}. stderr: ${child.stderr}`);

    console.log(child.stdout.trim());

  } catch (error) {
    const errorData = {
      source: agentId,
      target: targetSkill,
      payload_snapshot: inputPayload,
      error_message: error.message,
      timestamp: new Date().toISOString()
    };
    try { await db.writePendingOptimization(errorData, 'CRITICAL'); } 
    catch (dbError) { console.error("[CRITICAL DB ERROR] Failed to write to pending optimizations:", dbError.message); }
    console.log(`[SYSTEM-RETURN: FAILED | REASON: ${error.message}]`);

  } finally {
    if (stopHeartbeat) stopHeartbeat();
    if (targetSkill !== 'UNKNOWN') {
      try { await db.releaseAgentLock(targetSkill, agentId); } 
      catch (e) { console.error(`[db_state_manager] Failed to release lock for ${targetSkill}:`, e.message); }
    }
    try { await db.pool.end(); } catch (e) {}
  }
}

main();