alter table public.sales
  add column if not exists terminal_id text;

create index if not exists sales_event_id_terminal_id_created_at_idx
  on public.sales(event_id, terminal_id, created_at desc);

drop function if exists public.save_completed_sale(
  uuid,
  uuid,
  integer,
  text,
  integer,
  integer,
  timestamptz,
  jsonb
);

drop function if exists public.save_completed_sale(
  uuid,
  uuid,
  integer,
  text,
  integer,
  integer,
  timestamptz,
  uuid,
  text,
  text,
  jsonb
);

create or replace function public.save_completed_sale(
  p_tenant_id uuid,
  p_event_id uuid,
  p_total_cents integer,
  p_payment_method text,
  p_cash_received_cents integer,
  p_change_cents integer,
  p_created_at timestamptz,
  p_helper_invitation_id uuid,
  p_helper_name_snapshot text,
  p_helper_station_snapshot text,
  p_terminal_id text,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_sale_id uuid;
  v_inserted_item_count integer;
  v_expected_item_count integer;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Completed sale requires sale_items as a JSON array.';
  end if;

  v_expected_item_count := jsonb_array_length(p_items);

  if v_expected_item_count = 0 then
    raise exception 'Completed sale requires at least one sale_item.';
  end if;

  insert into public.sales (
    tenant_id,
    event_id,
    terminal_id,
    total_cents,
    payment_method,
    cash_received_cents,
    change_cents,
    helper_invitation_id,
    helper_name_snapshot,
    helper_station_snapshot,
    status,
    created_at
  )
  values (
    p_tenant_id,
    p_event_id,
    nullif(trim(p_terminal_id), ''),
    p_total_cents,
    p_payment_method,
    p_cash_received_cents,
    p_change_cents,
    p_helper_invitation_id,
    nullif(trim(p_helper_name_snapshot), ''),
    nullif(trim(p_helper_station_snapshot), ''),
    'completed',
    p_created_at
  )
  returning id into v_sale_id;

  insert into public.sale_items (
    tenant_id,
    sale_id,
    product_id,
    name_snapshot,
    group_key_snapshot,
    price_cents_snapshot,
    quantity,
    line_total_cents,
    created_at
  )
  select
    p_tenant_id,
    v_sale_id,
    nullif(item.product_id, '')::uuid,
    item.name_snapshot,
    item.group_key_snapshot,
    item.price_cents_snapshot,
    item.quantity,
    item.line_total_cents,
    p_created_at
  from jsonb_to_recordset(p_items) as item(
    product_id text,
    name_snapshot text,
    group_key_snapshot text,
    price_cents_snapshot integer,
    quantity integer,
    line_total_cents integer
  );

  get diagnostics v_inserted_item_count = row_count;

  if v_inserted_item_count <> v_expected_item_count then
    raise exception 'Completed sale item count mismatch. Expected %, inserted %.', v_expected_item_count, v_inserted_item_count;
  end if;

  return v_sale_id;
end;
$$;

grant execute on function public.save_completed_sale(
  uuid,
  uuid,
  integer,
  text,
  integer,
  integer,
  timestamptz,
  uuid,
  text,
  text,
  text,
  jsonb
) to anon, authenticated;

comment on column public.sales.terminal_id
  is 'Persistent local terminal/device identifier used to scope operational recent sales.';

comment on function public.save_completed_sale(uuid, uuid, integer, text, integer, integer, timestamptz, uuid, text, text, text, jsonb)
  is 'Atomically stores one completed sale, its terminal/device id, optional helper identity snapshots, and all sale_items. If any insert fails, no partial sale remains.';

notify pgrst, 'reload schema';
