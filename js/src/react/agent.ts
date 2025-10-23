import {client} from './llm'
import {REACT_PROMPT} from './prompt'
import {tools, toolRegistry} from './tools'
import {Message} from './types'

/**
 * 发送消息到 LLM
 * @param messages 消息列表
 * @returns LLM 响应
 */
async function sendMessages(messages: Message[]) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: messages as any,
  })
  return response
}

/**
 * ReAct Agent 主函数
 */
async function main() {
  const query = '请比较青岛啤酒和贵州茅台的股票收盘价谁高？'

  // 替换占位符构建初始提示词
  const prompt = REACT_PROMPT.replace(
    '{tools}',
    JSON.stringify(tools, null, 2)
  ).replace('{input}', query)

  const messages: Message[] = [{role: 'user', content: prompt}]

  while (true) {
    // 发送消息到 LLM
    const response = await sendMessages(messages)
    const responseText = response.choices[0]?.message?.content || ''

    console.log('大模型的回复：')
    console.log(responseText)
    console.log('---\n')

    // 检查是否有最终答案
    const finalAnswerMatch = responseText.match(/Final Answer:\s*(.*)/)
    if (finalAnswerMatch) {
      const finalAnswer = finalAnswerMatch[1]
      console.log('最终答案:', finalAnswer)
      break
    }

    // 将 LLM 回复添加到消息历史
    messages.push({
      role: 'assistant',
      content: responseText,
    })

    // 解析 Action 和 Action Input
    const actionMatch = responseText.match(/Action:\s*(\w+)/)
    const actionInputMatch = responseText.match(
      /Action Input:\s*({.*?}|".*?")/s
    )

    if (actionMatch && actionInputMatch) {
      const toolName = actionMatch[1]
      if (!toolName) {
        console.error('无法提取工具名称')
        break
      }

      const actionInputStr = actionInputMatch[1]
      if (!actionInputStr) {
        console.error('无法提取 Action Input')
        break
      }

      let params: Record<string, any>

      try {
        params = JSON.parse(actionInputStr)
      } catch (error) {
        console.error('解析 Action Input 失败:', error)
        break
      }

      // 执行工具调用
      let observation = ''
      const toolFunc = toolRegistry[toolName]

      if (toolFunc) {
        observation = await toolFunc(params)
        console.log('工具调用结果：Observation:', observation)
        console.log('---\n')
      } else {
        observation = `工具 ${toolName} 不存在`
        console.error(observation)
      }

      // 将观察结果添加到消息历史
      messages.push({
        role: 'user',
        content: `Observation: ${observation}`,
      })
    } else {
      console.log('未找到有效的 Action 或 Action Input，退出循环')
      break
    }
  }
}

// 运行 Agent
if (require.main === module) {
  main().catch((error) => {
    console.error('运行出错:', error)
    process.exit(1)
  })
}

export {main}
