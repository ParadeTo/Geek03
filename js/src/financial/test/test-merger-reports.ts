import {mergerReports} from '../agent'

async function test() {
  console.log('🚀 开始单独调试 mergerReports 节点...')

  // 构造模拟状态（此节点不依赖状态，只读取文件系统）
  const mockState: any = {
    stock_code: '600519',
    stock_name: '贵州茅台',
    market: 'A股',
    year: ['2023'],
    formatted_output: [],
  }

  try {
    const result = await mergerReports(mockState)
    console.log('\n📋 汇总结果预览:')
    console.log(`共收集 ${result.formatted_output.length} 条内容`)

    // 打印前500字符预览
    const preview = result.formatted_output.join('\n').substring(0, 500)
    console.log('\n--- 内容预览 ---')
    console.log(preview + '...')
  } catch (error) {
    console.error('❌ 汇总过程中出现错误:', error)
  }
}

test()


