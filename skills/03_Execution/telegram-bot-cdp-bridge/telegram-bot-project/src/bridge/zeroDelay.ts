import express from 'express';
import helmet from 'helmet';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { Bot, InputFile } from 'grammy';
import { run as runGrammyRunner, RunnerHandle } from '@grammyjs/runner';
// [AUDIT-10] 引入對話記錄器，保障對話留痕
import { logTelegramChat } from '../utils/chatLogger';

const PORT = parseInt(process.env.TG_BRIDGE_PORT || '3001', 10);

interface TgMessage {
    chatId: string;
    text: string;
    messageId: number;
}

interface BridgeOptions {
    botToken: string;
    allowedUserIds: string[];
}

export async function startZeroDelayBridge(opts: BridgeOptions): Promise<void> {
    const { botToken, allowedUserIds } = opts;

    const app = express();
    app.set('trust proxy', false);
    
    app.use(helmet());
    app.use(express.json());

    const inboxQueue: TgMessage[] = [];
    
    let activeAgentToken: string | null = null;
    let lastActiveTime: number = 0;
    const LOCK_TTL_MS = 60000; 

    let waitingClients: express.Response[] = [];
    let pollingTimer: NodeJS.Timeout | null = null;

    // 127.0.0.1 本機與 Host 嚴密防護
    app.use((req, res, next) => {
        const ip = req.ip || req.socket.remoteAddress || '';
        const allowedIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
        if (!allowedIps.includes(ip)) {
            console.warn(`[安全警告] 阻擋非本機 IP 存取: ${ip}`);
            return res.status(403).json({ error: 'Localhost only' });
        }
        const host = req.get('host');
        if (!host || (!host.includes('localhost') && !host.includes('127.0.0.1'))) {
            console.warn(`[安全警告] 阻擋異常 Host: ${host}`);
            return res.status(403).json({ error: 'Invalid Host' });
        }
        next();
    });

    const isLockValid = (token: string): boolean => {
        if (!activeAgentToken) return false;
        if (activeAgentToken !== token) return false;
        if (Date.now() - lastActiveTime > LOCK_TTL_MS) {
            console.log(`[Zero-Delay] Agent 租約過期。釋放鎖：${activeAgentToken}`);
            activeAgentToken = null;
            return false;
        }
        return true;
    };

    app.post('/api/lock/acquire', (req, res) => {
        const { token, force } = req.body;
        if (!token) return res.status(400).json({ error: 'Missing token' });

        if (force || !activeAgentToken || !isLockValid(token)) {
            console.log(`[Zero-Delay] 鎖被 ${token} 取得 (Force: ${!!force})`);
            activeAgentToken = token;
            lastActiveTime = Date.now();

            waitingClients.forEach(clientRes => {
                if (!clientRes.headersSent) {
                    clientRes.status(403).json({ error: 'AGENT_TRANSFER' });
                }
            });
            waitingClients = [];
            if (pollingTimer) { clearTimeout(pollingTimer); pollingTimer = null; }
            return res.json({ success: true, token });
        }

        res.status(403).json({ error: 'LOCK_HELD_BY_ANOTHER_AGENT' });
    });

    app.get('/api/inbox', (req, res) => {
        const token = req.query.token as string | undefined;
        if (!token) return res.status(400).json({ error: 'Missing token' });

        if (!activeAgentToken || !isLockValid(activeAgentToken)) {
            activeAgentToken = token;
            console.log(`[Zero-Delay] 自癒啟動，鎖自動授予：${token}`);
        }

        if (activeAgentToken !== token) {
            return res.status(403).json({ error: 'AGENT_TRANSFER' });
        }

        lastActiveTime = Date.now();

        if (inboxQueue.length > 0) {
            return res.json(inboxQueue.shift());
        }

        waitingClients.push(res);

        req.on('close', () => {
            waitingClients = waitingClients.filter(c => c !== res);
        });

        pollingTimer = setTimeout(() => {
            const index = waitingClients.indexOf(res);
            if (index !== -1) {
                if (!res.headersSent) res.status(204).send();
                waitingClients.splice(index, 1);
            }
        }, 50000);
    });

    function notifyNewMessage(): void {
        if (waitingClients.length > 0 && inboxQueue.length > 0) {
            const clientRes = waitingClients.shift();
            if (clientRes && !clientRes.headersSent) {
                clientRes.json(inboxQueue.shift());
            }
        }
    }

    app.post('/api/send', async (req, res) => {
        const { chatId, text } = req.body as { chatId?: string; text?: string };
        if (!chatId || !text) return res.status(400).json({ error: 'Missing chatId or text' });
        
        try {
            if (text.length > 4000) {
                const tmpDir = path.join(__dirname, '..', '..', 'scratch');
                await fs.mkdir(tmpDir, { recursive: true }).catch(() => {});
                const tmpFilePath = path.join(tmpDir, `reply_${crypto.randomUUID()}.txt`);
                
                try {
                    await fs.writeFile(tmpFilePath, text, 'utf-8');
                    await bot.api.sendDocument(
                        chatId, 
                        new InputFile(tmpFilePath), 
                        { caption: '💡 回覆內容過長，已為您轉為檔案。' }
                    );
                } catch (err) {
                    console.error('[TG sendDocument 失敗，啟動降級降字數傳送]', err);
                    const truncated = text.substring(0, 4000) + '\n\n...[文字超過長度限制，且檔案生成/傳送失敗]';
                    await bot.api.sendMessage(chatId, truncated);
                } finally {
                    await fs.unlink(tmpFilePath).catch(() => {});
                }
            } else {
                await bot.api.sendMessage(chatId, text);
            }
            
            // [AUDIT-10] 記錄 Bot 發送的回覆訊息 (isBot = true)
            logTelegramChat(chatId, 'BOT', text, true);

            res.json({ success: true });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    const server = app.listen(PORT, '127.0.0.1', () => {
        console.log(`[TG Zero-Delay] API Server listening on 127.0.0.1:${PORT}`);
    });

    // SOP14 修正：捕捉埠口衝突與啟動錯誤
    server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`[FATAL ERROR] Port ${PORT} is already in use by another process. Exiting gracefully.`);
            process.exit(1);
        } else {
            console.error(`[FATAL ERROR] Failed to start server:`, err.message);
            process.exit(1);
        }
    });

    const bot = new Bot(botToken);

    // SOP14 修正：防禦性全域錯誤捕獲，防止 API 錯誤拖垮 Bridge 進程
    bot.catch((err) => {
        console.error('[TG Zero-Delay] Bot error:', err);
    });

    bot.on('message', async (ctx) => {
        const userId = ctx.from?.id.toString() ?? '';
        if (!allowedUserIds.includes(userId)) {
            return ctx.reply('未經授權的存取。');
        }
        const messageText = ctx.message.text ?? ctx.message.caption ?? '[圖片或非文字訊息]';
        
        // [AUDIT-10] 記錄使用者傳入的訊息 (isBot = false)
        const username = ctx.from?.username || ctx.from?.first_name || 'unknown';
        logTelegramChat(userId, username, messageText, false);

        if (inboxQueue.length >= 100) inboxQueue.shift();
        inboxQueue.push({
            chatId: ctx.chat.id.toString(),
            text: messageText,
            messageId: ctx.message.message_id
        });
        ctx.replyWithChatAction('typing').catch(() => {});
        notifyNewMessage();
    });

    console.log('[TG Zero-Delay] 啟動 grammY Runner...');
    const runnerHandle: RunnerHandle = runGrammyRunner(bot);

    const shutdown = async (signal: string) => {
        console.log(`[TG Zero-Delay] 收到 ${signal}，正在優雅關機...`);
        
        server.close(() => { console.log('[TG Zero-Delay] HTTP 伺服器已關閉'); });

        waitingClients.forEach(clientRes => {
            if (!clientRes.headersSent) {
                clientRes.status(503).json({ error: 'Server shutting down' });
            }
        });
        waitingClients = [];

        await runnerHandle.stop();
        console.log('[TG Zero-Delay] grammY Runner 已安全停止');
        process.exit(0);
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
}
