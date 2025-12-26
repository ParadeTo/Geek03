import {Annotation} from '@langchain/langgraph'
import {BaseMessage} from '@langchain/core/messages'
import {z} from 'zod'

/**
 * 竞争对手信息 Zod Schema
 */
export const CompetitorInfoSchema = z.object({
  stock_name: z.string().describe('公司名称'),
  stock_code: z.string().describe('股票代码（纯数字股票代码，不要带HK SZ等标识）'),
  market: z.string().describe('市场'),
})

/**
 * 竞争对手列表 Zod Schema
 */
export const CompetitorInfoListSchema = z.object({
  competitors: z.array(CompetitorInfoSchema).describe('竞争对手列表'),
})

/**
 * 竞争对手信息
 */
export type CompetitorInfo = z.infer<typeof CompetitorInfoSchema>

/**
 * 竞争对手列表
 */
export type CompetitorInfoList = z.infer<typeof CompetitorInfoListSchema>

/**
 * 整体图状态定义
 */
export const OverallState = Annotation.Root({
  stock_code: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  stock_name: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  market: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  competitor_and_industry_data: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  competitor_info: Annotation<CompetitorInfoList | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  year: Annotation<string[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  company_report: Annotation<Record<string, any>>({
    reducer: (x, y) => ({...x, ...y}),
    default: () => ({}),
  }),
  compare_company_report: Annotation<Record<string, any>>({
    reducer: (x, y) => ({...x, ...y}),
    default: () => ({}),
  }),
  shareholder_info: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  valuation_model: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  business_info: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  formatted_output: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  final_report: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
})

