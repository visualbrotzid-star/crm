# SalesTrack CRM — KPI Dashboard

A full-stack sales team KPI tracker built with Next.js 14, Supabase, and deployed on Vercel.

## What it does

- **Manager dashboard** — see all 5 reps' KPI progress at a glance (daily / weekly / monthly / quarterly)
- **Rep dashboards** — each rep sees their own performance vs targets
- **Daily log entry** — reps log 6 KPIs every day in under 2 minutes
- **KPI target management** — manager sets targets for all 4 time periods
- **Auto-calculated progress** — color-coded status (On Track / Needs Attention / Behind)
- **Team overview** — who logged today, who hasn't, deal counts, meetings booked

---

## Setup Guide

### Step 1 — Supabase

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a project named `sales-crm`
2. Go to **SQL Editor** and paste the entire contents of `supabase-schema.sql` — click Run
3. Go to **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 2 — Create your users in Supabase

Go to **Authentication → Users → Add user** and create:

1. **Team leader / manager:**
   - Email: your email
   - Password: choose one
   - Then in SQL Editor run:
     ```sql
     update profiles set role = 'manager', full_name = 'Your Name' where email = 'your@email.com';
     ```

2. **Sales reps (repeat for each of the 5 reps):**
   - Create each user via Auth → Users
   - Their profile is auto-created with role = 'rep'
   - Update their name: `update profiles set full_name = 'Rep Name' where email = 'rep@email.com';`

### Step 3 — Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import from GitHub
3. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
4. Click Deploy — done!

### Step 4 — Local development

```bash
cp .env.example .env.local
# Fill in your Supabase credentials

npm install
npm run dev
# Open http://localhost:3000
```

---

## KPI Metrics Tracked

| Metric | Description |
|--------|-------------|
| Businesses Contacted | New businesses messaged or called |
| Follow-Ups | Follow-up contacts to existing leads |
| Meetings Booked | Calls/meetings scheduled |
| Demos Done | Product presentations completed |
| Proposals Sent | Formal quotes or proposals sent |
| Deals Closed | Signed clients / confirmed deals |

## Default Daily Targets (per rep)

| Period | Contacted | Follow-ups | Meetings | Demos | Proposals | Deals |
|--------|-----------|------------|----------|-------|-----------|-------|
| Daily | 10 | 5 | 1 | 1 | 1 | 0 |
| Weekly | 50 | 25 | 5 | 3 | 3 | 1 |
| Monthly | 200 | 100 | 20 | 12 | 10 | 4 |
| Quarterly | 600 | 300 | 60 | 36 | 30 | 12 |

These are editable by the manager at any time in the KPI Targets page.

---

## Tech Stack

- **Next.js 14** (App Router, Server Components)
- **Supabase** (PostgreSQL, Auth, RLS)
- **Tailwind CSS**
- **Recharts** (activity charts)
- **Vercel** (hosting + CI/CD)
