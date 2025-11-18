import readline from 'node:readline'
import {runHumanLoopAgent} from './graph'

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        resolve(answer)
      })
    })
  }

  try {
    const result = await runHumanLoopAgent(
      '我想买一些苹果，总共需要多少钱',
      async () => {
        return await question('请输入: ')
      }
    )

    console.log('\n[完成]')
    console.log('[最终答案]', result)
  } catch (error) {
    console.error('[错误]', error)
  } finally {
    rl.close()
    process.exit(0)
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('[main 函数错误]', error)
    process.exit(1)
  })
}
