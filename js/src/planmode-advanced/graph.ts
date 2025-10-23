import {StateGraph, END} from '@langchain/langgraph'
import {ChatOpenAI} from '@langchain/openai'
import {createReactAgent} from '@langchain/langgraph/prebuilt'
import {SYSTEM_PROMPT, PLAN_PROMPT} from './prompts'
import {tools} from './tools'
import {PlanExecuteState, ActionSchema, type ActionType} from './types'
import * as dotenv from 'dotenv'

dotenv.config()

const llm = new ChatOpenAI({
  modelName: 'gpt-4o',
  apiKey: process.env.API_KEY || '',
  configuration: {
    baseURL: 'http://localhost:3001',
  },
})

// 创建执行 Agent（使用 ReAct）
const executeAgent = createReactAgent({
  llm,
  tools,
  messageModifier: SYSTEM_PROMPT,
})

// 创建规划 LLM（使用结构化输出）
const plannerLlm = llm.withStructuredOutput(ActionSchema, {
  name: 'action',
})

// 执行步骤节点
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
  const result = lastMessage.content as string

  console.log(`[执行结果] ${result}`)

  return {
    pastSteps: [[task, result]] as Array<[string, string]>,
  }
}

// 规划步骤节点
async function planStep(state: typeof PlanExecuteState.State) {
  console.log('\n[规划节点] 评估计划...')

  const planStr = state.plan.map((step, i) => `${i + 1}. ${step}`).join('\n')
  const pastStepsStr = state.pastSteps
    .map(([task, result]) => `- ${task}: ${result}`)
    .join('\n')

  const prompt = PLAN_PROMPT.replace('{input}', state.input)
    .replace('{plan}', planStr)
    .replace('{past_steps}', pastStepsStr || '无')

  const output = (await plannerLlm.invoke(prompt)) as ActionType

  if (output.type === 'response') {
    console.log('[决策] 所有步骤完成，返回最终答案')
    return {response: output.response}
  } else {
    console.log(`[决策] 还需执行 ${output.steps.length} 个步骤`)
    console.log('[剩余计划]')
    output.steps.forEach((step, i) => {
      console.log(`  ${i + 1}. ${step}`)
    })
    return {plan: output.steps}
  }
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

  const result = await app.invoke(
    {
      input,
      plan: initialPlan,
    } as any,
    {
      recursionLimit: 50,
    }
  )

  console.log('\n[完成]\n')
  return result.response || '未完成'
}
