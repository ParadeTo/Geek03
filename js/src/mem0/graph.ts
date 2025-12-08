import {StateGraph, Annotation} from '@langchain/langgraph'
import {HumanMessage, SystemMessage} from '@langchain/core/messages'
import {ChatOpenAI} from '@langchain/openai'
import {m} from './memconfig'
import * as dotenv from 'dotenv'

dotenv.config()

const ChatState = Annotation.Root({
  messages: Annotation<any[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  mem0UserId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
})

const llm = new ChatOpenAI({
  modelName: 'gpt-4o',
  apiKey: process.env.API_KEY || '',
  configuration: {
    baseURL: 'http://localhost:3001',
  },
})

async function chat(state: typeof ChatState.State) {
  const messages = state.messages
  const userId = state.mem0UserId

  // 召回记忆
  const lastMessage = messages[messages.length - 1]
  const memories = await m.search(lastMessage.content, {user_id: userId})

  let context = '来自以往对话的相关信息：\n'
  for (const memory of memories || []) {
    context += `- ${memory.memory}\n`
  }

  const systemMessage = new SystemMessage(
    `你是一个擅长解决客户问题的客服助手。请根据提供的上下文信息来个性化你的回答，并记住用户偏好和过往的交互。
${context}`
  )

  const fullMessages = [systemMessage, ...messages]
  const response = await llm.invoke(fullMessages)

  return {messages: [response]}
}

export function buildGraph() {
  const workflow = new StateGraph(ChatState)
    .addNode('chat', chat)
    .addEdge('__start__', 'chat')
    .addEdge('chat', '__end__')

  return workflow.compile()
}

export async function runMem0Agent() {
  const agent = buildGraph()

  const result = await agent.invoke({
    mem0UserId: 'xyy',
    messages: [new HumanMessage('小明的爸爸喜欢喝什么饮料？')],
  })

  console.log(result.messages[result.messages.length - 1].content)
}
