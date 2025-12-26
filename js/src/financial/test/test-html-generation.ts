/**
 * 测试最终 HTML 报告生成
 * 使用已有的数据文件，跳过数据采集步骤
 */
import * as path from 'path'
import * as fs from 'fs'
import {generateDeepReport} from '../agent'
import {getReportFile} from '../utils'

async function testHtmlGeneration() {
  console.log('🚀 测试 HTML 报告生成...')
  console.log('='.repeat(60))

  // 检查已有的报告文件
  const files = [
    '公司信息数据.md',
    '股东信息数据.md',
    '主营业务与核心竞争力.md',
    '估值与预测模型.md',
  ]

  console.log('\n📂 检查已有报告文件:')
  let hasData = false
  for (const file of files) {
    const content = getReportFile(file)
    const status = content ? '✅' : '❌'
    console.log(`  ${status} ${file}`)
    if (content) hasData = true
  }

  if (!hasData) {
    console.log('\n⚠️ 没有找到已有的报告文件，请先运行其他节点生成数据。')
    console.log('   或者使用以下命令生成部分数据:')
    console.log('   - pnpm financial:company')
    console.log('   - pnpm financial:shareholder')
    console.log('   - pnpm financial:business')
    console.log('   - pnpm financial:valuation')
    return
  }

  // 构造模拟状态
  const mockState: any = {
    stock_code: '600519',
    stock_name: '贵州茅台',
    market: 'A股',
    year: ['2022', '2023', '2024'],
    final_report: '', // 会自动查找最新汇总报告
  }

  try {
    console.log('\n⏳ 正在生成深度研报（包含 HTML）...\n')
    const result = await generateDeepReport(mockState)

    console.log('\n' + '='.repeat(60))
    console.log('🎉 HTML 报告生成完成!')
    console.log('='.repeat(60))
    console.log(`📄 最终报告: final_output/${result.final_report}`)
    console.log('\n请用浏览器打开 HTML 文件查看完整报告!')
  } catch (error) {
    console.error('\n❌ 生成失败:', error)
  }
}

testHtmlGeneration()

