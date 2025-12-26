import * as path from 'path'
import * as fs from 'fs'
import {StateGraph, START, END} from '@langchain/langgraph'
import {HumanMessage, SystemMessage} from '@langchain/core/messages'
import {ChatOpenAI} from '@langchain/openai'
import {createReactAgent} from '@langchain/langgraph/prebuilt'
import {OverallState, CompetitorInfoListSchema} from './types'
import {
  get_competitor_and_industry_data_prompt,
  get_competitor_info_prompt,
  analyze_system_prompt,
  analyze_user_prompt,
  analyze_financial_data_user_prompt,
  compare_company_report_user_prompt,
  get_business_info_prompt,
  buildValuationModelPrompt,
  collect_shareholder_structure_prompt,
  collect_stock_info_prompt,
  report_background,
  outline_prompt,
  generate_section_prompt,
  analyze_financial_data_system_prompt_web,
  final_report_system_prompt_web,
} from './prompts'
import {
  saveMarkdown,
  saveCsv,
  getFinancialStatementsFileMap,
  getFinancialCaculatesFileMap,
  readCsv,
  collectSessionReports,
  getIndustryInfoFile,
  getBusinessInfoFile,
  getReportFile,
} from './utils'
import {graph as deepResearchGraph} from '../deep-research/graph'
import {AkShare} from './akshare'
import {calculationTools, shareholderTools} from './tools'
import * as dotenv from 'dotenv'

dotenv.config()

/**
 * 封装 Deep Research Agent 为类
 */
class DeepResearchAgent {
  async run(query: string) {
    const result = await deepResearchGraph.invoke(
      {
        messages: [new HumanMessage(query)],
      },
      {recursionLimit: 50}
    )
    return result
  }
}

/**
 * 财务数据计算 Agent
 */
class FinancialCaculateAgent {
  async run(
    stockCode: string,
    stockName: string,
    market: string,
    year: string
  ) {
    console.log(
      `🧮 正在计算 ${stockName} (${stockCode}) ${year} 年的财务指标...`
    )

    const fileMap = getFinancialStatementsFileMap()
    let files: string[] = []
    if (fileMap[stockCode] && fileMap[stockCode][year]) {
      files = fileMap[stockCode][year]
    }

    if (files.length < 4) {
      console.warn(`⚠️ ${stockName} ${year} 年的报表文件不足，无法完整计算。`)
    }

    const report0 = files[0] ? readCsv(files[0]) : ''
    const report1 = files[1] ? readCsv(files[1]) : ''
    const report2 = files[2] ? readCsv(files[2]) : ''
    const report3 = files[3] ? readCsv(files[3]) : ''

    const llm = new ChatOpenAI({
      modelName: 'gpt-4o',
      apiKey: process.env.API_KEY || '',
      configuration: {
        baseURL: 'http://localhost:3001',
      },
    })

    const formattedSystemPrompt = analyze_system_prompt
      .replace(/{company_name}/g, stockName)
      .replace(/{year}/g, year)

    const formattedUserPrompt = analyze_user_prompt
      .replace(/{company_name}/g, stockName)
      .replace(/{year}/g, year)
      .replace('{files0}', files[0] || '缺失')
      .replace('{report0}', report0)
      .replace('{files1}', files[1] || '缺失')
      .replace('{report1}', report1)
      .replace('{files2}', files[2] || '缺失')
      .replace('{report2}', report2)
      .replace('{files3}', files[3] || '缺失')
      .replace('{report3}', report3)

    const agent = createReactAgent({
      llm,
      tools: calculationTools,
      messageModifier: new SystemMessage(formattedSystemPrompt),
    })

    const agentResponse = await agent.invoke({
      messages: [new HumanMessage(formattedUserPrompt)],
    })

    const lastMessage =
      agentResponse.messages[agentResponse.messages.length - 1]
    const resultContent = lastMessage.content as string

    // 解析 JSON
    let resultDict: any
    try {
      resultDict = JSON.parse(resultContent)
    } catch (e) {
      const match = resultContent.match(/\{[\s\S]*\}/)
      if (match) {
        resultDict = JSON.parse(match[0])
      } else {
        throw new Error('无法解析 Agent 返回的 JSON 内容')
      }
    }

    // 保存计算结果为 CSV
    const cleanCode =
      stockCode.startsWith('SH') || stockCode.startsWith('SZ')
        ? stockCode.substring(2)
        : stockCode
    saveCsv(
      [resultDict],
      `${cleanCode}_${year}年度财务计算结果.csv`,
      'data/financial_caculates'
    )

    return resultContent
  }
}

/**
 * 财务深度分析 Agent (简化版)
 */
/**
 * ECharts HTML 模板
 */
function generateChartHtml(title: string, option: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
  <style>
    body { margin: 0; padding: 20px; font-family: 'Microsoft YaHei', sans-serif; }
    #chart { width: 100%; height: 500px; }
    h1 { text-align: center; color: #333; font-size: 18px; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div id="chart"></div>
  <script>
    var chart = echarts.init(document.getElementById('chart'));
    var option = ${option};
    chart.setOption(option);
    window.addEventListener('resize', function() { chart.resize(); });
  </script>
</body>
</html>`
}

/**
 * 解析 YAML 响应
 */
function parseYamlResponse(content: string): any {
  // 提取 yaml 代码块
  let yamlContent = content
  if (content.includes('```yaml')) {
    yamlContent = content.split('```yaml')[1].split('```')[0]
  } else if (content.includes('```')) {
    yamlContent = content.split('```')[1].split('```')[0]
  }

  // 简单解析 YAML（支持常用字段）
  const result: any = {}

  // 解析 action
  const actionMatch = yamlContent.match(/action:\s*["']?([^"'\n]+)["']?/)
  if (actionMatch) result.action = actionMatch[1].trim()

  // 解析 reasoning
  const reasoningMatch = yamlContent.match(/reasoning:\s*["']?([^"'\n]+)["']?/)
  if (reasoningMatch) result.reasoning = reasoningMatch[1].trim()

  // 解析 chart 块
  if (yamlContent.includes('chart:')) {
    result.chart = {}
    const chartSection = yamlContent.split('chart:')[1].split(/\n[a-z_]+:/)[0]

    const titleMatch = chartSection.match(/title:\s*["']?([^"'\n]+)["']?/)
    if (titleMatch) result.chart.title = titleMatch[1].trim()

    const filenameMatch = chartSection.match(/filename:\s*["']?([^"'\n]+)["']?/)
    if (filenameMatch) result.chart.filename = filenameMatch[1].trim()

    const typeMatch = chartSection.match(/type:\s*["']?([^"'\n]+)["']?/)
    if (typeMatch) result.chart.type = typeMatch[1].trim()

    // 解析 option（JSON 块）
    const optionMatch = chartSection.match(
      /option:\s*\|?\s*\n([\s\S]*?)(?=\n[a-z_]+:|$)/
    )
    if (optionMatch) {
      let optionStr = optionMatch[1].trim()
      // 去掉每行开头的缩进
      optionStr = optionStr
        .split('\n')
        .map((line) => line.replace(/^\s{2,4}/, ''))
        .join('\n')
      result.chart.option = optionStr
    }
  }

  // 解析 final_report
  const finalReportMatch = yamlContent.match(
    /final_report:\s*\|?\s*\n([\s\S]*)/
  )
  if (finalReportMatch) {
    result.final_report = finalReportMatch[1]
      .split('\n')
      .map((line) => line.replace(/^\s{2}/, ''))
      .join('\n')
      .trim()
  }

  return result
}

