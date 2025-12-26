import {analyzeFinancialData} from '../agent'

async function test() {
  console.log('🚀 开始单独调试 analyzeFinancialData 节点...')

  // 构造模拟状态
  // 注意：需要确保 data/financial_caculates 下已经有对应的计算结果 CSV 文件
  const mockState: any = {
    stock_code: '600519',
    stock_name: '贵州茅台',
    market: 'A股',
    year: ['2023'],
    competitor_info: {
      competitors: [
        {
          stock_name: '五粮液',
          stock_code: '000858',
          market: 'A股',
        },
      ],
    },
  }

  try {
    console.log('⏳ 正在对计算出的财务指标进行趋势分析...')
    const result = await analyzeFinancialData(mockState)
    console.log('✅ 财务分析任务执行完毕！')
    console.log('📂 请检查 analyze_agent_outputs 目录下的最终分析报告。')
    
    // 打印其中一个报告的开头部分
    const firstReport = Object.values(result.company_report)[0] as string
    console.log('\n📝 报告样本预览:')
    console.log(firstReport.substring(0, 300) + '...')
  } catch (error) {
    console.error('❌ 分析过程中出现错误:', error)
  }
}

test()



