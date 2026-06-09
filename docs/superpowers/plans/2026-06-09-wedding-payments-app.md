# Huey & Cherry Wedding Payments App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **PRIMARY SOURCE OF TRUTH:** `PRD.md` (what to build) and `DesignGuidelines.md`
> (how it looks & moves, including the motion system keyed to `animation-vocab.md`).
> This plan implements them. If anything here conflicts with those docs, the docs win.
> Every animation choice must match `DesignGuidelines.md` §6 Motion System.

**Goal:** Build an elegant, password-gated web app where ~12 friends track and pay their share of two wedding expense pools (fare ₱18,000, fee ₱10,560), upload photographic proof, and see who has paid — fronted by a short cinematic onboarding.

**Architecture:** Next.js App Router app. The shared gate password is validated in a server route handler (never shipped to the client). The display name is the account key, stored in Supabase `accounts`; payments + proof images live in `payments` + a public `proofs` Storage bucket. Client state (logged-in account, onboarding-seen flag) persists in `localStorage`. Deployed to Vercel from `github.com/keithruezyl1/wedding`.

**Tech Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres + Storage) · **motion** (Framer Motion, `motion/react`) for choreographed animation · canvas-confetti · Vitest (logic tests) · Vercel.

**Animation convention:** Use `motion/react` for anything *choreographed* — onboarding step transitions (`AnimatePresence`), modal enter/exit, progress-bar fill. Use plain CSS (the keyframes in `globals.css`) only for trivial one-shots (gate error shake). Always gate motion through `useReducedMotion()` so `prefers-reduced-motion` users get instant, non-animated states. `motion@12.40.0` is already installed in `package.json`.

**Environment facts (already verified):**
- Node v20.16.0, npm 10.8.2, git 2.46
- Supabase project: name `wedding`, ref `tipaqkyxdbvxzpzpkrry`, region ap-southeast-2 (ACTIVE)
- Vercel team: `keithruezyl1's projects` (`team_pjiwqeVHaIBsPImCSyXufZHd`)
- GitHub repo: `github.com/keithruezyl1/wedding`
- Assets present: `assets/img/*.jpg`, `assets/Ghost Laughing - Sound Effect.mp3`

**Testing approach (pragmatic TDD):** Pure logic (share math, password normalization, account-key normalization, payment aggregation) is covered by Vitest unit tests written test-first. UI/animation components are verified by `npm run build` + `npm run typecheck` passing and manual browser checks (documented per task) — we do not unit-test visual rendering for this fun project. Commit after every task.

**Money/format note:** All pesos use the `₱` glyph and `toLocaleString('en-PH')` grouping. Shares: fare ₱1,500/person, fee ₱880/person, 12 people.

---

## File Structure

```
wedding/
├── app/
│   ├── layout.tsx              # root layout, fonts, <body>
│   ├── globals.css             # Tailwind + theme tokens + keyframes
│   ├── page.tsx                # client orchestrator: gate→name→onboarding→dashboard
│   └── api/gate/route.ts       # POST password check (server-only)
├── components/
│   ├── Gate.tsx                # password screen
│   ├── NameEntry.tsx           # name input → create/load account
│   ├── Onboarding.tsx          # 3-step cinematic sequence
│   ├── Dashboard.tsx           # two columns + replay link
│   ├── ExpenseColumn.tsx       # one pool: bar + CTA + payer list
│   ├── ProgressBar.tsx         # animated fill
│   ├── PaymentModal.tsx        # upload proof + confirm checkbox
│   ├── SuccessModal.tsx        # themed thank-you
│   ├── ProofModal.tsx          # view a payer's name + image
│   └── Modal.tsx               # shared modal shell (overlay, focus, esc)
├── lib/
│   ├── supabaseClient.ts       # browser Supabase client
│   ├── constants.ts            # POOLS, shares, people count, password
│   ├── money.ts                # peso formatting + progress math (pure)
│   ├── account.ts              # normalizeName, createOrLoadAccount
│   └── payments.ts             # fetch payments, upload proof, payer lists
├── lib/__tests__/
│   ├── money.test.ts
│   └── account.test.ts
├── public/
│   ├── img/                    # copied from assets/img
│   └── ghost-laugh.mp3         # copied from assets
├── .env.local                  # NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, GATE_PASSWORD
├── .env.example
├── supabase/schema.sql         # reference copy of the migration
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Phase 0 — Scaffold, Git, Tooling

### Task 0.1: Scaffold Next.js app in place

**Files:** creates the whole Next.js skeleton in `d:\Projects\wedding`.

> Note: the repo already has a minimal `package.json` (with `motion@12.40.0`), `package-lock.json`, and `node_modules/` from a prior `npm install motion`. The scaffold below overwrites `package.json`; `motion` is re-added explicitly in Task 0.2 Step 1. Delete the stale lockfile/node_modules first so create-next-app starts clean.

- [ ] **Step 1: Remove the pre-existing minimal package files, then scaffold into a temp dir, then move (create-next-app needs an empty-ish dir)**

```bash
cd /d/Projects/wedding
rm -rf node_modules package-lock.json package.json
```

The repo still contains `assets/` and `docs/`. Scaffold into a subfolder then merge up:

```bash
cd /d/Projects/wedding
npx --yes create-next-app@14 _scaffold --ts --tailwind --eslint --app --src-dir=false --import-alias "@/*" --no-turbopack
```
Accept defaults if prompted. Expected: `_scaffold/` created with `app/`, `package.json`, `tailwind.config.ts`, etc.

- [ ] **Step 2: Move scaffold files up into repo root and remove temp dir**

```bash
cd /d/Projects/wedding/_scaffold
# move everything including dotfiles
shopt -s dotglob 2>/dev/null || true
mv -f app components lib public next.config.* package.json package-lock.json tsconfig.json tailwind.config.* postcss.config.* .eslintrc* .gitignore next-env.d.ts ../ 2>/dev/null || true
cd /d/Projects/wedding
mv -f _scaffold/* _scaffold/.* ./ 2>/dev/null || true
rm -rf _scaffold
ls
```
Expected: `app/`, `package.json`, `tailwind.config.ts`, `tsconfig.json`, plus existing `assets/`, `docs/`.

> Note for executor: on Windows/PowerShell the globbing above may misbehave. Equivalent PowerShell: `Get-ChildItem -Force _scaffold | Move-Item -Destination . -Force; Remove-Item _scaffold -Recurse -Force`. Use whichever shell works; the end state is "scaffold contents at repo root, no `_scaffold/`".

- [ ] **Step 3: Verify dev deps install and app builds**

```bash
cd /d/Projects/wedding && npm install && npm run build
```
Expected: build succeeds (default Next.js starter).

- [ ] **Step 4: Initialize git, point at the GitHub remote, first commit**

```bash
cd /d/Projects/wedding
git init -b main
git remote add origin https://github.com/keithruezyl1/wedding.git
git add -A
git commit -m "chore: scaffold Next.js app + add design/plan docs and assets"
```
Expected: commit created. (Push happens in Phase 8 after env is configured; if remote already has commits, the executor will `git pull --rebase origin main` before pushing.)

### Task 0.2: Add project dependencies and test tooling

**Files:** Modify `package.json`.

- [ ] **Step 1: Install runtime + dev dependencies**

```bash
cd /d/Projects/wedding
npm install @supabase/supabase-js canvas-confetti motion
npm install -D vitest @types/canvas-confetti
```
Expected: packages added to `package.json` (re-adds `motion@^12.40.0`).

- [ ] **Step 2: Add scripts to `package.json`**

Ensure the `"scripts"` block contains:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run"
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { environment: 'node', include: ['lib/__tests__/**/*.test.ts'] },
})
```

- [ ] **Step 4: Verify tooling runs**

```bash
npm run typecheck && npx vitest run --reporter=basic
```
Expected: typecheck passes; vitest reports "No test files found" (no tests yet) — that's fine.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: add supabase, confetti, and vitest tooling"
```

