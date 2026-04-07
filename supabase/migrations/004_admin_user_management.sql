-- Admins can list all profiles; toggle is_admin only via RPC (not on self).
-- Use SECURITY DEFINER for admin check so policies on `profiles` do not recurse.

create or replace function public.current_user_is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke all on function public.current_user_is_admin() from public;
grant execute on function public.current_user_is_admin() to authenticated;

create policy "profiles_select_all_for_admin"
on public.profiles for select
to authenticated
using (public.current_user_is_admin() = true);

create or replace function public.admin_set_user_admin(p_user_id uuid, p_is_admin boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'not authorized';
  end if;
  if p_user_id = (select auth.uid()) then
    raise exception 'cannot change own admin flag';
  end if;
  if not exists (select 1 from public.profiles u where u.id = p_user_id) then
    raise exception 'user not found';
  end if;
  update public.profiles
  set is_admin = p_is_admin, updated_at = now()
  where id = p_user_id;
end;
$$;

grant execute on function public.admin_set_user_admin(uuid, boolean) to authenticated;
