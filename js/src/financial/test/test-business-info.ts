import {getBusinessInfo} from '../agent'

async function test() {
  console.log('🚀 开始单独调试 getBusinessInfo 节点...')

  const mockState: any = {
    stock_code: '600519',
    stock_name: '贵州茅台',
    market: 'A股',
  }

  try {
    console.log('⏳ 正在通过深度搜索获取主营业务与核心竞争力...')
    const result = await getBusinessInfo(mockState)

    console.log('\n✅ 搜索完成！')
    console.log('📂 结果已保存至: final_output/主营业务与核心竞争力.md')

    // 打印前500字符预览
    const preview = result.business_info.substring(0, 500)
    console.log('\n--- 内容预览 ---')
    console.log(preview + '...')
  } catch (error) {
    console.error('❌ 获取过程中出现错误:', error)
  }
}

test()


