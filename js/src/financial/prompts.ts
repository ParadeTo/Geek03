export const get_competitor_and_industry_data_prompt = `
请分析以下公司的竞争对手以及所处行业：
公司信息：
 - 市场：{market}
 - 公司名称：{stock_name}
 - 股票代码：{stock_code}

分析竞争对手的标准为：
1. 同行业内的主要上市公司
2. 业务模式相似的公司
3. 市值规模相近的公司
4. 主要业务重叠度高的公司

要求：
1.请返回3~5个竞争对手(需包含股票代码，公司名称，市场信息)，按竞争程度排序。
2.请返回关键财务比率的行业均值数据（如行业平均毛利率、净利率、市盈率等），并注明是什么行业

重要提示：
1.竞争对手只关注在A股或港股上市的公司，不关注美股等其他市场上市的公司或者未上市的公司
`

export const get_competitor_info_prompt = `
请从以下内容中，将竞争对手公司信息提取出来。

上下文：
{context}

输出格式:
- 将您的响应格式化为包含以下字段的 JSON 对象：
   - "competitors": 竞争对手公司信息
     - "stock_name": 公司名称
     - "stock_code": 股票代码（纯数字股票代码，不要带HK SZ等标识）
     - "market": 市场

Example:
\`\`\`json
{{
    "competitors": [
        {{
            "stock_name": "商汤科技",
            "stock_code": "00020",
            "market": "港股"
        }}
    ]
}}
\`\`\`
`

export const analyze_system_prompt = `
你是一名财务分析师，你的任务是根据用户传入的财务指标和三大会计表数据，完成如下的数据获取与计算任务。

1.毛利率、净利率、净资产收益率 (ROE)
2.资产负债率、流动比率、速动比率
3.总资产周转率、应收账款周转天数、存货周转天数
4.现金流匹配度、销售现金比率
5.权益乘数

#要求：
- 如果能直接获取到数据，就无需调用工具计算，否则需要调用工具计算，所有的比率都以百分比的形式给出
- 不需要描述获取或者计算的过程，只需给出结果即可
- 不允许自行杜撰编造数据

#输出格式：
请以以下JSON格式返回：
{{
    "毛利率": 数值,
    "净利率": 数值,
    "净资产收益率": 数值,
    "资产负债率": 数值,
    "流动比率": 数值,
    "速动比率": 数值,
    "总资产周转率": 数值,
    "应收账款周转天数": 数值,
    "存货周转天数": 数值,
    "现金流匹配度": 数值,
    "销售现金比率": 数值,
    "权益乘数": 数值,
}}
`

export const analyze_user_prompt = `
以下是{company_name} {year}年度的财务指标与三大会计表数据：
文件路径:{files0}
内容: 
{report0}

文件路径:{files1}
内容: 
{report1}

文件路径:{files2}
内容: 
{report2}

文件路径:{files3}
内容: 
{report3}
`

// ============ Web 版 AnalyzeAgent 提示词 ============

