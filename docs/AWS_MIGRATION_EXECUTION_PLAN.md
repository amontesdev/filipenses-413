# AWS Migration Execution Plan

This document defines the execution strategy for migrating secret encryption from the current local `.env`-managed key model to an AWS KMS-backed model **without losing access to existing secrets**.

It is intentionally more operational and implementation-focused than [`AWS_MIGRATION_PLAN.md`](./AWS_MIGRATION_PLAN.md).

## Goal

Migrate secret encryption to AWS-backed key management while preserving read access to all existing secrets throughout the migration.

## Non-Goals

This plan does **not** aim to:

- introduce end-to-end encryption
- remove all trust from the backend
- migrate all historical secrets in a single cutover step
- delete legacy support immediately after AWS integration is added

## Critical Migration Rule

**Do not remove, rotate away, or lose the current `ENCRYPTION_KEY` until all legacy secrets have been migrated and verified.**

As long as any secret still depends on the legacy encryption model, `ENCRYPTION_KEY` remains a production dependency.

If the legacy key is lost before migration completes, legacy secrets may become permanently undecryptable.

## Current State

Today, each secret record stores:

- metadata in Postgres
- ciphertext in `encrypted_value`

The ciphertext is encrypted and decrypted by the application using:

- `lib/encryption.ts`
- `ENCRYPTION_KEY`

There is currently no per-record key metadata, no provider flag, and no key rotation mechanism.

## Target State

The target model uses:

- AWS KMS as the root key management service
- envelope encryption for secret values
- explicit provider/version metadata on each secret record

Under the target model, a secret record should be able to indicate whether it is:

- `legacy`
- `aws-kms`

## Compatibility Requirement

During migration, the application must support **dual-read** behavior.

That means:

- old secrets must still be readable with the legacy decryption path
- new secrets must be readable with the AWS-backed decryption path
- the app must not guess which format a secret uses

The decryption path must be selected explicitly from record metadata.

## Proposed Schema Additions

Add the following fields to `public.secrets`:

- `encrypted_data_key text null`
- `encryption_provider text null`
- `key_version text null`

Recommended semantics:

- `encryption_provider = 'legacy'` for old records
- `encryption_provider = 'aws-kms'` for migrated/new AWS-backed records

Optional future additions:

- `kms_key_id text null`
- `migrated_at timestamptz null`
- `last_revealed_at timestamptz null`

## Migration Phases

## Phase 1 — Schema Preparation

### Objective

Prepare the database to hold AWS-backed encryption metadata without breaking legacy reads.

### Tasks

- add nullable columns for AWS-backed encryption
- keep existing `encrypted_value` intact
- backfill `encryption_provider = 'legacy'` for existing rows, or allow `null` and treat it as legacy during transition

### Exit Criteria

- schema supports both legacy and AWS-backed records
- no existing secret is modified yet

## Phase 2 — Encryption Abstraction

### Objective

Remove direct coupling between API routes and a single encryption implementation.

### Tasks

- introduce an encryption provider abstraction
- support at least two implementations:
  - legacy local-key provider
  - AWS KMS provider

### Example responsibilities

- `encryptSecret(...)`
- `decryptSecret(...)`
- `getEncryptionProviderForWrite()`
- `getDecryptionProviderForRecord(record)`

### Exit Criteria

- application code no longer assumes one universal decryption path

## Phase 3 — Dual-Read Support

### Objective

Guarantee that both old and new secrets remain readable.

### Required behavior

When reading a secret:

1. inspect `encryption_provider`
2. if provider is `aws-kms`, use AWS-backed decryption
3. if provider is `legacy` or `null`, use legacy decryption

### Important rule

Do **not** infer format from partial field presence alone if explicit metadata exists.

### Exit Criteria

- legacy secrets can still be revealed
- AWS-backed secrets can also be revealed
- no existing secret loses readability

## Phase 4 — New Writes Use AWS

### Objective

Start writing all newly created secrets with AWS-backed encryption while preserving legacy read support.

### Tasks

- configure AWS KMS integration
- generate envelope-encrypted secret records for all new writes
- populate:
  - `encrypted_value`
  - `encrypted_data_key`
  - `encryption_provider = 'aws-kms'`
  - `key_version`

### Exit Criteria

- all newly created secrets use AWS-backed encryption
- legacy secrets remain readable

