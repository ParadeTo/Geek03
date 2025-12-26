import {getFinancialData} from '../agent'

async function test() {
  console.log('🚀 开始单独调试 getFinancialData 节点...')

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
    console.log('⏳ 正在执行数据采集 (预计耗时较长)...')
    await getFinancialData(mockState)
    console.log('✅ 所有数据采集任务执行完毕！')
    console.log('📂 请检查 data/financial_statements 目录下的 CSV 文件。')
  } catch (error) {
    console.error('❌ 数据采集过程中出现错误:', error)
  }
}

test()



