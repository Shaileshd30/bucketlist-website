begin;

create table if not exists public.crm_vendors (
  id uuid primary key default gen_random_uuid(), name text not null, vendor_type text not null default 'DMC',
  contact_person text, phone text, email text, destination text, tax_id text, bank_notes text,
  active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint crm_vendors_name_check check (length(btrim(name)) between 2 and 180),
  constraint crm_vendors_type_check check (vendor_type in ('DMC','HOTEL','TRANSPORT','GUIDE','ACTIVITY','OTHER'))
);

create table if not exists public.crm_trip_accounts (
  id uuid primary key default gen_random_uuid(), account_type text not null, reference_id text,
  trip_name text not null, departure_date date, revenue_inr numeric(14,2) not null default 0,
  status text not null default 'OPEN', notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint crm_trip_accounts_type_check check (account_type in ('DEPARTURE','CUSTOM')),
  constraint crm_trip_accounts_revenue_check check (revenue_inr >= 0),
  constraint crm_trip_accounts_status_check check (status in ('OPEN','CLOSED'))
);

create table if not exists public.crm_vendor_contracts (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references public.crm_trip_accounts(id) on delete cascade,
  vendor_id uuid not null references public.crm_vendors(id) on delete restrict, description text not null,
  currency text not null default 'INR', contract_amount numeric(14,2) not null, planning_fx_rate numeric(14,6) not null default 1,
  due_date date, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint crm_vendor_contracts_currency_check check (currency ~ '^[A-Z]{3}$'),
  constraint crm_vendor_contracts_amount_check check (contract_amount > 0),
  constraint crm_vendor_contracts_fx_check check (planning_fx_rate > 0)
);

create table if not exists public.crm_vendor_payments (
  id uuid primary key default gen_random_uuid(), contract_id uuid not null references public.crm_vendor_contracts(id) on delete cascade,
  amount numeric(14,2) not null, fx_rate numeric(14,6) not null default 1,
  amount_inr numeric(14,2) generated always as (round(amount * fx_rate, 2)) stored,
  payment_date date not null, payment_method text, reference text, receipt_url text, notes text,
  created_at timestamptz not null default now(),
  constraint crm_vendor_payments_amount_check check (amount > 0), constraint crm_vendor_payments_fx_check check (fx_rate > 0)
);

create table if not exists public.crm_trip_expenses (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references public.crm_trip_accounts(id) on delete cascade,
  category text not null, description text not null, currency text not null default 'INR', amount numeric(14,2) not null,
  fx_rate numeric(14,6) not null default 1, amount_inr numeric(14,2) generated always as (round(amount * fx_rate, 2)) stored,
  expense_date date not null, vendor_id uuid references public.crm_vendors(id) on delete set null, receipt_url text, notes text,
  created_at timestamptz not null default now(),
  constraint crm_trip_expenses_category_check check (category in ('TRANSPORT','HOTEL','MEALS','GUIDE','PERMITS','ACTIVITY','MARKETING','MISCELLANEOUS')),
  constraint crm_trip_expenses_currency_check check (currency ~ '^[A-Z]{3}$'),
  constraint crm_trip_expenses_amount_check check (amount > 0), constraint crm_trip_expenses_fx_check check (fx_rate > 0)
);

create index if not exists crm_vendor_contracts_account_idx on public.crm_vendor_contracts(account_id);
create index if not exists crm_vendor_payments_contract_idx on public.crm_vendor_payments(contract_id, payment_date desc);
create index if not exists crm_trip_expenses_account_idx on public.crm_trip_expenses(account_id, expense_date desc);

alter table public.crm_vendors enable row level security;
alter table public.crm_trip_accounts enable row level security;
alter table public.crm_vendor_contracts enable row level security;
alter table public.crm_vendor_payments enable row level security;
alter table public.crm_trip_expenses enable row level security;
revoke all on public.crm_vendors, public.crm_trip_accounts, public.crm_vendor_contracts, public.crm_vendor_payments, public.crm_trip_expenses from anon, authenticated;
grant all on public.crm_vendors, public.crm_trip_accounts, public.crm_vendor_contracts, public.crm_vendor_payments, public.crm_trip_expenses to service_role;
create unique index if not exists crm_trip_accounts_reference_key on public.crm_trip_accounts(account_type,reference_id);
alter table public.crm_vendor_payments add column if not exists request_key uuid unique;
alter table public.crm_trip_expenses add column if not exists request_key uuid unique;
alter table public.crm_vendor_payments add column if not exists void_reason text;
alter table public.crm_trip_expenses add column if not exists void_reason text;
create table if not exists public.crm_finance_audit (
 id bigint generated always as identity primary key, entity text not null, record_id uuid not null,
 action text not null, before_value jsonb, after_value jsonb, created_at timestamptz not null default now()
);
alter table public.crm_finance_audit enable row level security;
revoke all on public.crm_finance_audit from public,anon,authenticated;
grant select on public.crm_finance_audit to service_role;
create or replace function public.crm_finance_audit_trigger() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 insert into crm_finance_audit(entity,record_id,action,before_value,after_value)
 values(TG_TABLE_NAME,new.id,TG_OP,case when TG_OP='UPDATE' then to_jsonb(old) else null end,to_jsonb(new));
 return new;
end; $$;
do $$ declare t text; begin
 foreach t in array array['crm_vendors','crm_trip_accounts','crm_vendor_contracts','crm_vendor_payments','crm_trip_expenses'] loop
 execute format('drop trigger if exists finance_audit on public.%I',t);
 execute format('create trigger finance_audit after insert or update on public.%I for each row execute function public.crm_finance_audit_trigger()',t);
 end loop;
end; $$;
create or replace function public.crm_record_vendor_payment(p_data jsonb) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare c crm_vendor_contracts; paid numeric; result_id uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_data->>'request_key',0));
 select id into result_id from crm_vendor_payments where request_key=(p_data->>'request_key')::uuid;
 if result_id is not null then return result_id; end if;
 select * into strict c from crm_vendor_contracts where id=(p_data->>'contract_id')::uuid for update;
 select coalesce(sum(amount),0) into paid from crm_vendor_payments where contract_id=c.id and void_reason is null;
 if paid+(p_data->>'amount')::numeric>c.contract_amount then raise exception 'Payment exceeds remaining balance'; end if;
 if c.currency='INR' and (p_data->>'fx_rate')::numeric<>1 then raise exception 'INR rate must be 1'; end if;
 insert into crm_vendor_payments(contract_id,amount,fx_rate,payment_date,payment_method,reference,notes,request_key)
 values(c.id,(p_data->>'amount')::numeric,(p_data->>'fx_rate')::numeric,(p_data->>'payment_date')::date,p_data->>'payment_method',p_data->>'reference',p_data->>'notes',(p_data->>'request_key')::uuid) returning id into result_id;
 return result_id;
end; $$;
revoke all on function public.crm_finance_audit_trigger(),public.crm_record_vendor_payment(jsonb) from public,anon,authenticated;
grant execute on function public.crm_record_vendor_payment(jsonb) to service_role;
revoke insert,update,delete on public.crm_vendor_payments from service_role;
grant update(receipt_url,void_reason) on public.crm_vendor_payments to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('crm-finance-receipts','crm-finance-receipts',false,5242880,array['application/pdf','image/jpeg','image/png'])
on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;
commit;
