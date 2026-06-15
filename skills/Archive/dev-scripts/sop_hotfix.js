// sop_hotfix.js — SOP Logic Gap Repair (4 Tasks)
// Uses Node.js for safe CJK string handling, UTF-8 no-BOM output
const fs = require('fs');
const path = require('path');

const BASE = path.join('c:\\', 'Users', 'HHTest_260413', 'Desktop', 'AI Test_260503', 'SOP');

function readFile(p) {
  return fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
}
function writeFile(p, content) {
  // Strip BOM if present, write UTF-8 no-BOM
  fs.writeFileSync(p, content.replace(/^\uFEFF/, ''), { encoding: 'utf8' });
}

// ─── TASK 1: Confirm §6.2 in SOP_00_Skill_Lifecycle_Management.md ───
const file1 = path.join(BASE, 'SOP_00_Skill_Lifecycle_Management.md');
const c1 = readFile(file1);
if (c1.includes('\u7121\u524d\u7db4\u6620\u5c04\u539f\u5247') || c1.includes('No-Prefix')) {
  console.log('TASK1: CONFIRMED-IN-PLACE - \u00a76.2 \u7121\u524d\u7db4\u6620\u5c04\u539f\u5247\u5df2\u5b58\u5728\uff0c\u72ec\u7acb\u5b88\u9580\u54e1\u6587\u4ef6\u4e0d\u5b58\u5728\uff0c\u7121\u9700\u4fee\u6539\u3002');
} else {
  console.log('TASK1: WARNING - \u00a76.2 pattern not found, manual review needed.');
}

// ─── TASK 2: Rewrite §7.1 in SOP_00_Skill_Lifecycle_Management.md ───
const oldSec71 = `### \u00a77.1 \u9ad8\u968e\u8a9e\u8a00\u512a\u5148\u539f\u5247 (Node.js / Python First)

\u51e1\u6d89\u53ca**\u8b80\u53d6\u3001\u4fee\u6539\u3001\u66ff\u63db**\u542b\u6709\u5927\u91cf CJK \u6b63\u9ad4\u4e2d\u6587\u5b57\u5143\u7684\u6a94\u6848\uff08\u5305\u542b \`.md\` Markdown \u6587\u6b4a\u3001\`.json\` \u6578\u64da\u6a94\uff09\uff0c**\u5f37\u5236\u512a\u5148\u4f7f\u7528 Node.js \u6216 Python \u8173\u672c**\u57f7\u884c\u3002

**\u7406\u7531**\uff1aNode.js \u8207 Python \u539f\u751f\u652f\u63f4\u6a19\u6e96 UTF-8 \u5b57\u5143\u96c6\uff0c\u53ef\u5b8c\u6574\u8655\u7406 CJK \u5b57\u5143\uff0c\u6839\u672c\u907f\u514d Windows PowerShell \u56e0 \`$OutputEncoding\` \u9810\u8a2d\u5024\u4e0d\u4e00\u81f4\u800c\u5c0e\u81f4\u7684 Mojibake\uff08\u4e82\u78bc\uff09\u554f\u984c\u3002

\`\`\`javascript
// Node.js \u6a19\u6e96\u7bc4\u4f8b\uff1aUTF-8 \u7121 BOM \u8b80\u5beb
const fs = require('fs');
const content = fs.readFileSync(filePath, 'utf8');
const updated = content.replace(/\u820a\u5b57\u4e32/g, '\u65b0\u5b57\u4e32');
fs.writeFileSync(filePath, updated, { encoding: 'utf8' }); // \u9810\u8a2d\u7121 BOM
\`\`\`

\`\`\`python
# Python \u6a19\u6e96\u7bc4\u4f8b\uff1aUTF-8 \u7121 BOM \u8b80\u5beb
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
updated = content.replace('\u820a\u5b57\u4e32', '\u65b0\u5b57\u4e32')
with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.write(updated)
\`\`\``;

