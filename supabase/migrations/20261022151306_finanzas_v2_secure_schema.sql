-- Finanzas 2.0 - additive schema only.
-- This migration intentionally does not copy, delete, reclassify, or secure-cutover
-- public.transacciones. The legacy table remains untouched until an authenticated
-- owner has been created and a verified backup has been approved.

create schema if not exists finanzas_private;
revoke all on schema finanzas_private from public, anon, authenticated;

create or replace function finanzas_private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function finanzas_private.set_updated_at() from public, anon, authenticated;

create table if not exists public.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  institution text,
  account_type text not null check (account_type in ('cash', 'checking', 'savings', 'credit_card', 'loan', 'other')),
  currency text not null check (currency in ('PEN', 'USD')),
  status text not null default 'active' check (status in ('active', 'blocked', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, name)
);

create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.financial_accounts(id) on delete restrict,
  entity_key text not null,
  issuer text,
  product_name text not null,
  product_variant text,
  network text check (network in ('Visa', 'Mastercard', 'American Express', 'Otra', 'Por confirmar')),
  currency text not null check (currency in ('PEN', 'USD')),
  credit_limit_minor bigint check (credit_limit_minor is null or credit_limit_minor >= 0),
  annual_effective_rate numeric(12, 8) check (annual_effective_rate is null or annual_effective_rate >= 0),
  tcea numeric(12, 8) check (tcea is null or tcea >= 0),
  membership_fee_minor bigint check (membership_fee_minor is null or membership_fee_minor >= 0),
  debt_insurance_minor bigint check (debt_insurance_minor is null or debt_insurance_minor >= 0),
  other_fees_minor bigint check (other_fees_minor is null or other_fees_minor >= 0),
  rewards_notes text,
  status text not null default 'active' check (status in ('active', 'blocked', 'closed')),
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, entity_key)
);

create table if not exists public.card_billing_rules (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.credit_cards(id) on delete cascade,
  valid_from date not null,
  valid_to date,
  cutoff_day smallint not null check (cutoff_day between 1 and 31),
  due_day smallint not null check (due_day between 1 and 31),
  purchase_on_cutoff_starts_new_cycle boolean not null default true,
  weekend_policy text not null default 'bank_confirmed' check (weekend_policy in ('bank_confirmed', 'next_working_day', 'no_adjustment')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified', 'user_confirmed', 'statement_confirmed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_to >= valid_from),
  unique (card_id, valid_from)
);

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  occurred_on date not null,
  event_kind text not null check (event_kind in ('income', 'expense', 'transfer', 'card_purchase', 'card_payment', 'interest', 'fee', 'refund', 'adjustment')),
  status text not null default 'confirmed' check (status in ('confirmed', 'pending', 'projected', 'void')),
  currency text not null check (currency in ('PEN', 'USD')),
  economic_amount_minor bigint not null default 0,
  cash_amount_minor bigint not null default 0,
  liability_amount_minor bigint not null default 0,
  account_id uuid references public.financial_accounts(id) on delete restrict,
  card_id uuid references public.credit_cards(id) on delete restrict,
  description text not null,
  category text,
  legacy_transaction_id text,
  idempotency_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, idempotency_key),
  unique (owner_id, legacy_transaction_id)
);

create table if not exists public.card_statements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.credit_cards(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  cutoff_date date not null,
  due_date date not null,
  currency text not null check (currency in ('PEN', 'USD')),
  statement_balance_minor bigint not null check (statement_balance_minor >= 0),
  minimum_payment_minor bigint check (minimum_payment_minor is null or minimum_payment_minor >= 0),
  bank_confirmed boolean not null default false,
  reconciled_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start),
  unique (card_id, cutoff_date)
);

create table if not exists public.card_installment_plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.credit_cards(id) on delete restrict,
  purchase_entry_id uuid not null references public.ledger_entries(id) on delete restrict,
  installment_count smallint not null check (installment_count > 0),
  principal_minor bigint not null check (principal_minor > 0),
  interest_total_minor bigint not null default 0 check (interest_total_minor >= 0),
  fees_total_minor bigint not null default 0 check (fees_total_minor >= 0),
  rate_type text not null default 'none' check (rate_type in ('none', 'tea', 'tcea', 'monthly_effective', 'bank_schedule')),
  rate numeric(12, 8) check (rate is null or rate >= 0),
  is_estimate boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (purchase_entry_id)
);

create table if not exists public.card_installments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.card_installment_plans(id) on delete cascade,
  installment_number smallint not null check (installment_number > 0),
  due_date date not null,
  principal_minor bigint not null check (principal_minor >= 0),
  interest_minor bigint not null default 0 check (interest_minor >= 0),
  fees_minor bigint not null default 0 check (fees_minor >= 0),
  status text not null default 'pending' check (status in ('pending', 'billed', 'paid', 'prepaid', 'void')),
  statement_id uuid references public.card_statements(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, installment_number)
);

create table if not exists public.app_settings (
  owner_id uuid not null references auth.users(id) on delete cascade,
  setting_name text not null,
  payload jsonb not null,
  version bigint not null default 1 check (version > 0),
  updated_at timestamptz not null default now(),
  primary key (owner_id, setting_name)
);

create index if not exists ledger_entries_owner_date_idx on public.ledger_entries(owner_id, occurred_on desc);
create index if not exists ledger_entries_owner_card_date_idx on public.ledger_entries(owner_id, card_id, occurred_on desc);
create index if not exists card_statements_owner_due_idx on public.card_statements(owner_id, due_date);
create index if not exists card_installments_owner_due_idx on public.card_installments(owner_id, due_date, status);
create index if not exists card_billing_rules_card_validity_idx on public.card_billing_rules(card_id, valid_from desc, valid_to);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'financial_accounts', 'credit_cards', 'card_billing_rules', 'ledger_entries',
    'card_statements', 'card_installment_plans', 'card_installments', 'app_settings'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);
  end loop;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'financial_accounts', 'credit_cards', 'card_billing_rules', 'ledger_entries',
    'card_statements', 'card_installment_plans', 'card_installments', 'app_settings'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_select_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_delete_own', table_name);
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = owner_id)', table_name || '_select_own', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = owner_id)', table_name || '_insert_own', table_name);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id)', table_name || '_update_own', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = owner_id)', table_name || '_delete_own', table_name);
  end loop;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'financial_accounts', 'credit_cards', 'card_billing_rules', 'ledger_entries',
    'card_statements', 'card_installment_plans', 'card_installments', 'app_settings'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function finanzas_private.set_updated_at()', table_name);
  end loop;
end;
$$;

comment on table public.ledger_entries is
  'Signed impacts: economic_amount_minor recognizes income/expense; cash_amount_minor changes liquid cash; liability_amount_minor changes debt. A card payment normally has economic=0, cash<0, liability<0.';

-- Production cutover remains a separate, approval-gated migration:
-- 1. create/verify the owner in auth.users;
-- 2. take and validate a backup;
-- 3. map every legacy row to the owner and classify config/projection rows;
-- 4. test authenticated allow + anon deny for SELECT/INSERT/UPDATE/DELETE;
-- 5. only then remove the legacy public/anon ALL policy.
