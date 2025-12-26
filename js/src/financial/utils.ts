import * as fs from 'fs'
import * as path from 'path'

/**
 * 将内容保存为 Markdown 文件
 */
export function saveMarkdown(
  content: string,
  filename: string,
  folder: string = 'data/report'
) {
  const projectRoot = path.join(__dirname, '../../')
  const reportDir = path.join(projectRoot, folder)

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, {recursive: true})
  }

  const filePath = path.join(reportDir, filename)
  fs.writeFileSync(filePath, content, 'utf-8')
  console.log(`✅ 文件已保存: ${filePath}`)
}

/**
 * 将数据保存为 CSV 文件
 * @param data 数组对象
 * @param filename 文件名
 * @param folder 文件夹路径
 */
export function saveCsv(
  data: any[],
  filename: string,
  folder: string = 'data/financial_statements'
) {
  if (!data || data.length === 0) {
    console.warn(`⚠️ 无数据可保存: ${filename}`)
    return ''
  }

  const projectRoot = path.join(__dirname, '../../')
  const targetDir = path.join(projectRoot, folder)

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, {recursive: true})
  }

  const filePath = path.join(targetDir, filename)

  // 提取表头
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const val = row[header]
          if (val === null || val === undefined) return ''
          // 处理包含逗号的字符串
          const str = String(val)
          return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str
        })
        .join(',')
    ),
  ].join('\n')

  fs.writeFileSync(filePath, '\ufeff' + csvContent, 'utf-8') // 添加 BOM 解决 Excel 乱码
  console.log(`📊 CSV 文件已保存: ${filePath}`)
  return filePath
}

/**
 * 遍历 financial_statements 目录下的 CSV 文件，返回映射
 */
export function getFinancialStatementsFileMap(): Record<
  string,
  Record<string, string[]>
> {
  const projectRoot = path.join(__dirname, '../../')
  const statementsDir = path.join(projectRoot, 'data', 'financial_statements')
  const fileMap: Record<string, Record<string, string[]>> = {}

  if (!fs.existsSync(statementsDir)) return fileMap

  const files = fs.readdirSync(statementsDir)
  for (const filename of files) {
    if (filename.endsWith('.csv')) {
      const parts = filename.split('_')
      if (parts.length < 3) continue

      const code = parts[0]
      const year = parts[1]
      const absPath = path.join(statementsDir, filename)

      if (!fileMap[code]) fileMap[code] = {}
      if (!fileMap[code][year]) fileMap[code][year] = []

      fileMap[code][year].push(absPath)
    }
  }

  return fileMap
}

/**
 * 遍历 financial_caculates 目录下的 CSV 文件，返回映射
 */
export function getFinancialCaculatesFileMap(): Record<string, string[]> {
  const projectRoot = path.join(__dirname, '../../')
  const caculatesDir = path.join(projectRoot, 'data', 'financial_caculates')
  const fileMap: Record<string, string[]> = {}

  if (!fs.existsSync(caculatesDir)) return fileMap

  const files = fs.readdirSync(caculatesDir)
  for (const filename of files) {
    if (filename.endsWith('.csv')) {
      const parts = filename.split('_')
      if (parts.length < 2) continue

      const code = parts[0]
      const absPath = path.join(caculatesDir, filename)

      if (!fileMap[code]) fileMap[code] = []
      fileMap[code].push(absPath)
    }
  }

  return fileMap
}

/**
 * 读取分析输出目录下的文件
 */
export function getAnalyzeFile(
  filename: string,
  basePath: string,
  subPath: string
): string {
  const projectRoot = path.join(__dirname, '../../')
  const filePath = path.join(projectRoot, basePath, subPath, filename)

  if (!fs.existsSync(filePath)) return ''

  return fs.readFileSync(filePath, 'utf-8')
}

/**
 * 遍历指定目录下所有 session_ 开头的文件夹，获取其中指定的文件内容
 */
export function collectSessionReports(
  baseDir: string,
  filename: string
): string[] {
  const projectRoot = path.join(__dirname, '../../')
  const targetDir = path.join(projectRoot, baseDir)
  const results: string[] = []

  if (!fs.existsSync(targetDir)) return results

  const items = fs.readdirSync(targetDir)
  for (const item of items) {
    if (item.startsWith('session_')) {
      const sessionPath = path.join(targetDir, item)
      if (fs.statSync(sessionPath).isDirectory()) {
        const content = getAnalyzeFile(filename, baseDir, item)
        if (content) {
          results.push(content)
        }
      }
    }
  }

  return results
}

/**
 * 读取 final_output 目录下的报告文件
 */
export function getReportFile(filename: string): string {
  const projectRoot = path.join(__dirname, '../../')
  const filePath = path.join(projectRoot, 'final_output', filename)

  if (!fs.existsSync(filePath)) return ''

  return fs.readFileSync(filePath, 'utf-8')
}

/**
 * 读取行业信息文件
 */
export function getIndustryInfoFile(): string {
  const projectRoot = path.join(__dirname, '../../')
  const filePath = path.join(
    projectRoot,
    'final_output',
    '竞争对手与行业均值数据.md'
  )

  if (!fs.existsSync(filePath)) return ''

  return fs.readFileSync(filePath, 'utf-8')
}

/**
 * 读取主营业务信息文件
 */
export function getBusinessInfoFile(): string {
  const projectRoot = path.join(__dirname, '../../')
  const filePath = path.join(
    projectRoot,
    'final_output',
    '主营业务与核心竞争力.md'
  )

  if (!fs.existsSync(filePath)) return ''

  return fs.readFileSync(filePath, 'utf-8')
}

/**
 * 读取 CSV 并格式化为字符串
 */
export function readCsv(filepath: string, decimalPlaces: number = 2): string {
  if (!fs.existsSync(filepath)) return ''

  const content = fs.readFileSync(filepath, 'utf-8')
  // 简单 CSV 解析 (假设没有复杂的嵌套引号逗号)
  const lines = content.replace(/^\ufeff/, '').split(/\r?\n/)
  if (lines.length < 2) return ''

  const headers = lines[0].split(',')
  const dataLines = lines.slice(1).filter((l) => l.trim() !== '')

  if (dataLines.length === 0) return '没有找到相关股票的数据'

  const formattedLines = dataLines.map((line) => {
    const values = line.split(',')
    return headers
      .map((header, i) => {
        let val = values[i]
        const num = parseFloat(val)
        if (!isNaN(num)) {
          val = num.toFixed(decimalPlaces)
        }
        return `${header}:${val ?? ''}`
      })
      .join('\n')
  })

  return formattedLines.join('\n\n')
}
