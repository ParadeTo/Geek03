import {StateGraph, Annotation} from '@langchain/langgraph'
import {AIMessage, HumanMessage, ToolMessage} from '@langchain/core/messages'
import {ChatOpenAI} from '@langchain/openai'
import {tools} from './tools'
import * as dotenv from 'dotenv'

dotenv.config()

/**
 * 定义状态结构（使用 LangGraph 的 Annotation）
 */
const GraphState = Annotation.Root({
  messages: Annotation<any[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  output: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
})

/**
 * 创建 LLM 实例（带工具绑定）
 */
const llm = new ChatOpenAI({
  modelName: 'gpt-4o',
  apiKey: process.env.API_KEY || '',
  configuration: {
    baseURL: 'http://localhost:3001',
  },
}).bindTools(tools)

/**
 * LLM 调用节点
 */
async function callModel(state: typeof GraphState.State) {
  console.log('\n🤖 LLM 节点: 调用模型...')

  const response = await llm.invoke(state.messages)

  // 如果有工具调用，显示信息
  if (response.tool_calls && response.tool_calls.length > 0) {
    console.log('📞 模型请求调用工具:')
    response.tool_calls.forEach((tc: any) => {
      console.log(`   - ${tc.name}(${JSON.stringify(tc.args)})`)
    })
  }

  return {messages: [response]}
}

/**
 * 工具执行节点
 */
async function callTools(state: typeof GraphState.State) {
  console.log('\n🔧 工具节点: 执行工具...')

  const lastMessage = state.messages[state.messages.length - 1] as AIMessage
  const toolCalls = lastMessage.tool_calls || []

  const toolMessages = await Promise.all(
    toolCalls.map(async (tc: any) => {
      const tool = tools.find((t) => t.name === tc.name)
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

/**
 * 路由函数：决定下一步
 */
function shouldContinue(state: typeof GraphState.State) {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage

  // 如果有工具调用，继续执行工具
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return 'tools'
  }

  // 否则结束
  return END
}

/**
 * 构建并编译图
 */
export function buildGraph() {
  const workflow = new StateGraph(GraphState)
    .addNode('agent', callModel)
    .addNode('tools', callTools)
    .addEdge('__start__', 'agent')
    .addConditionalEdges('agent', shouldContinue, {
      tools: 'tools',
      [END]: END,
    })
    .addEdge('tools', 'agent')

  return workflow.compile()
}

/**
 * 运行 Agent
 */
export async function runReactGraph(query: string): Promise<string> {
  console.log('\n🚀 启动 ReAct Agent (LangGraph 官方库实现)')
  console.log(`❓ 用户问题: ${query}\n`)

  const app = buildGraph()

  const result = await app.invoke({
    messages: [new HumanMessage(query)],
  })

  const lastMessage = result.messages[result.messages.length - 1]
  const finalAnswer = lastMessage.content

  console.log('\n' + '='.repeat(50))
  console.log('✅ 完成！')
  console.log('='.repeat(50))

  return finalAnswer as string
}
