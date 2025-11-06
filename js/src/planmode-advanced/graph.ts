import {StateGraph, END} from '@langchain/langgraph'
import {createReactAgent} from '@langchain/langgraph/prebuilt'
import {ChatOpenAI} from '@langchain/openai'
import {SYSTEM_PROMPT, PLAN_PROMPT} from './prompts'
import {tools} from './tools'
import {PlanExecuteState} from './types'
import * as dotenv from 'dotenv'

dotenv.config()

const llm = new ChatOpenAI({
  modelName: 'gpt-4o',
  apiKey: process.env.API_KEY || '',
  configuration: {
    baseURL: 'http://localhost:3001',
  },
})

// 使用 createReactAgent 创建执行 Agent
const executeAgent = createReactAgent({
  llm,
  tools,
  messageModifier: SYSTEM_PROMPT,
})

// 执行步骤节点（使用 createReactAgent）
async function executeStep(state: typeof PlanExecuteState.State) {
  console.log('\n[执行节点] 执行当前步骤...')

  const plan = state.plan
  if (!plan || plan.length === 0) {
    return {pastSteps: []}
  }

  const planStr = plan.map((step, i) => `${i + 1}. ${step}`).join('\n')
  const task = plan[0]
  const taskFormatted = `计划有以下几个步骤:\n${planStr}\n\n你需要执行 步骤1. ${task}.`

  console.log(`[任务]\n${taskFormatted}`)

  const agentResponse = await executeAgent.invoke({
    messages: [['user', taskFormatted]],
  })

  const lastMessage = agentResponse.messages[agentResponse.messages.length - 1]
  const result = lastMessage?.content as string

  console.log(`[执行结果] ${result}`)

  return {
    pastSteps: [[task, result]] as Array<[string, string]>,
  }
}

// 规划步骤节点
async function planStep(state: typeof PlanExecuteState.State) {
  console.log('\n[规划节点] 评估并调整计划...')

  const planStr = state.plan.map((step, i) => `${i + 1}. ${step}`).join('\n')
  const pastStepsStr = state.pastSteps
    .map(([task, result]) => `- ${task}\n  结果: ${result}`)
    .join('\n')

  const prompt = PLAN_PROMPT.replace('{input}', state.input)
    .replace('{plan}', planStr)
    .replace('{past_steps}', pastStepsStr || '无')

  const response = await llm.invoke(prompt)
  const content = response.content as string

  console.log(`[LLM 评估]\n${content}\n`)

  // 先尝试提取步骤列表
  const newPlan = extractPlanFromResponse(content)

  // 如果提取到了步骤，继续执行
  if (newPlan.length > 0) {
    // 对比原计划，显示调整情况
    const originalRemaining = state.plan.slice(1)
    if (JSON.stringify(newPlan) !== JSON.stringify(originalRemaining)) {
      console.log('[计划调整] 检测到计划变更')
      console.log('[原计划剩余步骤]')
      originalRemaining.forEach((step, i) => console.log(`  ${i + 1}. ${step}`))
      console.log('[调整后的计划]')
      newPlan.forEach((step, i) => console.log(`  ${i + 1}. ${step}`))
    } else {
      console.log(`[决策] 继续执行，剩余 ${newPlan.length} 步`)
    }
    return {plan: newPlan}
  }

  // 没有提取到步骤，判断为任务完成
  console.log('[决策] 无后续步骤，任务完成')
  return {response: content}
}

// 从 LLM 响应中提取计划步骤
function extractPlanFromResponse(response: string): string[] {
  const lines = response.split('\n')
  const steps: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    // 匹配 "- 步骤" 或 "1. 步骤" 格式
    if (trimmed.match(/^[-*]\s+(.+)$/)) {
      const step = trimmed.replace(/^[-*]\s+/, '').trim()
      if (step) steps.push(step)
    } else if (trimmed.match(/^\d+[\.)]\s+(.+)$/)) {
      const step = trimmed.replace(/^\d+[\.)]\s+/, '').trim()
      if (step) steps.push(step)
    }
  }

  return steps
}

// 路由函数
function shouldEnd(state: typeof PlanExecuteState.State): string {
  if (state.response) {
    return END
  }
  return 'execute'
}

// 构建高级计划图
export function buildAdvancedPlanGraph() {
  const workflow = new StateGraph(PlanExecuteState)
    .addNode('execute', executeStep)
    .addNode('planstep', planStep)
    .addEdge('__start__', 'execute')
    .addEdge('execute', 'planstep')
    .addConditionalEdges('planstep', shouldEnd, {
      execute: 'execute',
      [END]: END,
    })

  return workflow.compile()
}

// 运行高级计划 Agent
export async function runAdvancedPlanAgent(
  input: string,
  initialPlan: string[]
): Promise<string> {
  console.log('[启动高级计划模式 Agent]')
  console.log(`[目标] ${input}`)
  console.log('[初始计划]')
  initialPlan.forEach((step, i) => {
    console.log(`  ${i + 1}. ${step}`)
  })

  const app = buildAdvancedPlanGraph()

  const result = await app.invoke({
    input,
    plan: initialPlan,
  } as any)

  console.log('\n[完成]\n')
  return result.response || '未完成'
}
