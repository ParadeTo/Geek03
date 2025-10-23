import {StateGraph, END} from '@langchain/langgraph'
import {ChatOpenAI} from '@langchain/openai'
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
  ToolMessage,
} from '@langchain/core/messages'
import {PLAN_PROMPT, PLAN_EXECUTE_PROMPT} from './prompts'
import {tools, toolsByName} from './tools'
import {PlanState} from './types'
import * as dotenv from 'dotenv'

dotenv.config()

const llm = new ChatOpenAI({
  modelName: 'gpt-4o',
  apiKey: process.env.API_KEY || '',
  configuration: {
    baseURL: 'http://localhost:3001',
  },
})

const llmWithTools = llm.bindTools(tools)

// 计划节点：生成执行计划
async function planNode(state: typeof PlanState.State) {
  console.log('\n[计划节点] 生成执行计划...')

  const firstMessage = state.messages[0]
  if (!firstMessage) {
    throw new Error('没有用户消息')
  }

  const response = await llm.invoke([
    new SystemMessage(PLAN_PROMPT),
    firstMessage,
  ])

  const plan = response.content as string
  console.log('[计划内容]\n', plan)

  return {plan}
}

// 执行节点：按计划执行并调用工具
async function executeNode(state: typeof PlanState.State) {
  console.log('\n[执行节点] 按计划执行...')

  const messages = [
    new SystemMessage(PLAN_EXECUTE_PROMPT.replace('{plan}', state.plan)),
    ...state.messages,
  ]

  const response = await llmWithTools.invoke(messages)

  return {
    messages: [response],
  }
}

// 工具节点：执行工具调用
async function toolNode(state: typeof PlanState.State) {
  console.log('\n[工具节点] 执行工具...')

  const lastMessage = state.messages[state.messages.length - 1] as AIMessage
  const toolCalls = lastMessage.tool_calls || []

  const toolMessages = await Promise.all(
    toolCalls.map(async (tc: any) => {
      const tool = toolsByName[tc.name]
      if (!tool) {
        return new ToolMessage({
          content: `工具 ${tc.name} 不存在`,
          tool_call_id: tc.id!,
        })
      }

      console.log(`   执行: ${tc.name}(${JSON.stringify(tc.args)})`)
      const result = await tool.invoke(tc.args)
      console.log(`   结果: ${result}`)

      return new ToolMessage({
        content: String(result),
        tool_call_id: tc.id!,
      })
    })
  )

  return {messages: toolMessages}
}

// 路由函数：判断是否继续执行
function shouldContinue(state: typeof PlanState.State): string {
  const lastMessage = state.messages[state.messages.length - 1]
  if (!lastMessage) {
    return 'toolNode'
  }

  const content = lastMessage.content as string

  if (content && content.includes('Final Answer')) {
    return END
  }

  return 'toolNode'
}

// 构建计划模式图
export function buildPlanGraph() {
  const workflow = new StateGraph(PlanState)
    .addNode('planNode', planNode)
    .addNode('executeNode', executeNode)
    .addNode('toolNode', toolNode)
    .addEdge('__start__', 'planNode')
    .addEdge('planNode', 'executeNode')
    .addConditionalEdges('executeNode', shouldContinue, {
      toolNode: 'toolNode',
      [END]: END,
    })
    .addEdge('toolNode', 'executeNode')

  return workflow.compile()
}

// 运行计划 Agent
export async function runPlanAgent(query: string): Promise<string> {
  console.log('[启动计划模式 Agent]')
  console.log(`[用户问题] ${query}\n`)

  const app = buildPlanGraph()

  const result = await app.invoke({
    messages: [new HumanMessage(query)],
  } as any)

  const lastMessage = result.messages[result.messages.length - 1]
  if (!lastMessage) {
    throw new Error('没有返回消息')
  }

  const finalAnswer = lastMessage.content as string

  console.log('\n[完成]\n')
  return finalAnswer
}
