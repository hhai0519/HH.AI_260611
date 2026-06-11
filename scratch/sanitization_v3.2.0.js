/**
 * sanitization_v3.2.0.js (v3 - Final)
 * 
 * Technical Asset Sanitization Script
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = 'C:\\Users\\HHTest_260413\\Desktop\\Agnet SOP  & Skills_260507';
const EXTENSIONS = ['.js', '.json', '.md', '.ps1', '.txt', '.py', '.bat', '.yml', '.yaml', '.ts', '.sh', '.xml', '.xsd', '.mjs', '.jsx'];
const IGNORE_DIRS = ['.git', 'node_modules', '.system'];

const REPLACEMENTS = [
    { pattern: /C:[\\\/]Users[\\\/]HHTest_260413/gi, replacement: '<USER_HOME>' },
    { pattern: /本協作系統/g, replacement: '本協作系統' },
    { pattern: /本協作系統/g, replacement: '本協作系統' },
    { pattern: /本協作系統/g, replacement: '本協作系統' },
    { pattern: /(apiKey["']?\s*[:=]\s*["'])([^"']{5,})(["'])/gi, replacement: '$1<SECRET_API_KEY>$3' },
    { pattern: /(token["']?\s*[:=]\s*["'])([^"']{5,})(["'])/gi, replacement: '$1<SECRET_TOKEN>$3' },
    { pattern: /(secret["']?\s*[:=]\s*["'])([^"']{5,})(["'])/gi, replacement: '$1<SECRET_VALUE>$3' },
    { pattern: /(password["']?\s*[:=]\s*["'])([^"']{5,})(["'])/gi, replacement: '$1<SECRET_PASSWORD>$3' },
    { pattern: /(Authorization["']?\s*[:=]\s*["'])([^"']{5,})(["'])/gi, replacement: '$1Bearer <SECRET_TOKEN>$3' },
    { pattern: /(connectionString["']?\s*[:=]\s*["'])([^"']{5,})(["'])/gi, replacement: '$1<CONNECTION_STRING>$3' },
];

let filesProcessed = 0;
let changesMade = 0;

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) {
                walk(fullPath);
            }
        } else {
            if (EXTENSIONS.includes(path.extname(file).toLowerCase())) {
                processFile(fullPath);
            }
        }
    }
}

function processFile(filePath) {
    let content;
    try {
        content = fs.readFileSync(filePath, 'utf8');
    } catch (e) {
        return;
    }
    let originalContent = content;
    for (const { pattern, replacement } of REPLACEMENTS) {
        content = content.replace(pattern, replacement);
    }
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        changesMade++;
    }
    filesProcessed++;
}

walk(ROOT_DIR);
console.log(`Final Scan Complete. Modified ${changesMade} files.`);
