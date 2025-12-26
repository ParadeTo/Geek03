import {tool} from '@langchain/core/tools'
import {z} from 'zod'

/**
 * 计算毛利率
 */
export const calculateGrossProfitMargin = tool(
  ({operating_income, operating_cost}) => {
    if (operating_income === 0) return '营业收入为0，无法计算毛利率。'
    return (operating_income - operating_cost) / operating_income
  },
  {
    name: 'calculate_gross_profit_margin',
    description: '计算毛利率。公式: (营业收入 - 营业成本) / 营业收入',
    schema: z.object({
      operating_income: z.number().describe('营业收入'),
      operating_cost: z.number().describe('营业成本'),
    }),
  }
)

/**
 * 计算净利率
 */
export const calculateNetProfitMargin = tool(
  ({net_profit, operating_income}) => {
    if (operating_income === 0) return '营业收入为0，无法计算净利率。'
    return net_profit / operating_income
  },
  {
    name: 'calculate_net_profit_margin',
    description: '计算净利率。公式: 净利润 / 营业收入',
    schema: z.object({
      net_profit: z.number().describe('净利润'),
      operating_income: z.number().describe('营业收入'),
    }),
  }
)

/**
 * 计算资产负债率
 */
export const calculateDebtToAssetRatio = tool(
  ({total_liabilities, total_assets}) => {
    if (total_assets === 0) return '总资产为0，无法计算资产负债率。'
    return total_liabilities / total_assets
  },
  {
    name: 'calculate_debt_to_asset_ratio',
    description: '计算资产负债率。公式: 总负债 / 总资产',
    schema: z.object({
      total_liabilities: z.number().describe('总负债'),
      total_assets: z.number().describe('总资产'),
    }),
  }
)

/**
 * 计算流动比率
 */
export const calculateCurrentRatio = tool(
  ({current_assets, current_liabilities}) => {
    if (current_liabilities === 0) return '流动负债为0，无法计算流动比率。'
    return current_assets / current_liabilities
  },
  {
    name: 'calculate_current_ratio',
    description: '计算流动比率。公式: 流动资产 / 流动负债',
    schema: z.object({
      current_assets: z.number().describe('流动资产'),
      current_liabilities: z.number().describe('流动负债'),
    }),
  }
)

/**
 * 计算速动比率
 */
export const calculateQuickRatio = tool(
  ({current_assets, inventories, prepayments, current_liabilities}) => {
    if (current_liabilities === 0) return '流动负债为0，无法计算速动比率。'
    const quickAssets = current_assets - inventories - prepayments
    return quickAssets / current_liabilities
  },
  {
    name: 'calculate_quick_ratio',
    description: '计算速动比率。公式: (流动资产 - 存货 - 预付账款) / 流动负债',
    schema: z.object({
      current_assets: z.number().describe('流动资产'),
      inventories: z.number().describe('存货'),
      prepayments: z.number().describe('预付账款'),
      current_liabilities: z.number().describe('流动负债'),
    }),
  }
)

/**
 * 计算总资产周转率
 */
export const calculateTotalAssetTurnover = tool(
  ({operating_income, average_total_assets}) => {
    if (average_total_assets === 0)
      return '平均总资产为0，无法计算总资产周转率。'
    return operating_income / average_total_assets
  },
  {
    name: 'calculate_total_asset_turnover',
    description: '计算总资产周转率。公式: 营业收入 / 平均总资产',
    schema: z.object({
      operating_income: z.number().describe('营业收入'),
      average_total_assets: z.number().describe('平均总资产'),
    }),
  }
)

/**
 * 计算应收账款周转天数
 */
export const calculateReceivablesTurnoverDays = tool(
  ({operating_income, average_net_receivables}) => {
    if (average_net_receivables === 0)
      return '平均应收账款净额为0，无法计算应收账款周转天数。'
    const turnoverRatio = operating_income / average_net_receivables
    if (turnoverRatio === 0) return '营业收入为0，无法计算应收账款周转天数。'
    return 365 / turnoverRatio
  },
  {
    name: 'calculate_receivables_turnover_days',
    description:
      '计算应收账款周转天数。公式: 365 / (营业收入 / 平均应收账款净额)',
    schema: z.object({
      operating_income: z.number().describe('营业收入'),
      average_net_receivables: z.number().describe('平均应收账款净额'),
    }),
  }
)

/**
 * 计算存货周转天数
 */
export const calculateInventoryTurnoverDays = tool(
  ({cost_of_goods_sold, average_inventory}) => {
    if (average_inventory === 0)
      return '平均存货余额为0，无法计算存货周转天数。'
    const turnoverRatio = cost_of_goods_sold / average_inventory
    if (turnoverRatio === 0) return '营业成本为0，无法计算存货周转天数。'
    return 365 / turnoverRatio
  },
  {
    name: 'calculate_inventory_turnover_days',
    description: '计算存货周转天数。公式: 365 / (营业成本 / 平均存货余额)',
    schema: z.object({
      cost_of_goods_sold: z.number().describe('营业成本'),
      average_inventory: z.number().describe('平均存货余额'),
    }),
  }
)

/**
 * 计算现金流匹配度
 */
