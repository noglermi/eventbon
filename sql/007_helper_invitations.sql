create table if not exists public.helper_invitations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  code text not null unique,
  label text,
  station text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists helper_invitations_event_id_idx
  on public.helper_invitations(event_id);

create index if not exists helper_invitations_code_idx
  on public.helper_invitations(code);

grant select on public.helper_invitations to anon, authenticated;
grant insert, update on public.helper_invitations to authenticated;
grant select on public.events to anon;
grant select on public.products to anon;
grant select on public.sales to anon;
grant select on public.sale_items to anon;
grant insert on public.sales to anon;
grant insert on public.sale_items to anon;
grant execute on function public.save_completed_sale(
  uuid,
  uuid,
  integer,
  text,
  integer,
  integer,
  timestamptz,
  jsonb
) to anon;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'helper_invitations'
      and policyname = 'helper_invitations_mvp_authenticated_manage'
  ) then
    create policy helper_invitations_mvp_authenticated_manage
      on public.helper_invitations
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'helper_invitations'
      and policyname = 'helper_invitations_mvp_anon_active_read'
  ) then
    create policy helper_invitations_mvp_anon_active_read
      on public.helper_invitations
      for select
      to anon
      using (is_active = true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'events'
      and policyname = 'events_mvp_anon_helper_read'
  ) then
    create policy events_mvp_anon_helper_read
      on public.events
      for select
      to anon
      using (
        exists (
          select 1
          from public.helper_invitations
          where helper_invitations.event_id = events.id
            and helper_invitations.is_active = true
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname = 'products_mvp_anon_helper_read'
  ) then
    create policy products_mvp_anon_helper_read
      on public.products
      for select
      to anon
      using (
        exists (
          select 1
          from public.helper_invitations
          where helper_invitations.event_id = products.event_id
            and helper_invitations.is_active = true
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'sales'
      and policyname = 'sales_mvp_anon_helper_insert'
  ) then
    create policy sales_mvp_anon_helper_insert
      on public.sales
      for insert
      to anon
      with check (
        exists (
          select 1
          from public.helper_invitations
          where helper_invitations.event_id = sales.event_id
            and helper_invitations.is_active = true
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'sale_items'
      and policyname = 'sale_items_mvp_anon_helper_insert'
  ) then
    create policy sale_items_mvp_anon_helper_insert
      on public.sale_items
      for insert
      to anon
      with check (
        exists (
          select 1
          from public.sales
          join public.helper_invitations
            on helper_invitations.event_id = sales.event_id
          where sales.id = sale_items.sale_id
            and helper_invitations.is_active = true
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'sales'
      and policyname = 'sales_mvp_anon_helper_read'
  ) then
    create policy sales_mvp_anon_helper_read
      on public.sales
      for select
      to anon
      using (
        exists (
          select 1
          from public.helper_invitations
          where helper_invitations.event_id = sales.event_id
            and helper_invitations.is_active = true
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'sale_items'
      and policyname = 'sale_items_mvp_anon_helper_read'
  ) then
    create policy sale_items_mvp_anon_helper_read
      on public.sale_items
      for select
      to anon
      using (
        exists (
          select 1
          from public.sales
          join public.helper_invitations
            on helper_invitations.event_id = sales.event_id
          where sales.id = sale_items.sale_id
            and helper_invitations.is_active = true
        )
      );
  end if;
end $$;

comment on table public.helper_invitations is 'Event-scoped helper access invitations for MVP helper entry without Supabase Auth.';
comment on column public.helper_invitations.code is 'Short access code used by helpers or embedded in invitation links.';

notify pgrst, 'reload schema';
