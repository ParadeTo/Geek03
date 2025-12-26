import {execSync} from 'child_process'
import * as path from 'path'

const BRIDGE_PATH = path.join(__dirname, 'akshare_bridge.py')
const VENV_PYTHON = path.join(__dirname, 'venv', 'bin', 'python3')

/**
 * AkShare 数据获取工具类 (方案一：通过 Python 桥接)
 */
export class AkShare {
  private static execute(funcName: string, ...args: string[]): any {
    try {
      // 构造命令，注意参数转义
      const escapedArgs = args
        .map((arg) => `"${arg.replace(/"/g, '\\"')}"`)
        .join(' ')
      const command = `"${VENV_PYTHON}" "${BRIDGE_PATH}" ${funcName} ${escapedArgs}`

      const output = execSync(command, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
      })

      // 尝试寻找 JSON 部分（防止 Python 输出其他干扰信息）
      const jsonStart = output.indexOf('{')
      const jsonArrayStart = output.indexOf('[')
      let startIndex = -1

      if (
        jsonStart !== -1 &&
        (jsonArrayStart === -1 || jsonStart < jsonArrayStart)
      ) {
        startIndex = jsonStart
      } else {
        startIndex = jsonArrayStart
      }

      if (startIndex === -1) {
        throw new Error(`Invalid Python output: ${output}`)
      }

      const result = JSON.parse(output.substring(startIndex))

      if (result.error) {
        throw new Error(`AkShare Error: ${result.error}`)
      }

      return result
    } catch (error: any) {
      console.error(
        `Failed to execute AkShare function ${funcName}:`,
        error.message
      )
      throw error
    }
  }

  /**
   * 获取资产负债表
   */
  static getBalanceSheet(stockCode: string, year: string) {
    return this.execute('get_balance_sheet', stockCode, year)
  }

  /**
   * 获取利润表
   */
  static getIncomeStatement(stockCode: string, year: string) {
    return this.execute('get_income_statement', stockCode, year)
  }

  /**
   * 获取现金流量表
   */
  static getCashFlowStatement(stockCode: string, year: string) {
    return this.execute('get_cash_flow_statement', stockCode, year)
  }

  /**
   * 获取财务指标
   */
  static getFinancialIndicator(stockCode: string, year: string) {
    return this.execute('get_financial_indicator', stockCode, year)
  }

  /**
   * 获取十大股东信息
   */
  static getTop10Shareholders(stockCode: string) {
    return this.execute('get_top10_shareholders', stockCode)
  }

  /**
   * 获取十大流通股东信息
   */
  static getFreeTop10Shareholders(stockCode: string) {
    return this.execute('get_free_top10_shareholders', stockCode)
  }

  /**
   * 获取主要股东信息
   */
  static getMainStockHolder(stockCode: string) {
    return this.execute('get_main_stock_holder', stockCode)
  }

  /**
   * 获取限售解禁信息
   */
  static getRestrictedRelease(stockCode: string) {
    return this.execute('get_restricted_release', stockCode)
  }

  /**
   * 获取公司基本介绍信息（主营业务、经营范围等）
   */
  static getStockIntro(stockCode: string) {
    return this.execute('get_stock_intro', stockCode)
  }

  /**
   * 通用的 AkShare 调用
   * @param akFuncName AkShare 中的函数名，如 'stock_zh_a_spot'
   * @param args 函数参数
   */
  static generic(akFuncName: string, ...args: any[]) {
    const stringArgs = args.map((arg) => JSON.stringify(arg))
    return this.execute('generic', akFuncName, ...stringArgs)
  }
}
