const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../00_Master_Menu.ps1');

if (!fs.existsSync(targetFile)) {
  console.error(`❌ 找不到檔案: ${targetFile}`);
  process.exit(1);
}

console.log(`🛠️ 正在將 ${targetFile} 轉碼為 UTF-8 with BOM...`);
const content = fs.readFileSync(targetFile, 'utf8');

// 移除可能已存在的 BOM 以防重複
const cleanContent = content.startsWith('\uFEFF') ? content.slice(1) : content;
const bomContent = '\uFEFF' + cleanContent;

fs.writeFileSync(targetFile, bomContent, 'utf8');
console.log('✅ 轉碼完成！00_Master_Menu.ps1 已具備 UTF-8 BOM 標記。');
