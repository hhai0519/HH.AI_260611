# X/Twitter 平臺演算法機制調研

> 調研日期：2026-04-06
> 資料時效：覆蓋2023年首次開源至2026年1月第二次開源的完整演變
> 資訊分級：🟢 官方公佈/開原始碼可查 | 🟡 權威媒體報道/資料分析 | 🔴 社群測試推測

---

## 一、推薦演算法架構演變

### 1.1 三階段管線（Pipeline）

🟢 **來源：GitHub開原始碼**

X的推薦系統採用三階段管線架構，從2023年首次開源（`twitter/the-algorithm`）到2026年Grok版本（`xai-org/x-algorithm`）一脈相承：

| 階段 | 功能 | 技術實現 |
|------|------|----------|
| **候選獲取（Candidate Sourcing）** | 從數億帖子中篩選約1500個候選 | in-network（關注者內容）+ out-of-network（ML檢索） |
| **排序（Ranking）** | 對候選內容預測互動機率並打分 | Phoenix（Grok transformer模型） |
| **過濾與混排（Filtering & Blending）** | 去重、多樣性保障、插入廣告 | Home Mixer編排層 |

- 來源：[GitHub - xai-org/x-algorithm](https://github.com/xai-org/x-algorithm) | [GitHub - twitter/the-algorithm](https://github.com/twitter/the-algorithm)

### 1.2 Grok全面接管推薦（2025年10月→2026年1月開源）

🟢 **來源：Elon Musk推文 + GitHub釋出**

**時間線：**
- **2025年9月**：Musk宣佈「The algorithm will be purely AI by November」，承諾每兩週開源一次
- **2025年10月**：Grok開始全面替代傳統啟發式規則（heuristics）
- **2025年11月**：Following feed也改為Grok排序
- **2026年1月20日**：xAI在GitHub釋出`xai-org/x-algorithm`，Rust重寫版本正式開源

**關鍵變化：**
- 從Scala重寫為**Rust（62.9%）+ Python（37.1%）**混合架構
- 核心transformer架構來自Grok-1，適配推薦場景
- Grok會「閱讀每一條帖子、觀看每一條影片」（日處理1億+內容）
- 承諾每4周推送程式碼更新+開發者說明

- 來源：[Elon Musk推文](https://x.com/elonmusk/status/1969081066578149547) | [@XEng推文](https://x.com/XEng/status/2013471689087086804) | [TechCrunch報道](https://techcrunch.com/2026/01/20/x-open-sources-its-algorithm-while-facing-a-transparency-fine-and-grok-controversies/) | [Social Media Today](https://www.socialmediatoday.com/news/x-formerly-twitter-switching-to-fully-ai-powered-grok-algorithm/803174/)

### 1.3 四大核心模組（2026開源版）

🟢 **來源：GitHub倉庫程式碼和README**

| 模組 | 語言 | 功能 |
|------|------|------|
| **Home Mixer** | Rust | 編排層，接收gRPC請求，協調整個Pipeline |
| **Thunder** | Rust | 記憶體級帖子儲存，消費Kafka事件，提供亞毫秒級in-network內容查詢 |
| **Phoenix** | Python/JAX | Grok transformer排序引擎，預測互動機率 |
| **Candidate Pipeline** | Rust | 可複用框架：Sources獲取→Hydrators富化→Filters過濾→Scorers打分→Selector返回TopN |

- 來源：[xai-org/x-algorithm README](https://github.com/xai-org/x-algorithm/blob/main/README.md) | [Phoenix README](https://github.com/xai-org/x-algorithm/blob/main/phoenix/README.md) | [DeepWiki分析](https://deepwiki.com/xai-org/x-algorithm)

### 1.4 Promptable Feeds（可提示式Feed）

🟡 **來源：Musk推文 + 媒體報道**

使用者可以用自然語言指令調整Feed，例如輸入「Show me more tech innovations, less politics」。這是Grok直接嵌入推薦引擎的產物。

- 2025年9月Musk宣佈該功能
- 2026年1月開源版中包含promptable feeds介面
- 來源：[WebProNews](https://www.webpronews.com/xs-promptable-algorithm-musks-bid-to-hand-users-the-feed-controls/) | [Social Media Today](https://www.socialmediatoday.com/news/x-formerly-twitter-moving-to-personalized-ai-powered-algorithm/760698/)

---

## 二、互動權重公式

### 2.1 精確權重（開原始碼可查）

🟢 **來源：xai-org/x-algorithm 開原始碼 + Social Media Today確認**

X是唯一兩次開源推薦演算法的主流社交平臺，互動權重完全公開：

| 互動型別 | 權重 | 相對倍數（vs Like） | 說明 |
|----------|------|---------------------|------|
| **對話回覆**（Reply + 作者互動） | +75 | **150x** | 你的回覆被原帖作者回復/點贊 |
| **回覆（Reply）** | +13.5 | **27x** | 普通回覆 |
| **個人主頁點選** | +12.0 | **24x** | 使用者點進你的主頁並點贊或回覆 |
| **對話深入點選** | +11.0 | **22x** | 使用者點進對話並回復或點贊 |
| **停留時間（Dwell > 2min）** | +10.0 | **20x** | 使用者點進對話並停留超過2分鐘 |
| **轉發（Retweet）** | +1.0 | **2x** | 轉發 |
| **點贊（Like）** | +0.5 | **1x（基準）** | 基準值 |
| **書籤（Bookmark）** | ~+10 | **~20x** | 社群分析推測，非官方精確值 |

**核心洞察：對話深度碾壓一切。** 一條引發作者互動的回覆鏈，價值超過150個點贊。

⚠️ **關於不同版本的權重資料**：
- 2023年首次開源的權重和2026年版本略有不同
- 早期社群分析引用的「Reply 27x, Retweet 40x」等資料來自2023版本的簡化計算
- 2026版本中Retweet權重顯著降低（從~20x降至~2x），對話權重進一步提升
- 本文件以2026年開源版為準

- 來源：[Social Media Today](https://www.socialmediatoday.com/news/x-formerly-twitter-open-source-algorithm-ranking-factors/759702/) | [posteverywhere.ai原始碼分析](https://posteverywhere.ai/blog/how-the-x-twitter-algorithm-works) | [Typefully分析](https://typefully.com/blog/x-algorithm-open-source)

### 2.2 負面資訊號（懲罰機制）

🟢 **來源：開原始碼**

| 負面資訊號 | 懲罰權重 | 效果 |
|----------|----------|------|
| **舉報（Report）** | -369x | 幾乎直接移除分發 |
| **遮蔽/靜音/Show Less** | -74x | 大幅降低對該使用者的推薦 |

🟡 **來源：媒體分析**

| 負面資訊號 | 懲罰效果 |
|----------|----------|
| **外部連結** | 觸達降低30-50%；非Premium賬戶自2025年3月起連結帖中位互動為零 |
| **多於2個Hashtag** | 觸達降低約40%，被判定為spam資訊號 |
| **重複內容/連結** | 逐步降低可見度，嚴重時觸發影子封禁 |

- 來源：[posteverywhere.ai](https://posteverywhere.ai/blog/how-the-x-twitter-algorithm-works) | [Tweet Archivist](https://www.tweetarchivist.com/how-twitter-algorithm-works-2025)

---

## 三、Premium訂閱的可見性加成

### 3.1 演算法加成倍數

🟢 **來源：開原始碼確認**

| 場景 | Premium加成 | 說明 |
|------|-------------|------|
| **In-network（關注者Feed）** | **4x** | 你的帖子在關注你的人Feed中出現機率×4 |
| **Out-of-network（非關注者Feed）** | **2x** | 你的帖子在不關注你的人Feed中出現機率×2 |

### 3.2 實際效果資料

🟡 **來源：Buffer 1880萬帖分析 + 媒體報道**

- Premium賬戶每帖觸達量約為普通賬戶的**10倍**
- Premium+賬戶在2025年後差距進一步拉大
- Premium回覆在熱門帖子討論中預設排位更高（Q1 2026資料顯示高30-40%回覆曝光）
- 非Premium賬戶發外部連結的帖子，自2026年3月起中位互動為零

### 3.3 TweepCred與Premium的關係

🟡 **來源：Circleboom分析**

Premium訂閱者獲得即時+100 TweepCred加成，從-128起步變為-28起步，大幅縮短賬號冷啟動期。

- 來源：[Circleboom](https://blog-content.circleboom.com/does-x-premium-boost-algorithm/) | [posteverywhere.ai](https://posteverywhere.ai/blog/how-the-x-twitter-algorithm-works) | [Buffer資料](https://buffer.com/resources/data-best-content-format-social-media/)

---

## 四、TweepCred 賬戶資訊譽評分

🟢 **來源：開原始碼中的TweepCred模組**

### 4.1 基本機制

- 每個X賬戶都有一個不可見的資訊譽分：**TweepCred**
- 範圍：**-128 到 +100**
- 新賬戶起始值：**-128**
- 正常分發最低門檻：**+17**（低於此值內容被限流）
- Premium訂閱者即時獲得**+100加成**

### 4.2 影響因素

🟡 **來源：社群逆向分析**

TweepCred是類PageRank加權複合分，由以下因素決定：

| 因素 | 方向 |
|------|------|
| 關注/粉絲比例 | 關注遠多於粉絲→負面 |
| 互動質量 | 高質量對話→正面 |
| 賬戶歷史 | 老賬戶+一致行為→正面 |
| 推文語言和Bio | 完整Profile→正面 |
| 發帖風格一致性 | 突然大幅改變→負面 |
| **Grok語氣評分（2025新增）** | 正面/建設性內容→正面 |

⚠️ **2025年新變化**：Grok AI現在會對每條帖子的**語氣（sentiment）**進行評分，正面、有建設性的內容獲得更多分發。

- 來源：[Circleboom TweepCred分析](https://circleboom.com/blog/tweepcred-what-it-is-why-it-matters-and-how-to-increase-your-score-on-x-twitter/) | [Radaar](https://www.radaar.io/resources-121/blog-388/are-you-ready-to-discover-the-hidden-x-algorithm-secrets-behind-tweepcred-shadow-hierarchy-and-dwell-time-in-2025-15361/)

---

## 五、內容型別待遇

### 5.1 文字 vs 影片：X是唯一文字碾壓影片的平臺嗎？

🟡 **來源：Buffer 4500萬+帖分析 + 多家媒體**

**結論：情況比較複雜，資料存在矛盾。**

| 資料來源 | 結論 |
|----------|------|
| Buffer 2025-2026資料 | 文字帖中位互動率（0.48%）略高於影片 |
| 多家SEO/營銷機構 | 原生影片獲得約10x更多互動+演算法偏好分發 |
| 2026社媒策略報告 | 短影片（37%）和文字（36%）使用者偏好幾乎持平 |

**更準確的說法**：X是主流社交平臺中**文字帖子表現最接近甚至超過影片的平臺**，但不能簡單說「文字碾壓影片」。演算法層面，原生影片確實獲得分發加權；但在實際互動率上，高質量文字帖表現不輸影片。

### 5.2 各內容型別演算法偏好

🟡 **來源：綜合多個分析**

| 內容型別 | 演算法待遇 |
|----------|----------|
| **純文字帖** | 互動率穩定最高，尤其適合引發對話 |
| **原生影片（<2:20）** | 獲得分發加權，完播率是關鍵資訊號 |
| **圖片帖** | 增加停留時間（dwell time），正面資訊號 |
| **外部連結帖** | ⚠️ 嚴重懲罰：觸達降低30-50%，非Premium幾乎不可見 |
| **引用轉發（Quote Tweet）** | 比普通轉發權重更高 |
| **Thread（長推文串）** | 多條互動累積，整體效果好 |

- 來源：[Buffer](https://buffer.com/resources/data-best-content-format-social-media/) | [Sprout Social](https://sproutsocial.com/insights/twitter-algorithm/) | [SocialBee](https://socialbee.com/blog/twitter-algorithm/)

---

## 六、關鍵時間視窗

### 6.1 黃金30分鐘與互動速度（Engagement Velocity）

🟡 **來源：多家分析機構共識**

- **前30分鐘**是決定性視窗：這段時間的互動速度決定演算法是否推入更大流量池
- 更廣義的**前2小時**也很關鍵
- **速度 > 總量**：10分鐘內獲得100個贊 > 3天累積500個贊
- 演算法核心邏輯：早期互動 = 質量認證（quality stamp）

### 6.2 停留時間（Dwell Time）

🟢 **來源：開原始碼中的權重定義**

- 使用者在你的帖子/對話上停留超過2分鐘 = +10權重（約20x Like）
- 短停留時間被視為低質量內容，導致演算法抑制
- 這意味著**讓人想讀完的長文**比**一劃而過的短內容**更受演算法青睞

### 6.3 最佳發帖時間

🟡 **來源：Buffer 100萬帖分析 + Sprout Social + SocialPilot 5萬賬戶分析**

| 維度 | 建議 |
|------|------|
| **最佳時段** | 工作日 9AM-2PM（當地時間），次優 12PM-6PM |
| **最佳日期** | 週二、週三、週四（週二最佳） |
| **最差日期** | 週六 |
| **發帖頻率** | **3-5條/天**為最優區間，間隔2-3小時 |
| **頻率上限** | >5條/天增長反而放緩 |
| **頻率下限** | <1條/天增長顯著不足 |

⚠️ 以上為全球英文使用者資料。中文創作者需根據目標受眾時區調整（如面向中國讀者，對應北京時間約 9PM-2AM EST）。

- 來源：[Buffer](https://buffer.com/resources/best-time-to-post-on-twitter-x/) | [Sprout Social](https://sproutsocial.com/insights/best-times-to-post-on-twitter/) | [SocialPilot](https://www.socialpilot.co/insights/best-time-to-post-on-twitter) | [Tweet Archivist](https://www.tweetarchivist.com/twitter-posting-frequency-guide-2025)

---

## 七、影子封禁（Shadow Ban）

### 7.1 四種型別

🟡 **來源：shadowban檢測工具 + 社群分析**

| 型別 | 表現 |
|------|------|
| **Search Suggestion Ban** | 使用者名不出現在搜尋建議中 |
| **Search Ban** | 帖子不出現在搜尋結果中 |
| **Ghost Ban** | 回覆對他人不可見 |
| **Reply Deboosting** | 回覆被摺疊到「Show more replies」中 |

### 7.2 觸發條件

🟡 **來源：Pixelscan + 多家指南**

| 行為 | 風險等級 |
|------|----------|
| 短時間大量關注/取關 | 🔴 高（大量取關可觸發3個月shadowban） |
| 1小時內點贊200+帖 | 🔴 高（自動化檢測） |
| 大量回復不關注的人 | 🟡 中 |
| 重複發相同連結/hashtag | 🟡 中 |
| 使用可疑第三方工具 | 🔴 高 |
| 釋出被多人舉報的內容 | 🔴 高（-369x懲罰） |

### 7.3 檢測方法

- 線上工具：[shadowban.yuzurisa.com](https://shadowban.yuzurisa.com/) 輸入使用者名即可檢測4種限制
- 人工驗證：讓不關注你的人搜尋你的使用者名或查詢你的回覆

### 7.4 恢復方法

🟡 **來源：多家指南共識**

1. **立即停止**觸發行為（不是逐漸減少，是完全停止）
2. 刪除重複、低質量、含過多連結/hashtag的帖子
3. 斷開可疑第三方應用授權
4. **等待48-72小時**（自動shadowban通常在此期間解除）
5. 完整恢復週期：**2-14天**
6. 恢復期間保持正常、低頻、高質量發帖

- 來源：[Pixelscan指南](https://pixelscan.net/blog/twitter-shadowban-2025-guide/) | [Tweet Archivist](https://www.tweetarchivist.com/twitter-shadowban-complete-guide-2025) | [Multilogin](https://multilogin.com/blog/twitter-shadow-bans/)

---

## 八、廣告與有機增長的關係

### 8.1 付費 vs 有機表現

🟡 **來源：WebFX + 媒體報道**

| 指標 | 付費推廣 | 有機發帖 |
|------|----------|----------|
| 平均CTR | 1-3% | 0.5-1.5% |
| Premium賬戶觸達 | — | 普通賬戶的~10x |
| 非Premium連結帖互動 | — | 0（2026年3月後） |

### 8.2 關鍵發現

🟡 **來源：多家分析**

- 付費和有機演算法**獨立執行**，不存在「花錢就降有機流量」的懲罰
- 但結構性趨勢是：有機觸達持續下降（全平臺現象，不只X）
- 透過廣告獲得的新關注者**會影響**後續有機帖子的表現（更多關注者→更多in-network分發）
- Premium訂閱本質上是**最低成本的「廣告投放」**：4x/2x可見性加成遠超同等價格的廣告效果

- 來源：[WebFX](https://www.webfx.com/blog/social-media/x-twitter-marketing-benchmarks/) | [Avenue Z](https://avenuez.com/blog/2025-2026-x-twitter-organic-social-media-guide-for-brands/)

---

## 九、Community Notes 的影響

### 9.1 對帖子表現的影響

🟢 **來源：華盛頓大學研究（2025年9月）**

| 指標 | 獲得Community Note後變化 |
|------|--------------------------|
| 轉發量 | **下降46%** |
| 點贊量 | **下降44%** |
| 瀏覽量 | 影響較小（Feed演算法不會主動降權有Note的帖子） |

### 9.2 關鍵細節

- X**不會**在演算法層面主動降低有Community Note帖子的分發
- 下降主要來自**使用者行為改變**：看到Note後使用者減少轉發和點贊
- Note的**時效性**至關重要：48小時後才新增的Note幾乎沒有效果（內容已傳播完畢）
- 對**篡改媒體**（假照片/影片）的Note效果最大

### 9.3 對創作者的啟示

🔴 **推測/策略建議**

- 釋出可能引發爭議的事實性宣告時，確保有來源
- Community Note不直接降演算法權，但**間接殺死互動**（轉發-46%）
- 被標註Note的帖子雖然瀏覽量不變，但傳播力腰斬
- 建設性、有來源的內容不太會被標註

- 來源：[華盛頓大學研究](https://www.washington.edu/news/2025/09/18/community-notes-x-false-information-viral/) | [Wikipedia - Community Notes](https://en.wikipedia.org/wiki/Community_Notes)

---

## 十、對內容創作者的核心啟示

### 10.1 演算法最佳化優先順序（按ROI排序）

| 優先順序 | 策略 | 依據 |
|--------|------|------|
| **P0** | 引發對話、回覆每條評論 | 對話回覆150x權重 |
| **P0** | 訂閱Premium | 4x/2x可見性+TweepCred加成+連結帖可見性 |
| **P1** | 前30分鐘互動引爆 | 互動速度決定分發量 |
| **P1** | 寫讓人停下來讀的長文 | Dwell Time 20x權重 |
| **P2** | 工作日9AM-2PM發帖 | 資料驗證的最佳時段 |
| **P2** | 避免外部連結（或放評論區） | 30-50%觸達懲罰 |
| **P3** | 保持正面/建設性語氣 | Grok語氣評分影響分發 |
| **P3** | 控制Hashtag≤2個 | >2個觸發spam判定 |

### 10.2 絕對禁區

| 行為 | 後果 |
|------|------|
| 短時間大量關注/取關 | 3個月shadowban |
| 使用自動化工具刷互動 | 賬號資訊譽永久受損 |
| 頻繁發外部連結（非Premium） | 帖子幾乎不可見 |
| 釋出被舉報內容 | -369x懲罰，內容直接消失 |
| 突然改變發帖模式 | TweepCred下降 |

### 10.3 X獨特優勢（相比其他平臺）

- **唯一兩次開源演算法的主流平臺**：可以精確最佳化
- **文字內容友好**：不像其他平臺逼你做影片
- **對話驅動**：真正獎勵深度交流而非表面互動
- **Promptable Feeds**：使用者可自定義推薦，意味著高質量垂直內容有長尾價值

---

## 附錄：資訊源清單

### 官方/一手來源
- [xai-org/x-algorithm GitHub](https://github.com/xai-org/x-algorithm) — 2026年1月開源的Grok版演算法
- [twitter/the-algorithm GitHub](https://github.com/twitter/the-algorithm) — 2023年首次開源版本
- [Elon Musk推文（2025.09）](https://x.com/elonmusk/status/1969081066578149547) — 宣佈演算法將純AI化
- [@XEng推文（2026.01）](https://x.com/XEng/status/2013471689087086804) — 宣佈開源新演算法

### 權威媒體報道
- [TechCrunch: X open sources its algorithm](https://techcrunch.com/2026/01/20/x-open-sources-its-algorithm-while-facing-a-transparency-fine-and-grok-controversies/)
- [Social Media Today: Key ranking factors](https://www.socialmediatoday.com/news/x-formerly-twitter-open-source-algorithm-ranking-factors/759702/)
- [Social Media Today: Grok algorithm shift](https://www.socialmediatoday.com/news/x-formerly-twitter-switching-to-fully-ai-powered-grok-algorithm/803174/)

### 資料分析
- [Buffer: Best content format 2026（4500萬+帖分析）](https://buffer.com/resources/data-best-content-format-social-media/)
- [Buffer: Best time to post（100萬帖分析）](https://buffer.com/resources/best-time-to-post-on-twitter-x/)
- [Sprout Social: Twitter algorithm 2026](https://sproutsocial.com/insights/twitter-algorithm/)
- [華盛頓大學: Community Notes研究](https://www.washington.edu/news/2025/09/18/community-notes-x-false-information-viral/)

### 社群深度分析
- [posteverywhere.ai: 原始碼解讀](https://posteverywhere.ai/blog/how-the-x-twitter-algorithm-works)
- [Typefully: 演算法更新分析](https://typefully.com/blog/x-algorithm-open-source)
- [Circleboom: TweepCred深度解讀](https://circleboom.com/blog/tweepcred-what-it-is-why-it-matters-and-how-to-increase-your-score-on-x-twitter/)
- [nibzard: Rust+Python架構分析](https://nibzard.github.io/twitter-algorithm-tufte/)
- [ByteByteGo: 演算法架構圖解](https://blog.bytebytego.com/p/the-algorithm-that-powers-your-x)
- [Pixelscan: Shadowban指南](https://pixelscan.net/blog/twitter-shadowban-2025-guide/)
- [DeepWiki: x-algorithm倉庫分析](https://deepwiki.com/xai-org/x-algorithm)


