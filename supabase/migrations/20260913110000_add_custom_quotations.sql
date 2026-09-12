begin;
create table if not exists public.custom_booking_quotations (
 custom_booking_id uuid primary key references public.custom_bookings(id) on delete cascade,
 content jsonb not null,
 updated_at timestamptz not null default now(),
 constraint quotation_content_object check(jsonb_typeof(content)='object')
);
alter table public.custom_booking_quotations enable row level security;
revoke all on public.custom_booking_quotations from public,anon,authenticated;
grant select,insert,update on public.custom_booking_quotations to service_role;
commit;
