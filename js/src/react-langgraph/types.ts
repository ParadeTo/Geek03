import {BaseMessage} from '@langchain/core/messages'

/**
 * Agent 状态定义（使用 LangGraph 的 Annotation）
 */
export interface AgentState {
  messages: BaseMessage[]
  output?: string
}
