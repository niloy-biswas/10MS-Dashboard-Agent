-- ============================================================
-- 10MS Analytics — Supabase Auth Trigger
-- Run this in the Supabase SQL Editor AFTER seed.sql
-- ============================================================

-- Function: auto-create a profiles row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'Analyst'
  )
  on conflict (email) do nothing;
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
