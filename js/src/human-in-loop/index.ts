import {runHumanLoopAgent} from './graph'
import * as readline from 'readline'

// 创建命令行输入接口
function createReadlineInterface() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return {
    question: (prompt: string): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
          resolve(answer)
        })
      })
    },
    close: () => rl.close(),
  }
}

async function main() {
  const rl = createReadlineInterface()

  try {
    const result = await runHumanLoopAgent(
      '我想买一些苹果，总共需要多少钱',
      async () => {
        return await rl.question('请输入: ')
      }
    )

    console.log('\n[完成]')
    console.log('[最终答案]', result)
  } catch (error) {
    console.error('[错误]', error)
    process.exit(1)
  } finally {
    rl.close()
  }
}

if (require.main === module) {
  main()
}

