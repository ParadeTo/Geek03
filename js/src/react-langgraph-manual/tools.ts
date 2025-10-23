/**
 * 工具定义和注册表
 */

// 工具定义（OpenAI Function Call 格式）
export const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'get_closing_price',
      description: '获取指定股票的收盘价',
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
  },
]

// 工具实现函数
export function getClosingPrice(name: string): string {
  if (name === '青岛啤酒') {
    return '67.92'
  } else if (name === '贵州茅台') {
    return '1488.21'
  } else {
    return '未搜到该股票'
  }
}

// 工具注册表
export const toolRegistry: Record<string, (params: any) => string> = {
  get_closing_price: (params: {name: string}) => {
    return getClosingPrice(params.name)
  },
}
