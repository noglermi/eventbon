alter table public.organizers
  add column if not exists auth_user_id uuid;

create unique index if not exists organizers_auth_user_id_idx
  on public.organizers(auth_user_id)
  where auth_user_id is not null;

comment on column public.organizers.auth_user_id is 'Optional Supabase Auth user id linked to this organizer.';

notify pgrst, 'reload schema';
