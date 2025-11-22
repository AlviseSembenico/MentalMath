## Overview

This repo is a Next.js 16 + React 19 starter configured with **NextAuth v5 (beta)** and **Google-only authentication**. Sessions are stateless JWTs, so no database is required until you're ready to add one.

## Setup

1. Install dependencies (pnpm is the default):

   ```bash
   pnpm install
   ```

2. Create a Google OAuth Client ID (Web application) and add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI.

3. Copy `env.example` to `.env.local` and fill in the credentials you just created:

   ```bash
   cp env.example .env.local
   # edit AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_SECRET
   ```

   Generate a strong `AUTH_SECRET` value (for example `openssl rand -base64 32`).

4. Start the dev server:

   ```bash
   pnpm dev
   ```

5. Visit [http://localhost:3000](http://localhost:3000) and sign in with a Google account.

## Product Surface

- Public homepage recreates the Zetamac-style sprint via `MathTrainer`, with custom timers, operator toggles, live stats, and run history.
- Authenticated experiences use Google-only SSO; the homepage never requires a session, but you can sign in from the header for future gated features.

## Auth Architecture

- `auth.ts` defines the canonical NextAuth configuration and exports the `handlers`, `auth`, `signIn`, and `signOut` helpers.
- `app/api/auth/[...nextauth]/route.ts` connects the NextAuth handlers to the App Router API layer.
- `app/page.tsx` is a server component that renders the public trainer, reads the session via `auth()`, and uses server actions for sign-in/out so credentials never touch the client.

Nothing else in the app stores user data; Google is the single source of truth for identity during beta.
