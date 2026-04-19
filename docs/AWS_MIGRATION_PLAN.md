# AWS Migration Plan for Secret Management

This document describes a future migration path from the current `.env`-based encryption model to an AWS-backed key management model.

## Why Migrate

Today, the project uses a single application-managed `ENCRYPTION_KEY` stored in environment variables.

That works, but it has operational limitations:

- one global key protects all secrets
- key rotation is hard
- no key custody separation
- no centralized audit trail for key usage

The main goal of the migration is to move the **root of trust** out of application config and into AWS-managed infrastructure.

## Recommended Target Architecture

The recommended target is:

- Postgres/Supabase remains the system of record for secret metadata
- AWS KMS becomes the root key management service
- the app uses envelope encryption for secret values

This gives a good balance between:

- usability
- operational security
- queryability
- cost

## Why Not Use AWS Secrets Manager For Every Secret

AWS Secrets Manager is great for infrastructure and service secrets, but this app stores **user-generated, per-project vault records**.

Using Secrets Manager for every user secret would introduce:

- more cost per secret
- more operational complexity
- harder filtering by project/user inside the app

For this project, the best fit is usually:

- database rows for metadata and ciphertext
- AWS KMS for key management

## Target Encryption Model

Use **envelope encryption**.

### New flow

When creating a secret:

1. App requests a data key from AWS KMS
2. AWS KMS returns:
   - plaintext data key
   - encrypted data key
3. App encrypts the secret value locally using the plaintext data key
4. App stores:
   - ciphertext
   - encrypted data key
   - metadata
5. App discards plaintext data key from memory as soon as possible

When revealing a secret:

1. App loads ciphertext and encrypted data key from the database
2. App asks AWS KMS to decrypt the encrypted data key
3. App uses the decrypted data key to decrypt the ciphertext
4. App returns plaintext to the authenticated user

## Proposed Schema Changes

The current table stores only:

- `encrypted_value`

The AWS-backed version should add at least:

- `encrypted_data_key text not null`
- `key_version text null`
- `encryption_provider text not null default 'aws-kms'`

Optional future additions:

- `kms_key_id text`
- `last_revealed_at timestamptz`
- `last_rotated_at timestamptz`

## Proposed Secret Record Shape

Future `public.secrets` record:

- `id`
- `project_id`
- `user_id`
- `name`
- `encrypted_value`
- `encrypted_data_key`
- `key_version`
- `encryption_provider`
- `created_at`
- `updated_at`

## Migration Phases

## Phase 0 — Documentation and Design

Goal:
- document the current model
- align on target AWS architecture

Status:
- in progress / documented here

## Phase 1 — Add Schema Support

Goal:
- add the new columns needed for AWS-backed encryption

Tasks:
- create migration for `encrypted_data_key`
- create migration for `key_version`
- create migration for `encryption_provider`
- keep backward compatibility during transition

## Phase 2 — Introduce Encryption Abstraction

Goal:
- decouple API routes from one concrete encryption implementation

Tasks:
- create an encryption provider interface
- keep current local provider as one implementation
- add AWS KMS-based provider as another implementation

Suggested abstraction:

- `encryptSecret(plaintext)`
- `decryptSecret(record)`

This allows the app to support multiple providers during migration.

## Phase 3 — Implement AWS KMS Provider

Goal:
- support envelope encryption with AWS KMS

Tasks:
- integrate AWS SDK
- implement data key generation
- implement data key decryption
- ensure temporary plaintext keys are not persisted

## Phase 4 — Dual-Read / Dual-Write Transition

Goal:
- safely support old and new records at the same time

Options:

### Option A — New writes use AWS, old rows stay legacy until touched

Pros:
- simpler rollout

Cons:
- mixed data model for a while

### Option B — Backfill existing records into AWS-backed format

Pros:
- consistent long-term state

Cons:
- more migration complexity

Recommended approach:
- start with dual-read
- write all new secrets with AWS
- later run a controlled backfill job for old secrets

## Phase 5 — Key Rotation Strategy

Goal:
- support future key rotation without breaking existing secrets

Tasks:
- add `key_version`
- document re-encryption workflow
- define how legacy secrets are rewrapped

## Phase 6 — Audit and Operational Hardening

Goal:
- improve observability and security controls

Tasks:
- log secret reveal events
- log secret update/delete events
- log migration/backfill operations
- define IAM least-privilege permissions for KMS use

## Required AWS Components

Likely AWS resources:

- AWS KMS key
- IAM role/user for the app runtime
- AWS credentials configuration in the deployment environment

Potential environment variables:

```env
AWS_REGION=...
AWS_KMS_KEY_ID=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

Depending on deployment platform, short-lived IAM roles are preferred over static credentials.

## Security Improvements Expected From AWS

Moving to AWS KMS would improve:

- centralized key custody
- permission boundaries via IAM
- auditable key operations
- cleaner future key rotation strategy
- reduced dependence on a single raw app-managed master key in `.env`

## What AWS Does Not Solve Automatically

AWS KMS does not eliminate trust in the backend.

If the application server is allowed to request decryption, the server is still trusted.

This migration improves operational security, but it does **not** create end-to-end encryption.

## Open Questions

These decisions should be made before implementation:

1. Should old secrets be backfilled immediately or lazily?
2. Should we keep support for local `.env` encryption in development only?
3. Should reveal/copy actions be logged explicitly?
4. Should secret access require re-authentication for sensitive environments?
5. Should encryption be per-secret data key or per-project data key?

## Recommended Next Step

Before implementation, create a small technical design that covers:

- encryption provider abstraction
- schema migration details
- AWS IAM model
- rollout and rollback strategy

For the concrete migration sequence, compatibility rules, and rollback approach, see:

- [AWS Migration Execution Plan](./AWS_MIGRATION_EXECUTION_PLAN.md)

## Related Documentation

- [Secrets Architecture](./SECRETS_ARCHITECTURE.md)
- [Database Setup](./DATABASE_SETUP.md)
- [Auth Setup](./AUTH_SETUP.md)
