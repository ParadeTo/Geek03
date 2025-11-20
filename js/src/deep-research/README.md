# Deep Research Agent

基于 LangGraph 的深度研究助手，从 Python 版本移植到 TypeScript。

## 功能特点

- 多轮搜索和深度分析
- 自动生成优化的搜索查询
- 反思机制识别知识缺口
- 支持配置化的研究循环

## 安装

```bash
cd js
pnpm install
```

## 配置

在 `js/.env` 文件中设置环境变量：

```env
API_KEY=your_api_key_here
```

## 使用方法

### 方式 1: 使用 pnpm 脚本（推荐）

```bash
pnpm deep:research "你的研究问题"
```

### 方式 2: 直接运行

```bash
npx ts-node --transpile-only src/deep-research/index.ts "你的研究问题"
```

### 方式 3: 编译后运行

```bash
pnpm build
node dist/deep-research/index.js "你的研究问题"
```

## 配置选项

可以通过环境变量自定义配置：

- `QUERY_GENERATOR_MODEL`: 查询生成模型（默认: gpt-4o）
- `REFLECTION_MODEL`: 反思模型（默认: gpt-4o）
- `ANSWER_MODEL`: 答案生成模型（默认: gpt-4o）
- `NUMBER_OF_INITIAL_QUERIES`: 初始查询数量（默认: 3）
- `MAX_RESEARCH_LOOPS`: 最大研究循环次数（默认: 2）

## 工作流程

1. **生成查询** - 根据用户问题生成优化的搜索查询
2. **网络研究** - 并行执行多个搜索查询
3. **反思** - 分析结果，识别知识缺口
4. **评估** - 决定是否需要更多研究
5. **最终答案** - 综合所有信息生成答案

## 故障排查

如果遇到调试器自动启动的问题：

```bash
# 使用 --transpile-only 跳过类型检查
npx ts-node --transpile-only src/deep-research/index.ts "问题"
```

## 技术栈

- TypeScript
- LangGraph
- OpenAI API (通过本地代理)
- SearxNG (搜索引擎)

