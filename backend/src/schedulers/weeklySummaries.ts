import { FastifyInstance } from 'fastify'
import { generateWeeklySummaryText } from '../domain/weekly/summary'

function getWeekRange(reference = new Date()) {
  const date = new Date(reference)
  const day = date.getDay() || 7

  const weekStart = new Date(date)
  weekStart.setDate(date.getDate() - day + 1)
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  return {
    weekStart: weekStart.toISOString().slice(0, 10),
    weekEnd: weekEnd.toISOString().slice(0, 10)
  }
}

export async function runWeeklySummaries(app: FastifyInstance) {
  const { weekStart, weekEnd } = getWeekRange()

  const { data: clients } = await app.supabase
    .from('clients')
    .select('id')
    .eq('active', true)

  if (!clients) return

  for (const client of clients) {
    const { data: existing } = await app.supabase
      .from('weekly_summaries')
      .select('id')
      .eq('client_id', client.id)
      .eq('week_start', weekStart)
      .eq('week_end', weekEnd)
      .maybeSingle()

    if (existing) continue

    const { data: reflections } = await app.supabase
      .from('daily_reflections')
      .select('react, respond, notice, learn, reflection_date')
      .eq('client_id', client.id)
      .gte('reflection_date', weekStart)
      .lte('reflection_date', weekEnd)
      .order('reflection_date', { ascending: true })

    if (!reflections || reflections.length === 0) continue

    const summaryText = await generateWeeklySummaryText(reflections)

    await app.supabase.from('weekly_summaries').insert({
      client_id: client.id,
      week_start: weekStart,
      week_end: weekEnd,
      summary_text: summaryText,
      reflection_count: reflections.length
    })
  }
}
