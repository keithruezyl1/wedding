# Huey & Cherry — Wedding Payments

A small, password-gated app for ~12 friends to track and pay shares of two wedding
expense pools and upload proof. Next.js + Supabase + Vercel.

The canonical specs live in [`PRD.md`](PRD.md) (what) and
[`DesignGuidelines.md`](DesignGuidelines.md) (how it looks & moves). Motion vocabulary
reference: [`animation-vocab.md`](animation-vocab.md).

## Local dev
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill values (Supabase URL + anon/publishable key; gate password).
3. `npm run dev` → http://localhost:3000

## Tests / checks
- `npm test` — logic unit tests (money math, name normalization)
- `npm run typecheck` — TypeScript
- `npm run build` — production build

## Security note
This is a private app shared by invitation (single gate password). Supabase RLS is
enabled with permissive policies so the anon client can read/write; the gate password
is the real access barrier. Do not store sensitive data here.

## Structure
- `app/page.tsx` — gate → name → onboarding → dashboard state machine
- `app/api/gate/route.ts` — server-side password check
- `lib/` — constants, money math, account + payment data access, supabase client
- `components/` — screens (Gate, NameEntry, Onboarding, Dashboard, ExpenseColumn) and modals
- `supabase/schema.sql` — reference copy of the database schema
