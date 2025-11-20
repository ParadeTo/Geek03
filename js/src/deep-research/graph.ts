import {StateGraph, END, START, Send} from '@langchain/langgraph'
import {RunnableConfig} from '@langchain/core/runnables'
import {ChatOpenAI} from '@langchain/openai'
import {HumanMessage, AIMessage} from '@langchain/core/messages'
import {createReactAgent} from '@langchain/langgraph/prebuilt'
import * as dotenv from 'dotenv'

import {OverallState, WebSearchState} from './types'
import {Configuration} from './configuration'
import {
  queryWriterInstructions,
  webSearcherInstructions,
  reflectionInstructions,
  answerInstructions,
  getCurrentDate,
} from './prompts'
import {getResearchTopic} from './utils'
import {
  SearchQueryListSchema,
  ReflectionSchema,
  wideSearchForToolStr,
} from './tools'

dotenv.config()

// Helper to get LLM
const getLLM = (modelName: string) => {
  return new ChatOpenAI({
    modelName: modelName,
    temperature: 1.0,
    configuration: {
      baseURL: 'http://localhost:3001',
    },
    apiKey: process.env.API_KEY || 'dummy',
  })
}

async function generateQuery(
  state: typeof OverallState.State,
  config?: RunnableConfig
) {
  const configurable = Configuration.fromRunnableConfig(config)

  const initialQueryCount =
    state.initial_search_query_count ?? configurable.number_of_initial_queries

  const llm = getLLM(configurable.query_generator_model)
  const structuredLLM = llm.withStructuredOutput(SearchQueryListSchema)

  const currentDate = getCurrentDate()
  const researchTopic = getResearchTopic(state.messages)

  const formattedPrompt = queryWriterInstructions
    .replace('{current_date}', currentDate)
    .replace('{research_topic}', researchTopic)
    .replace('{number_queries}', initialQueryCount.toString())

  const result = await structuredLLM.invoke(formattedPrompt)

  return {
    search_query: result.query,
    initial_search_query_count: initialQueryCount,
  }
}

function continueToWebResearch(state: typeof OverallState.State) {
  // state.search_query is the full list of queries.
  // But in the Python logic:
  // generate_query returns { "search_query": result.query } (a list)
  // OverallState uses operator.add (concat) for search_query.
  // So if we just added new queries, they are at the end?
  // Wait, Python generate_query returns a QueryGenerationState which has "search_query": list.
  // And OverallState adds them.
  // But continue_to_web_research iterates over state["search_query"].
  // If this runs multiple times, state["search_query"] grows.
  // However, generate_query is only called at START.
  // reflection -> evaluate_research -> web_research (with NEW queries)

  // In Python:
  // reflection returns "follow_up_queries".
  // evaluate_research converts follow_up_queries to Sends.

  // Here at START -> generate_query -> continue_to_web_research
  // We only want to process the *newly generated* queries.
  // But generate_query returns the list.

  // The python code for continue_to_web_research:
  // return [ Send("web_research", ...) for ... state["search_query"] ]
  // This implies it processes ALL queries in state["search_query"].
  // Since generate_query is only called once at the start, this is fine.

  return state.search_query.map(
    (query, index) => new Send('web_research', {search_query: query, id: index})
  )
}

async function webResearch(
  state: typeof WebSearchState.State,
  config?: RunnableConfig
) {
  const configurable = Configuration.fromRunnableConfig(config)
  const currentDate = getCurrentDate()

  const formattedPrompt = webSearcherInstructions
    .replace('{current_date}', currentDate)
    .replace('{research_topic}', state.search_query)

  const llm = getLLM(configurable.query_generator_model)
  const tools = [wideSearchForToolStr]

  const agent = createReactAgent({
    llm,
    tools,
  })

  const response = await agent.invoke({
    messages: [new HumanMessage(formattedPrompt)],
  })

  const lastMessage = response.messages[response.messages.length - 1]
  const content =
    typeof lastMessage.content === 'string'
      ? lastMessage.content
      : JSON.stringify(lastMessage.content)

  return {
    search_query: [state.search_query],
    web_research_result: [content],
  }
}

