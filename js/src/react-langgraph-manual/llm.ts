import OpenAI from 'openai'
import * as dotenv from 'dotenv'

dotenv.config()

/**
 * OpenAI 客户端配置
 */
export const client = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: 'http://localhost:3001',
})
