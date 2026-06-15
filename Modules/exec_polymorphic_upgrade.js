/**
 * exec_polymorphic_upgrade.js
 * V2.0.0 Polymorphic Labeling Migration for 03_Execution tier skills
 * SOP Compliance: SOP_00_Skill_Lifecycle_Management.md §二§三
 * BOM Regex: /^\uFEFF+/ (精準，僅消除檔案最前端 BOM，無 g flag 配合 \s+)
 */

const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '..');
const EXECUTION_DIR = path.join(BASE, 'skills', '03_Execution');
const MANIFEST_PATH = path.join(BASE, 'Data', '00_Skill_Manifest.json');

// ── 多態標籤對照表 (Polymorphic Label Registry) ──────────────────────────────
const POLYMORPHIC_TAGS = {
  "finance-pe-river-map":    { tool_category: "Finance Visualization",  execution_env: "Browser/D3.js",          io_format: "SVG/JSON" },
  "sys-debugging":           { tool_category: "System Diagnostics",     execution_env: "Multi-env",              io_format: "Log/Text" },
  "sys-skill-creator":       { tool_category: "Skill Generation",       execution_env: "Agent Native",           io_format: "Markdown" },
  "tool-artifacts-builder":  { tool_category: "UI Builder",             execution_env: "Browser/React",          io_format: "HTML/JSX" },
  "tool-canvas-design":      { tool_category: "Visual Design",          execution_env: "Python/PIL",             io_format: "PNG/PDF" },
  "tool-changelog-generator":{ tool_category: "DevOps/CI",              execution_env: "Git/Node.js",            io_format: "Markdown" },
  "tool-connect-apps":       { tool_category: "API Integration",        execution_env: "HTTP/REST",              io_format: "JSON/Stream" },
  "tool-csv-data-summarizer":{ tool_category: "Data Analysis",          execution_env: "Python/Pandas",          io_format: "CSV/PNG" },
  "tool-d3js-visualization": { tool_category: "Data Visualization",     execution_env: "Browser/D3.js",          io_format: "SVG/HTML" },
  "tool-gemma-4-api":        { tool_category: "AI/LLM",                 execution_env: "Python/REST",            io_format: "JSON/Stream" },
  "tool-image-enhancer":     { tool_category: "Image Processing",       execution_env: "Python/PIL",             io_format: "PNG/JPEG" },
  "tool-langsmith-fetch":    { tool_category: "AI Debugging",           execution_env: "Python/CLI",             io_format: "JSON/Log" },
  "tool-mcp-builder":        { tool_category: "MCP/Protocol",           execution_env: "Node.js/TypeScript",     io_format: "JSON/SSE" },
  "tool-mcp-setup":          { tool_category: "MCP/Config",             execution_env: "Node.js",                io_format: "JSON" },
  "tool-notebooklm-mcp":     { tool_category: "AI Research",            execution_env: "Browser/MCP",            io_format: "JSON/Markdown" },
  "tool-pdf":                { tool_category: "Document Processing",    execution_env: "Python/PyPDF",           io_format: "PDF/Text" },
  "tool-playwright-automation":{ tool_category: "Browser Automation",   execution_env: "Node.js/Playwright",     io_format: "HTML/PNG/JSON" },
  "tool-postgres":           { tool_category: "Database",               execution_env: "Python/PostgreSQL",      io_format: "JSON/CSV" },
  "tool-theme-factory":      { tool_category: "UI Design",              execution_env: "Browser/CSS",            io_format: "CSS/HTML" },
  "tool-webapp-testing":     { tool_category: "Testing",                execution_env: "Node.js/Playwright",     io_format: "HTML/Screenshot" },
  "tool-xlsx":               { tool_category: "Spreadsheet",            execution_env: "Python/openpyxl",        io_format: "XLSX/CSV" },
};

