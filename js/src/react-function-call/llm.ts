import OpenAI from 'openai'
import * as dotenv from 'dotenv'

dotenv.config()

/**
 * OpenAI 客户端实例 - DeepSeek API
 */
export const client = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: 'http://localhost:3001',
})
