import fp from 'fastify-plugin'
import dotenv from 'dotenv'

dotenv.config()

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),

  supabase: {
    url: requireEnv('SUPABASE_URL'),
    serviceAnonKey: requireEnv('SUPABASE_ANON_KEY'),
  },

  openai: {
    apiKey: requireEnv('OPENAI_API_KEY'),
  },
}

export default fp(async (fastify) => {
  fastify.decorate('env', env)
})