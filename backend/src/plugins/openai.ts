import OpenAI from 'openai'

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  return new OpenAI({ apiKey })
}

export async function generateMirrorWithAI(prompt: string): Promise<string> {
  const client = getOpenAIClient()

  const response = await client.responses.create({
    model: 'gpt-4.1-mini',
    input: prompt
  })

  return response.output_text
}