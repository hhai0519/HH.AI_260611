const fs = require('fs');
const path = require('path');

const skillsDir = path.join(__dirname, '../skills');
let results = {
  total: 0,
  missingType: 0,
  missingCapabilities: 0,
  missingDLP: 0,
  missingComms: 0,
  bomFound: 0
};

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (file === 'SKILL.md') {
      results.total++;
      const content = fs.readFileSync(fullPath, 'utf8');
      
      if (content.charCodeAt(0) === 0xFEFF) results.bomFound++;
      if (!content.match(/^type:\s*".*"/m)) results.missingType++;
      if (!content.match(/^capabilities:/m)) results.missingCapabilities++;
      if (!content.includes('觸發條件與 DLP 聲明')) results.missingDLP++;
      if (!content.includes('【系統通訊層宣告 (System Comms Layer)】')) results.missingComms++;
    }
  }
}

walk(skillsDir);
console.log(JSON.stringify(results, null, 2));
