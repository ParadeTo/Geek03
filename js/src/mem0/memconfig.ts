import * as dotenv from 'dotenv'

dotenv.config()

const COLLECTION_NAME = 'test'

async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.302.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.EMBEDDING_KEY}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text,
    }),
  })
  const data = (await response.json()) as {data: [{embedding: number[]}]}
  console.log(data)

  return data.data[0].embedding
}

async function getQdrantClient() {
  const {QdrantClient} = await import('@qdrant/js-client-rest')
  return new QdrantClient({
    host: '127.0.0.1',
    port: 6333,
  })
}

async function ensureCollection(qdrant: any) {
  const collections = await qdrant.getCollections()
  const exists = collections.collections.some(
    (c: any) => c.name === COLLECTION_NAME
  )
  if (!exists) {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {size: 1536, distance: 'Cosine'},
    })
    console.log(`Collection ${COLLECTION_NAME} created`)
  }
}

export const m = {
  async search(query: string, options: {user_id: string}) {
    const qdrant = await getQdrantClient()
    await ensureCollection(qdrant)
    const queryVector = await getEmbedding(query)

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
    await ensureCollection(qdrant)
    const text = messages.map((msg) => `${msg.role}: ${msg.content}`).join('\n')
    const vector = await getEmbedding(text)

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
