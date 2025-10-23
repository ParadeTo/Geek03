import {runAdvancedPlanAgent} from './graph'

async function main() {
  const input = '完成所有计划后输出DONE'
  const plan = [
    '获取青岛啤酒的股票收盘价',
    '获取贵州茅台的股票收盘价',
    '比较青岛啤酒与贵州茅台的股票收盘价，得出哪个更贵的结论',
  ]

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
