import {AkShare} from '../akshare'

async function test() {
  console.log('🚀 开始测试 AkShare JS 桥接工具...')

  try {
    console.log('\n1. 测试通用接口: 获取 A 股实时行情 (少量数据)...')
    // 获取实时行情快照
    const spot = AkShare.generic('stock_zh_a_spot_em')
    console.log('✅ 获取成功，行情数据条数:', spot.length)
    if (spot.length > 0) {
      console.log('第一条行情:', JSON.stringify(spot[0], null, 2))
    }

    console.log('\n2. 测试获取贵州茅台 (600519) 2023年财务指标...')
    const indicators = AkShare.getFinancialIndicator('600519', '2023')
    console.log('✅ 获取成功，数据条数:', indicators.length)
    if (indicators.length > 0) {
      console.log(
        '样本数据:',
        JSON.stringify(indicators[0], null, 2).substring(0, 200) + '...'
      )
    }

    console.log('\n3. 测试历史行情接口: 获取贵州茅台最近 5 天日线数据...')
    const hist = AkShare.generic('stock_zh_a_hist', {
      symbol: '600519',
      period: 'daily',
      start_date: '20240101',
      adjust: 'qfq',
    })
    console.log('✅ 获取成功，历史行情条数:', hist.length)
    if (hist.length > 0) {
      console.log(
        '最近一条数据:',
        JSON.stringify(hist[hist.length - 1], null, 2)
      )
    }
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error)
  }
}

test()
