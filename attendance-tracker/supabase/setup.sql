-- ============================================================
-- Attendance Register — Supabase database setup
-- Run this ONCE in: Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================

-- 1. Subjects -------------------------------------------------
create table if not exists public.subjects (
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id          text not null,                 -- SUB001, SUB002, ...
  name        text not null,
  code        text not null default '',
  description text not null default '',
  created_at  timestamptz not null default now(),
  primary key (user_id, id)
);

-- 2. Attendance records ---------------------------------------
create table if not exists public.attendance (
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id          text not null,                 -- ATT001, ATT002, ...
  subject_id  text not null,
  date        date not null,
  status      text not null,
  remarks     text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists attendance_subject_idx on public.attendance (user_id, subject_id);

-- 3. Per-user counters (ID generation) and last-export time ----
create table if not exists public.app_meta (
  user_id            uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  subject_counter    integer not null default 0,
  attendance_counter integer not null default 0,
  last_exported_at   timestamptz
);

-- 4. Row Level Security: a signed-in user sees and edits ONLY their own rows.
--    Without this, anyone holding the public key could read/change the data.
alter table public.subjects   enable row level security;
alter table public.attendance enable row level security;
alter table public.app_meta   enable row level security;

drop policy if exists "own subjects"   on public.subjects;
drop policy if exists "own attendance" on public.attendance;
drop policy if exists "own meta"       on public.app_meta;

create policy "own subjects" on public.subjects
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own attendance" on public.attendance
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own meta" on public.app_meta
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 5. Let signed-in users reach these tables through the API
--    (RLS above still limits them to their own rows). Anonymous visitors get nothing.
grant select, insert, update, delete on public.subjects, public.attendance, public.app_meta to authenticated;
revoke all on public.subjects, public.attendance, public.app_meta from anon;
