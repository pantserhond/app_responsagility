import { FastifyInstance } from 'fastify'
import { generateDailyMirror } from '../../domain/reflections/mirror'
import { getDailyReflection } from '../../domain/reflections/queries'

interface PracticeSubmitBody {
  date: string // YYYY-MM-DD
  react: string
  respond: string
  notice: string
  learn: string
}

const answerSchema = { type: 'string', minLength: 1, maxLength: 5000 }

const submitBodySchema = {
  type: 'object',
  required: ['date', 'react', 'respond', 'notice', 'learn'],
  properties: {
    date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
    react: answerSchema,
    respond: answerSchema,
    notice: answerSchema,
    learn: answerSchema,
  },
} as const

export async function practiceRoutes(app: FastifyInstance) {
  /*
    Submit a full day's reflection in one call.
    Idempotent: if a mirror already exists for this date, it is returned
    unchanged (safe to retry after a network failure).
  */
  app.post<{ Body: PracticeSubmitBody }>(
    '/practice/submit',
    { preHandler: app.authenticate, schema: { body: submitBodySchema } },
    async (request, reply) => {
      const { date } = request.body
      const clientId = request.user.id

      const answers = {
        react: request.body.react.trim(),
        respond: request.body.respond.trim(),
        notice: request.body.notice.trim(),
        learn: request.body.learn.trim(),
      }

      if (Object.values(answers).some((a) => a.length === 0)) {
        return reply.status(400).send({ error: 'All four answers are required' })
      }

      const { data: existing } = await app.supabase
        .from('daily_reflections')
        .select('daily_mirror')
        .eq('client_id', clientId)
        .eq('reflection_date', date)
        .maybeSingle()

      if (existing?.daily_mirror) {
        return reply.send({ type: 'mirror', text: existing.daily_mirror })
      }

      const { error: upsertError } = await app.supabase
        .from('daily_reflections')
        .upsert(
          {
            client_id: clientId,
            reflection_date: date,
            ...answers,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'client_id,reflection_date' }
        )

      if (upsertError) {
        app.log.error({ err: upsertError }, 'Failed to save reflection')
        return reply.status(500).send({ error: 'Failed to save reflection' })
      }

      let mirrorText: string
      try {
        mirrorText = await generateDailyMirror(answers)
      } catch (err) {
        app.log.error({ err }, 'Mirror generation failed')
        // Answers are saved — the client can retry this exact call safely.
        return reply.status(502).send({ error: 'Mirror generation failed, please try again' })
      }

      const { error: mirrorError } = await app.supabase
        .from('daily_reflections')
        .update({ daily_mirror: mirrorText, updated_at: new Date().toISOString() })
        .eq('client_id', clientId)
        .eq('reflection_date', date)

      if (mirrorError) {
        app.log.error({ err: mirrorError }, 'Failed to save mirror')
        return reply.status(500).send({ error: 'Failed to save mirror' })
      }

      return reply.send({ type: 'mirror', text: mirrorText })
    }
  )

  app.get(
    '/practice/reflection/:date',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { date } = request.params as { date: string }
      const clientId = request.user.id

      const reflection = await getDailyReflection(app.supabase, clientId, date)

      if (!reflection) {
        return reply.code(404).send({
          error: 'Reflection not found',
        })
      }

      return {
        date,
        react: reflection.react,
        respond: reflection.respond,
        notice: reflection.notice,
        learn: reflection.learn,
        mirror: reflection.mirror,
      }
    }
  )

  app.get(
    '/practice/reflections',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const clientId = request.user.id

      const { data, error } = await app.supabase
        .from('daily_reflections')
        .select('reflection_date')
        .eq('client_id', clientId)
        .not('daily_mirror', 'is', null)
        .order('reflection_date', { ascending: true })

      if (error) {
        return reply.code(500).send({
          error: 'Failed to fetch reflection dates',
        })
      }

      return {
        dates: data.map((row) => row.reflection_date),
      }
    }
  )

  app.get(
    '/practice/weekly-summaries',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const clientId = request.user.id

      const { data, error } = await app.supabase
        .from('weekly_summaries')
        .select('id, week_start, week_end, summary_text, reflection_count')
        .eq('client_id', clientId)
        .order('week_start', { ascending: false })

      if (error) {
        return reply.code(500).send({ error: 'Failed to fetch weekly summaries' })
      }

      return { summaries: data ?? [] }
    }
  )

  app.get(
    '/practice/weekly-summary/:weekStart',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { weekStart } = request.params as { weekStart: string }
      const clientId = request.user.id

      const { data, error } = await app.supabase
        .from('weekly_summaries')
        .select('id, week_start, week_end, summary_text, reflection_count')
        .eq('client_id', clientId)
        .eq('week_start', weekStart)
        .maybeSingle()

      if (error) {
        return reply.code(500).send({ error: 'Failed to fetch weekly summary' })
      }

      if (!data) {
        return reply.code(404).send({ error: 'Weekly summary not found' })
      }

      return data
    }
  )
}
