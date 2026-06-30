#!/usr/bin/env node
'use strict';
const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(f => f && (f.endsWith('.js') || f.endsWith('.ps1')));

const EXEMPT_FILES = [
  'skills/03_Execution/line-bot-zero-delay/line-bot-project/poll_inbox.js',
  'Modules/Start-LineBot-SelfHeal.ps1',
  '.githooks/sop_linter.js'
];

const VIOLATIONS = [
  { pattern: /while\s*\(\s*\$true\s*\)/i, desc: '禁止無窮迴圈 while($true)' },
  { pattern: /Stop-Process\s+-Name/i, desc: '禁止無差別屠殺 Stop-Process -Name' },
  { pattern: /Start-Process\s+powershell/i, desc: '禁止以 PowerShell 啟動有視窗子進程' }
];

let hasViolation = false;

for (const file of stagedFiles) {
  const normalizedFile = file.replace(/\\/g, '/');
  if (EXEMPT_FILES.some(exempt => normalizedFile.endsWith(exempt))) {
    console.log('✅ [SOP 海關] 豁免通過: ' + file);
    continue;
  }
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');

  for (const { pattern, desc } of VIOLATIONS) {
    if (pattern.test(content)) {
      console.error('\n❌ [SOP 海關攔截] 違規！');
      console.error('   檔案: ' + file);
      console.error('   原因: ' + desc + '\n');
      hasViolation = true;
    }
  }
}

if (hasViolation) {
  console.error('🚨 提交已被海關擋下。請修正違規後重新執行 git commit。\n');
  process.exit(1);
} else {
  console.log('✅ [SOP 海關] 所有代碼通過合規檢查，提交放行。');
  process.exit(0);
}