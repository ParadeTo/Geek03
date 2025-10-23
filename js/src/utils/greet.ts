/**
 * 问候函数
 * @param name 要问候的名字
 * @returns 问候语
 */
export function greet(name: string): string {
  return `Hello, ${name}! Welcome to TypeScript Node.js project.`
}

/**
 * 获取当前时间的问候语
 * @param name 要问候的名字
 * @returns 带时间的问候语
 */
export function greetWithTime(name: string): string {
  const now = new Date()
  const timeString = now.toLocaleTimeString()
  return `${greet(name)} Current time is ${timeString}.`
}


