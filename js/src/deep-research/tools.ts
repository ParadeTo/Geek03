import {tool} from '@langchain/core/tools'
import {z} from 'zod'

export const SearchQueryListSchema = z.object({
  query: z.array(z.string()).describe('List of queries for web search'),
  rationale: z
    .string()
    .describe(
      'Brief explanation why these queries are relevant to the research topic.'
    ),
})

export const ReflectionSchema = z.object({
  is_sufficient: z
    .boolean()
    .describe(
      "Whether sufficient information has been provided to answer the user's question."
    ),
  knowledge_gap: z
    .string()
    .describe(
      'Description of missing information or information that needs clarification.'
    ),
  follow_up_queries: z
    .array(z.string())
    .describe('List of follow-up queries to address the knowledge gap.'),
})

async function searchTavily(query: string): Promise<any[]> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is not set')
  }

  console.log(`🔍 Searching Tavily: "${query}"`)

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: 'basic', // or 'advanced'
        include_answer: true,
        max_results: 5,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Tavily API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const results = data.results || []

    // Format results
    const transformed = results.map((r: any) => ({
      title: r.title,
      content: r.content,
      url: r.url,
      snippet: r.content,
    }))

    console.log(`✅ Found ${transformed.length} results from Tavily`)
    return transformed
  } catch (e) {
    console.error(`❌ Tavily search failed for "${query}":`, e)
    return []
  }
}

export const wideSearchForToolStr = tool(
  async ({query}: {query: string}) => {
    const results = await searchTavily(query)

    if (results.length === 0) {
      return '未找到相关结果。'
    }

    let ret = ''
    const template = `
    标题:{title}
    简介:{snippet}
    链接:{link}
    
    `

    for (const result of results) {
      const title = result.title || '无标题'
      const snippet = result.content || result.snippet || '无简介'
      const link = result.url || '无链接'

      ret += template
        .replace('{title}', title)
        .replace('{snippet}', snippet)
        .replace('{link}', link)
    }
    return ret
  },
  {
    name: 'widesearch_for_toolstr',
    description: 'Use Tavily search tool for web search.',
    schema: z.object({
      query: z.string().describe('Search query string.'),
    }),
  }
)
