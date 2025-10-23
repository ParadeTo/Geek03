import {z} from 'zod'
import {tool} from '@langchain/core/tools'
import {zodToJsonSchema} from 'zod-to-json-schema'
import vm from 'vm'

const executeJavaScriptSchema = z.object({
  code: z.string().describe('要执行的 JavaScript 代码'),
})

export const executeJavaScriptTool = tool(
  (input) => {
    const code = (input as {code: string}).code
    try {
      console.log('## 执行代码:\n', code)

      // 使用 vm 创建沙箱环境
      const context = {result: undefined, console}
      vm.createContext(context)
      vm.runInContext(code, context, {timeout: 5000})

      const result = context.result ?? '执行成功'
      console.log('## 执行结果:\n', result)
      return String(result)
    } catch (error: any) {
      return `代码执行错误: ${error.message}`
    }
  },
  {
    name: 'execute_javascript',
    description: '执行 JavaScript 代码并返回结果',
    schema: zodToJsonSchema(executeJavaScriptSchema) as any,
  }
)

export const tools = [executeJavaScriptTool]
