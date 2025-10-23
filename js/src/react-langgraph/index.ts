import {runReactGraph} from './graph'

/**
 * 主函数
 */
async function main() {
  const query = '请比较青岛啤酒和贵州茅台的股票收盘价谁高？'

  try {
    const result = await runReactGraph(query)
    console.log('\n📝 最终答案:')
    console.log(result)
  } catch (error) {
    console.error('❌ 运行出错:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export {runReactGraph}
