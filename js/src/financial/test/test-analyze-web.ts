import {analyzeFinancialData} from '../agent'
import {getFinancialCaculatesFileMap, readCsv} from '../utils'
import {analyze_financial_data_user_prompt} from '../prompts'

async function test() {
  console.log('🚀 开始测试 Web 版 AnalyzeAgent（ECharts 图表生成）...\n')

  // 构造模拟状态
  const mockState: any = {
    stock_code: '600519',
    stock_name: '贵州茅台',
    market: 'A股',
    year: ['2022', '2023', '2024'],
    competitor_info: null, // 只分析本公司
  }

  try {
    console.log('⏳ 正在分析财务数据并生成可视化图表...\n')
    const result = await analyzeFinancialData(mockState)

    console.log('\n✅ 分析完成！')
    console.log('📂 请查看 analyze_agent_outputs/ 目录下的 session_xxx 文件夹')
    console.log('   - 分析报告.html（包含 ECharts 图表的完整报告）')
    console.log('   - 最终分析报告.md（Markdown 版本）')
    console.log('   - *.html（各个独立图表文件）')
  } catch (error) {
    console.error('❌ 分析过程中出现错误:', error)
  }
}

test()

