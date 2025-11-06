import {StateGraph, END} from '@langchain/langgraph'
import {ChatOpenAI} from '@langchain/openai'
import {ReflectionState, ReflectionStateType} from './types'
import {COMMAND_PROMPT, REFLECTION_PROMPT} from './prompts'
import {z} from 'zod'
import * as dotenv from 'dotenv'

dotenv.config()

// 定义反思结果的结构化输出
const ReflectionResultSchema = z.object({
  needsImprovement: z.boolean().describe('是否需要改进'),
  suggestions: z.string().describe('改进建议，包含发现的问题和优化方向'),
})

const llm1 = new ChatOpenAI({
  modelName: 'gpt-4o',
  apiKey: process.env.API_KEY || '',
  configuration: {
    baseURL: 'http://localhost:3001',
  },
})

const llm2 = new ChatOpenAI({
  modelName: 'gpt-3.5-turbo',
  apiKey: process.env.API_KEY || '',
  configuration: {
    baseURL: 'http://localhost:3001',
  },
})

// 停止标志：发现这些关键词时立即停止
const STOP_SIGNS = ['安全隐患', '木马', '攻击']

// 生成命令节点
async function generateCommand(state: ReflectionStateType) {
  const iter = state.iterations
  console.log(`\n[生成] 第 ${iter + 1} 次命令生成`)

  let prompt: string
  if (iter === 0) {
    // 第一次生成
    prompt = COMMAND_PROMPT.replace('{user_query}', state.userQuery)
      .replace('{best_command}', '无')
      .replace('{reflection}', '无')
  } else {
    // 根据反思结果改进
    prompt = COMMAND_PROMPT.replace('{user_query}', state.userQuery)
      .replace('{best_command}', state.bestCommand)
      .replace('{reflection}', state.reflection)
  }

  const response = await llm2.invoke(prompt)
  const content = response.content as string

  // 提取命令
  const commandParts = content.split('命令：')
  const command =
    commandParts.length > 1
      ? commandParts[1]?.trim() || content.trim()
      : content.trim()

  console.log(`[命令] ${command}`)

  return {
    bestCommand: command,
    iterations: iter + 1,
  }
}

// 反思与优化节点（使用结构化输出）
async function reflectAndOptimize(state: ReflectionStateType) {
  console.log('\n[反思] 执行检查...')

  const prompt = REFLECTION_PROMPT.replace(
    '{command}',
    state.bestCommand
  ).replace('{user_query}', state.userQuery)

  try {
    // 使用结构化输出
    // @ts-expect-error - withStructuredOutput 类型推断问题
    const structuredLlm = llm1.withStructuredOutput(ReflectionResultSchema)
    const result: any = await structuredLlm.invoke(prompt)

    if (!result.needsImprovement) {
      console.log('[评估] 已经最优，无需改进')
      return {reflection: '已经最优，无需优化'}
    }

    console.log(`[建议] ${result.suggestions}`)
    return {reflection: result.suggestions}
  } catch (error) {
    console.error('[反思失败]', error)
    return {reflection: '反思检查失败'}
  }
}

// 检查是否继续迭代
function checkReflection(state: ReflectionStateType): string {
  // 检查是否已最优
  if (
    state.reflection.includes('无建议') ||
    state.reflection.includes('无需优化')
  ) {
    console.log('\n[结束] 已达到最优方案')
    return END
  }

  // 检查停止标志
  for (const stopSign of STOP_SIGNS) {
    if (state.reflection.includes(stopSign)) {
      console.log(`\n[结束] 检测到停止标志: ${stopSign}`)
      return END
    }
  }

  // 检查迭代次数
  if (state.iterations >= 3) {
    console.log('\n[结束] 达到最大迭代次数 (3次)')
    return END
  }

  console.log('[决策] 继续优化...')
  return 'generate'
}

// 构建反思模式图
export function buildReflectionGraph() {
  const workflow = new StateGraph(ReflectionState)
    .addNode('generate', generateCommand)
    .addNode('reflect', reflectAndOptimize)
    .addEdge('__start__', 'generate')
    .addEdge('generate', 'reflect')
    .addConditionalEdges('reflect', checkReflection, {
      generate: 'generate',
      [END]: END,
    })

  return workflow.compile()
}

// 运行反思 Agent
export async function runReflectionAgent(userQuery: string): Promise<{
  command: string
  reflection: string
  iterations: number
}> {
  console.log('[启动反思模式 Agent]')
  console.log(`[需求] ${userQuery}\n`)

  const app = buildReflectionGraph()

  const result = await app.invoke({
    userQuery,
    bestCommand: '',
    reflection: '',
    iterations: 0,
  } as any)

  return {
    command: result.bestCommand,
    reflection: result.reflection,
    iterations: result.iterations,
  }
}
