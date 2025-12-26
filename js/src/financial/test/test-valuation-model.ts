import {generateValuationModel} from '../agent'

async function test() {
  console.log('🚀 开始单独调试 generateValuationModel 节点...')

  const mockState: any = {
    stock_code: '600519',
    stock_name: '贵州茅台',
    market: 'A股',
    year: ['2022', '2023', '2024'],
  }

  try {
    console.log('⏳ 正在构建估值与预测模型...')
    const result = await generateValuationModel(mockState)

    console.log('\n✅ 模型生成完成！')
    console.log('📂 结果已保存至: final_output/估值与预测模型.md')

    // 打印前500字符预览
    const preview = result.valuation_model.substring(0, 500)
    console.log('\n--- 内容预览 ---')
    console.log(preview + '...')
  } catch (error) {
    console.error('❌ 生成过程中出现错误:', error)
  }
}

test()


