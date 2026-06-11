// [LOW-02] V3.2.0 修復：移除已廢棄的 finance-*/sys-* 前綴目錄名，
// 改為與 SKILL.md name: 欄位 1:1 對齊的實際目錄名稱。
const fs = require('fs'), path = require('path');
const base = './skills/01_Orchestrators';
const dirs = [
  'quant-research-loop',
  'twse-dev-sop-skill',
  'autoresearch-agent',
  'optimization-status',
  'recursive-research-automation',
  'reflection-module',
  'skill-governance-skill',
  'subagent-collaboration-skill',
  'quota-monitor-skill',
];
dirs.forEach(d => {
  const p = path.join(base, d, 'SKILL.md');
  if (!fs.existsSync(p)) { if (process.env.DEBUG === 'true') console.log(d + ': FILE NOT FOUND'); return; }
  const raw = fs.readFileSync(p, 'utf8');
  const hm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!hm) { if (process.env.DEBUG === 'true') console.log(d + ': NO YAML HEADER'); return; }
  const h = hm[1];
  const get = k => { const m = h.match(new RegExp('^'+k+':\\s*(.+)$','m')); return m?m[1].replace(/["']/g,'').trim():''; };
  const body = raw.replace(/^---[\s\S]*?---\n/,'');
  const h1 = body.match(/^# (.+)$/m);
  const trig = body.match(/^- (.+)$/m);
  if (process.env.DEBUG === 'true') {
    console.log('---');
    console.log('folder:', d);
    console.log('name:', get('name'));
    console.log('version:', get('version'));
    console.log('type:', get('type'));
    console.log('h1:', h1?h1[1]:'N/A');
    console.log('first_trigger:', trig?trig[1]:'N/A');
  }
});
