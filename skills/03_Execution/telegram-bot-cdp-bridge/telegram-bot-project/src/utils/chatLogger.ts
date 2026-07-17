import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { sanitizeDlp } from './dlpSanitizer';

const DESKTOP_PATH = process.env.DESKTOP_PATH || path.join(os.homedir(), 'Desktop');
const CHAT_LOG_DIR = path.join(DESKTOP_PATH, 'Line對話紀錄', 'TG_萬能總管');
const TG_LOG_FILE = path.join(CHAT_LOG_DIR, 'Telegram_Chat.log');

// V13 壓力優化：非同步序列化寫入佇列，防範 Windows NTFS 併發寫入鎖定 (EBUSY)
const writeQueue: string[] = [];
let isWriting = false;

async function processQueue() {
    if (isWriting || writeQueue.length === 0) return;
    isWriting = true;
    
    const nextLine = writeQueue.shift();
    if (nextLine) {
        try {
            await fs.promises.mkdir(CHAT_LOG_DIR, { recursive: true });
            await fs.promises.appendFile(TG_LOG_FILE, nextLine, 'utf8');
        } catch (err) {
            console.error('[ChatLogger] 檔案寫入鎖定 (佇列自動退避重試):', err);
            writeQueue.unshift(nextLine); // 塞回佇列頭部
            await new Promise(r => setTimeout(r, 200)); // 延遲 200ms 後重試
        }
    }
    
    isWriting = false;
    // OPT-01: 改用 setImmediate 進行事件循環調度，徹底防止遞迴呼叫堆疊溢出 (Stack Overflow)
    if (writeQueue.length > 0) {
        setImmediate(processQueue);
    }
}

export function logTelegramChat(userId: string | number, username: string, message: string, isBot = false) {
    const timestamp = new Date().toISOString();
    const senderInfo = isBot ? '[Bot Reply]' : `[User: ${username} (${userId})]`;
    const cleanMessage = sanitizeDlp(message);
    const safeMessage = cleanMessage.replace(/\r?\n/g, '\\n');
    const logLine = `${timestamp} ${senderInfo} -> ${safeMessage}\n`;
    
    writeQueue.push(logLine);
    processQueue();
}
