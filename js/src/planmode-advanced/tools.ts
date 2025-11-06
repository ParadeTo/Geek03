import {z} from 'zod'
import {tool} from '@langchain/core/tools'
import {zodToJsonSchema} from 'zod-to-json-schema'

const getClosingPriceSchema = z.object({
  name: z.string().describe('股票名称'),
})

export const getClosingPriceTool = tool(
  (input) => {
    const name = (input as {name: string}).name
    if (name === '青岛啤酒') return '67.92'
    if (name === '贵州茅台') return '1488.21'
    if (name === '比亚迪') return '256.3'
    if (name === '宁德时代') return '189.7'
    return '未搜到该股票'
  },
  {
    name: 'get_closing_price',
    description: '获取指定股票的收盘价',
    schema: zodToJsonSchema(getClosingPriceSchema) as any,
  }
)

const calculatorSchema = z.object({
  expression: z
    .string()
    .describe('数学表达式，如 "100 * 0.15" 或 "(200 - 150) / 2"'),
})

export const calculatorTool = tool(
  (input) => {
    try {
      const expression = (input as {expression: string}).expression
      const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '')
      const result = eval(sanitized)
      return `${result}`
    } catch (error) {
      return '计算错误'
    }
  },
  {
    name: 'calculator',
    description: '执行数学计算，支持加减乘除和括号',
    schema: zodToJsonSchema(calculatorSchema) as any,
  }
)

export const tools = [getClosingPriceTool, calculatorTool]