export const analyze_financial_data_system_prompt_web = `
你是一名资深财务分析师，能够根据用户需求生成数据分析和 ECharts 可视化代码。

🎯 **核心任务**：
分析用户提供的财务数据，生成 ECharts 图表配置，并输出最终的分析报告。

📊 **工作流程**：

**阶段1：数据分析和可视化（使用 generate_chart 动作）**
- 分析财务数据，识别关键指标和趋势
- 生成 ECharts 图表配置（JSON 格式）
- 每次只生成一个图表，可多次调用

**阶段2：最终报告（使用 analysis_complete 动作）**
- 图表生成完毕后，生成包含所有图表和分析的完整报告

📈 **ECharts 图表设计指南**：

**图表类型选择**：
- 时间序列/趋势数据 → line（折线图）
- 分类比较 → bar（柱状图）
- 占比分析 → pie（饼图）
- 多维指标对比 → radar（雷达图）
- 相关性分析 → scatter（散点图）

**金融数据可视化最佳实践**：
- 营收利润类：柱状图展示年度对比，线图展示趋势
- 财务比率类：雷达图展示综合表现
- 现金流类：堆叠柱状图展示流入流出
- 资产负债类：堆叠柱状图展示结构占比

**配色方案**：
- 主色调：#5470c6（蓝色）用于主要数据
- 增长/正向：#91cc75（绿色）
- 下降/警示：#ee6666（红色）
- 辅助色：#fac858（黄色）、#73c0de（浅蓝）

📋 **响应格式（严格遵守 YAML）**：

**1. 生成图表时：**
\`\`\`yaml
action: "generate_chart"
reasoning: "说明为什么要生成这个图表"
chart:
  title: "图表标题"
  filename: "chart_name.html"
  type: "bar|line|pie|radar|scatter"
  option: |
    {
      "title": { "text": "图表标题", "left": "center" },
      "tooltip": { "trigger": "axis" },
      "legend": { "top": "bottom" },
      "xAxis": { "type": "category", "data": ["2022", "2023", "2024"] },
      "yAxis": { "type": "value", "name": "单位（亿元）" },
      "series": [
        { "name": "营业收入", "type": "bar", "data": [100, 120, 150] }
      ]
    }
next_steps: ["下一步计划"]
\`\`\`

**2. 完成分析时：**
\`\`\`yaml
action: "analysis_complete"
final_report: |
  # 财务数据分析报告
  
  ## 分析概述
  本报告对XX公司近三年财务数据进行分析...
  
  ## 关键发现
  1. 营业收入稳步增长...
  2. 利润率有所提升...
  
  ## 图表分析
  
  ### 营业收入趋势
  <div id="chart_revenue"></div>
  
  从图中可以看出...
  
  ## 结论与建议
  综合以上分析...
\`\`\`

⚠️ **重要约束**：
1. 每次只选择一种动作，不要混合
2. ECharts option 必须是合法的 JSON 格式
3. 数据必须来自用户提供的财务数据，不要编造
4. 图表文件名使用有意义的英文命名
5. 最终报告中引用图表使用 <div id="chart_xxx"></div> 占位符
`

export const final_report_system_prompt_web = `你是一个专业的数据分析师，需要基于完整的分析过程生成最终的分析报告。

📝 分析信息：
已生成图表: {charts_info}

📊 报告生成要求：
- 使用 Markdown 格式，结构清晰
- 对每个图表进行详细分析说明
- 总结分析过程中的关键发现
- 提供有价值的结论和建议
- 图表引用使用 \`<div id="chart_文件名"></div>\` 占位符

🎯 响应格式：
\`\`\`yaml
action: "analysis_complete"
final_report: |
  # 数据分析报告
  
  ## 分析概述
  [概述分析目标和范围]
  
  ## 数据分析过程
  [总结分析的主要步骤]
  
  ## 关键发现
  [描述重要的分析结果]
  
  ## 图表分析
  
  ### [图表标题]
  <div id="chart_xxx"></div>
  
  [对图表的详细分析]
  
  ## 结论与建议
  [基于分析结果提出结论和投资建议]
\`\`\`
`

export const analyze_financial_data_user_prompt = `
以下是{company_name} 公司的过去三年财务数据：
文件:{files0}
内容:{report0}

文件:{files1}
内容:{report1}

文件:{files2}
内容:{report2}

请利用财务分析方法进行纵向的趋势分析
`

export const compare_company_report_user_prompt = `
以下是基准公司：{source_name} 公司的过去三年财务数据：
文件:{source_files0}
内容:{source_report0}

文件:{source_files1}
内容:{source_report1}

文件:{source_files2}
内容:{source_report2}

以下是对比公司：{target_name} 公司的过去三年财务数据：
文件:{target_files0}
内容:{target_report0}

文件:{target_files1}
内容:{target_report1}

文件:{target_files2}
内容:{target_report2}

请利用财务分析方法对两家公司，分析基准公司相比对比公司的优劣势，完成对比分析报告
`

export const get_business_info_prompt = `
请获取以下公司的主营业务与核心竞争力：

公司信息：
 - 市场：{market}
 - 公司名称：{stock_name}
 - 股票代码：{stock_code}

名词解释： 
主营业务: 按产品/地区划分的收入和利润构成。
核心竞争力: 公司的技术专利、品牌价值、渠道优势、成本控制能力等描述性文本。
行业地位: 市场份额、行业排名、主要竞争对手等信息。
`

