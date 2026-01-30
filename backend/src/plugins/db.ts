import fp from 'fastify-plugin'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export default fp(async (app) => {
  const { url, serviceRoleKey } = app.env.supabase

  const supabase: SupabaseClient = createClient(
    url,
    serviceRoleKey
  )

  app.decorate('supabase', supabase)
})