import {getShareholderInfo} from '../agent'

async function test() {
  console.log('🚀 开始单独调试 getShareholderInfo 节点...')

  const mockState: any = {
    stock_code: '600519',
    stock_name: '贵州茅台',
    market: 'A股',
  }

  try {
    console.log('⏳ 正在通过 ReAct Agent 采集股东结构信息...')
    const result = await getShareholderInfo(mockState)

    console.log('\n✅ 采集完成！')
    console.log('📂 结果已保存至: final_output/股东信息数据.md')

    // 打印前800字符预览
    const preview = result.shareholder_info.substring(0, 800)
    console.log('\n--- 内容预览 ---')
    console.log(preview + '...')
  } catch (error) {
    console.error('❌ 采集过程中出现错误:', error)
  }
}

test()


