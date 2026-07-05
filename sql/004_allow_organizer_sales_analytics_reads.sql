grant select on public.sales to authenticated;
grant select on public.sale_items to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'sales'
      and policyname = 'sales_mvp_authenticated_read'
  ) then
    create policy sales_mvp_authenticated_read
      on public.sales
      for select
      to authenticated
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'sale_items'
      and policyname = 'sale_items_mvp_authenticated_read'
  ) then
    create policy sale_items_mvp_authenticated_read
      on public.sale_items
      for select
      to authenticated
      using (true);
  end if;
end $$;

notify pgrst, 'reload schema';
