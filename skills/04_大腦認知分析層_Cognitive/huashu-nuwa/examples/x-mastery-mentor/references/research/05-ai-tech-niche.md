# AI/科技賽道 X/Twitter 內容策略調研

> 調研時間：2026-04-06
> 調研範圍：AI/tech KOL內容策略、build in public、演算法機制、開源推廣、中國開發者出海
> 資訊源黑名單：知乎、微資訊公眾號、百度百科

---

## 一、AI/科技賽道的核心賬號與策略分型

### 1.1 賬號分型矩陣

| 型別 | 代表賬號 | 核心策略 | 粉絲量級 |
|------|---------|---------|---------|
| **Build in Public型** | @levelsio (Pieter Levels) | 公開收入、每日更新、失敗覆盤 | 500K+ |
| **Learn in Public型** | @swyx (Shawn Wang) | 學習筆記公開化、給feedback | 100K+ |
| **技術教育型** | @karpathy (Andrej Karpathy) | 深入淺出解釋AI概念、教程影片 | 1M+ |
| **AI Agent/工具型** | @steipete (Peter Steinberger) | 產品迭代實況、技術觀點輸出 | 200K+ |
| **開源專案型** | @ExaAILabs (Exa) | 病毒式副產品營銷、API展示 | 50K+ |
| **AI新聞聚合型** | @AIHighlight | 每日工具推薦、新模型速報 | 100K+ |

