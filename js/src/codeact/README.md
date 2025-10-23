# CodeAct Agent 实现

## 概述

CodeAct (Code as Action) 是一种让 LLM 通过生成和执行代码来完成任务的 Agent 模式。

## 核心思想

与 ReAct 不同，CodeAct 不依赖预定义工具，而是：
1. LLM 分析问题
2. 生成 JavaScript 代码
3. 在沙箱环境中执行代码
4. 将执行结果反馈给 LLM
5. 循环直到得到最终答案

## 目录结构

```
codeact/
├── prompts.ts    # 系统提示词
├── tools.ts      # 代码执行工具（使用 vm 沙箱）
├── types.ts      # 状态定义
├── graph.ts      # LangGraph 工作流
├── index.ts      # 入口文件
└── README.md     # 本文件
```

## 运行

```bash
npm run codeact:dev
```

## 工作流程

```
用户问题 → LLM 分析 → 生成代码 → 判断 → 执行代码 → 反馈结果 → 循环或结束
                                   ↓
                              输出答案
```

## 安全注意

代码执行使用 Node.js 的 `vm` 模块创建沙箱环境，并设置了 5 秒超时限制。
生产环境建议使用更严格的沙箱方案（如 Docker 容器）。

## 示例

**输入：** "请计算 1~100 的和"

**LLM 生成代码：**
```javascript
let sum = 0
for (let i = 1; i <= 100; i++) {
  sum += i
}
result = sum
```

**执行结果：** 5050

**最终答案：** "1到100的和是5050"

