-- Reference copy of the schema applied to Supabase project `wedding`
-- (ref tipaqkyxdbvxzpzpkrry) via MCP migrations. Source of truth is the live DB;
-- this file documents it and can recreate it on a fresh project.

-- ── Tables ──────────────────────────────────────────────────────────────────

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

-- ── RLS (permissive; the shared gate password is the real access barrier) ─────

alter table public.accounts enable row level security;
alter table public.payments enable row level security;

create policy "accounts_read"   on public.accounts for select using (true);
create policy "accounts_insert" on public.accounts for insert with check (true);

create policy "payments_read"   on public.payments for select using (true);
create policy "payments_insert" on public.payments for insert with check (true);
create policy "payments_update" on public.payments for update using (true) with check (true);
create policy "payments_delete" on public.payments for delete using (true);

-- ── Storage: public `proofs` bucket ──────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', true)
on conflict (id) do nothing;

create policy "proofs_read"   on storage.objects for select using (bucket_id = 'proofs');
create policy "proofs_insert" on storage.objects for insert with check (bucket_id = 'proofs');
create policy "proofs_update" on storage.objects for update using (bucket_id = 'proofs') with check (bucket_id = 'proofs');
create policy "proofs_delete" on storage.objects for delete using (bucket_id = 'proofs');
