import {StateGraph, END, START} from '@langchain/langgraph'
import {ChatOpenAI} from '@langchain/openai'
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages'
import {HumanLoopState, HumanLoopStateType} from './types'
import {tools, toolsByName} from './tools'
import {MemorySaver} from '@langchain/langgraph'
import {interrupt, Command} from '@langchain/langgraph'
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

// LLM 节点
async function llmNode(state: HumanLoopStateType) {
  const messages = [
    new SystemMessage(
      '你是一个仓库管理员，根据用户的要求回答相关的价格和库存信息'
    ),
    new HumanMessage(state.query),
    ...state.messages,
  ]

  const response = await llmWithTools.invoke(messages)

  return {messages: [response]}
}

// 人工节点
async function humanNode(state: HumanLoopStateType) {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage
  const toolCall = lastMessage.tool_calls?.[0]

  if (!toolCall) {
    return {messages: []}
  }

  // 使用 interrupt 暂停执行，等待用户输入
  const userInput = interrupt(toolCall.args)
  console.log('[用户输入]', userInput)

  const toolMessage = new ToolMessage({
    tool_call_id: toolCall.id,
    content: String(userInput),
  })

  return {messages: [toolMessage]}
}

// 工具节点
async function toolNode(state: HumanLoopStateType) {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage
  const toolCalls = lastMessage.tool_calls || []

  const toolMessages = await Promise.all(
    toolCalls.map(async (toolCall) => {
      const tool = toolsByName[toolCall.name as keyof typeof toolsByName]
      console.log('[调用工具]', toolCall.name, toolCall.args)
      const result = await tool.invoke(toolCall.args)

      return new ToolMessage({
        content: String(result),
        tool_call_id: toolCall.id,
      })
    })
  )

  return {messages: toolMessages}
}

// 路由函数
function enterTools(state: HumanLoopStateType): string {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage
  const toolCalls = lastMessage.tool_calls

  if (!toolCalls || toolCalls.length === 0) {
    return END
  }

  const toolName = toolCalls[0].name
  console.log('[进入工具]', toolName)
  console.log('[参数]', toolCalls[0].args)

  if (toolName === 'ask_user') {
    return 'humanNode'
  }

  return 'toolNode'
}

// 构建图
export function buildHumanLoopGraph() {
  const workflow = new StateGraph(HumanLoopState)
    .addNode('llmNode', llmNode)
    .addNode('humanNode', humanNode)
    .addNode('toolNode', toolNode)
    .addEdge(START, 'llmNode')
    .addConditionalEdges('llmNode', enterTools, {
      humanNode: 'humanNode',
      toolNode: 'toolNode',
      [END]: END,
    })
    .addEdge('toolNode', 'llmNode')
    .addEdge('humanNode', 'llmNode')

  // 使用 MemorySaver 保存状态
  const memory = new MemorySaver()
  return workflow.compile({checkpointer: memory})
}

// 运行人机协作 Agent
export async function runHumanLoopAgent(
  query: string,
  getUserInput: () => Promise<string>
): Promise<string> {
  console.log('[启动人机协作模式 Agent]')
  console.log(`[用户问题] ${query}\n`)

  const app = buildHumanLoopGraph()
  const threadConfig = {configurable: {thread_id: '123'}}

  // 第一次启动
  let result = await app.invoke(
    {
      query,
      messages: [],
    },
    threadConfig
  )

  // 检查是否需要人工输入
  const lastMessage = result.messages[result.messages.length - 1] as AIMessage
  if (lastMessage.tool_calls && lastMessage.tool_calls[0].name === 'ask_user') {
    console.log('\n[等待用户输入...]')
    const userInput = await getUserInput()
    console.log(`[用户回答] ${userInput}\n`)

    // 恢复执行
    result = await app.invoke(new Command({resume: userInput}), threadConfig)
  }

  const finalMessage = result.messages[result.messages.length - 1]
  return finalMessage.content as string
}

