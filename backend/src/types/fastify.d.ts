import 'fastify'
import { SupabaseClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { FastifyRequest, FastifyReply } from 'fastify'

export interface AuthUser {
  id: string
  email: string
}

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
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }

  interface FastifyRequest {
    user: AuthUser
  }
}
