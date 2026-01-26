import { generateMirrorWithAI } from '../../plugins/openai'

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
Below are daily Responsagility reflections from the same person across one week.

Reflect:
- common reactions
- common responses
- repeated noticings
- key learnings
- a short theme of the week

Constraints:
- No advice
- No fixing
- Warm, grounded, human tone

Reflections:
${compiled}

Write a weekly mirror.
`.trim()

  return generateMirrorWithAI(prompt)
}
