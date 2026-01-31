import { SupabaseClient } from '@supabase/supabase-js'

export type ReflectionStep =
  | 'react'
  | 'respond'
  | 'notice'
  | 'learn'
  | 'review'

export type ReflectionState = {
  clientId: string
  date: string // YYYY-MM-DD
  step: ReflectionStep
}

export type FlowResult = {
  nextState: ReflectionState | null
  nextPrompt: string | null
  completed: boolean
}

/**
 * Canonical daily reflection prompts.
 * Keep wording stable and human.
 */
export const PROMPTS: Record<ReflectionStep, string> = {
  react: 'Where did you react from your ego today?',
  respond: 'Instead of reacting, where did you manage to pause and respond today?',
  notice: 'What did you notice about yourself in moments of reaction and response today?',
  learn: 'What is one thing that you learned about yourself today?',
  review: `Great work. Thank you for taking the time to reflect on these questions.

If you're ready to receive your Reflective Summary, type YES.
Or, if you would like to change or amend any answer, type NO.`
}

/**
 * Advance the reflection flow.
 * This function is pure.
 */
export function advanceFlow(
  state: ReflectionState,
  userInput: string
): FlowResult {
  if (!userInput || userInput.trim().length === 0) {
    return {
      nextState: state,
      nextPrompt: PROMPTS[state.step],
      completed: false
    }
  }

  switch (state.step) {
    case 'react':
      return {
        nextState: { ...state, step: 'respond' },
        nextPrompt: PROMPTS.respond,
        completed: false
      }

    case 'respond':
      return {
        nextState: { ...state, step: 'notice' },
        nextPrompt: PROMPTS.notice,
        completed: false
      }

    case 'notice':
      return {
        nextState: { ...state, step: 'learn' },
        nextPrompt: PROMPTS.learn,
        completed: false
      }

    case 'learn':
      // Do NOT complete here anymore — move to review
      return {
        nextState: { ...state, step: 'review' },
        nextPrompt: PROMPTS.review,
        completed: false
      }

    case 'review':
      // Completion is handled explicitly in webhook.ts
      return {
        nextState: state,
        nextPrompt: PROMPTS.review,
        completed: false
      }

    default:
      return {
        nextState: state,
        nextPrompt: PROMPTS[state.step],
        completed: false
      }
  }
}

/**
 * Start a new daily reflection.
 */
export function startDailyReflection(
  clientId: string,
  date: string
): FlowResult {
  return {
    nextState: {
      clientId,
      date,
      step: 'react'
    },
    nextPrompt: PROMPTS.react,
    completed: false
  }
}

export async function getDailyReflection(
  supabase: SupabaseClient,
  clientId: string,
  date: string
) {
  const { data, error } = await supabase
    .from('daily_reflections')
    .select(
      'reflection_date, react, respond, notice, learn, daily_mirror'
    )
    .eq('client_id', clientId)
    .eq('reflection_date', date)
    .single()

  if (error || !data) {
    return null
  }

  return {
    date: data.reflection_date,
    react: data.react,
    respond: data.respond,
    notice: data.notice,
    learn: data.learn,
    mirror: data.daily_mirror,
  }
}
