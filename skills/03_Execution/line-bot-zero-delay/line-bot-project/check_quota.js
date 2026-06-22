require('dotenv').config();
const axios = require('axios');

const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

async function checkQuota() {
  try {
    const [quotaRes, consumptionRes] = await Promise.all([
      axios.get('https://api.line.me/v2/bot/message/quota', { headers: { 'Authorization': `Bearer ${token}` } }),
      axios.get('https://api.line.me/v2/bot/message/quota/consumption', { headers: { 'Authorization': `Bearer ${token}` } })
    ]);
    
    const quotaType = quotaRes.data.type;
    const quotaValue = quotaRes.data.value;
    const totalUsage = consumptionRes.data.totalUsage;
    
    let msg = '';
    if (quotaType === 'none') {
      msg = `📊 【LINE 訊息額度狀態】\n目前為無上限方案\n已使用則數：${totalUsage} 則`;
    } else {
      const remaining = quotaValue - totalUsage;
      msg = `📊 【LINE 訊息額度狀態】\n本月額度上限：${quotaValue} 則\n已使用則數：${totalUsage} 則\n剩餘額度：${remaining} 則`;
    }
    console.log(msg);
  } catch (e) {
    console.error('查詢額度失敗：', e.response ? e.response.data : e.message);
  }
}

checkQuota();
