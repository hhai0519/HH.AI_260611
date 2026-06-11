const fs = require('fs');
const path = require('path');

const TARGET_DIR = process.argv[2] || '.';
const OLD_PATH_WIN = /C:\\Users\\HHTest_260413/g;
const OLD_PATH_UNIX = /C:\/Users\/HHTest_260413/g;
const NEW_PATH = '<USER_HOME>';

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            if (file === '.git' || file === 'node_modules' || file === '.gemini') continue;
            processDir(fullPath);
        } else {
            // Only process text files
            if (/\.(md|txt|json|js|ps1|yml|yaml|env|local|html)$/.test(file)) {
                console.log(`Processing: ${fullPath}`);
                let content = fs.readFileSync(fullPath, 'utf8');
                let newContent = content.replace(OLD_PATH_WIN, NEW_PATH).replace(OLD_PATH_UNIX, NEW_PATH);
                
                if (content !== newContent) {
                    fs.writeFileSync(fullPath, newContent, 'utf8');
                    console.log(`✅ Updated: ${fullPath}`);
                }
            }
        }
    }
}

processDir(TARGET_DIR);
console.log('Finished path generalization.');
