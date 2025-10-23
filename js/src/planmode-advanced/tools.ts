import {z} from 'zod'
import {tool} from '@langchain/core/tools'

const getClosingPriceSchema = z.object({
  name: z.string().describe('股票名称'),
})

export const getClosingPriceTool = tool(
  (input) => {
    const name = (input as {name: string}).name
    if (name === '青岛啤酒') return '67.92'
    if (name === '贵州茅台') return '1488.21'
    return '未搜到该股票'
  },
  {
    name: 'get_closing_price',
    description: '获取指定股票的收盘价',
    schema: getClosingPriceSchema,
  }
)

export const tools = [getClosingPriceTool]
