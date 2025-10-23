# Function Calling 实现

这是基于 OpenAI Function Calling API 的 TypeScript 实现，参考了 Python 版本的实现。

## 文件说明

- `tools.ts` - 工具定义和工具函数注册表
- `llm.ts` - DeepSeek API 客户端配置
- `llm-tongyi.ts` - 通义千问 API 客户端配置
- `functioncalling.ts` - 基础的 Function Calling 实现（非流式）
- `functioncalling-stream.ts` - 流式 Function Calling 实现，支持深度思考和并行工具调用

## 运行方式

### 非流式版本（DeepSeek）

```bash
ts-node src/react-function-call/functioncalling.ts
```

### 流式版本（通义千问）

```bash
ts-node src/react-function-call/functioncalling-stream.ts
```

## 环境变量配置

需要在 `.env` 文件中配置以下环境变量：

```
DEEPSEEK_API_KEY=your_deepseek_api_key
TONGYI_API_KEY=your_tongyi_api_key
```

## 特性

### 非流式版本
- 简单的工具调用流程
- 支持单轮工具调用
- 使用 DeepSeek API

### 流式版本
- 支持流式输出
- 支持深度思考过程展示
- 支持并行工具调用
- 使用通义千问 API
- 实时输出思考过程和回复内容

## 工具示例

当前实现了一个获取股票收盘价的工具，支持查询：
- 青岛啤酒：67.92
- 贵州茅台：1488.21



