# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project aims to follow Semantic Versioning.

## [Unreleased]

## [0.2.0] - 2026-04-26

### Added

- **BYOK AI Keys**: users can add their own OpenAI or DeepSeek API key to fill project fields with AI
- **AI Providers section** in Settings for managing API keys (add, view, delete)
- **"Fill with AI" buttons** on project name, description, and notes fields
- **Preferred provider selector** in Settings to choose between OpenAI and DeepSeek
- Encrypted storage of API keys using AES-256-GCM

### Changed

- Fixed pre-existing type error in secrets delete route
- Fixed Tiptap SSR hydration mismatch

### Notes

- New database migrations required: `scripts/007_create_user_ai_keys.sql` and `scripts/008_create_user_ai_preferences.sql`
- Run `npm install openai` after pulling
- OpenAI keys use `gpt-4o-mini` model; DeepSeek uses `deepseek-v4-flash`

## [0.1.2] - 2026-04-25

### Changed

- Refined sidebar and mobile navigation branding to use a single F413 wordmark
- Updated the F413 logo asset for better centering and cleaner presentation

## [0.1.1] - 2026-04-25

### Changed

- Updated the project branding with the F413 logo in the README and dashboard sidebar
- Replaced the default scaffold favicon with a project-specific icon
- Removed leftover scaffold branding assets and placeholder logo files

## [0.1.0] - 2026-04-25

### Added

- Public project documentation and setup guides
- Supabase database setup scripts
- GitHub OAuth authentication flow
- Project tracking workflow
- Encrypted secrets vault
- Activity history for project and secret events

### Notes

- First public open-source release target
- Project remains in active development