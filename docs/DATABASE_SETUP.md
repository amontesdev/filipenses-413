# Database Setup

This project uses **Supabase Postgres**. Supabase creates the database when you create the project, so the setup here is about creating the **schema**, **policies**, and **triggers** the app expects.

## Prerequisites

1. Create a Supabase project in the Supabase dashboard.
2. Open the **SQL Editor** for that project.
3. Run the SQL scripts from this repository in the order shown below.

## Script Execution Order

Run these scripts in this exact order:

1. `scripts/000_enable_extensions.sql`
2. `scripts/001_create_profiles.sql`
3. `scripts/002_create_projects.sql`
4. `scripts/003_create_secrets.sql`
5. `scripts/004_create_activity.sql`
6. `scripts/005_profile_trigger.sql`
7. `scripts/006_backfill_profiles.sql` *(recommended if users may already exist in `auth.users`)*
8. `scripts/007_create_user_ai_keys.sql` *(for BYOK AI Keys feature)*
9. `scripts/008_create_user_ai_preferences.sql` *(for BYOK AI Keys feature)*

## What Each Script Does

### `000_enable_extensions.sql`
- Enables `pgcrypto`
- Required for `gen_random_uuid()`

### `001_create_profiles.sql`
- Creates `public.profiles`
- Adds RLS policies so users can only access their own profile

### `002_create_projects.sql`
- Creates `public.projects`
- Adds status constraint for:
  - `idea`
  - `in_progress`
  - `launched`
  - `archived`
- Adds RLS policies and indexes

### `003_create_secrets.sql`
- Creates `public.secrets`
- Stores encrypted values
- Adds RLS policies and indexes

### `004_create_activity.sql`
- Creates `public.activity_logs`
- Stores user activity history
- Adds RLS policies and indexes

### `005_profile_trigger.sql`
- Creates a trigger on `auth.users`
- Automatically inserts a matching row into `public.profiles` for new users

### `006_backfill_profiles.sql`
- Inserts missing `profiles` rows for users that already existed before the trigger was created
- Safe to run more than once because it only inserts missing profiles

### `007_create_user_ai_keys.sql`
- Creates `public.user_ai_keys`
- Stores encrypted AI provider API keys (OpenAI, DeepSeek, etc.)
- Adds RLS policies and trigger for `updated_at`

### `008_create_user_ai_preferences.sql`
- Creates `public.user_ai_preferences`
- Stores user's preferred AI provider selection
- Adds RLS policies

## Why `006_backfill_profiles.sql` Matters

If a user exists in `auth.users` but does not exist in `public.profiles`, creating a project will fail with a foreign key error like:

```text
insert or update on table "projects" violates foreign key constraint "projects_user_id_fkey"
```

This script fixes that by backfilling missing profiles.

## Verification Queries

After running the scripts, you can verify the setup with these queries.

### Check users and profiles

```sql
select au.id, au.email, p.id as profile_id, p.display_name
from auth.users au
left join public.profiles p on p.id = au.id;
```

### Check created tables

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Expected public tables:
- `activity_logs`
- `profiles`
- `projects`
- `secrets`
- `user_ai_keys`
- `user_ai_preferences`

## Required Environment Variables

The database schema alone is not enough. The app also requires these environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
ENCRYPTION_KEY=...
```

### `ENCRYPTION_KEY`

Required for vault encryption/decryption.

Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Recommended Validation Flow

After DB setup and env configuration:

1. Log in with GitHub
2. Confirm a row exists in `public.profiles`
3. Create a project
4. Create a secret
5. Reveal the secret
6. Check the activity feed

## AI Keys Setup (v0.2.0+)

For the BYOK AI Keys feature:

1. Run `scripts/007_create_user_ai_keys.sql`
2. Run `scripts/008_create_user_ai_preferences.sql`
3. After pulling, run `npm install openai`
4. Add an AI provider key in Settings → AI Providers

## Notes

- Supabase creates the database for you when the project is created.
- These scripts create the schema inside that database.
- If your Supabase project is completely empty, run all scripts in order.
- If users already signed in before the trigger existed, run `006_backfill_profiles.sql`.
