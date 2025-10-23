/**
 * 工具参数属性定义
 */
export interface ToolParameterProperty {
  type: string
  description: string
}

/**
 * 工具参数定义
 */
export interface ToolParameters {
  type: string
  properties: Record<string, ToolParameterProperty>
  required: string[]
}

/**
 * 工具定义
 */
export interface Tool {
  name: string
  description: string
  parameters: ToolParameters
}

/**
 * 消息接口
 */
export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * 工具函数类型
 */
export type ToolFunction = (
  params: Record<string, any>
) => string | Promise<string>

/**
 * 工具注册表
 */
export type ToolRegistry = Record<string, ToolFunction>

