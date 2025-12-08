import {tool} from '@langchain/core/tools'
import {zodToJsonSchema} from 'zod-to-json-schema'
import {z} from 'zod'

const addToolSchema = z.object({
  original_amount: z.number().describe('餐卡原始金额'),
})

export const addTool = tool(
  (input) => {
    const {original_amount} = input as {original_amount: number}
    return String(original_amount + 10)
  },
  {
    name: 'add_tool',
    description: '餐卡充值工具，入参为餐卡原始金额，出参为充值后的金额',
    schema: zodToJsonSchema(addToolSchema) as any,
  }
)

export const tools = [addTool]

