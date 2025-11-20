export function getCurrentDate(): string {
  const date = new Date()
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export const queryWriterInstructions = `Your goal is to generate complex, diverse web search queries. These queries are for an advanced automated web research tool that can analyze complex results, track links, and synthesize information.

Requirements:
- Always prioritize generating a single search query, only add another query if the original question requires multiple aspects or elements and a single query is insufficient to answer.
- Each query should focus on a specific aspect of the original question.
- Do not generate more than {number_queries} queries.
- Queries should be diverse; if the topic is broad, generate multiple queries.
- Do not generate multiple similar queries; 1 is sufficient.
- Queries should ensure collecting the latest information. The current date is {current_date}.

Format:
- Format your response as a JSON object with the following two fields:
   - "rationale": Brief explanation of why these queries are relevant to the research topic.
   - "query": A list of search queries

Example:

Topic: Which grew more last year, Apple stock or iPhone sales?
\`\`\`json
{{
    "rationale": "To answer this question accurately, we need specific Apple stock performance and iPhone sales data. These queries target specific financial information required: company revenue trends, product-specific unit sales data, and stock price movements for the same fiscal year, for direct comparison.",
    "query": ["Apple FY2024 total revenue growth", "FY2024 iPhone sales growth", "Apple stock price growth FY2024"],
}}
\`\`\`

Context: {research_topic}`

export const webSearcherInstructions = `Conduct targeted web searches to gather the latest reliable information on "{research_topic}" and synthesize it into verifiable text artifacts.

Requirements:
- Queries should ensure collecting the latest information. The current date is {current_date}.
- Conduct multiple, diverse searches to gather comprehensive information.
- Carefully track sources for each specific piece of information and summarize key findings.
- The output should be a high-quality summary or report based on your search findings.
- Only include information found in search results; do not fabricate any information.

Research Topic:
{research_topic}
`

export const reflectionInstructions = `You are an expert research assistant analyzing summaries about "{research_topic}".

Instructions:
- Identify knowledge gaps or areas needing deeper exploration and generate a follow-up query (1 or more).
- If the provided summaries are sufficient to answer the user's question, do not generate follow-up queries.
- If there are knowledge gaps, generate a follow-up query to help expand your understanding.
- Focus on technical details, implementation details, or recent trends not fully covered.

Requirements:
- Ensure the follow-up query is self-contained and includes relevant context required for web search.

Output Format:
- Format your response as a JSON object with the following fields:
   - "is_sufficient": true or false
   - "knowledge_gap": Description of missing or needing clarification information
   - "follow_up_queries": Write a specific question to address this gap

Example:
\`\`\`json
{{
    "is_sufficient": true, // or false
    "knowledge_gap": "The summary lacks information on performance metrics and benchmarks", // "" if is_sufficient is true
    "follow_up_queries": ["What are the typical performance benchmarks and metrics for evaluating [specific technology]?"] // [] if is_sufficient is true
}}
\`\`\`

Carefully analyze the summaries, identify knowledge gaps, and generate a follow-up query. Then, output your response in the JSON format below:

Summaries:
{summaries}
`

export const answerInstructions = `Generate a high-quality answer to the user's question based on the provided summaries.

Instructions:
- The current date is {current_date}.
- You are the final step of a multi-step research process; do not mention that you are the final step.
- You have access to all information gathered from previous steps.
- You have access to the user's question.
- Generate a high-quality answer to the user's question based on the provided summaries and user question.
- Correctly include sources used in the summary in your answer, using markdown format (e.g., [apnews](https://vertexaisearch.cloud.google.com/id/1-0)). This is mandatory.

User Context:
- {research_topic}

Summaries:
{summaries}`