### Task 0.3: Copy media assets into `public/`

**Files:** Create `public/img/*`, `public/ghost-laugh.mp3`.

- [ ] **Step 1: Copy images and audio into public/**

```bash
cd /d/Projects/wedding
mkdir -p public/img
cp assets/img/*.jpg public/img/
cp "assets/Ghost Laughing - Sound Effect.mp3" public/ghost-laugh.mp3
ls public/img && ls public/ghost-laugh.mp3
```
Expected: 6 jpgs in `public/img/`, `public/ghost-laugh.mp3` present.

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "chore: add wedding photos and ghost-laugh audio to public/"
```

---

## Phase 1 — Supabase Schema & Storage

> Executor: apply via the Supabase MCP `apply_migration` tool against project ref `tipaqkyxdbvxzpzpkrry`. Also save the SQL to `supabase/schema.sql` as a committed reference.

### Task 1.1: Create tables + constraints

**Files:** Create `supabase/schema.sql`.

- [ ] **Step 1: Write the schema SQL to `supabase/schema.sql`**

```sql
-- accounts: one row per friend; `name` is the lowercased account key
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_name text not null,
  created_at timestamptz not null default now()
);

-- payments: one row per (account, kind); proof_url points at Storage
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  kind text not null check (kind in ('fare','fee')),
  proof_url text not null,
  created_at timestamptz not null default now(),
  unique (account_id, kind)
);
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use MCP tool `apply_migration` with `project_id: "tipaqkyxdbvxzpzpkrry"`, `name: "init_accounts_payments"`, and the SQL above.
Expected: success. Then call `list_tables` and confirm `accounts` and `payments` exist.

- [ ] **Step 3: Commit**

```bash
git add supabase/schema.sql && git commit -m "feat(db): accounts and payments tables"
```

### Task 1.2: RLS policies (anon client needs read + insert/update)

**Files:** Append to `supabase/schema.sql`.

> The app uses the public anon key from the browser with no per-user auth. We enable RLS but add permissive policies so the anon role can read all rows and insert/update (this is a private app shared among friends; the gate password is the real barrier). Document this tradeoff in README.

- [ ] **Step 1: Append RLS SQL to `supabase/schema.sql`**

```sql
alter table public.accounts enable row level security;
alter table public.payments enable row level security;

create policy "accounts_read"   on public.accounts for select using (true);
create policy "accounts_insert" on public.accounts for insert with check (true);

create policy "payments_read"   on public.payments for select using (true);
create policy "payments_insert" on public.payments for insert with check (true);
create policy "payments_update" on public.payments for update using (true) with check (true);
```

- [ ] **Step 2: Apply via MCP `apply_migration`**

`name: "rls_permissive_policies"`, SQL above. Expected: success.

- [ ] **Step 3: Commit**

```bash
git add supabase/schema.sql && git commit -m "feat(db): permissive RLS policies for anon client"
```

### Task 1.3: Create public `proofs` Storage bucket + policies

**Files:** none local (Storage config). Document in `supabase/schema.sql` as a comment.

- [ ] **Step 1: Create the bucket via SQL (MCP `execute_sql`)**

```sql
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', true)
on conflict (id) do nothing;

create policy "proofs_read"   on storage.objects for select using (bucket_id = 'proofs');
create policy "proofs_insert" on storage.objects for insert with check (bucket_id = 'proofs');
create policy "proofs_update" on storage.objects for update using (bucket_id = 'proofs') with check (bucket_id = 'proofs');
```

Run via MCP `execute_sql` on project `tipaqkyxdbvxzpzpkrry`. Expected: success. (If a policy already exists, drop-and-recreate or ignore the duplicate error.)

- [ ] **Step 2: Append the same SQL as a comment block to `supabase/schema.sql`, commit**

```bash
git add supabase/schema.sql && git commit -m "feat(storage): public proofs bucket + policies"
```

### Task 1.4: Wire environment variables

**Files:** Create `.env.local`, `.env.example`.

- [ ] **Step 1: Fetch project URL + anon key via MCP**

Call MCP `get_project_url` and `get_publishable_keys` (a.k.a. anon key) for `tipaqkyxdbvxzpzpkrry`. Record the values.

- [ ] **Step 2: Write `.env.local`** (real values; NOT committed — it's gitignored)

```
NEXT_PUBLIC_SUPABASE_URL=<project url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon/publishable key>
GATE_PASSWORD=HueyAndCherryWeddingWHAAAT
```

- [ ] **Step 3: Write `.env.example`** (committed, no secrets)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GATE_PASSWORD=HueyAndCherryWeddingWHAAAT
```

- [ ] **Step 4: Confirm `.env.local` is gitignored, commit example**

```bash
grep -q ".env*.local" .gitignore && echo ok
git add .env.example && git commit -m "chore: env example"
```
Expected: prints `ok` (Next.js default gitignore covers `.env*.local`).

---

## Phase 2 — Core Library (pure logic, test-first)

### Task 2.1: Constants

**Files:** Create `lib/constants.ts`.

- [ ] **Step 1: Write `lib/constants.ts`**

```ts
export const PEOPLE_COUNT = 12

export type PoolKind = 'fare' | 'fee'

export interface Pool {
  kind: PoolKind
  title: string
  total: number      // peso total
  share: number      // peso per person
  cta: string
}

export const POOLS: Record<PoolKind, Pool> = {
  fare: {
    kind: 'fare',
    title: 'The Boat to Neverland Fare',
    total: 18000,
    share: 18000 / PEOPLE_COUNT, // 1500
    cta: 'Pay the Fare',
  },
  fee: {
    kind: 'fee',
    title: 'This House is a Home Fee',
    total: 10560,
    share: 10560 / PEOPLE_COUNT, // 880
    cta: 'Pay the Fee',
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/constants.ts && git commit -m "feat(lib): pools and shares constants"
```

### Task 2.2: Money + progress math (TDD)

**Files:** Create `lib/money.ts`, `lib/__tests__/money.test.ts`.

- [ ] **Step 1: Write failing tests `lib/__tests__/money.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { peso, poolProgress } from '@/lib/money'
import { POOLS } from '@/lib/constants'

describe('peso', () => {
  it('formats with peso sign and grouping', () => {
    expect(peso(18000)).toBe('₱18,000')
    expect(peso(1500)).toBe('₱1,500')
    expect(peso(880)).toBe('₱880')
  })
})

describe('poolProgress', () => {
  it('computes paid amount, fraction, and label from payer count', () => {
    const p = poolProgress(POOLS.fare, 5)
    expect(p.paidAmount).toBe(7500)
    expect(p.fraction).toBeCloseTo(5 / 12)
    expect(p.label).toBe('₱7,500 / ₱18,000 · 5 of 12 paid')
  })
  it('is full at 12 payers', () => {
    expect(poolProgress(POOLS.fee, 12).fraction).toBe(1)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run lib/__tests__/money.test.ts
```
Expected: FAIL (module `@/lib/money` not found).

- [ ] **Step 3: Implement `lib/money.ts`**

```ts
import { PEOPLE_COUNT, Pool } from '@/lib/constants'

export function peso(amount: number): string {
  return '₱' + Math.round(amount).toLocaleString('en-PH')
}

export interface Progress {
  paidCount: number
  paidAmount: number
  fraction: number
  label: string
}

export function poolProgress(pool: Pool, paidCount: number): Progress {
  const clamped = Math.max(0, Math.min(PEOPLE_COUNT, paidCount))
  const paidAmount = clamped * pool.share
  const fraction = clamped / PEOPLE_COUNT
  const label = `${peso(paidAmount)} / ${peso(pool.total)} · ${clamped} of ${PEOPLE_COUNT} paid`
  return { paidCount: clamped, paidAmount, fraction, label }
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
npx vitest run lib/__tests__/money.test.ts
```
Expected: PASS (5 assertions).

- [ ] **Step 5: Commit**

```bash
git add lib/money.ts lib/__tests__/money.test.ts && git commit -m "feat(lib): peso formatting and pool progress math"
```

### Task 2.3: Name normalization (TDD)

**Files:** Create `lib/account.ts` (normalize only for now), `lib/__tests__/account.test.ts`.

- [ ] **Step 1: Write failing test `lib/__tests__/account.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { normalizeName } from '@/lib/account'

describe('normalizeName', () => {
  it('trims and lowercases', () => {
    expect(normalizeName('  Keith  ')).toBe('keith')
  })
  it('collapses internal whitespace', () => {
    expect(normalizeName('Mary   Jane')).toBe('mary jane')
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run lib/__tests__/account.test.ts
```
Expected: FAIL (no `normalizeName`).

- [ ] **Step 3: Create `lib/account.ts` with `normalizeName` (rest of file added in Task 3.x)**

```ts
export function normalizeName(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ')
}
```

- [ ] **Step 4: Run to confirm pass**

```bash
npx vitest run lib/__tests__/account.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/account.ts lib/__tests__/account.test.ts && git commit -m "feat(lib): name normalization"
```

### Task 2.4: Supabase browser client

**Files:** Create `lib/supabaseClient.ts`.

- [ ] **Step 1: Write `lib/supabaseClient.ts`**

```ts
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, anon, {
  auth: { persistSession: false },
})
```

- [ ] **Step 2: Typecheck + commit**

```bash
npm run typecheck && git add lib/supabaseClient.ts && git commit -m "feat(lib): supabase browser client"
```
Expected: typecheck passes.

---

## Phase 3 — Gate (server-validated password)

### Task 3.1: Gate API route

**Files:** Create `app/api/gate/route.ts`.

- [ ] **Step 1: Write the route handler**

```ts
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: '' }))
  const ok = typeof password === 'string' && password === process.env.GATE_PASSWORD
  return NextResponse.json({ ok }, { status: ok ? 200 : 401 })
}
```

- [ ] **Step 2: Manual verify (after `npm run dev` in Phase 6 wiring, or now)**

```bash
npm run dev
# in another shell:
curl -s -X POST localhost:3000/api/gate -H "content-type: application/json" -d '{"password":"wrong"}'
curl -s -X POST localhost:3000/api/gate -H "content-type: application/json" -d '{"password":"HueyAndCherryWeddingWHAAAT"}'
```
Expected: first returns `{"ok":false}` (401), second `{"ok":true}` (200).

- [ ] **Step 3: Commit**

```bash
git add app/api/gate/route.ts && git commit -m "feat(api): server-side gate password check"
```

### Task 3.2: Account create/load helpers

**Files:** Modify `lib/account.ts` (append), uses `lib/supabaseClient.ts`.

- [ ] **Step 1: Append account helpers to `lib/account.ts`**

```ts
import { supabase } from '@/lib/supabaseClient'

export interface Account {
  id: string
  name: string
  display_name: string
}

// Creates the account if the normalized name is new; otherwise returns the existing one.
export async function createOrLoadAccount(rawName: string): Promise<Account> {
  const name = normalizeName(rawName)
  if (!name) throw new Error('Please enter a name.')

  const { data: existing, error: selErr } = await supabase
    .from('accounts')
    .select('id, name, display_name')
    .eq('name', name)
    .maybeSingle()
  if (selErr) throw selErr
  if (existing) return existing as Account

  const { data: created, error: insErr } = await supabase
    .from('accounts')
    .insert({ name, display_name: rawName.trim() })
    .select('id, name, display_name')
    .single()
  if (insErr) {
    // race: another insert won; re-fetch
    const { data: again } = await supabase
      .from('accounts').select('id, name, display_name').eq('name', name).single()
    if (again) return again as Account
    throw insErr
  }
  return created as Account
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npm run typecheck && git add lib/account.ts && git commit -m "feat(lib): create or load account by name"
```
Expected: typecheck passes.

---

## Phase 4 — Payments data layer

### Task 4.1: Payments fetch + upload helpers

**Files:** Create `lib/payments.ts`.

- [ ] **Step 1: Write `lib/payments.ts`**

```ts
import { supabase } from '@/lib/supabaseClient'
import { PoolKind } from '@/lib/constants'

export interface Payer {
  account_id: string
  display_name: string
  proof_url: string
}

// All payments for a kind, joined to the payer's display name.
export async function fetchPayers(kind: PoolKind): Promise<Payer[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('account_id, proof_url, accounts(display_name)')
    .eq('kind', kind)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((r: any) => ({
    account_id: r.account_id,
    proof_url: r.proof_url,
    display_name: r.accounts?.display_name ?? 'Someone',
  }))
}

// Upload proof image to Storage and upsert the payment row. Returns public URL.
export async function submitPayment(
  accountId: string,
  kind: PoolKind,
  file: File,
): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${accountId}/${kind}.${ext}`

  const up = await supabase.storage
    .from('proofs')
    .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' })
  if (up.error) throw up.error

  const { data: pub } = supabase.storage.from('proofs').getPublicUrl(path)
  const proof_url = pub.publicUrl

  const { error } = await supabase
    .from('payments')
    .upsert({ account_id: accountId, kind, proof_url }, { onConflict: 'account_id,kind' })
  if (error) throw error

  return proof_url
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npm run typecheck && git add lib/payments.ts && git commit -m "feat(lib): fetch payers and submit payment with proof upload"
```
Expected: typecheck passes.

---

## Phase 5 — Theme foundation (fonts, tokens, globals)

### Task 5.1: Tailwind theme + global CSS

**Files:** Modify `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`.

- [ ] **Step 1: Replace `tailwind.config.ts` theme with sunset palette + serif font var**

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FBF6EE',
        cream: '#F3E9DA',
        sand: '#E7D3B8',
        amber: '#E8A14B',
        coral: '#E07A5F',
        dusk: '#7A5C73',
        charcoal: '#2B2A28',
        ruin: '#C2362F', // step-3 red
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      transitionTimingFunction: { calm: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 2: Replace `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { color-scheme: light; }

body {
  background: linear-gradient(180deg, #FBF6EE 0%, #F3E9DA 100%);
  color: #2B2A28;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes shake {
  0%,100% { transform: translateX(0); }
  20%,60% { transform: translateX(-7px); }
  40%,80% { transform: translateX(7px); }
}

.animate-fade-up { animation: fadeUp 700ms cubic-bezier(0.22,1,0.36,1) both; }
.animate-fade-in { animation: fadeIn 600ms ease both; }
.animate-shake { animation: shake 380ms ease; }

@media (prefers-reduced-motion: reduce) {
  .animate-fade-up, .animate-fade-in, .animate-shake { animation: none !important; }
  * { scroll-behavior: auto !important; }
}
```

- [ ] **Step 3: Set up fonts + metadata in `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'

const serif = Cormorant_Garamond({
  subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-serif',
})
const sans = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Huey & Cherry · Ormoc 2026',
  description: 'A small gathering of contributions.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="font-sans antialiased min-h-screen">{children}</body>
    </html>
  )
}
```

- [ ] **Step 4: Build + commit**

```bash
npm run build && git add tailwind.config.ts app/globals.css app/layout.tsx && git commit -m "feat(theme): sunset palette, fonts, motion keyframes"
```
Expected: build passes.

### Task 5.2: Shared Modal shell

**Files:** Create `components/Modal.tsx`.

- [ ] **Step 1: Write `components/Modal.tsx` (motion enter/exit)**

```tsx
'use client'
import { useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

export default function Modal({
  open, onClose, children, labelledBy,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  labelledBy?: string
}) {
  const reduce = useReducedMotion()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm"
          onClick={onClose} role="dialog" aria-modal="true" aria-labelledby={labelledBy}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl bg-ivory shadow-2xl ring-1 ring-sand/60 p-7"
            onClick={(e) => e.stopPropagation()}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Build + commit**

```bash
npm run build && git add components/Modal.tsx && git commit -m "feat(ui): shared modal shell"
```
Expected: build passes.

---

## Phase 6 — Screens

### Task 6.1: Gate component

**Files:** Create `components/Gate.tsx`.

- [ ] **Step 1: Write `components/Gate.tsx`**

```tsx
'use client'
import { useState } from 'react'
import Image from 'next/image'

export default function Gate({ onPass }: { onPass: () => void }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setErr(false)
    const res = await fetch('/api/gate', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    setBusy(false)
    if (res.ok) onPass()
    else { setErr(true); setPw('') }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <Image src="/img/last.jpg" alt="" fill priority className="object-cover" />
      <div className="absolute inset-0 bg-charcoal/55" />
      <form onSubmit={submit} className={`relative z-10 text-center px-6 ${err ? 'animate-shake' : ''}`}>
        <p className="font-serif text-ivory/80 tracking-[0.3em] uppercase text-sm mb-3">Ormoc · 2026</p>
        <h1 className="font-serif text-ivory text-5xl sm:text-6xl mb-8">Huey &amp; Cherry</h1>
        <input
          type="password" value={pw} onChange={(e) => setPw(e.target.value)}
          placeholder="Enter the password" autoFocus
          className="w-72 max-w-full text-center rounded-full bg-ivory/95 px-5 py-3 outline-none ring-2 ring-transparent focus:ring-amber"
        />
        <div className="h-6 mt-3 text-coral/90 text-sm">{err ? "That's not quite it." : ''}</div>
        <button disabled={busy}
          className="mt-2 rounded-full bg-amber px-8 py-3 font-medium text-charcoal hover:bg-coral transition-colors duration-300 disabled:opacity-60">
          {busy ? 'Checking…' : 'Enter'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Build + commit**

```bash
npm run build && git add components/Gate.tsx && git commit -m "feat(ui): password gate screen"
```
Expected: build passes.

### Task 6.2: Name entry component

**Files:** Create `components/NameEntry.tsx`.

- [ ] **Step 1: Write `components/NameEntry.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { createOrLoadAccount, Account } from '@/lib/account'

export default function NameEntry({ onAccount }: { onAccount: (a: Account, isNew: boolean) => void }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true); setErr('')
    try {
      const before = await createOrLoadAccount(name)
      // isNew heuristic: created_at within last few seconds is overkill; instead treat
      // first-time-on-this-device as "new" via localStorage flag in the orchestrator.
      onAccount(before, true)
    } catch (e: any) {
      setErr(e.message ?? 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 animate-fade-in">
      <form onSubmit={submit} className="text-center w-full max-w-sm">
        <h2 className="font-serif text-4xl text-charcoal mb-2">What shall we call you?</h2>
        <p className="text-charcoal/60 mb-8">So we know who is joining the celebration.</p>
        <input
          value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Your name"
          className="w-full text-center rounded-full bg-white px-5 py-3 ring-1 ring-sand focus:ring-2 focus:ring-amber outline-none"
        />
        <div className="h-6 mt-3 text-coral text-sm">{err}</div>
        <button disabled={busy}
          className="mt-2 rounded-full bg-amber px-8 py-3 font-medium text-charcoal hover:bg-coral transition-colors duration-300 disabled:opacity-60">
          {busy ? 'Just a moment…' : 'Continue'}
        </button>
      </form>
    </div>
  )
}
```

> Note: the `isNew` decision lives in the orchestrator (Task 6.7) via a per-device localStorage `onboarded` flag, not here. `NameEntry` always calls `onAccount(account, true)`; the orchestrator decides whether to actually show onboarding.

- [ ] **Step 2: Build + commit**

```bash
npm run build && git add components/NameEntry.tsx && git commit -m "feat(ui): name entry that creates/loads account"
```
Expected: build passes.

### Task 6.3: Onboarding sequence

**Files:** Create `components/Onboarding.tsx`.

- [ ] **Step 1: Write `components/Onboarding.tsx` (motion-choreographed)**

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import confetti from 'canvas-confetti'

type Step = 1 | 2 | 3
const EASE = [0.22, 1, 0.36, 1] as const

export default function Onboarding({ name, onDone }: { name: string; onDone: () => void }) {
  const [step, setStep] = useState<Step>(1)
  const [sub, setSub] = useState(0) // sub-line within step 1
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const reduce = useReducedMotion()

  // Step 1: "Hello, {name}" then "You have been cordially invited to…"
  useEffect(() => {
    if (step !== 1) return
    const t1 = setTimeout(() => setSub(1), 2600)
    const t2 = setTimeout(() => setStep(2), 5600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [step])

  // Step 2: confetti + reveal, then advance
  useEffect(() => {
    if (step !== 2) return
    const fire = () => confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 },
      colors: ['#E8A14B', '#E07A5F', '#FBF6EE', '#E7D3B8'] })
    fire(); const burst = setTimeout(fire, 700)
    const t = setTimeout(() => setStep(3), 5200)
    return () => { clearTimeout(burst); clearTimeout(t) }
  }, [step])

  // Step 3: play ghost laugh (the gate/name clicks satisfy the autoplay gesture;
  // the Continue button also calls play() as a guaranteed fallback)
  useEffect(() => {
    if (step !== 3) return
    audioRef.current?.play().catch(() => {})
  }, [step])

  // Fade up + out, slow and calm. Reduced-motion → pure opacity, no movement.
  const fade = {
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    exit: reduce ? { opacity: 0 } : { opacity: 0, y: -14 },
    transition: { duration: 0.9, ease: EASE },
  }

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center text-center px-6"
      animate={{ backgroundColor: step === 3 ? '#000000' : '#F6EFE3' }}
      transition={{ duration: 1.0, ease: EASE }}
    >
      <audio ref={audioRef} src="/ghost-laugh.mp3" preload="auto" />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key={`s1-${sub}`} {...fade}>
            {sub === 0
              ? <h1 className="font-serif text-5xl sm:text-6xl text-charcoal">Hello, {name}</h1>
              : <h1 className="font-serif text-4xl sm:text-5xl text-charcoal/90">You have been cordially invited to…</h1>}
          </motion.div>
        )}

        {step === 2 && (
          <motion.h1 key="s2" {...fade}
            className="font-serif text-4xl sm:text-6xl leading-tight text-charcoal">
            The Huey &amp; Cherry Wedding
            <span className="block mt-3 text-2xl sm:text-3xl text-coral tracking-wide">Ormoc City · 2026</span>
          </motion.h1>
        )}

        {step === 3 && (
          <motion.div key="s3"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 1.1, ease: EASE, delay: 0.3 }}>
            <h1 className="font-serif text-4xl sm:text-5xl text-ruin">…now it&apos;s time to collect your payments.</h1>
            <button
              onClick={() => { audioRef.current?.play().catch(() => {}); onDone() }}
              className="mt-10 rounded-full border border-ruin/70 text-ruin px-8 py-3 hover:bg-ruin hover:text-black transition-colors duration-300">
              Continue
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
```

> Autoplay note: browsers block audio without a prior user gesture. The user clicked through the gate + name entry to reach onboarding, which generally satisfies the gesture requirement for the step-3 `play()`. The step-3 Continue button also calls `play()` as a guaranteed-gesture fallback. Acceptable for the joke (laugh fires as they enter step 3, or at worst when they click Continue).

- [ ] **Step 2: Build + commit**

```bash
npm run build && git add components/Onboarding.tsx && git commit -m "feat(ui): three-step cinematic onboarding with confetti and ghost laugh"
```
Expected: build passes.

### Task 6.4: ProgressBar

**Files:** Create `components/ProgressBar.tsx`.

- [ ] **Step 1: Write `components/ProgressBar.tsx` (motion fill)**

```tsx
'use client'
import { motion, useReducedMotion } from 'motion/react'

export default function ProgressBar({ fraction }: { fraction: number }) {
  const reduce = useReducedMotion()
  const pct = Math.round(Math.max(0, Math.min(1, fraction)) * 100)
  return (
    <div className="h-3 w-full rounded-full bg-sand/60 overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-amber to-coral"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={reduce ? { duration: 0 } : { duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Build + commit**

```bash
npm run build && git add components/ProgressBar.tsx && git commit -m "feat(ui): animated progress bar"
```
Expected: build passes.

### Task 6.5: ProofModal (view a payer)

**Files:** Create `components/ProofModal.tsx`.

- [ ] **Step 1: Write `components/ProofModal.tsx`**

```tsx
'use client'
import Modal from '@/components/Modal'
import { Payer } from '@/lib/payments'

export default function ProofModal({ payer, onClose }: { payer: Payer | null; onClose: () => void }) {
  return (
    <Modal open={!!payer} onClose={onClose} labelledBy="proof-title">
      {payer && (
        <div className="text-center">
          <h3 id="proof-title" className="font-serif text-2xl text-charcoal mb-4">{payer.display_name}</h3>
          {/* External Supabase URL: use plain img to avoid next/image domain config */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={payer.proof_url} alt={`Proof from ${payer.display_name}`}
               className="w-full rounded-xl ring-1 ring-sand object-contain max-h-[60vh]" />
          <button onClick={onClose}
            className="mt-6 rounded-full bg-amber px-7 py-2.5 text-charcoal hover:bg-coral transition-colors duration-300">
            Close
          </button>
        </div>
      )}
    </Modal>
  )
}
```

- [ ] **Step 2: Build + commit**

```bash
npm run build && git add components/ProofModal.tsx && git commit -m "feat(ui): proof viewer modal"
```
Expected: build passes.

### Task 6.6: PaymentModal + SuccessModal

**Files:** Create `components/PaymentModal.tsx`, `components/SuccessModal.tsx`.

- [ ] **Step 1: Write `components/SuccessModal.tsx`**

```tsx
'use client'
import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import Modal from '@/components/Modal'

