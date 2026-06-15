'use strict';
const { spawnSync } = require('child_process');
const path = require('path');

const ROUTER_PATH = path.resolve(__dirname, 'skills/01_Orchestrators/subagent-collaboration-skill/run.js');

console.log("☣️ [Red Team] 啟動 V3.2.0 混沌轟炸機 V2 (深度滲透 - stdin 串流版)...");
console.log("🎯 目標: 實體路由引擎 | 總彈藥: 50 發\n");

const payloads = [];

// 1. 路徑穿越與指令注入 (Path Traversal & Injection) - 10發
const traversal = [
  '../../Modules/db_state_manager',
  '../../../Windows/System32/cmd',
  '02_Cognitive/..%2f..%2f',
  '02_Cognitive/\\0', 
  '02_COGNITIVE/case_test', 
  '03_Execution/skill.js', 
  '/absolute/path/test',
  'C:\\Windows\\System32',
  '02_Cognitive/skill; rm -rf /',
  '03_Execution/skill&ping 127.0.0.1'
];
traversal.forEach(t => payloads.push(`[SYSTEM-CALL: ${t} | PAYLOAD: {}]`));

// 2. 正則逃逸與全面偽裝 (Regex Evasion & Inception) - 10發
payloads.push(`[SYSTEM-CALL: 02_Cognitive/t1 | PAYLOAD: {"text": "]"}]`);
payloads.push(`[SYSTEM-CALL: 02_Cognitive/t2 | PAYLOAD: {"text": "|"}]`);
payloads.push(`[SYSTEM-CALL: 02_Cognitive/t3 | PAYLOAD: {"nested": "[SYSTEM-CALL: 03_Execution/fake | PAYLOAD: {}]"}]`);
payloads.push(`[system-call:02_Cognitive/t4|payload:{}]`);
payloads.push(`[SYSTEM-CALL:\n02_Cognitive/t5\n|\nPAYLOAD:\n{}]`);
payloads.push(`[SYSTEM-CALL: 02_Cognitive/t6 | PAYLOAD: {"emoji": "😈\r\n😈"}]`);
payloads.push(`[SYSTEM-CALL: 02_Cognitive/t7 | PAYLOAD: {"a": 1} ] trailing_trash`);
payloads.push(`leading_trash [SYSTEM-CALL: 02_Cognitive/t8 | PAYLOAD: {"a": 1}]`);
payloads.push(`[SYSTEM-CALL: 02_Cognitive/t9 | PAYLOAD: {"a": "[", "b": "]"}]`);
payloads.push(`[SYSTEM-CALL: 02_Cognitive/t10 | PAYLOAD: { \t \v \f }]`);

// 3. 原型鏈污染與型別欺騙 (Prototype Pollution & Type Juggling) - 10發
payloads.push(`[SYSTEM-CALL: 02_Cognitive/type1 | PAYLOAD: {"__proto__": {"admin": true}}]`);
payloads.push(`[SYSTEM-CALL: 02_Cognitive/type2 | PAYLOAD: {"constructor": {"prototype": {"hacked": 1}}}]`);
payloads.push(`[SYSTEM-CALL: 02_Cognitive/type3 | PAYLOAD: "I am a string"]`); 
payloads.push(`[SYSTEM-CALL: 02_Cognitive/type4 | PAYLOAD: [1, 2, 3]]`); 
payloads.push(`[SYSTEM-CALL: 02_Cognitive/type5 | PAYLOAD: null]`);
payloads.push(`[SYSTEM-CALL: 02_Cognitive/type6 | PAYLOAD: true]`);
payloads.push(`[SYSTEM-CALL: 02_Cognitive/type7 | PAYLOAD: 1337]`);
payloads.push(`[SYSTEM-CALL: 02_Cognitive/type8 | PAYLOAD: {"valueOf": "hacked"}]`);
payloads.push(`[SYSTEM-CALL: 02_Cognitive/type9 | PAYLOAD: {"length": 10000}]`);
payloads.push(`[SYSTEM-CALL: 02_Cognitive/type10 | PAYLOAD: {"sql_query": null, "tone": ["angry"]}]`); 

// 4. 記憶體與緩衝區炸彈 (Buffer Exhaustion) - 10發
const bigString = "A".repeat(50000); 
payloads.push(`[SYSTEM-CALL: 02_Cognitive/mem1 | PAYLOAD: {"big": "${bigString}"}]`);
const deepNest = '{"a":'.repeat(200) + '1' + '}'.repeat(200); 
payloads.push(`[SYSTEM-CALL: 02_Cognitive/mem2 | PAYLOAD: ${deepNest}]`);
for(let i=3; i<=10; i++) {
  payloads.push(`[SYSTEM-CALL: 02_Cognitive/mem${i} | PAYLOAD: {"pad": "${"B".repeat(10000 * i)}"}]`);
}

// 5. 控制字元與隱形編碼攻擊 (Control Characters) - 10發
payloads.push(`[SYSTEM-CALL: 02_Cognitive/ctrl1 | PAYLOAD: {"\u0000": "null_key"}]`);
payloads.push(`[SYSTEM-CALL: 02_Cognitive/ctrl2 | PAYLOAD: {"key": "\u0008\u000B"}]`);
payloads.push(`[SYSTEM-CALL: 02_Cognitive/ctrl3 | PAYLOAD: {"\uFEFFkey": "bom"}]`); 
payloads.push(`[SYSTEM-CALL: 02_Cognitive/ctrl4 | PAYLOAD: {"\u200B": "zero_width"}]`); 
for(let i=5; i<=10; i++) {
  payloads.push(`[SYSTEM-CALL: 02_Cognitive/ctrl${i} | PAYLOAD: {"test": "𠜎𠜱𠝹𠱓𠱸"}]`); 
}

let successBlocked = 0;
let systemCrashed = 0;

console.log("🔥 開始進行 V2 深度滲透 50 連發 (透過 stdin 注入)...\n");

payloads.forEach((payload, index) => {
  // 修改為 stdin (input option) 注入，繞過 OS 命令列長度限制，精準打擊 run.js 內部緩衝區
  const child = spawnSync('node', [ROUTER_PATH], { input: payload, encoding: 'utf8' });
  const out = (child.stdout || '').trim();
  const err = (child.stderr || '').trim();
  
  if (out.includes('[SYSTEM-RETURN: FAILED') || out.includes('Failed to start') || out.includes('Invalid') || err.includes('size exceeded') || err.includes('Error')) {
    successBlocked++;
  } else {
    systemCrashed++;
    console.log(`[防禦突破] Payload ${index+1} 未被正確攔截！輸出:`, out.substring(0, 100));
  }
});

console.log("========================================");
console.log("🛡️ 《V3.2.0 混沌工程 V2 戰損報告》");
console.log(`總攻擊次數 : 50 次`);
console.log(`成功防禦/攔截: ${successBlocked} 次`);
console.log(`系統異常崩潰 : ${systemCrashed} 次 (若大於0代表防禦被突破)`);
console.log("========================================");

// 驗證死信佇列數量是否增加 (去識別化環境下容許連線失敗)
try {
  const { pool } = require('./Modules/db_state_manager.js');
  pool.query('SELECT COUNT(*) FROM watchdog_pending_optimizations').then(res => {
    console.log(`📊 戰後驗證：死信佇列總數已達 ${res.rows[0].count} 筆。`);
    pool.end();
  }).catch(e => console.log('無法連線驗證 DB (符合去識別化預期):', e.message));
} catch (err) {
  console.log('無法載入 db_state_manager:', err.message);
}
