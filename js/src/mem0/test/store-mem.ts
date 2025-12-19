import {m} from '../memconfig'

async function main() {
  const messages = [
    {role: 'user', content: '小张和小明是什么关系？'},
    {role: 'assistant', content: '小张是小明的爸爸'},
    {role: 'user', content: '小张喜欢喝什么饮料？'},
    {role: 'assistant', content: '小张喜欢喝大窑。'},
  ]

  await m.add(messages, 'xyy')
  console.log('记忆存储成功')
}

main().catch(console.error)
