# Auth Setup

This project uses **Supabase Auth** with **GitHub OAuth**.

## Prerequisites

Before configuring auth, make sure:

1. Your Supabase project already exists.
2. You already ran the database scripts from [Database Setup](./DATABASE_SETUP.md).
3. Your local `.env.local` is ready with the Supabase project values.

## Required Environment Variables

Add these to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Optional for local redirect override:

```env
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
```

If `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` is not set, the app falls back to:

```txt
${window.location.origin}/auth/callback
```

## How The App Auth Flow Works

### Login page

The login button is in:

- `app/(auth)/login/page.tsx`

It calls:

- `supabase.auth.signInWithOAuth({ provider: "github" })`

### Callback route

After GitHub finishes authentication, Supabase redirects back to:

- `/auth/callback`

That route is implemented in:

- `app/(auth)/auth/callback/route.ts`

It exchanges the auth code for a session with:

- `supabase.auth.exchangeCodeForSession(code)`

## Step 1: Create a GitHub OAuth App

Go to:

- <https://github.com/settings/developers>

Create a new **OAuth App**.

Use:

### Application name

Anything you want, for example:

```txt
filipenses-413 local
```

### Homepage URL

For local development:

```txt
http://localhost:3000
```

### Authorization callback URL

Use your Supabase callback URL:

```txt
https://<your-project-ref>.supabase.co/auth/v1/callback
```

You can find `<your-project-ref>` in your Supabase project URL.

After creating the app, GitHub gives you:

- Client ID
- Client Secret

## Step 2: Configure GitHub Provider in Supabase

In Supabase Dashboard:

1. Go to **Authentication**
2. Go to **Providers**
3. Open **GitHub**
4. Enable the provider
5. Paste:
   - GitHub Client ID
   - GitHub Client Secret

Save the provider.

## Step 3: Configure Redirect URLs in Supabase

In Supabase Dashboard:

1. Go to **Authentication**
2. Go to **URL Configuration**

Add this redirect URL for local development:

```txt
http://localhost:3000/auth/callback
```

If you use `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`, it must match one of the allowed redirect URLs in Supabase.

## Step 4: Restart the App

After updating `.env.local`, restart the dev server so Next.js reloads the environment variables.

```bash
npm run dev
```

## Step 5: Test Login

1. Open:

```txt
http://localhost:3000/login
```

2. Click **Continue with GitHub**
3. Complete the GitHub OAuth flow
4. Confirm you are redirected back into the app

## Step 6: Verify Profile Creation

After login, verify the user exists in both:

- `auth.users`
- `public.profiles`

You can verify with:

```sql
select au.id, au.email, p.id as profile_id, p.display_name
from auth.users au
left join public.profiles p on p.id = au.id;
```

If `profile_id` is `null`, run:

- `scripts/006_backfill_profiles.sql`

## Common Problems

### GitHub login redirects but does not create a usable profile

Cause:
- user exists in `auth.users`
- missing row in `public.profiles`

Fix:
- run `scripts/006_backfill_profiles.sql`

### OAuth callback mismatch

Cause:
- GitHub OAuth App callback URL does not match Supabase callback URL

Fix:
- GitHub callback must be:

```txt
https://<your-project-ref>.supabase.co/auth/v1/callback
```

### App redirects incorrectly after login

Cause:
- Supabase allowed redirect URLs do not include your app callback

Fix:
- add:

```txt
http://localhost:3000/auth/callback
```

to Supabase **Authentication > URL Configuration**

## Recommended Validation Flow

After auth works:

1. Log in with GitHub
2. Confirm `public.profiles` contains your user
3. Create a project
4. Create a secret
5. Reveal the secret
6. Check activity logs
