/*
 * Custom bookings and their Razorpay payment history.
 *
 * These records are managed only through authenticated admin APIs
 * using the Supabase service-role client.
 */

create sequence if not exists public.custom_booking_reference_seq;

create or replace function public.generate_custom_booking_reference()
returns text
language sql
set search_path = public, pg_temp
as $$
  select
    'CUSTOM-' ||
    to_char(
      timezone('Asia/Kolkata', now()),
      'YYYY'
    ) ||
    '-' ||
    lpad(
      nextval(
        'public.custom_booking_reference_seq'
      )::text,
      6,
      '0'
    );
$$;

create table if not exists public.custom_bookings (
  id uuid primary key
    default gen_random_uuid(),

  booking_reference text not null unique
    default public.generate_custom_booking_reference(),

  package_name text not null,
  customer_name text not null,
  phone text not null,
  email text not null,

  travel_start_date date,
  travel_end_date date,

  travelers integer not null
    default 1,

  total_amount numeric(12, 2) not null,
  advance_amount numeric(12, 2) not null,
  amount_paid numeric(12, 2) not null
    default 0,

  balance_amount numeric(12, 2)
    generated always as (
      total_amount - amount_paid
    ) stored,

  balance_due_date date,

  booking_status text not null
    default 'DRAFT',

  payment_status text not null
    default 'PENDING',

  razorpay_payment_link_id text unique,
  razorpay_payment_link_url text,
  payment_link_expires_at timestamptz,

  notes text,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  constraint custom_bookings_reference_format_check
    check (
      booking_reference ~
      '^CUSTOM-[0-9]{4}-[0-9]{6}$'
    ),

  constraint custom_bookings_package_name_check
    check (
      length(trim(package_name))
      between 2 and 200
    ),

  constraint custom_bookings_customer_name_check
    check (
      length(trim(customer_name))
      between 2 and 150
    ),

  constraint custom_bookings_phone_check
    check (
      length(trim(phone))
      between 7 and 32
    ),

  constraint custom_bookings_email_check
    check (
      length(trim(email))
      between 3 and 320
    ),

  constraint custom_bookings_travelers_check
    check (
      travelers between 1 and 200
    ),

  constraint custom_bookings_dates_check
    check (
      travel_start_date is null
      or travel_end_date is null
      or travel_end_date >= travel_start_date
    ),

  constraint custom_bookings_total_amount_check
    check (
      total_amount > 0
    ),

  constraint custom_bookings_advance_amount_check
    check (
      advance_amount > 0
      and advance_amount <= total_amount
    ),

  constraint custom_bookings_amount_paid_check
    check (
      amount_paid >= 0
      and amount_paid <= total_amount
    ),

  constraint custom_bookings_balance_due_date_check
    check (
      balance_due_date is null
      or travel_start_date is null
      or balance_due_date <= travel_start_date
    ),

  constraint custom_bookings_booking_status_check
    check (
      booking_status in (
        'DRAFT',
        'AWAITING_ADVANCE',
        'CONFIRMED',
        'CANCELLED',
        'COMPLETED',
        'MANUAL_REVIEW'
      )
    ),

  constraint custom_bookings_payment_status_check
    check (
      payment_status in (
        'PENDING',
        'LINK_CREATED',
        'ADVANCE_PAID',
        'PAID',
        'FAILED',
        'REFUNDED',
        'PARTIALLY_REFUNDED'
      )
    ),

  constraint custom_bookings_payment_link_check
    check (
      (
        razorpay_payment_link_id is null
        and razorpay_payment_link_url is null
      )
      or
      (
        razorpay_payment_link_id is not null
        and razorpay_payment_link_url is not null
      )
    )
);

create table if not exists public.custom_booking_payments (
  id bigint generated always as identity
    primary key,

  custom_booking_id uuid not null
    references public.custom_bookings(id),

  provider text not null
    default 'RAZORPAY',

  provider_payment_link_id text,
  provider_payment_id text not null unique,

  amount numeric(12, 2) not null,
  currency text not null
    default 'INR',

  status text not null
    default 'CAPTURED',

  provider_response jsonb,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  constraint custom_booking_payments_provider_check
    check (
      provider = 'RAZORPAY'
    ),

  constraint custom_booking_payments_amount_check
    check (
      amount > 0
    ),

  constraint custom_booking_payments_currency_check
    check (
      currency = 'INR'
    ),

  constraint custom_booking_payments_status_check
    check (
      status in (
        'CAPTURED',
        'REFUNDED',
        'PARTIALLY_REFUNDED'
      )
    )
);

create index if not exists
  custom_bookings_created_at_idx
on public.custom_bookings (
  created_at desc
);

create index if not exists
  custom_bookings_customer_phone_idx
on public.custom_bookings (
  phone
);

create index if not exists
  custom_bookings_payment_status_idx
on public.custom_bookings (
  payment_status
);

create index if not exists
  custom_bookings_travel_start_date_idx
on public.custom_bookings (
  travel_start_date
);

create index if not exists
  custom_booking_payments_booking_idx
on public.custom_booking_payments (
  custom_booking_id,
  created_at desc
);

drop trigger if exists
  set_custom_bookings_updated_at
on public.custom_bookings;

create trigger set_custom_bookings_updated_at
before update
on public.custom_bookings
for each row
execute function
  public.update_updated_at_column();

drop trigger if exists
  set_custom_booking_payments_updated_at
on public.custom_booking_payments;

create trigger set_custom_booking_payments_updated_at
before update
on public.custom_booking_payments
for each row
execute function
  public.update_updated_at_column();

alter table public.custom_bookings
  enable row level security;

alter table public.custom_booking_payments
  enable row level security;

revoke all
on table public.custom_bookings
from public, anon, authenticated;

revoke all
on table public.custom_booking_payments
from public, anon, authenticated;

revoke all
on sequence public.custom_booking_reference_seq
from public, anon, authenticated;

revoke all
on function public.generate_custom_booking_reference()
from public, anon, authenticated;

grant all
on table public.custom_bookings
to service_role;

grant all
on table public.custom_booking_payments
to service_role;

grant usage, select, update
on sequence public.custom_booking_reference_seq
to service_role;

grant execute
on function public.generate_custom_booking_reference()
to service_role;