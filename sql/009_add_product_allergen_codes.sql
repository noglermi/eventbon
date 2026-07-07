alter table products
  add column if not exists allergen_codes text[] not null default '{}';

alter table products
  drop constraint if exists products_allergen_codes_check;

alter table products
  add constraint products_allergen_codes_check
  check (allergen_codes <@ array['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'L', 'M', 'N', 'O', 'P', 'R']::text[]);
