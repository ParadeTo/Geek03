import {Annotation} from '@langchain/langgraph'
import {z} from 'zod'

// 状态定义
export const PlanExecuteState = Annotation.Root({
  input: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  plan: Annotation<string[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  pastSteps: Annotation<Array<[string, string]>>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  response: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
})

// 结构化输出 Schema
export const PlanSchema = z.object({
  steps: z.array(z.string()).describe('要遵循的不同步骤应按顺序排列'),
})

export const ResponseSchema = z.object({
  response: z.string().describe('对用户的最终回答'),
})

// Union 类型用于区分是计划还是响应
export const ActionSchema = z.union([
  z.object({
    type: z.literal('plan'),
    steps: z.array(z.string()),
  }),
  z.object({
    type: z.literal('response'),
    response: z.string(),
  }),
])

export type PlanExecuteStateType = typeof PlanExecuteState.State
export type ActionType = z.infer<typeof ActionSchema>