async function reflection(
  state: typeof OverallState.State,
  config?: RunnableConfig
) {
  const configurable = Configuration.fromRunnableConfig(config)
  const researchLoopCount = (state.research_loop_count ?? 0) + 1
  const reasoningModel = state.reasoning_model || configurable.reflection_model

  const currentDate = getCurrentDate()
  const researchTopic = getResearchTopic(state.messages)
  const summaries = state.web_research_result.join('\n\n---\n\n')

  const formattedPrompt = reflectionInstructions
    .replace('{current_date}', currentDate)
    .replace('{research_topic}', researchTopic)
    .replace('{summaries}', summaries)

  const llm = getLLM(reasoningModel)
  const structuredLLM = llm.withStructuredOutput(ReflectionSchema)

  const result = await structuredLLM.invoke(formattedPrompt)

  console.log('Reflection result:', result)

  return {
    // ReflectionState fields
    is_sufficient: result.is_sufficient,
    knowledge_gap: result.knowledge_gap,
    follow_up_queries: result.follow_up_queries,
    research_loop_count: researchLoopCount,
    // number_of_ran_queries is used to offset IDs in evaluate_research
    // In Python it uses len(state["search_query"])
    // But "search_query" accumulates all queries run so far?
    // Yes, web_research appends to search_query list in OverallState.
    // So len(state.search_query) is correct count of *processed* queries (inputs to web_research).
    // wait, generate_query adds to search_query.
    // web_research adds to search_query?
    // In python web_research returns {"search_query": [state["search_query"]]}.
    // This means it DUPLICATES the query into the list if generate_query already added it?
    // Let's check python OverallState reducer. `operator.add` for lists.

    // Python flow:
    // 1. generate_query -> returns {search_query: [q1, q2]} -> OverallState.search_query = [q1, q2]
    // 2. continue_to_web_research -> Sends for q1, q2.
    // 3. web_research(q1) -> returns {search_query: [q1]} -> OverallState appends q1?
    // If so, OverallState.search_query becomes [q1, q2, q1, q2]. This seems redundant.
    // But maybe `generate_query` logic is just generating strings, and `web_research` is confirming them?
    // Or maybe `generate_query` should NOT add to `search_query` if `web_research` does?

    // In Python code:
    // generate_query returns {"search_query": result.query}
    // web_research returns {"search_query": [state["search_query"]]}
    // Yes, it seems to duplicate.
    // But `evaluate_research` uses `len(state["search_query"])` as `number_of_ran_queries`.
    // This suggests `number_of_ran_queries` tracks the total count.

    // Let's stick to the logic.
    // number_of_ran_queries: state.search_query.length
    // But I need to return it as part of the update if I want to pass it to next step?
    // reflection returns keys that match ReflectionState?
    // Python reflection returns:
    // {
    //     "is_sufficient": ...,
    //     "knowledge_gap": ...,
    //     "follow_up_queries": ...,
    //     "research_loop_count": ...,
    //     "number_of_ran_queries": len(state["search_query"]),
    // }
    // These keys are mixed into OverallState?
    // No, OverallState doesn't have is_sufficient etc.
    // Wait, ReflectionState is NOT a subset of OverallState in Python?
    // In Python `reflection` returns `ReflectionState`.
    // The graph definition: `builder.add_node("reflection", reflection)`
    // `reflection` function signature: `-> ReflectionState`.
    // But `builder = StateGraph(OverallState)`.
    // Does `reflection` return value get merged into `OverallState`?
    // If keys don't exist in OverallState, they are lost unless defined?
    // Python `StateGraph(OverallState)` means nodes must return updates to OverallState.
    // But `reflection` returns keys NOT in OverallState (is_sufficient, etc).
    // Unless `OverallState` inherits or includes them?
    // `agent/state.py`:
    // class OverallState(TypedDict): ... NO is_sufficient.
    // class ReflectionState(TypedDict): ...

    // How does this work in Python?
    // LangGraph Python allows passing data between nodes if the return value is accepted by the graph state schema.
    // If `OverallState` doesn't have `is_sufficient`, then `reflection` node outputting it means it's transient or passed to `evaluate_research` via some other mechanism?
    // Ah, `evaluate_research` takes `ReflectionState` as input?
    // `def evaluate_research(state: ReflectionState, ...)`
    // But the graph state is `OverallState`.
    // When `reflection` finishes, it updates the graph state.
    // If `OverallState` doesn't have `is_sufficient`, it should fail or be ignored.
    // UNLESS `OverallState` is not the only state.
    // But `builder = StateGraph(OverallState)`.

    // Maybe I missed something in `state.py`.
    // `class OverallState(TypedDict)` defines specific keys.
    // Maybe the python code relies on `StateGraph` loosely handling extra keys if not strictly typed/validated at runtime?
    // OR, `ReflectionState` fields ARE used just for the edge decision?
    // In LangGraph JS, if I return keys not in annotation, they are ignored or error.
    // I should add these fields to `OverallState` in JS or create a unified state.
    // I will add them to `OverallState` in JS to be safe.

    is_sufficient: result.is_sufficient,
    follow_up_queries: result.follow_up_queries,
    // knowledge_gap is not strictly needed for logic but good for UI.

    // Return these to update state
  }
}

