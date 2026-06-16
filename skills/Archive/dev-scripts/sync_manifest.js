const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SKILLS_DIR = path.join(ROOT, 'skills');
const MANIFEST_PATH = path.join(ROOT, 'Data', '00_Skill_Manifest.json');

function getSkillData(skillPath) {
  const skillFile = path.join(skillPath, 'SKILL.md');
  if (!fs.existsSync(skillFile)) return null;
  
  const content = fs.readFileSync(skillFile, 'utf8');
  const metadataMatch = content.match(/---\n([\s\S]*?)\n---/);
  if (!metadataMatch) return null;
  
  const metadataLines = metadataMatch[1].split('\n');
  const metadata = {};
  metadataLines.forEach(line => {
    const [key, ...value] = line.split(':');
    if (key && value.length) {
      metadata[key.trim()] = value.join(':').trim().replace(/^"(.*)"$/, '$1');
    }
  });
  
  return {
    description: metadata.description || '',
    version: metadata.version || '1.0.0',
    type: 'skill',
    path: './' + path.relative(ROOT, skillFile).replace(/\\/g, '/'),
    capabilities: {} // Expand this if needed
  };
}

const manifest = {};
const layers = ['01_Orchestrators', '02_Cognitive', '03_Execution'];

layers.forEach(layer => {
  const layerPath = path.join(SKILLS_DIR, layer);
  if (!fs.existsSync(layerPath)) return;
  
  const skills = fs.readdirSync(layerPath);
  skills.forEach(skillName => {
    const skillPath = path.join(layerPath, skillName);
    if (fs.lstatSync(skillPath).isDirectory()) {
      const data = getSkillData(skillPath);
      if (data) {
        manifest[skillName] = data;
      } else {
        if (process.env.DEBUG === 'true') console.warn(`[WARN] Failed to parse skill: ${skillName}`);
      }
    }
  });
});

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
if (process.env.DEBUG === 'true') console.log('Manifest updated successfully.');
