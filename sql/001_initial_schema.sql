create extension if not exists pgcrypto;

create table organizers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text not null unique,
  name text not null,
  company text,
  phone text,
  created_at timestamptz not null default now()
);

create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references organizers(id) on delete cascade,
  -- Temporary compatibility layer until authentication, Stripe, and tenant handling are reintroduced.
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  access_until timestamptz not null,
  print_mode text not null default 'single_vouchers'
    check (print_mode in ('single_vouchers', 'combined_voucher')),
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  check (ends_at >= starts_at),
  check (access_until >= ends_at)
);

create table products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  event_id uuid not null,
  name text not null,
  price_cents integer not null check (price_cents >= 0),
  group_key text not null,
  color text not null,
  icon text not null,
  image_url text,
  image_crop_zoom numeric(5, 2) not null default 1 check (image_crop_zoom >= 1),
  image_crop_x numeric(5, 2) not null default 50 check (image_crop_x >= 0 and image_crop_x <= 100),
  image_crop_y numeric(5, 2) not null default 50 check (image_crop_y >= 0 and image_crop_y <= 100),
  allergen_codes text[] not null default '{}'
    check (allergen_codes <@ array['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'L', 'M', 'N', 'O', 'P', 'R']::text[]),
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, event_id) references events(tenant_id, id) on delete cascade,
  unique (tenant_id, id)
);

create table sales (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  event_id uuid not null,
  total_cents integer not null check (total_cents >= 0),
  payment_method text not null check (payment_method in ('cash', 'card_manual')),
  cash_received_cents integer check (cash_received_cents is null or cash_received_cents >= 0),
  change_cents integer check (change_cents is null or change_cents >= 0),
  print_count integer not null default 0 check (print_count >= 0),
  printed_at timestamptz,
  status text not null default 'completed',
  created_at timestamptz not null default now(),
  foreign key (tenant_id, event_id) references events(tenant_id, id) on delete restrict,
  unique (tenant_id, id)
);

create table sale_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  sale_id uuid not null,
  product_id uuid,
  name_snapshot text not null,
  group_key_snapshot text not null,
  price_cents_snapshot integer not null check (price_cents_snapshot >= 0),
  quantity integer not null check (quantity > 0),
  line_total_cents integer not null check (line_total_cents >= 0),
  created_at timestamptz not null default now(),
  foreign key (tenant_id, sale_id) references sales(tenant_id, id) on delete cascade,
  foreign key (tenant_id, product_id) references products(tenant_id, id) on delete set null
);

create table access_extensions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  event_id uuid not null,
  previous_access_until timestamptz not null,
  new_access_until timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, event_id) references events(tenant_id, id) on delete cascade,
  check (new_access_until > previous_access_until)
);

create index organizers_email_idx on organizers(email);
create index events_organizer_id_idx on events(organizer_id);
create index events_tenant_id_idx on events(tenant_id);
create index products_event_id_position_idx on products(event_id, position);
create index sales_event_id_created_at_idx on sales(event_id, created_at);
create index sale_items_sale_id_idx on sale_items(sale_id);
create index access_extensions_event_id_idx on access_extensions(event_id);
