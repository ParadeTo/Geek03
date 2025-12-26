import express from 'express'
import cors from 'cors'
import * as path from 'path'
import * as fs from 'fs'
import {buildFinancialGraph, loadExistingCompetitorInfo} from './agent'

const app = express()
const PORT = 3002

app.use(cors())
app.use(express.json())

// 静态文件服务 - 用于访问生成的报告
app.use('/reports', express.static(path.join(__dirname, '../../final_output')))
// 图表文件路径 - 支持 HTML 中的相对路径引用
app.use('/analyze_agent_outputs', express.static(path.join(__dirname, '../../analyze_agent_outputs')))
app.use('/compare_company_report_outputs', express.static(path.join(__dirname, '../../compare_company_report_outputs')))

interface GenerateRequest {
  stockCode: string
  companyName: string
  years?: number[]
  useExistingData?: boolean
}

interface GenerateResponse {
  success: boolean
  reportUrl?: string
  reportPath?: string
  error?: string
  duration?: number
}

// 生成研报 API
app.post('/api/generate', async (req, res) => {
  const {stockCode, companyName, years = [2022, 2023, 2024], useExistingData = false} = req.body as GenerateRequest

  if (!stockCode || !companyName) {
    return res.status(400).json({
      success: false,
      error: '请提供股票代码和公司名称',
    } as GenerateResponse)
  }

  console.log(`\n📝 收到研报生成请求`)
  console.log(`   股票代码: ${stockCode}`)
  console.log(`   公司名称: ${companyName}`)
  console.log(`   分析年份: ${years.join(', ')}`)
  console.log(`   使用已有数据: ${useExistingData ? '是' : '否'}`)

  const startTime = Date.now()

  try {
    // 构建工作流（根据是否使用已有数据选择不同流程）
    const graph = buildFinancialGraph(useExistingData)

    // 准备初始状态
    let competitorInfo: Array<{name: string; stock_code: string}> = []
    if (useExistingData) {
      competitorInfo = loadExistingCompetitorInfo(stockCode)
      console.log(`   加载已有竞品: ${competitorInfo.map((c) => c.name).join(', ') || '无'}`)
    }

    const initialState = {
      stock_code: stockCode,
      company_name: companyName,
      years: years,
      competitor_info: competitorInfo,
      financial_statements: {},
      financial_caculates: {},
      industry_info: '',
      company_report: '',
      compare_company_report: '',
      shareholder_info: '',
      valuation_model: '',
      business_info: '',
      formatted_output: '',
      final_report: '',
    }

    console.log(`\n🚀 开始执行工作流${useExistingData ? '（快速模式）' : ''}...`)

    const result = await graph.invoke(initialState)

    const duration = Math.round((Date.now() - startTime) / 1000 / 60 * 10) / 10

    // 查找最新生成的报告
    const outputDir = path.join(__dirname, '../../final_output')
    const files = fs.readdirSync(outputDir)
    const htmlFiles = files
      .filter((f) => f.startsWith('深度财务研报分析_') && f.endsWith('.html'))
      .sort()
      .reverse()

    if (htmlFiles.length > 0) {
      const latestReport = htmlFiles[0]
      console.log(`\n✅ 研报生成完成!`)
      console.log(`   报告文件: ${latestReport}`)
      console.log(`   耗时: ${duration} 分钟`)

      return res.json({
        success: true,
        reportUrl: `/reports/${latestReport}`,
        reportPath: path.join(outputDir, latestReport),
        duration,
      } as GenerateResponse)
    } else {
      throw new Error('未找到生成的报告文件')
    }
  } catch (error: any) {
    console.error(`\n❌ 生成失败:`, error.message)
    return res.status(500).json({
      success: false,
      error: error.message,
    } as GenerateResponse)
  }
})

// 获取历史报告列表
app.get('/api/reports', (req, res) => {
  try {
    const outputDir = path.join(__dirname, '../../final_output')
    const files = fs.readdirSync(outputDir)
    const reports = files
      .filter((f) => f.startsWith('深度财务研报分析_') && f.endsWith('.html'))
      .map((f) => {
        const stat = fs.statSync(path.join(outputDir, f))
        const match = f.match(/深度财务研报分析_(\d{8})(\d{6})\.html/)
        let date = ''
        if (match) {
          const dateStr = match[1]
          const timeStr = match[2]
          date = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)} ${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}:${timeStr.slice(4, 6)}`
        }
        return {
          filename: f,
          url: `/reports/${f}`,
          date,
          size: Math.round(stat.size / 1024),
        }
      })
      .sort((a, b) => b.date.localeCompare(a.date))

    res.json({success: true, reports})
  } catch (error: any) {
    res.status(500).json({success: false, error: error.message})
  }
})

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({status: 'ok', timestamp: new Date().toISOString()})
})

app.listen(PORT, () => {
  console.log(`\n🚀 研报生成服务已启动`)
  console.log(`   地址: http://localhost:${PORT}`)
  console.log(`   API:`)
  console.log(`     POST /api/generate - 生成研报`)
  console.log(`     GET  /api/reports  - 获取历史报告`)
  console.log(`     GET  /api/health   - 健康检查`)
})

