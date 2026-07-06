-- 数据同步 schema：5 表 + RLS（对齐 docs/technical/tabora-data-sync-technical-design.md §3/§4）
-- 远端已验证通过 security/performance advisors (2026-07-06)

-- 3.1 profiles
create table public.profiles (
  account_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.2 sync_devices
create table public.sync_devices (
  device_id text not null,
  account_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('macos','windows','ios','android','browser')),
  first_login_at timestamptz not null default now(),
  last_sync_at timestamptz,
  status text not null default 'online'
    check (status in ('current','online','offline','removed')),
  primary key (account_id, device_id)
);

-- 3.3 synced_records（云端事实源核心表）
create table public.synced_records (
  account_id uuid not null references auth.users (id) on delete cascade,
  scope text not null check (scope in ('core','plugin')),
  entity_type text not null,
  record_key text not null,
  payload jsonb not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  schema_version integer not null default 1,
  last_writer_device_id text not null,
  server_updated_at timestamptz not null default now(),
  primary key (account_id, scope, entity_type, record_key)
);
create index on public.synced_records (account_id, server_updated_at);

-- 3.4 sync_snapshots
create table public.sync_snapshots (
  snapshot_id uuid primary key default gen_random_uuid(),
  account_id uuid not null references auth.users (id) on delete cascade,
  reason text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index on public.sync_snapshots (account_id, created_at desc);

-- 3.5 sync_conflicts
create table public.sync_conflicts (
  conflict_id uuid primary key default gen_random_uuid(),
  account_id uuid not null references auth.users (id) on delete cascade,
  scope text not null,
  entity_type text not null,
  record_key text not null,
  local_device_id text not null,
  remote_device_id text not null,
  local_summary text not null,
  remote_summary text not null,
  local_payload jsonb not null,
  remote_payload jsonb not null,
  status text not null default 'open' check (status in ('open','resolved','ignored')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index on public.sync_conflicts (account_id, status, created_at desc);

-- 4. RLS 策略（纵深防御，即使客户端只经网关）
alter table public.profiles       enable row level security;
alter table public.sync_devices   enable row level security;
alter table public.synced_records enable row level security;
alter table public.sync_snapshots enable row level security;
alter table public.sync_conflicts enable row level security;

-- profiles
create policy "profiles select own" on public.profiles
  for select to authenticated using ((select auth.uid()) = account_id);
create policy "profiles insert own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = account_id);
create policy "profiles update own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = account_id)
  with check ((select auth.uid()) = account_id);
create policy "profiles delete own" on public.profiles
  for delete to authenticated using ((select auth.uid()) = account_id);

-- sync_devices
create policy "devices select own" on public.sync_devices
  for select to authenticated using ((select auth.uid()) = account_id);
create policy "devices insert own" on public.sync_devices
  for insert to authenticated with check ((select auth.uid()) = account_id);
create policy "devices update own" on public.sync_devices
  for update to authenticated
  using ((select auth.uid()) = account_id)
  with check ((select auth.uid()) = account_id);
create policy "devices delete own" on public.sync_devices
  for delete to authenticated using ((select auth.uid()) = account_id);

-- synced_records
create policy "records select own" on public.synced_records
  for select to authenticated using ((select auth.uid()) = account_id);
create policy "records insert own" on public.synced_records
  for insert to authenticated with check ((select auth.uid()) = account_id);
create policy "records update own" on public.synced_records
  for update to authenticated
  using ((select auth.uid()) = account_id)
  with check ((select auth.uid()) = account_id);
create policy "records delete own" on public.synced_records
  for delete to authenticated using ((select auth.uid()) = account_id);

-- sync_snapshots
create policy "snapshots select own" on public.sync_snapshots
  for select to authenticated using ((select auth.uid()) = account_id);
create policy "snapshots insert own" on public.sync_snapshots
  for insert to authenticated with check ((select auth.uid()) = account_id);
create policy "snapshots update own" on public.sync_snapshots
  for update to authenticated
  using ((select auth.uid()) = account_id)
  with check ((select auth.uid()) = account_id);
create policy "snapshots delete own" on public.sync_snapshots
  for delete to authenticated using ((select auth.uid()) = account_id);

-- sync_conflicts
create policy "conflicts select own" on public.sync_conflicts
  for select to authenticated using ((select auth.uid()) = account_id);
create policy "conflicts insert own" on public.sync_conflicts
  for insert to authenticated with check ((select auth.uid()) = account_id);
create policy "conflicts update own" on public.sync_conflicts
  for update to authenticated
  using ((select auth.uid()) = account_id)
  with check ((select auth.uid()) = account_id);
create policy "conflicts delete own" on public.sync_conflicts
  for delete to authenticated using ((select auth.uid()) = account_id);
