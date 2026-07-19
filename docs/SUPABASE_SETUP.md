# Supabase setup for VIP

VIP remains local-first: it opens and works without Supabase. When Supabase is configured, the app creates an anonymous authenticated user, loads that user's cloud backup, and saves changes after a short delay.

## 1. Restore the project

Open the intended private Supabase project dashboard. Do not commit a real project URL.

Choose **Restore project** or **Unpause project** and wait until the project is running.

## 2. Create the planner table

In Supabase, open **SQL Editor**, create a new query, paste the contents of:

`supabase/migrations/20260718150000_create_planner_states.sql`

Run the query once.

The migration creates one JSON backup row per authenticated user and enables Row Level Security so a user can only read or change their own row.

## 3. Enable anonymous sign-ins

In Supabase, open **Authentication → Providers → Anonymous Sign-Ins** and enable anonymous sign-ins.

This lets VIP create a user session without asking for an email address or password. The session remains on that browser/device. This is not an approved recovery mechanism for the pilot.

## 4. Copy the browser-safe project values

Open the project's **Connect** panel or **Project Settings → API** and copy:

- Project URL
- Publishable key

Never use a secret key or service-role key in the web app.

## 5. Add GitHub repository variables

In the `ShaunMaclachlan/variable-income-planner-codex` repository, open:

**Settings → Secrets and variables → Actions → Variables**

Create these repository variables:

- `VITE_SUPABASE_URL` = the private project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` = the publishable key copied from Supabase

The publishable key is designed to be included in browser applications. The database remains protected by the migration's Row Level Security policies.

## 6. Deploy and test

Merge the Supabase pull request into `main`. GitHub Pages will rebuild the app with the repository variables.

Then:

1. Open VIP in the usual browser.
2. Select an anonymised test profile.
3. Add or edit a harmless test shift.
4. In Supabase, open **Table Editor → planner_states** and confirm one row appears and its `updated_at` time changes.
5. Remove the test shift if it was not real.

Opening VIP performs an authentication and database read. Changing the planner performs a database write, so normal use creates genuine project activity rather than an artificial keep-alive.

## Important limitation

The first version uses an anonymous account tied to the browser's stored session. Clearing browser storage or using another device creates a separate cloud record. Email-based account recovery and true cross-device sharing should be the next authentication phase.
