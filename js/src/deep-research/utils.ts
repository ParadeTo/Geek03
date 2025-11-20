import {BaseMessage, HumanMessage, AIMessage} from '@langchain/core/messages'

export function getResearchTopic(messages: BaseMessage[]): string {
  if (messages.length === 1) {
    return messages[messages.length - 1].content as string
  }
  let researchTopic = ''
  for (const message of messages) {
    if (message instanceof HumanMessage) {
      researchTopic += `User: ${message.content}\n`
    } else if (message instanceof AIMessage) {
      researchTopic += `Assistant: ${message.content}\n`
    }
  }
  return researchTopic
}
