import {StateGraph, END} from '@langchain/langgraph'
import {ChatOpenAI} from '@langchain/openai'
import {HumanMessage, SystemMessage} from '@langchain/core/messages'
import {SYSTEM_PROMPT} from './prompts'
import {executeJavaScriptTool} from './tools'
import {CodeActState} from './types'
import * as dotenv from 'dotenv'

dotenv.config()

const llm = new ChatOpenAI({
  modelName: 'gpt-4o',
  apiKey: process.env.API_KEY || '',
  configuration: {
    baseURL: 'http://localhost:3001',
  },
})

// 提取代码块
function extractCode(content: string): string | null {
  if (content.includes('```javascript')) {
    const blocks = content.split('```javascript')
    if (blocks.length > 1 && blocks[1]) {
      const codeParts = blocks[1].split('```')
      if (codeParts[0]) {
        return codeParts[0].trim()
      }
    }
  }
  return null
}

// LLM 节点：分析问题并生成代码
async function llmCall(state: typeof CodeActState.State) {
  console.log('\n[LLM 节点] 分析问题...')

  const messages = [
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(state.userPrompt),
    ...state.messages,
  ]

  const response = await llm.invoke(messages)
  const code = extractCode(response.content as string)

  if (code) {
    console.log('[生成代码]')
    return {
      messages: [response],
      output: '',
      code,
    }
  }

  console.log('[直接给出答案]')
  return {
    messages: [response],
    output: response.content as string,
    code: null,
  }
}

// 路由函数：判断是否需要执行代码
function shouldExecute(state: typeof CodeActState.State): string {
  if (state.output) {
    return END
  }
  return 'executeNode'
}

// 执行节点：运行生成的代码
async function executeNode(state: typeof CodeActState.State) {
  console.log('\n[执行节点] 运行代码...')

  const code = state.code
  if (!code) {
    return {messages: []}
  }

  const result = await executeJavaScriptTool.invoke({code})

  return {
    messages: [new HumanMessage(`## 执行结果:\n${result}`)],
    code: null,
  }
}

// 构建 CodeAct 图
export function buildCodeActGraph() {
  const workflow = new StateGraph(CodeActState)
    .addNode('llmCall', llmCall)
    .addNode('executeNode', executeNode)
    .addEdge('__start__', 'llmCall')
    .addConditionalEdges('llmCall', shouldExecute, {
      executeNode: 'executeNode',
      [END]: END,
    })
    .addEdge('executeNode', 'llmCall')

  return workflow.compile()
}

// 运行 CodeAct Agent
export async function runCodeActAgent(query: string): Promise<string> {
  console.log('[启动 CodeAct Agent]')
  console.log(`[用户问题] ${query}\n`)

  const app = buildCodeActGraph()

  const result = await app.invoke({
    userPrompt: query,
  } as any)

  console.log('\n[完成]\n')
  return result.output
}
