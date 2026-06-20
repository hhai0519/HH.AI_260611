const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function generate() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Skills Inventory');
  
  sheet.columns = [
    { header: 'Category', key: 'category', width: 25 },
    { header: 'Skill Name', key: 'name', width: 35 }
  ];

  const skillsDir = path.join(__dirname, '../skills');
  const categories = fs.readdirSync(skillsDir).filter(f => fs.statSync(path.join(skillsDir, f)).isDirectory());

  for (const cat of categories) {
    const catDir = path.join(skillsDir, cat);
    const skills = fs.readdirSync(catDir).filter(f => fs.statSync(path.join(catDir, f)).isDirectory());
    for (const skill of skills) {
      sheet.addRow({ category: cat, name: skill });
    }
  }

  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  const filePath = path.join(publicDir, 'Skills_Inventory.xlsx');
  await workbook.xlsx.writeFile(filePath);
  console.log('Excel file generated at', filePath);
}

generate().catch(console.error);
