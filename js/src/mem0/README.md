# Mem0 Agent

基于本地 Qdrant 向量数据库的记忆 Agent 示例。

## 配置

需要设置环境变量：

```bash
TONGYI_API_KEY=your_tongyi_api_key
```

Qdrant 配置在 `memconfig.ts` 中，默认连接 `116.153.88.164:6333`。

## 运行

```bash
pnpm install
pnpm mem0:dev
```

## 功能

- 使用本地 Qdrant 存储用户记忆
- 通过 OpenAI Embedding 进行语义搜索
- 召回相关历史信息作为对话上下文
