import {Tool, ToolRegistry} from './types'

/**
 * 工具定义列表
 */
export const tools: Tool[] = [
  {
    name: 'get_closing_price',
    description: '使用该工具获取指定股票的收盘价',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '股票名称',
        },
      },
      required: ['name'],
    },
  },
]

/**
 * 获取股票收盘价
 * @param name 股票名称
 * @returns 收盘价字符串
 */
export function getClosingPrice(name: string): string {
  if (name === '青岛啤酒') {
    return '67.92'
  } else if (name === '贵州茅台') {
    return '1488.21'
  } else {
    return '未搜到该股票'
  }
}

/**
 * 工具函数注册表
 */
export const toolRegistry: ToolRegistry = {
  get_closing_price: (params: Record<string, any>) => {
    const name = params.name as string
    return getClosingPrice(name)
  },
}
