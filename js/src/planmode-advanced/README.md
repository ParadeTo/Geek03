# 高级计划模式 (Plan Mode - Advanced)

## 概述

高级计划模式在简单计划模式的基础上，增加了**动态调整计划**、**结构化输出**和**执行历史跟踪**的能力。

## 核心特点

### 与简单计划模式的区别

| 特性 | 简单计划模式 | 高级计划模式 |
|-----|-------------|-------------|
| **计划调整** | 固定不变 | 动态调整 |
| **执行历史** | 无 | 记录所有步骤 |
| **步骤执行** | 直接工具调用 | 使用 ReAct Agent |
| **输出格式** | 文本判断 | 结构化输出 |
| **复杂度** | 低 | 中高 |

## 工作流程

```
初始计划 → 执行第一步（ReAct Agent）→ 规划评估 → 判断
                                          ↑         ↓
                                          └─────继续/结束
```

### 关键创新

1. **动态重新规划**：每执行一步后，LLM 会根据结果决定是否调整剩余计划
2. **结构化输出**：使用 Zod Schema 确保 LLM 返回规范的 JSON
3. **执行历史跟踪**：记录每一步的任务和结果，供后续决策参考
4. **ReAct 执行器**：每个步骤使用完整的 ReAct Agent 执行，更智能

## 目录结构

```
planmode-advanced/
├── prompts.ts    # 系统提示词和规划提示词
├── tools.ts      # 工具定义
├── types.ts      # 状态和 Schema 定义
├── graph.ts      # LangGraph 工作流
├── index.ts      # 入口文件
└── README.md     # 本文件
```

## 核心代码

### 结构化输出 Schema

```typescript
export const ActionSchema = z.union([
  z.object({
    type: z.literal('plan'),
    steps: z.array(z.string()),
  }),
  z.object({
    type: z.literal('response'),
    response: z.string(),
  }),
])
```

### 状态定义

```typescript
export const PlanExecuteState = Annotation.Root({
  input: Annotation<string>(),           // 目标任务
  plan: Annotation<string[]>(),          // 当前计划
  pastSteps: Annotation<Array<[string, string]>>({
    reducer: (x, y) => x.concat(y),      // 执行历史（累加）
  }),
  response: Annotation<string>(),        // 最终答案
})
```

## 运行

```bash
npm run plan:advanced
```

## 示例

**输入：**
- 目标：完成所有计划后输出DONE
- 初始计划：
  1. 获取青岛啤酒的股票收盘价
  2. 获取贵州茅台的股票收盘价
  3. 比较两者，得出结论

**执行过程：**
1. 执行步骤1 → 获得青岛啤酒价格: 67.92
2. 规划评估 → 还需执行步骤2和3
3. 执行步骤2 → 获得贵州茅台价格: 1488.21
4. 规划评估 → 还需执行步骤3
5. 执行步骤3 → 比较结果: 茅台更贵
6. 规划评估 → 所有步骤完成，输出最终答案

## 适用场景

- 复杂多步骤任务
- 需要根据中间结果调整策略
- 需要详细的执行记录
- 对可靠性要求高的场景

