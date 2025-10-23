import {AgentState} from './types'
import {tools, toolRegistry} from './tools'
import {client} from './llm'

/**
 * ReAct Agent Graph 实现
 */
export class ReactGraph {
  /**
   * LLM 调用节点
   */
  private async llmNode(state: AgentState): Promise<Partial<AgentState>> {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: state.messages as any,
      tools,
      tool_choice: 'auto',
    })

    const choice = response.choices[0]
    if (!choice?.message) {
      return {output: '未获取到响应'}
    }

    const message = choice.message

    // 如果有工具调用
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCalls = message.tool_calls
        .filter((tc) => tc.type === 'function')
        .map((tc) => ({
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments),
          id: tc.id,
        }))

      return {
        messages: [
          ...state.messages,
          {
            role: 'assistant',
            content: message.content || '',
          },
        ],
        toolCalls,
        output: '',
      }
    }

    // 没有工具调用，返回最终答案
    return {
      messages: [
        ...state.messages,
        {
          role: 'assistant',
          content: message.content || '',
        },
      ],
      output: message.content || '',
    }
  }

  /**
   * 工具执行节点
   */
  private async toolNode(state: AgentState): Promise<Partial<AgentState>> {
    const messages = [...state.messages]

    for (const toolCall of state.toolCalls) {
      const toolFunc = toolRegistry[toolCall.name]

      if (toolFunc) {
        const result = toolFunc(toolCall.arguments)
        console.log(
          `\n🔧 工具调用: ${toolCall.name}(${JSON.stringify(
            toolCall.arguments
          )})`
        )
        console.log(`📊 工具结果: ${result}`)

        messages.push({
          role: 'tool',
          content: result,
          tool_call_id: (toolCall as any).id,
        })
      }
    }

    return {
      messages,
      toolCalls: [],
    }
  }

  /**
   * 路由函数：决定下一步执行哪个节点
   */
  private router(state: AgentState): 'tool' | 'end' {
    // 如果有输出（最终答案），结束
    if (state.output) {
      return 'end'
    }

    // 如果有工具调用，执行工具
    if (state.toolCalls && state.toolCalls.length > 0) {
      return 'tool'
    }

    // 默认结束
    return 'end'
  }

  /**
   * 运行 Agent
   */
  async run(query: string): Promise<string> {
    console.log('\n🚀 启动 ReAct Agent (LangGraph 实现)')
    console.log(`❓ 用户问题: ${query}\n`)

    // 初始化状态
    let state: AgentState = {
      messages: [
        {
          role: 'user',
          content: query,
        },
      ],
      toolCalls: [],
      output: '',
    }

    // 主循环
    let iteration = 0
    const maxIterations = 10

    while (iteration < maxIterations) {
      iteration++
      console.log(`\n--- 第 ${iteration} 轮 ---`)

      // 1. LLM 节点
      const llmResult = await this.llmNode(state)
      state = {...state, ...llmResult}

      // 2. 路由决策
      const nextNode = this.router(state)

      // 3. 根据路由结果执行
      if (nextNode === 'end') {
        console.log('\n✅ 完成！')
        break
      }

      if (nextNode === 'tool') {
        // 执行工具节点
        const toolResult = await this.toolNode(state)
        state = {...state, ...toolResult}
      }
    }

    if (iteration >= maxIterations) {
      console.warn('\n⚠️ 达到最大迭代次数')
    }

    return state.output
  }
}

/**
 * 创建并运行 Agent
 */
export async function runReactGraph(query: string): Promise<string> {
  const graph = new ReactGraph()
  return await graph.run(query)
}