export default function SuccessModal({ open, name, onClose }: { open: boolean; name: string; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.5 },
      colors: ['#E8A14B', '#E07A5F', '#FBF6EE'] })
  }, [open])
  return (
    <Modal open={open} onClose={onClose} labelledBy="success-title">
      <div className="text-center">
        <div className="text-4xl mb-3">🌅</div>
        <h3 id="success-title" className="font-serif text-3xl text-charcoal mb-2">Thank you, {name}</h3>
        <p className="text-charcoal/60">Your contribution is recorded.</p>
        <button onClick={onClose}
          className="mt-7 rounded-full bg-amber px-8 py-3 text-charcoal hover:bg-coral transition-colors duration-300">
          Lovely
        </button>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 2: Write `components/PaymentModal.tsx`**

```tsx
'use client'
import { useState } from 'react'
import Modal from '@/components/Modal'
import { Pool } from '@/lib/constants'
import { peso } from '@/lib/money'
import { submitPayment } from '@/lib/payments'

export default function PaymentModal({
  open, pool, accountId, onClose, onSuccess,
}: {
  open: boolean
  pool: Pool | null
  accountId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  function pick(f: File | null) {
    setFile(f); setErr('')
    setPreview(f ? URL.createObjectURL(f) : '')
  }
  function reset() { setFile(null); setPreview(''); setConfirmed(false); setErr(''); setBusy(false) }

  async function upload() {
    if (!file || !confirmed || !pool) return
    setBusy(true); setErr('')
    try {
      await submitPayment(accountId, pool.kind, file)
      reset(); onSuccess()
    } catch (e: any) {
      setErr(e.message ?? 'Upload failed. Please try again.')
      setBusy(false)
    }
  }

  return (
    <Modal open={open && !!pool} onClose={() => { reset(); onClose() }} labelledBy="pay-title">
      {pool && (
        <div>
          <h3 id="pay-title" className="font-serif text-2xl text-charcoal">{pool.title}</h3>
          <p className="text-charcoal/60 mt-1 mb-5">
            Your share is <span className="font-medium text-coral">{peso(pool.share)}</span>. Upload a photo of your proof of payment.
          </p>

          <label className="block cursor-pointer rounded-xl border-2 border-dashed border-sand hover:border-amber transition-colors p-4 text-center">
            {preview
              ? /* eslint-disable-next-line @next/next/no-img-element */
                <img src={preview} alt="Preview" className="mx-auto max-h-52 rounded-lg object-contain" />
              : <span className="text-charcoal/50">Tap to choose an image</span>}
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => pick(e.target.files?.[0] ?? null)} />
          </label>

          <label className="mt-5 flex items-start gap-3 text-sm text-charcoal/80">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 accent-amber" />
            <span>I confirm I have paid and uploaded the correct proof.</span>
          </label>

          {err && <p className="mt-3 text-coral text-sm">{err}</p>}

          <div className="mt-6 flex gap-3 justify-end">
            <button onClick={() => { reset(); onClose() }}
              className="rounded-full px-5 py-2.5 text-charcoal/70 hover:text-charcoal">Cancel</button>
            <button onClick={upload} disabled={!file || !confirmed || busy}
              className="rounded-full bg-amber px-7 py-2.5 text-charcoal hover:bg-coral transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
              {busy ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
```

- [ ] **Step 3: Build + commit**

```bash
npm run build && git add components/PaymentModal.tsx components/SuccessModal.tsx && git commit -m "feat(ui): payment upload modal and themed success modal"
```
Expected: build passes.

### Task 6.7: ExpenseColumn

**Files:** Create `components/ExpenseColumn.tsx`.

- [ ] **Step 1: Write `components/ExpenseColumn.tsx`**

```tsx
'use client'
import { Pool } from '@/lib/constants'
import { poolProgress } from '@/lib/money'
import { Payer } from '@/lib/payments'
import ProgressBar from '@/components/ProgressBar'

export default function ExpenseColumn({
  pool, payers, hasPaid, onPay, onSelectPayer,
}: {
  pool: Pool
  payers: Payer[]
  hasPaid: boolean
  onPay: () => void
  onSelectPayer: (p: Payer) => void
}) {
  const prog = poolProgress(pool, payers.length)
  return (
    <section className="flex-1 rounded-3xl bg-ivory/80 ring-1 ring-sand/60 p-7 shadow-sm">
      <h2 className="font-serif text-3xl text-charcoal text-center">{pool.title}</h2>
      <p className="text-center text-charcoal/55 mt-1 mb-5">{prog.label}</p>
      <ProgressBar fraction={prog.fraction} />

      <div className="mt-6 text-center">
        <button onClick={onPay} disabled={hasPaid}
          className="rounded-full bg-amber px-8 py-3 font-medium text-charcoal hover:bg-coral transition-colors duration-300 disabled:opacity-50 disabled:cursor-default">
          {hasPaid ? 'Paid ✓' : pool.cta}
        </button>
      </div>

      <ul className="mt-7 space-y-1.5">
        {payers.map((p) => (
          <li key={p.account_id}>
            <button onClick={() => onSelectPayer(p)}
              className="w-full text-left rounded-lg px-3 py-2 text-charcoal/80 hover:bg-cream hover:text-charcoal transition-colors">
              {p.display_name}
            </button>
          </li>
        ))}
        {payers.length === 0 && <li className="text-center text-charcoal/40 text-sm py-2">No one yet — be the first.</li>}
      </ul>
    </section>
  )
}
```

- [ ] **Step 2: Build + commit**

```bash
npm run build && git add components/ExpenseColumn.tsx && git commit -m "feat(ui): expense column with bar, CTA, and payer list"
```
Expected: build passes.

### Task 6.8: Dashboard

**Files:** Create `components/Dashboard.tsx`.

- [ ] **Step 1: Write `components/Dashboard.tsx`**

```tsx
'use client'
import { useCallback, useEffect, useState } from 'react'
import { Account } from '@/lib/account'
import { POOLS, Pool } from '@/lib/constants'
import { fetchPayers, Payer } from '@/lib/payments'
import ExpenseColumn from '@/components/ExpenseColumn'
import PaymentModal from '@/components/PaymentModal'
import SuccessModal from '@/components/SuccessModal'
import ProofModal from '@/components/ProofModal'

export default function Dashboard({ account, onReplay }: { account: Account; onReplay: () => void }) {
  const [fare, setFare] = useState<Payer[]>([])
  const [fee, setFee] = useState<Payer[]>([])
  const [payPool, setPayPool] = useState<Pool | null>(null)
  const [selected, setSelected] = useState<Payer | null>(null)
  const [success, setSuccess] = useState(false)

  const load = useCallback(async () => {
    const [f1, f2] = await Promise.all([fetchPayers('fare'), fetchPayers('fee')])
    setFare(f1); setFee(f2)
  }, [])

  useEffect(() => { load() }, [load])

  const paidFare = fare.some((p) => p.account_id === account.id)
  const paidFee = fee.some((p) => p.account_id === account.id)

  return (
    <div className="min-h-screen px-4 sm:px-8 py-12 animate-fade-in">
      <header className="text-center mb-10">
        <p className="font-serif tracking-[0.3em] uppercase text-charcoal/50 text-sm">Ormoc · 2026</p>
        <h1 className="font-serif text-4xl sm:text-5xl text-charcoal mt-1">Huey &amp; Cherry</h1>
        <p className="text-charcoal/55 mt-2">Welcome, {account.display_name}.</p>
      </header>

      <div className="mx-auto max-w-5xl flex flex-col md:flex-row gap-6">
        <ExpenseColumn pool={POOLS.fare} payers={fare} hasPaid={paidFare}
          onPay={() => setPayPool(POOLS.fare)} onSelectPayer={setSelected} />
        <ExpenseColumn pool={POOLS.fee} payers={fee} hasPaid={paidFee}
          onPay={() => setPayPool(POOLS.fee)} onSelectPayer={setSelected} />
      </div>

      <div className="text-center mt-10">
        <button onClick={onReplay} className="text-charcoal/40 hover:text-charcoal/70 text-sm underline underline-offset-4">
          replay intro
        </button>
      </div>

      <PaymentModal open={!!payPool} pool={payPool} accountId={account.id}
        onClose={() => setPayPool(null)}
        onSuccess={async () => { setPayPool(null); await load(); setSuccess(true) }} />
      <SuccessModal open={success} name={account.display_name} onClose={() => setSuccess(false)} />
      <ProofModal payer={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
```

- [ ] **Step 2: Build + commit**

```bash
npm run build && git add components/Dashboard.tsx && git commit -m "feat(ui): dashboard orchestrating columns and modals"
```
Expected: build passes.

### Task 6.9: Page orchestrator (state machine + persistence)

**Files:** Replace `app/page.tsx`.

- [ ] **Step 1: Write `app/page.tsx`**

```tsx
'use client'
import { useEffect, useState } from 'react'
import Gate from '@/components/Gate'
import NameEntry from '@/components/NameEntry'
import Onboarding from '@/components/Onboarding'
import Dashboard from '@/components/Dashboard'
import { Account } from '@/lib/account'

type Phase = 'gate' | 'name' | 'onboarding' | 'dashboard'
const LS_ACCOUNT = 'wedding.account'
const LS_ONBOARDED = 'wedding.onboarded'

export default function Page() {
  const [phase, setPhase] = useState<Phase>('gate')
  const [account, setAccount] = useState<Account | null>(null)
  const [ready, setReady] = useState(false)

  // Restore session
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_ACCOUNT)
      if (raw) { setAccount(JSON.parse(raw)); setPhase('dashboard') }
    } catch { /* ignore */ }
    setReady(true)
  }, [])

  if (!ready) return null

  if (phase === 'gate') return <Gate onPass={() => setPhase('name')} />

  if (phase === 'name')
    return (
      <NameEntry onAccount={(a) => {
        setAccount(a)
        localStorage.setItem(LS_ACCOUNT, JSON.stringify(a))
        const seen = localStorage.getItem(LS_ONBOARDED)
        setPhase(seen ? 'dashboard' : 'onboarding')
      }} />
    )

  if (phase === 'onboarding' && account)
    return <Onboarding name={account.display_name} onDone={() => {
      localStorage.setItem(LS_ONBOARDED, '1')
      setPhase('dashboard')
    }} />

  if (phase === 'dashboard' && account)
    return <Dashboard account={account} onReplay={() => setPhase('onboarding')} />

  // Fallback
  return <Gate onPass={() => setPhase('name')} />
}
```

- [ ] **Step 2: Build + manual smoke test**

```bash
npm run build && npm run dev
```
Manual checklist in browser at `localhost:3000`:
- Wrong password shakes + message; correct password advances.
- Name entry creates an account (check Supabase `accounts` table via MCP `execute_sql: select * from accounts`).
- Onboarding plays all 3 steps; confetti on step 2; screen goes black + red text + laugh on step 3.
- Dashboard shows both columns. Pay the Fare → modal → pick image → check box → Upload → success confetti → your name appears in the Fare list.
- Click your name → proof modal shows the image.
- Reload page → lands directly on dashboard (session remembered), onboarding does not replay.
- "replay intro" link replays onboarding.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx && git commit -m "feat: page orchestrator with session + onboarding persistence"
```

---

## Phase 7 — Polish & robustness

### Task 7.1: README + RLS note + run instructions

**Files:** Replace `README.md`.

- [ ] **Step 1: Write `README.md`**

```markdown
# Huey & Cherry — Wedding Payments

A small, password-gated app for ~12 friends to track and pay shares of two wedding
expense pools and upload proof. Next.js + Supabase + Vercel.

## Local dev
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill values (Supabase URL + anon key; gate password).
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
- `lib/` — constants, money math, account + payment data access, supabase client
- `components/` — screens and modals
```

- [ ] **Step 2: Commit**

```bash
git add README.md && git commit -m "docs: README with setup, checks, and security note"
```

### Task 7.2: Full local verification pass

**Files:** none.

- [ ] **Step 1: Run all checks**

```bash
npm test && npm run typecheck && npm run build
```
Expected: tests pass, typecheck clean, build succeeds.

- [ ] **Step 2: Confirm a second account + payment from a different name**

In the browser, clear localStorage (`localStorage.clear()` in devtools), re-enter, use a different name, pay the Fee. Confirm both columns aggregate correctly (e.g. label updates to `₱880 / ₱10,560 · 1 of 12 paid`) and both names render in their lists.

---

## Phase 8 — Deploy

### Task 8.1: Push to GitHub

**Files:** none.

- [ ] **Step 1: Push main**

```bash
cd /d/Projects/wedding
git pull --rebase origin main 2>/dev/null || true
git push -u origin main
```
Expected: branch pushed to `github.com/keithruezyl1/wedding`. (If the remote rejects due to unrelated histories, run `git pull origin main --allow-unrelated-histories`, resolve, then push.)

### Task 8.2: Deploy to Vercel + env vars

**Files:** none.

- [ ] **Step 1: Deploy via Vercel MCP**

Use Vercel MCP `deploy_to_vercel` for team `team_pjiwqeVHaIBsPImCSyXufZHd`, importing the `keithruezyl1/wedding` GitHub repo (framework auto-detected as Next.js).

- [ ] **Step 2: Set environment variables in Vercel**

Set for Production (and Preview):
- `NEXT_PUBLIC_SUPABASE_URL` = (project url)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (anon key)
- `GATE_PASSWORD` = `HueyAndCherryWeddingWHAAAT`

Then trigger a redeploy so the env vars are baked in.

- [ ] **Step 3: Verify the live deployment**

Open the production URL. Run the same manual smoke checklist from Task 6.9 Step 2 against the live site. Confirm:
- Gate works, onboarding plays, audio plays after the gesture.
- A real upload writes to Supabase Storage `proofs/` and the proof modal renders the image.

- [ ] **Step 4: Final commit (if any deploy config files were added, e.g. vercel.json)**

```bash
git add -A && git commit -m "chore: vercel deployment config" && git push
```
(If no files changed, skip.)

---

## Self-Review (completed by plan author)

**Spec coverage:**
- Gate password (server-checked) → Task 3.1 ✓
- Name = account, remembered on device → Tasks 3.2, 6.2, 6.9 (localStorage) ✓
- 3-step onboarding, first-time only, confetti, fade-to-black red text, ghost laugh → Tasks 6.3, 6.9 ✓
- Dashboard two columns, totals 18,000 & 10,560, ÷12, progress bars → Tasks 2.1, 2.2, 6.4, 6.7, 6.8 ✓
- Pay CTAs → modal → proof upload → required confirm checkbox before Upload → Task 6.6 ✓
- Themed success modal → Task 6.6 ✓
- Payer names list, click → modal with name + image → Tasks 6.5, 6.7 ✓
- Supabase accounts + image uploads (1 password use = 1 account by name) → Tasks 1.x, 3.2, 4.1 ✓
- Elegant theme, calm animations, reduced-motion → Tasks 5.1, 6.x ✓
- Supabase + Vercel + GitHub repo → Phases 1, 8 ✓

**Placeholder scan:** No TBD/TODO; all code blocks complete; SQL, env keys, and commands concrete.

**Type consistency:** `Account` (id/name/display_name), `Payer` (account_id/display_name/proof_url), `Pool` (kind/title/total/share/cta), `PoolKind` ('fare'|'fee'), `poolProgress(pool, count)`, `createOrLoadAccount`, `fetchPayers`, `submitPayment` — all used consistently across tasks. `peso()` returns the `₱`-prefixed grouped string used in tests and UI.

**Known acceptance tradeoffs (documented, intentional):**
- `isNew` for onboarding is decided in the orchestrator via a per-device `onboarded` flag, not by DB state — matches the "first time only, remembered on device" decision.
- Permissive RLS — acceptable for a private, password-gated, low-stakes friends app (noted in README).
- Audio autoplay relies on the click gesture from NameEntry/Continue — documented in Task 6.3.
