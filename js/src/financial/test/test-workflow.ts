import {runFinancialWorkflow} from '../agent'

async function test() {
  console.log('🚀 开始测试财务研报工作流 (第一阶段: 竞争对手分析)...')
  try {
    await runFinancialWorkflow()
    console.log('✅ 测试运行结束')
  } catch (error) {
    console.error('❌ 运行过程中出现错误:', error)
  }
}

test()



