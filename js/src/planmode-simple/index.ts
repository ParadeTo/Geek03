import {runPlanAgent} from './graph'

async function main() {
  const query = '贵州茅台和青岛啤酒哪个贵？'

  try {
    const result = await runPlanAgent(query)
    console.log('[最终答案]\n', result)
  } catch (error) {
    console.error('[运行出错]', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