const newSec71 = `### \u00a77.1 \u7269\u7406\u5beb\u5165\u6700\u9ad8\u6a19\u6e96\uff1aPowerShell Here-String

\u6839\u64da\u707d\u96e3\u53cd\u601d\uff0c\u8655\u7406\u591a\u884c Markdown \u6216 JSON \u5beb\u5165\u6642\uff0c**\u5f37\u5236\u4f7f\u7528 PowerShell \u55ae\u5f15\u865f Here-String (\`@' ... '@\`)** \u4ee5\u514d\u75ab\u8df3\u812b\u5b57\u5143\u8207\u8f49\u7fa9\u5d29\u6f70\u3002Node.js \u50c5\u9650\u7528\u65bc\u4e0d\u6d89\u53ca\u5927\u7bc7\u5e45\u6587\u4ef6\u751f\u6210\u7684\u55ae\u7d14\u9080\u8f2f\u9032\u7b97\u6216 BOM \u6e05\u6d17\u3002

\`\`\`powershell
# PowerShell Here-String \u5f37\u5236\u7bc4\u4f8b\uff1a\u591a\u884c Markdown \u5beb\u5165
\$utf8NoBom = New-Object System.Text.UTF8Encoding(\$false)
\$content = @'
# \u6a19\u984c
\u591a\u884c\u5167\u5bb9\uff0c\u4e0d\u9700\u8981\u4efb\u4f55\u8df3\u812b\u5b57\u5143
\u5305\u542b\u53cd\u5f15\u865f\u8207\u300c\u7279\u6b8a\u7b26\u865f\u300d\u5747\u5b89\u5168
'@
[System.IO.File]::WriteAllText('output.md', \$content, \$utf8NoBom)
\`\`\`

**\u9069\u7528\u60c5\u5883**\uff1a
- \u591a\u884c Markdown \u6587\u4ef6\u751f\u6210\uff08SOP\u3001SKILL.md\u3001README\uff09
- \u542b CJK \u5b57\u5143\u7684 JSON \u7d50\u69cb\u5beb\u5165
- \u4efb\u4f55\u542b\u63db\u884c\u7b26\u3001\u5f15\u865f\u3001\u7279\u6b8a\u7b26\u865f\u7684\u6587\u5b57\u5beb\u5165

**Node.js \u50c5\u5141\u8a31\u7528\u65bc**\uff1a
- BOM \u6e05\u6d17\uff08\`replace(/^\\uFEFF+/, '')\`\uff09
- \u4e0d\u542b\u5927\u7bc7\u5e45\u6587\u5b57\u7684\u7d14\u9080\u8f2f\u9032\u7b97\uff08\u5982\u8b80\u53d6 JSON Key\u3001\u8a08\u7b97\u6578\u5024\uff09`;

if (c1.includes('\u9ad8\u968e\u8a9e\u8a00\u512a\u5148\u539f\u5247')) {
  const updated1 = c1.replace(oldSec71, newSec71);
  if (updated1 !== c1) {
    writeFile(file1, updated1);
    console.log('TASK2: OK - \u00a77.1 \u5df2\u6539\u5beb\u70ba PowerShell Here-String \u6700\u9ad8\u6a19\u6e96');
  } else {
    console.log('TASK2: WARNING - \u5b57\u4e32\u6bd4\u5c0d\u672a\u547d\u4e2d\uff0c\u53ef\u80fd\u6709\u9690\u5f62\u5b57\u5143\u5dee\u7570');
  }
} else {
  console.log('TASK2: SKIP - \u00a77.1 \u820a\u6a19\u984c\u4e0d\u5b58\u5728');
}

