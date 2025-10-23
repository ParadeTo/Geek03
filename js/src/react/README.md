# ReAct Agent - TypeScript 实现

这是一个 ReAct (Reasoning + Acting) Agent 的 TypeScript 实现，从 Python 版本移植而来。

## 什么是 ReAct？

ReAct 是一种结合推理（Reasoning）和行动（Acting）的 AI Agent 模式。Agent 会：

1. **Thought**: 思考问题
2. **Action**: 决定使用哪个工具
3. **Action Input**: 提供工具所需的输入
4. **Observation**: 获取工具执行结果
5. **Final Answer**: 给出最终答案

## 项目结构

```
src/react/
├── types.ts          # TypeScript 类型定义
├── tools.ts          # 工具定义和实现
├── prompt.ts         # ReAct 提示词模板
├── llm.ts            # LLM 客户端配置
├── agent.ts          # Agent 主逻辑
└── README.md         # 本文档
```

## 环境配置

1. 在项目根目录创建 `.env` 文件：

```bash
TONGYI_API_KEY=your_api_key_here
```

2. 获取通义千问 API Key：
   - 访问 [阿里云 DashScope](https://dashscope.aliyun.com/)
   - 注册并获取 API Key

## 运行

### 开发模式运行

```bash
pnpm react:dev
```

### 编译后运行

```bash
pnpm react:build
```

## 工具说明

当前实现了一个示例工具：

### get_closing_price

获取指定股票的收盘价

**参数：**
- `name` (string): 股票名称

**支持的股票：**
- 青岛啤酒: 67.92
- 贵州茅台: 1488.21

## 示例

运行后，Agent 会回答问题：

```
请比较青岛啤酒和贵州茅台的股票收盘价谁高？
```

执行流程：

1. **Thought**: 分析需要获取两只股票的收盘价
2. **Action**: get_closing_price (青岛啤酒)
3. **Observation**: 67.92
4. **Action**: get_closing_price (贵州茅台)
5. **Observation**: 1488.21
6. **Final Answer**: 贵州茅台的股票收盘价（1488.21）比青岛啤酒（67.92）高

## 扩展

### 添加新工具

1. 在 `tools.ts` 中定义工具：

```typescript
export const tools: Tool[] = [
  // ...existing tools
  {
    name: 'your_tool_name',
    description: '工具描述',
    parameters: {
      type: 'object',
      properties: {
        param1: {
          type: 'string',
          description: '参数描述',
        },
      },
      required: ['param1'],
    },
  },
]
```

2. 实现工具函数：

```typescript
export function yourToolFunction(param1: string): string {
  // 实现逻辑
  return 'result'
}
```

3. 注册到工具注册表：

```typescript
export const toolRegistry: ToolRegistry = {
  // ...existing tools
  your_tool_name: (params) => yourToolFunction(params.param1),
}
```

## 技术特点

- **类型安全**: 完整的 TypeScript 类型定义
- **模块化**: 清晰的模块划分
- **异步处理**: 原生 async/await 支持
- **可扩展**: 易于添加新工具
- **环境变量**: dotenv 管理敏感信息

