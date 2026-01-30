import 'fastify'
import { SupabaseClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

declare module 'fastify' {
  interface FastifyInstance {
    env: {
      nodeEnv: string
      port: number
      supabase: {
        url: string
        serviceRoleKey: string
      }
      openai: {
        apiKey: string
      }
    }

    supabase: SupabaseClient
    openai: OpenAI
  }
}
