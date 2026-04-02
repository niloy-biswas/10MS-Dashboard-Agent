-- ============================================================
-- 10MS Analytics — Supabase Auth Trigger
-- Run this in the Supabase SQL Editor AFTER seed.sql
-- ============================================================

-- Function: auto-create a profiles row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role, avatar_url)
  values (
    new.id,
    -- Google OAuth sends full_name; email/password signup sends name
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.email,
    'Analyst',
    -- Google OAuth sends avatar_url; fallback to picture (some providers)
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  )
  on conflict (email) do update
    -- For returning users signing in via Google for the first time,
    -- backfill avatar_url only if it isn't already set
    set avatar_url = coalesce(profiles.avatar_url, excluded.avatar_url);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: fires after every new row in auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Domain restriction: reject signups outside @10minuteschool.com
-- This is a server-side guard in addition to client-side validation
-- ============================================================
create or replace function public.enforce_email_domain()
returns trigger as $$
begin
  if new.email not like '%@10minuteschool.com' then
    raise exception 'Only @10minuteschool.com email addresses are allowed.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists enforce_email_domain_trigger on auth.users;
create trigger enforce_email_domain_trigger
  before insert on auth.users
  for each row execute procedure public.enforce_email_domain();
