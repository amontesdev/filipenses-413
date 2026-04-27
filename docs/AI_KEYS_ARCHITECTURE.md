# AI Keys Architecture

This document explains how AI provider API keys are stored and used in this project.

## Goal

Let users connect their own AI provider API key to enable "Fill with AI" functionality — without the app needing a central AI subscription. The cost of AI calls is borne by the user.

## Data Model

### `user_ai_keys` table

Stores encrypted AI provider credentials:

- `id` — UUID, primary key
- `user_id` — UUID, FK to `profiles`
- `provider` — text, one of: `openai`, `deepseek`
- `name` — text, user-defined label (e.g. "default", "work")
- `encrypted_value` — AES-256-GCM ciphertext
- `created_at`, `updated_at` — timestamps

Unique constraint: `(user_id, provider, name)` — a user can have multiple keys per provider with different names.

### `user_ai_preferences` table

Stores user-level preferences:

- `id` — UUID, primary key
- `user_id` — UUID, FK to `profiles`, unique
- `preferred_provider` — text, `openai` or `deepseek`
- `created_at`, `updated_at` — timestamps

## Encryption

Encryption is identical to Secrets. Uses `lib/encryption.ts` (AES-256-GCM). The plaintext key is never stored in the database and never sent to the client.

## Request Flow

1. User clicks "Fill with AI" on a field (name, description, or notes)
2. Client calls `POST /api/ai/complete` with `{ field, project_id }` or `{ field, project_name }`
3. Server fetches user's preferred AI key from `user_ai_keys` (filtered by `preferred_provider`)
4. Server decrypts the key on the server side only
5. Server calls the AI provider API (OpenAI or DeepSeek) with a context-aware prompt
6. Completion returned to client and populated in the field

## Security Model

Same layers as Secrets:

- **Authentication** — Supabase Auth identifies the user
- **Authorization** — API routes verify user ownership
- **RLS** — Row Level Security ensures users can only access their own rows
- **Encryption at rest** — API keys stored as ciphertext
- **Server-side decrypt** — plaintext key never touches the client or logs

## Supported Providers

| Provider | Model | Output cost / 1M tokens | API base URL |
|----------|-------|------------------------|--------------|
| OpenAI | `gpt-4o-mini` | $0.60 | Default (OpenAI) |
| DeepSeek | `deepseek-v4-flash` | $0.28 | `https://api.deepseek.com` |

## Affected Files

- `scripts/007_create_user_ai_keys.sql` — database migration
- `scripts/008_create_user_ai_preferences.sql` — database migration
- `lib/encryption.ts` — AES-256-GCM encryption (reused, no changes)
- `lib/ai/openai.ts` — OpenAI SDK wrapper with multi-provider support
- `lib/ai/prompts.ts` — prompt templates per field
- `app/api/ai/keys/route.ts` — CRUD for AI keys
- `app/api/ai/keys/[id]/route.ts` — delete single key
- `app/api/ai/preferences/route.ts` — get/set preferred provider
- `app/api/ai/complete/route.ts` — AI completion endpoint
- `components/ai/*` — UI components for AI key management
- `app/(dashboard)/settings/page.tsx` — Settings integration
- `components/projects/create-project-dialog.tsx` — Fill buttons
- `components/projects/project-notes.tsx` — Fill button for notes
- `app/(dashboard)/projects/[id]/page.tsx` — Fill buttons on detail page

## Future Directions

- Add more AI providers (Anthropic, Google)
- Usage tracking or cost monitoring per user
- Key validation on save (verify key works before storing)