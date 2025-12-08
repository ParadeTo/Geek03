import {BaseMessage} from '@langchain/core/messages'

export interface ChatState {
  messages: BaseMessage[]
  mem0UserId: string
}

