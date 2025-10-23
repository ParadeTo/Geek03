import {Annotation} from '@langchain/langgraph'
import {BaseMessage} from '@langchain/core/messages'

export const CodeActState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  output: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  userPrompt: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  code: Annotation<string | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
})
