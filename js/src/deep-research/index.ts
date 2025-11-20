import {graph} from './graph'
import {HumanMessage} from '@langchain/core/messages'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
  console.log('🚀 程序启动...')
  console.log('📦 环境变量检查:', {
    API_KEY: process.env.API_KEY ? '已设置' : '未设置',
  })

  const question =
    process.argv[2] ||
    '请从行业内主要上市公司中找出与商汤科技市值规模与业务规模相似，业务重叠度高的公司'

  console.log(`\n🔍 启动深度研究助手`)
  console.log(`📋 研究问题: ${question}`)
  console.log(`⏳ 开始执行...\n`)

  try {
    console.log('📡 正在调用 graph.stream...')
    const stream = await graph.stream({
      messages: [new HumanMessage(question)],
    })

    console.log('✅ 图执行已启动，等待节点输出...\n')

    for await (const event of stream) {
      for (const [node, output] of Object.entries(event)) {
        if (node === '__end__') continue
        console.log(`\n${'='.repeat(60)}`)
        console.log(`🔧 节点: ${node}`)
        console.log('='.repeat(60))

        if (node === 'finalize_answer' && output.messages) {
          console.log('\n✅ 最终答案:\n')
          console.log(output.messages[0].content)
        } else if (node === 'generate_query') {
          console.log('📝 生成的查询:')
          output.search_query?.forEach((q: string, i: number) => {
            console.log(`  ${i + 1}. ${q}`)
          })
        } else if (node === 'web_research') {
          console.log('🌐 网络研究已完成')
        } else if (node === 'reflection') {
          console.log('🤔 反思结果:')
          console.log(`  - 信息是否充足: ${output.is_sufficient ? '是' : '否'}`)
          if (output.knowledge_gap) {
            console.log(`  - 知识缺口: ${output.knowledge_gap}`)
          }
          if (output.follow_up_queries?.length > 0) {
            console.log(`  - 后续查询:`)
            output.follow_up_queries.forEach((q: string, i: number) => {
              console.log(`    ${i + 1}. ${q}`)
            })
          }
        } else {
          console.log(JSON.stringify(output, null, 2))
        }
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('🎉 研究完成!')
    console.log('='.repeat(60) + '\n')
  } catch (error) {
    console.error('\n❌ 错误:', error)
    if (error instanceof Error) {
      console.error('错误堆栈:', error.stack)
    }
    throw error
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('主函数错误:', err)
    process.exit(1)
  })
}
