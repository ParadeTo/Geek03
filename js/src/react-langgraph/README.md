# ReAct Agent - LangGraph 官方库实现

这是使用 **@langchain/langgraph** 官方库实现的 ReAct Agent。

## 与手动实现的区别

| 特性 | 手动实现 | LangGraph 库 |
|-----|---------|-------------|
| 依赖 | 无额外依赖 | 需要 @langchain/langgraph |
| 状态管理 | 手动管理 | ✅ Annotation 自动管理 |
| 工具定义 | 自定义格式 | ✅ 标准 LangChain 工具 |
| 图编译 | 手动循环 | ✅ 自动编译优化 |
| 可视化 | ❌ | ✅ 支持 |
| 持久化 | ❌ | ✅ 支持检查点 |
| 流式输出 | ❌ | ✅ 支持 |
| 时间旅行 | ❌ | ✅ 支持 |

## 核心概念

### 1. Annotation（状态注解）

```typescript
const GraphState = Annotation.Root({
  messages: Annotation<any[]>({
    reducer: (x, y) => x.concat(y),  // 定义状态如何合并
    default: () => [],
  })
})
```

### 2. StateGraph（状态图）

```typescript
const workflow = new StateGraph(GraphState)
  .addNode('agent', callModel)       // 添加节点
  .addNode('tools', callTools)
  .addEdge('__start__', 'agent')     // 添加边
  .addConditionalEdges(...)          // 条件边
```

### 3. 工具定义

使用 LangChain 标准工具格式：

```typescript
export const tool = tool(
  (input) => { /* 实现 */ },
  {
    name: 'tool_name',
    description: '工具描述',
    schema: z.object({ /* zod schema */ })
  }
)
```

## 运行

```bash
pnpm graph:dev
```

## 高级功能

### 流式输出

```typescript
for await (const event of app.stream({ messages: [...] })) {
  console.log(event)
}
```

### 检查点（持久化）

```typescript
import { MemorySaver } from '@langchain/langgraph'

const memory = new MemorySaver()
const app = workflow.compile({ checkpointer: memory })
```

### 可视化

```typescript
const graph = await app.getGraph()
console.log(graph.drawMermaid())
```

## 依赖

- `@langchain/langgraph` - LangGraph 核心库
- `@langchain/core` - LangChain 核心组件
- `@langchain/openai` - OpenAI 集成
- `zod` - Schema 验证

## 手动实现版本

如果你想了解底层原理，可以查看 `react-langgraph-manual/` 目录中的手动实现版本。
