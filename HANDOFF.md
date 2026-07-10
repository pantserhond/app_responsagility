# Responsagility App — Session Handoff

## Project Layout

```
responsagility_app/
  app/        ← React Native / Expo app
  backend/    ← Fastify API server (deployed to Railway)
  supabase/   ← SQL migrations
```

**Run locally:**
- Backend: `cd backend && npm run dev` (port 3000)
- App: `cd app && npx expo start`, then `i` (iOS) or `a` (Android)

---

## What Has Been Built

### App screens
- `(auth)/login` — email + password sign in, "Forgot password?" link
- `(auth)/register` — new account → verify-email screen
- `(auth)/forgot-password` — sends Supabase password reset email *(needs SMTP config, see below)*
- `(auth)/callback` — handles deep links; owns its own navigation (recovery → `/change-password`, everything else → `(tabs)`); exempt from the root layout auth redirect to avoid a redirect race
- `(tabs)/index` — daily practice flow (4 questions → review overlay → AI mirror). Answers are collected locally; on confirm, **one** call to `POST /practice/submit`. If local storage is empty (fresh install), it hydrates today's state from the backend so a completed day isn't offered again.
- `(tabs)/reflections` — calendar of completed days, streak, "WEEKLY MIRRORS" list
- `(tabs)/settings` — theme, daily reminder notifications, change password, sign out, **delete account**
- `reflection/[date]` / `weekly/[weekStart]` — detail screens with native share sheet
- `change-password` — works for both settings and recovery flow

### Backend routes
| Method | Path | Description |
|--------|------|-------------|
| POST | `/practice/submit` | Submit all 4 answers at once, generates + returns the mirror. **Idempotent**: if a mirror already exists for that date it is returned unchanged, so retries are always safe. Body validated by Fastify JSON schema. |
| GET | `/practice/reflection/:date` | Fetch a single completed daily reflection |
| GET | `/practice/reflections` | All completed reflection dates (filters `daily_mirror IS NOT NULL`) |
| GET | `/practice/weekly-summaries` | All weekly summaries, newest first |
| GET | `/practice/weekly-summary/:weekStart` | Single weekly summary |
| DELETE | `/account` | Deletes all user data + the auth user (App Store guideline 5.1.1(v)) |

The old stateful `POST /practice/answer` step machine was **removed** — replaying answers one-by-one could shift them into the wrong fields on retry and could generate the mirror from the wrong input. `flow.ts` is gone; `getDailyReflection` now lives in `domain/reflections/queries.ts`.

### AI mirrors
- `domain/reflections/mirror.ts` — daily mirror; shared persona/voice exported as `MIRROR_VOICE` and reused by the weekly summary prompt
- Model: `OPENAI_MODEL` env var, defaults to `gpt-4.1-mini`
- Weekly scheduler (`schedulers/weeklySummaries.ts`) runs Sundays 20:00 **UTC** (22:00 SAST); reflections completed after that run miss the week's summary (noted in code)

### Supabase
- Backend uses the **service role key** (RLS bypassed); every query filters by `client_id` from a verified JWT (jose/JWKS)
- Migrations: `001` profiles, `002` adds `weekly_summaries.reflection_count` — **both applied to the live DB** (2026-07-10)
- Live schema notes: `daily_reflections`/`weekly_summaries` were created via the dashboard; `client_id` is `text` (no FK to auth.users), unique constraints on `(client_id, reflection_date)` / `(client_id, week_start)` exist, RLS is enabled on all three tables. The legacy `step` column is unused by code but kept (DEFAULT 'react').
- **Direct DB access**: `DATABASE_URL` in `backend/.env` (session pooler URI, gitignored). Claude can manage the database via dockerized psql — no local psql/supabase CLI needed:
  ```
  DB_URL=$(grep '^DATABASE_URL=' backend/.env | cut -d= -f2-)
  docker run --rm -v $PWD/supabase/migrations:/m:ro postgres:16-alpine psql "$DB_URL" -v ON_ERROR_STOP=1 -f /m/<file>.sql
  ```

---

## Open Issues / Next Steps

### 🔴 Supabase SMTP not configured (forgot password doesn't send)
Dashboard → Project Settings → Auth → SMTP Settings → Custom SMTP (Resend recommended: host `smtp.resend.com`, port 465, user `resend`, password = API key). Also set Site URL + Redirect URLs to match the app's deep link scheme. App code is complete.

### 🟡 Privacy Policy / Terms links are placeholders
Settings shows "available soon" alerts. Apple requires a real privacy policy URL at submission.

### 🟡 No rate limiting on the backend
`/practice/submit` calls OpenAI. Low risk while the user base is small (auth required + idempotent per day), but add `@fastify/rate-limit` before any public launch.

### 🟢 No automated tests
The step machine (the main testable logic) was deleted; remaining handlers are straight-line DB calls. Add integration tests (fastify inject + stubbed supabase/openai) if the backend grows.

---

## Environment Variables

### App (`app/.env`)
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_API_URL=http://<your-ip>:3000   ← update to Railway URL for production
```

### Backend (`backend/.env`)
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgresql://...   ← session pooler URI, for direct DB management (local only, not needed on Railway)
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini   (optional)
PORT=3000
```

---

## Deployment
- Backend → **Railway** (`npm run build && npm start`)
- App → **Apple App Store** (iOS) — Apple Developer account required
- Supabase → free tier (Postgres + Auth)