> 來源：一手觀察（X賬號主頁） + [Amperly: 31 Best AI Twitter Accounts 2026](https://amperly.com/best-artificial-intelligence-twitter-accounts/) + [X帖子: Future Stacked AI賬號推薦](https://x.com/FutureStacked/status/2018353141465440693)

### 1.2 關鍵人物深度拆解

#### Pieter Levels (@levelsio) — Build in Public教父

**內容組成**（一手觀察）：
- **收入里程碑推文**：每達到新MRR就發Stripe截圖。如 "$10K MRR after 3 weeks with 318 customers" → 大量轉發
- **技術決策實況**：試新模型（如Flux）、A/B測試結果、landing page轉化率（1% → 4%）
- **失敗透明化**：公開提到97%的專案都失敗了
- **跨專案複製**：公開分享他如何在專案間copy-paste策略

**關鍵資料**：
- 當前月收入 ~$138K/month（2025年11月資料）
- PhotoAI佔收入70%（$106K/m），其餘包括InteriorAI、RemoteOK等
- 一條TikTok為PhotoAI增加了$7,000 MRR/天

**策略精髓**：Build in Public不是「分享進度」，是「讓觀眾成為利益相關者」。觀眾看著你從0到$100K MRR，會產生投資人心態——他們希望你成功，因此主動傳播。

> 來源：[FastSaaS: How Pieter Levels Built a $3M/Year Business](https://www.fast-saas.com/blog/pieter-levels-success-story/) + [X: @levelsio PhotoAI $10K MRR](https://x.com/levelsio/status/1631715500010135552) + [X: @levelsio PhotoAI $150K/mo](https://x.com/levelsio/status/1850305637303160853)

#### swyx (@swyx) — Learn in Public + Pick Up What They Put Down

**核心理念**：
1. **Learn in Public**：不要私下學習然後潛水。寫部落格、做教程、在論壇提問和回答、做YouTube——創造「學習廢氣」(learning exhaust)
2. **Pick Up What They Put Down**：行業大佬釋出了新東西，但缺乏反饋。你寫評測/解讀/教程，tag他們——他們會轉發你，因為「別人誇我的工作，我可以轉發一整天」
3. **Macro-tweeting**：定期翻出自己的舊推文，尤其是那些「說對了」的預測

**實際操作**：
- 日更AI newsletter（Latent Space），Twitter是他的「公開筆記本」
- 推文因為他需要公開筆記，newsletter因為他需要可搜尋的AI新聞資料庫，圖表因為他需要解釋概念——**受眾獲益是副產品**
- 發明了「AI Engineer」這個角色定義

**對花叔的啟示**：swyx的策略特別適合有深度但非原始研究者的人。核心是：**你不需要發明新東西，你需要把別人發明的東西解釋清楚，並標記原作者**。

> 來源：[swyx.io: Learn in Public](https://www.swyx.io/learn-in-public) + [swyx.io: Pick Up What They Put Down](https://www.swyx.io/puwtpd) + [swyx.io: How to Thought Lead (2026)](https://www.swyx.io/lead)

#### Andrej Karpathy (@karpathy) — 技術教育型標杆

**內容特徵**（一手觀察）：
- 不追熱點，但每次發帖都是深度內容
- 承認自己不知道的東西，分享學習困難
- 用教育影片（YouTube: Zero-to-Hero AI系列）建立長期資產
- 創辦Eureka Labs（AI原生教育公司），將Twitter教育內容產品化

**為什麼有效**：低頻高質 + 費曼式解釋能力。當Karpathy發帖時，整個AI社群都在看，因為他從不發噪音。

> 來源：[X: @karpathy](https://x.com/karpathy) + [karpathy.ai](https://karpathy.ai/) + [Karpathy個人AI知識庫三資料夾方法](https://www.digitaltoday.co.kr/en/view/45521/karpathy-reveals-personal-ai-knowledge-base-built-with-three-folders)

#### Peter Steinberger (@steipete) — 從iOS老兵到AI Agent先鋒

**轉型路徑**：13年iOS原生開發（PSPDFKit創始人）→ 2025年vibe coding → OpenClaw（開源AI Agent）→ 2026年加入OpenAI

**內容策略**：
- 坦誠分享技術觀點（如「Vibe Coding是一個貶義詞」——實際上用AI做東西是需要技能的）
- 公開分享OpenClaw的開發實況（如「昨天一天600 commits，PR從2700漲到3100」）
- 加入OpenAI後成為「內部人+外部發聲者」雙重身份

> 來源：[OpenClawAI Blog: Vibe Coding Is a Slur](https://openclawai.io/blog/openclaw-creator-advice-playful-building/) + [X: @steipete joining OpenAI](https://x.com/steipete/status/2023154018714100102)

---

## 二、X/Twitter 2026演算法機制（AI/科技賽道必知）

### 2.1 三階段排名管線

1. **候選篩選**：從每日5億推文中為每位使用者篩出~1,500條候選（50%關注內、50%關注外）
2. **機器學習排名**：神經網路分析數千特徵，輸出10個機率標籤
3. **Grok驅動更新**（2026年1月）：transformer模型閱讀每條帖子和影片，每天做50億次排名決策

### 2.2 資訊號權重公式

| 互動型別 | 權重 | 對比倍數（vs 點贊） |
|---------|------|-------------------|
| 點贊 | x1 | 1x |
| 書籤 | x10 | 10x |
| 連結點選 | x11 | 11x |
| 主頁點選 | x12 | 12x |
| 回覆 | x13.5 | 13.5x |
| 轉發 | x20 | 20x |
| **對話（回覆+作者回復）** | **x75** | **150x** |

**關鍵洞察**：一次有質量的對話 = 150個點讚的演算法價值。這解釋了為什麼AI/tech KOL都積極回覆評論。

### 2.3 AI/科技賽道特有的演算法要點

**參與速度（Engagement Velocity）是最強資訊號**：
- 前15-30分鐘的互動決定一切
- 15分鐘內獲得10+互動 → 指數級擴散
- 15分鐘內<3互動 → 推文死亡
- **對策**：在你的受眾最活躍的時段發帖（對AI/tech全球受眾：Pacific Time 8-10 AM，即北京時間深夜23-01點）

**時間衰減**：每6小時可見性減半。AI新聞有時效性，快速響應至關重要。

**外部連結懲罰**：
- 連結推文觸達降低30-50%（非Premium使用者接近零參與）
- **解法**：主推文不放連結，第一條回覆放連結
- 2026年3月後，Premium使用者的連結懲罰基本取消

**X Premium加成**：付費使用者獲得2-4倍觸達加成。對於認真做X的人來說，這是必要投資。

> 來源：[PostEverywhere: How X Algorithm Works 2026](https://posteverywhere.ai/blog/how-the-x-twitter-algorithm-works) + [Teract: Twitter Algorithm 2026 Deep Dive](https://www.teract.ai/resources/twitter-algorithm-2026) + [Sprout Social: Twitter Algorithm 2026](https://sproutsocial.com/insights/twitter-algorithm/)

---

## 三、AI/科技賽道特有的內容策略

### 3.1 內容型別與效果矩陣

| 內容型別 | 參與度 | 頻率建議 | 例子 |
|---------|--------|---------|------|
| **新模型/產品速評** | 極高 | 有熱點就發 | "GPT-5.3釋出，我測了3個場景..." |
| **Build in Public更新** | 高 | 每週2-3次 | MRR截圖、功能上線、使用者反饋 |
| **技術Tutorial/Thread** | 高 | 每週1次 | 8-12條推文的教程thread |
| **Demo影片/GIF** | 高 | 有成果就發 | 15-30秒產品演示 |
| **Hot Take/爭議觀點** | 中-高 | 謹慎使用 | "Vibe coding is a slur" |
| **論文解讀Thread** | 中 | 每週1次 | 用簡單語言拆解關鍵發現 |
| **工具對比/評測** | 中 | 每月2-3次 | 截圖+測試結果表格 |
| **個人故事/感悟** | 中 | 偶爾穿插 | 創業心路、轉型經歷 |
| **Meme/幽默** | 波動大 | 謹慎 | AI相關梗圖 |

### 3.2 新模型釋出：快速響應策略

AI賽道最獨特的機會視窗是**新模型釋出**（如GPT-5、Claude Opus、DeepSeek等）。這是區別於其他科技領域的核心特徵。

**響應時間線**：
1. **釋出後0-1小時**：發Quick Take（最初反應 + 一個鮮明觀點）
2. **釋出後1-6小時**：發Demo/測試結果（截圖 + GIF）
3. **釋出後6-24小時**：發深度Thread（系統測試 + 對比 + 觀點）
4. **釋出後1-7天**：發深度文章/影片（完整評測 + 實戰案例）

**OpenAI的做法**（值得參考）：Sam Altman在釋出後幾分鐘內發推問使用者「你們想用它做什麼？」——讓社群自己生產內容，而非單方面推廣。

> 來源：[FutureSocial: How OpenAI Used Twitter Replies to Create Launch Content](https://futuresocial.beehiiv.com/p/openai-used-twitter-replies-create-launch-content) + 一手觀察

### 3.3 Build in Public具體操作手冊

**分享什麼**：
- MRR里程碑 + Stripe截圖（用 [BrandBird MRR Meter](https://www.brandbird.app/tools/twitter-mrr-meter) 生成標準化圖片）
- 功能上線 + Demo截圖/影片
- 失敗覆盤（post-mortem）
- 技術棧選擇和決策理由
- 使用者反饋截圖
- 月度/季度總結Thread

**不分享什麼**：
- 精確的獲客成本（CAC）和單位經濟（競爭敏感）
- 客戶個人資訊
- 核心競爭優勢的具體實現細節

**格式技巧**：
- Thread開頭用Hook：「Week 12 of building [Product]: Hit $2K MRR...」
- Thread結尾用CTA：「Follow along for weekly updates」
- 視覺內容獲得5x更多參與
- 每條回覆1小時內回覆

**案例資料**：
- AudioPen：12小時建成 → 2天100付費使用者 → Product Hunt #1 → 前2月$73K收入
- SiteGPT：Twitter 24K+粉絲 → Product Hunt #1 → 6月$15K MRR → $95K MRR
- 一位indie hacker：4個月Twitter增長到2,400粉絲 → 產品釋出即$8K MRR

> 來源：[OpenTweet: Build in Public Guide](https://opentweet.io/blog/build-in-public-twitter-guide-saas-founders) + [Teract: Twitter Strategy for Indie Hackers 2026](https://www.teract.ai/resources/twitter-strategy-indie-hackers-2026) + [AudioPen Starter Story](https://www.starterstory.com/stories/audiopen) + [SiteGPT Rise to $15K MRR](https://www.indiehackers.com/post/from-side-hustle-to-ai-star-sitegpts-rise-to-15k-mrr-ff15fee186)

### 3.4 Thread寫作最佳實踐

**資料支撐**：8-12條推文的Thread比短Thread表現高47%（Sprout Social 2026資料）。Thread整體比單推獲得3-5x更多參與。

**結構模板**（AI/tech適用）：

```
推文1（Hook）：一個驚人資料/反直覺觀點 + 「Thread」
推文2-3：背景和問題定義
推文4-8：核心論證/步驟/發現
推文9-10：實際操作/程式碼/截圖
推文11：總結 + 關鍵啟示
推文12：CTA（關注/書籤/轉發請求）
```

**AI賽道特有的Thread型別**：
1. **「我測了X，結果令人驚訝」**型：新模型/工具的實測Thread
2. **「從0到$XK MRR的N個教訓」**型：Build in Public總結
3. **「這篇論文改變了我的認知」**型：論文解讀
4. **「X vs Y：深度對比」**型：工具/模型橫評
5. **「我用AI做了X，省了N小時」**型：實戰案例

> 來源：[AI Free Forever: 15 Best Viral Threads 2026](https://aifreeforever.com/blog/15-best-twitter-thread-examples-that-went-viral) + [Teract: Twitter Algorithm 2026](https://www.teract.ai/resources/twitter-algorithm-2026)

---

## 四、視覺內容策略（程式碼截圖、GIF、影片Demo）

### 4.1 各內容格式效果對比

| 格式 | 參與率 | 最佳時長/尺寸 | 適用場景 |
|------|--------|-------------|---------|
| 純文字 | 0.1% | 120-130字元最佳 | 觀點、hot take |
| 圖片/截圖 | 0.08% | 16:9橫版 | 程式碼截圖、資料表格 |
| GIF | 中等 | 3-8秒迴圈 | 功能演示、互動效果 |
| 影片 | 0.42% | 15-30秒 | 產品Demo、教程 |
| Thread | 3-5x單推 | 8-12條 | 深度內容、教程、評測 |

**注意**：X是唯一一個文字表現不輸影片的主要平臺。但影片的0.42%參與率遠高於圖片的0.08%。

### 4.2 程式碼截圖工具與技巧

- **[Snappify](https://snappify.com/)**：建立精美程式碼展示圖，可新增頭像和使用者名
- **[Pika](https://pika.style/templates/code-image)**：生成程式碼截圖，支援多種主題
- **[Codeshot](https://codeshotapp.com/)**：選擇主題、匯出Twitter尺寸

**關鍵原則**：
- 程式碼截圖要突出關鍵行，不要貼整頁程式碼
- 新增註釋/高亮標記重點
- 第一幀當成Billboard——加粗文字、高對比、清晰承諾

### 4.3 影片Demo最佳實踐

- **16:9橫版**最適合Demo和螢幕錄製
- **15-30秒**是最佳時長（最大化完播率）
- **假設觀眾靜音觀看**：關鍵資訊用字幕呈現
- **第一幀即封面**：在資訊流中起到Billboard作用
- **發主影片後，回覆Thread**補充要點、時間戳、連結

> 來源：[ScriptStorm: Twitter Video Best Practices](https://scriptstorm.ai/blog/twitter-video-best-practices-length-format-engagement) + [Snappify](https://snappify.com/) + [Codeshotapp](https://codeshotapp.com/posts/how-to-share-code-on-twitter/)

---

## 五、開源專案推廣策略

### 5.1 Twitter/X推廣關鍵操作

1. **GitHub Social Preview**：在repo設定中上傳精美宣傳圖，讓分享連結更醒目（很多專案忽略這個）
2. **持續發聲**：主要策略就是keep yapping——發小更新、coding旅程、技術決策
3. **Listicle互標策略**：寫包含同類專案的列表文章，發Twitter時tag各維護者——他們會點贊/轉發
4. **Awesome列表**：向GitHub上的awesome-xxx列表提交PR
5. **多平臺釋出**：週二至週四 Pacific Time 8-10 AM 釋出，針對各平臺調整文案

**核心發現**：推文對獲得新Star和新貢獻者有顯著正效應。活躍的Twitter社群在吸引新貢獻者中扮演重要角色（學術論文驗證）。

### 5.2 病毒式副產品策略：Exa的Twitter Wrapped

**案例**：Exa（AI搜尋引擎）透過「Twitter Wrapped」工具獲得170萬使用者。

**做法**：
- 12月26日釋出：AI分析使用者的X賬號，生成個性化年度總結、吐槽、未來預測
- 4小時內50萬瀏覽
- 4天后：59,000轉發、1360萬瀏覽

**為什麼成功**：與Spotify Wrapped同理——**天然可分享的個性化內容**。使用者分享自己的結果 → 朋友好奇 → 也去生成 → 迴圈傳播。

**啟示**：AI產品可以透過構建一個**免費的、個性化的、可分享的副產品**來獲取病毒式傳播。不需要產品本身viral，需要一個viral的入口。

> 來源：[Indie Hackers: Exa Twitter Wrapped](https://www.indiehackers.com/post/tech/exa-an-ai-powered-search-engine-gains-1-7m-users-with-viral-twitter-wrapped-vUAEDrWM4ELz5UHcbyjG) + [DEV: Promoted Open Source Repo to 6K Stars](https://dev.to/wasp/how-i-promoted-my-open-source-repo-to-6k-stars-in-6-months-3li9) + [FreeCodeCamp: 4.5K Stars in 6 Months](https://www.freecodecamp.org/news/how-to-get-more-engagement-with-your-open-source-project/) + [arXiv: Impact of Twitter Mentions on GitHub](https://arxiv.org/html/2401.02755)

---

## 六、中國AI開發者出海X策略

### 6.1 成功案例

**Han Xiao (@hanaborxiao) — Jina AI創始人**：
- 在騰訊AI後2020年創立Jina AI，總部柏林，研發中心跨舊金山、北京、深圳
- 2025年被Elastic收購
- 策略：英文內容為主、開源社群運營、全球會議演講
- 活躍於LF AI Foundation董事會，透過開源建立國際資訊任

**DeepSeek團隊**：
- 創始人梁文鋒極其低調，幾乎不用社交媒體
- 但DeepSeek的技術論文在X上被大量討論（他人代傳播）
- 證明：**產品本身足夠好時，社群會為你傳播**

### 6.2 中國開發者的特殊挑戰與策略

1. **語言障礙**：英文寫作是必須跨越的門檻，但不需要完美——AI賽道對非母語者更包容
2. **時區差異**：發帖時間需要適配北美/歐洲受眾（Pacific Time 8-10 AM）
3. **資訊任建設**：開源貢獻是最好的國際資訊任資產
4. **內容差異化**：中國AI生態的一手資訊（如DeepSeek技術細節、國內AI應用場景）對國際受眾有獨特價值
5. **雙語策略**：中英文分開運營，不混用

> 來源：[Han Xiao Bio](https://hanxiao.io/about/) + [AI Berlin: Interview Han Xiao](https://ai-berlin.com/blog/article/interview-with-dr-han-xiao-ceo-and-co-founder-of-jina-ai) + [Nature: How China Created DeepSeek](https://www.nature.com/articles/d41586-025-00259-0) + 一手觀察

---

## 七、AI/科技賽道選題分類與轉化路徑

### 7.1 十大選題型別（按參與度排序）

1. **新模型/新功能速評**：第一時間測試+觀點（參與度最高，時效視窗最短）
2. **Build in Public里程碑**：MRR截圖、使用者數突破（高參與+高資訊任建設）
3. **實戰教程Thread**：「如何用X做Y」（高儲存率，長尾流量好）
4. **工具對比橫評**：「Claude vs GPT vs Gemini在X場景下的表現」（高搜尋價值）
5. **Hot Take/爭議觀點**：「Vibe coding is a slur」（高討論，有風險）
6. **個人失敗/教訓**：「我做了X，虧了Y」（高共鳴，建立真實性）
7. **論文解讀**：用簡單語言拆解（中等參與，高專業度資訊號）
8. **資源彙總**：「10個最好的X工具」（高儲存率）
9. **行業趨勢預測**：「2026年AI的5個趨勢」（波動大，正確了則回報高）
10. **Meme/幽默內容**：AI相關梗（低門檻傳播，但不建立專業度）

### 7.2 內容到轉化路徑

```
X推文/Thread → 個人品牌認知
    |
Blog/Newsletter（深度內容）→ 郵件列表
    |
Product Hunt/GitHub Launch → 使用者獲取
    |
付費產品/諮詢/課程 → 收入
```

**關鍵節點**：X上的內容不直接轉化，而是建立資訊任和受眾。轉化發生在深度內容（newsletter、blog）和產品釋出環節。

---

## 八、戰術速查卡

### 8.1 發帖節奏

| 內容型別 | 頻率 | 時間 |
|---------|------|------|
| 日常推文（觀點、小更新） | 每天3-5條 | 間隔2-3小時 |
| Thread（深度內容） | 每週1-2次 | 週二-週四 |
| 回覆他人 | 佔70%發帖量 | 全天 |
| 新模型速評 | 有就發 | 釋出後1小時內 |

### 8.2 增長公式

**0-1K粉絲階段**：
- 70%精力在回覆，30%在發帖
- 回覆行業大號的推文，提供有價值的補充
- swyx的PUWTPD策略：為大佬的新作品寫評測/教程

**1K-10K粉絲階段**：
- 建立內容支柱（3-5個固定主題）
- 每週1-2個Thread建立專業度
- 開始Build in Public

**10K+粉絲階段**：
- Newsletter/Blog建立深度內容資產
- 產品釋出利用已有受眾
- 開始有選擇地做合作推廣

### 8.3 AI賽道特有的增長駭客

1. **新模型釋出日是你的超級碗**：所有人都在刷AI新聞，你的相關內容天然有流量
2. **免費工具 = 獲客入口**：Exa的Twitter Wrapped，Pieter的各種免費AI toy
3. **開源 = 資訊任加速器**：開源專案在X上獲得的資訊任遠超閉源產品
4. **截圖 > 描述**：永遠用視覺證據（Stripe截圖、產品Demo、程式碼結果）
5. **Thread是你的長文武器**：X上的Thread等於其他平臺的blog文章
6. **回覆是最被低估的增長槓桿**：一條好回覆的演算法權重 = 13.5個點贊

---

## 九、區別於通用Twitter策略的AI/科技賽道特性

| 維度 | 通用Twitter | AI/科技賽道 |
|------|------------|------------|
| **時效性** | 可以提前排期 | 新模型釋出需要小時級響應 |
| **內容深度** | 短平快為主 | Thread和技術解讀是核心資產 |
| **視覺內容** | 美圖、infographic | 程式碼截圖、終端錄屏、Demo GIF |
| **資訊任建設** | 個人品牌故事 | 開源貢獻 + 技術深度 + 收入透明 |
| **受眾特徵** | 廣泛消費者 | 開發者/創業者（高價值但難忽悠） |
| **連結策略** | 儘量避免 | 必須分享（GitHub/Blog），但放回復裡 |
| **增長路徑** | 粉絲 → 品牌合作 | 粉絲 → 產品使用者/開源貢獻者 |
| **國際性** | 本地化明顯 | AI社群天然全球化，英文是通用語 |
| **驗證標準** | 粉絲數/互動數 | 能不能真的做出東西（ship or shut up） |

---

## 十、對花叔X策略的具體建議

基於以上調研，結合花叔的身份（AI Native Coder、獨立開發者、30萬+自媒體粉絲）：

1. **定位清晰**：「中國獨立開發者用AI做產品」——這個身份在英文X上有獨特價值（一手中國AI生態資訊 + 獨立開發者敘事）
2. **內容支柱建議**：Build in Public（產品資料）+ AI工具實測 + 中國AI視角
3. **快速響應**：新模型釋出時，用中國開發者視角做速評（差異化）
4. **產品作為內容**：小貓補光燈、GLM Code等產品的開發故事天然適合Build in Public
5. **Thread為主力**：周更Thread，日常回復為主，不追求日更數量
6. **視覺證據**：每條產品相關推文都帶截圖/GIF/影片
7. **雙語分離**：X用英文，公眾號/小紅書用中文，不混用

---

*調研完成。資訊來源標註在各節末尾，區分了一手觀察與二手分析。核心發現：AI/科技賽道在X上的成功不靠「內容營銷技巧」，靠的是「做真實的事情並公開分享」——Build in Public和Learn in Public不是策略，是生活方式。*