function evaluateResearch(
  state: typeof OverallState.State,
  config?: RunnableConfig
) {
  const configurable = Configuration.fromRunnableConfig(config)
  const maxResearchLoops =
    state.max_research_loops ?? configurable.max_research_loops
  const researchLoopCount = state.research_loop_count ?? 0

  // logic from python
  if (state.is_sufficient || researchLoopCount >= maxResearchLoops) {
    return 'finalize_answer'
  }

  // Return Sends for new queries
  // The follow_up_queries are in state.
  // We need to calculate ID offset.
  // Python: "id": state["number_of_ran_queries"] + int(idx)
  // In JS, we can use state.search_query.length as the base (since we updated it in web_research).

  const currentQueryCount = state.search_query.length

  return (state.follow_up_queries || []).map(
    (query, index) =>
      new Send('web_research', {
        search_query: query,
        id: currentQueryCount + index,
      })
  )
}

async function finalizeAnswer(
  state: typeof OverallState.State,
  config?: RunnableConfig
) {
  const configurable = Configuration.fromRunnableConfig(config)
  const reasoningModel = state.reasoning_model || configurable.answer_model

  const currentDate = getCurrentDate()
  const researchTopic = getResearchTopic(state.messages)
  const summaries = state.web_research_result.join('\n---\n\n')

  const formattedPrompt = answerInstructions
    .replace('{current_date}', currentDate)
    .replace('{research_topic}', researchTopic)
    .replace('{summaries}', summaries)

  const llm = getLLM(reasoningModel)

  const result = await llm.invoke(formattedPrompt)

  return {
    messages: [new AIMessage({content: result.content as string})],
  }
}

// Construct graph
const builder = new StateGraph(OverallState)
  .addNode('generate_query', generateQuery)
  .addNode('web_research', webResearch)
  .addNode('reflection', reflection)
  .addNode('finalize_answer', finalizeAnswer)
  .addEdge(START, 'generate_query')
  .addConditionalEdges('generate_query', continueToWebResearch, [
    'web_research',
  ])
  .addEdge('web_research', 'reflection')
  .addConditionalEdges('reflection', evaluateResearch, [
    'web_research',
    'finalize_answer',
  ])
  .addEdge('finalize_answer', END)

export const graph = builder.compile()
