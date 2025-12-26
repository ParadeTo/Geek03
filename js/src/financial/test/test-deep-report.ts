import {generateDeepReport} from '../agent'

async function test() {
  console.log('🚀 开始单独调试 generateDeepReport 节点...')

  // 构造模拟状态（使用已有的汇总报告）
  const mockState: any = {
    stock_code: '600519',
    stock_name: '贵州茅台',
    market: 'A股',
    final_report: '', // 会自动查找最新的汇总报告
  }

  try {
    console.log('⏳ 正在生成深度研报（这可能需要几分钟）...\n')
    const result = await generateDeepReport(mockState)

    console.log('\n🎉 深度研报生成完成！')
    console.log(`📂 结果已保存至: final_output/${result.final_report}`)
  } catch (error) {
    console.error('❌ 生成过程中出现错误:', error)
  }
}

test()


