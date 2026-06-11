const fs = require('fs');
const path = require('path');

function removeBOM(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                removeBOM(fullPath);
            }
        } else {
            const buffer = fs.readFileSync(fullPath);
            if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
                console.log(`Removing BOM from: ${fullPath}`);
                const noBOMBuffer = buffer.slice(3);
                fs.writeFileSync(fullPath, noBOMBuffer);
            }
        }
    }
}

removeBOM('C:/Users/HHTest_260413/Desktop/Agnet SOP  & Skills_260507');
console.log('BOM removal completed.');
