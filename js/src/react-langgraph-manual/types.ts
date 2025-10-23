/**
 * LangGraph 状态定义
 */
export interface AgentState {
  messages: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool'
    content: string
    tool_call_id?: string
  }>
  toolCalls: Array<{
    name: string
    arguments: Record<string, any>
  }>
  output: string
}