## Phase 5 — Backfill Existing Secrets

### Objective

Migrate legacy secrets incrementally without risking bulk data loss.

### Backfill Algorithm

For each legacy secret:

1. read the legacy record
2. decrypt it using the legacy provider and `ENCRYPTION_KEY`
3. re-encrypt it using the AWS-backed provider
4. update the row with AWS-backed fields
5. mark the row as migrated

### Requirements

- the process must be **idempotent**
- the process must be resumable
- failures must be logged and retryable
- the process should run in small batches, not as one giant operation

### Recommended behavior

- skip rows already marked as `aws-kms`
- keep metrics for:
  - total legacy secrets
  - migrated secrets
  - failed secrets
  - remaining legacy secrets

### Exit Criteria

- all targeted secrets are migrated
- failures are isolated and actionable

## Phase 6 — Verification

### Objective

Confirm that migrated secrets are readable and that legacy support is still available for any remaining non-migrated rows.

### Verification Checklist

- count total secrets before and after migration
- count legacy vs AWS-backed rows
- reveal a sample of migrated secrets successfully
- reveal a sample of non-migrated legacy secrets successfully
- confirm create-secret writes now produce AWS-backed rows
- confirm activity/audit behavior still works as expected

### Minimum safety check

Do not remove legacy support until:

- migrated secret counts match expectations
- sampled reads succeed
- operational monitoring shows no decrypt failures

## Phase 7 — Observation Window

### Objective

Allow time for real-world usage before removing legacy support.

### Recommended approach

- keep dual-read enabled for a defined period
- monitor decrypt failures
- monitor create/reveal/update flows
- keep `ENCRYPTION_KEY` available during this period

### Exit Criteria

- no unresolved decrypt failures
- no remaining legacy secrets, or a deliberate exception list exists

## Phase 8 — Legacy Retirement

### Objective

Remove legacy encryption support only after migration success is proven.

### Tasks

- confirm zero remaining legacy rows, or explicitly preserve support if needed
- remove legacy write path first
- remove legacy read path only after final confirmation
- retire `ENCRYPTION_KEY` only after all legacy secrets are migrated and verified

### Important rule

Legacy retirement is the **last** step, not an early optimization.

## Rollback Strategy

The migration must support rollback at the application level.

### Safe rollback assumptions

- schema additions are additive
- legacy decrypt path still exists during migration
- legacy key remains available

### Rollback options

#### Option A — Roll back new writes only

If AWS integration is unstable:

- stop writing new AWS-backed secrets
- revert application writes to legacy mode temporarily
- keep dual-read support enabled

#### Option B — Pause backfill

If backfill produces failures:

- pause the migration job
- leave already migrated rows intact
- continue serving both legacy and AWS-backed rows via dual-read

### What rollback should never require

- deleting migrated rows
- forcing all rows back into legacy format immediately
- dropping added schema columns during an incident

## Operational Risks

### Risk 1 — Losing `ENCRYPTION_KEY` too early

Impact:
- legacy secrets may become unreadable forever

Mitigation:
- keep the key until migration completion and verification

### Risk 2 — Removing legacy read logic too early

Impact:
- untouched old secrets become inaccessible

Mitigation:
- require verified zero-legacy state before removal

### Risk 3 — Bulk migration failures without observability

Impact:
- partial migration state with unclear recovery path

Mitigation:
- batch processing, metrics, and retryable failures

### Risk 4 — Ambiguous provider detection

Impact:
- wrong decrypt path selected

Mitigation:
- explicit `encryption_provider` metadata

## Recommended Implementation Order

1. add schema columns
2. add encryption abstraction
3. implement dual-read logic
4. implement AWS-backed writes
5. deploy without backfill first
6. verify new writes + old reads
7. run controlled backfill
8. verify migrated state
9. keep observation window
10. retire legacy only at the end

## Definition of Done

The migration is only complete when:

- all secrets are readable
- all new writes use AWS-backed encryption
- all intended legacy secrets are migrated
- verification checks pass
- the observation window completes without unresolved decrypt failures
- legacy support is retired deliberately, not accidentally

## Related Documents

- [Secrets Architecture](./SECRETS_ARCHITECTURE.md)
- [AWS Migration Plan](./AWS_MIGRATION_PLAN.md)
- [Database Setup](./DATABASE_SETUP.md)
