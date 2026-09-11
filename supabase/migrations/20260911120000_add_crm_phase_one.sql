begin;

create table if not exists public.crm_customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  normalized_phone text,
  email text,
  normalized_email text,
  city text,
  date_of_birth date,
  notes text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_customers_name_check check (length(btrim(full_name)) between 2 and 150),
  constraint crm_customers_contact_check check (normalized_phone is not null or normalized_email is not null)
);

create unique index if not exists crm_customers_phone_unique
  on public.crm_customers (normalized_phone) where normalized_phone is not null;
create index if not exists crm_customers_email_idx
  on public.crm_customers (normalized_email) where normalized_email is not null;
create index if not exists crm_customers_last_seen_idx on public.crm_customers (last_seen_at desc);

create table if not exists public.crm_lead_imports (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  imported_rows integer not null default 0,
  skipped_rows integer not null default 0,
  error_rows integer not null default 0,
  imported_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.crm_customers(id) on delete restrict,
  interested_trip text,
  travel_month text,
  source text not null default 'Other',
  status text not null default 'NEW',
  priority text not null default 'MEDIUM',
  assigned_to text,
  next_follow_up_at timestamptz,
  last_contacted_at timestamptz,
  notes text,
  import_id uuid references public.crm_lead_imports(id) on delete set null,
  confirmed_booking_reference text,
  lost_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_leads_status_check check (status in ('NEW','CALLED','FOLLOW_UP','INTERESTED','QUOTATION_SENT','CONFIRMED','NOT_INTERESTED','CLOSED')),
  constraint crm_leads_priority_check check (priority in ('LOW','MEDIUM','HIGH'))
);

create index if not exists crm_leads_status_idx on public.crm_leads (status, updated_at desc);
create index if not exists crm_leads_follow_up_idx on public.crm_leads (next_follow_up_at) where next_follow_up_at is not null;
create index if not exists crm_leads_customer_idx on public.crm_leads (customer_id);

create table if not exists public.crm_lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.crm_leads(id) on delete cascade,
  activity_type text not null,
  from_status text,
  to_status text,
  note text,
  next_follow_up_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  constraint crm_lead_activity_type_check check (activity_type in ('CREATED','CALL','WHATSAPP','EMAIL','MEETING','NOTE','STATUS_CHANGE','FOLLOW_UP'))
);

create index if not exists crm_lead_activities_lead_idx on public.crm_lead_activities (lead_id, created_at desc);

alter table public.crm_customers enable row level security;
alter table public.crm_leads enable row level security;
alter table public.crm_lead_activities enable row level security;
alter table public.crm_lead_imports enable row level security;

revoke all on public.crm_customers, public.crm_leads, public.crm_lead_activities, public.crm_lead_imports from anon, authenticated;
grant all on public.crm_customers, public.crm_leads, public.crm_lead_activities, public.crm_lead_imports to service_role;

with history as (
  select customer_name as full_name, phone, email, created_at from public.bookings
  union all
  select customer_name, phone, email, created_at from public.custom_bookings
), grouped as (
  select
    nullif(regexp_replace(phone, '[^0-9]', '', 'g'), '') as normalized_phone,
    (array_agg(full_name order by created_at desc))[1] as full_name,
    (array_agg(phone order by created_at desc))[1] as phone,
    (array_agg(email order by created_at desc) filter (where nullif(btrim(email), '') is not null))[1] as email,
    min(created_at) as first_seen_at,
    max(created_at) as last_seen_at
  from history
  where nullif(regexp_replace(phone, '[^0-9]', '', 'g'), '') is not null
  group by nullif(regexp_replace(phone, '[^0-9]', '', 'g'), '')
)
insert into public.crm_customers (full_name, phone, normalized_phone, email, normalized_email, first_seen_at, last_seen_at)
select full_name, phone, normalized_phone, email, nullif(lower(btrim(email)), ''), first_seen_at, last_seen_at
from grouped
on conflict (normalized_phone) where normalized_phone is not null do update set
  full_name = excluded.full_name,
  email = coalesce(public.crm_customers.email, excluded.email),
  normalized_email = coalesce(public.crm_customers.normalized_email, excluded.normalized_email),
  first_seen_at = least(public.crm_customers.first_seen_at, excluded.first_seen_at),
  last_seen_at = greatest(public.crm_customers.last_seen_at, excluded.last_seen_at),
  updated_at = now();

create or replace function public.sync_booking_to_crm_customer()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_phone text := nullif(regexp_replace(new.phone, '[^0-9]', '', 'g'), '');
  v_email text := nullif(lower(btrim(new.email)), '');
begin
  if v_phone is null then return new; end if;
  insert into public.crm_customers (full_name, phone, normalized_phone, email, normalized_email, first_seen_at, last_seen_at)
  values (new.customer_name, new.phone, v_phone, new.email, v_email, coalesce(new.created_at, now()), coalesce(new.created_at, now()))
  on conflict (normalized_phone) where normalized_phone is not null do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    email = coalesce(excluded.email, public.crm_customers.email),
    normalized_email = coalesce(excluded.normalized_email, public.crm_customers.normalized_email),
    last_seen_at = greatest(public.crm_customers.last_seen_at, excluded.last_seen_at),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists bookings_sync_crm_customer on public.bookings;
create trigger bookings_sync_crm_customer after insert or update of customer_name, phone, email on public.bookings
for each row execute function public.sync_booking_to_crm_customer();
drop trigger if exists custom_bookings_sync_crm_customer on public.custom_bookings;
create trigger custom_bookings_sync_crm_customer after insert or update of customer_name, phone, email on public.custom_bookings
for each row execute function public.sync_booking_to_crm_customer();

revoke all on function public.sync_booking_to_crm_customer() from public, anon, authenticated;
grant execute on function public.sync_booking_to_crm_customer() to service_role;

commit;
