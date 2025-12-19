import {m} from '../memconfig'

async function main() {
  const results = await m.search('小明的爸爸喜欢喝什么饮料？', {user_id: 'xyy'})
  console.log(results)
}

main().catch(console.error)

