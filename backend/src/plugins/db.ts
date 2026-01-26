import fp from 'fastify-plugin'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export default fp(async (app) => {
  const { url, serviceAnonKey } = app.env.supabase

  const supabase: SupabaseClient = createClient(
    url,
    serviceAnonKey
  )

  app.decorate('supabase', supabase)
})