# Contributing to Filipenses-413

Thanks for taking the time to contribute.

This project is a self-hosted project manager built with Next.js and Supabase. It is still in active development, so small, focused contributions are the easiest to review and merge.

## Before You Start

- Read the [README](./README.md) for local setup instructions.
- Check existing issues and pull requests before starting new work.
- Open an issue first for large features, breaking changes, or architectural changes.

## Development Setup

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file from the example:

```bash
cp .env.example .env.local
```

3. Fill in the required Supabase and encryption values in `.env.local`.

4. Follow the setup guides in [`docs/`](./docs) to configure the database and authentication flow.

5. Start the development server:

```bash
npm run dev
```

## Contribution Guidelines

- Keep pull requests focused on one change.
- Prefer small PRs over large multi-feature submissions.
- Update documentation when behavior or setup changes.
- Avoid unrelated refactors in the same PR.
- If your change affects setup, API behavior, or environment variables, mention it clearly in the PR description.

## Code Style

- Follow the existing project structure and conventions.
- Keep changes readable and practical.
- Run lint before opening a PR:

```bash
npm run lint
```

## Pull Request Process

1. Fork the repository and create a branch from `main`.
2. Make your changes.
3. Run `npm run lint`.
4. Open a pull request with:
   - a clear summary
   - screenshots for UI changes when helpful
   - notes about setup or migration changes

## Branch Naming

Use short, descriptive branch names when possible:

- `fix/...` for bug fixes
- `feat/...` for new features
- `docs/...` for documentation changes
- `chore/...` for maintenance work

## Review and Merge Policy

- Pull requests should stay focused on a single topic.
- Large features should be discussed in an issue before implementation.
- The preferred merge strategy is **Squash and merge** to keep history clean.
- Maintainers may ask for changes before merge if the PR is too broad, unclear, or missing setup details.

## What Contributions Are Best Right Now

- bug fixes
- documentation improvements
- setup and onboarding improvements
- focused UI or UX improvements
- small features discussed in advance

## Questions

If you are unsure whether a change is a good fit, open an issue first so we can align before you spend time building it.
