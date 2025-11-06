# 人机协作模式 (Human-in-the-Loop)

## 概述

人机协作模式允许 Agent 在关键决策点暂停执行，等待人工输入后再继续。这种模式特别适合需要人工确认、提供额外信息或做出重要决策的场景。

## 核心特点

### 工作流程

```
LLM 分析 → 需要人工？
              ↓
         是 → 暂停等待 → 用户输入 → 继续执行
              ↓
         否 → 调用工具 → 继续执行
```

### 关键机制

1. **中断机制**：使用 `interrupt()` 暂停执行
2. **状态保存**：使用 `MemorySaver` 作为 checkpointer
3. **恢复执行**：通过 `Command(resume=...)` 恢复
4. **特殊工具**：定义 `ask_user` 工具触发人工介入

## 目录结构

```
human-in-loop/
├── types.ts      # 状态定义
├── tools.ts      # 工具定义（包括 ask_user）
├── graph.ts      # LangGraph 工作流
├── index.ts      # 入口文件
└── README.md     # 本文件
```

## 运行

```bash
npm run human:dev
```

## 示例

**场景：** 购物助手需要询问用户购买数量

**输入：**
```
我想买一些苹果，总共需要多少钱
```

**执行过程：**

1. **LLM 分析**
   ```
   需要知道用户要买多少苹果
   → 调用 ask_user 工具
   ```

2. **暂停执行**
   ```
   [需要询问用户] 您想购买多少个苹果？
   [等待用户输入...]
   ```

3. **用户输入**
   ```
   请输入: 5个
   [用户回答] 5个
   ```

4. **继续执行**
   ```
   [调用工具] get_price {product: '苹果'}
   → 商品苹果的价格为52.30元
   
   [LLM 计算]
   5个苹果 × 52.30元 = 261.50元
   ```

**最终输出：**
```
您想购买5个苹果，总共需要261.50元
```

## 适用场景

1. **敏感操作确认**
   - 删除数据前确认
   - 执行高风险命令前确认

2. **信息补全**
   - 缺少关键参数时询问用户
   - 需要用户选择时提供选项

3. **决策支持**
   - 提供多个方案让用户选择
   - 需要用户判断时暂停

4. **质量控制**
   - 生成内容后等待用户审核
   - 关键步骤需要人工验证

## 核心代码

### 1. 定义特殊工具

```typescript
export const askUserTool = tool(
  async (input) => {
    const {question} = input as {question: string}
    console.log('[需要询问用户]', question)
    return question
  },
  {
    name: 'ask_user',
    description: '询问用户进一步的需求',
    schema: z.object({
      question: z.string().describe('需要询问用户的问题'),
    }),
  }
)
```

### 2. 人工节点（使用 interrupt）

```typescript
async function humanNode(state: HumanLoopStateType) {
  const lastMessage = state.messages[state.messages.length - 1]
  const toolCall = lastMessage.tool_calls?.[0]

  // 暂停执行，等待用户输入
  const userInput = interrupt(toolCall.args)
  
  return {
    messages: [
      new ToolMessage({
        tool_call_id: toolCall.id,
        content: String(userInput),
      })
    ]
  }
}
```

### 3. 路由函数（识别 ask_user）

```typescript
function enterTools(state: HumanLoopStateType): string {
  const toolName = state.messages[-1].tool_calls?.[0].name
  
  if (toolName === 'ask_user') {
    return 'humanNode'  // 进入人工节点
  }
  return 'toolNode'      // 进入工具节点
}
```

### 4. 恢复执行

```typescript
// 第一次执行
let result = await app.invoke({query, messages: []}, config)

// 检查是否需要人工输入
if (needsHumanInput(result)) {
  const userInput = await getUserInput()
  
  // 恢复执行
  result = await app.invoke(
    new Command({resume: userInput}), 
    config
  )
}
```

## 配置

在 `graph.ts` 中可调整：

```typescript
// 配置 checkpointer（必需）
const memory = new MemorySaver()
const app = workflow.compile({checkpointer: memory})

// 配置线程 ID（保持状态）
const threadConfig = {configurable: {thread_id: '123'}}
```

## 注意事项

1. **必须使用 checkpointer**：人机协作模式需要保存状态
2. **线程 ID 要一致**：恢复执行时使用相同的线程 ID
3. **超时处理**：考虑添加超时机制，避免无限等待
4. **错误处理**：用户可能输入无效内容，需要验证

## 扩展

### 支持多轮人工介入

```typescript
while (true) {
  result = await app.invoke(input, config)
  
  if (!needsHumanInput(result)) break
  
  const userInput = await getUserInput()
  input = new Command({resume: userInput})
}
```

### 支持人工拒绝

```typescript
const userInput = await getUserInput()
if (userInput === 'cancel') {
  return '操作已取消'
}
```

