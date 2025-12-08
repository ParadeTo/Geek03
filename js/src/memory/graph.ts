import {StateGraph, Annotation, MemorySaver} from '@langchain/langgraph'
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages'
import {ChatOpenAI} from '@langchain/openai'
import {tools, addTool} from './tools'
import * as dotenv from 'dotenv'

dotenv.config()

const GraphState = Annotation.Root({
  messages: Annotation<any[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
})

const llm = new ChatOpenAI({
  modelName: 'gpt-4o',
  apiKey: process.env.API_KEY || '',
  configuration: {
    baseURL: 'http://localhost:3001',
  },
}).bindTools(tools)

const SYSTEM_PROMPT =
  '你是一个餐卡管理员，用户餐卡初始的金额为100元，请根据用户的问题进行餐卡的操作'

const toolsByName: Record<string, typeof addTool> = {
  add_tool: addTool,
}

async function llmCall(state: typeof GraphState.State) {
  const messages = [new SystemMessage(SYSTEM_PROMPT), ...state.messages]
  const response = await llm.invoke(messages)
  return {messages: [response]}
}

async function toolNode(state: typeof GraphState.State) {
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
      const result = await tool.invoke(tc.args)
      console.log('工具名称:', tc.name)
      console.log('工具参数:', tc.args)
      return new ToolMessage({
        content: String(result),
        tool_call_id: tc.id!,
      })
    })
  )

  return {messages: toolMessages}
}

function shouldContinue(
  state: typeof GraphState.State
): 'environment' | '__end__' {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return 'environment'
  }
  return '__end__'
}

export function buildGraph() {
  const workflow = new StateGraph(GraphState)
    .addNode('llm_call', llmCall)
    .addNode('environment', toolNode)
    .addEdge('__start__', 'llm_call')
    .addConditionalEdges('llm_call', shouldContinue, {
      environment: 'environment',
      __end__: '__end__',
    })
    .addEdge('environment', 'llm_call')

  const memory = new MemorySaver()
  return workflow.compile({checkpointer: memory})
}

export async function runMemoryAgent() {
  const agent = buildGraph()
  const config = {configurable: {thread_id: '1'}}

  // 第一轮对话
  const result1 = await agent.invoke(
    {messages: [new HumanMessage('请帮我充值10元，并告诉我充值后的餐卡余额')]},
    config
  )
  console.log(result1.messages[result1.messages.length - 1].content)

  // 第二轮对话（同一个 thread_id，会保持上下文）
  const result2 = await agent.invoke(
    {messages: [new HumanMessage('请帮我充值10元，并告诉我充值后的餐卡余额')]},
    config
  )
  console.log(result2.messages[result2.messages.length - 1].content)
}
