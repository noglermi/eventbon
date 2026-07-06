alter table public.sales
  drop constraint if exists sales_payment_method_check;

update public.sales
set payment_method = 'card_manual'
where payment_method in ('card', 'manual_card');

alter table public.sales
  add constraint sales_payment_method_check
  check (payment_method in ('cash', 'card_manual'));

comment on column public.sales.payment_method is 'Canonical payment method: cash or card_manual.';

notify pgrst, 'reload schema';
