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
    weekEnd: weekEnd.toISOString().slice(0, 10),
  }
}

export async function runWeeklySummaries(app: FastifyInstance) {
  const { weekStart, weekEnd } = getWeekRange()

  // Find all users who have at least one reflection this week
  const { data: rows } = await app.supabase
    .from('daily_reflections')
    .select('client_id')
    .gte('reflection_date', weekStart)
    .lte('reflection_date', weekEnd)

  if (!rows || rows.length === 0) return

  const clientIds = [...new Set(rows.map((r) => r.client_id))]

  for (const clientId of clientIds) {
    const { data: existing } = await app.supabase
      .from('weekly_summaries')
      .select('id')
      .eq('client_id', clientId)
      .eq('week_start', weekStart)
      .eq('week_end', weekEnd)
      .maybeSingle()

    if (existing) continue

    const { data: reflections } = await app.supabase
      .from('daily_reflections')
      .select('react, respond, notice, learn, reflection_date')
      .eq('client_id', clientId)
      .gte('reflection_date', weekStart)
      .lte('reflection_date', weekEnd)
      .order('reflection_date', { ascending: true })

    if (!reflections || reflections.length === 0) continue

    try {
      const summaryText = await generateWeeklySummaryText(reflections)

      await app.supabase.from('weekly_summaries').insert({
        client_id: clientId,
        week_start: weekStart,
        week_end: weekEnd,
        summary_text: summaryText,
        reflection_count: reflections.length,
      })

      app.log.info(`Generated weekly summary for ${clientId} (${weekStart})`)
    } catch (err) {
      app.log.error({ err }, `Failed to generate summary for ${clientId}`)
    }
  }
}

export function scheduleWeeklySummaries(app: FastifyInstance) {
  const MS_PER_HOUR = 60 * 60 * 1000

  setInterval(async () => {
    const now = new Date()
    // Run every Sunday at 20:00 UTC (22:00 SAST on Railway).
    // ponytail: reflections completed after the Sunday run miss that week's
    // summary; move to node-cron with a Monday catch-up run if that matters.
    if (now.getUTCDay() === 0 && now.getUTCHours() === 20) {
      app.log.info('Running weekly summaries scheduler...')
      try {
        await runWeeklySummaries(app)
      } catch (err) {
        app.log.error({ err }, 'Weekly summaries scheduler failed')
      }
    }
  }, MS_PER_HOUR)
}
