import {Annotation} from '@langchain/langgraph'

// 反思模式状态定义
export const ReflectionState = Annotation.Root({
  userQuery: Annotation<string>(), // 用户需求
  bestCommand: Annotation<string>(), // 当前最优方案
  reflection: Annotation<string>(), // 反思记录
  iterations: Annotation<number>(), // 迭代次数
})

export type ReflectionStateType = typeof ReflectionState.State
