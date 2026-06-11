const fs = require('fs');
const path = require('path');

const rootDir = process.argv[2] || '.';

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (f === 'node_modules' || f === '.git' || f === '.system' || f === 'Archive') return;
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

const bomFiles = [];

walk(rootDir, (filePath) => {
    const ext = path.extname(filePath);
    if (['.js', '.json', '.md', '.ps1', '.txt', '.bat', '.local'].includes(ext) || filePath.includes('.env')) {
        const buffer = fs.readFileSync(filePath);
        if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
            bomFiles.push(filePath);
        }
    }
});

if (bomFiles.length > 0) {
    console.log('BOM_FOUND');
    bomFiles.forEach(f => console.log(f));
} else {
    console.log('NO_BOM');
}
