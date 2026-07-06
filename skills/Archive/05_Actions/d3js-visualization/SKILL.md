---
name: d3js-visualization
type: execution
description: 使用 d3.js 建立互動式資料視覺化。適用於客製化圖表、網路圖、地理視覺化，或任何需要對視覺元素、過渡或互動進行精細控制的複雜 SVG 資料視覺化。
version: "3.0.0"
type: "execution"
capabilities:
  tool_category: "Data Visualization"
  execution_env: "Browser/D3.js"
  io_format: "SVG/HTML"
  authorized_mcp_tools: ["Persona Knowledge MCP"]
---

# D3.js 互動視覺化 (D3.js Visualization)

### 【摘要】觸發條件與 DLP 宣告
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議

本技能使用 **D3.js v7** 建立需要高度客製化的 SVG 資料視覺化，包含力導向網路圖、地理熱力圖、桑基圖（Sankey）、K 線圖、平行座標圖等複雜圖表，完整掌控動畫、互動與過渡效果。

> **與 `d3-viz-skill` 的區別**：本技能專注**純 D3.js 客製化實作**，適合需要精確 SVG 控制的場景；`d3-viz-skill` 側重臺股金融圖表的快速落地。

---

## 🎯 觸發條件

- 需要力導向網路圖（技能關係圖、知識圖譜）
- 需要地理視覺化（Choropleth、點地圖）
- 需要桑基圖（資金流向、轉換漏鬥）
- 需要比 ECharts/Plotly 更精細的自訂控制

---

## 🛠️ 核心架構模式

### 標準 D3 Chart 結構

```javascript
// 通用 D3 圖表架構
class D3Chart {
  constructor(selector, config = {}) {
    this.config = {
      width: config.width || 800,
      height: config.height || 500,
      margin: config.margin || { top: 40, right: 30, bottom: 60, left: 60 },
      ...config
    };
    
    // 計算繪圖區域
    this.innerWidth = this.config.width - this.config.margin.left - this.config.margin.right;
    this.innerHeight = this.config.height - this.config.margin.top - this.config.margin.bottom;
    
    // 建立 SVG 容器
    this.svg = d3.select(selector)
      .append('svg')
      .attr('width', this.config.width)
      .attr('height', this.config.height)
      .attr('viewBox', `0 0 ${this.config.width} ${this.config.height}`)
      .attr('style', 'max-width: 100%; height: auto;');
    
    // 主繪圖群組（套用 margin）
    this.g = this.svg.append('g')
      .attr('transform', `translate(${this.config.margin.left},${this.config.margin.top})`);
    
    // Tooltip
    this.tooltip = d3.select('body').append('div')
      .attr('class', 'd3-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'rgba(0,0,0,0.8)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '13px')
      .style('pointer-events', 'none');
  }
  
  showTooltip(event, content) {
    this.tooltip.transition().duration(200).style('opacity', 1);
    this.tooltip.html(content)
      .style('left', (event.pageX + 15) + 'px')
      .style('top', (event.pageY - 28) + 'px');
  }
  
  hideTooltip() {
    this.tooltip.transition().duration(300).style('opacity', 0);
  }
}
```

---

## 📊 力導向網路圖（Force-Directed Graph）

```javascript
class ForceGraph extends D3Chart {
  render(nodes, links) {
    // 定義力模擬
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(this.innerWidth / 2, this.innerHeight / 2))
      .force('collision', d3.forceCollide().radius(d => d.radius + 5));
    
    // 繪製連線
    const link = this.g.selectAll('.link')
      .data(links).enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', d => d.color || '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.value || 1));
    
    // 繪製節點
    const node = this.g.selectAll('.node')
      .data(nodes).enter()
      .append('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        })
      );
    
    node.append('circle')
      .attr('r', d => d.radius || 12)
      .attr('fill', d => d.color || '#69b3a2')
      .on('mouseover', (event, d) => this.showTooltip(event, `<b>${d.id}</b><br>${d.label || ''}`))
      .on('mouseout', () => this.hideTooltip());
    
    node.append('text')
      .text(d => d.label || d.id)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', 'white')
      .style('pointer-events', 'none');
    
    // 動畫更新
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
  }
}
```

---

## 🗺️ 地圖熱力圖（Choropleth）

