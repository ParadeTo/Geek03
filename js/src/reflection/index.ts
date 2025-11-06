import {runReflectionAgent} from './graph'

async function main() {
  const userQuery = '使用docker创建nginx容器，端口映射8080:80'

  try {
    const result = await runReflectionAgent(userQuery)

    console.log('\n[完成]')
    console.log('最终命令:', result.command)
    console.log('反思结果:', result.reflection)
    console.log('迭代次数:', result.iterations)
  } catch (error) {
    console.error('[错误]', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
