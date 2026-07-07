alter table public.sales
  add column if not exists print_count integer not null default 0,
  add column if not exists printed_at timestamptz;

alter table public.sales
  drop constraint if exists sales_print_count_check;

alter table public.sales
  add constraint sales_print_count_check
  check (print_count >= 0);

create or replace function public.increment_sale_print_count(
  p_tenant_id uuid,
  p_sale_id uuid
)
returns table (
  print_count integer,
  printed_at timestamptz
)
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.sales
  set
    print_count = public.sales.print_count + 1,
    printed_at = now()
  where public.sales.tenant_id = p_tenant_id
    and public.sales.id = p_sale_id
    and public.sales.status = 'completed'
  returning public.sales.print_count, public.sales.printed_at
  into print_count, printed_at;

  if not found then
    raise exception 'Completed sale % was not found for tenant %.', p_sale_id, p_tenant_id;
  end if;

  return next;
end;
$$;

grant execute on function public.increment_sale_print_count(uuid, uuid) to anon, authenticated;

comment on column public.sales.print_count
  is 'Number of completed print actions for this sale. Initial print and every reprint increment this value.';

comment on column public.sales.printed_at
  is 'Timestamp of the most recent print or reprint action for this sale.';

comment on function public.increment_sale_print_count(uuid, uuid)
  is 'Increments print_count and updates printed_at for an existing completed sale without creating sale or sale_items rows.';

notify pgrst, 'reload schema';
