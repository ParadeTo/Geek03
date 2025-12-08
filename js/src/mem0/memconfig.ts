import {OpenAIEmbeddings} from '@langchain/openai'
import * as dotenv from 'dotenv'

dotenv.config()

const COLLECTION_NAME = 'test'

const embeddings = new OpenAIEmbeddings({
  modelName: 'compass-embedding-v3',
  apiKey: process.env.API_KEY,
  configuration: {
    baseURL: 'http://localhost:3001',
  },
})

async function getQdrantClient() {
  const {QdrantClient} = await import('@qdrant/js-client-rest')
  return new QdrantClient({
    host: '10.53.40.38',
    port: 6333,
  })
}

export const m = {
  async search(query: string, options: {user_id: string}) {
    const qdrant = await getQdrantClient()
    const queryVector = await embeddings.embedQuery(query)

    const results = await qdrant.search(COLLECTION_NAME, {
      vector: queryVector,
      limit: 5,
      filter: {
        must: [{key: 'user_id', match: {value: options.user_id}}],
      },
    })

    return results.map((r: any) => ({
      memory: r.payload?.memory as string,
      score: r.score,
    }))
  },

  async add(messages: {role: string; content: string}[], userId: string) {
    const qdrant = await getQdrantClient()
    const text = messages.map((msg) => `${msg.role}: ${msg.content}`).join('\n')
    const vector = await embeddings.embedQuery(text)

    await qdrant.upsert(COLLECTION_NAME, {
      points: [
        {
          id: Date.now(),
          vector,
          payload: {memory: text, user_id: userId},
        },
      ],
    })
  },
}
