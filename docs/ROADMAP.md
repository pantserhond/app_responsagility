# Responsagility — Roadmap

**Last updated:** 2026-07-10 — AI flow rewritten (single idempotent submit), timezone/streak/notification/recovery-race fixes, delete account added, dead template code removed.

Product intent: a **simple reflective practice app**. Four questions a day, an AI mirror, a weekly mirror. Nothing else. New features must defend their existence against that sentence.

## Open tasks

- [x] 1.1 Apply migration 002 to the live project — done 2026-07-10 (rewritten to match live schema: adds `weekly_summaries.reflection_count`, which the scheduler and endpoints required; unique index + RLS already existed)
- [ ] 1.2 Configure custom SMTP in Supabase (Resend) so forgot-password emails send — manual, dashboard
- [ ] 1.3 Real Privacy Policy + Terms URLs in settings (Apple requires the privacy policy at submission)
- [ ] 1.4 Add `@fastify/rate-limit` to the backend before public launch
- [ ] 1.5 Point `EXPO_PUBLIC_API_URL` at the Railway URL and do a production smoke test of the full practice flow
- [ ] 1.6 App Store submission (icons/splash are still Expo defaults — replace before submitting)

## Ideas (unratified — only if they survive the simplicity test)

- On-demand weekly mirror: generate when the user opens a finished week with no summary, instead of (or as fallback to) the Sunday scheduler
- Notification deep-link straight into the practice flow

## Session log

- 2026-07-10 — Direct DB access set up (DATABASE_URL + dockerized psql); found live schema missing `weekly_summaries.reflection_count` (weekly endpoints + scheduler were failing in prod — 0 summaries despite 4 reflections); migration 002 rewritten against reality and applied; submit upsert rehearsed against live constraints in a rolled-back transaction — 1.1 (done)

- 2026-07-10 — Full audit + finish pass: replaced step-machine API with idempotent `POST /practice/submit`, fixed review-screen question mismatch, local-timezone date keys, streak calc, recovery redirect race, Android notification channel + foreground handler, added `DELETE /account` + settings row, migration 002, deleted dead template/backend files — (done, verified: tsc + eslint green both projects, backend boot + endpoint probes)
