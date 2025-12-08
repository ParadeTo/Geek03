# Memory Agent

基于 LangGraph 的带记忆功能的 ReAct Agent 示例。

## 功能

- 使用 MemorySaver 保存对话状态
- 通过 thread_id 区分不同对话线程
- 同一线程内多轮对话保持上下文

## 运行

```bash
npx ts-node src/memory/index.ts
```

