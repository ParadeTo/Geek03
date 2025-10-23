import {runCodeActAgent} from './graph'

async function main() {
  const query = '请计算 1~100 的和'

  try {
    const result = await runCodeActAgent(query)
    console.log('[最终答案]\n', result)
  } catch (error) {
    console.error('[运行出错]', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
