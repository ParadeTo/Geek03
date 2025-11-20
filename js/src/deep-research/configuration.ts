export const DEFAULT_CONFIGURATION = {
  query_generator_model: 'gpt-4o',
  reflection_model: 'gpt-4o',
  answer_model: 'gpt-4o',
  number_of_initial_queries: 1, // Reduced to avoid rate limits
  max_research_loops: 2,
}

export class Configuration {
  query_generator_model: string = DEFAULT_CONFIGURATION.query_generator_model
  reflection_model: string = DEFAULT_CONFIGURATION.reflection_model
  answer_model: string = DEFAULT_CONFIGURATION.answer_model
  number_of_initial_queries: number =
    DEFAULT_CONFIGURATION.number_of_initial_queries
  max_research_loops: number = DEFAULT_CONFIGURATION.max_research_loops

  static fromRunnableConfig(config?: any): Configuration {
    const configurable = config?.configurable || {}
    const instance = new Configuration()

    instance.query_generator_model =
      configurable.query_generator_model ||
      process.env.QUERY_GENERATOR_MODEL ||
      instance.query_generator_model
    instance.reflection_model =
      configurable.reflection_model ||
      process.env.REFLECTION_MODEL ||
      instance.reflection_model
    instance.answer_model =
      configurable.answer_model ||
      process.env.ANSWER_MODEL ||
      instance.answer_model
    instance.number_of_initial_queries = Number(
      configurable.number_of_initial_queries ||
        process.env.NUMBER_OF_INITIAL_QUERIES ||
        instance.number_of_initial_queries
    )
    instance.max_research_loops = Number(
      configurable.max_research_loops ||
        process.env.MAX_RESEARCH_LOOPS ||
        instance.max_research_loops
    )

    return instance
  }
}
