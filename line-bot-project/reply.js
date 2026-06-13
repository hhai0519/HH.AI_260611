const http = require('http');
const fs = require('fs');
const path = require('path');

const userId = process.argv[2];
let text = process.argv[3];
const agentLabel = process.argv[4]; // e.g. "[Gemini 3.1 Pro] 台股分析工具"
const topicCategory = process.argv[5]; // e.g. "鉅祥"
const questionBrief = process.argv[6]; // e.g. "分析技術面"

if (text === 'env') {
    text = process.env.REPLY_TEXT;
} else if (text) {
    if (text.endsWith('.txt') && fs.existsSync(text)) {
        text = fs.readFileSync(text, 'utf8');
    } else {
        text = text.replace(/\\n/g, '\n').replace(/¥n/g, '\n');
    }
} else if (process.env.REPLY_TEXT) {
    text = process.env.REPLY_TEXT;
}

if (!userId || !text || !agentLabel || !topicCategory || !questionBrief) {
    console.error("Usage: node reply.js <userId> <text_or_filepath.txt> <AgentLabel> <TopicCategory> <QuestionBrief>");
    console.error("⚠️ 錯誤: 您必須提供 AgentLabel (例如 '[Gemini 3.1 Pro] 測試'), TopicCategory (例如 '鉅祥') 與 問題簡述 (例如 '分析技術面')，否則無法記錄對話！");
    process.exit(1);
}

// 自動在回覆內容開頭加上 Agent 身份識別
text = `【由 ${agentLabel} 提供回覆】\n\n` + text;

// 自動存檔邏輯 (如果提供了 AgentLabel 和 TopicCategory)
if (agentLabel && topicCategory && questionBrief) {
    try {
        const desktopPath = path.join(require('os').homedir(), 'Desktop');
        const baseRecordDir = path.join(desktopPath, 'Line對話紀錄');
        if (!fs.existsSync(baseRecordDir)) fs.mkdirSync(baseRecordDir, { recursive: true });

        // 生成日期 YYYYMMDD
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        const dateStr = `${yyyy}${mm}${dd}`;
        const timeStr = `${yyyy}${mm}${dd}_${hh}${min}${ss}`;

        // 目標資料夾：[Gemini 3.1 Pro] 台股分析工具
        const safeAgentLabel = agentLabel.replace(/[<>:"/\\|?*]/g, '');
        const targetDir = path.join(baseRecordDir, safeAgentLabel);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

        // 尋找符合 TopicCategory 的 Qxxx_ 子話題資料夾
        const safeCategory = topicCategory.replace(/[<>:"/\\|?*]/g, '_');
        const safeBrief = questionBrief.replace(/[<>:"/\\|?*]/g, '_');
        
        const items = fs.readdirSync(targetDir, { withFileTypes: true });
        let maxQ = 0;
        let matchedQDir = null;
        
        items.forEach(item => {
            if (item.isDirectory()) {
                const match = item.name.match(/^Q(\d{2})_(.*)$/);
                if (match) {
                    const qSeq = parseInt(match[1], 10);
                    const qName = match[2];
                    if (qSeq > maxQ) maxQ = qSeq;
                    if (qName === safeCategory) {
                        matchedQDir = item.name;
                    }
                }
            }
        });

        let threadDirName;
        if (matchedQDir) {
            // 找到既有的話題分類資料夾
            threadDirName = matchedQDir;
        } else {
            // 開啟新話題分類
            maxQ++;
            const qStr = String(maxQ).padStart(2, '0');
            threadDirName = `Q${qStr}_${safeCategory}`;
            fs.mkdirSync(path.join(targetDir, threadDirName));
        }

        const threadDirPath = path.join(targetDir, threadDirName);

        // 計算流水號 (在話題資料夾內)
        const files = fs.readdirSync(threadDirPath).filter(f => f.endsWith('.txt'));
        let maxSeq = 0;
        files.forEach(f => {
            const match = f.match(/^(\d{3})_/);
            if (match) {
                const seq = parseInt(match[1], 10);
                if (seq > maxSeq) maxSeq = seq;
            }
        });

        const currentSeq = maxSeq + 1;
        const currentSeqStr = String(currentSeq).padStart(3, '0');

        // 檔名: 001_鉅祥_分析技術面_20260613_133554.txt
        const fileName = `${currentSeqStr}_${safeCategory}_${safeBrief}_${timeStr}.txt`;
        const filePath = path.join(threadDirPath, fileName);

        fs.writeFileSync(filePath, text, 'utf8');
        console.log(`[系統] 對話紀錄已自動保存至: ${filePath}`);

        // 自動清理專案根目錄的暫存檔
        if (process.argv[3].endsWith('.txt') && fs.existsSync(process.argv[3])) {
            fs.unlinkSync(process.argv[3]);
            console.log(`[系統] 已自動清理暫存檔: ${process.argv[3]}`);
        }
    } catch (err) {
        console.error(`[警告] 無法寫入對話紀錄: ${err.message}`);
    }
}

const req = http.request({
    hostname: 'localhost',
    port: process.env.PORT || 3000,
    path: '/api/outbox',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log(`已透過 API 將回覆寫入給 ${userId}`);
        } else {
            console.error(`API 錯誤: ${res.statusCode} ${data}`);
        }
    });
});

req.on('error', (e) => {
    console.error(`無法連線到 Bridge API: ${e.message}`);
});

req.write(JSON.stringify({ userId, text }));
req.end();
