import {Annotation} from '@langchain/langgraph'
import {BaseMessage} from '@langchain/core/messages'

export const OverallState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  search_query: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  web_research_result: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  initial_search_query_count: Annotation<number>,
  max_research_loops: Annotation<number>,
  research_loop_count: Annotation<number>({
    reducer: (x, y) => y,
    default: () => 0,
  }),
  reasoning_model: Annotation<string>,

  // Reflection state
  is_sufficient: Annotation<boolean>({
    reducer: (x, y) => y,
    default: () => false,
  }),
  knowledge_gap: Annotation<string>({
    reducer: (x, y) => y,
    default: () => '',
  }),
  follow_up_queries: Annotation<string[]>({
    reducer: (x, y) => y, // Overwrite with latest follow ups
    default: () => [],
  }),
})

export type Query = {
  query: string
  rationale: string
}

export const WebSearchState = Annotation.Root({
  search_query: Annotation<string>,
  id: Annotation<number>,
})