```javascript
class ChoroplethMap extends D3Chart {
  async render(geoDataUrl, dataMap, valueKey) {
    const geoData = await d3.json(geoDataUrl);
    
    const projection = d3.geoMercator()
      .fitSize([this.innerWidth, this.innerHeight], geoData);
    
    const path = d3.geoPath().projection(projection);
    
    const colorScale = d3.scaleSequential()
      .domain(d3.extent(Object.values(dataMap)))
      .interpolator(d3.interpolateYlOrRd);
    
    this.g.selectAll('.region')
      .data(geoData.features).enter()
      .append('path')
      .attr('class', 'region')
      .attr('d', path)
      .attr('fill', d => {
        const val = dataMap[d.properties.name];
        return val ? colorScale(val) : '#eee';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5)
      .on('mouseover', (event, d) => {
        const val = dataMap[d.properties.name] || '無資料';
        this.showTooltip(event, `<b>${d.properties.name}</b><br>${valueKey}: ${val}`);
      })
      .on('mouseout', () => this.hideTooltip());
  }
}
```

---

## 🌊 流向圖（Sankey Diagram）

```javascript
// 需要 d3-sankey 套件
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

class SankeyChart extends D3Chart {
  render(nodes, links) {
    const sankeyLayout = sankey()
      .nodeWidth(20)
      .nodePadding(10)
      .extent([[0, 0], [this.innerWidth, this.innerHeight]]);
    
    const { nodes: sNodes, links: sLinks } = sankeyLayout({ nodes, links });
    
    // 繪製連結（流）
    this.g.selectAll('.link')
      .data(sLinks).enter()
      .append('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('fill', 'none')
      .attr('stroke', d => d.color || '#a8d8ea')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', d => Math.max(1, d.width));
    
    // 繪製節點
    this.g.selectAll('.node')
      .data(sNodes).enter()
      .append('rect')
      .attr('x', d => d.x0).attr('y', d => d.y0)
      .attr('height', d => d.y1 - d.y0)
      .attr('width', d => d.x1 - d.x0)
      .attr('fill', (_, i) => d3.schemeTableau10[i % 10]);
  }
}
```

---

## 🤝 協同技能

- `d3-viz-skill`：臺股 K 線圖的快速模板
- `artifacts-builder`：D3 圖表嵌入 React 元件
- `theme-factory`：標準化配色主題套用

---

## 版本紀錄 (Changelog)
- **[2.0.0]** 2026-05-04：V2.0.0 Polymorphic Labeling Migration — 依生命週期 SOP 匯入多型功能性技術標籤 (tool_category, execution_env, io_format)，建立執行層 Manifest 路由能力。

## [Security] Smart Integration & DLP
- ✓ DLP 資料安全驗證已透過 | 資料加密處理 | 隱私保護協議


---
⚙️ 【系統通訊層宣告 (System Comms Layer)】

網路狀態： 本技能已強制接入總控通訊網路。

接收協定 (Dynamic Payload)： 本文件不再接收無結構的自然語言，必須處理封裝後的動態引數：
`[SYSTEM-CALL: d3js-visualization | PAYLOAD: { objective: "<核心意圖>", target_audience: "<受眾>", strategic_constraints: "<策略限制/禁語>", tone_variables: "<語氣微調>" }]`

> [!IMPORTANT]
> **Payload 淨化規則 (§6.3)**：
> - 若本技能為 `Cognitive` 型：接收戰略目標、語氣設定、情緒變數；拒絕 SQL/DOM/技術指令。
> - 若本技能為 `Execution` 型：只接收 URL、DOM Selector、SQL、JSON Schema；拒絕認知引數。

傳送協定 (Zero-Block Policy)： 執行中若遇能力不足或需外部協作，嚴禁中斷或詢問使用者。必須主動封裝 Dynamic Payload 並發出：
`[SYSTEM-CALL: 目標ID | PAYLOAD: { ... }]` 調閱其他技能。

回傳協定： 任務終止時，必須且只能輸出 `[SYSTEM-RETURN: SUCCESS/FAILED | DATA: <結果>]`。

---
> [!WARNING]
> **全域鐵律：NotebookLM 研究遵從指示**
> 1. 當任務指示「透過 NotebookLM 進行研究/查詢」時，必須嚴格呼叫 `notebooklm` 相關 MCP 工具。
> 2. 若遇到無法連線、憑證過期 (`auth_status: stale` 或 `Authentication expired`) 等錯誤時，**絕對禁止**未經同意自行改用常規網路搜尋 (Web Search) 或其他工具替代。
> 3. 遇到錯誤時，請**立刻中斷動作並主動告知使用者**，請使用者協助登入或修復連線後，再繼續研究任務。
