import { FastifyInstance } from 'fastify'

export async function accountRoutes(app: FastifyInstance) {
  /*
    Delete the authenticated user's account and all their data.
    Required by App Store guideline 5.1.1(v).
    Deletes rows explicitly rather than relying on FK cascades.
  */
  app.delete(
    '/account',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const clientId = request.user.id

      for (const table of ['daily_reflections', 'weekly_summaries', 'profiles']) {
        const idColumn = table === 'profiles' ? 'id' : 'client_id'
        const { error } = await app.supabase.from(table).delete().eq(idColumn, clientId)
        if (error) {
          app.log.error({ err: error }, `Account deletion failed on ${table}`)
          return reply.status(500).send({ error: 'Failed to delete account data' })
        }
      }

      const { error: authError } = await app.supabase.auth.admin.deleteUser(clientId)
      if (authError) {
        app.log.error({ err: authError }, 'Account deletion failed on auth user')
        return reply.status(500).send({ error: 'Failed to delete account' })
      }

      return reply.send({ deleted: true })
    }
  )
}
