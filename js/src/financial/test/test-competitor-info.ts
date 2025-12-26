import * as fs from 'fs'
import * as path from 'path'
import {getCompetitorInfo} from '../agent'

async function test() {
  console.log('🚀 开始单独调试 getCompetitorInfo 节点...')

  const filePath = path.join(
    __dirname,
    '../../../final_output/竞争对手与行业均值数据.md'
  )

  if (!fs.existsSync(filePath)) {
    console.error(
      '❌ 未找到已存数据文件，请先运行 workflow 测试或确保文件路径正确。'
    )
    return
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  console.log('📖 已读取上下文内容，长度:', content.length)

  // 构造模拟状态
  const mockState: any = {
    competitor_and_industry_data: content,
  }

  try {
    const result = await getCompetitorInfo(mockState)
    console.log('✅ 提取成功！')
    console.log(
      '📦 竞争对手信息:',
      JSON.stringify(result.competitor_info, null, 2)
    )
  } catch (error) {
    console.error('❌ 提取过程中出现错误:', error)
  }
}

test()


