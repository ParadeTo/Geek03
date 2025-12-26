import {financialCaculate} from '../agent'

async function test() {
  console.log('🚀 开始单独调试 financialCaculate 节点...')

  // 构造模拟状态
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
    console.log('⏳ 正在根据已采集的报表进行财务指标计算...')
    await financialCaculate(mockState)
    console.log('✅ 财务指标计算任务执行完毕！')
    console.log('📂 请检查 data/financial_caculates 目录下的 CSV 文件。')
  } catch (error) {
    console.error('❌ 计算过程中出现错误:', error)
  }
}

test()