export const calculateCashFlowMatchingRatio = tool(
  ({net_cash_flow_from_operating_activities, net_profit}) => {
    if (net_profit === 0) return '净利润为0，无法计算现金流匹配度。'
    return net_cash_flow_from_operating_activities / net_profit
  },
  {
    name: 'calculate_cash_flow_matching_ratio',
    description: '计算现金流匹配度。公式: 经营活动产生的现金流量净额 / 净利润',
    schema: z.object({
      net_cash_flow_from_operating_activities: z
        .number()
        .describe('经营活动产生的现金流量净额'),
      net_profit: z.number().describe('净利润'),
    }),
  }
)

/**
 * 计算销售现金比率
 */
export const calculateSalesCashRatio = tool(
  ({net_cash_flow_from_operating_activities, operating_income}) => {
    if (operating_income === 0) return '营业收入为0，无法计算销售现金比率。'
    return net_cash_flow_from_operating_activities / operating_income
  },
  {
    name: 'calculate_sales_cash_ratio',
    description:
      '计算销售现金比率。公式: 经营活动产生的现金流量净额 / 营业收入',
    schema: z.object({
      net_cash_flow_from_operating_activities: z
        .number()
        .describe('经营活动产生的现金流量净额'),
      operating_income: z.number().describe('营业收入'),
    }),
  }
)

/**
 * 计算权益乘数
 */
export const calculateEquityMultiplier = tool(
  ({asset_liability_ratio}) => {
    if (asset_liability_ratio >= 1) return '资产负债率不能大于或等于1。'
    if (asset_liability_ratio < 0) return '资产负债率不能为负数。'
    const denominator = 1 - asset_liability_ratio
    return 1 / denominator
  },
  {
    name: 'calculate_equity_multiplier',
    description: '计算权益乘数。公式: 1 / (1 - 资产负债率)',
    schema: z.object({
      asset_liability_ratio: z.number().describe('资产负债率（如0.6表示60%）'),
    }),
  }
)

export const calculationTools = [
  calculateGrossProfitMargin,
  calculateNetProfitMargin,
  calculateDebtToAssetRatio,
  calculateCurrentRatio,
  calculateQuickRatio,
  calculateTotalAssetTurnover,
  calculateReceivablesTurnoverDays,
  calculateInventoryTurnoverDays,
  calculateCashFlowMatchingRatio,
  calculateSalesCashRatio,
  calculateEquityMultiplier,
]

import {AkShare} from './akshare'

/**
 * 格式化 DataFrame 数据为字符串
 */
function formatDataFrame(data: any[], title: string): string {
  if (!data || data.length === 0) return `${title}: 暂无数据`

  const lines = [`## ${title}`]
  for (const row of data) {
    const parts = Object.entries(row)
      .map(([k, v]) => `${k}: ${v ?? ''}`)
      .join('\n')
    lines.push(parts)
    lines.push('')
  }
  return lines.join('\n')
}

/**
 * 获取十大股东信息
 */
export const getTop10Shareholders = tool(
  ({stock_code}) => {
    try {
      const data = AkShare.getTop10Shareholders(stock_code)
      return formatDataFrame(data, '十大股东信息')
    } catch (e: any) {
      return `获取十大股东信息失败: ${e.message}`
    }
  },
  {
    name: 'get_top10_shareholders',
    description: '获取股票的十大股东信息（仅包含沪深A股股票）',
    schema: z.object({
      stock_code: z.string().describe('股票代码，如 600519 或 sh600519'),
    }),
  }
)

/**
 * 获取十大流通股东信息
 */
export const getFreeTop10Shareholders = tool(
  ({stock_code}) => {
    try {
      const data = AkShare.getFreeTop10Shareholders(stock_code)
      return formatDataFrame(data, '十大流通股东信息')
    } catch (e: any) {
      return `获取十大流通股东信息失败: ${e.message}`
    }
  },
  {
    name: 'get_free_top10_shareholders',
    description: '获取股票的十大流通股东信息（仅包含沪深A股股票）',
    schema: z.object({
      stock_code: z.string().describe('股票代码，如 600519 或 sh600519'),
    }),
  }
)

/**
 * 获取主要股东信息
 */
export const getMainStockHolder = tool(
  ({stock_code}) => {
    try {
      const data = AkShare.getMainStockHolder(stock_code)
      return formatDataFrame(data, '主要股东信息')
    } catch (e: any) {
      return `获取主要股东信息失败: ${e.message}`
    }
  },
  {
    name: 'get_main_stock_holder',
    description: '获取股票的主要股东信息（仅包含沪深A股股票）',
    schema: z.object({
      stock_code: z.string().describe('股票代码，如 600519'),
    }),
  }
)

/**
 * 获取限售解禁信息
 */
export const getRestrictedRelease = tool(
  ({stock_code}) => {
    try {
      const data = AkShare.getRestrictedRelease(stock_code)
      return formatDataFrame(data, '限售解禁信息')
    } catch (e: any) {
      return `获取限售解禁信息失败: ${e.message}`
    }
  },
  {
    name: 'get_restricted_release',
    description: '获取股票的限售解禁信息（仅包含沪深A股股票）',
    schema: z.object({
      stock_code: z.string().describe('股票代码，如 600519'),
    }),
  }
)

export const shareholderTools = [
  getTop10Shareholders,
  getFreeTop10Shareholders,
  getMainStockHolder,
  getRestrictedRelease,
]