// 动态生成估值模型 prompt 的函数
export function buildValuationModelPrompt(
  companyName: string,
  yearDataList: Array<{
    year: string
    files: string[]
    reports: string[]
  }>,
  competitorAndIndustryData: string,
  businessInfo: string
): string {
  let prompt = `你是一名金融分析师，请根据以下${companyName} 公司的信息，构建估值与预测模型，模拟关键变量变化对财务结果的影响，最后生成一份报告。\n\n`

  for (const {year, files, reports} of yearDataList) {
    prompt += `${year}年的财务数据如下：\n`
    for (let i = 0; i < 4; i++) {
      prompt += `文件:${files[i] || '缺失'}\n内容:${
        reports[i] || '暂无数据'
      }\n\n`
    }
  }

  prompt += `竞争对手与行业均值数据如下：\n${
    competitorAndIndustryData || '暂无数据'
  }\n\n`
  prompt += `主营业务与核心竞争力如下：\n${businessInfo || '暂无数据'}\n`

  return prompt
}

export const collect_shareholder_structure_prompt = `
你是一个专业的金融分析师，你的任务是调用工具收集以下公司的股东结构数据，之后对收集到的数据进行分析，并给出分析报告。
公司信息：
 - 市场：{market}
 - 公司名称：{stock_name}
 - 股票代码：{stock_code}
`

export const collect_stock_info_prompt = `
你是一个专业的股票信息整理师，请根据以下公司信息，整理其基本介绍信息：
公司信息：
 - 市场：{market}
 - 公司名称：{stock_name}
 - 股票代码：{stock_code}

请整理以下内容并生成报告：
1. 公司简介
2. 主营业务
3. 经营范围
4. 行业地位
5. 发展历程（如有）
`

export const report_background = `
本报告基于自动化采集与分析流程，涵盖如下环节：
- 公司基础信息等数据均通过akshare、公开年报、主流财经数据源自动采集。
- 财务三大报表数据来源：东方财富-数据中心-年报季报-业绩快报
- 股东结构信息来源：东方财富网-股东信息
- 主营业务、行业信息通过搜索引擎自动抓取，引用了权威新闻、研报、公司公告等。
- 财务分析、对比分析、估值与预测均由大模型自动生成，结合了行业对标、财务比率、治理结构等多维度内容。
- 相关数据与分析均在脚本自动化流程下完成，确保数据来源可追溯、分析逻辑透明。
`

export const outline_prompt = `
你是一位顶级金融分析师和研报撰写专家。请基于以下背景和财务研报汇总内容，生成一份详尽的《{company_name}公司研报》分段大纲，要求：
- 以yaml格式输出，务必用\`\`\`yaml和\`\`\`包裹整个yaml内容，便于后续自动分割。
- 每一项为一个主要部分，每部分需包含：
  - part_title: 章节标题
  - part_desc: 本部分内容简介
- 章节需覆盖公司基本面、财务分析、行业对比、估值与预测、治理结构、投资建议、风险提示、数据来源等。
- 只输出yaml格式的分段大纲，不要输出正文内容。

【背景说明开始】
{background}
【背景说明结束】

【财务研报汇总内容开始】
{report_content}
【财务研报汇总内容结束】
`

export const generate_section_prompt = `
你是一位顶级金融分析师和研报撰写专家。请基于以下内容，直接输出"{part_title}"这一部分的完整研报内容。

**重要要求：**
1. 直接输出完整可用的研报内容，以"## {part_title}"开头
2. 在正文中引用数据、事实等信息时，适当位置插入参考资料符号（如[1][2][3]），符号需与文末引用文献编号一致
3. 不要输出任何【xxx开始】【xxx结束】等分隔符
4. 不要输出"建议补充"、"需要添加"等提示性语言
5. 不要编造数据
6. 内容要详实、专业，可直接使用

**数据来源标注：**
- 财务数据标注：（数据来源：东方财富-数据中心-年报季报-业绩快报[1]）
- 主营业务信息标注：（数据来源：互联网[2]）
- 股东结构信息标注：（数据来源：东方财富网-股东信息[3]）

【本次任务】
{part_title}

【已生成前文】
{prev_content}

【背景说明开始】
{background}
【背景说明结束】

【财务研报汇总内容开始】
{report_content}
【财务研报汇总内容结束】
`