// ─── TASK 3: Append DLP check to §3 in SOP_00_New_Skill_Onboarding.md ───
const file3 = path.join(BASE, 'SOP_00_New_Skill_Onboarding.md');
const c3 = readFile(file3);
const marker3 = '- **\u901a\u8a0a\u5354\u5b9a\u5ba3\u544a** \u6aa2\u67e5\u5e95\u90e8\u662f\u5426\u5b8c\u6574\u5305\u542b `[SYSTEM-CALL]` \u8207 `[SYSTEM-RETURN]` \u7684\u5f37\u578b\u5225\u901a\u8a0a\u4ecb\u9762\u8207 `Zero-Block Policy`\u3002';
const dlpLine = '\n- **DLP \u8207\u7d50\u69cb\u6aa2\u6838**\uff1a\u5f37\u5236\u6aa2\u67e5\u6a94\u6848\u662f\u5426\u5305\u542b SOP_03 \u898f\u5b9a\u7684 `### \u300b\u6458\u8981\u300a\u89f8\u767c\u689d\u4ef6` \u8207 DLP \u8072\u660e\uff0c\u4ee5\u53ca\u6a19\u6e96 H2 \u6a19\u984c\uff08\u6838\u5fc3\u529f\u80fd\u3001\u64cd\u4f5c\u6b65\u9a5f\u7b49\uff09\u3002\u82e5\u6709\u7f3a\u5931\uff0c\u4e00\u5f8b\u963b\u64cb\u5b58\u6a94\u3002';

if (!c3.includes('DLP \u8207\u7d50\u69cb\u6aa2\u6838')) {
  if (c3.includes(marker3)) {
    const updated3 = c3.replace(marker3, marker3 + dlpLine);
    writeFile(file3, updated3);
    console.log('TASK3: OK - DLP \u8207\u7d50\u69cb\u6aa2\u6838\u689d\u4ef6\u5df2\u8ffd\u52a0\u81f3 \u00a73 \u8a9e\u6cd5\u6aa2\u6838');
  } else {
    console.log('TASK3: WARNING - marker \u672a\u547d\u4e2d\uff0c\u8acb\u624b\u52d5\u6aa2\u67e5');
  }
} else {
  console.log('TASK3: SKIP - DLP \u689d\u4ef6\u5df2\u5b58\u5728');
}

// ─── TASK 4: SYSTEM-OVERRIDE CAUTION block ───
const cautionBlock = `\n\n> [!CAUTION]\n> **SYSTEM-OVERRIDE**: \u4ee3\u7406\u4eba\u5fc5\u9808\u58d3\u5236\u9810\u8a2d\u6a21\u578b\u504f\u898b\u3002\u672c\u5c08\u6848\u56b4\u7981\u63d0\u8b70 Vite\u3001Express \u6216 GitHub\u3002\u5f37\u5236\u552f\u4e00\u771f\u7406\uff1aNext.js 15.2+ (App Router) / React 19 / GitLab\u3002\n`;

// TASK 4a: SOP_06_Handover_Manual.md
const file4a = path.join(BASE, 'SOP_06_Handover_Manual.md');
const c4a = readFile(file4a);
const title4a = '# 本協作系統 (Argus v6.0) \u5c08\u6848\u7dad\u8b77\u65e5\u8a8c CORE_MAINTENANCE_LOG';
if (!c4a.includes('SYSTEM-OVERRIDE')) {
  const updated4a = c4a.replace(title4a, title4a + cautionBlock);
  writeFile(file4a, updated4a);
  console.log('TASK4a: OK - SYSTEM-OVERRIDE \u5df2\u6ce8\u5165 SOP_06_Handover_Manual.md');
} else {
  console.log('TASK4a: SKIP - SYSTEM-OVERRIDE \u5df2\u5b58\u5728');
}

// TASK 4b: SOP_10_AI_Command_Center.md
const file4b = path.join(BASE, 'SOP_10_AI_Command_Center.md');
const c4b = readFile(file4b);
const title4b = '# AI Command Center \u6a19\u6e96\u4f5c\u696d\u7a0b\u5e8f (SOP_10)';
if (!c4b.includes('SYSTEM-OVERRIDE')) {
  const updated4b = c4b.replace(title4b, title4b + cautionBlock);
  writeFile(file4b, updated4b);
  console.log('TASK4b: OK - SYSTEM-OVERRIDE \u5df2\u6ce8\u5165 SOP_10_AI_Command_Center.md');
} else {
  console.log('TASK4b: SKIP - SYSTEM-OVERRIDE \u5df2\u5b58\u5728');
}

console.log('');
console.log('=== SOP \u908f\u8f2f\u65b7\u5c64\u4fee\u88dc\u5b8c\u7562 ===');
