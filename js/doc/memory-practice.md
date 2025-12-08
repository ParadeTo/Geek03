# AI Agent 记忆系统实战指南

## 前言

在构建 AI Agent 时，"记忆"是一个绑不开的话题。一个没有记忆的 Agent 就像金鱼一样，每次对话都从零开始。用户说"我叫小明"，下一轮就忘了。这显然不是我们想要的智能体验。

本文介绍两种记忆实现方案：

1. **Memory（会话记忆）**：基于 LangGraph 的 MemorySaver，实现单次会话内的状态持久化
2. **Mem0（长期记忆）**：基于 mem0 云服务，实现跨会话的用户记忆存储与检索

两者解决的问题不同，适用场景也不同。

## 一、Memory：会话级记忆

### 1.1 解决什么问题

假设你在做一个餐卡充值助手。用户第一次说"充值10元"，余额变成110元。第二次再说"充值10元"，如果没有记忆，Agent 会认为余额还是初始的100元，充值后变成110元——而不是正确的120元。

MemorySaver 通过 `thread_id` 维护对话状态，让同一会话内的多轮交互能够累积上下文。

### 1.2 核心实现

```typescript
import {StateGraph, Annotation, MemorySaver} from '@langchain/langgraph'

const GraphState = Annotation.Root({
  messages: Annotation<any[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
})

// 构建图时传入 MemorySaver 作为 checkpointer
export function buildGraph() {
  const workflow = new StateGraph(GraphState)
    .addNode('llm_call', llmCall)
    .addNode('environment', toolNode)
    .addEdge('__start__', 'llm_call')
    .addConditionalEdges('llm_call', shouldContinue)
    .addEdge('environment', 'llm_call')

  const memory = new MemorySaver()
  return workflow.compile({checkpointer: memory})
}
```

使用时通过 `thread_id` 区分不同对话：

```typescript
const agent = buildGraph()
const config = {configurable: {thread_id: '1'}}

// 第一轮：余额 100 + 10 = 110
await agent.invoke({messages: [new HumanMessage('充值10元')]}, config)

// 第二轮：余额 110 + 10 = 120（保持了上一轮的状态）
await agent.invoke({messages: [new HumanMessage('充值10元')]}, config)
```

### 1.3 工作流程

```
用户输入 → LLM 判断 → 需要工具？
                         ↓ 是
                      执行工具 → 返回 LLM
                         ↓ 否
                      输出结果
                         ↓
              （状态通过 MemorySaver 持久化）
```

关键点：MemorySaver 把每一轮的 messages 状态存下来，下一轮调用时自动恢复。

## 二、Mem0：长期记忆

### 2.1 解决什么问题

MemorySaver 解决的是"会话内"的问题。但如果用户今天说"我喜欢喝可乐"，明天再来问"我喜欢喝什么"，Agent 还是不知道。

长期记忆的核心是向量数据库 + Embedding，它能够：
- 将对话信息向量化后存储
- 下次对话时通过语义搜索召回相关记忆

### 2.2 核心实现

```typescript
import {QdrantClient} from '@qdrant/js-client-rest'
import {OpenAIEmbeddings} from '@langchain/openai'

// 连接本地 Qdrant
const qdrant = new QdrantClient({host: '116.153.88.164', port: 6333})

// 使用通义的 Embedding 模型
const embeddings = new OpenAIEmbeddings({
  modelName: 'text-embedding-v2',
  apiKey: process.env.TONGYI_API_KEY,
  configuration: {
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  },
})

// 封装 search 方法
export const m = {
  async search(query: string, options: {user_id: string}) {
    const queryVector = await embeddings.embedQuery(query)

    const results = await qdrant.search('test', {
      vector: queryVector,
      limit: 5,
      filter: {
        must: [{key: 'user_id', match: {value: options.user_id}}],
      },
    })

    return results.map((r) => ({
      memory: r.payload?.memory as string,
      score: r.score,
    }))
  },
}
```

### 2.3 工作流程

```
用户输入 → 召回相关记忆 → 注入 System Prompt → LLM 生成回答
              ↓
    （从 mem0 向量库语义搜索）
```

## 三、对比与选择

| 特性 | Memory (MemorySaver) | Mem0 (Qdrant) |
|------|---------------------|---------------|
| 记忆范围 | 单次会话 | 跨会话/永久 |
| 存储方式 | 内存 | 向量数据库 |
| 召回方式 | 全量状态恢复 | 语义相似度搜索 |
| 适用场景 | 多轮对话上下文 | 用户画像/偏好记忆 |
| 依赖 | 无 | Qdrant + Embedding |

**选择建议**：

- 如果只需要保持对话连贯性（比如多轮问答），用 **MemorySaver**
- 如果需要记住用户的长期偏好和历史信息，用 **Mem0**
- 两者可以组合使用：MemorySaver 管理会话状态，Mem0 管理用户画像

## 四、运行示例

### Memory 示例

```bash
cd js
pnpm memory:dev
```

输出：
```
工具名称: add_tool
工具参数: { original_amount: 100 }
充值成功！充值后餐卡余额为110元。

工具名称: add_tool
工具参数: { original_amount: 110 }
充值成功！充值后餐卡余额为120元。
```

注意第二次充值时，工具参数是110（上一轮的结果），而不是100。

### Mem0 示例

```bash
cd js
pnpm mem0:dev
```

需要确保 Qdrant 服务已启动，并设置 `TONGYI_API_KEY` 环境变量。

## 五、总结

记忆是让 AI Agent 变得"聪明"的关键能力之一。MemorySaver 提供了轻量的会话状态管理，Mem0 提供了强大的长期记忆服务。根据实际需求选择合适的方案，或者组合使用，可以显著提升 Agent 的用户体验。

