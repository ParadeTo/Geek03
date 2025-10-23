import {ChatCompletionMessageParam} from 'openai/resources/chat/completions'
import {client} from './llm-tongyi'
import {tools, toolRegistry} from './tools'

/**
 * 工具调用信息
 */
interface ToolInfo {
  id: string
  name: string
  arguments: string
}

/**
 * Function Calling 主流程（流式，支持深度思考和并行工具调用）
 */
async function main() {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'user',
      content: '青岛啤酒与贵州茅台的收盘价谁高？',
    },
  ]

  while (true) {
    const completion = await client.chat.completions.create({
      model: 'qwen3-32b',
      messages,
      extra_body: {
        // 开启深度思考，该参数对 QwQ 模型无效
        enable_thinking: true,
      } as any,
      tools,
      parallel_tool_calls: true,
      stream: true,
      // 解除注释后，可以获取到 token 消耗信息
      // stream_options: {
      //   include_usage: true
      // }
    })

    let reasoningContent = '' // 完整思考过程
    let answerContent = '' // 完整回复
    const toolInfo: ToolInfo[] = [] // 存储工具调用信息
    let isAnswering = false // 判断是否结束思考过程并开始回复

    console.log('='.repeat(20) + '思考过程' + '='.repeat(20))

    for await (const chunk of completion) {
      if (!chunk.choices || chunk.choices.length === 0) {
        // 处理用量统计信息
        console.log('\n' + '='.repeat(20) + 'Usage' + '='.repeat(20))
        console.log((chunk as any).usage)
      } else {
        const delta = chunk.choices[0].delta

        // 处理AI的思考过程（链式推理）
        if ('reasoning_content' in delta && delta.reasoning_content) {
          reasoningContent += delta.reasoning_content
          process.stdout.write(delta.reasoning_content)
        }
        // 处理最终回复内容
        else {
          if (!isAnswering) {
            // 首次进入回复阶段时打印标题
            isAnswering = true
            console.log('\n' + '='.repeat(20) + '回复内容' + '='.repeat(20))
          }

          if (delta.content) {
            answerContent += delta.content
            process.stdout.write(delta.content)
          }

          // 处理工具调用信息（支持并行工具调用）
          if (delta.tool_calls) {
            for (const toolCall of delta.tool_calls) {
              const index = toolCall.index

              // 动态扩展工具信息存储列表
              while (toolInfo.length <= index) {
                toolInfo.push({id: '', name: '', arguments: ''})
              }

              // 收集工具调用ID（用于后续函数调用）
              if (toolCall.id) {
                toolInfo[index].id += toolCall.id
              }

              // 收集函数名称（用于后续路由到具体函数）
              if (toolCall.function?.name) {
                toolInfo[index].name += toolCall.function.name
              }

              // 收集函数参数（JSON字符串格式，需要后续解析）
              if (toolCall.function?.arguments) {
                toolInfo[index].arguments += toolCall.function.arguments
              }
            }
          }
        }
      }
    }

    if (toolInfo.length === 0) {
      break
    } else {
      // 将完整的模型回复添加到 messages 中
      messages.push({
        content: answerContent,
        role: 'assistant',
        tool_calls: toolInfo.map((tool, idx) => ({
          id: tool.id,
          function: {
            arguments: tool.arguments,
            name: tool.name,
          },
          type: 'function' as const,
          index: idx,
        })),
      } as any)

      // 处理所有收集到的工具调用
      for (const tool of toolInfo) {
        const argumentsDict = JSON.parse(tool.arguments)
        if (tool.name === 'get_closing_price') {
          const price = toolRegistry[tool.name](argumentsDict)
          messages.push({
            role: 'tool',
            content: price,
            tool_call_id: tool.id,
          })
        }
      }
    }
  }
}

if (require.main === module) {
  main().catch(console.error)
}
