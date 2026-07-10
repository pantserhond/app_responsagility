-- Align the live schema with the backend.
--
-- daily_reflections and weekly_summaries were created via the dashboard and
-- already have: unique (client_id, reflection_date) / (client_id, week_start),
-- RLS enabled with own-row policies, and client_id as text.
--
-- The one gap: the backend inserts and selects weekly_summaries.reflection_count,
-- which the dashboard-created table never had.

ALTER TABLE public.weekly_summaries
  ADD COLUMN IF NOT EXISTS reflection_count integer NOT NULL DEFAULT 0;

-- The legacy step-machine column (step) is no longer read or written by the
-- backend; its DEFAULT 'react' keeps new inserts valid. Left in place.
