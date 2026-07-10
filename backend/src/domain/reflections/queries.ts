import { SupabaseClient } from '@supabase/supabase-js'

export async function getDailyReflection(
  supabase: SupabaseClient,
  clientId: string,
  date: string
) {
  const { data, error } = await supabase
    .from('daily_reflections')
    .select('reflection_date, react, respond, notice, learn, daily_mirror')
    .eq('client_id', clientId)
    .eq('reflection_date', date)
    .maybeSingle()

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
