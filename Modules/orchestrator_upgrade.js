/**
 * orchestrator_upgrade.js
 * Tasks: 5-Orchestrator polymorphic tag injection, version bump, manifest registration
 * Removes sys-watchdog from manifest if present
 * BOM Regex SOP: /^\uFEFF+/ only
 */

const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '..');
const ORCHESTRATORS_DIR = path.join(BASE, 'skills', '01_總管與路由層_Orchestration');
const MANIFEST_PATH = path.join(BASE, 'Data', '00_Skill_Manifest.json');

// ── 5 remaining Orchestrators with designed capabilities ──────────────────────
const ORCHESTRATOR_TAGS = {
  'finance-quant-research-loop': {
    name: 'quant-research-loop',
    description: 'Autonomous financial experimentation and strategy validation loop. 僅在指令包含「$$自動化$$」時啟用。符合 SOP §2.4 強制授權協議。',
    capabilities: {
      logic_depth:       '量化策略假設→回測→參數優化迴圈',
      strategic_focus:   'VQS 模型與 Sharpe/勝率評估',
      interaction_style: '系統化且迭代驅動',
    }
  },
  'finance-twse-dev-sop': {
    name: 'twse-dev-sop-skill',
    description: '臺股分析網站開發標準作業程式 (SOP)。整合 subagent-collaboration-skill、d3-viz-skill、webapp-testing-skill 三大技能，提供從計畫→實作→驗證的完整開發循環。',
    capabilities: {
      logic_depth:       '多技能協作任務拆解與開發循環',
      strategic_focus:   '計畫→實作→驗證→迭代四階段',
      interaction_style: '結構化且步驟嚴謹',
    }
  },
  'sys-autoresearch': {
    name: 'autoresearch-agent',
    description: '微型 AI 模型超參數自動化優化代理人。僅在指令包含「$$自動化$$」且涉及模型優化時啟用。符合 SOP §2.4 強制授權協議。',
    capabilities: {
      logic_depth:       '超參數搜索空間與 val_bpb 最小化',
      strategic_focus:   '時間預算內自動化實驗迭代',
      interaction_style: '精準且資源受限',
    }
  },
  'sys-optimization-status': {
    name: 'optimization-status',
    description: '🤖 背景自動優化狀態監控器。追蹤超參數實驗進度，管理 val_bpb 閾值與結果日誌。',
    capabilities: {
      logic_depth:       '背景實驗進度追蹤與指標監控',
      strategic_focus:   'val_bpb 閾值管理與結果日誌',
      interaction_style: '即時且狀態感知',
    }
  },
  'sys-recursive-research': {
    name: 'recursive-research-automation',
    description: '通用的遞迴研究自動化框架。僅在指令包含「$$自動化$$」時啟用。符合 SOP §2.4 強制授權協議。',
    capabilities: {
      logic_depth:       '遞迴深化研究路徑與子方向識別',
      strategic_focus:   '配額管理與深度研究產出',
      interaction_style: '廣度→深度且自主收斂',
    }
  },
};

const NEW_VERSION = '2.0.0';
const CHANGELOG = '\n## 版本紀錄 (Changelog)\n- **[2.0.0]** 2026-05-04：V2.0.0 Orchestrator Alignment — 依生命週期 SOP 導入三維認知能力矩陣標籤 (logic_depth, strategic_focus, interaction_style)，完成 Manifest 全域補錄。\n';

function stripHeaders(content) {
  content = content.replace(/^\uFEFF+/, '');
  let result = content;
  while (/^---\r?\n[\s\S]*?\r?\n---\r?\n/.test(result)) {
    result = result.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
  }
  return result;
}

function buildHeader(meta, caps) {
  return [
    '---',
    `name: ${meta.name}`,
    `type: orchestrator`,
    `description: "${meta.description.replace(/"/g, "'")}"`,
    `version: "${NEW_VERSION}"`,
    'capabilities:',
    `  logic_depth: "${caps.logic_depth}"`,
    `  strategic_focus: "${caps.strategic_focus}"`,
    `  interaction_style: "${caps.interaction_style}"`,
    '---',
    '',
  ].join('\n');
}

function injectChangelog(body) {
  if (body.includes('## 版本紀錄')) return body;
  if (body.includes('## [Security]')) {
    return body.replace('## [Security]', `${CHANGELOG}\n## [Security]`);
  }
  return body.trimEnd() + CHANGELOG;
}

// Load manifest
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

// Remove sys-watchdog from manifest if present
const watchdogKeys = Object.keys(manifest).filter(k =>
  k.includes('watchdog') || k.includes('本協作系統-watchdog')
);
watchdogKeys.forEach(k => {
  delete manifest[k];
  if (process.env.DEBUG === 'true') console.log(`🗑️  Removed from manifest: ${k}`);
});

const results = [];

Object.entries(ORCHESTRATOR_TAGS).forEach(([folder, meta]) => {
  const skillPath = path.join(ORCHESTRATORS_DIR, folder, 'SKILL.md');
  if (!fs.existsSync(skillPath)) {
    if (process.env.DEBUG === 'true') console.log(`⚠️  Not found: ${folder}`);
    return;
  }

  const raw = fs.readFileSync(skillPath, 'utf8');
  const body = stripHeaders(raw);
  const cleanBody = injectChangelog(body);
  const header = buildHeader(meta, meta.capabilities);
  const finalContent = header + cleanBody;

  fs.writeFileSync(skillPath, finalContent, 'utf8');

  // Register in manifest
  manifest[meta.name] = {
    description: meta.description,
    version: NEW_VERSION,
    type: 'orchestrator',
    path: skillPath.replace(/\\/g, '/'),
    capabilities: meta.capabilities,
  };

  results.push({ folder, name: meta.name });
  if (process.env.DEBUG === 'true') console.log(`✅ ${folder} → ${meta.name} (${NEW_VERSION})`);
});

// Write updated manifest
fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');

// Summary stats
const total = Object.keys(manifest).length;
const byType = {};
Object.values(manifest).forEach(v => {
  byType[v.type || 'unknown'] = (byType[v.type || 'unknown'] || 0) + 1;
});

if (process.env.DEBUG === 'true') {
  console.log(`\n📦 Manifest updated. Total entries: ${total}`);
  console.log('   By type:', JSON.stringify(byType));
  console.log(`\n✅ ${results.length} orchestrators upgraded & registered`);
}
