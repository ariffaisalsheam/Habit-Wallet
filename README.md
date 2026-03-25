# HabitWallet Web

HabitWallet is a mobile-first PWA for personal finance and habit tracking, tailored for Bangladeshi users.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Appwrite (Auth + Database)
- Zustand local-first state with backend sync

## Local Development

Run from the `web` folder:

```bash
pnpm install
pnpm dev
```

App will run at `http://localhost:3000`.

## Environment Setup

Copy `.env.example` to `.env.local` and fill required Appwrite values.

```bash
cp .env.example .env.local
```

For full Appwrite collection schema and setup steps, see:

- `APPWRITE_SETUP.md`

## Implemented Backend Flows

- Auth session with local guard cookies for route gating
- Protected routes: `/profile`, `/subscription`, `/admin`
- Profile load/create/update via Appwrite collection
- Subscription request and admin review via Appwrite
- Admin approval/rejection audit logging
- Habits + completions backend sync
- Finance transactions + budgets backend sync

## Notes

- Admin access is label-based (`admin` label on Appwrite user)
- Stores remain local-first and fall back to local persistence if backend sync fails