/**
 * Web 版分析 Agent（生成 ECharts 图表）
 */
class AnalyzeAgent {
  private baseOutputDir: string
  private sessionDir: string
  private charts: Array<{filename: string; title: string; description?: string}>

  constructor(baseOutputDir: string, absolutePath: boolean = false) {
    this.baseOutputDir = baseOutputDir
    this.sessionDir = `session_${Date.now()}`
    this.charts = []
  }

  private getOutputPath(): string {
    const projectRoot = path.join(__dirname, '../../')
    return path.join(projectRoot, this.baseOutputDir, this.sessionDir)
  }

  private ensureOutputDir(): void {
    const outputPath = this.getOutputPath()
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, {recursive: true})
    }
  }

  private saveChart(filename: string, title: string, option: string): string {
    this.ensureOutputDir()
    const html = generateChartHtml(title, option)
    const filePath = path.join(this.getOutputPath(), filename)
    fs.writeFileSync(filePath, html, 'utf-8')
    console.log(`  📊 图表已保存: ${filename}`)
    return filePath
  }

  async run(
    stockCode: string,
    stockName: string,
    market: string,
    formattedUserPrompt: string
  ) {
    console.log(`🧠 正在深度分析 ${stockName} (${stockCode}) 的财务数据...`)

    const llm = new ChatOpenAI({
      modelName: 'gpt-4o',
      apiKey: process.env.API_KEY || '',
      configuration: {
        baseURL: 'http://localhost:3001',
      },
    })

    const messages: Array<SystemMessage | HumanMessage> = [
      new SystemMessage(analyze_financial_data_system_prompt_web),
      new HumanMessage(formattedUserPrompt),
    ]

    const maxRounds = 8
    let round = 0
    let finalReport = ''

    while (round < maxRounds) {
      round++
      console.log(`  🔄 第 ${round} 轮对话...`)

      const response = await llm.invoke(messages)
      const content = response.content as string

      // 解析响应
      const parsed = parseYamlResponse(content)

      if (!parsed.action) {
        // 无法解析，直接作为最终报告
        console.log('  ⚠️ 无法解析响应，直接使用内容作为报告')
        finalReport = content
        break
      }

      if (parsed.action === 'generate_chart') {
        // 生成图表
        if (parsed.chart && parsed.chart.option) {
          try {
            const filename = parsed.chart.filename || `chart_${round}.html`
            this.saveChart(
              filename,
              parsed.chart.title || '图表',
              parsed.chart.option
            )
            this.charts.push({
              filename,
              title: parsed.chart.title || '图表',
              description: parsed.reasoning,
            })

            // 添加执行结果到对话
            messages.push(new HumanMessage(content))
            messages.push(
              new HumanMessage(
                `图表 "${parsed.chart.title}" 已成功生成并保存为 ${filename}。请继续下一步分析，或在合适时机收集图表生成最终报告。`
              )
            )
          } catch (e: any) {
            messages.push(new HumanMessage(content))
            messages.push(
              new HumanMessage(`图表生成失败: ${e.message}。请修正后重试。`)
            )
          }
        }
      } else if (parsed.action === 'analysis_complete') {
        // 分析完成
        finalReport = parsed.final_report || content
        console.log('  ✅ 分析完成')
        break
      } else {
        // 未知动作，继续
        messages.push(new HumanMessage(content))
        messages.push(new HumanMessage('请继续分析。'))
      }
    }

    // 生成最终报告 HTML（包含所有图表）
    this.generateFinalReportHtml(stockName, finalReport)

    // 保存 Markdown 报告
    saveMarkdown(
      finalReport,
      '最终分析报告.md',
      `${this.baseOutputDir}/${this.sessionDir}`
    )

    return finalReport
  }

  /**
   * 生成包含所有图表的最终 HTML 报告
   */
  private generateFinalReportHtml(stockName: string, mdContent: string): void {
    const chartsScript = this.charts
      .map(
        (c, i) => `
    // 加载图表: ${c.title}
    fetch('./${c.filename}')
      .then(r => r.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const script = doc.querySelector('script:last-of-type');
        if (script) {
          const optionMatch = script.textContent.match(/var option = ([\\s\\S]*?);\\s*chart\\.setOption/);
          if (optionMatch) {
            const container = document.getElementById('chart_${c.filename.replace(
              '.html',
              ''
            )}');
            if (container) {
              const chart = echarts.init(container);
              chart.setOption(JSON.parse(optionMatch[1]));
            }
          }
        }
      });`
      )
      .join('\n')

    // 在 Markdown 中替换图表占位符
    let htmlContent = mdContent
    for (const chart of this.charts) {
      const chartId = chart.filename.replace('.html', '')
      const placeholder = new RegExp(`<div id="chart_${chartId}"></div>`, 'g')
      htmlContent = htmlContent.replace(
        placeholder,
        `<div id="chart_${chartId}" style="width:100%;height:400px;margin:20px 0;"></div>`
      )
    }

    const finalHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${stockName} 财务分析报告</title>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    body {
      font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px;
      background: #f5f5f5;
    }
    .report {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { color: #1a1a2e; border-bottom: 3px solid #5470c6; padding-bottom: 10px; }
    h2 { color: #16213e; margin-top: 30px; }
    h3 { color: #0f3460; }
    table { border-collapse: collapse; width: 100%; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #5470c6; color: white; }
    tr:nth-child(even) { background: #f9f9f9; }
  </style>
</head>
<body>
  <div class="report" id="report"></div>
  <script>
    const mdContent = ${JSON.stringify(htmlContent)};
    document.getElementById('report').innerHTML = marked.parse(mdContent);
    ${chartsScript}
  </script>
</body>
</html>`

    this.ensureOutputDir()
    const filePath = path.join(this.getOutputPath(), '分析报告.html')
    fs.writeFileSync(filePath, finalHtml, 'utf-8')
    console.log(`  📄 HTML 报告已保存: 分析报告.html`)
  }
}

/**
 * 财务数据采集 Agent
 */
class DataCollectionAgent {
  async run(
    stockCode: string,
    stockName: string,
    market: string,
    year: string
  ) {
    console.log(
      `📥 正在采集 ${stockName} (${stockCode}) ${year} 年的财务数据...`
    )

    // 清理代码，去掉前缀
    const cleanCode =
      stockCode.startsWith('SH') || stockCode.startsWith('SZ')
        ? stockCode.substring(2)
        : stockCode

    try {
      // 1. 采集三大报表
      const balanceSheet = AkShare.getBalanceSheet(stockCode, year)
      saveCsv(balanceSheet, `${cleanCode}_${year}_资产负债表.csv`)

      const incomeStatement = AkShare.getIncomeStatement(stockCode, year)
      saveCsv(incomeStatement, `${cleanCode}_${year}_利润表.csv`)

      const cashFlow = AkShare.getCashFlowStatement(stockCode, year)
      saveCsv(cashFlow, `${cleanCode}_${year}_现金流量表.csv`)

      // 2. 采集财务指标
      const indicators = AkShare.getFinancialIndicator(stockCode, year)
      saveCsv(indicators, `${cleanCode}_${year}_财务指标.csv`)

      console.log(`✅ ${stockName} (${stockCode}) ${year} 年数据采集完成`)
    } catch (error: any) {
      console.error(`❌ 采集 ${stockName} 数据失败:`, error.message)
    }
  }
}

/**
 * 获取竞争对手与行业均值数据节点
 */
export async function getCompetitorAndIndustryData(
  state: typeof OverallState.State
) {
  const agent = new DeepResearchAgent()
  const prompt = get_competitor_and_industry_data_prompt
    .replace('{market}', state.market)
    .replace('{stock_name}', state.stock_name)
    .replace('{stock_code}', state.stock_code)

  console.log('🔍 开始进行深度搜索，获取竞争对手与行业数据...')
  const ret = await agent.run(prompt)

  let lastMessageContent = ''
  if (ret.messages && ret.messages.length > 0) {
    const lastMessage = ret.messages[ret.messages.length - 1]
    lastMessageContent = lastMessage.content as string
  }

  // 长期记忆 - 保存到 final_output 目录，方便后续汇总
  saveMarkdown(lastMessageContent, '竞争对手与行业均值数据.md', 'final_output')

  // 短期记忆
  return {
    competitor_and_industry_data: lastMessageContent,
  }
}

/**
 * 获取竞争对手信息节点（结构化提取）
 */
export async function getCompetitorInfo(state: typeof OverallState.State) {
  const llm = new ChatOpenAI({
    modelName: 'gpt-4o',
    apiKey: process.env.API_KEY || '',
    configuration: {
      baseURL: 'http://localhost:3001',
    },
  })

  const structuredLLM = llm.withStructuredOutput(CompetitorInfoListSchema)

  const formattedPrompt = get_competitor_info_prompt.replace(
    '{context}',
    state.competitor_and_industry_data
  )

  console.log('📊 正在从上下文中提取竞争对手结构化信息...')
  const result = await structuredLLM.invoke(formattedPrompt)

  return {
    competitor_info: result,
  }
}

/**
 * 获取本公司与竞争对手公司的财务数据节点
 */
export async function getFinancialData(state: typeof OverallState.State) {
  const agent = new DataCollectionAgent()

  // 1. 采集本公司数据
  for (const year of state.year) {
    await agent.run(state.stock_code, state.stock_name, state.market, year)
  }

  // 2. 采集竞争对手数据
  if (state.competitor_info && state.competitor_info.competitors) {
    for (const competitor of state.competitor_info.competitors) {
      for (const year of state.year) {
        await agent.run(
          competitor.stock_code,
          competitor.stock_name,
          competitor.market,
          year
        )
      }
    }
  }

  return state
}

/**
 * 计算财务指标节点
 */
export async function financialCaculate(state: typeof OverallState.State) {
  const agent = new FinancialCaculateAgent()

  // 1. 计算本公司指标
  for (const year of state.year) {
    await agent.run(state.stock_code, state.stock_name, state.market, year)
  }

  // 2. 计算竞争对手指标
  if (state.competitor_info && state.competitor_info.competitors) {
    for (const competitor of state.competitor_info.competitors) {
      for (const year of state.year) {
        await agent.run(
          competitor.stock_code,
          competitor.stock_name,
          competitor.market,
          year
        )
      }
    }
  }

  return state
}

/**
 * 分析财务数据节点 (趋势分析)
 */
export async function analyzeFinancialData(state: typeof OverallState.State) {
  const fileMap = getFinancialCaculatesFileMap()
  const agent = new AnalyzeAgent('analyze_agent_outputs', true)

  const analyzeForStock = async (
    code: string,
    name: string,
    market: string
  ) => {
    let files: string[] = []
    if (fileMap[code]) {
      files = fileMap[code]
    }

    if (files.length === 0) {
      console.warn(`⚠️ 未找到 ${name} (${code}) 的计算结果文件，跳过分析。`)
      return ''
    }

    const report0 = files[0] ? readCsv(files[0]) : ''
    const report1 = files[1] ? readCsv(files[1]) : ''
    const report2 = files[2] ? readCsv(files[2]) : ''

    const prompt = analyze_financial_data_user_prompt
      .replace('{company_name}', name)
      .replace('{files0}', files[0] || '缺失')
      .replace('{report0}', report0)
      .replace('{files1}', files[1] || '缺失')
      .replace('{report1}', report1)
      .replace('{files2}', files[2] || '缺失')
      .replace('{report2}', report2)

    return await agent.run(code, name, market, prompt)
  }

  const reports: Record<string, string> = {}

  // 1. 分析本公司
  console.log(`📊 开始分析本公司: ${state.stock_name}`)
  reports[state.stock_code] = await analyzeForStock(
    state.stock_code,
    state.stock_name,
    state.market
  )

  // 2. 分析竞争对手
  if (state.competitor_info && state.competitor_info.competitors) {
    for (const competitor of state.competitor_info.competitors) {
      console.log(`📊 开始分析竞争对手: ${competitor.stock_name}`)
      reports[competitor.stock_code] = await analyzeForStock(
        competitor.stock_code,
        competitor.stock_name,
        competitor.market
      )
    }
  }

  return {
    company_report: reports,
  }
}

/**
 * 生成对比分析报告节点
 */
export async function generateCompareCompanyReport(
  state: typeof OverallState.State
) {
  const fileMap = getFinancialCaculatesFileMap()
  const agent = new AnalyzeAgent('compare_company_report_outputs', true)

  let sourceFiles: string[] = []
  if (fileMap[state.stock_code]) {
    sourceFiles = fileMap[state.stock_code]
  }

  const sourceReport0 = sourceFiles[0] ? readCsv(sourceFiles[0]) : ''
  const sourceReport1 = sourceFiles[1] ? readCsv(sourceFiles[1]) : ''
  const sourceReport2 = sourceFiles[2] ? readCsv(sourceFiles[2]) : ''

  const compareReports: Record<string, string> = {}

  if (state.competitor_info && state.competitor_info.competitors) {
    for (const competitor of state.competitor_info.competitors) {
      console.log(
        `📊 开始对比分析: ${state.stock_name} vs ${competitor.stock_name}`
      )

      let targetFiles: string[] = []
      if (fileMap[competitor.stock_code]) {
        targetFiles = fileMap[competitor.stock_code]
      }

      if (targetFiles.length === 0) {
        console.warn(
          `⚠️ 未找到 ${competitor.stock_name} (${competitor.stock_code}) 的计算结果文件，跳过对比。`
        )
        continue
      }

      const targetReport0 = targetFiles[0] ? readCsv(targetFiles[0]) : ''
      const targetReport1 = targetFiles[1] ? readCsv(targetFiles[1]) : ''
      const targetReport2 = targetFiles[2] ? readCsv(targetFiles[2]) : ''

      const prompt = compare_company_report_user_prompt
        .replace('{source_name}', state.stock_name)
        .replace('{source_files0}', sourceFiles[0] || '缺失')
        .replace('{source_report0}', sourceReport0)
        .replace('{source_files1}', sourceFiles[1] || '缺失')
        .replace('{source_report1}', sourceReport1)
        .replace('{source_files2}', sourceFiles[2] || '缺失')
        .replace('{source_report2}', sourceReport2)
        .replace('{target_name}', competitor.stock_name)
        .replace('{target_files0}', targetFiles[0] || '缺失')
        .replace('{target_report0}', targetReport0)
        .replace('{target_files1}', targetFiles[1] || '缺失')
        .replace('{target_report1}', targetReport1)
        .replace('{target_files2}', targetFiles[2] || '缺失')
        .replace('{target_report2}', targetReport2)

      const result = await agent.run(
        competitor.stock_code,
        competitor.stock_name,
        competitor.market,
        prompt
      )
      compareReports[competitor.stock_code] = result
    }
  }

  return {
    compare_company_report: compareReports,
  }
}

/**
 * 汇总分析报告节点
 */
export async function mergerReports(state: typeof OverallState.State) {
  console.log('📝 开始汇总所有分析报告...')
  const formattedOutput: string[] = []

  // 1. 收集 analyze_agent_outputs 下的报告
  const analyzeReports = collectSessionReports(
    'analyze_agent_outputs',
    '最终分析报告.md'
  )
  for (const report of analyzeReports) {
    formattedOutput.push('【财务数据分析结果开始】')
    formattedOutput.push(report)
    formattedOutput.push('【财务数据分析结果结束】')
    formattedOutput.push('')
  }

  // 2. 收集 compare_company_report_outputs 下的报告
  const compareReports = collectSessionReports(
    'compare_company_report_outputs',
    '最终分析报告.md'
  )
  for (const report of compareReports) {
    formattedOutput.push('【对比分析结果开始】')
    formattedOutput.push(report)
    formattedOutput.push('【对比分析结果结束】')
    formattedOutput.push('')
  }

  console.log(
    `✅ 汇总完成，共收集 ${analyzeReports.length} 份趋势分析报告，${compareReports.length} 份对比分析报告`
  )

  return {
    formatted_output: formattedOutput,
  }
}

/**
 * 获取主营业务与核心竞争力节点
 */
export async function getBusinessInfo(state: typeof OverallState.State) {
  console.log(`🔍 正在搜集 ${state.stock_name} 的主营业务与核心竞争力信息...`)

  const agent = new DeepResearchAgent()
  const prompt = get_business_info_prompt
    .replace('{market}', state.market)
    .replace('{stock_name}', state.stock_name)
    .replace('{stock_code}', state.stock_code)

  const ret = await agent.run(prompt)

  let lastMessageContent = ''
  if (ret.messages && ret.messages.length > 0) {
    const lastMessage = ret.messages[ret.messages.length - 1]
    lastMessageContent = lastMessage.content as string
  }

  // 长期记忆 - 保存到文件
  saveMarkdown(lastMessageContent, '主营业务与核心竞争力.md', 'final_output')

  // 短期记忆
  return {
    business_info: lastMessageContent,
  }
}

/**
 * 生成估值与预测模型节点
 */
export async function generateValuationModel(state: typeof OverallState.State) {
  console.log(`📈 正在为 ${state.stock_name} 构建估值与预测模型...`)

  const fileMap = getFinancialStatementsFileMap()
  const stockCode = state.stock_code

  // 收集每年的财务数据
  const yearDataList: Array<{
    year: string
    files: string[]
    reports: string[]
  }> = []

  for (const year of state.year) {
    if (fileMap[stockCode] && fileMap[stockCode][year]) {
      const files = fileMap[stockCode][year]

      const report0 = files[0] ? readCsv(files[0]) : ''
      const report1 = files[1] ? readCsv(files[1]) : ''
      const report2 = files[2] ? readCsv(files[2]) : ''
      const report3 = files[3] ? readCsv(files[3]) : ''

      yearDataList.push({
        year,
        files,
        reports: [report0, report1, report2, report3],
      })
    }
  }

  // 优先使用短期记忆（state），否则从文件读取
  const competitorAndIndustryData =
    state.competitor_and_industry_data || getIndustryInfoFile()
  const businessInfo = state.business_info || getBusinessInfoFile()

  // 动态构建 prompt
  const formattedPrompt = buildValuationModelPrompt(
    state.stock_name,
    yearDataList,
    competitorAndIndustryData,
    businessInfo
  )

  // 调用 LLM
  const llm = new ChatOpenAI({
    modelName: 'gpt-4o',
    apiKey: process.env.API_KEY || '',
    configuration: {
      baseURL: 'http://localhost:3001',
    },
  })

  const response = await llm.invoke([new HumanMessage(formattedPrompt)])
  const content = response.content as string

  // 长期记忆 - 保存结果
  saveMarkdown(content, '估值与预测模型.md', 'final_output')

  console.log('✅ 估值与预测模型生成完成')

  // 短期记忆
  return {
    valuation_model: content,
  }
}

/**
 * 格式化股东数据为 Markdown
 */
function formatShareholderData(data: any[], title: string): string {
  if (!data || data.length === 0) return `### ${title}\n暂无数据\n`

  const lines = [`### ${title}`]
  for (const row of data) {
    const parts = Object.entries(row)
      .map(([k, v]) => `- ${k}: ${v ?? ''}`)
      .join('\n')
    lines.push(parts)
    lines.push('')
  }
  return lines.join('\n')
}

/**
 * 获取股东信息节点
 */
export async function getShareholderInfo(state: typeof OverallState.State) {
  console.log(`📊 正在采集 ${state.stock_name} 的股东结构信息...`)

  const stockCode = state.stock_code
  const results: string[] = [`# ${state.stock_name} 股东结构分析报告\n`]

  // 1. 获取十大股东
  try {
    console.log('  - 获取十大股东信息...')
    const top10 = AkShare.getTop10Shareholders(stockCode)
    results.push(formatShareholderData(top10, '十大股东信息'))
  } catch (e: any) {
    results.push(`### 十大股东信息\n获取失败: ${e.message}\n`)
  }

  // 2. 获取十大流通股东
  try {
    console.log('  - 获取十大流通股东信息...')
    const freeTop10 = AkShare.getFreeTop10Shareholders(stockCode)
    results.push(formatShareholderData(freeTop10, '十大流通股东信息'))
  } catch (e: any) {
    results.push(`### 十大流通股东信息\n获取失败: ${e.message}\n`)
  }

  // 3. 获取主要股东
  try {
    console.log('  - 获取主要股东信息...')
    const main = AkShare.getMainStockHolder(stockCode)
    results.push(formatShareholderData(main, '主要股东信息'))
  } catch (e: any) {
    results.push(`### 主要股东信息\n获取失败: ${e.message}\n`)
  }

  // 4. 获取限售解禁信息
  try {
    console.log('  - 获取限售解禁信息...')
    const restricted = AkShare.getRestrictedRelease(stockCode)
    results.push(formatShareholderData(restricted, '限售解禁信息'))
  } catch (e: any) {
    results.push(`### 限售解禁信息\n获取失败: ${e.message}\n`)
  }

  const rawData = results.join('\n')

  // 5. 使用 LLM 生成分析报告
  console.log('  - 生成股东结构分析报告...')
  const llm = new ChatOpenAI({
    modelName: 'gpt-4o',
    apiKey: process.env.API_KEY || '',
    configuration: {
      baseURL: 'http://localhost:3001',
    },
  })

  const analysisPrompt = `请基于以下股东结构数据，撰写一份简洁的分析报告，包括：
1. 股权集中度分析
2. 主要股东背景
3. 股权变动趋势
4. 潜在风险提示

原始数据：
${rawData}`

  const response = await llm.invoke([new HumanMessage(analysisPrompt)])
  const content = response.content as string

  // 长期记忆 - 保存结果
  saveMarkdown(content, '股东信息数据.md', 'final_output')

  console.log('✅ 股东信息采集完成')

  // 短期记忆
  return {
    shareholder_info: content,
  }
}

/**
 * 获取公司基础信息节点
 */
export async function getCompanyInfo(state: typeof OverallState.State) {
  console.log(`🏢 正在获取 ${state.stock_name} 的公司基础信息...`)

  const stockCode = state.stock_code

  // 1. 获取公司介绍数据
  let introData: any[] = []
  try {
    console.log('  - 获取公司主营业务介绍...')
    introData = AkShare.getStockIntro(stockCode)
  } catch (e: any) {
    console.warn(`  - 获取失败: ${e.message}`)
  }

  // 2. 格式化原始数据
  let rawDataStr = `# ${state.stock_name} 公司信息\n\n`
  if (introData && introData.length > 0) {
    rawDataStr += '## 主营业务介绍\n'
    for (const row of introData) {
      for (const [k, v] of Object.entries(row)) {
        rawDataStr += `- ${k}: ${v ?? ''}\n`
      }
      rawDataStr += '\n'
    }
  } else {
    rawDataStr += '暂无从 AkShare 获取的公司介绍数据。\n'
  }

  // 3. 使用 LLM 整理报告
  console.log('  - 生成公司信息报告...')
  const llm = new ChatOpenAI({
    modelName: 'gpt-4o',
    apiKey: process.env.API_KEY || '',
    configuration: {
      baseURL: 'http://localhost:3001',
    },
  })

  const formattedPrompt = collect_stock_info_prompt
    .replace('{market}', state.market)
    .replace('{stock_name}', state.stock_name)
    .replace('{stock_code}', state.stock_code)

  const fullPrompt = `${formattedPrompt}\n\n以下是从数据源获取的原始信息：\n${rawDataStr}`

  const response = await llm.invoke([new HumanMessage(fullPrompt)])
  const content = response.content as string

  // 长期记忆 - 保存结果
  saveMarkdown(content, '公司信息数据.md', 'final_output')

  console.log('✅ 公司信息获取完成')

  // 短期记忆
  return {
    company_info: content,
  }
}

/**
 * 汇总第一阶段所有数据节点
 */
export async function summarizeFirstStageData(
  state: typeof OverallState.State
) {
  console.log(`📋 正在汇总 ${state.stock_name} 的第一阶段研报数据...`)

  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
  const outputFilename = `财务研报汇总_${timestamp}.md`

  // 优先使用短期记忆，否则从文件读取
  const companyInfo =
    state.company_info || getReportFile('公司信息数据.md') || '暂无数据'
  const shareholderInfo =
    state.shareholder_info || getReportFile('股东信息数据.md') || '暂无数据'
  const businessInfo =
    state.business_info ||
    getReportFile('主营业务与核心竞争力.md') ||
    '暂无数据'
  const valuationModel =
    state.valuation_model || getReportFile('估值与预测模型.md') || '暂无数据'

  // 获取分析报告（来自 merger_reports）
  const formattedReport =
    state.formatted_output && state.formatted_output.length > 0
      ? state.formatted_output.join('\n\n')
      : '暂无财务分析数据'

  // 构建汇总报告
  const summaryContent = `# ${state.stock_name} 财务研报汇总

## 一、公司基础信息

${companyInfo}

---

## 二、股权信息分析

${shareholderInfo}

---

## 三、行业信息与核心竞争力

${businessInfo}

---

## 四、财务数据分析与竞品对比

${formattedReport}

---

## 五、估值与预测分析

${valuationModel}

---

*报告生成时间: ${new Date().toLocaleString('zh-CN')}*
`

  // 保存汇总报告
  saveMarkdown(summaryContent, outputFilename, 'final_output')

  console.log(`✅ 第一阶段汇总完成: final_output/${outputFilename}`)

  return {
    final_report: outputFilename,
  }
}

/**
 * 解析 YAML 格式的大纲（简化版，解析 part_title 和 part_desc）
 */
function parseOutlineYaml(
  yamlContent: string
): Array<{part_title: string; part_desc: string}> {
  const parts: Array<{part_title: string; part_desc: string}> = []

  // 按 - part_title 分割
  const sections = yamlContent.split(/\n\s*-\s+part_title:\s*/)

  for (let i = 1; i < sections.length; i++) {
    const section = sections[i]
    const titleMatch = section.match(/^["']?([^"'\n]+)["']?/)
    const descMatch = section.match(/part_desc:\s*["']?([^"'\n]+)["']?/)

    if (titleMatch) {
      parts.push({
        part_title: titleMatch[1].trim(),
        part_desc: descMatch ? descMatch[1].trim() : '',
      })
    }
  }

  return parts
}

/**
 * 生成报告大纲
 */
async function generateOutline(
  stockName: string,
  reportContent: string,
  background: string
): Promise<Array<{part_title: string; part_desc: string}>> {
  const llm = new ChatOpenAI({
    modelName: 'gpt-4o',
    apiKey: process.env.API_KEY || '',
    configuration: {
      baseURL: 'http://localhost:3001',
    },
  })

  const formattedPrompt = outline_prompt
    .replace('{company_name}', stockName)
    .replace('{background}', background)
    .replace('{report_content}', reportContent)

  const response = await llm.invoke([
    new SystemMessage(
      '你是一位顶级金融分析师和研报撰写专家，善于结构化、分段规划输出，分段大纲必须用```yaml包裹，便于后续自动分割。'
    ),
    new HumanMessage(formattedPrompt),
  ])

  const content = response.content as string

  // 提取 yaml 块
  let yamlBlock = content
  if (content.includes('```yaml')) {
    yamlBlock = content.split('```yaml')[1].split('```')[0]
  }

  return parseOutlineYaml(yamlBlock)
}

/**
 * 生成单个章节内容
 */
async function generateSection(
  partTitle: string,
  prevContent: string,
  background: string,
  reportContent: string
): Promise<string> {
  const llm = new ChatOpenAI({
    modelName: 'gpt-4o',
    apiKey: process.env.API_KEY || '',
    configuration: {
      baseURL: 'http://localhost:3001',
    },
  })

  const formattedPrompt = generate_section_prompt
    .replace(/{part_title}/g, partTitle)
    .replace('{prev_content}', prevContent || '（这是第一章节，无前文）')
    .replace('{background}', background)
    .replace('{report_content}', reportContent)

  const response = await llm.invoke([
    new SystemMessage(
      '你是顶级金融分析师，专门生成完整可用的研报内容。输出必须是完整的研报正文，无需用户修改。严格禁止输出分隔符、建议性语言或虚构内容。'
    ),
    new HumanMessage(formattedPrompt),
  ])

  return response.content as string
}

/**
 * 收集所有分析图表的路径
 */
function collectAllCharts(): Array<{dir: string; files: string[]}> {
  const projectRoot = path.join(__dirname, '../../')
  const results: Array<{dir: string; files: string[]}> = []

  // 收集 analyze_agent_outputs 下的图表
  const analyzeDir = path.join(projectRoot, 'analyze_agent_outputs')
  if (fs.existsSync(analyzeDir)) {
    const sessions = fs
      .readdirSync(analyzeDir)
      .filter((d) => d.startsWith('session_'))
    for (const session of sessions) {
      const sessionPath = path.join(analyzeDir, session)
      const htmlFiles = fs
        .readdirSync(sessionPath)
        .filter((f) => f.endsWith('.html') && f !== '分析报告.html')
      if (htmlFiles.length > 0) {
        results.push({
          dir: path.join('analyze_agent_outputs', session),
          files: htmlFiles,
        })
      }
    }
  }

  // 收集 compare_company_report_outputs 下的图表
  const compareDir = path.join(projectRoot, 'compare_company_report_outputs')
  if (fs.existsSync(compareDir)) {
    const sessions = fs
      .readdirSync(compareDir)
      .filter((d) => d.startsWith('session_'))
    for (const session of sessions) {
      const sessionPath = path.join(compareDir, session)
      const htmlFiles = fs
        .readdirSync(sessionPath)
        .filter((f) => f.endsWith('.html') && f !== '分析报告.html')
      if (htmlFiles.length > 0) {
        results.push({
          dir: path.join('compare_company_report_outputs', session),
          files: htmlFiles,
        })
      }
    }
  }

  return results
}

/**
 * 生成最终的 HTML 报告
 */
function generateFinalHtmlReport(
  stockName: string,
  mdContent: string,
  charts: Array<{dir: string; files: string[]}>
): string {
  // 构建图表 iframe 列表
  let chartsHtml = ''
  let chartIndex = 0
  for (const {dir, files} of charts) {
    for (const file of files) {
      chartIndex++
      const chartPath = `../${dir}/${file}`
      const chartName = file.replace('.html', '')
      chartsHtml += `
        <div class="chart-container">
          <h4>图表 ${chartIndex}: ${chartName}</h4>
          <iframe src="${chartPath}" class="chart-frame"></iframe>
        </div>`
    }
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${stockName} 财务研报</title>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Microsoft YaHei', 'PingFang SC', -apple-system, sans-serif;
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .report-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 2.5em;
      font-weight: 600;
    }
    .header .subtitle {
      margin-top: 10px;
      opacity: 0.8;
      font-size: 1.1em;
    }
    .content {
      padding: 40px;
    }
    .content h1 { color: #1a1a2e; font-size: 1.8em; border-bottom: 3px solid #667eea; padding-bottom: 10px; margin-top: 40px; }
    .content h2 { color: #16213e; font-size: 1.5em; margin-top: 30px; border-left: 4px solid #667eea; padding-left: 15px; }
    .content h3 { color: #0f3460; font-size: 1.2em; margin-top: 25px; }
    .content p { line-height: 1.8; color: #333; }
    .content ul, .content ol { line-height: 2; }
    .content table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    .content th, .content td { border: 1px solid #e0e0e0; padding: 12px; text-align: left; }
    .content th { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .content tr:nth-child(even) { background: #f8f9fa; }
    .content tr:hover { background: #e8f4fd; }
    .content blockquote {
      border-left: 4px solid #667eea;
      margin: 20px 0;
      padding: 15px 20px;
      background: #f8f9fa;
      color: #555;
    }
    .content code {
      background: #f1f3f4;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Consolas', monospace;
    }
    .charts-section {
      padding: 40px;
      background: #f8f9fa;
      border-top: 1px solid #e0e0e0;
    }
    .charts-section h2 {
      color: #1a1a2e;
      text-align: center;
      margin-bottom: 30px;
    }
    .chart-container {
      background: white;
      border-radius: 12px;
      margin-bottom: 30px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .chart-container h4 {
      margin: 0;
      padding: 15px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 1em;
    }
    .chart-frame {
      width: 100%;
      height: 450px;
      border: none;
    }
    .footer {
      text-align: center;
      padding: 30px;
      background: #1a1a2e;
      color: rgba(255,255,255,0.7);
      font-size: 0.9em;
    }
    @media (max-width: 768px) {
      .container { padding: 20px 10px; }
      .header { padding: 30px 20px; }
      .header h1 { font-size: 1.8em; }
      .content { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="report-card">
      <div class="header">
        <h1>${stockName} 财务研报</h1>
        <div class="subtitle">AI Agent 自动生成 · ${new Date().toLocaleDateString(
          'zh-CN'
        )}</div>
      </div>
      <div class="content" id="report-content"></div>
      ${
        chartsHtml
          ? `<div class="charts-section">
          <h2>📊 数据可视化图表</h2>
          ${chartsHtml}
        </div>`
          : ''
      }
      <div class="footer">
        本报告由 AI Agent 自动生成，数据来源：东方财富、AkShare<br>
        报告生成时间：${new Date().toLocaleString('zh-CN')}
      </div>
    </div>
  </div>
  <script>
    const mdContent = ${JSON.stringify(mdContent)};
    document.getElementById('report-content').innerHTML = marked.parse(mdContent);
  </script>
</body>
</html>`
}

/**
 * 深度研报生成节点
 */
export async function generateDeepReport(state: typeof OverallState.State) {
  console.log(`📝 正在生成 ${state.stock_name} 的深度研报...`)

  // 1. 读取汇总报告
  const summaryFile =
    state.final_report || findLatestSummaryReport() || '财务研报汇总.md'
  let reportContent = getReportFile(summaryFile)

  if (!reportContent) {
    console.log('  ⚠️ 未找到汇总报告，尝试读取各分项报告...')
    // 尝试拼接各分项报告
    const companyInfo = getReportFile('公司信息数据.md') || ''
    const shareholderInfo = getReportFile('股东信息数据.md') || ''
    const businessInfo = getReportFile('主营业务与核心竞争力.md') || ''
    const valuationModel = getReportFile('估值与预测模型.md') || ''
    reportContent = [companyInfo, shareholderInfo, businessInfo, valuationModel]
      .filter(Boolean)
      .join('\n\n---\n\n')
  }

  if (!reportContent) {
    throw new Error('没有可用的研报内容')
  }

  // 2. 生成大纲
  console.log('\n📋 生成报告大纲...')
  const parts = await generateOutline(
    state.stock_name,
    reportContent,
    report_background
  )
  console.log(`  - 共 ${parts.length} 个章节`)
  parts.forEach((p, i) => console.log(`    ${i + 1}. ${p.part_title}`))

  // 3. 分段生成深度研报
  console.log('\n✍️ 开始分段生成深度研报...')
  const fullReport: string[] = [`# ${state.stock_name}公司研报\n`]
  let prevContent = ''

  for (let idx = 0; idx < parts.length; idx++) {
    const part = parts[idx]
    console.log(`  - 正在生成：${part.part_title} (${idx + 1}/${parts.length})`)

    const sectionText = await generateSection(
      part.part_title,
      prevContent,
      report_background,
      reportContent
    )

    fullReport.push(sectionText)
    console.log(`  ✅ 已完成：${part.part_title}`)

    prevContent = fullReport.join('\n\n')
  }

  // 4. 保存 Markdown 报告
  const finalReportContent = fullReport.join('\n\n')
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
  const mdFilename = `深度财务研报分析_${timestamp}.md`
  saveMarkdown(finalReportContent, mdFilename, 'final_output')

  // 5. 收集所有图表并生成 HTML 报告
  console.log('\n🎨 生成 HTML 报告...')
  const charts = collectAllCharts()
  console.log(
    `  - 收集到 ${charts.reduce((sum, c) => sum + c.files.length, 0)} 个图表`
  )

  const htmlContent = generateFinalHtmlReport(
    state.stock_name,
    finalReportContent,
    charts
  )
  const htmlFilename = `深度财务研报分析_${timestamp}.html`
  const projectRoot = path.join(__dirname, '../../')
  const htmlPath = path.join(projectRoot, 'final_output', htmlFilename)
  fs.writeFileSync(htmlPath, htmlContent, 'utf-8')

  console.log(`\n✅ 深度研报生成完成!`)
  console.log(`  📄 Markdown: final_output/${mdFilename}`)
  console.log(`  🌐 HTML: final_output/${htmlFilename}`)

  return {
    final_report: htmlFilename,
  }
}

/**
 * 查找最新的汇总报告文件
 */
function findLatestSummaryReport(): string | null {
  const projectRoot = path.join(__dirname, '../../')
  const outputDir = path.join(projectRoot, 'final_output')

  if (!fs.existsSync(outputDir)) return null

  const files = fs.readdirSync(outputDir)
  const summaryFiles = files
    .filter((f) => f.startsWith('财务研报汇总_') && f.endsWith('.md'))
    .sort()
    .reverse()

  return summaryFiles.length > 0 ? summaryFiles[0] : null
}

// ============================================
// 合并后的 6 个节点
// ============================================

/**
 * 节点1: 市场数据采集
 * 合并: getCompetitorAndIndustryData + getCompetitorInfo + getFinancialData
 */
export async function collectMarketData(state: typeof OverallState.State) {
  console.log('\n🌐 === 阶段1: 市场数据采集 ===\n')

  // 1. 获取竞争对手与行业数据
  const industryResult = await getCompetitorAndIndustryData(state)
  const stateWithIndustry = {...state, ...industryResult}

  // 2. 提取竞争对手结构化信息
  const competitorResult = await getCompetitorInfo(stateWithIndustry)
  const stateWithCompetitor = {...stateWithIndustry, ...competitorResult}

  // 3. 采集财务报表数据
  await getFinancialData(stateWithCompetitor)

  return {
    competitor_and_industry_data: industryResult.competitor_and_industry_data,
    competitor_info: competitorResult.competitor_info,
  }
}

/**
 * 节点2: 财务计算
 * 保持独立（计算密集型任务）
 */
export async function calculateFinancials(state: typeof OverallState.State) {
  console.log('\n🧮 === 阶段2: 财务指标计算 ===\n')
  return await financialCaculate(state)
}

/**
 * 节点3: 分析与可视化
 * 合并: analyzeFinancialData + generateCompareCompanyReport + mergerReports
 */
export async function analyzeAndVisualize(state: typeof OverallState.State) {
  console.log('\n📊 === 阶段3: 分析与可视化 ===\n')

  // 1. 趋势分析（生成图表）
  const analyzeResult = await analyzeFinancialData(state)
  const stateWithAnalyze = {...state, ...analyzeResult}

  // 2. 对比分析（生成图表）
  const compareResult = await generateCompareCompanyReport(stateWithAnalyze)
  const stateWithCompare = {...stateWithAnalyze, ...compareResult}

  // 3. 汇总报告
  const mergeResult = await mergerReports(stateWithCompare)

  return {
    company_report: analyzeResult.company_report,
    compare_company_report: compareResult.compare_company_report,
    formatted_output: mergeResult.formatted_output,
  }
}

/**
 * 节点4: 公司概况采集
 * 合并: getBusinessInfo + getShareholderInfo + getCompanyInfo
 */
export async function collectCompanyProfile(state: typeof OverallState.State) {
  console.log('\n🏢 === 阶段4: 公司概况采集 ===\n')

  // 并行采集（互不依赖）
  const [businessResult, shareholderResult, companyResult] = await Promise.all([
    getBusinessInfo(state),
    getShareholderInfo(state),
    getCompanyInfo(state),
  ])

  return {
    business_info: businessResult.business_info,
    shareholder_info: shareholderResult.shareholder_info,
    company_info: companyResult.company_info,
  }
}

/**
 * 节点5: 整合分析
 * 合并: generateValuationModel + summarizeFirstStageData
 */
export async function consolidateAnalysis(state: typeof OverallState.State) {
  console.log('\n📋 === 阶段5: 整合分析 ===\n')

  // 1. 生成估值模型
  const valuationResult = await generateValuationModel(state)
  const stateWithValuation = {...state, ...valuationResult}

  // 2. 汇总所有数据
  const summaryResult = await summarizeFirstStageData(stateWithValuation)

  return {
    valuation_model: valuationResult.valuation_model,
    final_report: summaryResult.final_report,
  }
}

/**
 * 节点6: 生成报告
 * 保持独立
 */
export async function generateReport(state: typeof OverallState.State) {
  console.log('\n📝 === 阶段6: 生成深度报告 ===\n')
  return await generateDeepReport(state)
}

/**
 * 构建财务研报工作流（6 节点版本）
 */
export function buildFinancialGraph(useExistingData = false) {
  const builder = new StateGraph(OverallState)

  if (useExistingData) {
    // 快速模式：跳过数据采集，直接分析
    builder
      .addNode('analyze_and_visualize', analyzeAndVisualize)
      .addNode('generate_report', generateReport)
      .addEdge(START, 'analyze_and_visualize')
      .addEdge('analyze_and_visualize', 'generate_report')
      .addEdge('generate_report', END)
  } else {
    // 完整模式：6 个节点
    builder
      .addNode('collect_market_data', collectMarketData)
      .addNode('calculate_financials', calculateFinancials)
      .addNode('analyze_and_visualize', analyzeAndVisualize)
      .addNode('collect_company_profile', collectCompanyProfile)
      .addNode('consolidate_analysis', consolidateAnalysis)
      .addNode('generate_report', generateReport)
      .addEdge(START, 'collect_market_data')
      .addEdge('collect_market_data', 'calculate_financials')
      .addEdge('calculate_financials', 'analyze_and_visualize')
      .addEdge('analyze_and_visualize', 'collect_company_profile')
      .addEdge('collect_company_profile', 'consolidate_analysis')
      .addEdge('consolidate_analysis', 'generate_report')
      .addEdge('generate_report', END)
  }

  return builder.compile()
}

/**
 * 从已有文件加载竞品信息
 */
export function loadExistingCompetitorInfo(
  stockCode: string
): Array<{name: string; stock_code: string}> {
  const dataDir = path.join(__dirname, '../../data/financial_statements')
  if (!fs.existsSync(dataDir)) return []

  const files = fs.readdirSync(dataDir)
  const stockCodes = new Set<string>()

  files.forEach((f) => {
    const match = f.match(/^(\d{6})_\d{4}_/)
    if (match && match[1] !== stockCode) {
      stockCodes.add(match[1])
    }
  })

  // 简单映射股票代码到公司名称
  const codeToName: Record<string, string> = {
    '000858': '五粮液',
    '000568': '泸州老窖',
    '002304': '洋河股份',
    '600809': '山西汾酒',
    '600702': '舍得酒业',
  }

  return Array.from(stockCodes).map((code) => ({
    name: codeToName[code] || `公司${code}`,
    stock_code: code,
  }))
}

/**
 * 运行示例
 */
export async function runFinancialWorkflow() {
  const workflow = buildFinancialGraph()
  const result = await workflow.invoke({
    stock_code: '600519',
    stock_name: '贵州茅台',
    market: 'A股',
    year: ['2022', '2023', '2024'],
  })

  console.log('--- 研报生成第一步完成 ---')
  console.log('竞争对手与行业数据:', result.competitor_and_industry_data)
}
