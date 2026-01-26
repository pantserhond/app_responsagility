import 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    env: {
      nodeEnv: string
      port: number
      supabase: {
        url: string
        serviceAnonKey: string
      }
      openai: {
        apiKey: string
      }
    }
  }
}