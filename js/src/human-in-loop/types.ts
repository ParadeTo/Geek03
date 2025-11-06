import {Annotation} from '@langchain/langgraph'
import {BaseMessage} from '@langchain/core/messages'

// 人机协作模式状态定义
export const HumanLoopState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  query: Annotation<string>(),
})

export type HumanLoopStateType = typeof HumanLoopState.State

