# filipenses-413

A personal developer project hub built with **Next.js** and **Supabase**.

It helps track projects, store encrypted secrets in a vault, and keep a lightweight activity feed for day-to-day development work.

## Features

- GitHub authentication with Supabase Auth
- Project tracking with status workflow
- Encrypted project secrets vault
- Activity history for project and secret events
- Rich text project notes

## Tech Stack

- [Next.js](https://nextjs.org)
- [React](https://react.dev)
- [Supabase](https://supabase.com)
- [Tailwind CSS](https://tailwindcss.com)
- [v0](https://v0.app)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a local `.env.local` file with the values required by the app:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
ENCRYPTION_KEY=...
```

### 3. Configure Supabase and GitHub OAuth

Follow the setup guides in [`docs/`](./docs):

#### Setup guides

- [Database Setup](./docs/DATABASE_SETUP.md)
- [Auth Setup](./docs/AUTH_SETUP.md)

#### Architecture guides

- [Secrets Architecture](./docs/SECRETS_ARCHITECTURE.md)
- [AWS Migration Plan](./docs/AWS_MIGRATION_PLAN.md)
- [AWS Migration Execution Plan](./docs/AWS_MIGRATION_EXECUTION_PLAN.md)

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Notes

- The app uses Supabase Row Level Security (RLS) for ownership boundaries.
- Secret values are encrypted before being stored in the database.
- The root request hook uses `proxy.ts` for session refresh and auth flow integration.

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below. Every merge to `main` will automatically deploy.

- [Continue working on v0](https://v0.app/chat/projects/prj_k2zXuLBYu59THPXWI2IwzO64eTuL)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [v0 Documentation](https://v0.app/docs)

<a href="https://v0.app/chat/api/kiro/clone/amontesdev/filipenses-414" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
