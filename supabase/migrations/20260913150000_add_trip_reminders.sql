begin;
create table if not exists public.trip_reminder_settings (
 id text primary key,
 customer_enabled boolean not null default false,
 vendor_enabled boolean not null default false,
 review_enabled boolean not null default false,
 details text not null default '',
 checklist text not null default '',
 tips text not null default '',
 updated_at timestamptz not null default now()
);
create table if not exists public.trip_reminder_deliveries (
 id text primary key,
 recipient text not null,
 subject text not null,
 status text not null check (status in ('PROCESSING','SENT','UNCERTAIN')),
 created_at timestamptz not null default now(),
 finished_at timestamptz
);
alter table public.trip_reminder_settings enable row level security;
alter table public.trip_reminder_deliveries enable row level security;
revoke all on public.trip_reminder_settings, public.trip_reminder_deliveries from public, anon, authenticated;
grant select, insert, update on public.trip_reminder_settings, public.trip_reminder_deliveries to service_role;
commit;
