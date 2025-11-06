import {runAdvancedPlanAgent} from './graph'

async function main() {
  // 设计一个需要动态调整的复杂任务
  const input = `仅根据收盘价帮我分析一下青岛啤酒和贵州茅台的投资价值对比，低的更有价值`

  // 初始计划故意不完整，让 Agent 根据实际情况动态调整
  const plan = ['获取青岛啤酒的股票收盘价']

  try {
    const result = await runAdvancedPlanAgent(input, plan)
    console.log('[最终答案]\n', result)
  } catch (error) {
    console.error('[运行出错]', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
