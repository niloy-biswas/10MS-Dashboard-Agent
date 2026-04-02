-- ============================================================
-- Profiles RLS — add UPDATE policy so authenticated users
-- can update their own profile row (matched by email).
-- Using auth.email() instead of auth.uid() = id because
-- seeded profile rows have random IDs that don't match auth.uid().
-- ============================================================

create policy "Users can update own profile"
  on profiles for update
  using (auth.email() = email);

-- Allow the handle_new_user trigger (security definer) to insert
-- new profiles for OAuth sign-ups.
-- Note: the trigger already runs as security definer so this isn't
-- strictly required, but it's good practice to be explicit.
create policy "Service can insert profiles"
  on profiles for insert
  with check (true);
