import {generateCompareCompanyReport} from '../agent'

async function test() {
  console.log('🚀 开始单独调试 generateCompareCompanyReport 节点...')

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
    console.log('⏳ 正在生成主公司与竞争对手的对比分析报告...')
    const result = await generateCompareCompanyReport(mockState)
    console.log('✅ 对比分析任务执行完毕！')
    console.log('📂 请检查 compare_company_report_outputs 目录下的对比报告。')

    // 打印对比报告的开头部分
    const firstReport = Object.values(result.compare_company_report)[0] as string
    console.log('\n📝 对比报告样本预览:')
    console.log(firstReport.substring(0, 300) + '...')
  } catch (error) {
    console.error('❌ 对比分析过程中出现错误:', error)
  }
}

test()



