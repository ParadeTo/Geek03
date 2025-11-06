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

### 规划评估节点（关键）

```typescript
async function planStep(state: typeof PlanExecuteState.State) {
  // 1. 构建评估提示词（包含任务、原计划、执行历史）
  const prompt = PLAN_PROMPT
    .replace('{input}', state.input)
    .replace('{plan}', planStr)
    .replace('{past_steps}', pastStepsStr)

  // 2. LLM 分析并生成新计划
  const response = await llm.invoke(prompt)
  const content = response.content as string

  // 3. 从 LLM 输出中提取新计划
  const newPlan = extractPlanFromResponse(content)

  // 4. 对比并显示计划调整
  if (newPlan !== originalPlan) {
    console.log('[计划调整] 检测到计划变更')
  }

  return {plan: newPlan}
}
```

### 执行节点（使用 createReactAgent）

```typescript
const executeAgent = createReactAgent({
  llm,
  tools,
  messageModifier: SYSTEM_PROMPT,
})

async function executeStep(state) {
  const task = state.plan[0]
  const result = await executeAgent.invoke({
    messages: [['user', task]],
  })
  return {pastSteps: [[task, result]]}
}
```

## 运行

```bash
npm run plan:advanced
```

## 示例

### 场景：动态计划调整

**输入：**
```
目标：分析青岛啤酒和贵州茅台的投资价值对比
规则：
1. 如果价格相差超过 1000 元，需计算差异百分比
2. 如果价格接近（< 1000 元），无需额外计算
3. 最后给出投资建议

初始计划（故意不完整）：
1. 获取青岛啤酒的股票收盘价
2. 获取贵州茅台的股票收盘价
3. 对比两者价格差异
```

**执行过程（体现动态调整）：**

1. **执行步骤1** → 青岛啤酒价格: 67.92 元

2. **规划评估** → 继续执行步骤2、3

3. **执行步骤2** → 贵州茅台价格: 1488.21 元

4. **规划评估（关键调整）**
   - LLM 分析：价格相差 1420.29 元 > 1000 元
   - **动态调整计划**：
     ```
     原计划: [对比两者价格差异]
     调整为: 
       - 计算价格差异（1488.21 - 67.92）
       - 计算差异百分比
       - 给出投资建议
     ```

5. **执行调整后的步骤** → 使用 calculator 工具计算

6. **最终完成** → 输出分析报告

**关键点：**
- 初始计划没有"计算百分比"步骤
- LLM 根据实际价格差异，自动添加了计算步骤
- 体现了真正的动态规划能力

## 适用场景

- 复杂多步骤任务
- 需要根据中间结果调整策略
- 需要详细的执行记录
- 对可靠性要求高的场景

