import {summarizeFirstStageData} from '../agent'

async function test() {
  console.log('🚀 开始单独调试 summarizeFirstStageData 节点...')

  // 构造模拟状态（读取已有的文件）
  const mockState: any = {
    stock_code: '600519',
    stock_name: '贵州茅台',
    market: 'A股',
    formatted_output: [], // 会从文件读取
    company_info: '',
    shareholder_info: '',
    business_info: '',
    valuation_model: '',
  }

  try {
    console.log('⏳ 正在汇总第一阶段所有数据...')
    const result = await summarizeFirstStageData(mockState)

    console.log('\n✅ 汇总完成！')
    console.log(`📂 结果已保存至: final_output/${result.final_report}`)
  } catch (error) {
    console.error('❌ 汇总过程中出现错误:', error)
  }
}

test()


