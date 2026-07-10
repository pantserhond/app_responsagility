import { generateMirrorWithAI } from '../../plugins/openai'
import { MIRROR_VOICE } from '../reflections/mirror'

type WeeklyReflection = {
  react: string
  respond: string
  notice: string
  learn: string
  reflection_date: string
}

export async function generateWeeklySummaryText(
  reflections: WeeklyReflection[]
): Promise<string> {
  const compiled = reflections
    .map(r => `
Date: ${r.reflection_date}

React:
${r.react}

Respond:
${r.respond}

Notice:
${r.notice}

Learn:
${r.learn}
`.trim())
    .join('\n\n---\n\n')

  const prompt = `
${MIRROR_VOICE}

Below are daily Responsagility reflections from the same person across one week.

Write a weekly mirror that reflects:
- common reactions
- common responses
- repeated noticings
- key learnings
- a short theme of the week

Keep it concise: one or two short paragraphs.

Reflections:
${compiled}
`.trim()

  return generateMirrorWithAI(prompt)
}
