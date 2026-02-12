import { FastifyInstance } from 'fastify'
import {
  advanceFlow,
  ReflectionStep,
  ReflectionState,
  PROMPTS
} from '../../domain/reflections/flow'
import { generateDailyMirror } from '../../domain/reflections/mirror'
import { getDailyReflection } from '../../domain/reflections/flow'

interface PracticeAnswerBody {
  date: string // YYYY-MM-DD
  userInput: string
}

export async function practiceRoutes(app: FastifyInstance) {
  app.post<{ Body: PracticeAnswerBody }>(
    '/practice/answer',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { date, userInput } = request.body
      const clientId = request.user.id

      /*
        Load or create today's reflection
      */
      const { data: existing, error } = await app.supabase
        .from('daily_reflections')
        .select('*')
        .eq('client_id', clientId)
        .eq('reflection_date', date)
        .single()

      let reflection = existing

      if (error && error.code === 'PGRST116') {
        const { data: created, error: insertError } =
          await app.supabase
            .from('daily_reflections')
            .insert({
              client_id: clientId,
              reflection_date: date,
              step: 'react'
            })
            .select()
            .single()

        if (insertError || !created) {
          return reply.status(500).send({ error: 'Failed to create reflection' })
        }

        reflection = created
      }

      if (!reflection) {
        return reply.status(500).send({ error: 'Reflection state invalid' })
      }

      if (reflection.step === 'review' && reflection.daily_mirror) {
        return reply.send({
        type: 'completed',
          text: reflection.daily_mirror,
        })
      }

      /*
        Advance domain flow
      */
      const currentState: ReflectionState = {
        clientId,
        date,
        step: reflection.step as ReflectionStep
      }

      const flowResult = advanceFlow(currentState, userInput)

      /*
        Persist answer for CURRENT step
      */
      const stepFieldMap: Record<ReflectionStep, string | null> = {
        react: 'react',
        respond: 'respond',
        notice: 'notice',
        learn: 'learn',
        review: null
      }

      const field = stepFieldMap[currentState.step]

      if (field) {
        await app.supabase
          .from('daily_reflections')
          .update({
            [field]: userInput,
            updated_at: new Date().toISOString()
          })
          .eq('id', reflection.id)
      }

      /*
        Persist next step
      */
      if (flowResult.nextState) {
        await app.supabase
          .from('daily_reflections')
          .update({
            step: flowResult.nextState.step,
            updated_at: new Date().toISOString()
          })
          .eq('id', reflection.id)
      }

      /*
        If review step reached, generate mirror
        But first verify all 4 answers exist
      */
      if (flowResult.nextState?.step === 'review') {
        // Re-fetch the reflection to get all saved answers
        const { data: updatedReflection } = await app.supabase
          .from('daily_reflections')
          .select('*')
          .eq('id', reflection.id)
          .single()

        // Validate all 4 answers exist before generating mirror
        const answers = {
          react: updatedReflection?.react,
          respond: updatedReflection?.respond,
          notice: updatedReflection?.notice,
          learn: userInput, // This was just submitted
        }

        const missingAnswers = Object.entries(answers)
          .filter(([_, value]) => !value || value.trim().length === 0)
          .map(([key]) => key)

        if (missingAnswers.length > 0) {
          // Not all answers provided - go back to the first missing step
          console.error(`Missing answers for mirror generation: ${missingAnswers.join(', ')}`)

          // Find the first missing step and go back to it
          const stepOrder: ReflectionStep[] = ['react', 'respond', 'notice', 'learn']
          const firstMissing = stepOrder.find(step => missingAnswers.includes(step)) || 'react'

          await app.supabase
            .from('daily_reflections')
            .update({
              step: firstMissing,
              updated_at: new Date().toISOString()
            })
            .eq('id', reflection.id)

          return reply.send({
            type: 'question',
            text: PROMPTS[firstMissing]
          })
        }

        // All answers validated - safe to cast
        const mirrorText = await generateDailyMirror({
          react: answers.react!,
          respond: answers.respond!,
          notice: answers.notice!,
          learn: answers.learn!,
        })

        await app.supabase
          .from('daily_reflections')
          .update({
            daily_mirror: mirrorText,
            updated_at: new Date().toISOString()
          })
          .eq('id', reflection.id)

        return reply.send({
          type: 'mirror',
          text: mirrorText
        })
      }


      /*
        Otherwise, return next prompt
      */
      return reply.send({
        type: 'question',
        text: flowResult.nextPrompt
      })
    }
  )

  app.get(
    '/practice/reflection/:date',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { date } = request.params as { date: string }
      const clientId = request.user.id

      const supabase = request.server.supabase
      const reflection = await getDailyReflection(supabase, clientId, date)

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

      const supabase = request.server.supabase

      const { data, error } = await supabase
        .from('daily_reflections')
        .select('reflection_date')
        .eq('client_id', clientId)
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
}