import {tool} from '@langchain/core/tools'
import {z} from 'zod'

// 获取商品库存
export const getStockTool = tool(
  async (input) => {
    const {product} = input as {product: string}
    const stock = Math.floor(Math.random() * 100)
    return `商品${product}的库存为${stock}件`
  },
  {
    name: 'get_stock',
    description: '获取商品库存',
    schema: z.object({
      product: z.string().describe('商品名称'),
    }),
  }
)

// 获取商品价格
export const getPriceTool = tool(
  async (input) => {
    const {product} = input as {product: string}
    const price = (Math.random() * 90 + 10).toFixed(2)
    return `商品${product}的价格为${price}元`
  },
  {
    name: 'get_price',
    description: '获取商品价格',
    schema: z.object({
      product: z.string().describe('商品名称'),
    }),
  }
)

// 询问用户
export const askUserTool = tool(
  async (input) => {
    const {question} = input as {question: string}
    console.log('[需要询问用户]', question)
    return question
  },
  {
    name: 'ask_user',
    description: '询问用户进一步的需求，如用户要多少件商品、要什么商品等',
    schema: z.object({
      question: z.string().describe('需要询问用户的问题'),
    }),
  }
)

export const tools = [getStockTool, getPriceTool, askUserTool]

export const toolsByName = {
  get_stock: getStockTool,
  get_price: getPriceTool,
  ask_user: askUserTool,
}

