create extension if not exists pgcrypto;

create table if not exists organizers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text not null unique,
  name text not null,
  company text,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.organizers
  add column if not exists auth_user_id uuid;

create unique index if not exists organizers_auth_user_id_idx
  on public.organizers(auth_user_id)
  where auth_user_id is not null;

alter table events
  add column if not exists organizer_id uuid;

insert into organizers (email, name)
values ('michael.nogler@example.com', 'Dr. Michael Nogler')
on conflict (email) do update
set name = excluded.name;

update events
set organizer_id = (
  select id
  from organizers
  where email = 'michael.nogler@example.com'
  limit 1
)
where organizer_id is null;

alter table events
  alter column organizer_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_organizer_id_fkey'
  ) then
    alter table events
      add constraint events_organizer_id_fkey
      foreign key (organizer_id)
      references organizers(id)
      on delete cascade;
  end if;
end $$;

create index if not exists organizers_email_idx on organizers(email);
create index if not exists events_organizer_id_idx on events(organizer_id);

grant select on public.organizers to anon, authenticated;
grant insert, update on public.organizers to authenticated;
grant select, insert, update on public.events to authenticated;
grant select, insert, update on public.products to authenticated;
grant insert on public.sales to authenticated;
grant insert on public.sale_items to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'organizers'
      and policyname = 'organizers_mvp_read'
  ) then
    create policy organizers_mvp_read
      on public.organizers
      for select
      to anon, authenticated
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'organizers'
      and policyname = 'organizers_mvp_insert_own'
  ) then
    create policy organizers_mvp_insert_own
      on public.organizers
      for insert
      to authenticated
      with check (auth.uid() = auth_user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'events'
      and policyname = 'events_mvp_authenticated_access'
  ) then
    create policy events_mvp_authenticated_access
      on public.events
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
      and tablename = 'products'
      and policyname = 'products_mvp_authenticated_access'
  ) then
    create policy products_mvp_authenticated_access
      on public.products
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
      and tablename = 'organizers'
      and policyname = 'organizers_mvp_claim_or_update_own'
  ) then
    create policy organizers_mvp_claim_or_update_own
      on public.organizers
      for update
      to authenticated
      using (auth_user_id is null or auth.uid() = auth_user_id)
      with check (auth.uid() = auth_user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'sales'
      and policyname = 'sales_mvp_authenticated_insert'
  ) then
    create policy sales_mvp_authenticated_insert
      on public.sales
      for insert
      to authenticated
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'sale_items'
      and policyname = 'sale_items_mvp_authenticated_insert'
  ) then
    create policy sale_items_mvp_authenticated_insert
      on public.sale_items
      for insert
      to authenticated
      with check (true);
  end if;
end $$;

comment on table organizers is 'Commercial organizer accounts. Authentication will later connect Supabase Auth users to organizers.';
comment on column organizers.auth_user_id is 'Optional Supabase Auth user id linked to this organizer.';
comment on column events.organizer_id is 'Primary event owner for the organizer account foundation.';
comment on column events.tenant_id is 'Temporary compatibility layer until authentication, Stripe, and full tenant handling are reintroduced.';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sale_items'
      and column_name = 'unit_price_cents'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sale_items'
      and column_name = 'price_cents_snapshot'
  ) then
    alter table public.sale_items
      rename column unit_price_cents to price_cents_snapshot;
  end if;
end $$;

alter table public.sale_items
  add column if not exists price_cents_snapshot integer;

update public.sale_items
set price_cents_snapshot = line_total_cents / nullif(quantity, 0)
where price_cents_snapshot is null;

alter table public.sale_items
  alter column price_cents_snapshot set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sale_items_price_cents_snapshot_check'
  ) then
    alter table public.sale_items
      add constraint sale_items_price_cents_snapshot_check
      check (price_cents_snapshot >= 0);
  end if;
end $$;

comment on column public.sale_items.price_cents_snapshot is 'Unit price snapshot in cents at the time of sale.';
