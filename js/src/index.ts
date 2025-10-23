import {greet} from './utils/greet'

console.log('Hello, TypeScript Node.js!')
console.log(greet('World'))

// 示例异步函数
async function main(): Promise<void> {
  try {
    console.log('Starting application...')

    // 模拟异步操作
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log('Application started successfully!')
  } catch (error) {
    console.error('Error starting application:', error)
    process.exit(1)
  }
}

// 运行主函数
if (require.main === module) {
  main()
}
