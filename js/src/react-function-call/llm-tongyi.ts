import OpenAI from 'openai'
import * as dotenv from 'dotenv'

dotenv.config()

/**
 * OpenAI 客户端实例 - 通义千问 API
 */
export const client = new OpenAI({
  apiKey: process.env.TONGYI_API_KEY,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
})


