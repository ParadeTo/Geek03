import {ChatCompletionMessageParam} from 'openai/resources/chat/completions'
import {client} from './llm'
import {tools, toolRegistry} from './tools'

/**
 * 发送消息并获取响应
 */
async function sendMessages(messages: ChatCompletionMessageParam[]) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages,
    tools,
    tool_choice: 'auto',
  })
  return response
}

/**
 * Function Calling 主流程（非流式）
 */
async function main() {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'user',
      content: '青岛啤酒与贵州茅台的收盘价谁高？',
    },
  ]

  while (true) {
    const response = await sendMessages(messages)
    const choice = response.choices[0]

    if (!choice?.message) break

    console.log('回复：')
    console.log(choice.message.content)

    console.log('工具选择：')
    console.log(choice.message.tool_calls)

    const toolCalls = choice.message.tool_calls
    if (toolCalls && toolCalls.length > 0) {
      messages.push(choice.message)

      for (const toolCall of toolCalls) {
        if (
          toolCall.type === 'function' &&
          toolCall.function.name === 'get_closing_price'
        ) {
          const argumentsDict = JSON.parse(toolCall.function.arguments)
          const toolFunc = toolRegistry[toolCall.function.name]

          if (toolFunc) {
            const price = toolFunc(argumentsDict)

            messages.push({
              role: 'tool',
              content: price,
              tool_call_id: toolCall.id,
            })
          }
        }
      }
    } else {
      break
    }
  }
}

if (require.main === module) {
  main().catch(console.error)
}
