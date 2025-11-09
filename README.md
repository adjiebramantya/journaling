# JournaIA

AI-assisted journaling that helps you reflect every day, track your mood, and generate weekly recaps. Built with Next.js App Router, Supabase, and OpenAI.

## Features

- AI summaries for every journal entry with actionable suggestions (OpenAI `gpt-4o-mini`)
- Weekly recap generation that aggregates entries and produces a personal reflection
- Mood tracker timeline powered by Recharts to visualise emotional trends
- Multi-language interface (Indonesian and English) with locale-aware routing
- Supabase authentication, profile storage, and secure account deletion workflow
- Responsive glassmorphism UI with dark theme and custom JournaIA icon

## Tech Stack

- Next.js 16 (App Router) • React 19 • TypeScript 5
- Supabase (Auth, Postgres, Edge Functions) via `@supabase/ssr`
- OpenAI SDK (`openai` v4) for AI-generated insights
- Tailwind CSS v4 (utility classes via PostCSS runtime)
- date-fns for time utilities • Recharts for data visualisation

## Getting Started

### Prerequisites

- Node.js 18.18+ (Next.js 16 requirement)
- A Supabase project with service role access
- An OpenAI API key with access to the `gpt-4o-mini` model

### Environment Variables

Create a `.env.local` file with:

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<server-side-service-role-key>
OPENAI_API_KEY=<openai-api-key>
```

- `SUPABASE_SERVICE_ROLE_KEY` is required only on the server for hard deletes (`/api/account/delete`).
- Without `OPENAI_API_KEY`, journaling and weekly summaries gracefully show error states.

### Database Schema

The app expects the following tables (simplified definitions):

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz default now()
);

create table journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  content text not null,
  mood text,
  created_at timestamptz default now()
);

create table journal_summaries (
  journal_id uuid primary key references journals(id) on delete cascade,
  summary text,
  ai_suggestion text,
  created_at timestamptz default now()
);

create table weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  summary text,
  ai_suggestion text,
  created_at timestamptz default now(),
  unique (user_id, week_start, week_end)
);
```

Adjust column types or triggers to match your Supabase setup (e.g. enable RLS and policies for `user_id`).

### Install & Run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` and select a locale (`/en`, `/id`).

### Useful Scripts

- `npm run lint` – ESLint via `eslint.config.mjs`
- `npm run build` – Production build
- `npm run start` – Run the built app

## Internationalisation

Locale-aware routes live under `app/[locale]/*`. Translations are stored in `messages/en.json` and `messages/id.json`, accessed via the custom i18n helpers in `i18n/`. Add a new locale by:

1. Extending `routing.locales` in `i18n/routing.ts`
2. Providing translation JSON
3. Adding locale-specific routes if needed

## API Routes

- `POST /api/journals/:id/summarize` – Generates an AI summary for a single entry
- `POST /api/weekly/generate` – Creates a weekly recap (cached per week)
- `DELETE /api/account/delete` – Removes user data and the Supabase Auth user

Each route reads the `x-locale` header to decide language responses and relies on Supabase session cookies.

## Assets & Branding

- Primary app icon lives at `public/journaia-icon.svg`
- Next.js `app/icon.svg` re-exports the same asset for favicon/PWA usage
- Update Open Graph/Twitter images by editing `iconPath` in `app/layout.tsx`

## Deployment

1. Set environment variables in your hosting provider (Vercel recommended)
2. Provide Supabase service role key as an encrypted server-side secret only
3. Ensure `OPENAI_API_KEY` is available in the build environment
4. Run `npm run build` followed by `npm run start` (handled automatically on Vercel)

## Troubleshooting

- **AI summary errors**: check `OPENAI_API_KEY`, billing, and model access
- **Supabase auth issues**: confirm URL/anon keys match your project and cookies are enabled
- **Weekly recap returns 400**: ensure at least one journal entry exists for the current week

---

Crafted with ❤️ and reflection. Let JournaIA guide your daily growth.
