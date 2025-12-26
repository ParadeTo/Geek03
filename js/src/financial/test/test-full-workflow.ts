import {buildFinancialGraph} from '../agent'

async function testFullWorkflow() {
  console.log('🚀 开始完整工作流测试...')
  console.log('='.repeat(60))
  console.log('目标：贵州茅台 (600519) 财务研报')
  console.log('='.repeat(60))

  const startTime = Date.now()

  try {
    const workflow = buildFinancialGraph()

    const result = await workflow.invoke({
      stock_code: '600519',
      stock_name: '贵州茅台',
      market: 'A股',
      year: ['2022', '2023', '2024'],
    })

    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1)

    console.log('\n' + '='.repeat(60))
    console.log('🎉 完整工作流执行完成!')
    console.log('='.repeat(60))
    console.log(`⏱️  总耗时: ${duration} 分钟`)
    console.log(`📄 最终报告: final_output/${result.final_report}`)
    console.log('\n请用浏览器打开 HTML 文件查看完整报告!')
  } catch (error) {
    console.error('\n❌ 工作流执行失败:', error)
    process.exit(1)
  }
}

testFullWorkflow()

