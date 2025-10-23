import OpenAI from 'openai'
import * as dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

/**
 * OpenAI 客户端实例
 * 配置为通义千问 API
 */
export const client = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: 'http://localhost:3001',
})
