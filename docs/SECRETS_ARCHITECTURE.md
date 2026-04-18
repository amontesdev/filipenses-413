# Secrets Architecture

This document explains how secret storage currently works in this project, why it was designed this way, and what guarantees and tradeoffs it provides.

## Goal

The goal of the vault feature is to:

- store project secrets without saving plaintext in the database
- restrict access to the owner of each secret
- decrypt values only when an authenticated user explicitly requests them

This is **application-level encryption with server-side decryption**, not end-to-end encryption.

## Current Design

The project stores secret metadata and encrypted payloads in Supabase/Postgres.

### Main pieces

- `public.secrets` table — stores encrypted secret records
- Row Level Security (RLS) — ensures users can only access their own rows
- `lib/encryption.ts` — encrypts and decrypts secret values
- API routes — enforce authentication, authorization, encryption, and decryption
- UI components — request reveal only when the user explicitly asks for it

## Data Model

The current `public.secrets` table stores:

- `id`
- `project_id`
- `user_id`
- `name`
- `encrypted_value`
- `created_at`
- `updated_at`

Important: the database does **not** store plaintext secret values.

## Encryption Model

Encryption is implemented in:

- `lib/encryption.ts`

### Algorithm

The app uses:

- `aes-256-gcm`

### Environment variable

The encryption key comes from:

```env
ENCRYPTION_KEY=...
```

This value must decode to **32 bytes** when parsed from base64.

### What gets stored

The app generates:

- a random IV
- the ciphertext
- an authentication tag

Then it combines them into a single base64 string and stores that string in `encrypted_value`.

That means the database does **not** need separate columns for:

- IV
- auth tag

They are already embedded in `encrypted_value`.

## Request Flow

## 1. Create Secret

Files involved:

- `components/vault/create-secret-dialog.tsx`
- `app/api/secrets/route.ts`

Flow:

1. User submits `project_id`, `name`, and plaintext `value`
2. API route checks the authenticated user
3. API route verifies the selected project belongs to that user
4. API route encrypts the plaintext value with `encrypt(value)`
5. API route stores only the encrypted payload in `public.secrets`
6. API route writes an activity log entry

## 2. List Secrets

Files involved:

- `app/api/secrets/route.ts`
- `components/vault/secrets-list.tsx`

Flow:

1. User requests the secrets list
2. API returns only metadata
3. Plaintext values are not returned in the list response

This is intentional. Listing secrets should not expose the plaintext automatically.

## 3. Reveal Secret

Files involved:

- `app/api/secrets/[id]/route.ts`
- `components/vault/secrets-list.tsx`

Flow:

1. User clicks reveal
2. Client requests `GET /api/secrets/:id`
3. API verifies the authenticated user owns the secret
4. API fetches `encrypted_value`
5. API decrypts it on the server with `decrypt(...)`
6. API returns plaintext for that request only

## Security Layers

This design relies on multiple layers working together.

### 1. Authentication

Supabase Auth identifies the current user.

### 2. Authorization

The application checks ownership in API routes.

### 3. Row Level Security

RLS ensures users can only query rows tied to their own `user_id`.

### 4. Encryption at rest

Even if someone sees raw database rows, the secret value is stored as ciphertext, not plaintext.

## What This Protects Against

This design helps protect against:

- accidental exposure of plaintext secrets in the database
- raw database inspection without decryption capability
- cross-user access through normal application queries

## What This Does Not Protect Against

This is important.

This design does **not** provide zero-knowledge encryption.

The server can decrypt secrets because the server has access to `ENCRYPTION_KEY`.

That means this design does **not** fully protect against:

- compromise of the application server
- compromise of environment variables
- misuse by a fully authenticated and authorized owner of the secret

## Tradeoffs of the Current Design

### Strengths

- simple to understand
- simple to operate
- cheap to run
- no plaintext stored in the DB
- decryption stays on the server
- good fit for an app-level vault feature

### Weaknesses

- one global encryption key protects all secrets
- if `ENCRYPTION_KEY` leaks, every secret is at risk
- there is no key rotation mechanism today
- there is no key version field on secret records
- secret reveal returns plaintext to the client when explicitly requested

## Why This Design Exists Today

This project is currently optimized for:

- simplicity
- local development friendliness
- clear separation between metadata storage and plaintext handling

For an open-source project, this is a reasonable starting point because contributors can understand the system without needing AWS or another external KMS dependency.

## Future Direction

The planned future direction is to migrate the encryption root of trust from `.env` to AWS-managed key infrastructure.

See:

- [AWS Migration Plan](./AWS_MIGRATION_PLAN.md)

## Relevant Files

- `lib/encryption.ts`
- `app/api/secrets/route.ts`
- `app/api/secrets/[id]/route.ts`
- `components/vault/create-secret-dialog.tsx`
- `components/vault/secrets-list.tsx`
- `scripts/003_create_secrets.sql`