// ── Version bumper ────────────────────────────────────────────────────────────
function bumpVersion(ver) {
  const cleaned = String(ver || '1.0.0').replace(/["']/g, '').trim();
  const parts = cleaned.split('.');
  if (parts.length < 3) parts.push('0');
  // Major bump: X.Y.Z → (X+1).0.0, unless already 2.0.0
  const major = parseInt(parts[0]) || 1;
  if (major >= 2) return '2.0.0'; // already at 2.x, keep at 2.0.0
  return `${major + 1}.0.0`;
}

// ── Body parser: strips ALL leading YAML header blocks ────────────────────────
function stripHeaders(content) {
  // Remove BOM — /^\uFEFF+/ only, per SOP Regex Hardening
  content = content.replace(/^\uFEFF+/, '');
  // Strip all leading --- ... --- blocks
  let result = content;
  while (/^---\r?\n[\s\S]*?\r?\n---\r?\n/.test(result)) {
    result = result.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
  }
  return result;
}

// ── Parse current YAML header fields ──────────────────────────────────────────
function parseHeader(content) {
  const headerMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!headerMatch) return {};
  const h = headerMatch[1];
  const get = (key) => {
    const m = h.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
    return m ? m[1].replace(/["']/g, '').trim() : '';
  };
  return {
    name: get('name'),
    description: get('description'),
    type: get('type') || 'execution',
    version: get('version'),
  };
}

// ── Build canonical V2.0.0 header ─────────────────────────────────────────────
function buildHeader(name, type, description, newVersion, tags) {
  const descLine = description ? `description: ${description}` : '';
  return [
    '---',
    `name: ${name}`,
    `type: ${type || 'execution'}`,
    descLine,
    `version: "${newVersion}"`,
    'capabilities:',
    `  tool_category: "${tags.tool_category}"`,
    `  execution_env: "${tags.execution_env}"`,
    `  io_format: "${tags.io_format}"`,
    '---',
    '',
  ].filter(l => l !== null && !(l === '' && false)).join('\n');
}

// ── Changelog injector ────────────────────────────────────────────────────────
const CHANGELOG_ENTRY = `\n## 版本紀錄 (Changelog)\n- **[2.0.0]** 2026-05-04：V2.0.0 Polymorphic Labeling Migration — 依生命週期 SOP 導入多態功能性技術標籤 (tool_category, execution_env, io_format)，建立執行層 Manifest 路由能力。\n`;

function injectChangelog(body) {
  if (body.includes('## 版本紀錄')) {
    // Replace existing changelog block with updated entry prepended
    return body.replace(
      /(## 版本紀錄 \(Changelog\)\n)/,
      `## 版本紀錄 (Changelog)\n- **[2.0.0]** 2026-05-04：V2.0.0 Polymorphic Labeling Migration — 依生命週期 SOP 導入多態功能性技術標籤 (tool_category, execution_env, io_format)，建立執行層 Manifest 路由能力。\n`
    );
  }
  // Append before the DLP line if present, otherwise at end
  if (body.includes('## [Security]')) {
    return body.replace('## [Security]', `${CHANGELOG_ENTRY}\n## [Security]`);
  }
  return body.trimEnd() + CHANGELOG_ENTRY;
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
const results = [];
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

fs.readdirSync(EXECUTION_DIR).forEach(folder => {
  const skillPath = path.join(EXECUTION_DIR, folder, 'SKILL.md');
  if (!fs.existsSync(skillPath)) return;

  const tags = POLYMORPHIC_TAGS[folder];
  if (!tags) {
    if (process.env.DEBUG === 'true') console.log(`⚠️  No polymorphic tags defined for: ${folder} — skipping`);
    return;
  }

  let raw = fs.readFileSync(skillPath, 'utf8');
  const parsed = parseHeader(raw);
  const name = parsed.name || folder;
  const newVersion = bumpVersion(parsed.version);
  const body = stripHeaders(raw);
  const cleanBody = injectChangelog(body);

  const header = buildHeader(name, 'execution', parsed.description, newVersion, tags);
  const finalContent = header + cleanBody;

  fs.writeFileSync(skillPath, finalContent, 'utf8');

  // Update manifest entry
  manifest[name] = {
    description: parsed.description || '',
    version: newVersion,
    type: 'execution',
    path: skillPath.replace(/\\/g, '/'),
    capabilities: {
      tool_category: tags.tool_category,
      execution_env: tags.execution_env,
      io_format: tags.io_format,
    }
  };

  results.push({ folder, name, version: `${parsed.version || '?'} → ${newVersion}` });
  if (process.env.DEBUG === 'true') console.log(`✅ ${folder} (${parsed.version || '?'} → ${newVersion})`);
});

// Write updated manifest
fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');

if (process.env.DEBUG === 'true') {
  console.log(`\n📦 Manifest updated: ${MANIFEST_PATH}`);
  console.log(`\n📊 Summary: ${results.length} execution skills upgraded`);
  results.forEach(r => console.log(`   ${r.folder}: ${r.version}`));
}
